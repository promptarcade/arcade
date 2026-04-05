#!/usr/bin/env node
// ============================================================
// Step 4: Consistent interface contract
// ============================================================
// All shapes move via velocity. Input modifies velocity, not position.
// Collision reverses velocity. This should work for ALL shapes.
//
// Cells:
//   1-2: Colors (orange, blue)
//   3-4: Shapes (circle, rectangle)
//   5: Input-to-velocity (arrow keys set circle's velocity)
//   6: Collision (reverse vx when overlapping)
//   7: Velocity integrator (applies vx/vy to position, shared by all)
//
// The key change: cell 5 sets VELOCITY, not position.
// Cell 7 is a generic integrator applied to all moving shapes.
// Collision cell reverses velocity, which the integrator then applies.

const fs = require('fs');
const path = require('path');
const { callClaudeAsync } = require('../claude-worker');
const jsSyntax = require('../validators/js-syntax');
const canvasCheck = require('../validators/canvas-check');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

async function makeColor(theme) {
  const r = await callClaudeAsync({
    prompt: `Generate a 4-color palette for: "${theme}". Output base, light, dark, accent as hex.`,
    systemPrompt: 'You are a color generator. Output only JSON with hex color values.',
    schema: { type: 'object', properties: { base: {type:'string'}, light: {type:'string'}, dark: {type:'string'}, accent: {type:'string'} }, required: ['base','light','dark','accent'] },
    model: 'haiku', budgetUsd: 0.05,
  });
  if (!Object.values(r.data).every(c => /^#[0-9A-Fa-f]{6}$/.test(c))) throw new Error('Invalid hex');
  return { colors: r.data, cost: r.cost };
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
        console.log(`  ${label}: OK (coverage ${render.coverage}%)`);
        return { drawBody: r.data.drawBody, cost: r.cost };
      }
      console.log(`  ${label}: attempt ${attempt} — ${render.errors[0]}`);
    } catch (e) {
      console.log(`  ${label}: attempt ${attempt} error`);
    }
  }
  throw new Error(`${label} failed after 3 attempts`);
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
      // Contract checks: verify the code references required patterns
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
  throw new Error(`${label} failed after 3 attempts`);
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

  console.log('=== STEP 4: Consistent interface contract ===\n');

  // COLORS
  console.log('[COLORS]');
  const [cA, cB] = await Promise.all([
    makeColor('warm sunset orange'),
    makeColor('cool ocean blue'),
  ]);
  cost += cA.cost + cB.cost;
  console.log('  2 palettes OK');

  // SHAPES
  console.log('\n[SHAPES]');
  const [sA, sB] = await Promise.all([
    makeShape('filled circle, centered at (10,10) radius 8', 20, 20, cA.colors, 'Circle'),
    makeShape('filled vertical rectangle, filling most of the canvas', 16, 48, cB.colors, 'Rectangle'),
  ]);
  cost += sA.cost + sB.cost;

  // BEHAVIORS
  console.log('\n[BEHAVIORS]');
  const [inputVel, collision, integrator] = await Promise.all([
    makeBehavior(`Write a JavaScript function body that sets an object's velocity based on input state.

Arguments available: obj, S, inputState
- obj has properties: vx (number), vy (number)
- S: scale factor
- inputState has property keys: object mapping key names to true/false

Rules:
- Set obj.vx to 0 and obj.vy to 0 first (reset each frame)
- If ArrowRight held: obj.vx = 300 * S
- If ArrowLeft held: obj.vx = -300 * S
- If ArrowUp held: obj.vy = -300 * S
- If ArrowDown held: obj.vy = 300 * S

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'InputVelocity', ['inputState.keys']),

    makeBehavior(`Write a JavaScript function body that detects overlap between two rectangular areas and reverses the first one's horizontal velocity.

Arguments available: a, b, S
- a has properties: x, y (center position), w, h (dimensions), vx (horizontal velocity)
- b has properties: x, y (center position), w, h (dimensions)
- S: scale factor (multiply dimensions by S for pixel size)

Rules:
- Two rectangles overlap if Math.abs(a.x - b.x) < (a.w*S + b.w*S)/2 AND Math.abs(a.y - b.y) < (a.h*S + b.h*S)/2
- If overlap: set a.vx = -a.vx
- Return true if collision occurred, false otherwise

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'Collision'),

    makeBehavior(`Write a JavaScript function body that updates an object's position from its velocity and clamps to bounds.

Arguments available: obj, dt, W, H
- obj has properties: x, y, vx, vy (all numbers)
- dt: seconds elapsed
- W: max x bound, H: max y bound

Rules:
- obj.x += obj.vx * dt
- obj.y += obj.vy * dt
- Clamp: obj.x = Math.max(0, Math.min(W, obj.x))
- Clamp: obj.y = Math.max(0, Math.min(H, obj.y))

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'Integrator'),
  ]);
  cost += inputVel.cost + collision.cost + integrator.cost;

  // ASSEMBLY
  console.log('\n[ASSEMBLY]');
  const engine = fs.readFileSync(ENGINE, 'utf8');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Step 4: Interface Contract</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#222}canvas{display:block;touch-action:none;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas><script>
${engine}

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H, S;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; S = Math.min(W,H)/600; }
resize(); addEventListener('resize', resize);

${buildSprite(sA.drawBody, 20, 20, cA.colors, 'spriteA')}
${buildSprite(sB.drawBody, 16, 48, cB.colors, 'spriteB')}

// State — ALL movement through velocity
var a = { x: W * 0.3, y: H / 2, w: 20, h: 20, vx: 0, vy: 0 };
var b = { x: W * 0.65, y: H / 2, w: 16, h: 48, vx: 0, vy: 0 };
var inputState = { keys: {} };
var bounces = 0;

addEventListener('keydown', function(e) { inputState.keys[e.key] = true; });
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

// Cell outputs — pure functions
var setVelocity = function(obj, S, inputState) { ${inputVel.code} };
var collide = function(a, b, S) { ${collision.code} };
var integrate = function(obj, dt, W, H) { ${integrator.code} };

var last = 0;
function loop(t) {
  var dt = Math.min((t - last) / 1000, 0.05); last = t;
  ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, H);

  // 1. Input → velocity (cell 5)
  setVelocity(a, S, inputState);

  // 2. Collision → velocity reversal (cell 6)
  var prevVx = a.vx;
  if (collide(a, b, S)) {
    bounces++;
    // Push circle out of rectangle to prevent repeated triggers
    if (a.x < b.x) a.x = b.x - (a.w*S + b.w*S)/2 - 1;
    else a.x = b.x + (a.w*S + b.w*S)/2 + 1;
  }

  // 3. Velocity → position (cell 7)
  integrate(a, dt, W, H);

  // Draw
  var szA = 20*S*2;
  ctx.drawImage(spriteA, a.x - szA/2, a.y - szA/2, szA, szA);
  var szBw = 16*S*2, szBh = 48*S*2;
  ctx.drawImage(spriteB, b.x - szBw/2, b.y - szBh/2, szBw, szBh);

  ctx.fillStyle = '#fff'; ctx.font = Math.round(16*S)+'px monospace';
  ctx.fillText('Arrow keys move circle. Should bounce off rectangle.', 10, 30*S);
  ctx.fillText('Bounces: ' + bounces, 10, 55*S);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script></body></html>`;

  var outDir = path.join(__dirname, 'output', 'step4-contract');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);

  var elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== COMPLETE: ${elapsed}s, $${cost.toFixed(4)} ===`);
  console.log(`Output: ${outDir}/index.html`);
}

run().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
