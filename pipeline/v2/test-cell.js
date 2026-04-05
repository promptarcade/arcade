#!/usr/bin/env node
// ============================================================
// Cell Test — smallest possible proof of blind architecture
// ============================================================
// 3 cells, each truly blind, each binary (success or no output).
// If the result is a moving colored shape, the concept works.

const fs = require('fs');
const path = require('path');
const { callClaudeAsync, callClaude } = require('../claude-worker');
const jsSyntax = require('../validators/js-syntax');
const canvasCheck = require('../validators/canvas-check');

const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

async function runTest() {
  const start = Date.now();
  let cost = 0;

  console.log('=== CELL TEST: 3 blind cells → moving shape ===\n');

  // CELL 1: Color
  console.log('[CELL 1: COLOR]');
  const colorResult = callClaude({
    prompt: 'Generate a 4-color palette for: "warm sunset orange". Output base, light, dark, accent as hex.',
    systemPrompt: 'You are a color generator. Output only JSON with hex color values.',
    schema: {
      type: 'object',
      properties: {
        base: { type: 'string' }, light: { type: 'string' },
        dark: { type: 'string' }, accent: { type: 'string' },
      },
      required: ['base', 'light', 'dark', 'accent'],
    },
    model: 'haiku',
    budgetUsd: 0.05,
  });
  const colors = colorResult.data;
  cost += colorResult.cost;

  // Binary check: are these valid hex colors?
  const validHex = Object.values(colors).every(c => /^#[0-9A-Fa-f]{6}$/.test(c));
  if (!validHex) { console.log('CELL 1: FAIL — invalid hex'); process.exit(1); }
  console.log('CELL 1: SUCCESS —', JSON.stringify(colors));

  // CELL 2: Shape
  console.log('\n[CELL 2: SHAPE]');
  const shapeResult = await callClaudeAsync({
    prompt: `Draw a 20x20 filled circle on a PixelCanvas.
Colors: base="${colors.base}", light="${colors.light}", dark="${colors.dark}", accent="${colors.accent}"
API: pc.fillCircle(cx, cy, r, idx), pc.fillRect(x,y,w,h,idx), pc.setPixel(x,y,idx)
Color index: pal.groups.base.startIdx + (0=dark,1=mid,2=light,3=brightest)
Canvas: 20x20, origin top-left.
Fill the circle centered at (10,10) with radius 8-9. Use shading: lighter top-left, darker bottom-right.
Output drawBody: the drawing code as a string.`,
    systemPrompt: 'You are a pixel renderer. Draw the described shape. Output only JSON.',
    schema: { type: 'object', properties: { drawBody: { type: 'string' } }, required: ['drawBody'] },
    model: 'haiku',
    budgetUsd: 0.05,
  });
  const drawBody = shapeResult.data.drawBody;
  cost += shapeResult.cost;

  // Binary check: does it render?
  const render = canvasCheck.validateSprite(drawBody, '', 20, 20, colors);
  if (!render.valid) { console.log('CELL 2: FAIL —', render.errors[0]); process.exit(1); }
  console.log('CELL 2: SUCCESS — coverage:', render.coverage + '%');

  // CELL 3: Motion
  console.log('\n[CELL 3: MOTION]');
  let finalMotionCode = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`  Attempt ${attempt}/3...`);
    try {
      const motionResult = await callClaudeAsync({
        prompt: `Write a JavaScript function body that modifies an object's position based on input state.

Arguments available: obj, dt, W, H, S, inputState
- obj has properties: x (number), y (number)
- dt: seconds elapsed (number)
- W: canvas width, H: canvas height
- S: scale factor (multiply speeds by this)
- inputState has property keys: an object where key names are strings mapped to true/false (e.g. inputState.keys.ArrowRight === true means right is held)

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
        model: 'haiku',
        budgetUsd: 0.05,
      });
      cost += motionResult.cost;

      const syntax = jsSyntax.validate(motionResult.data.code, { wrapInFunction: true });
      if (!syntax.valid) {
        console.log(`  FAIL: ${syntax.errors[0]}`);
        continue;
      }
      finalMotionCode = motionResult.data.code;
      break;
    } catch (err) {
      console.log(`  ERROR: ${err.message.slice(0, 100)}`);
    }
  }
  if (!finalMotionCode) { console.log('CELL 3: FAIL after 3 attempts'); process.exit(1); }
  console.log('CELL 3: SUCCESS');

  // ASSEMBLE (dumb code)
  console.log('\n[ASSEMBLY]');
  const engine = fs.readFileSync(ENGINE, 'utf8');
  const palDef = Object.entries(colors).map(([k,v]) => `'${k}':'${v}'`).join(',');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Cell Test</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#111}canvas{display:block;touch-action:none;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas><script>
${engine}

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H, S;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; S = Math.min(W,H)/600; }
resize(); addEventListener('resize', resize);

// Shape
var pal = ColorRamp.buildPalette({${palDef}});
pal.palette[255] = sf2_packRGBA(20, 15, 10, 255);
var pc = new PixelCanvas(20, 20);
(function(pc, pal) { ${drawBody} })(pc, pal);
try { PostProcess.applyShading(pc, pal, { lightAngle: Math.PI * 0.75 }); } catch(e) {}
var spriteCvs = document.createElement('canvas');
spriteCvs.width = 20; spriteCvs.height = 20;
var sCtx = spriteCvs.getContext('2d');
var img = sCtx.createImageData(20, 20);
for (var y = 0; y < 20; y++) for (var x = 0; x < 20; x++) {
  var idx = pc.pixels[y * 20 + x], rgba = pal.palette[idx] || 0, pi = (y * 20 + x) * 4;
  img.data[pi] = rgba & 0xFF; img.data[pi+1] = (rgba>>8) & 0xFF;
  img.data[pi+2] = (rgba>>16) & 0xFF; img.data[pi+3] = (rgba>>24) & 0xFF;
}
sCtx.putImageData(img, 0, 0);

// State
var obj = { x: W/2, y: H/2 };
var inputState = { keys: {} };

// Input
addEventListener('keydown', function(e) { inputState.keys[e.key] = true; });
addEventListener('keyup', function(e) { inputState.keys[e.key] = false; });
canvas.addEventListener('touchstart', function(e) { e.preventDefault(); obj.x = e.touches[0].clientX; obj.y = e.touches[0].clientY; });
canvas.addEventListener('touchmove', function(e) { e.preventDefault(); obj.x = e.touches[0].clientX; obj.y = e.touches[0].clientY; });

// Motion
var move = function(obj, dt, W, H, S, inputState) { ${finalMotionCode} };

// Loop
var last = 0;
function loop(t) {
  var dt = Math.min((t - last) / 1000, 0.05); last = t;
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
  move(obj, dt, W, H, S, inputState);
  var sz = 20 * S * 2;
  ctx.drawImage(spriteCvs, obj.x - sz/2, obj.y - sz/2, sz, sz);
  ctx.fillStyle = '#fff'; ctx.font = Math.round(16*S)+'px monospace';
  ctx.fillText('Arrow keys to move', 10, 30*S);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script></body></html>`;

  const outDir = path.join(__dirname, 'output', 'cell-test');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== COMPLETE: ${elapsed}s, $${cost.toFixed(4)} ===`);
  console.log('Output:', path.join(outDir, 'index.html'));
}

runTest().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
