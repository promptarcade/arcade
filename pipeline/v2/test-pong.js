#!/usr/bin/env node
// ============================================================
// Blind Pong — steps 4-9 in one test
// ============================================================
// Each cell is blind. Each produces success or failure.
// The assembler wires outputs with a consistent velocity contract.
//
// Cells:
//   1-3: Colors (shape A, shape B, shape C)
//   4-6: Shapes (vertical rect, vertical rect, circle)
//   7: Input-to-velocity (keys set obj velocity on vertical axis)
//   8: AI tracking (obj moves toward a target y-position)
//   9: Autonomous motion (obj moves at constant velocity, bounces off horizontal edges)
//  10: Collision (reverse obj horizontal velocity when overlapping a rect, push out)
//  11: Edge scoring (detect when obj passes left or right edge, return event, reset position)
//  12: Velocity integrator (apply vx/vy to position, clamp to bounds)

const fs = require('fs');
const path = require('path');
const { callClaudeAsync } = require('../claude-worker');
const jsSyntax = require('../validators/js-syntax');
const canvasCheck = require('../validators/canvas-check');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

async function makeColor(theme) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `Generate a 4-color palette for: "${theme}". Output base, light, dark, accent as hex.`,
        systemPrompt: 'You are a color generator. Output only JSON with hex color values.',
        schema: { type: 'object', properties: { base: {type:'string'}, light: {type:'string'}, dark: {type:'string'}, accent: {type:'string'} }, required: ['base','light','dark','accent'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      if (Object.values(r.data).every(c => /^#[0-9A-Fa-f]{6}$/.test(c))) {
        return { colors: r.data, cost: r.cost };
      }
    } catch (e) {}
  }
  throw new Error('Color failed');
}

async function makeShape(desc, w, h, colors, label) {
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
        systemPrompt: 'You are a pixel renderer. Draw the described shape. Output only JSON.',
        schema: { type: 'object', properties: { drawBody: { type: 'string' } }, required: ['drawBody'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const render = canvasCheck.validateSprite(r.data.drawBody, '', w, h, colors);
      if (render.valid) {
        console.log(`  ${label}: OK (${render.coverage}%)`);
        return { drawBody: r.data.drawBody, cost: r.cost };
      }
      console.log(`  ${label}: attempt ${attempt} — ${render.errors[0]}`);
    } catch (e) {
      console.log(`  ${label}: attempt ${attempt} error`);
    }
  }
  throw new Error(`${label} failed`);
}

async function makeBehavior(prompt, label, contractChecks) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt,
        systemPrompt: 'You are a code generator. Output only valid JSON with plain JavaScript code. No TypeScript type annotations.',
        schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const code = r.data.code;
      const syntax = jsSyntax.validate(code, { wrapInFunction: true });
      if (!syntax.valid) {
        console.log(`  ${label}: attempt ${attempt} — ${syntax.errors[0]}`);
        continue;
      }
      if (contractChecks) {
        const failed = contractChecks.filter(c => !code.includes(c));
        if (failed.length > 0) {
          console.log(`  ${label}: attempt ${attempt} — missing contract: ${failed[0]}`);
          continue;
        }
      }
      console.log(`  ${label}: OK`);
      return { code, cost: r.cost };
    } catch (e) {
      console.log(`  ${label}: attempt ${attempt} error`);
    }
  }
  throw new Error(`${label} failed`);
}

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

async function run() {
  const start = Date.now();
  let cost = 0;

  console.log('=== BLIND PONG: 12 cells, steps 4-9 ===\n');

  // COLORS (parallel)
  console.log('[COLORS]');
  const [cA, cB, cC] = await Promise.all([
    makeColor('cool electric blue'),
    makeColor('warm crimson red'),
    makeColor('bright white glow'),
  ]);
  cost += cA.cost + cB.cost + cC.cost;
  console.log('  3 palettes OK');

  // SHAPES (parallel)
  console.log('\n[SHAPES]');
  const [sA, sB, sC] = await Promise.all([
    makeShape('filled vertical rectangle, filling most of the canvas', 12, 48, cA.colors, 'Rect A'),
    makeShape('filled vertical rectangle, filling most of the canvas', 12, 48, cB.colors, 'Rect B'),
    makeShape('filled circle, centered, radius filling most of the canvas', 16, 16, cC.colors, 'Circle C'),
  ]);
  cost += sA.cost + sB.cost + sC.cost;

  // BEHAVIORS (parallel)
  console.log('\n[BEHAVIORS]');
  const [inputVel, aiTrack, autoMove, collision, edgeScore, integrator] = await Promise.all([
    // Cell 7: Input to velocity
    makeBehavior(`Write a JavaScript function body that sets an object's vertical velocity based on input state.

Arguments available: obj, S, inputState
- obj has properties: vy (number)
- S: scale factor
- inputState has property keys: object mapping key names to true/false

Rules:
- Set obj.vy to 0 first
- If inputState.keys.ArrowUp is true: obj.vy = -250 * S
- If inputState.keys.ArrowDown is true: obj.vy = 250 * S

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'InputVelocity', ['inputState.keys']),

    // Cell 8: AI tracking
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

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'AITrack'),

    // Cell 9: Autonomous constant velocity + bounce off top/bottom
    makeBehavior(`Write a JavaScript function body that bounces an object off horizontal boundaries.

Arguments available: obj, H, S
- obj has properties: y (number), vy (number), h (number)
- H: canvas height
- S: scale factor

Rules:
- var halfH = obj.h * S / 2
- If obj.y - halfH < 0: set obj.y = halfH, set obj.vy = Math.abs(obj.vy)
- If obj.y + halfH > H: set obj.y = H - halfH, set obj.vy = -Math.abs(obj.vy)

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'Bounce'),

    // Cell 10: Collision with pushout
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

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'Collision'),

    // Cell 11: Edge scoring
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

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'EdgeScore'),

    // Cell 12: Velocity integrator
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

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'Integrator'),
  ]);
  cost += inputVel.cost + aiTrack.cost + autoMove.cost + collision.cost + edgeScore.cost + integrator.cost;

  // ASSEMBLY
  console.log('\n[ASSEMBLY]');
  const engine = fs.readFileSync(ENGINE, 'utf8');

  // Consistent scale: all drawing uses w*S, h*S (no *2 multiplier)
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Blind Pong</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#111}canvas{display:block;touch-action:none;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas><script>
${engine}

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H, S;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; S = Math.min(W,H)/600; }
resize(); addEventListener('resize', resize);

${buildSprite(sA.drawBody, 12, 48, cA.colors, 'spriteA')}
${buildSprite(sB.drawBody, 12, 48, cB.colors, 'spriteB')}
${buildSprite(sC.drawBody, 16, 16, cC.colors, 'spriteC')}

// Scale factor for drawing — matches collision math
var DS = 3;

// State — all movement through velocity
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

// Blind cell outputs — pure functions
var setVelocity = function(obj, S, inputState) { ${inputVel.code} };
var trackTarget = function(obj, targetY, S, dt) { ${aiTrack.code} };
var bounce = function(obj, H, S) { ${autoMove.code} };
var collide = function(a, b, S) { ${collision.code} };
var checkEdge = function(obj, W, S) { ${edgeScore.code} };
var integrate = function(obj, dt, H, S) { ${integrator.code} };

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

  // Behaviors — each from a blind cell
  setVelocity(a, S, inputState);          // cell 7: input → velocity
  trackTarget(b, c.y, S, dt);             // cell 8: AI tracks ball y
  collide(c, a, S);                       // cell 10: ball vs rect A
  collide(c, b, S);                       // cell 10: ball vs rect B
  integrate(a, dt, H, S);                 // cell 12: apply velocity (paddles)
  integrate(b, dt, H, S);                 // cell 12: apply velocity (paddles)
  c.x += c.vx * dt;                      // ball: integrate without y-clamp
  c.y += c.vy * dt;
  bounce(c, H, S);                        // cell 9: THEN correct boundaries

  // cell 11: edge scoring
  var edge = checkEdge(c, W, S);
  if (edge === 'left-edge') { scoreRight++; resetBall(); }
  if (edge === 'right-edge') { scoreLeft++; resetBall(); }

  // Draw — consistent scale
  ctx.drawImage(spriteA, a.x - a.w*S/2, a.y - a.h*S/2, a.w*S, a.h*S);
  ctx.drawImage(spriteB, b.x - b.w*S/2, b.y - b.h*S/2, b.w*S, b.h*S);
  ctx.drawImage(spriteC, c.x - c.w*S/2, c.y - c.h*S/2, c.w*S, c.h*S);

  // Center line
  ctx.setLineDash([8*S, 8*S]);
  ctx.strokeStyle = '#444'; ctx.lineWidth = 2*S;
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
  ctx.setLineDash([]);

  // Score
  ctx.fillStyle = '#fff'; ctx.font = Math.round(48*S)+'px monospace'; ctx.textAlign = 'center';
  ctx.fillText(scoreLeft + '   ' + scoreRight, W/2, 60*S);

  ctx.font = Math.round(14*S)+'px monospace';
  ctx.fillText('Arrow Up/Down to move', W/2, H - 20*S);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script></body></html>`;

  var outDir = path.join(__dirname, 'output', 'blind-pong');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);

  var elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== COMPLETE: ${elapsed}s, $${cost.toFixed(4)} ===`);
  console.log(`12 blind cells → Pong`);
  console.log(`Output: ${outDir}/index.html`);

  // Self-verify: check the HTML for domain leakage
  console.log('\n[SELF-VERIFY: blindness check]');
  const cellPrompts = [
    inputVel.code, aiTrack.code, autoMove.code,
    collision.code, edgeScore.code, integrator.code,
  ];
  const gameWords = ['game', 'pong', 'paddle', 'ball', 'player', 'enemy', 'score', 'level'];
  let leaks = 0;
  for (const code of cellPrompts) {
    for (const word of gameWords) {
      if (code.toLowerCase().includes(word)) {
        console.log(`  LEAK: cell output contains "${word}"`);
        leaks++;
      }
    }
  }
  if (leaks === 0) console.log('  No domain vocabulary in any cell output');
  else console.log(`  ${leaks} leaks found — blindness compromised`);
}

run().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
