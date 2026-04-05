#!/usr/bin/env node
// ============================================================
// v3 Orchestrator — full rejection cascade
// ============================================================
//
// Architecture:
//   Decomposer ──→ [validator] ──→ Atomics ──→ [validator] ──→ Recomposer
//                                                                  │
//   Decomposer ←── [validator] ←── Atomics ←── [validator] ←──────┘
//
// No AI component talks directly to any other AI component.
// Every message passes through the universal validator.
//
// Rejection cascade:
//   1. Recomposer can't build → validator retries atomic (original spec)
//   2. Atomic exhausted → validator escalates to decomposer
//   3. Decomposer adjusts spec → cycle restarts
//
// Usage: node pipeline/v3/run.js

const fs = require('fs');
const path = require('path');
const { callClaudeAsync } = require('../claude-worker');
const { validate, validateMap } = require('./validator');
const { decompose } = require('./decomposer');
const { recompose } = require('./recomposer');
const canvasCheck = require('../validators/canvas-check');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

const MAX_ATOMIC_RETRIES = 3;
const MAX_RECOMPOSE_CYCLES = 2;

// ── Atomic cell runner (through validator) ──────────────────

async function runAtomic(contract) {
  for (let attempt = 1; attempt <= MAX_ATOMIC_RETRIES; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: contract.prompt,
        systemPrompt: 'You are a code generator. Output only valid JSON with a "code" field containing a JavaScript function body. No TypeScript. No function declaration. Just the body.',
        schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
        model: 'haiku', budgetUsd: 0.05,
      });

      // VALIDATOR GATE — universal, mechanical
      const result = validate(r.data.code, contract);

      if (result.valid) {
        return {
          fn_id: contract.fn_id,
          argNames: contract.argNames,
          code: r.data.code,
          cost: r.cost,
          attempts: attempt,
          result: 'SUCCESS',
        };
      }

      console.log(`    ${contract.fn_id}: ${result.result} (${attempt}/${MAX_ATOMIC_RETRIES}) — ${result.reason}`);
    } catch (e) {
      console.log(`    ${contract.fn_id}: ERROR (${attempt}/${MAX_ATOMIC_RETRIES})`);
    }
  }

  return {
    fn_id: contract.fn_id,
    argNames: contract.argNames,
    code: null,
    cost: 0,
    attempts: MAX_ATOMIC_RETRIES,
    result: 'EXHAUSTED',
  };
}

// ── Shape cell runner ───────────────────────────────────────

async function runShape(spec) {
  const palDef = `base="${spec.colors.base}", light="${spec.colors.light}", dark="${spec.colors.dark}", accent="${spec.colors.accent}"`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `Draw a ${spec.w}x${spec.h} ${spec.desc} on a PixelCanvas.\nColors: ${palDef}\nAPI: pc.fillCircle(cx,cy,r,idx), pc.fillRect(x,y,w,h,idx), pc.fillEllipse(cx,cy,rx,ry,idx), pc.setPixel(x,y,idx)\nColor index: pal.groups.base.startIdx + (0=dark,1=mid,2=light,3=brightest)\nCanvas: ${spec.w}x${spec.h}, origin top-left. Fill at least 30% of canvas. Use 2+ color groups.\nOutput drawBody: drawing code as a string.`,
        systemPrompt: 'You are a pixel renderer. Draw the described shape. Output only JSON.',
        schema: { type: 'object', properties: { drawBody: { type: 'string' } }, required: ['drawBody'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const render = canvasCheck.validateSprite(r.data.drawBody, '', spec.w, spec.h, spec.colors);
      if (render.valid) {
        return { shape_id: spec.shape_id, drawBody: r.data.drawBody, w: spec.w, h: spec.h, colors: spec.colors, cost: r.cost };
      }
    } catch (e) {}
  }
  throw new Error(`Shape ${spec.shape_id} failed`);
}

function buildSpriteCode(shape) {
  const palDef = Object.entries(shape.colors).map(([k,v]) => `'${k}':'${v}'`).join(',');
  const varName = 'sprite_' + shape.shape_id.replace(/-/g, '_');
  return {
    varName,
    shapeId: shape.shape_id,
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

// ── Main orchestrator ───────────────────────────────────────

async function main() {
  const start = Date.now();
  let totalCost = 0;

  console.log('═'.repeat(60));
  console.log('PIPELINE v3 — universal validator, rejection cascade');
  console.log('═'.repeat(60));

  // ── STEP 1: Decompose ──
  console.log('\n[DECOMPOSER] — sees the goal, produces opaque contracts + map');
  const { contracts, shapes, map } = decompose('Pong');
  console.log(`  ${contracts.length} contracts, ${shapes.length} shapes, ${map.objects.length} objects`);
  console.log(`  Functions: ${contracts.map(c => c.fn_id).join(', ')}`);
  console.log(`  Objects: ${map.objects.map(o => o.id).join(', ')}`);

  // ── STEP 2: Run atomics (through validator) ──
  console.log('\n[ATOMICS] — blind cells, validated by test vectors');
  let atomicResults = await Promise.all(contracts.map(c => runAtomic(c)));
  totalCost += atomicResults.reduce((s, r) => s + r.cost, 0);

  // Check for exhausted atomics
  const exhausted = atomicResults.filter(r => r.result === 'EXHAUSTED');
  if (exhausted.length > 0) {
    console.log(`\n  ESCALATION: ${exhausted.map(r => r.fn_id).join(', ')} exhausted`);
    console.log('  In production: would cascade back to decomposer');
    console.log('  For now: aborting');
    process.exit(1);
  }

  const succeeded = atomicResults.filter(r => r.result === 'SUCCESS');
  console.log(`  ${succeeded.length}/${contracts.length} atomics passed`);

  // ── STEP 3: Run shapes ──
  console.log('\n[SHAPES] — visual cells');
  const shapeResults = await Promise.all(shapes.map(s => runShape(s)));
  totalCost += shapeResults.reduce((s, r) => s + r.cost, 0);
  console.log(`  ${shapeResults.length} shapes rendered`);

  // Build sprite code
  const spriteBuilds = shapeResults.map(s => buildSpriteCode(s));

  // ── STEP 4: Validate map against available functions ──
  console.log('\n[MAP VALIDATION] — structural coherence check');
  const mapCheck = validateMap(map, contracts.map(c => c.fn_id));
  if (!mapCheck.valid) {
    console.log(`  MAP ERRORS: ${mapCheck.errors.join('; ')}`);
    console.log('  Would escalate to decomposer');
    process.exit(1);
  }
  console.log('  Map structurally valid');

  // ── STEP 5: Recompose (through validator) ──
  console.log('\n[RECOMPOSER] — intelligent assembler, does NOT know the goal');

  const engineCode = fs.readFileSync(ENGINE, 'utf8');
  let finalHtml = null;

  for (let cycle = 1; cycle <= MAX_RECOMPOSE_CYCLES; cycle++) {
    console.log(`  Cycle ${cycle}/${MAX_RECOMPOSE_CYCLES}:`);

    const result = await recompose({
      map,
      functions: succeeded.map(r => ({ fn_id: r.fn_id, argNames: r.argNames, code: r.code })),
      sprites: spriteBuilds,
      engineCode,
    });
    totalCost += result.cost;

    if (result.success) {
      // Inject engine code if not already present
      let html = result.html;
      if (!html.includes('PixelCanvas')) {
        html = html.replace('<script>', `<script>\n${engineCode}\n`);
      }
      // Inject sprite build code if not already present
      for (const sb of spriteBuilds) {
        if (!html.includes(sb.varName)) {
          html = html.replace(engineCode, engineCode + '\n' + sb.code);
        }
      }
      finalHtml = html;
      console.log(`    Built successfully (${(html.length / 1024).toFixed(1)}KB)`);
      break;
    }

    // REJECTION — through validator, not directly to atomics
    const rej = result.rejection;
    console.log(`    Rejected: ${rej.fn_id} — ${rej.reason}`);

    if (rej.fn_id && rej.fn_id !== 'recomposer') {
      // Validator retries the specific atomic with ORIGINAL spec
      // No information from recomposer reaches the atomic
      const contract = contracts.find(c => c.fn_id === rej.fn_id);
      if (contract) {
        console.log(`    Retrying ${rej.fn_id} (validator-mediated, original spec)`);
        const retry = await runAtomic(contract);
        totalCost += retry.cost;
        if (retry.result === 'SUCCESS') {
          // Replace in results
          const idx = atomicResults.findIndex(r => r.fn_id === rej.fn_id);
          atomicResults[idx] = retry;
          continue; // Try recompose again
        }
      }
    }

    console.log('    Cannot resolve — would escalate to decomposer');
  }

  if (!finalHtml) {
    console.log('\nFAILED — recomposer could not build from provided pieces');
    process.exit(1);
  }

  // ── STEP 6: Output ──
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), finalHtml);

  // ── BLINDNESS CHECK ──
  console.log('\n[BLINDNESS CHECK]');
  const gameWords = ['game', 'pong', 'paddle', 'ball', 'player', 'enemy'];
  let leaks = 0;
  for (const r of atomicResults) {
    if (!r.code) continue;
    for (const word of gameWords) {
      if (r.code.toLowerCase().includes(word)) {
        console.log(`  LEAK in ${r.fn_id}: "${word}"`);
        leaks++;
      }
    }
  }
  if (leaks === 0) console.log('  Zero domain vocabulary in any atomic output');

  // ── REPORT ──
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n' + '═'.repeat(60));
  console.log('v3 COMPLETE');
  console.log(`  Atomics: ${succeeded.length}/${contracts.length} passed`);
  console.log(`  Shapes: ${shapeResults.length}`);
  console.log(`  Recomposer: built`);
  console.log(`  Leaks: ${leaks}`);
  console.log(`  Time: ${elapsed}s | Cost: $${totalCost.toFixed(4)}`);
  console.log(`  Output: ${outDir}/index.html`);
  console.log('═'.repeat(60));
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
