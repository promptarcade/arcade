#!/usr/bin/env node
// ============================================================
// 4-Cell Test — two shapes interacting through blind cells
// ============================================================
// Cell 1: Color palette for shape A
// Cell 2: Color palette for shape B
// Cell 3: Shape A (circle, 20x20)
// Cell 4: Shape B (rectangle, 16x48)
// Cell 5: Motion (move circle with arrow keys)
// Cell 6: Collision (reverse circle x-velocity when overlapping rectangle)
// Assembly: dumb code
//
// Actually 6 cells. The point: can blind cells produce emergent
// interaction between two shapes that no single cell knows about?

const fs = require('fs');
const path = require('path');
const { callClaudeAsync } = require('../claude-worker');
const jsSyntax = require('../validators/js-syntax');
const canvasCheck = require('../validators/canvas-check');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

async function run() {
  const start = Date.now();
  let cost = 0;

  console.log('=== 4-CELL TEST: two shapes, blind interaction ===\n');

  // CELL 1 + 2: Two color palettes (parallel)
  console.log('[CELLS 1+2: COLORS]');
  const [colorA, colorB] = await Promise.all([
    callClaudeAsync({
      prompt: 'Generate a 4-color palette for: "warm sunset orange". Output base, light, dark, accent as hex.',
      systemPrompt: 'You are a color generator. Output only JSON with hex color values.',
      schema: { type: 'object', properties: { base: {type:'string'}, light: {type:'string'}, dark: {type:'string'}, accent: {type:'string'} }, required: ['base','light','dark','accent'] },
      model: 'haiku', budgetUsd: 0.05,
    }),
    callClaudeAsync({
      prompt: 'Generate a 4-color palette for: "cool ocean blue". Output base, light, dark, accent as hex.',
      systemPrompt: 'You are a color generator. Output only JSON with hex color values.',
      schema: { type: 'object', properties: { base: {type:'string'}, light: {type:'string'}, dark: {type:'string'}, accent: {type:'string'} }, required: ['base','light','dark','accent'] },
      model: 'haiku', budgetUsd: 0.05,
    }),
  ]);
  cost += colorA.cost + colorB.cost;

  const colorsA = colorA.data, colorsB = colorB.data;
  if (!Object.values(colorsA).every(c => /^#[0-9A-Fa-f]{6}$/.test(c))) { console.log('CELL 1: FAIL'); process.exit(1); }
  if (!Object.values(colorsB).every(c => /^#[0-9A-Fa-f]{6}$/.test(c))) { console.log('CELL 2: FAIL'); process.exit(1); }
  console.log('  Color A:', JSON.stringify(colorsA));
  console.log('  Color B:', JSON.stringify(colorsB));

  // CELL 3 + 4: Two shapes (with retries)
  console.log('\n[CELLS 3+4: SHAPES]');

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
        cost += r.cost;
        const render = canvasCheck.validateSprite(r.data.drawBody, '', w, h, colors);
        if (render.valid) {
          console.log(`  ${label}: OK (coverage ${render.coverage}%)`);
          return r.data.drawBody;
        }
        console.log(`  ${label}: attempt ${attempt} failed — ${render.errors[0]}`);
      } catch (e) {
        console.log(`  ${label}: attempt ${attempt} error — ${e.message.slice(0, 80)}`);
      }
    }
    return null;
  }

  const [drawA, drawB] = await Promise.all([
    makeShape('filled circle, centered at (10,10) with radius 8-9', 20, 20, colorsA, 'Shape A'),
    makeShape('filled vertical rectangle with rounded ends, filling most of the canvas', 16, 48, colorsB, 'Shape B'),
  ]);
  if (!drawA) { console.log('Shape A FAIL after 3 attempts'); process.exit(1); }
  if (!drawB) { console.log('Shape B FAIL after 3 attempts'); process.exit(1); }
  const shapeA = { data: { drawBody: drawA } };
  const shapeB = { data: { drawBody: drawB } };

  // CELL 5 + 6: Motion + Collision (parallel)
  console.log('\n[CELLS 5+6: BEHAVIORS]');
  const [motionResult, collisionResult] = await Promise.all([
    callClaudeAsync({
      prompt: `Write a JavaScript function body that modifies an object's position based on input state.

Arguments available: obj, dt, W, H, S, inputState
- obj has properties: x (number), y (number)
- dt: seconds elapsed (number)
- W: canvas width, H: canvas height
- S: scale factor (multiply speeds by this)
- inputState has property keys: an object where key names are strings mapped to true/false

Rules:
- If ArrowRight key held: obj.x += 300 * S * dt
- If ArrowLeft key held: obj.x -= 300 * S * dt
- If ArrowUp key held: obj.y -= 300 * S * dt
- If ArrowDown key held: obj.y += 300 * S * dt
- Clamp: obj.x = Math.max(0, Math.min(W, obj.x))
- Clamp: obj.y = Math.max(0, Math.min(H, obj.y))

Output the function body only. No function declaration. No TypeScript. Plain JavaScript.`,
      systemPrompt: 'You are a code generator. Output only valid JSON with plain JavaScript code. No TypeScript type annotations.',
      schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
      model: 'haiku', budgetUsd: 0.05,
    }),
    callClaudeAsync({
      prompt: `Write a JavaScript function body that detects overlap between two rectangular areas and reverses the first one's horizontal direction.

Arguments available: a, b, S
- a has properties: x, y (center position), w, h (dimensions), vx (horizontal velocity, number)
- b has properties: x, y (center position), w, h (dimensions)
- S: scale factor (dimensions are multiplied by S for actual pixel size)

Rules:
- Calculate overlap: two rectangles overlap if the horizontal distance between centers is less than (a.w*S + b.w*S)/2 AND the vertical distance between centers is less than (a.h*S + b.h*S)/2
- If they overlap AND a.vx has not already been reversed this frame: multiply a.vx by -1
- Return true if collision occurred, false otherwise

Output the function body only. No function declaration. No TypeScript. Plain JavaScript.`,
      systemPrompt: 'You are a code generator. Output only valid JSON with plain JavaScript code. No TypeScript type annotations.',
      schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
      model: 'haiku', budgetUsd: 0.05,
    }),
  ]);
  cost += motionResult.cost + collisionResult.cost;

  const motionSyntax = jsSyntax.validate(motionResult.data.code, { wrapInFunction: true });
  const collisionSyntax = jsSyntax.validate(collisionResult.data.code, { wrapInFunction: true });
  if (!motionSyntax.valid) { console.log('  Motion FAIL:', motionSyntax.errors[0]); process.exit(1); }
  if (!collisionSyntax.valid) { console.log('  Collision FAIL:', collisionSyntax.errors[0]); process.exit(1); }
  console.log('  Motion: OK');
  console.log('  Collision: OK');

  // ASSEMBLY
  console.log('\n[ASSEMBLY]');
  const engine = fs.readFileSync(ENGINE, 'utf8');
  const palDefA = Object.entries(colorsA).map(([k,v]) => `'${k}':'${v}'`).join(',');
  const palDefB = Object.entries(colorsB).map(([k,v]) => `'${k}':'${v}'`).join(',');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>4-Cell Interaction Test</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#222}canvas{display:block;touch-action:none;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas><script>
${engine}

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H, S;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; S = Math.min(W,H)/600; }
resize(); addEventListener('resize', resize);

// Shape A: circle
var palA = ColorRamp.buildPalette({${palDefA}});
palA.palette[255] = sf2_packRGBA(20, 15, 10, 255);
var pcA = new PixelCanvas(20, 20);
(function(pc, pal) { ${shapeA.data.drawBody} })(pcA, palA);
try { PostProcess.applyShading(pcA, palA, { lightAngle: Math.PI * 0.75 }); } catch(e) {}
var spriteA = document.createElement('canvas');
spriteA.width = 20; spriteA.height = 20;
var ctxA = spriteA.getContext('2d');
var imgA = ctxA.createImageData(20, 20);
for (var y = 0; y < 20; y++) for (var x = 0; x < 20; x++) {
  var idx = pcA.pixels[y*20+x], rgba = palA.palette[idx]||0, pi = (y*20+x)*4;
  imgA.data[pi]=rgba&0xFF; imgA.data[pi+1]=(rgba>>8)&0xFF; imgA.data[pi+2]=(rgba>>16)&0xFF; imgA.data[pi+3]=(rgba>>24)&0xFF;
}
ctxA.putImageData(imgA, 0, 0);

// Shape B: rectangle
var palB = ColorRamp.buildPalette({${palDefB}});
palB.palette[255] = sf2_packRGBA(20, 15, 10, 255);
var pcB = new PixelCanvas(16, 48);
(function(pc, pal) { ${shapeB.data.drawBody} })(pcB, palB);
try { PostProcess.applyShading(pcB, palB, { lightAngle: Math.PI * 0.75 }); } catch(e) {}
var spriteB = document.createElement('canvas');
spriteB.width = 16; spriteB.height = 48;
var ctxB = spriteB.getContext('2d');
var imgB = ctxB.createImageData(16, 48);
for (var y = 0; y < 48; y++) for (var x = 0; x < 16; x++) {
  var idx = pcB.pixels[y*16+x], rgba = palB.palette[idx]||0, pi = (y*16+x)*4;
  imgB.data[pi]=rgba&0xFF; imgB.data[pi+1]=(rgba>>8)&0xFF; imgB.data[pi+2]=(rgba>>16)&0xFF; imgB.data[pi+3]=(rgba>>24)&0xFF;
}
ctxB.putImageData(imgB, 0, 0);

// State
var a = { x: W * 0.3, y: H / 2, w: 20, h: 20, vx: 0 };
var b = { x: W * 0.7, y: H / 2, w: 16, h: 48 };
var inputState = { keys: {} };
var bounceCount = 0;

// Input
addEventListener('keydown', function(e) { inputState.keys[e.key] = true; });
addEventListener('keyup', function(e) { inputState.keys[e.key] = false; });
canvas.addEventListener('touchstart', function(e) { e.preventDefault(); a.x = e.touches[0].clientX; a.y = e.touches[0].clientY; });
canvas.addEventListener('touchmove', function(e) { e.preventDefault(); a.x = e.touches[0].clientX; a.y = e.touches[0].clientY; });

// Motion (from blind cell 5)
var move = function(obj, dt, W, H, S, inputState) { ${motionResult.data.code} };

// Collision (from blind cell 6)
var collide = function(a, b, S) { ${collisionResult.data.code} };

// Loop
var last = 0;
function loop(t) {
  var dt = Math.min((t - last) / 1000, 0.05); last = t;
  ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, H);

  move(a, dt, W, H, S, inputState);
  if (collide(a, b, S)) bounceCount++;

  var szA = 20 * S * 2;
  ctx.drawImage(spriteA, a.x - szA/2, a.y - szA/2, szA, szA);

  var szBw = 16 * S * 2, szBh = 48 * S * 2;
  ctx.drawImage(spriteB, b.x - szBw/2, b.y - szBh/2, szBw, szBh);

  ctx.fillStyle = '#fff'; ctx.font = Math.round(16*S)+'px monospace';
  ctx.fillText('Arrow keys to move circle into rectangle', 10, 30*S);
  ctx.fillText('Collisions: ' + bounceCount, 10, 55*S);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script></body></html>`;

  var outDir = path.join(__dirname, 'output', '4cell-test');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);

  var elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== COMPLETE: ${elapsed}s, $${cost.toFixed(4)} ===`);
  console.log(`6 blind cells, 2 shapes, 1 interaction`);
  console.log(`Output: ${outDir}/index.html`);
}

run().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
