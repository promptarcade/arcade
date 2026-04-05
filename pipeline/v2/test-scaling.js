#!/usr/bin/env node
// ============================================================
// Scaling Test — 3 diverse products from one atomic framework
// ============================================================
// Products:
//   1. Breakout  — real-time game (physics domain)
//   2. Sort Viz  — algorithmic (data/array domain)
//   3. Draw Tool — creative tool (freeform input domain)
//
// Shared atom library grows across products. Measures:
//   - Atom reuse rate per product
//   - New atoms required per product
//   - Failure rate by domain
//   - Total library size over time

const fs = require('fs');
const path = require('path');
const { callClaudeAsync } = require('../claude-worker');
const canvasCheck = require('../validators/canvas-check');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

// ── Trinary validation (same as test-atomic.js) ─────────────

function trinaryValidate(code, testCases, argNames) {
  let fn;
  try {
    fn = new Function(...argNames, code);
  } catch (e) {
    return { result: 'NOT_ACTIONED', reason: `Parse: ${e.message}` };
  }
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const inputs = JSON.parse(JSON.stringify(tc.inputs));
      const returned = fn(...inputs);
      if (tc.expectMutations) {
        for (const [p, expected] of Object.entries(tc.expectMutations)) {
          const actual = getPath(inputs[0], p);
          if (!approxEqual(actual, expected))
            return { result: 'FAILURE', reason: `Case ${i+1}: ${p}=${actual}, want ${expected}` };
        }
      }
      if (tc.expectReturn !== undefined) {
        if (!approxEqual(returned, tc.expectReturn))
          return { result: 'FAILURE', reason: `Case ${i+1}: got ${JSON.stringify(returned)}, want ${JSON.stringify(tc.expectReturn)}` };
      }
      if (tc.expectReturnArray) {
        const ra = JSON.stringify(returned);
        const ea = JSON.stringify(tc.expectReturnArray);
        if (ra !== ea)
          return { result: 'FAILURE', reason: `Case ${i+1}: got ${ra}, want ${ea}` };
      }
    } catch (e) {
      return { result: 'NOT_ACTIONED', reason: `Case ${i+1} crash: ${e.message}` };
    }
  }
  return { result: 'SUCCESS' };
}

function getPath(obj, p) { return p.split('.').reduce((o, k) => o?.[k], obj); }
function approxEqual(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 0.1;
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null)
    return JSON.stringify(a) === JSON.stringify(b);
  return a === b;
}

// ── Atom runner ─────────────────────────────────────────────

async function runAtom(spec) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: spec.prompt,
        systemPrompt: 'You are a code generator. Output only valid JSON with a "code" field containing a JavaScript function body. No TypeScript. No function declaration. Just the body.',
        schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const v = trinaryValidate(r.data.code, spec.testCases, spec.argNames);
      if (v.result === 'SUCCESS') {
        return { code: r.data.code, cost: r.cost, result: 'SUCCESS', attempts: attempt };
      }
      console.log(`    ${spec.label}: ${v.result} (${attempt}/3) — ${v.reason}`);
    } catch (e) {
      console.log(`    ${spec.label}: ERROR (${attempt}/3)`);
    }
  }
  throw new Error(`${spec.label} failed after 3 attempts`);
}

// ── Shape cell ──────────────────────────────────────────────

async function makeShape(desc, w, h, colors, label) {
  const palDef = `base="${colors.base}", light="${colors.light}", dark="${colors.dark}", accent="${colors.accent}"`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `Draw a ${w}x${h} ${desc} on a PixelCanvas.\nColors: ${palDef}\nAPI: pc.fillCircle(cx,cy,r,idx), pc.fillRect(x,y,w,h,idx), pc.fillEllipse(cx,cy,rx,ry,idx), pc.setPixel(x,y,idx)\nColor index: pal.groups.base.startIdx + (0=dark,1=mid,2=light,3=brightest)\nCanvas: ${w}x${h}, origin top-left. Fill at least 30% of canvas. Use at least 2 color groups.\nOutput drawBody: drawing code as a string.`,
        systemPrompt: 'You are a pixel renderer. Draw the described shape. Output only JSON.',
        schema: { type: 'object', properties: { drawBody: { type: 'string' } }, required: ['drawBody'] },
        model: 'haiku', budgetUsd: 0.05,
      });
      const render = canvasCheck.validateSprite(r.data.drawBody, '', w, h, colors);
      if (render.valid) return { drawBody: r.data.drawBody, cost: r.cost };
    } catch (e) {}
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

// ════════════════════════════════════════════════════════════
// ATOM LIBRARY — grows across products
// ════════════════════════════════════════════════════════════

const ATOM_LIBRARY = {
  // ── FROM PONG (proven, reused) ──
  clamp: {
    label: 'clamp', domain: 'math',
    prompt: 'Write a JavaScript function body.\nArguments: val, min, max (all numbers).\nReturn the value clamped to [min, max].\nIf val < min, return min. If val > max, return max. Otherwise return val.',
    argNames: ['val', 'min', 'max'],
    testCases: [
      { inputs: [5, 0, 10], expectReturn: 5 },
      { inputs: [-3, 0, 10], expectReturn: 0 },
      { inputs: [15, 0, 10], expectReturn: 10 },
    ],
  },
  integrate: {
    label: 'integrate', domain: 'physics',
    prompt: 'Write a JavaScript function body.\nArguments: obj, dt\n- obj has properties: x, y, vx, vy (all numbers)\n- dt: time step (number)\nAdd vx*dt to x. Add vy*dt to y.',
    argNames: ['obj', 'dt'],
    testCases: [
      { inputs: [{ x: 100, y: 200, vx: 50, vy: -30 }, 0.016], expectMutations: { 'x': 100.8, 'y': 199.52 } },
      { inputs: [{ x: 0, y: 0, vx: 0, vy: 0 }, 1.0], expectMutations: { 'x': 0, 'y': 0 } },
    ],
  },
  bounceVertical: {
    label: 'bounceVertical', domain: 'physics',
    prompt: 'Write a JavaScript function body.\nArguments: obj, minY, maxY\n- obj has properties: y (number), vy (number)\nIf obj.y < minY: set obj.y = minY, set obj.vy = Math.abs(obj.vy).\nIf obj.y > maxY: set obj.y = maxY, set obj.vy = -Math.abs(obj.vy).',
    argNames: ['obj', 'minY', 'maxY'],
    testCases: [
      { inputs: [{ y: -5, vy: -100 }, 0, 600], expectMutations: { 'y': 0, 'vy': 100 } },
      { inputs: [{ y: 605, vy: 100 }, 0, 600], expectMutations: { 'y': 600, 'vy': -100 } },
      { inputs: [{ y: 300, vy: 50 }, 0, 600], expectMutations: { 'y': 300, 'vy': 50 } },
    ],
  },
  overlaps: {
    label: 'overlaps', domain: 'geometry',
    prompt: 'Write a JavaScript function body.\nArguments: ax, ay, aw, ah, bx, by, bw, bh (all numbers).\nReturn true if two rectangles (center coords + dimensions) overlap.\nOverlap: Math.abs(ax-bx) < (aw+bw)/2 AND Math.abs(ay-by) < (ah+bh)/2.',
    argNames: ['ax', 'ay', 'aw', 'ah', 'bx', 'by', 'bw', 'bh'],
    testCases: [
      { inputs: [100, 100, 20, 20, 105, 105, 20, 20], expectReturn: true },
      { inputs: [100, 100, 20, 20, 200, 200, 20, 20], expectReturn: false },
    ],
  },
  bounceHorizontal: {
    label: 'bounceHorizontal', domain: 'physics',
    prompt: 'Write a JavaScript function body.\nArguments: obj, wallX, pushDir\n- obj has properties: x (number), vx (number)\nReverse obj.vx (multiply by -1). Set obj.x = wallX + pushDir * 1.',
    argNames: ['obj', 'wallX', 'pushDir'],
    testCases: [
      { inputs: [{ x: 50, vx: 200 }, 55, -1], expectMutations: { 'vx': -200, 'x': 54 } },
      { inputs: [{ x: 550, vx: -200 }, 545, 1], expectMutations: { 'vx': 200, 'x': 546 } },
    ],
  },
  edgeCrossing: {
    label: 'edgeCrossing', domain: 'geometry',
    prompt: 'Write a JavaScript function body.\nArguments: x, halfW, canvasW (all numbers).\nIf x - halfW < 0, return "left".\nIf x + halfW > canvasW, return "right".\nOtherwise return "".',
    argNames: ['x', 'halfW', 'canvasW'],
    testCases: [
      { inputs: [-5, 10, 800], expectReturn: 'left' },
      { inputs: [810, 10, 800], expectReturn: 'right' },
      { inputs: [400, 10, 800], expectReturn: '' },
    ],
  },
  inputToVelocity: {
    label: 'inputToVelocity', domain: 'input',
    prompt: 'Write a JavaScript function body.\nArguments: obj, speed, leftHeld, rightHeld\n- obj has a "vx" property (number)\nSet obj.vx to 0. If leftHeld is true, set obj.vx to -speed. If rightHeld is true, set obj.vx to speed.',
    argNames: ['obj', 'speed', 'leftHeld', 'rightHeld'],
    testCases: [
      { inputs: [{ vx: 99 }, 300, false, false], expectMutations: { 'vx': 0 } },
      { inputs: [{ vx: 0 }, 300, true, false], expectMutations: { 'vx': -300 } },
      { inputs: [{ vx: 0 }, 300, false, true], expectMutations: { 'vx': 300 } },
    ],
  },

  // ── NEW FOR BREAKOUT ──
  hitRatio: {
    label: 'hitRatio', domain: 'math',
    prompt: 'Write a JavaScript function body.\nArguments: hitPos, objectPos, objectWidth (all numbers).\nReturn (hitPos - objectPos) / objectWidth. This gives a ratio from -0.5 to 0.5 indicating where on the object the hit occurred.',
    argNames: ['hitPos', 'objectPos', 'objectWidth'],
    testCases: [
      { inputs: [100, 100, 80], expectReturn: 0 },
      { inputs: [60, 100, 80], expectReturn: -0.5 },
      { inputs: [140, 100, 80], expectReturn: 0.5 },
      { inputs: [80, 100, 80], expectReturn: -0.25 },
    ],
  },
  deflectByRatio: {
    label: 'deflectByRatio', domain: 'physics',
    prompt: 'Write a JavaScript function body.\nArguments: obj, ratio, speed\n- obj has properties: vx (number), vy (number)\n- ratio: number between -0.5 and 0.5\n- speed: total speed (number)\nSet obj.vx = ratio * speed * 2. Set obj.vy = -Math.abs(obj.vy). (Always bounce upward.)',
    argNames: ['obj', 'ratio', 'speed'],
    testCases: [
      { inputs: [{ vx: 100, vy: 200 }, 0, 300], expectMutations: { 'vx': 0, 'vy': -200 } },
      { inputs: [{ vx: 100, vy: 200 }, 0.5, 300], expectMutations: { 'vx': 300, 'vy': -200 } },
      { inputs: [{ vx: 100, vy: -200 }, -0.25, 300], expectMutations: { 'vx': -150, 'vy': -200 } },
    ],
  },
  countTrue: {
    label: 'countTrue', domain: 'array',
    prompt: 'Write a JavaScript function body.\nArguments: arr (array of booleans).\nReturn the number of true values in the array.',
    argNames: ['arr'],
    testCases: [
      { inputs: [[true, true, false, true]], expectReturn: 3 },
      { inputs: [[false, false]], expectReturn: 0 },
      { inputs: [[true]], expectReturn: 1 },
      { inputs: [[]], expectReturn: 0 },
    ],
  },

  // ── NEW FOR SORT VISUALIZER ──
  compareTwo: {
    label: 'compareTwo', domain: 'array',
    prompt: 'Write a JavaScript function body.\nArguments: a, b (both numbers).\nReturn -1 if a < b, 1 if a > b, 0 if equal.',
    argNames: ['a', 'b'],
    testCases: [
      { inputs: [3, 7], expectReturn: -1 },
      { inputs: [9, 2], expectReturn: 1 },
      { inputs: [5, 5], expectReturn: 0 },
    ],
  },
  swapInArray: {
    label: 'swapInArray', domain: 'array',
    prompt: 'Write a JavaScript function body.\nArguments: arr, i, j\n- arr is an array of numbers\n- i, j are indices (numbers)\nSwap the values at arr[i] and arr[j] in place. Return nothing.',
    argNames: ['arr', 'i', 'j'],
    testCases: [
      { inputs: [[10, 20, 30], 0, 2], expectMutations: { '0': 30, '2': 10 } },
      { inputs: [[5, 15], 0, 1], expectMutations: { '0': 15, '1': 5 } },
    ],
  },
  lerp: {
    label: 'lerp', domain: 'math',
    prompt: 'Write a JavaScript function body.\nArguments: a, b, t (all numbers).\nReturn a + (b - a) * t. This linearly interpolates between a and b by factor t.',
    argNames: ['a', 'b', 't'],
    testCases: [
      { inputs: [0, 100, 0.5], expectReturn: 50 },
      { inputs: [0, 100, 0], expectReturn: 0 },
      { inputs: [0, 100, 1], expectReturn: 100 },
      { inputs: [20, 80, 0.25], expectReturn: 35 },
    ],
  },
  mapRange: {
    label: 'mapRange', domain: 'math',
    prompt: 'Write a JavaScript function body.\nArguments: val, inMin, inMax, outMin, outMax (all numbers).\nMap val from range [inMin, inMax] to range [outMin, outMax].\nFormula: outMin + (val - inMin) / (inMax - inMin) * (outMax - outMin).',
    argNames: ['val', 'inMin', 'inMax', 'outMin', 'outMax'],
    testCases: [
      { inputs: [5, 0, 10, 0, 100], expectReturn: 50 },
      { inputs: [0, 0, 10, 0, 100], expectReturn: 0 },
      { inputs: [10, 0, 10, 0, 100], expectReturn: 100 },
      { inputs: [3, 0, 10, 100, 200], expectReturn: 130 },
    ],
  },
  nextBubbleStep: {
    label: 'nextBubbleStep', domain: 'algorithm',
    prompt: 'Write a JavaScript function body.\nArguments: arr, idx\n- arr is an array of numbers\n- idx is the current comparison index (number)\nIf arr[idx] > arr[idx+1], swap them in place and return true.\nOtherwise return false.',
    argNames: ['arr', 'idx'],
    testCases: [
      { inputs: [[5, 3, 8], 0], expectReturn: true, expectMutations: { '0': 3, '1': 5 } },
      { inputs: [[3, 5, 8], 0], expectReturn: false, expectMutations: { '0': 3, '1': 5 } },
      { inputs: [[1, 9, 4], 1], expectReturn: true, expectMutations: { '1': 4, '2': 9 } },
    ],
  },

  // ── NEW FOR DRAWING TOOL ──
  distance: {
    label: 'distance', domain: 'geometry',
    prompt: 'Write a JavaScript function body.\nArguments: x1, y1, x2, y2 (all numbers).\nReturn the Euclidean distance: Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1)).',
    argNames: ['x1', 'y1', 'x2', 'y2'],
    testCases: [
      { inputs: [0, 0, 3, 4], expectReturn: 5 },
      { inputs: [0, 0, 0, 0], expectReturn: 0 },
      { inputs: [1, 1, 4, 5], expectReturn: 5 },
    ],
  },
  hexToRgb: {
    label: 'hexToRgb', domain: 'color',
    prompt: 'Write a JavaScript function body.\nArguments: hex (string like "#FF8800").\nParse the hex color and return an object {r, g, b} with integer values 0-255.\nr = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16).',
    argNames: ['hex'],
    testCases: [
      { inputs: ['#FF0000'], expectReturn: { r: 255, g: 0, b: 0 } },
      { inputs: ['#00FF00'], expectReturn: { r: 0, g: 255, b: 0 } },
      { inputs: ['#0000FF'], expectReturn: { r: 0, g: 0, b: 255 } },
      { inputs: ['#808080'], expectReturn: { r: 128, g: 128, b: 128 } },
    ],
  },
  rgbToString: {
    label: 'rgbToString', domain: 'color',
    prompt: 'Write a JavaScript function body.\nArguments: r, g, b, a (all numbers, a is 0-1 opacity).\nReturn a CSS color string: "rgba(" + r + "," + g + "," + b + "," + a + ")".',
    argNames: ['r', 'g', 'b', 'a'],
    testCases: [
      { inputs: [255, 0, 0, 1], expectReturn: 'rgba(255,0,0,1)' },
      { inputs: [0, 128, 255, 0.5], expectReturn: 'rgba(0,128,255,0.5)' },
    ],
  },
};

// ════════════════════════════════════════════════════════════
// PRODUCT DEFINITIONS
// ════════════════════════════════════════════════════════════

const PRODUCTS = [
  {
    name: 'Breakout',
    domain: 'game',
    reuse: ['clamp', 'integrate', 'bounceVertical', 'overlaps', 'bounceHorizontal', 'inputToVelocity'],
    newAtoms: ['hitRatio', 'deflectByRatio', 'countTrue', 'edgeCrossing'],
    shapes: [
      { desc: 'filled horizontal rectangle, filling most of the canvas', w: 32, h: 8, colors: { base: '#0099FF', light: '#66D9FF', dark: '#003D7A', accent: '#00FFCC' }, name: 'paddle' },
      { desc: 'filled circle, centered, radius filling most of the canvas', w: 12, h: 12, colors: { base: '#FFFFFF', light: '#FFFFFF', dark: '#C0C8D8', accent: '#FFD700' }, name: 'ball' },
      { desc: 'filled rectangle with a subtle highlight stripe across the top', w: 24, h: 10, colors: { base: '#E63946', light: '#FF8A95', dark: '#A01830', accent: '#FFB347' }, name: 'brick' },
    ],
    buildHtml: (code, sprites, engine) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Atomic Breakout</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#111}canvas{display:block;touch-action:none;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas><script>
${engine}
var canvas=document.getElementById('c'),ctx=canvas.getContext('2d'),W,H,S;
function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;S=Math.min(W,H)/600}
resize();addEventListener('resize',resize);
${sprites}

var clamp=function(val,min,max){${code.clamp}};
var integrate=function(obj,dt){${code.integrate}};
var bounceV=function(obj,minY,maxY){${code.bounceVertical}};
var overlaps=function(ax,ay,aw,ah,bx,by,bw,bh){${code.overlaps}};
var bounceH=function(obj,wallX,pushDir){${code.bounceHorizontal}};
var inputVel=function(obj,speed,leftHeld,rightHeld){${code.inputToVelocity}};
var hitRatio=function(hitPos,objectPos,objectWidth){${code.hitRatio}};
var deflect=function(obj,ratio,speed){${code.deflectByRatio}};
var countTrue=function(arr){${code.countTrue}};
var edgeX=function(x,halfW,canvasW){${code.edgeCrossing}};

var DS=3,COLS=8,ROWS=5;
var paddle={x:W/2,y:H*0.9,w:32*DS,h:8*DS,vx:0,vy:0};
var ball={x:W/2,y:H*0.7,w:12*DS,h:12*DS,vx:120,vy:-200};
var bricks=[],alive=[];
var bw=24*DS,bh=10*DS,gap=4*S;
for(var r=0;r<ROWS;r++)for(var cc=0;cc<COLS;cc++){
  var bx=W/2+(cc-COLS/2+0.5)*(bw*S+gap);
  var by=60*S+r*(bh*S+gap);
  bricks.push({x:bx,y:by,w:bw,h:bh});
  alive.push(true);
}
var inputState={keys:{}};
addEventListener('keydown',function(e){inputState.keys[e.key]=true;e.preventDefault()});
addEventListener('keyup',function(e){inputState.keys[e.key]=false});
canvas.addEventListener('touchmove',function(e){e.preventDefault();paddle.x=e.touches[0].clientX});

function resetBall(){ball.x=W/2;ball.y=H*0.7;ball.vx=(Math.random()>0.5?1:-1)*120;ball.vy=-200}
var last=0;
function loop(t){
  var dt=Math.min((t-last)/1000,0.05);last=t;
  ctx.fillStyle='#111';ctx.fillRect(0,0,W,H);
  inputVel(paddle,350*S,!!inputState.keys.ArrowLeft,!!inputState.keys.ArrowRight);
  paddle.x+=paddle.vx*dt;
  paddle.x=clamp(paddle.x,paddle.w*S/2,W-paddle.w*S/2);
  integrate(ball,dt);
  bounceV(ball,ball.h*S/2,H);
  if(ball.x-ball.w*S/2<0){ball.x=ball.w*S/2;ball.vx=Math.abs(ball.vx)}
  if(ball.x+ball.w*S/2>W){ball.x=W-ball.w*S/2;ball.vx=-Math.abs(ball.vx)}
  if(overlaps(ball.x,ball.y,ball.w*S,ball.h*S,paddle.x,paddle.y,paddle.w*S,paddle.h*S)){
    var r=hitRatio(ball.x,paddle.x,paddle.w*S);
    deflect(ball,r,300);
    ball.y=paddle.y-paddle.h*S/2-ball.h*S/2-1;
  }
  for(var i=0;i<bricks.length;i++){
    if(!alive[i])continue;
    if(overlaps(ball.x,ball.y,ball.w*S,ball.h*S,bricks[i].x,bricks[i].y,bricks[i].w*S,bricks[i].h*S)){
      alive[i]=false;ball.vy=-ball.vy;
    }
  }
  var edge=edgeX(ball.y,ball.h*S/2,H);
  if(ball.y+ball.h*S/2>H)resetBall();
  if(countTrue(alive)===0){for(var i=0;i<alive.length;i++)alive[i]=true;resetBall()}
  for(var i=0;i<bricks.length;i++){
    if(!alive[i])continue;
    ctx.drawImage(spriteBrick,bricks[i].x-bricks[i].w*S/2,bricks[i].y-bricks[i].h*S/2,bricks[i].w*S,bricks[i].h*S);
  }
  ctx.drawImage(spritePaddle,paddle.x-paddle.w*S/2,paddle.y-paddle.h*S/2,paddle.w*S,paddle.h*S);
  ctx.drawImage(spriteBall,ball.x-ball.w*S/2,ball.y-ball.h*S/2,ball.w*S,ball.h*S);
  ctx.fillStyle='#fff';ctx.font=Math.round(14*S)+'px monospace';ctx.textAlign='center';
  ctx.fillText('Arrow Left/Right to move',W/2,H-15*S);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script></body></html>`,
  },
  {
    name: 'SortViz',
    domain: 'algorithm',
    reuse: ['clamp', 'lerp', 'mapRange'],
    newAtoms: ['compareTwo', 'swapInArray', 'nextBubbleStep'],
    shapes: [],
    buildHtml: (code, sprites, engine) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Atomic Sort Visualizer</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#0a0a0f}canvas{display:block;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas><script>
var canvas=document.getElementById('c'),ctx=canvas.getContext('2d'),W,H;
function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight}
resize();addEventListener('resize',resize);

var clamp=function(val,min,max){${code.clamp}};
var lerp=function(a,b,t){${code.lerp}};
var mapRange=function(val,inMin,inMax,outMin,outMax){${code.mapRange}};
var compareTwo=function(a,b){${code.compareTwo}};
var swapInArray=function(arr,i,j){${code.swapInArray}};
var nextBubbleStep=function(arr,idx){${code.nextBubbleStep}};

var N=40,arr=[],targetArr=[];
for(var i=0;i<N;i++)arr.push(Math.random()*0.9+0.1);
targetArr=arr.slice();

var sortIdx=0,sortEnd=N-1,sorted=false,swapped=false;
var stepTimer=0,stepInterval=0.04;
var highlightA=-1,highlightB=-1;
var colors=['#0099FF','#00CCFF','#00FFCC','#44FF88','#88FF44','#CCFF00','#FFD700','#FF8C42','#FF5252','#E63946'];

var last=0;
function loop(t){
  var dt=Math.min((t-last)/1000,0.05);last=t;
  ctx.fillStyle='#0a0a0f';ctx.fillRect(0,0,W,H);

  if(!sorted){
    stepTimer+=dt;
    while(stepTimer>=stepInterval&&!sorted){
      stepTimer-=stepInterval;
      highlightA=sortIdx;highlightB=sortIdx+1;
      var didSwap=nextBubbleStep(arr,sortIdx);
      if(didSwap)swapped=true;
      sortIdx++;
      if(sortIdx>=sortEnd){
        if(!swapped){sorted=true;highlightA=-1;highlightB=-1}
        else{sortIdx=0;swapped=false;sortEnd--}
      }
    }
  }

  var barW=W/N*0.8,gap=W/N*0.2;
  for(var i=0;i<N;i++){
    var x=i*(barW+gap)+gap/2;
    var barH=arr[i]*H*0.85;
    var ci=Math.floor(mapRange(arr[i],0,1,0,colors.length-1));
    ci=clamp(ci,0,colors.length-1);
    ctx.fillStyle=(i===highlightA||i===highlightB)?'#FFFFFF':colors[ci];
    ctx.fillRect(x,H-barH-20,barW,barH);
  }

  ctx.fillStyle='#888';ctx.font='14px monospace';ctx.textAlign='center';
  ctx.fillText(sorted?'Sorted! Click to reset':'Bubble Sort — sorting...',W/2,H-5);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

canvas.addEventListener('click',function(){
  arr=[];for(var i=0;i<N;i++)arr.push(Math.random()*0.9+0.1);
  sortIdx=0;sortEnd=N-1;sorted=false;swapped=false;highlightA=-1;highlightB=-1;
});
</script></body></html>`,
  },
  {
    name: 'DrawTool',
    domain: 'creative',
    reuse: ['clamp', 'distance', 'lerp'],
    newAtoms: ['hexToRgb', 'rgbToString'],
    shapes: [],
    buildHtml: (code, sprites, engine) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Atomic Draw Tool</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#1a1a2a}
canvas{display:block;cursor:crosshair}
#toolbar{position:fixed;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:8px;padding:8px;background:rgba(0,0,0,0.7);border-radius:8px;z-index:10}
.swatch{width:32px;height:32px;border-radius:4px;border:2px solid #333;cursor:pointer}
.swatch.active{border-color:#fff}
#brushInfo{color:#888;font:12px monospace;padding:4px 8px;line-height:32px}
button{background:#333;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font:12px monospace}
button:hover{background:#555}
</style>
</head><body>
<canvas id="c"></canvas>
<div id="toolbar">
  <div class="swatch active" style="background:#FF5252" data-color="#FF5252"></div>
  <div class="swatch" style="background:#FFD700" data-color="#FFD700"></div>
  <div class="swatch" style="background:#44FF88" data-color="#44FF88"></div>
  <div class="swatch" style="background:#0099FF" data-color="#0099FF"></div>
  <div class="swatch" style="background:#E040FB" data-color="#E040FB"></div>
  <div class="swatch" style="background:#FFFFFF" data-color="#FFFFFF"></div>
  <div class="swatch" style="background:#1a1a2a" data-color="#1a1a2a"></div>
  <span id="brushInfo">Size: 8</span>
  <button id="btnUp">+</button>
  <button id="btnDown">-</button>
  <button id="btnUndo">Undo</button>
  <button id="btnClear">Clear</button>
</div>
<script>
var canvas=document.getElementById('c'),ctx=canvas.getContext('2d'),W,H;

var clamp=function(val,min,max){${code.clamp}};
var dist=function(x1,y1,x2,y2){${code.distance}};
var lerp=function(a,b,t){${code.lerp}};
var hexToRgb=function(hex){${code.hexToRgb}};
var rgbToStr=function(r,g,b,a){${code.rgbToString}};

var currentColor='#FF5252',brushSize=8,drawing=false;
var strokes=[],currentStroke=null;

function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;redraw()}
resize();addEventListener('resize',resize);
var lastX=0,lastY=0;

function drawDot(x,y,color,size){
  var c=hexToRgb(color);
  ctx.fillStyle=rgbToStr(c.r,c.g,c.b,1);
  ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.fill();
}

function drawLine(x1,y1,x2,y2,color,size){
  var d=dist(x1,y1,x2,y2);
  var steps=Math.max(1,Math.ceil(d/2));
  for(var i=0;i<=steps;i++){
    var t=i/steps;
    drawDot(lerp(x1,x2,t),lerp(y1,y2,t),color,size);
  }
}

function redraw(){
  ctx.fillStyle='#1a1a2a';ctx.fillRect(0,0,W,H);
  for(var s=0;s<strokes.length;s++){
    var st=strokes[s];
    for(var i=0;i<st.points.length;i++){
      if(i===0)drawDot(st.points[i].x,st.points[i].y,st.color,st.size);
      else drawLine(st.points[i-1].x,st.points[i-1].y,st.points[i].x,st.points[i].y,st.color,st.size);
    }
  }
}

canvas.addEventListener('pointerdown',function(e){
  drawing=true;lastX=e.clientX;lastY=e.clientY;
  currentStroke={color:currentColor,size:brushSize,points:[{x:lastX,y:lastY}]};
  drawDot(lastX,lastY,currentColor,brushSize);
});
canvas.addEventListener('pointermove',function(e){
  if(!drawing)return;
  drawLine(lastX,lastY,e.clientX,e.clientY,currentColor,brushSize);
  currentStroke.points.push({x:e.clientX,y:e.clientY});
  lastX=e.clientX;lastY=e.clientY;
});
addEventListener('pointerup',function(){
  if(currentStroke){strokes.push(currentStroke);currentStroke=null}
  drawing=false;
});

document.querySelectorAll('.swatch').forEach(function(el){
  el.addEventListener('click',function(){
    document.querySelectorAll('.swatch').forEach(function(s){s.classList.remove('active')});
    el.classList.add('active');
    currentColor=el.dataset.color;
  });
});
document.getElementById('btnUp').addEventListener('click',function(){
  brushSize=clamp(brushSize+4,2,64);
  document.getElementById('brushInfo').textContent='Size: '+brushSize;
});
document.getElementById('btnDown').addEventListener('click',function(){
  brushSize=clamp(brushSize-4,2,64);
  document.getElementById('brushInfo').textContent='Size: '+brushSize;
});
document.getElementById('btnUndo').addEventListener('click',function(){
  strokes.pop();redraw();
});
document.getElementById('btnClear').addEventListener('click',function(){
  strokes=[];redraw();
});
</script></body></html>`,
  },
];

// ════════════════════════════════════════════════════════════
// MAIN — build all 3 products, track scaling metrics
// ════════════════════════════════════════════════════════════

async function main() {
  const totalStart = Date.now();
  const results = [];
  const atomsBuilt = {};  // label → code, tracks what's been built
  let totalCost = 0;
  let librarySize = 0;

  console.log('=== SCALING TEST — 3 products, 1 atomic framework ===\n');

  for (const product of PRODUCTS) {
    const prodStart = Date.now();
    let prodCost = 0;
    const reused = [];
    const built = [];

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`PRODUCT: ${product.name} (${product.domain})`);
    console.log('═'.repeat(60));

    // Collect all atoms needed for this product
    const neededAtoms = [...product.reuse, ...product.newAtoms];

    // Separate into reuse vs build
    const toReuse = neededAtoms.filter(a => atomsBuilt[a]);
    const toBuild = neededAtoms.filter(a => !atomsBuilt[a]);

    console.log(`  Reuse: ${toReuse.length} atoms (${toReuse.join(', ') || 'none'})`);
    console.log(`  Build: ${toBuild.length} atoms (${toBuild.join(', ') || 'none'})`);

    // Build new atoms in parallel
    if (toBuild.length > 0) {
      console.log('\n  [BUILDING NEW ATOMS]');
      const atomResults = await Promise.all(
        toBuild.map(name => {
          const spec = ATOM_LIBRARY[name];
          if (!spec) throw new Error(`Unknown atom: ${name}`);
          return runAtom(spec);
        })
      );

      for (let i = 0; i < toBuild.length; i++) {
        atomsBuilt[toBuild[i]] = atomResults[i].code;
        prodCost += atomResults[i].cost;
        built.push({ name: toBuild[i], attempts: atomResults[i].attempts });
      }
    }

    // Copy reused atoms
    for (const name of toReuse) {
      reused.push(name);
    }

    // Build code map for this product
    const code = {};
    for (const name of neededAtoms) {
      code[name] = atomsBuilt[name];
    }

    // Build shapes if needed
    let spriteCode = '';
    if (product.shapes.length > 0) {
      console.log('\n  [SHAPES]');
      const engine = fs.readFileSync(ENGINE, 'utf8');
      for (const s of product.shapes) {
        const shape = await makeShape(s.desc, s.w, s.h, s.colors, s.name);
        prodCost += shape.cost;
        spriteCode += buildSprite(shape.drawBody, s.w, s.h, s.colors, 'sprite' + s.name.charAt(0).toUpperCase() + s.name.slice(1)) + '\n';
        console.log(`    ${s.name}: OK`);
      }
    }

    // Build HTML
    console.log('\n  [ASSEMBLY]');
    const engine = product.shapes.length > 0 ? fs.readFileSync(ENGINE, 'utf8') : '';
    const html = product.buildHtml(code, spriteCode, engine);
    const outDir = path.join(__dirname, 'output', 'scaling', product.name.toLowerCase());
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);

    librarySize = Object.keys(atomsBuilt).length;
    const elapsed = ((Date.now() - prodStart) / 1000).toFixed(1);
    totalCost += prodCost;

    const result = {
      name: product.name,
      domain: product.domain,
      atomsReused: toReuse.length,
      atomsBuilt: toBuild.length,
      atomsTotal: neededAtoms.length,
      reuseRate: toReuse.length / neededAtoms.length,
      shapes: product.shapes.length,
      cost: prodCost,
      elapsed: parseFloat(elapsed),
      librarySize,
      failures: built.filter(b => b.attempts > 1).length,
    };
    results.push(result);

    console.log(`\n  ${product.name}: ${elapsed}s, $${prodCost.toFixed(4)}`);
    console.log(`  Atoms: ${toReuse.length} reused + ${toBuild.length} new = ${neededAtoms.length} total`);
    console.log(`  Reuse rate: ${(result.reuseRate * 100).toFixed(0)}%`);
    console.log(`  Library now: ${librarySize} atoms`);
  }

  // ── FINAL REPORT ──
  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);

  console.log('\n\n' + '═'.repeat(60));
  console.log('SCALING REPORT');
  console.log('═'.repeat(60));
  console.log('\nProduct      | Domain    | Reused | New | Total | Reuse% | Cost    | Time');
  console.log('-------------|-----------|--------|-----|-------|--------|---------|------');
  for (const r of results) {
    console.log(`${r.name.padEnd(13)}| ${r.domain.padEnd(10)}| ${String(r.atomsReused).padStart(6)} | ${String(r.atomsBuilt).padStart(3)} | ${String(r.atomsTotal).padStart(5)} | ${(r.reuseRate*100).toFixed(0).padStart(5)}% | $${r.cost.toFixed(4)} | ${r.elapsed}s`);
  }

  console.log(`\nTotal: ${totalElapsed}s, $${totalCost.toFixed(4)}`);
  console.log(`Final library: ${librarySize} atoms across ${new Set(Object.values(ATOM_LIBRARY).map(a => a.domain)).size} domains`);
  console.log(`Atom domains: ${[...new Set(Object.values(ATOM_LIBRARY).filter(a => atomsBuilt[a.label]).map(a => a.domain))].join(', ')}`);

  // Save results
  const outDir = path.join(__dirname, 'output', 'scaling');
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify({ results, librarySize, totalCost, totalElapsed }, null, 2));
  console.log(`\nResults: ${outDir}/results.json`);
  console.log(`Outputs: ${outDir}/{breakout,sortviz,drawtool}/index.html`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
