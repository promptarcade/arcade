#!/usr/bin/env node
// ============================================================
// 10x Reliability Test — does the blind cell architecture work?
// ============================================================
// Runs the 3-cell test 10 times with zero intervention.
// Records: success/fail, time, cost, any error message.
// No fixes, no retries beyond what's built into each cell (3 max).

const fs = require('fs');
const path = require('path');
const { callClaudeAsync } = require('../claude-worker');
const jsSyntax = require('../validators/js-syntax');
const canvasCheck = require('../validators/canvas-check');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

async function runOnce(runId) {
  const start = Date.now();
  let cost = 0;
  const errors = [];

  // CELL 1: Color
  let colors;
  try {
    const r = await callClaudeAsync({
      prompt: 'Generate a 4-color palette for: "warm sunset orange". Output base, light, dark, accent as hex.',
      systemPrompt: 'You are a color generator. Output only JSON with hex color values.',
      schema: {
        type: 'object',
        properties: { base: { type: 'string' }, light: { type: 'string' }, dark: { type: 'string' }, accent: { type: 'string' } },
        required: ['base', 'light', 'dark', 'accent'],
      },
      model: 'haiku', budgetUsd: 0.05,
    });
    colors = r.data;
    cost += r.cost;
    if (!Object.values(colors).every(c => /^#[0-9A-Fa-f]{6}$/.test(c))) {
      return { run: runId, success: false, error: 'Cell 1: invalid hex', time: Date.now() - start, cost };
    }
  } catch (e) {
    return { run: runId, success: false, error: 'Cell 1: ' + e.message.slice(0, 100), time: Date.now() - start, cost };
  }

  // CELL 2: Shape
  let drawBody;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `Draw a 20x20 filled circle on a PixelCanvas.
Colors: base="${colors.base}", light="${colors.light}", dark="${colors.dark}", accent="${colors.accent}"
API: pc.fillCircle(cx, cy, r, idx), pc.fillRect(x,y,w,h,idx), pc.setPixel(x,y,idx)
Color index: pal.groups.base.startIdx + (0=dark,1=mid,2=light,3=brightest)
Canvas: 20x20, origin top-left.
Fill the circle centered at (10,10) with radius 8-9. Use shading: lighter top-left, darker bottom-right.
Output drawBody: the drawing code as a string.`,
        systemPrompt: 'You are a pixel renderer. Draw the described shape. Output only JSON.',
        schema: { type: 'object', properties: { drawBody: { type: 'string' } }, required: ['drawBody'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      cost += r.cost;
      const render = canvasCheck.validateSprite(r.data.drawBody, '', 20, 20, colors);
      if (render.valid) { drawBody = r.data.drawBody; break; }
    } catch (e) { /* retry */ }
  }
  if (!drawBody) {
    return { run: runId, success: false, error: 'Cell 2: failed after 3 attempts', time: Date.now() - start, cost };
  }

  // CELL 3: Motion
  let motionCode;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
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
        model: 'haiku', budgetUsd: 0.05,
      });
      cost += r.cost;
      const syntax = jsSyntax.validate(r.data.code, { wrapInFunction: true });
      if (syntax.valid) { motionCode = r.data.code; break; }
    } catch (e) { /* retry */ }
  }
  if (!motionCode) {
    return { run: runId, success: false, error: 'Cell 3: failed after 3 attempts', time: Date.now() - start, cost };
  }

  // ASSEMBLY
  try {
    const engine = fs.readFileSync(ENGINE, 'utf8');
    const palDef = Object.entries(colors).map(([k,v]) => `'${k}':'${v}'`).join(',');
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Cell Test Run ${runId}</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#111}canvas{display:block;touch-action:none;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas><script>
${engine}
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H, S;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; S = Math.min(W,H)/600; }
resize(); addEventListener('resize', resize);
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
var obj = { x: W/2, y: H/2 };
var inputState = { keys: {} };
addEventListener('keydown', function(e) { inputState.keys[e.key] = true; });
addEventListener('keyup', function(e) { inputState.keys[e.key] = false; });
canvas.addEventListener('touchstart', function(e) { e.preventDefault(); obj.x = e.touches[0].clientX; obj.y = e.touches[0].clientY; });
canvas.addEventListener('touchmove', function(e) { e.preventDefault(); obj.x = e.touches[0].clientX; obj.y = e.touches[0].clientY; });
var move = function(obj, dt, W, H, S, inputState) { ${motionCode} };
var last = 0;
function loop(t) {
  var dt = Math.min((t - last) / 1000, 0.05); last = t;
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
  move(obj, dt, W, H, S, inputState);
  var sz = 20 * S * 2;
  ctx.drawImage(spriteCvs, obj.x - sz/2, obj.y - sz/2, sz, sz);
  ctx.fillStyle = '#fff'; ctx.font = Math.round(16*S)+'px monospace';
  ctx.fillText('Run ${runId} — Arrow keys to move', 10, 30*S);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script></body></html>`;

    const outDir = path.join(__dirname, 'output', 'reliability-test');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `run-${runId}.html`), html);
  } catch (e) {
    return { run: runId, success: false, error: 'Assembly: ' + e.message.slice(0, 100), time: Date.now() - start, cost };
  }

  return { run: runId, success: true, error: null, time: Date.now() - start, cost };
}

async function main() {
  console.log('='.repeat(60));
  console.log('10x RELIABILITY TEST — blind cell architecture');
  console.log('Same prompt, same code, zero intervention');
  console.log('='.repeat(60));

  const results = [];

  for (let i = 1; i <= 10; i++) {
    console.log(`\n--- Run ${i}/10 ---`);
    const r = await runOnce(i);
    results.push(r);
    console.log(`  ${r.success ? 'SUCCESS' : 'FAIL'} — ${(r.time/1000).toFixed(1)}s, $${r.cost.toFixed(4)}${r.error ? ' — ' + r.error : ''}`);
  }

  // Summary
  const successes = results.filter(r => r.success).length;
  const totalTime = results.reduce((s, r) => s + r.time, 0);
  const totalCost = results.reduce((s, r) => s + r.cost, 0);

  console.log('\n' + '='.repeat(60));
  console.log('RESULTS');
  console.log(`  Success: ${successes}/10 (${successes * 10}%)`);
  console.log(`  Total time: ${(totalTime/1000).toFixed(1)}s`);
  console.log(`  Total cost: $${totalCost.toFixed(4)}`);
  console.log(`  Avg time per run: ${(totalTime/10000).toFixed(1)}s`);
  console.log(`  Avg cost per run: $${(totalCost/10).toFixed(4)}`);

  if (successes < 10) {
    console.log('\n  Failures:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`    Run ${r.run}: ${r.error}`);
    });
  }
  console.log('='.repeat(60));

  // Save results
  const outDir = path.join(__dirname, 'output', 'reliability-test');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${outDir}/results.json`);
  console.log(`HTML outputs: ${outDir}/run-1.html through run-${successes > 0 ? 10 : 0}.html`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
