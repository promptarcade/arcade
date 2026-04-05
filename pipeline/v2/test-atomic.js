#!/usr/bin/env node
// ============================================================
// Atomic Cells — trinary validation with test vectors
// ============================================================
// The decomposer (Claude Opus, this script's author) has already
// decomposed Pong into atomic operations. Each cell writes ONE
// tiny function. Each function is validated against concrete
// input/output test cases the cell never sees.
//
// Trinary outcome per cell:
//   SUCCESS    — all test cases pass
//   FAILURE    — test cases fail (wrong behavior)
//   NOT_ACTION — code doesn't run (crash, wrong signature, empty)
//
// No cell can game this. The task IS the goal.

const fs = require('fs');
const path = require('path');
const { callClaudeAsync } = require('../claude-worker');
const memory = require('./memory');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');
const canvasCheck = require('../validators/canvas-check');

// ── Trinary validation ──────────────────────────────────────

function trinaryValidate(code, testCases, argNames) {
  // NOT_ACTIONED: can't even construct the function
  let fn;
  try {
    fn = new Function(...argNames, code);
  } catch (e) {
    return { result: 'NOT_ACTIONED', reason: `Parse error: ${e.message}` };
  }

  // Run test cases
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      // Deep clone inputs so cell code can't corrupt test state
      const inputs = JSON.parse(JSON.stringify(tc.inputs));
      const returned = fn(...inputs);

      // Check mutations on input objects
      if (tc.expectMutations) {
        for (const [path, expected] of Object.entries(tc.expectMutations)) {
          const actual = getPath(inputs[0], path);
          if (!approxEqual(actual, expected)) {
            return { result: 'FAILURE', reason: `Case ${i + 1}: ${path} = ${actual}, expected ${expected}` };
          }
        }
      }

      // Check return value
      if (tc.expectReturn !== undefined) {
        if (!approxEqual(returned, tc.expectReturn)) {
          return { result: 'FAILURE', reason: `Case ${i + 1}: returned ${JSON.stringify(returned)}, expected ${JSON.stringify(tc.expectReturn)}` };
        }
      }
    } catch (e) {
      return { result: 'NOT_ACTIONED', reason: `Case ${i + 1} crashed: ${e.message}` };
    }
  }

  return { result: 'SUCCESS' };
}

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function approxEqual(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 0.01;
  return a === b;
}

// ── Atomic cell runner ──────────────────────────────────────

async function atomicCell(spec) {
  const fewShot = memory.formatFewShot('atomic', 1);
  let lastResult = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: spec.prompt,
        systemPrompt: 'You are a code generator. Output only valid JSON with a "code" field containing a JavaScript function body. No TypeScript. No function declaration. Just the body.' + fewShot,
        schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
        model: 'haiku', budgetUsd: 0.05,
      });

      const validation = trinaryValidate(r.data.code, spec.testCases, spec.argNames);
      lastResult = validation;

      if (validation.result === 'SUCCESS') {
        console.log(`    ${spec.label}: SUCCESS`);
        memory.store('atomic', { promptKey: spec.label, prompt: spec.prompt, output: r.data.code, runId: 'atomic' });
        return { code: r.data.code, cost: r.cost, result: 'SUCCESS', attempts: attempt };
      }

      console.log(`    ${spec.label}: ${validation.result} (attempt ${attempt}) — ${validation.reason}`);
    } catch (e) {
      console.log(`    ${spec.label}: ERROR (attempt ${attempt}) — ${e.message.slice(0, 100)}`);
      lastResult = { result: 'NOT_ACTIONED', reason: e.message };
    }
  }

  throw new Error(`${spec.label}: failed after 3 attempts. Last: ${lastResult?.reason}`);
}

// ── DECOMPOSITION ───────────────────────────────────────────
// I am the decomposer. I see the goal: Pong.
// I decompose it into atomic operations with test vectors.
// Each cell sees only its tiny task + argument signature.
// No cell sees the test vectors. No cell sees other cells.

const atoms = [
  // ── ATOM 1: Clamp a value to a range ──
  {
    label: 'clamp',
    prompt: `Write a JavaScript function body.
Arguments: val, min, max (all numbers).
Return the value clamped to [min, max].
If val < min, return min. If val > max, return max. Otherwise return val.`,
    argNames: ['val', 'min', 'max'],
    testCases: [
      { inputs: [5, 0, 10], expectReturn: 5 },
      { inputs: [-3, 0, 10], expectReturn: 0 },
      { inputs: [15, 0, 10], expectReturn: 10 },
      { inputs: [0, 0, 10], expectReturn: 0 },
      { inputs: [10, 0, 10], expectReturn: 10 },
    ],
  },

  // ── ATOM 2: Set vertical velocity from input keys ──
  {
    label: 'inputToVelocity',
    prompt: `Write a JavaScript function body.
Arguments: obj, speed, upHeld, downHeld
- obj is an object with a "vy" property (number)
- speed is a number
- upHeld is a boolean
- downHeld is a boolean
Set obj.vy to 0. If upHeld is true, set obj.vy to -speed. If downHeld is true, set obj.vy to speed.`,
    argNames: ['obj', 'speed', 'upHeld', 'downHeld'],
    testCases: [
      { inputs: [{ vy: 99 }, 250, false, false], expectMutations: { 'vy': 0 } },
      { inputs: [{ vy: 0 }, 250, true, false], expectMutations: { 'vy': -250 } },
      { inputs: [{ vy: 0 }, 250, false, true], expectMutations: { 'vy': 250 } },
      { inputs: [{ vy: 0 }, 300, true, true], expectMutations: { 'vy': 300 } }, // down wins (set last)
    ],
  },

  // ── ATOM 3: Move toward a target value ──
  {
    label: 'trackTarget',
    prompt: `Write a JavaScript function body.
Arguments: obj, targetY, speed, deadzone
- obj has properties: y (number), vy (number)
- targetY: the value to move toward (number)
- speed: movement speed (number)
- deadzone: threshold below which no movement occurs (number)
If obj.y < targetY - deadzone, set obj.vy = speed.
If obj.y > targetY + deadzone, set obj.vy = -speed.
Otherwise set obj.vy = 0.`,
    argNames: ['obj', 'targetY', 'speed', 'deadzone'],
    testCases: [
      { inputs: [{ y: 50, vy: 0 }, 100, 200, 5], expectMutations: { 'vy': 200 } },
      { inputs: [{ y: 150, vy: 0 }, 100, 200, 5], expectMutations: { 'vy': -200 } },
      { inputs: [{ y: 98, vy: 99 }, 100, 200, 5], expectMutations: { 'vy': 0 } },
      { inputs: [{ y: 102, vy: 99 }, 100, 200, 5], expectMutations: { 'vy': 0 } },
    ],
  },

  // ── ATOM 4: Integrate velocity into position ──
  {
    label: 'integrate',
    prompt: `Write a JavaScript function body.
Arguments: obj, dt
- obj has properties: x, y, vx, vy (all numbers)
- dt: time step (number)
Add vx*dt to x. Add vy*dt to y.`,
    argNames: ['obj', 'dt'],
    testCases: [
      { inputs: [{ x: 100, y: 200, vx: 50, vy: -30 }, 0.016], expectMutations: { 'x': 100.8, 'y': 199.52 } },
      { inputs: [{ x: 0, y: 0, vx: 0, vy: 0 }, 1.0], expectMutations: { 'x': 0, 'y': 0 } },
      { inputs: [{ x: 10, y: 20, vx: -100, vy: 200 }, 0.5], expectMutations: { 'x': -40, 'y': 120 } },
    ],
  },

  // ── ATOM 5: Bounce off vertical bounds ──
  {
    label: 'bounceVertical',
    prompt: `Write a JavaScript function body.
Arguments: obj, minY, maxY
- obj has properties: y (number), vy (number)
If obj.y < minY: set obj.y = minY, set obj.vy = Math.abs(obj.vy).
If obj.y > maxY: set obj.y = maxY, set obj.vy = -Math.abs(obj.vy).`,
    argNames: ['obj', 'minY', 'maxY'],
    testCases: [
      { inputs: [{ y: -5, vy: -100 }, 0, 600], expectMutations: { 'y': 0, 'vy': 100 } },
      { inputs: [{ y: 605, vy: 100 }, 0, 600], expectMutations: { 'y': 600, 'vy': -100 } },
      { inputs: [{ y: 300, vy: 50 }, 0, 600], expectMutations: { 'y': 300, 'vy': 50 } },
    ],
  },

  // ── ATOM 6: Detect AABB overlap ──
  {
    label: 'overlaps',
    prompt: `Write a JavaScript function body.
Arguments: ax, ay, aw, ah, bx, by, bw, bh (all numbers).
These are center coordinates and dimensions of two rectangles.
Return true if they overlap, false otherwise.
Overlap: Math.abs(ax-bx) < (aw+bw)/2 AND Math.abs(ay-by) < (ah+bh)/2.`,
    argNames: ['ax', 'ay', 'aw', 'ah', 'bx', 'by', 'bw', 'bh'],
    testCases: [
      { inputs: [100, 100, 20, 20, 105, 105, 20, 20], expectReturn: true },
      { inputs: [100, 100, 20, 20, 200, 200, 20, 20], expectReturn: false },
      { inputs: [0, 0, 10, 10, 9, 0, 10, 10], expectReturn: true },
      { inputs: [0, 0, 10, 10, 11, 0, 10, 10], expectReturn: false },
    ],
  },

  // ── ATOM 7: Reverse horizontal velocity + push out ──
  {
    label: 'bounceHorizontal',
    prompt: `Write a JavaScript function body.
Arguments: obj, wallX, pushDir
- obj has properties: x (number), vx (number)
- wallX: the x position to push away from (number)
- pushDir: 1 or -1, the direction to push (number)
Reverse obj.vx (multiply by -1). Set obj.x = wallX + pushDir * 1.`,
    argNames: ['obj', 'wallX', 'pushDir'],
    testCases: [
      { inputs: [{ x: 50, vx: 200 }, 55, -1], expectMutations: { 'vx': -200, 'x': 54 } },
      { inputs: [{ x: 550, vx: -200 }, 545, 1], expectMutations: { 'vx': 200, 'x': 546 } },
    ],
  },

  // ── ATOM 8: Detect edge crossing ──
  {
    label: 'edgeCrossing',
    prompt: `Write a JavaScript function body.
Arguments: x, halfW, canvasW (all numbers).
If x - halfW < 0, return "left".
If x + halfW > canvasW, return "right".
Otherwise return "".`,
    argNames: ['x', 'halfW', 'canvasW'],
    testCases: [
      { inputs: [-5, 10, 800], expectReturn: 'left' },
      { inputs: [810, 10, 800], expectReturn: 'right' },
      { inputs: [400, 10, 800], expectReturn: '' },
      { inputs: [10, 10, 800], expectReturn: '' },
      { inputs: [9, 10, 800], expectReturn: 'left' },
    ],
  },
];

// ── Sprite builder ──────────────────────────────────────────

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

// ── Shape cell (same as before, visual — not atomic) ────────

async function makeShape(desc, w, h, colors, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `Draw a ${w}x${h} ${desc} on a PixelCanvas.
Colors: base="${colors.base}", light="${colors.light}", dark="${colors.dark}", accent="${colors.accent}"
API: pc.fillCircle(cx, cy, r, idx), pc.fillRect(x,y,w,h,idx), pc.fillEllipse(cx,cy,rx,ry,idx), pc.setPixel(x,y,idx)
Color index: pal.groups.base.startIdx + (0=dark,1=mid,2=light,3=brightest)
Canvas: ${w}x${h}, origin top-left. Fill at least 30% of the canvas. Use at least 2 color groups.
Output drawBody: the drawing code as a string.`,
        systemPrompt: 'You are a pixel renderer. Draw the described shape. Output only JSON.',
        schema: { type: 'object', properties: { drawBody: { type: 'string' } }, required: ['drawBody'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const render = canvasCheck.validateSprite(r.data.drawBody, '', w, h, colors);
      if (render.valid) {
        console.log(`    ${label}: OK (${render.coverage}%)`);
        return { drawBody: r.data.drawBody, cost: r.cost };
      }
      console.log(`    ${label}: attempt ${attempt} — ${render.errors[0]}`);
    } catch (e) {
      console.log(`    ${label}: attempt ${attempt} error`);
    }
  }
  throw new Error(`${label} failed`);
}

// ── Main ────────────────────────────────────────────────────

async function run() {
  const start = Date.now();
  let cost = 0;

  console.log('=== ATOMIC CELLS — trinary validation ===');
  console.log(`${atoms.length} atomic behaviors + 3 palettes + 3 shapes = ${atoms.length + 6} cells\n`);

  // PALETTES + SHAPES (reuse from before, parallel)
  console.log('[PALETTES + SHAPES]');
  const colors = [
    { base: '#0099FF', light: '#66D9FF', dark: '#003D7A', accent: '#00FFCC' },
    { base: '#E63946', light: '#FF8A95', dark: '#A01830', accent: '#FFB347' },
    { base: '#FAFBFC', light: '#FFFFFF', dark: '#C0C8D8', accent: '#FFD700' },
  ];
  const [sA, sB, sC] = await Promise.all([
    makeShape('filled vertical rectangle, filling most of the canvas', 12, 48, colors[0], 'Rect A'),
    makeShape('filled vertical rectangle, filling most of the canvas', 12, 48, colors[1], 'Rect B'),
    makeShape('filled circle, centered, radius filling most of the canvas', 16, 16, colors[2], 'Circle C'),
  ]);
  cost += sA.cost + sB.cost + sC.cost;

  // ATOMIC BEHAVIORS (parallel)
  console.log('\n[ATOMIC BEHAVIORS — trinary validation]');
  const results = await Promise.all(atoms.map(spec => atomicCell(spec)));
  for (const r of results) cost += r.cost;

  // Report trinary results
  console.log('\n[TRINARY REPORT]');
  const summary = { SUCCESS: 0, FAILURE: 0, NOT_ACTIONED: 0 };
  results.forEach((r, i) => {
    summary[r.result]++;
  });
  console.log(`  SUCCESS:      ${summary.SUCCESS}/${atoms.length}`);
  console.log(`  FAILURE:      ${summary.FAILURE}/${atoms.length}`);
  console.log(`  NOT_ACTIONED: ${summary.NOT_ACTIONED}/${atoms.length}`);

  // Extract code by label
  const code = {};
  atoms.forEach((spec, i) => { code[spec.label] = results[i].code; });

  // ASSEMBLY — I am the decomposer, I know this is Pong.
  // The cells don't. They wrote clamp(), overlaps(), integrate().
  // I compose them into a game loop.
  console.log('\n[ASSEMBLY — decomposer composes atomic cells into product]');
  const engine = fs.readFileSync(ENGINE, 'utf8');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Atomic Pong</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#111}canvas{display:block;touch-action:none;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas><script>
${engine}

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H, S;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; S = Math.min(W,H)/600; }
resize(); addEventListener('resize', resize);

${buildSprite(sA.drawBody, 12, 48, colors[0], 'spriteA')}
${buildSprite(sB.drawBody, 12, 48, colors[1], 'spriteB')}
${buildSprite(sC.drawBody, 16, 16, colors[2], 'spriteC')}

// Atomic cell outputs — each is a single pure function
var clamp = function(val, min, max) { ${code.clamp} };
var inputToVelocity = function(obj, speed, upHeld, downHeld) { ${code.inputToVelocity} };
var trackTarget = function(obj, targetY, speed, deadzone) { ${code.trackTarget} };
var integrate = function(obj, dt) { ${code.integrate} };
var bounceVertical = function(obj, minY, maxY) { ${code.bounceVertical} };
var overlaps = function(ax,ay,aw,ah,bx,by,bw,bh) { ${code.overlaps} };
var bounceHorizontal = function(obj, wallX, pushDir) { ${code.bounceHorizontal} };
var edgeCrossing = function(x, halfW, canvasW) { ${code.edgeCrossing} };

var DS = 3;
var a = { x: W * 0.05, y: H / 2, w: 12 * DS, h: 48 * DS, vx: 0, vy: 0 };
var b = { x: W * 0.95, y: H / 2, w: 12 * DS, h: 48 * DS, vx: 0, vy: 0 };
var ball = { x: W / 2, y: H / 2, w: 16 * DS, h: 16 * DS, vx: 250, vy: 180 };
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

function resetBall() {
  ball.x = W / 2;
  ball.y = H / 2;
  ball.vx = (Math.random() > 0.5 ? 1 : -1) * 250;
  ball.vy = (Math.random() - 0.5) * 360;
}

var last = 0;
function loop(t) {
  var dt = Math.min((t - last) / 1000, 0.05); last = t;
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);

  // COMPOSITION — the decomposer (me) wires atomic cells
  // Each line calls one atomic function. No cell knows this context.
  var hA = a.h * S / 2;
  var hB = b.h * S / 2;
  var hBall = ball.h * S / 2;

  inputToVelocity(a, 250 * S, !!inputState.keys.ArrowUp, !!inputState.keys.ArrowDown);
  trackTarget(b, ball.y, 200 * S, 5);
  integrate(a, dt);
  integrate(b, dt);
  integrate(ball, dt);
  a.y = clamp(a.y, hA, H - hA);
  b.y = clamp(b.y, hB, H - hB);
  bounceVertical(ball, hBall, H - hBall);
  if (overlaps(ball.x, ball.y, ball.w*S, ball.h*S, a.x, a.y, a.w*S, a.h*S)) {
    bounceHorizontal(ball, a.x + (a.w*S + ball.w*S)/2, 1);
  }
  if (overlaps(ball.x, ball.y, ball.w*S, ball.h*S, b.x, b.y, b.w*S, b.h*S)) {
    bounceHorizontal(ball, b.x - (b.w*S + ball.w*S)/2, -1);
  }
  var edge = edgeCrossing(ball.x, ball.w*S/2, W);
  if (edge === 'left') { scoreRight++; resetBall(); }
  if (edge === 'right') { scoreLeft++; resetBall(); }

  ctx.drawImage(spriteA, a.x - a.w*S/2, a.y - a.h*S/2, a.w*S, a.h*S);
  ctx.drawImage(spriteB, b.x - b.w*S/2, b.y - b.h*S/2, b.w*S, b.h*S);
  ctx.drawImage(spriteC, ball.x - ball.w*S/2, ball.y - ball.h*S/2, ball.w*S, ball.h*S);

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

  const outDir = path.join(__dirname, 'output', 'atomic-pong');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);

  // BLINDNESS CHECK
  console.log('\n[BLINDNESS CHECK]');
  const gameWords = ['game', 'pong', 'paddle', 'ball', 'player', 'enemy', 'score', 'level'];
  let leaks = 0;
  for (const r of results) {
    for (const word of gameWords) {
      if (r.code.toLowerCase().includes(word)) {
        console.log(`  LEAK: "${word}" in cell output`);
        leaks++;
      }
    }
  }
  if (leaks === 0) console.log('  Zero domain vocabulary in any atomic cell output');

  // FINAL REPORT
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('ATOMIC CELLS — complete');
  console.log(`  Cells: ${atoms.length} atomic + 3 shape = ${atoms.length + 3} total`);
  console.log(`  Trinary: ${summary.SUCCESS} success, ${summary.FAILURE} failure, ${summary.NOT_ACTIONED} not actioned`);
  console.log(`  Total attempts: ${results.reduce((s, r) => s + r.attempts, 0)}`);
  console.log(`  Time: ${elapsed}s | Cost: $${cost.toFixed(4)} | Leaks: ${leaks}`);
  console.log(`  Output: ${outDir}/index.html`);
  console.log('='.repeat(60));
}

run().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
