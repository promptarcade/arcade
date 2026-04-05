#!/usr/bin/env node
// ============================================================
// Mesh Topology — lateral blind cell communication
// ============================================================
// 14 cells: 3 palette + 1 harmony + 3 shape + 6 behavior + 1 sequencer
//
// Lateral connections (both blind):
//   Harmony:   receives 3 palettes → adjusts for visual contrast
//   Sequencer: receives 6 behavior code snippets → determines execution order
//
// The assembler no longer decides execution order — the sequencer does.
// The assembler no longer gets raw palettes — the harmony cell adjusts them first.
//
// Usage: node pipeline/v2/test-mesh.js

const fs = require('fs');
const path = require('path');
const { callClaudeAsync } = require('../claude-worker');
const jsSyntax = require('../validators/js-syntax');
const canvasCheck = require('../validators/canvas-check');
const memory = require('./memory');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

// ── Cell factories (same as test-learning.js) ───────────────

async function makeColor(theme) {
  const fewShot = memory.formatFewShot('palette', 2);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `Generate a 4-color palette for: "${theme}". Output base, light, dark, accent as hex.`,
        systemPrompt: 'You are a color generator. Output only JSON with hex color values.' + fewShot,
        schema: { type: 'object', properties: { base: {type:'string'}, light: {type:'string'}, dark: {type:'string'}, accent: {type:'string'} }, required: ['base','light','dark','accent'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      if (Object.values(r.data).every(c => /^#[0-9A-Fa-f]{6}$/.test(c))) {
        memory.store('palette', { promptKey: theme, prompt: `palette: ${theme}`, output: r.data, runId: 'mesh' });
        return { colors: r.data, cost: r.cost };
      }
    } catch (e) {}
  }
  throw new Error('Color failed');
}

async function makeShape(desc, w, h, colors, label) {
  const fewShot = memory.formatFewShot('shape', 2);
  const palDef = `base="${colors.base}", light="${colors.light}", dark="${colors.dark}", accent="${colors.accent}"`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `Draw a ${w}x${h} ${desc} on a PixelCanvas.
Colors: ${palDef}
API: pc.fillCircle(cx, cy, r, idx), pc.fillRect(x,y,w,h,idx), pc.fillEllipse(cx,cy,rx,ry,idx), pc.setPixel(x,y,idx)
Color index: pal.groups.base.startIdx + (0=dark,1=mid,2=light,3=brightest)
Canvas: ${w}x${h}, origin top-left. Fill at least 30% of the canvas. Use at least 2 color groups.
Output drawBody: the drawing code as a string.`,
        systemPrompt: 'You are a pixel renderer. Draw the described shape. Output only JSON.' + fewShot,
        schema: { type: 'object', properties: { drawBody: { type: 'string' } }, required: ['drawBody'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const render = canvasCheck.validateSprite(r.data.drawBody, '', w, h, colors);
      if (render.valid) {
        console.log(`    ${label}: OK (${render.coverage}%)`);
        memory.store('shape', { promptKey: `${w}x${h} ${desc}`, prompt: `shape: ${desc}`, output: r.data.drawBody, runId: 'mesh' });
        return { drawBody: r.data.drawBody, cost: r.cost };
      }
      console.log(`    ${label}: attempt ${attempt} — ${render.errors[0]}`);
    } catch (e) {
      console.log(`    ${label}: attempt ${attempt} error`);
    }
  }
  throw new Error(`${label} failed`);
}

async function makeBehavior(prompt, label, contractChecks) {
  const fewShot = memory.formatFewShot('behavior', 2);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: prompt + `\n\nAlso output "reads" and "writes" arrays listing the object properties your code reads and writes (e.g., ["obj.x", "obj.vy", "inputState.keys"]).`,
        systemPrompt: 'You are a code generator. Output only valid JSON with plain JavaScript code. No TypeScript type annotations.' + fewShot,
        schema: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            reads: { type: 'array', items: { type: 'string' } },
            writes: { type: 'array', items: { type: 'string' } },
          },
          required: ['code', 'reads', 'writes']
        },
        model: 'haiku', budgetUsd: 0.05,
      });
      const code = r.data.code;
      const syntax = jsSyntax.validate(code, { wrapInFunction: true });
      if (!syntax.valid) { console.log(`    ${label}: attempt ${attempt} — ${syntax.errors[0]}`); continue; }
      if (contractChecks) {
        const failed = contractChecks.filter(c => !code.includes(c));
        if (failed.length > 0) { console.log(`    ${label}: attempt ${attempt} — missing: ${failed[0]}`); continue; }
      }
      console.log(`    ${label}: OK`);
      memory.store('behavior', { promptKey: prompt.split('\n')[0].slice(0, 80), prompt, output: code, runId: 'mesh' });
      return { code, reads: r.data.reads || [], writes: r.data.writes || [], cost: r.cost };
    } catch (e) {
      console.log(`    ${label}: attempt ${attempt} error`);
    }
  }
  throw new Error(`${label} failed`);
}

// ── LATERAL CELL: Harmony ───────────────────────────────────

async function harmonizePalettes(palettes) {
  // Build a domain-free description of the palettes
  const paletteList = palettes.map((p, i) =>
    `Palette ${i + 1}: base=${p.base}, light=${p.light}, dark=${p.dark}, accent=${p.accent}`
  ).join('\n');

  const fewShot = memory.formatFewShot('harmony', 1);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `You have ${palettes.length} color palettes that will be displayed together against a dark background (#111111).

${paletteList}

Adjust these palettes so they:
1. Have strong visual contrast against each other (no two palettes should look too similar)
2. Have good contrast against the dark background
3. Maintain each palette's original mood/temperature (don't make a warm palette cool)
4. Keep all colors vivid and saturated

Output the adjusted palettes as an array of objects with base, light, dark, accent fields.`,
        systemPrompt: 'You are a color harmony specialist. Adjust palettes for visual contrast. Output only JSON.' + fewShot,
        schema: {
          type: 'object',
          properties: {
            palettes: {
              type: 'array',
              items: {
                type: 'object',
                properties: { base: {type:'string'}, light: {type:'string'}, dark: {type:'string'}, accent: {type:'string'} },
                required: ['base','light','dark','accent']
              }
            }
          },
          required: ['palettes']
        },
        model: 'haiku', budgetUsd: 0.05,
      });

      const adjusted = r.data.palettes;
      if (!adjusted || adjusted.length !== palettes.length) continue;

      // Validate: all hex, and at least one palette was actually changed
      const allHex = adjusted.every(p =>
        Object.values(p).every(c => /^#[0-9A-Fa-f]{6}$/.test(c))
      );
      if (!allHex) continue;

      const changed = adjusted.some((p, i) =>
        p.base !== palettes[i].base || p.accent !== palettes[i].accent
      );
      if (!changed) {
        console.log(`    Harmony: attempt ${attempt} — no changes made`);
        continue;
      }

      memory.store('harmony', {
        promptKey: `${palettes.length} palettes`,
        prompt: paletteList,
        output: adjusted,
        runId: 'mesh',
      });

      return { palettes: adjusted, cost: r.cost };
    } catch (e) {
      console.log(`    Harmony: attempt ${attempt} error`);
    }
  }
  // Fallback: return originals if harmony fails
  console.log('    Harmony: FALLBACK — using original palettes');
  return { palettes, cost: 0 };
}

// ── LATERAL CELL: Sequencer ─────────────────────────────────

async function sequenceBehaviors(behaviors) {
  // Present behaviors as property manifests ONLY — no code, no domain signal
  const manifests = behaviors.map((b, i) =>
    `code-${i + 1}: reads [${b.reads.join(', ')}] writes [${b.writes.join(', ')}]`
  ).join('\n');

  const fewShot = memory.formatFewShot('sequencer', 1);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `You have ${behaviors.length} code units that each read and write object properties. They execute once per iteration in a loop.

${manifests}

Determine the best execution order based on data flow dependencies:
- A unit that WRITES a property should run BEFORE a unit that READS that same property
- Units that read external input (e.g., inputState) should run early
- Units that integrate cumulative values (add to position from velocity) should run after velocity is set
- Units that check boundary conditions should run after position is updated

Output an "order" array of label strings (e.g., ["code-1", "code-4", "code-2", ...]) and a "reasoning" string explaining the dependency chain.`,
        systemPrompt: 'You are a data flow dependency analyzer. Determine execution order from read/write manifests. Output only JSON. In your reasoning, describe ONLY data flow dependencies (e.g., "code-1 writes prop X which code-3 reads, so code-1 runs first"). Do NOT speculate about application domain, purpose, or what kind of program this is. Use only property names and data flow terminology.' + fewShot,
        schema: {
          type: 'object',
          properties: {
            order: { type: 'array', items: { type: 'string' } },
            reasoning: { type: 'string' }
          },
          required: ['order', 'reasoning']
        },
        model: 'haiku', budgetUsd: 0.05,
      });

      const order = r.data.order;
      const expectedLabels = behaviors.map((_, i) => `code-${i + 1}`);

      // Validate: all labels present, no duplicates
      if (!order || order.length !== behaviors.length) {
        console.log(`    Sequencer: attempt ${attempt} — wrong count (${order?.length} vs ${behaviors.length})`);
        continue;
      }
      const sorted = order.slice().sort();
      const expectedSorted = expectedLabels.slice().sort();
      if (JSON.stringify(sorted) !== JSON.stringify(expectedSorted)) {
        console.log(`    Sequencer: attempt ${attempt} — labels mismatch`);
        continue;
      }

      memory.store('sequencer', {
        promptKey: `${behaviors.length} behaviors`,
        prompt: `sequence ${behaviors.length} code snippets`,
        output: { order: order, reasoning: r.data.reasoning },
        runId: 'mesh',
      });

      return { order, reasoning: r.data.reasoning, cost: r.cost };
    } catch (e) {
      console.log(`    Sequencer: attempt ${attempt} error`);
    }
  }
  // Fallback: natural order
  console.log('    Sequencer: FALLBACK — using natural order');
  return {
    order: behaviors.map((_, i) => `code-${i + 1}`),
    reasoning: 'fallback: natural order',
    cost: 0,
  };
}

// ── Sprite builder (same as test-pong.js) ───────────────────

function buildSprite(drawBody, w, h, colors, varName) {
  const palDef = Object.entries(colors).map(([k,v]) => `'${k}':'${v}'`).join(',');
  return `var ${varName} = (function() {
  var pal = ColorRamp.buildPalette({${palDef}});
  pal.palette[255] = sf2_packRGBA(20, 15, 10, 255);
  var pc = new PixelCanvas(${w}, ${h});
  (function(pc, pal) { ${drawBody} })(pc, pal);
  try { PostProcess.applyShading(pc, pal, { lightAngle: Math.PI * 0.75 }); } catch(e) {}
  var cvs = document.createElement('canvas');
  cvs.width = ${w}; cvs.height = ${h};
  var c = cvs.getContext('2d');
  var img = c.createImageData(${w}, ${h});
  for (var y = 0; y < ${h}; y++) for (var x = 0; x < ${w}; x++) {
    var idx = pc.pixels[y*${w}+x], rgba = pal.palette[idx]||0, pi = (y*${w}+x)*4;
    img.data[pi]=rgba&0xFF; img.data[pi+1]=(rgba>>8)&0xFF; img.data[pi+2]=(rgba>>16)&0xFF; img.data[pi+3]=(rgba>>24)&0xFF;
  }
  c.putImageData(img, 0, 0);
  return cvs;
})();`;
}

// ── Main ────────────────────────────────────────────────────

async function run() {
  const start = Date.now();
  let cost = 0;

  console.log('=== MESH TOPOLOGY: 14 cells, lateral connections ===\n');

  // ── LAYER 1: Palettes (parallel) ──
  console.log('[PALETTES — 3 cells, parallel]');
  const [cA, cB, cC] = await Promise.all([
    makeColor('cool electric blue'),
    makeColor('warm crimson red'),
    makeColor('bright white glow'),
  ]);
  cost += cA.cost + cB.cost + cC.cost;
  console.log('  3 palettes generated');
  console.log(`    A: ${JSON.stringify(cA.colors)}`);
  console.log(`    B: ${JSON.stringify(cB.colors)}`);
  console.log(`    C: ${JSON.stringify(cC.colors)}`);

  // ── LATERAL: Harmony cell ──
  console.log('\n[HARMONY — lateral cell, adjusts palettes for contrast]');
  const harmony = await harmonizePalettes([cA.colors, cB.colors, cC.colors]);
  cost += harmony.cost;
  const [hA, hB, hC] = harmony.palettes;
  console.log('  Harmonized:');
  console.log(`    A: ${JSON.stringify(hA)}`);
  console.log(`    B: ${JSON.stringify(hB)}`);
  console.log(`    C: ${JSON.stringify(hC)}`);

  // ── LAYER 2: Shapes using harmonized palettes ──
  console.log('\n[SHAPES — 3 cells, parallel, using harmonized palettes]');
  const [sA, sB, sC] = await Promise.all([
    makeShape('filled vertical rectangle, filling most of the canvas', 12, 48, hA, 'Rect A'),
    makeShape('filled vertical rectangle, filling most of the canvas', 12, 48, hB, 'Rect B'),
    makeShape('filled circle, centered, radius filling most of the canvas', 16, 16, hC, 'Circle C'),
  ]);
  cost += sA.cost + sB.cost + sC.cost;

  // ── LAYER 3: Behaviors (parallel) ──
  console.log('\n[BEHAVIORS — 6 cells, parallel]');

  // Each behavior is a labeled block with its call signature for the assembler
  const behaviorSpecs = [
    {
      label: 'inputVel',
      callExpr: 'FN(a, S, inputState)',
      prompt: `Write a JavaScript function body that sets an object's vertical velocity based on input state.

Arguments available: obj, S, inputState
- obj has properties: vy (number)
- S: scale factor
- inputState has property keys: object mapping key names to true/false

Rules:
- Set obj.vy to 0 first
- If inputState.keys.ArrowUp is true: obj.vy = -250 * S
- If inputState.keys.ArrowDown is true: obj.vy = 250 * S

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`,
      contractChecks: ['inputState.keys'],
    },
    {
      label: 'aiTrack',
      callExpr: 'FN(b, c.y, S, dt)',
      prompt: `Write a JavaScript function body that moves an object's vertical position toward a target y-coordinate at a fixed speed.

Arguments available: obj, targetY, S, dt
- obj has properties: vy (number), y (number)
- targetY: number (the y position to move toward)
- S: scale factor
- dt: seconds elapsed

Rules:
- If obj.y < targetY - 5: set obj.vy = 200 * S
- Else if obj.y > targetY + 5: set obj.vy = -200 * S
- Else: set obj.vy = 0

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`,
    },
    {
      label: 'bounce',
      callExpr: 'FN(c, H, S)',
      prompt: `Write a JavaScript function body that bounces an object off horizontal boundaries.

Arguments available: obj, H, S
- obj has properties: y (number), vy (number), h (number)
- H: canvas height
- S: scale factor

Rules:
- var halfH = obj.h * S / 2
- If obj.y - halfH < 0: set obj.y = halfH, set obj.vy = Math.abs(obj.vy)
- If obj.y + halfH > H: set obj.y = H - halfH, set obj.vy = -Math.abs(obj.vy)

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`,
    },
    {
      label: 'collision',
      callExpr: 'FN(c, a, S); FN(c, b, S)',
      prompt: `Write a JavaScript function body that detects overlap between two rectangular areas and reverses the first object's horizontal velocity, pushing it out of the overlap.

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

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`,
    },
    {
      label: 'edgeScore',
      callExpr: 'EDGE_CHECK',
      prompt: `Write a JavaScript function body that detects when an object has passed the left or right edge of the canvas and returns an event string.

Arguments available: obj, W, S
- obj has properties: x (number), w (number)
- W: canvas width
- S: scale factor

Rules:
- var halfW = obj.w * S / 2
- If obj.x - halfW < 0: return "left-edge"
- If obj.x + halfW > W: return "right-edge"
- Otherwise: return ""

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`,
    },
    {
      label: 'integrator',
      callExpr: 'FN(a, dt, H, S); FN(b, dt, H, S); c.x += c.vx * dt; c.y += c.vy * dt',
      prompt: `Write a JavaScript function body that updates an object's position from its velocity and clamps vertical position to bounds.

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

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`,
    },
  ];

  const behaviorResults = await Promise.all(
    behaviorSpecs.map(spec => makeBehavior(spec.prompt, spec.label, spec.contractChecks))
  );
  for (const b of behaviorResults) cost += b.cost;

  // Map label → index for sequencer output
  const labelToIndex = {};
  behaviorSpecs.forEach((spec, i) => { labelToIndex[`code-${i + 1}`] = i; });

  // ── LATERAL: Sequencer cell ──
  console.log('\n[SEQUENCER — lateral cell, determines execution order from data flow]');
  const seq = await sequenceBehaviors(behaviorResults);
  cost += seq.cost;
  console.log(`  Order: ${seq.order.join(' → ')}`);
  console.log(`  Reasoning: ${seq.reasoning.slice(0, 200)}`);

  // Map sequencer order back to behavior specs
  const orderedBehaviors = seq.order.map(label => {
    const idx = labelToIndex[label];
    return {
      ...behaviorSpecs[idx],
      code: behaviorResults[idx].code,
    };
  });

  // ── ASSEMBLY ──
  console.log('\n[ASSEMBLY — dumb template, sequencer-ordered]');
  const engine = fs.readFileSync(ENGINE, 'utf8');

  // Build behavior function declarations
  const behaviorDecls = orderedBehaviors.map(b =>
    `var ${b.label} = function(${b.prompt.match(/Arguments available: ([^\n]+)/)?.[1] || 'obj'}) { ${b.code} };`
  ).join('\n');

  // Build the game loop calls in sequencer order
  const loopCalls = orderedBehaviors.map(b => {
    // Replace FN with the actual function name
    const calls = b.callExpr
      .replace(/FN/g, b.label)
      .replace('EDGE_CHECK', `var edge = ${b.label}(c, W, S);\n    if (edge === 'left-edge') { scoreRight++; resetBall(); }\n    if (edge === 'right-edge') { scoreLeft++; resetBall(); }`);
    return `    ${calls};`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Mesh Pong</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#111}canvas{display:block;touch-action:none;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas><script>
${engine}

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H, S;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; S = Math.min(W,H)/600; }
resize(); addEventListener('resize', resize);

${buildSprite(sA.drawBody, 12, 48, hA, 'spriteA')}
${buildSprite(sB.drawBody, 12, 48, hB, 'spriteB')}
${buildSprite(sC.drawBody, 16, 16, hC, 'spriteC')}

var DS = 3;
var a = { x: W * 0.05, y: H / 2, w: 12 * DS, h: 48 * DS, vx: 0, vy: 0 };
var b = { x: W * 0.95, y: H / 2, w: 12 * DS, h: 48 * DS, vx: 0, vy: 0 };
var c = { x: W / 2, y: H / 2, w: 16 * DS, h: 16 * DS, vx: 250, vy: 180 };
var inputState = { keys: {} };
var scoreLeft = 0, scoreRight = 0;

addEventListener('keydown', function(e) { inputState.keys[e.key] = true; e.preventDefault(); });
addEventListener('keyup', function(e) { inputState.keys[e.key] = false; });
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  var ty = e.touches[0].clientY;
  if (ty < a.y) inputState.keys.ArrowUp = true;
  else inputState.keys.ArrowDown = true;
});
canvas.addEventListener('touchend', function(e) {
  e.preventDefault();
  inputState.keys.ArrowUp = false;
  inputState.keys.ArrowDown = false;
});

// Behavior functions — declared in sequencer-determined order
${behaviorDecls}

function resetBall() {
  c.x = W / 2;
  c.y = H / 2;
  c.vx = (Math.random() > 0.5 ? 1 : -1) * 250;
  c.vy = (Math.random() - 0.5) * 360;
}

var last = 0;
function loop(t) {
  var dt = Math.min((t - last) / 1000, 0.05); last = t;
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);

  // Behaviors — executed in SEQUENCER-DETERMINED order
${loopCalls}

  // Draw
  ctx.drawImage(spriteA, a.x - a.w*S/2, a.y - a.h*S/2, a.w*S, a.h*S);
  ctx.drawImage(spriteB, b.x - b.w*S/2, b.y - b.h*S/2, b.w*S, b.h*S);
  ctx.drawImage(spriteC, c.x - c.w*S/2, c.y - c.h*S/2, c.w*S, c.h*S);

  ctx.setLineDash([8*S, 8*S]);
  ctx.strokeStyle = '#444'; ctx.lineWidth = 2*S;
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#fff'; ctx.font = Math.round(48*S)+'px monospace'; ctx.textAlign = 'center';
  ctx.fillText(scoreLeft + '   ' + scoreRight, W/2, 60*S);
  ctx.font = Math.round(14*S)+'px monospace';
  ctx.fillText('Arrow Up/Down to move', W/2, H - 20*S);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script></body></html>`;

  const outDir = path.join(__dirname, 'output', 'mesh-pong');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);

  // ── BLINDNESS VERIFICATION ──
  console.log('\n[BLINDNESS CHECK]');
  const gameWords = ['game', 'pong', 'paddle', 'ball', 'player', 'enemy', 'score', 'level'];
  let leaks = 0;

  // Check behavior cell outputs
  for (const b of behaviorResults) {
    for (const word of gameWords) {
      if (b.code.toLowerCase().includes(word)) {
        console.log(`  LEAK in behavior: "${word}"`);
        leaks++;
      }
    }
  }

  // Check harmony cell output
  const harmonyStr = JSON.stringify(harmony.palettes);
  for (const word of gameWords) {
    if (harmonyStr.toLowerCase().includes(word)) {
      console.log(`  LEAK in harmony: "${word}"`);
      leaks++;
    }
  }

  // Check sequencer output
  const seqStr = seq.reasoning.toLowerCase();
  for (const word of gameWords) {
    if (seqStr.includes(word)) {
      console.log(`  LEAK in sequencer: "${word}"`);
      leaks++;
    }
  }

  if (leaks === 0) console.log('  No domain vocabulary in any cell output (including lateral cells)');
  else console.log(`  ${leaks} leaks found`);

  // ── REPORT ──
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('MESH TOPOLOGY — complete');
  console.log(`  Cells: 14 (3 palette + 1 harmony + 3 shape + 6 behavior + 1 sequencer)`);
  console.log(`  Lateral connections: 2 (harmony, sequencer)`);
  console.log(`  Sequencer order: ${seq.order.join(' → ')}`);
  console.log(`  Time: ${elapsed}s | Cost: $${cost.toFixed(4)} | Leaks: ${leaks}`);
  console.log(`  Output: ${outDir}/index.html`);
  console.log('='.repeat(60));
}

run().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
