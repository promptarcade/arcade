#!/usr/bin/env node
// ============================================================
// Self-Learning Test — binary selection across multiple runs
// ============================================================
// Runs the blind pipeline N times. Each run:
//   - Injects few-shot examples from memory bank into cell prompts
//   - Stores successful outputs back into memory
//   - Tracks retries, cost, time per run
//
// Run 1 starts with empty memory (baseline).
// Subsequent runs accumulate examples — natural selection.
//
// Usage: node pipeline/v2/test-learning.js [runs=5]

const fs = require('fs');
const path = require('path');
const { callClaudeAsync } = require('../claude-worker');
const jsSyntax = require('../validators/js-syntax');
const canvasCheck = require('../validators/canvas-check');
const memory = require('./memory');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

const NUM_RUNS = parseInt(process.argv[2]) || 5;
const RUN_ID_BASE = Date.now().toString(36);

// ── Memory-aware cell factories ─────────────────────────────

async function makeColor(theme, runId) {
  const fewShot = memory.formatFewShot('palette', 2);
  const systemPrompt = 'You are a color generator. Output only JSON with hex color values.' + fewShot;

  let retries = 0;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `Generate a 4-color palette for: "${theme}". Output base, light, dark, accent as hex.`,
        systemPrompt,
        schema: { type: 'object', properties: { base: {type:'string'}, light: {type:'string'}, dark: {type:'string'}, accent: {type:'string'} }, required: ['base','light','dark','accent'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      if (Object.values(r.data).every(c => /^#[0-9A-Fa-f]{6}$/.test(c))) {
        // Survived — store in memory
        memory.store('palette', {
          promptKey: theme,
          prompt: `Generate a 4-color palette for: "${theme}"`,
          output: r.data,
          runId,
        });
        return { colors: r.data, cost: r.cost, retries };
      }
    } catch (e) {}
    retries++;
  }
  throw new Error('Color failed');
}

async function makeShape(desc, w, h, colors, label, runId) {
  const fewShot = memory.formatFewShot('shape', 2);
  const palDef = `base="${colors.base}", light="${colors.light}", dark="${colors.dark}", accent="${colors.accent}"`;
  const systemPrompt = 'You are a pixel renderer. Draw the described shape. Output only JSON.' + fewShot;

  let retries = 0;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const prompt = `Draw a ${w}x${h} ${desc} on a PixelCanvas.
Colors: ${palDef}
API: pc.fillCircle(cx, cy, r, idx), pc.fillRect(x,y,w,h,idx), pc.fillEllipse(cx,cy,rx,ry,idx), pc.setPixel(x,y,idx)
Color index: pal.groups.base.startIdx + (0=dark,1=mid,2=light,3=brightest)
Canvas: ${w}x${h}, origin top-left. Fill at least 30% of the canvas. Use at least 2 color groups.
Output drawBody: the drawing code as a string.`;

      const r = await callClaudeAsync({
        prompt,
        systemPrompt,
        schema: { type: 'object', properties: { drawBody: { type: 'string' } }, required: ['drawBody'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const render = canvasCheck.validateSprite(r.data.drawBody, '', w, h, colors);
      if (render.valid) {
        memory.store('shape', {
          promptKey: `${w}x${h} ${desc}`,
          prompt,
          output: r.data.drawBody,
          runId,
        });
        return { drawBody: r.data.drawBody, cost: r.cost, retries };
      }
    } catch (e) {}
    retries++;
  }
  throw new Error(`${label} failed`);
}

async function makeBehavior(prompt, label, runId, contractChecks) {
  const fewShot = memory.formatFewShot('behavior', 2);
  const systemPrompt = 'You are a code generator. Output only valid JSON with plain JavaScript code. No TypeScript type annotations.' + fewShot;

  let retries = 0;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt,
        systemPrompt,
        schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const code = r.data.code;
      const syntax = jsSyntax.validate(code, { wrapInFunction: true });
      if (!syntax.valid) { retries++; continue; }
      if (contractChecks) {
        const failed = contractChecks.filter(c => !code.includes(c));
        if (failed.length > 0) { retries++; continue; }
      }
      // Extract a short key from first line of prompt
      const promptKey = prompt.split('\n')[0].slice(0, 80);
      memory.store('behavior', {
        promptKey,
        prompt,
        output: code,
        runId,
      });
      return { code, cost: r.cost, retries };
    } catch (e) {
      retries++;
    }
  }
  throw new Error(`${label} failed`);
}

// ── Single pipeline run (12-cell Pong) ──────────────────────

async function singleRun(runIndex) {
  const runId = `${RUN_ID_BASE}-${runIndex}`;
  const start = Date.now();
  let cost = 0;
  let totalRetries = 0;

  const stats = memory.getStats();
  const memSize = stats.palette.count + stats.shape.count + stats.behavior.count;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RUN ${runIndex + 1}/${NUM_RUNS} — memory bank: ${memSize} examples`);
  console.log('='.repeat(60));

  // COLORS (parallel)
  const [cA, cB, cC] = await Promise.all([
    makeColor('cool electric blue', runId),
    makeColor('warm crimson red', runId),
    makeColor('bright white glow', runId),
  ]);
  cost += cA.cost + cB.cost + cC.cost;
  totalRetries += cA.retries + cB.retries + cC.retries;
  console.log(`  Colors: 3 OK (retries: ${cA.retries + cB.retries + cC.retries})`);

  // SHAPES (parallel)
  const [sA, sB, sC] = await Promise.all([
    makeShape('filled vertical rectangle, filling most of the canvas', 12, 48, cA.colors, 'Rect A', runId),
    makeShape('filled vertical rectangle, filling most of the canvas', 12, 48, cB.colors, 'Rect B', runId),
    makeShape('filled circle, centered, radius filling most of the canvas', 16, 16, cC.colors, 'Circle C', runId),
  ]);
  cost += sA.cost + sB.cost + sC.cost;
  totalRetries += sA.retries + sB.retries + sC.retries;
  console.log(`  Shapes: 3 OK (retries: ${sA.retries + sB.retries + sC.retries})`);

  // BEHAVIORS (parallel)
  const [inputVel, aiTrack, autoMove, collision, edgeScore, integrator] = await Promise.all([
    makeBehavior(`Write a JavaScript function body that sets an object's vertical velocity based on input state.

Arguments available: obj, S, inputState
- obj has properties: vy (number)
- S: scale factor
- inputState has property keys: object mapping key names to true/false

Rules:
- Set obj.vy to 0 first
- If inputState.keys.ArrowUp is true: obj.vy = -250 * S
- If inputState.keys.ArrowDown is true: obj.vy = 250 * S

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'InputVelocity', runId, ['inputState.keys']),

    makeBehavior(`Write a JavaScript function body that moves an object's vertical position toward a target y-coordinate at a fixed speed.

Arguments available: obj, targetY, S, dt
- obj has properties: vy (number), y (number)
- targetY: number (the y position to move toward)
- S: scale factor
- dt: seconds elapsed

Rules:
- If obj.y < targetY - 5: set obj.vy = 200 * S
- Else if obj.y > targetY + 5: set obj.vy = -200 * S
- Else: set obj.vy = 0

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'AITrack', runId),

    makeBehavior(`Write a JavaScript function body that bounces an object off horizontal boundaries.

Arguments available: obj, H, S
- obj has properties: y (number), vy (number), h (number)
- H: canvas height
- S: scale factor

Rules:
- var halfH = obj.h * S / 2
- If obj.y - halfH < 0: set obj.y = halfH, set obj.vy = Math.abs(obj.vy)
- If obj.y + halfH > H: set obj.y = H - halfH, set obj.vy = -Math.abs(obj.vy)

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'Bounce', runId),

    makeBehavior(`Write a JavaScript function body that detects overlap between two rectangular areas and reverses the first object's horizontal velocity, pushing it out of the overlap.

Arguments available: a, b, S
- a has properties: x, y (center), w, h (dimensions), vx (horizontal velocity)
- b has properties: x, y (center), w, h (dimensions)
- S: scale factor

Rules:
- var hw = (a.w * S + b.w * S) / 2
- var hh = (a.h * S + b.h * S) / 2
- var dx = Math.abs(a.x - b.x)
- var dy = Math.abs(a.y - b.y)
- If dx < hw AND dy < hh (overlap detected):
  - Reverse: a.vx = -a.vx
  - Push out: if a.x < b.x then a.x = b.x - hw, else a.x = b.x + hw
  - Return true
- Else return false

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'Collision', runId),

    makeBehavior(`Write a JavaScript function body that detects when an object has passed the left or right edge of the canvas and returns an event string.

Arguments available: obj, W, S
- obj has properties: x (number), w (number)
- W: canvas width
- S: scale factor

Rules:
- var halfW = obj.w * S / 2
- If obj.x - halfW < 0: return "left-edge"
- If obj.x + halfW > W: return "right-edge"
- Otherwise: return ""

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'EdgeScore', runId),

    makeBehavior(`Write a JavaScript function body that updates an object's position from its velocity and clamps vertical position to bounds.

Arguments available: obj, dt, H, S
- obj has properties: x, y, vx, vy (all numbers), h (number)
- dt: seconds elapsed
- H: canvas height
- S: scale factor

Rules:
- obj.x += obj.vx * dt
- obj.y += obj.vy * dt
- var halfH = obj.h * S / 2
- Clamp: obj.y = Math.max(halfH, Math.min(H - halfH, obj.y))

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'Integrator', runId),
  ]);

  const behRetries = inputVel.retries + aiTrack.retries + autoMove.retries +
    collision.retries + edgeScore.retries + integrator.retries;
  cost += inputVel.cost + aiTrack.cost + autoMove.cost +
    collision.cost + edgeScore.cost + integrator.cost;
  totalRetries += behRetries;
  console.log(`  Behaviors: 6 OK (retries: ${behRetries})`);

  // BLINDNESS CHECK
  const cellOutputs = [
    inputVel.code, aiTrack.code, autoMove.code,
    collision.code, edgeScore.code, integrator.code,
  ];
  const gameWords = ['game', 'pong', 'paddle', 'ball', 'player', 'enemy', 'score', 'level'];
  let leaks = 0;
  for (const code of cellOutputs) {
    for (const word of gameWords) {
      if (code.toLowerCase().includes(word)) leaks++;
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  Time: ${elapsed}s | Cost: $${cost.toFixed(4)} | Retries: ${totalRetries} | Leaks: ${leaks}`);

  return {
    run: runIndex + 1,
    elapsed: parseFloat(elapsed),
    cost,
    retries: totalRetries,
    leaks,
    memorySize: memSize,
  };
}

// ── Main: run N times, report learning curve ────────────────

async function main() {
  console.log('=== SELF-LEARNING BLIND CELLS ===');
  console.log(`Runs: ${NUM_RUNS} | Starting with clean memory\n`);

  // Clear memory for clean baseline
  memory.clear();

  const results = [];
  for (let i = 0; i < NUM_RUNS; i++) {
    try {
      const result = await singleRun(i);
      results.push(result);
    } catch (err) {
      console.log(`\n  RUN ${i + 1} FAILED: ${err.message}`);
      results.push({
        run: i + 1, elapsed: 0, cost: 0, retries: -1, leaks: -1,
        memorySize: 0, failed: true,
      });
    }
  }

  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('LEARNING CURVE');
  console.log('='.repeat(60));
  console.log('Run | Memory | Retries | Cost    | Time  | Leaks');
  console.log('----|--------|---------|---------|-------|------');
  for (const r of results) {
    if (r.failed) {
      console.log(`  ${r.run} | FAILED |    ---  |   ---   |  ---  |  --- `);
    } else {
      console.log(`  ${r.run} |   ${String(r.memorySize).padStart(4)} | ${String(r.retries).padStart(7)} | $${r.cost.toFixed(4)} | ${r.elapsed.toFixed(1).padStart(5)}s | ${r.leaks}`);
    }
  }

  // Summary
  const successful = results.filter(r => !r.failed);
  if (successful.length >= 2) {
    const first = successful[0];
    const last = successful[successful.length - 1];
    console.log('\nBaseline (run 1) vs Final:');
    console.log(`  Retries: ${first.retries} → ${last.retries} (${first.retries - last.retries > 0 ? 'improved' : first.retries === last.retries ? 'same' : 'worse'})`);
    console.log(`  Cost:    $${first.cost.toFixed(4)} → $${last.cost.toFixed(4)}`);
    console.log(`  Time:    ${first.elapsed.toFixed(1)}s → ${last.elapsed.toFixed(1)}s`);
  }

  // Final memory stats
  const finalStats = memory.getStats();
  console.log('\nMemory Bank:');
  for (const [type, s] of Object.entries(finalStats)) {
    console.log(`  ${type}: ${s.count} examples`);
  }

  // Save results
  const outDir = path.join(__dirname, 'output', 'learning');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`\nResults saved: ${outDir}/results.json`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
