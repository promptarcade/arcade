// Bug Catcher player v2 — little girl with butterfly net
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = {};
global.document = { createElement: (tag) => tag === 'canvas' ? createCanvas(1, 1) : {} };
const enginePath = path.join(__dirname, '..', 'engine', 'sprites', 'sprite-forge-v2.js');
let engineCode = fs.readFileSync(enginePath, 'utf8');
engineCode = engineCode.replace(
  /function sf2_makeCanvas\(w, h\) \{[^}]+\}/,
  `function sf2_makeCanvas(w, h) { return require('canvas').createCanvas(w, h); }`
);
vm.runInThisContext(engineCode);

const CR = window.ColorRamp;
const PC = window.PixelCanvas;
const PP = window.PostProcess;

const outDir = path.join(__dirname, '..', 'engine', 'sprites', 'verify');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function renderPC(pc, filename, scale) {
  scale = scale || 10;
  const cvs = createCanvas(pc.width * scale, pc.height * scale);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#2a3a2a';
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  for (let y = 0; y < pc.height; y++) {
    for (let x = 0; x < pc.width; x++) {
      const idx = pc.pixels[y * pc.width + x];
      if (idx === 0) continue;
      const rgba = pc.palette[idx];
      ctx.fillStyle = `rgb(${rgba&0xFF},${(rgba>>8)&0xFF},${(rgba>>16)&0xFF})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let x = 0; x <= pc.width; x++) { ctx.beginPath(); ctx.moveTo(x*scale,0); ctx.lineTo(x*scale,pc.height*scale); ctx.stroke(); }
  for (let y = 0; y <= pc.height; y++) { ctx.beginPath(); ctx.moveTo(0,y*scale); ctx.lineTo(pc.width*scale,y*scale); ctx.stroke(); }
  fs.writeFileSync(path.join(outDir, filename), cvs.toBuffer('image/png'));
  console.log('  ' + filename);
}

const pal = CR.buildPalette({
  skin: '#f5d0a9', dress: '#ee6699', hair: '#884422',
  shoes: '#884433', eyes: '#448855', bow: '#ff4466',
  net: '#aabbcc', handle: '#8b6914',
});
pal.palette[255] = sf2_packRGBA(20, 15, 10, 255);

const s = pal.groups.skin.startIdx + 2;
const dr = pal.groups.dress.startIdx + 2;
const h = pal.groups.hair.startIdx + 2;
const sho = pal.groups.shoes.startIdx + 2;
const bw = pal.groups.bow.startIdx + 2;
const nt = pal.groups.net.startIdx + 2;
const hd = pal.groups.handle.startIdx + 2;

console.log('=== Bug Catcher Girl ===');

const pc = new PC(28, 32);
pc.setPalette(pal.palette, pal.groupForIndex);

// Net — held in right hand, extending right and up
// Handle from right hand up and to the right
pc.line(20, 18, 25, 8, hd);
pc.line(21, 18, 26, 8, hd);
// Net ring at top of handle
pc.fillCircle(25, 6, 3, nt);
pc.fillCircle(25, 6, 2, 0); // hollow center
// Net mesh dangling below ring
pc.setPixel(23, 9, nt); pc.setPixel(25, 9, nt); pc.setPixel(27, 9, nt);
pc.setPixel(24, 10, nt); pc.setPixel(26, 10, nt);
pc.setPixel(25, 11, nt);

// Hair back — long, flowing behind shoulders
for (let y = 5; y < 22; y++) {
  const t = (y - 5) / 17;
  const w = Math.round(6 - t * 2.5);
  pc.hline(10 - w, y, w * 2 + 1, h);
}

// Head
pc.fillEllipse(10, 7, 5, 6, s);

// Neck
pc.fillRect(9, 13, 3, 2, s);

// Hair front — bangs and side
pc.fillEllipse(10, 4, 6, 3, h);
pc.fillRect(4, 5, 2, 6, h); // left side
pc.fillRect(15, 5, 2, 5, h); // right side
pc.hline(5, 5, 11, h);
pc.hline(6, 6, 9, h);

// Hair bow on right side
pc.fillCircle(15, 4, 2, bw);
pc.setPixel(14, 3, bw + 1);
pc.setPixel(16, 3, bw + 1);

// Dress — A-line, pink, cute
for (let y = 15; y < 22; y++) {
  const t = (y - 15) / 7;
  const halfW = Math.round(5 + t * 3);
  pc.hline(10 - halfW, y, halfW * 2 + 1, dr);
}
// Dress skirt flare
for (let y = 22; y < 26; y++) {
  const t = (y - 22) / 4;
  const halfW = Math.round(8 + t * 2);
  pc.hline(10 - halfW, y, halfW * 2 + 1, dr);
}
// Collar
pc.hline(7, 15, 7, dr + 1);
// Dress hem detail
pc.hline(1, 25, 19, dr + 1);

// Sleeves — short puff
pc.fillEllipse(4, 16, 2, 2, dr);
pc.fillEllipse(16, 16, 2, 2, dr);

// Arms
pc.fillRect(2, 16, 2, 7, s);
pc.fillRect(17, 16, 2, 6, s);
// Hands
pc.fillCircle(2, 23, 1, s);
pc.fillCircle(18, 22, 1, s);

// Legs
pc.fillRect(6, 26, 3, 3, s);
pc.fillRect(12, 26, 3, 3, s);

// Shoes — mary janes
pc.fillRect(5, 29, 4, 2, sho);
pc.fillRect(12, 29, 4, 2, sho);
// Shoe straps
pc.setPixel(6, 29, sho - 1);
pc.setPixel(14, 29, sho - 1);

PP.applyShading(pc, pal.groups);

// Face AFTER shading
const e = pal.groups.eyes.startIdx;
// Eyes — large, bright
pc.hline(7, 7, 3, e + 2); pc.hline(7, 8, 3, e + 2);
pc.setPixel(8, 8, e + 1); pc.setPixel(8, 7, e); pc.setPixel(7, 7, e + 3);
pc.hline(11, 7, 3, e + 2); pc.hline(11, 8, 3, e + 2);
pc.setPixel(12, 8, e + 1); pc.setPixel(12, 7, e); pc.setPixel(11, 7, e + 3);
// Eyelashes
pc.setPixel(6, 7, e);
pc.setPixel(14, 7, e);
// Nose
pc.setPixel(10, 9, s - 1);
// Smile
pc.hline(9, 11, 3, s - 2);
pc.setPixel(8, 10, s - 2);
pc.setPixel(12, 10, s - 2);
// Blush
pc.setPixel(6, 10, pal.groups.bow.startIdx + 3);
pc.setPixel(14, 10, pal.groups.bow.startIdx + 3);

PP.applyOutlines(pc, pal.groups, 'tinted');
renderPC(pc, 'bug-player-v2.png');
console.log('Done');
