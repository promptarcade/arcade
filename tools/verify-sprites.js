// ============================================================
// Sprite Verification Tool
// ============================================================
// Renders SpriteForge sprites to PNG files for visual inspection.
// Usage: node tools/verify-sprites.js <game-html-or-script>
//
// When run standalone, renders the demo sprites and saves PNGs.
// The PNGs can be read back by Claude for visual analysis.
// ============================================================

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Patch global environment so SpriteForge works in Node
global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      const c = createCanvas(1, 1);
      // node-canvas uses different property setting
      const origGetCtx = c.getContext.bind(c);
      c.getContext = (type) => {
        const ctx = origGetCtx(type);
        return ctx;
      };
      return c;
    }
    return {};
  },
};
global.window = {};

// Override sf2_makeCanvas to use node-canvas
function patchMakeCanvas(code) {
  return code.replace(
    /function sf2_makeCanvas\(w, h\) \{[^}]+\}/,
    `function sf2_makeCanvas(w, h) {
      const { createCanvas } = require('canvas');
      return createCanvas(w, h);
    }`
  );
}

// Load and patch the engine
const enginePath = path.join(__dirname, '..', 'engine', 'sprites', 'sprite-forge-v2.js');
let engineCode = fs.readFileSync(enginePath, 'utf8');
engineCode = patchMakeCanvas(engineCode);
eval(engineCode);

const SF = window.SpriteForge;
const CR = window.ColorRamp;
const PC = window.PixelCanvas;
const PP = window.PostProcess;

// ============================================================
// Render a PixelCanvas to a PNG buffer
// ============================================================
function pixelCanvasToPNG(pc, scale) {
  scale = scale || 8;
  const { createCanvas: cc } = require('canvas');
  const cvs = cc(pc.width * scale, pc.height * scale);
  const ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Draw each pixel as a scaled rectangle
  for (let y = 0; y < pc.height; y++) {
    for (let x = 0; x < pc.width; x++) {
      const idx = pc.pixels[y * pc.width + x];
      if (idx === 0) continue;
      const rgba = pc.palette[idx];
      const r = rgba & 0xFF;
      const g = (rgba >> 8) & 0xFF;
      const b = (rgba >> 16) & 0xFF;
      const a = (rgba >> 24) & 0xFF;
      ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  // Draw grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= pc.width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * scale, 0);
    ctx.lineTo(x * scale, pc.height * scale);
    ctx.stroke();
  }
  for (let y = 0; y <= pc.height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * scale);
    ctx.lineTo(pc.width * scale, y * scale);
    ctx.stroke();
  }

  return cvs.toBuffer('image/png');
}

// ============================================================
// Render a SpriteSheet to a PNG (all frames in grid)
// ============================================================
function sheetToPNG(sheet, scale) {
  scale = scale || 6;
  const { createCanvas: cc } = require('canvas');
  const srcCvs = sheet.canvas;
  const w = srcCvs.width * scale;
  const h = srcCvs.height * scale;
  const cvs = cc(w, h);
  const ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(srcCvs, 0, 0, srcCvs.width, srcCvs.height, 0, 0, w, h);

  // Draw frame grid
  ctx.strokeStyle = 'rgba(255,100,100,0.3)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= sheet.cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * sheet.frameWidth * scale, 0);
    ctx.lineTo(c * sheet.frameWidth * scale, h);
    ctx.stroke();
  }
  for (let r = 0; r <= sheet.rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * sheet.frameHeight * scale);
    ctx.lineTo(w, r * sheet.frameHeight * scale);
    ctx.stroke();
  }

  return cvs.toBuffer('image/png');
}

// ============================================================
// Main: render example sprites
// ============================================================
const outDir = path.join(__dirname, '..', 'engine', 'sprites', 'verify');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('Rendering verification sprites to', outDir);

// Example 1: Simple blob
const blobPal = CR.buildPalette({ body: '#44aa44', eyes: '#ffffff' });
blobPal.palette[255] = 0xFF0A0F14;
const blobPC = new PC(24, 24);
blobPC.setPalette(blobPal.palette, blobPal.groupForIndex);
const bodyIdx = blobPal.groups.body.startIdx + 2;
blobPC.fillEllipse(12, 13, 8, 7, bodyIdx);
blobPC.fillRect(4, 13, 17, 2, bodyIdx);
blobPC.fillEllipse(10, 10, 3, 2, bodyIdx + 1);
PP.applyShading(blobPC, blobPal.groups);
// Eyes after shading
const eyeIdx = blobPal.groups.eyes.startIdx;
blobPC.fillCircle(9, 11, 2, eyeIdx + 2);
blobPC.fillCircle(15, 11, 2, eyeIdx + 2);
blobPC.setPixel(9, 11, eyeIdx);
blobPC.setPixel(15, 11, eyeIdx);
blobPC.setPixel(8, 10, eyeIdx + 3);
blobPC.setPixel(14, 10, eyeIdx + 3);
PP.applyOutlines(blobPC, blobPal.groups, 'tinted');
fs.writeFileSync(path.join(outDir, 'blob.png'), pixelCanvasToPNG(blobPC));
console.log('  blob.png — 24x24 slime creature');

// Example 2: Knight
const knightPal = CR.buildPalette({ skin: '#ffddbb', armor: '#8899aa', hair: '#553322', cape: '#cc3333', eyes: '#4466aa' });
knightPal.palette[255] = 0xFF0A0F14;
const knightPC = new PC(24, 32);
knightPC.setPalette(knightPal.palette, knightPal.groupForIndex);
const ks = knightPal.groups.skin.startIdx + 2;
const ka = knightPal.groups.armor.startIdx + 2;
const kh = knightPal.groups.hair.startIdx + 2;
const kc = knightPal.groups.cape.startIdx + 2;
const ke = knightPal.groups.eyes.startIdx;
knightPC.fillRect(8, 13, 8, 12, kc); // cape
knightPC.fillCircle(12, 8, 5, ks); // head
knightPC.fillEllipse(12, 5, 5, 3, ka); // helmet
knightPC.fillRect(7, 7, 10, 2, ka); // helmet brim
knightPC.fillRect(7, 9, 2, 3, kh); // hair L
knightPC.fillRect(16, 9, 2, 3, kh); // hair R
knightPC.fillRect(7, 14, 10, 8, ka); // torso
knightPC.hline(8, 20, 8, ka - 1); // belt
knightPC.fillRect(5, 14, 2, 7, ka); // arm L
knightPC.fillRect(18, 14, 2, 7, ka); // arm R
knightPC.fillRect(5, 21, 2, 2, ks); // hand L
knightPC.fillRect(18, 21, 2, 2, ks); // hand R
knightPC.fillRect(8, 22, 3, 6, ka - 1); // leg L
knightPC.fillRect(14, 22, 3, 6, ka - 1); // leg R
knightPC.fillRect(7, 28, 4, 3, ka - 2); // boot L
knightPC.fillRect(14, 28, 4, 3, ka - 2); // boot R
PP.applyShading(knightPC, knightPal.groups);
knightPC.setPixel(10, 8, ke + 2); knightPC.setPixel(14, 8, ke + 2);
knightPC.setPixel(10, 9, ke); knightPC.setPixel(14, 9, ke);
PP.applyOutlines(knightPC, knightPal.groups, 'tinted');
fs.writeFileSync(path.join(outDir, 'knight.png'), pixelCanvasToPNG(knightPC));
console.log('  knight.png — 24x32 armored knight');

// Example 3: Crawling baby
const babyPal = CR.buildPalette({ skin: '#ffe0cc', onesie: '#88ccff', hair: '#ddaa66', eyes: '#445533' });
babyPal.palette[255] = 0xFF0A0F14;
const babyPC = new PC(24, 16);
babyPC.setPalette(babyPal.palette, babyPal.groupForIndex);
const bs = babyPal.groups.skin.startIdx + 2;
const bo = babyPal.groups.onesie.startIdx + 2;
const bh = babyPal.groups.hair.startIdx + 2;
const be = babyPal.groups.eyes.startIdx;
babyPC.fillEllipse(12, 8, 7, 4, bo); // body
babyPC.fillCircle(7, 6, 3, bo); // bum
babyPC.fillCircle(19, 6, 4, bs); // head
babyPC.fillTriangle(18, 2, 21, 2, 19, 0, bh); // hair tuft
babyPC.fillRect(15, 11, 2, 3, bs); // arm R
babyPC.fillRect(11, 11, 2, 3, bs); // arm L
babyPC.fillRect(7, 10, 2, 3, bo); // knee R
babyPC.fillRect(4, 10, 2, 3, bo); // knee L
PP.applyShading(babyPC, babyPal.groups);
babyPC.setPixel(20, 5, be + 2); babyPC.setPixel(21, 5, be + 2);
babyPC.setPixel(20, 6, be + 1); babyPC.setPixel(21, 6, be);
PP.applyOutlines(babyPC, babyPal.groups, 'black');
fs.writeFileSync(path.join(outDir, 'baby-crawl.png'), pixelCanvasToPNG(babyPC));
console.log('  baby-crawl.png — 24x16 crawling baby');

console.log('Done. View PNGs to verify sprite quality.');
