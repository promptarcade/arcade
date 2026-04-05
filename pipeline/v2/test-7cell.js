#!/usr/bin/env node
// ============================================================
// 7-Cell Test — three shapes, autonomous movement + collision
// ============================================================
// Cell 1-3: Color palettes (orange circle, blue rect, green circle)
// Cell 4-6: Shapes (circle A, rectangle B, circle C)
// Cell 7: Motion (arrow keys move shape A)
// Cell 8: Autonomous motion (shape C moves at constant velocity, bounces off top/bottom edges)
// Cell 9: Collision (reverse moving shape's x-velocity when overlapping rectangle)
// Assembly: dumb code applies collision to BOTH circles vs rectangle
//
// If circle C bounces off the rectangle autonomously while
// circle A is player-controlled, we have emergent multi-agent
// interaction from fully blind cells.

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

async function makeBehavior(prompt, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt,
        systemPrompt: 'You are a code generator. Output only valid JSON with plain JavaScript code. No TypeScript type annotations.',
        schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const syntax = jsSyntax.validate(r.data.code, { wrapInFunction: true });
      if (syntax.valid) {
        console.log(`  ${label}: OK`);
        return { code: r.data.code, cost: r.cost };
      }
      console.log(`  ${label}: attempt ${attempt} — ${syntax.errors[0]}`);
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

  console.log('=== 7-CELL TEST: three shapes, autonomous + player interaction ===\n');

  // COLORS (parallel)
  console.log('[COLORS]');
  const [cA, cB, cC] = await Promise.all([
    makeColor('warm sunset orange'),
    makeColor('cool ocean blue'),
    makeColor('bright lime green'),
  ]);
  cost += cA.cost + cB.cost + cC.cost;
  console.log('  3 palettes OK');

  // SHAPES (parallel)
  console.log('\n[SHAPES]');
  const [sA, sB, sC] = await Promise.all([
    makeShape('filled circle, centered at (10,10) radius 8', 20, 20, cA.colors, 'Circle A'),
    makeShape('filled vertical rectangle with rounded ends, filling most of the canvas', 16, 48, cB.colors, 'Rect B'),
    makeShape('filled circle, centered at (8,8) radius 6', 16, 16, cC.colors, 'Circle C'),
  ]);
  cost += sA.cost + sB.cost + sC.cost;

  // BEHAVIORS (parallel)
  console.log('\n[BEHAVIORS]');
  const [motion, autoMove, collision] = await Promise.all([
    makeBehavior(`Write a JavaScript function body that modifies an object's position based on input state.

Arguments available: obj, dt, W, H, S, inputState
- obj has properties: x (number), y (number)
- dt: seconds elapsed
- W: canvas width, H: canvas height
- S: scale factor
- inputState has property keys: object mapping key names to true/false

Rules:
- If ArrowRight held: obj.x += 300 * S * dt
- If ArrowLeft held: obj.x -= 300 * S * dt
- If ArrowUp held: obj.y -= 300 * S * dt
- If ArrowDown held: obj.y += 300 * S * dt
- Clamp obj.x between 0 and W, obj.y between 0 and H

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'Motion'),

    makeBehavior(`Write a JavaScript function body that moves an object at constant velocity and bounces off horizontal edges.

Arguments available: obj, dt, W, H, S
- obj has properties: x (number), y (number), vx (number), vy (number)
- dt: seconds elapsed
- W: canvas width, H: canvas height
- S: scale factor

Rules:
- Update position: obj.x += obj.vx * S * dt, obj.y += obj.vy * S * dt
- If obj.y < 0 or obj.y > H: reverse obj.vy (multiply by -1), clamp obj.y to 0..H
- If obj.x < 0 or obj.x > W: reverse obj.vx (multiply by -1), clamp obj.x to 0..W

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'AutoMove'),

    makeBehavior(`Write a JavaScript function body that detects overlap between two rectangular areas and reverses the first one's horizontal direction.

Arguments available: a, b, S
- a has properties: x, y (center position), w, h (dimensions), vx (horizontal velocity)
- b has properties: x, y (center position), w, h (dimensions)
- S: scale factor (multiply dimensions by S for pixel size)

Rules:
- Two rectangles overlap if horizontal distance between centers < (a.w*S + b.w*S)/2 AND vertical distance < (a.h*S + b.h*S)/2
- If overlap: multiply a.vx by -1
- Return true if collision occurred, false otherwise

Output function body only. No function declaration. No TypeScript. Plain JavaScript.`, 'Collision'),
  ]);
  cost += motion.cost + autoMove.cost + collision.cost;

  // ASSEMBLY
  console.log('\n[ASSEMBLY]');
  const engine = fs.readFileSync(ENGINE, 'utf8');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>7-Cell Interaction Test</title>
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
${buildSprite(sC.drawBody, 16, 16, cC.colors, 'spriteC')}

// State
var a = { x: W * 0.2, y: H / 2, w: 20, h: 20, vx: 0, vy: 0 };
var b = { x: W * 0.5, y: H / 2, w: 16, h: 48, vx: 0, vy: 0 };
var c = { x: W * 0.8, y: H * 0.3, w: 16, h: 16, vx: 180, vy: 130 };
var inputState = { keys: {} };
var bounces = 0;

addEventListener('keydown', function(e) { inputState.keys[e.key] = true; });
addEventListener('keyup', function(e) { inputState.keys[e.key] = false; });

var move = function(obj, dt, W, H, S, inputState) { ${motion.code} };
var autoMove = function(obj, dt, W, H, S) { ${autoMove.code} };
var collide = function(a, b, S) { ${collision.code} };

var last = 0;
function loop(t) {
  var dt = Math.min((t - last) / 1000, 0.05); last = t;
  ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, H);

  // Behaviors
  move(a, dt, W, H, S, inputState);
  autoMove(c, dt, W, H, S);
  if (collide(a, b, S)) bounces++;
  if (collide(c, b, S)) bounces++;

  // Draw
  var szA = 20*S*2;
  ctx.drawImage(spriteA, a.x - szA/2, a.y - szA/2, szA, szA);
  var szBw = 16*S*2, szBh = 48*S*2;
  ctx.drawImage(spriteB, b.x - szBw/2, b.y - szBh/2, szBw, szBh);
  var szC = 16*S*2;
  ctx.drawImage(spriteC, c.x - szC/2, c.y - szC/2, szC, szC);

  ctx.fillStyle = '#fff'; ctx.font = Math.round(16*S)+'px monospace';
  ctx.fillText('Arrow keys move orange circle. Green moves on its own.', 10, 30*S);
  ctx.fillText('Collisions with blue rectangle: ' + bounces, 10, 55*S);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script></body></html>`;

  var outDir = path.join(__dirname, 'output', '7cell-test');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);

  var elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== COMPLETE: ${elapsed}s, $${cost.toFixed(4)} ===`);
  console.log(`9 blind cells, 3 shapes, 3 behaviors`);
  console.log(`Output: ${outDir}/index.html`);
}

run().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
