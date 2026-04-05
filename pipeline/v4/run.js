#!/usr/bin/env node
// ============================================================
// v4 Orchestrator — fully autonomous, closed loops
// ============================================================
//
// Three loops, all driven by failure feedback:
//
//   GUIDE LOOP:    atomics → guide → split → re-run (cached)
//   RECOMPOSE LOOP: recomposer rejects → retry atomic → re-compose
//   DECOMPOSE LOOP: atomics exhausted → decomposer re-decomposes
//
// No special validation. No hand-holding. The decomposer learns
// through failure. If its contracts produce atoms that can't
// pass test vectors, it hears about it and tries again.
//
// Token efficiency:
//   - SAFE atoms cached across cycles
//   - Shapes run once
//   - Only delta re-runs on each cycle
//
// Usage: node pipeline/v4/run.js

const fs = require('fs');
const path = require('path');
const { callClaudeAsync } = require('../claude-worker');
const { validate, validateMap, handleGuide } = require('./validator');
const { decompose, splitAtom } = require('./decomposer');
const { recompose } = require('./recomposer');
const { assess } = require('./guide');
const canvasCheck = require('../validators/canvas-check');
const memory = require('./memory');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

const MAX_ATOMIC_RETRIES = 3;
const MAX_SPLIT_CYCLES = 3;
const MAX_COMPOSE_CYCLES = 2;
const MAX_DECOMPOSE_CYCLES = 3;

// ── Atomic cell runner ──────────────────────────────────────

async function runAtomic(contract) {
  // Direct cache hit — skip AI entirely
  const cached = memory.findCachedAtom(contract.prompt, contract.argNames);
  if (cached) {
    const check = validate(cached, contract);
    if (check.valid) {
      return { fn_id: contract.fn_id, argNames: contract.argNames, code: cached, prompt: contract.prompt, cost: 0, attempts: 0, result: 'CACHED' };
    }
  }

  const atomExamples = memory.getAtomExamples(2);
  const failedResults = []; // Track what code actually returns vs expected
  for (let attempt = 1; attempt <= MAX_ATOMIC_RETRIES; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: contract.prompt,
        systemPrompt: 'You are a code generator. Output only valid JSON with a "code" field containing a JavaScript function body. No TypeScript. No function declaration. Just the body.' + atomExamples,
        schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const result = validate(r.data.code, contract);
      if (result.valid) {
        return { fn_id: contract.fn_id, argNames: contract.argNames, code: r.data.code, prompt: contract.prompt, cost: r.cost, attempts: attempt, result: 'SUCCESS' };
      }
      failedResults.push({ code: r.data.code, reason: result.reason });
      console.log(`    ${contract.fn_id}: ${result.result} (${attempt}/${MAX_ATOMIC_RETRIES}) — ${result.reason}`);
    } catch (e) {
      console.log(`    ${contract.fn_id}: ERROR (${attempt}/${MAX_ATOMIC_RETRIES})`);
    }
  }
  // Check for consensus — if all attempts produce the same result,
  // the test vector is likely wrong, not the code
  const reasons = failedResults.map(r => r.reason);
  const consensus = reasons.length >= 2 && reasons.every(r => r === reasons[0]);
  return {
    fn_id: contract.fn_id, argNames: contract.argNames,
    code: failedResults.length > 0 ? failedResults[0].code : null,
    prompt: contract.prompt, cost: 0, attempts: MAX_ATOMIC_RETRIES,
    result: 'EXHAUSTED',
    consensusReason: consensus ? reasons[0] : null,
  };
}

// ── Shape cell runner ───────────────────────────────────────

async function runShape(spec) {
  // Guard against absurd sizes that cause OOM
  const w = Math.min(Math.max(spec.w || 16, 4), 64);
  const h = Math.min(Math.max(spec.h || 16, 4), 64);
  spec = { ...spec, w, h };
  const palDef = `base="${spec.colors.base}", light="${spec.colors.light}", dark="${spec.colors.dark}", accent="${spec.colors.accent}"`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `Draw a ${spec.w}x${spec.h} ${spec.desc} on a PixelCanvas.\nColors: ${palDef}\nAPI: pc.fillCircle(cx,cy,r,idx), pc.fillRect(x,y,w,h,idx), pc.fillEllipse(cx,cy,rx,ry,idx), pc.setPixel(x,y,idx)\nColor index: pal.groups.base.startIdx + (0=dark,1=mid,2=light,3=brightest)\nCanvas: ${spec.w}x${spec.h}, origin top-left. Fill at least 30%. Use 2+ color groups.\nOutput drawBody: drawing code as a string.`,
        systemPrompt: 'You are a pixel renderer. Draw the described shape. Output only JSON.',
        schema: { type: 'object', properties: { drawBody: { type: 'string' } }, required: ['drawBody'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const render = canvasCheck.validateSprite(r.data.drawBody, '', spec.w, spec.h, spec.colors);
      if (render.valid) return { shape_id: spec.shape_id, drawBody: r.data.drawBody, w: spec.w, h: spec.h, colors: spec.colors, cost: r.cost };
    } catch (e) {}
  }
  throw new Error(`Shape ${spec.shape_id} failed`);
}

function buildSpriteCode(shape) {
  const palDef = Object.entries(shape.colors).map(([k,v]) => `'${k}':'${v}'`).join(',');
  const varName = 'sprite_' + shape.shape_id.replace(/-/g, '_');
  return {
    varName, shapeId: shape.shape_id,
    code: `var ${varName} = (function() {
  var pal = ColorRamp.buildPalette({${palDef}});
  pal.palette[255] = sf2_packRGBA(20, 15, 10, 255);
  var pc = new PixelCanvas(${shape.w}, ${shape.h});
  (function(pc, pal) { ${shape.drawBody} })(pc, pal);
  try { PostProcess.applyShading(pc, pal, { lightAngle: Math.PI * 0.75 }); } catch(e) {}
  var cvs = document.createElement('canvas');
  cvs.width = ${shape.w}; cvs.height = ${shape.h};
  var c = cvs.getContext('2d');
  var img = c.createImageData(${shape.w}, ${shape.h});
  for (var y = 0; y < ${shape.h}; y++) for (var x = 0; x < ${shape.w}; x++) {
    var idx = pc.pixels[y*${shape.w}+x], rgba = pal.palette[idx]||0, pi = (y*${shape.w}+x)*4;
    img.data[pi]=rgba&0xFF; img.data[pi+1]=(rgba>>8)&0xFF; img.data[pi+2]=(rgba>>16)&0xFF; img.data[pi+3]=(rgba>>24)&0xFF;
  }
  c.putImageData(img, 0, 0);
  return cvs;
})();`,
  };
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  const start = Date.now();
  let totalCost = 0;

  console.log('═'.repeat(60));
  const REQUEST = process.argv[2] || 'Pong';
  console.log(`PIPELINE v4 — fully autonomous`);
  console.log(`REQUEST: "${REQUEST}"`);
  console.log('═'.repeat(60));

  let finalHtml = null;
  let failureReasons = []; // Structural failures passed back to decomposer

  // ══ DECOMPOSE LOOP — decomposer learns from failure ══
  for (let dCycle = 1; dCycle <= MAX_DECOMPOSE_CYCLES; dCycle++) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`DECOMPOSE CYCLE ${dCycle}/${MAX_DECOMPOSE_CYCLES}${failureReasons.length > 0 ? ' (learning from ' + failureReasons.length + ' failures)' : ''}`);
    console.log('─'.repeat(60));

    // ── DECOMPOSER ──
    console.log('\n[DECOMPOSER]');
    const decomposition = await decompose(REQUEST, failureReasons);
    let contracts = decomposition.contracts;
    let shapes = decomposition.shapes;
    let map = decomposition.map;
    totalCost += decomposition.cost || 0;
    console.log(`  ${contracts.length} contracts, ${shapes.length} shapes, ${(map.objects||[]).length} objects`);

    // ══ GUIDE LOOP — split until all atoms are safe enough ══
    const safeCache = {};
    let splitCount = 0;
    let hasExhausted = false;

    for (let gCycle = 0; gCycle < MAX_SPLIT_CYCLES; gCycle++) {
      const toRun = contracts.filter(c => !safeCache[c.fn_id]);
      if (toRun.length === 0) break;

      console.log(`\n  [GUIDE CYCLE ${gCycle + 1}] ${toRun.length} atoms to run, ${Object.keys(safeCache).length} cached`);

      // Run atomics
      const results = await Promise.all(toRun.map(c => runAtomic(c)));
      totalCost += results.reduce((s, r) => s + r.cost, 0);

      const cached = results.filter(r => r.result === 'CACHED');
      const succeeded = results.filter(r => r.result === 'SUCCESS' || r.result === 'CACHED');
      const exhausted = results.filter(r => r.result === 'EXHAUSTED');
      console.log(`    ${succeeded.length}/${toRun.length} passed (${cached.length} cached), ${exhausted.length} exhausted`);

      if (exhausted.length > 0) {
        console.log(`    Exhausted: ${exhausted.map(r => r.fn_id).join(', ')} — will cascade to decomposer`);
        failureReasons = exhausted.map(r => {
          let reason = 'cell could not produce valid output';
          if (r.consensusReason) {
            // All attempts produced the same "wrong" answer — likely bad test vector
            reason = `LIKELY BAD TEST VECTOR: all ${MAX_ATOMIC_RETRIES} attempts returned the same result. ${r.consensusReason}. The code is probably correct but the expected value in the test vector is wrong. Fix the test vectors.`;
          } else if (r.code) {
            const contract = contracts.find(c => c.fn_id === r.fn_id);
            if (contract) {
              const check = validate(r.code, contract);
              reason = check.reason || reason;
            }
          }
          memory.storeFailure(r.fn_id, reason);
          return { fn_id: r.fn_id, reason };
        });
        hasExhausted = true;
        break;
      }

      // Guide assesses atoms — skip trivial ones (short code = no inference risk)
      console.log('    [GUIDE]');
      const TRIVIAL_THRESHOLD = 80;
      const trivial = succeeded.filter(r => r.code.length <= TRIVIAL_THRESHOLD || r.result === 'CACHED');
      const complex = succeeded.filter(r => r.code.length > TRIVIAL_THRESHOLD && r.result !== 'CACHED');

      // Auto-SAFE trivial atoms
      for (const r of trivial) {
        console.log(`      ${r.fn_id}: SAFE (trivial)`);
        safeCache[r.fn_id] = r;
        const contract = contracts.find(c => c.fn_id === r.fn_id);
        if (contract) memory.storeAtom(contract, r.code);
      }

      // Guide only assesses complex atoms
      let risks = [];
      if (complex.length > 0) {
        const assessments = await Promise.all(
          complex.map(r => assess({ fn_id: r.fn_id, prompt: r.prompt, output: r.code }))
        );
        totalCost += assessments.reduce((s, a) => s + a.cost, 0);

        for (const a of assessments) {
          const decision = handleGuide(a);
          const atom = complex.find(r => r.fn_id === a.fn_id);
          if (decision.action === 'PROCEED') {
            console.log(`      ${a.fn_id}: SAFE`);
            safeCache[a.fn_id] = atom;
            const contract = contracts.find(c => c.fn_id === a.fn_id);
            if (contract && atom) memory.storeAtom(contract, atom.code);
          } else if (decision.action === 'FLAG') {
            console.log(`      ${a.fn_id}: RISK`);
            safeCache[a.fn_id] = atom;
            risks.push(a.fn_id);
          } else {
            console.log(`      ${a.fn_id}: BREACH`);
          }
        }
      }

      if (risks.length === 0) break;

      // Split flagged atoms
      console.log(`    [SPLIT] ${risks.length} flagged`);
      let didSplit = false;
      for (const fn_id of risks) {
        const result = await splitAtom(fn_id, contracts, map);
        if (result) {
          const newIds = result.contracts.filter(c => !contracts.find(o => o.fn_id === c.fn_id)).map(c => c.fn_id);
          console.log(`      ${fn_id} → ${newIds.join(', ')}`);
          contracts = result.contracts;
          map = result.map;
          totalCost += result.cost || 0;
          delete safeCache[fn_id];
          didSplit = true;
          splitCount++;
        } else {
          console.log(`      ${fn_id} → atomic minimum`);
        }
      }
      if (!didSplit) break;
    }

    // If atomics exhausted, decomposer tries again
    if (hasExhausted) {
      console.log('\n  Atomics exhausted — decomposer will re-decompose');
      continue;
    }

    const allAtoms = Object.values(safeCache);
    if (allAtoms.length === 0) {
      console.log('\n  No successful atoms — decomposer will re-decompose');
      continue;
    }

    // ── SHAPES (skip if none needed) ──
    let spriteBuilds = [];
    if (shapes.length > 0) {
      console.log('\n  [SHAPES]');
      const shapeResults = [];
      for (const s of shapes) {
        try {
          const sr = await runShape(s);
          shapeResults.push(sr);
        } catch (e) {
          console.log(`    Shape ${s.shape_id} failed: ${e.message.slice(0, 60)} — skipping`);
        }
      }
      totalCost += shapeResults.reduce((sum, r) => sum + r.cost, 0);
      console.log(`    ${shapeResults.length}/${shapes.length} rendered`);
      spriteBuilds = shapeResults.map(s => buildSpriteCode(s));
    } else {
      console.log('\n  [SHAPES] none needed');
    }

    // ── MAP VALIDATION ──
    const mapCheck = validateMap(map, contracts.map(c => c.fn_id));
    if (!mapCheck.valid) {
      console.log(`  Map invalid: ${mapCheck.errors.join('; ')} — decomposer will re-decompose`);
      continue;
    }

    // ══ RECOMPOSE (deterministic — no AI, no retry needed) ══
    console.log('\n  [RECOMPOSER]');
    const engineCode = fs.readFileSync(ENGINE, 'utf8');

    const result = recompose({
      map,
      functions: allAtoms.map(r => ({ fn_id: r.fn_id, argNames: r.argNames, code: r.code })),
      sprites: spriteBuilds,
      engineCode,
    });

    if (result.success) {
      finalHtml = result.html;
      console.log(`    Built (${(result.html.length / 1024).toFixed(1)}KB)`);
      memory.storeDecomposition(REQUEST, contracts, map);
    } else {
      console.log(`    Rejected: ${result.rejection.reason.slice(0, 120)}`);
      failureReasons.push({ fn_id: 'recomposer', reason: result.rejection.reason });
    }

    if (finalHtml) break;
    console.log('  Recomposer failed — decomposer will re-decompose');
  }

  if (!finalHtml) {
    console.log('\nFAILED after all decompose cycles');
    process.exit(1);
  }

  // ── OUTPUT ──
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), finalHtml);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n' + '═'.repeat(60));
  console.log('v4 COMPLETE');
  console.log(`  Time: ${elapsed}s | Cost: $${totalCost.toFixed(4)}`);
  console.log(`  Output: ${outDir}/index.html`);
  console.log('═'.repeat(60));
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
