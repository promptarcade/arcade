// Bug Catcher — sprite design lab
// Renders each insect species + player to PNG for verification

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
      const r = rgba & 0xFF, g = (rgba >> 8) & 0xFF, b = (rgba >> 16) & 0xFF;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let x = 0; x <= pc.width; x++) { ctx.beginPath(); ctx.moveTo(x*scale,0); ctx.lineTo(x*scale,pc.height*scale); ctx.stroke(); }
  for (let y = 0; y <= pc.height; y++) { ctx.beginPath(); ctx.moveTo(0,y*scale); ctx.lineTo(pc.width*scale,y*scale); ctx.stroke(); }
  fs.writeFileSync(path.join(outDir, filename), cvs.toBuffer('image/png'));
  console.log('  ' + filename + ' (' + pc.width + 'x' + pc.height + ')');
}

function makePal(colors) {
  const pal = CR.buildPalette(colors);
  pal.palette[255] = sf2_packRGBA(20, 15, 10, 255);
  return pal;
}

console.log('=== BUG CATCHER SPRITES ===\n');

// ============================================================
// BUTTERFLY — 20x16, large colorful wings, thin body
// ============================================================
console.log('Butterfly:');
(function() {
  const pal = makePal({ wing: '#ee6688', body: '#332222', eyes: '#ffffff', accent: '#ffcc44' });
  const pc = new PC(20, 16);
  pc.setPalette(pal.palette, pal.groupForIndex);
  const w = pal.groups.wing.startIdx + 2;
  const b = pal.groups.body.startIdx + 2;
  const ac = pal.groups.accent.startIdx + 2;

  // Wings spread — top view
  // Left upper wing
  pc.fillEllipse(5, 5, 4, 4, w);
  // Left lower wing
  pc.fillEllipse(4, 10, 3, 3, w);
  // Right upper wing
  pc.fillEllipse(15, 5, 4, 4, w);
  // Right lower wing
  pc.fillEllipse(16, 10, 3, 3, w);

  // Wing patterns — spots
  pc.fillCircle(5, 4, 1, ac);
  pc.fillCircle(15, 4, 1, ac);
  pc.setPixel(4, 9, ac);
  pc.setPixel(16, 9, ac);

  // Wing highlights
  pc.setPixel(3, 3, w + 1);
  pc.setPixel(14, 3, w + 1);

  // Body — thin vertical strip
  pc.vline(10, 2, 12, b);
  pc.vline(9, 3, 10, b);

  // Head
  pc.fillCircle(10, 2, 1, b);

  // Antennae
  pc.setPixel(8, 0, b);
  pc.setPixel(12, 0, b);
  pc.setPixel(9, 1, b);
  pc.setPixel(11, 1, b);

  PP.applyShading(pc, pal.groups);
  // Eyes
  const e = pal.groups.eyes.startIdx;
  pc.setPixel(9, 2, e + 2);
  pc.setPixel(11, 2, e + 2);
  PP.applyOutlines(pc, pal.groups, 'tinted');
  renderPC(pc, 'bug-butterfly.png');
})();

// ============================================================
// LADYBUG — 16x16, round red body with black spots, small head
// ============================================================
console.log('Ladybug:');
(function() {
  const pal = makePal({ shell: '#dd3322', body: '#222222', spots: '#111111', eyes: '#ffffff' });
  const pc = new PC(16, 16);
  pc.setPalette(pal.palette, pal.groupForIndex);
  const sh = pal.groups.shell.startIdx + 2;
  const b = pal.groups.body.startIdx + 2;
  const sp = pal.groups.spots.startIdx + 2;

  // Shell — round dome
  pc.fillEllipse(8, 9, 6, 5, sh);
  // Shell highlight
  pc.fillEllipse(6, 7, 2, 2, sh + 1);

  // Center line (wing split)
  pc.vline(8, 4, 10, b);

  // Spots — 6 black dots
  pc.fillCircle(5, 7, 1, sp);
  pc.fillCircle(11, 7, 1, sp);
  pc.fillCircle(6, 10, 1, sp);
  pc.fillCircle(10, 10, 1, sp);
  pc.setPixel(5, 12, sp);
  pc.setPixel(11, 12, sp);

  // Head
  pc.fillCircle(8, 4, 2, b);

  // Antennae
  pc.setPixel(6, 1, b);
  pc.setPixel(10, 1, b);
  pc.setPixel(7, 2, b);
  pc.setPixel(9, 2, b);

  // Legs — 6, three per side
  pc.setPixel(2, 7, b); pc.setPixel(3, 8, b);
  pc.setPixel(2, 10, b); pc.setPixel(3, 10, b);
  pc.setPixel(3, 12, b); pc.setPixel(4, 13, b);
  pc.setPixel(14, 7, b); pc.setPixel(13, 8, b);
  pc.setPixel(14, 10, b); pc.setPixel(13, 10, b);
  pc.setPixel(13, 12, b); pc.setPixel(12, 13, b);

  PP.applyShading(pc, pal.groups);
  const e = pal.groups.eyes.startIdx;
  pc.setPixel(7, 3, e + 2);
  pc.setPixel(9, 3, e + 2);
  pc.setPixel(7, 4, e);
  pc.setPixel(9, 4, e);
  PP.applyOutlines(pc, pal.groups, 'tinted');
  renderPC(pc, 'bug-ladybug.png');
})();

// ============================================================
// BEE — 16x14, striped yellow/black body, small wings
// ============================================================
console.log('Bee:');
(function() {
  const pal = makePal({ body: '#eebb33', stripes: '#222200', wing: '#aaccee', eyes: '#ffffff', sting: '#884422' });
  const pc = new PC(16, 14);
  pc.setPalette(pal.palette, pal.groupForIndex);
  const bd = pal.groups.body.startIdx + 2;
  const st = pal.groups.stripes.startIdx + 2;
  const wg = pal.groups.wing.startIdx + 2;
  const sg = pal.groups.sting.startIdx + 2;

  // Body — horizontal oval
  pc.fillEllipse(8, 8, 5, 4, bd);

  // Stripes
  pc.hline(4, 7, 9, st);
  pc.hline(4, 9, 9, st);
  pc.hline(5, 11, 7, st);

  // Head
  pc.fillCircle(3, 7, 2, bd);

  // Wings — translucent, above body
  pc.fillEllipse(7, 3, 3, 2, wg);
  pc.fillEllipse(10, 3, 3, 2, wg);

  // Stinger
  pc.setPixel(14, 8, sg);
  pc.setPixel(15, 8, sg);

  // Antennae
  pc.setPixel(1, 4, bd - 1);
  pc.setPixel(2, 5, bd - 1);
  pc.setPixel(1, 6, bd - 1);

  // Legs
  pc.setPixel(5, 12, bd - 1);
  pc.setPixel(7, 12, bd - 1);
  pc.setPixel(9, 12, bd - 1);

  PP.applyShading(pc, pal.groups);
  const e = pal.groups.eyes.startIdx;
  pc.setPixel(2, 6, e + 2);
  pc.setPixel(2, 7, e);
  PP.applyOutlines(pc, pal.groups, 'tinted');
  renderPC(pc, 'bug-bee.png');
})();

// ============================================================
// ANT — 16x10, three body segments, six legs, small
// ============================================================
console.log('Ant:');
(function() {
  const pal = makePal({ body: '#884433', eyes: '#ffffff' });
  const pc = new PC(18, 12);
  pc.setPalette(pal.palette, pal.groupForIndex);
  const b = pal.groups.body.startIdx + 2;

  // Three clearly separated segments — side view, facing right
  // Abdomen (largest, back left)
  pc.fillEllipse(4, 5, 3, 3, b);
  // Thin waist
  pc.setPixel(7, 5, b);
  // Thorax (middle)
  pc.fillEllipse(9, 5, 2, 2, b);
  // Thin neck
  pc.setPixel(11, 4, b);
  // Head (slightly smaller)
  pc.fillCircle(13, 4, 2, b);

  // Mandibles
  pc.setPixel(15, 3, b - 1);
  pc.setPixel(16, 4, b - 1);
  pc.setPixel(15, 5, b - 1);

  // Antennae — bent
  pc.setPixel(14, 2, b - 1);
  pc.setPixel(15, 1, b - 1);
  pc.setPixel(16, 0, b - 1);

  // Legs — 6, clearly from thorax, bent
  pc.line(7, 6, 6, 9, b - 1);
  pc.line(6, 9, 5, 10, b - 1);
  pc.line(9, 6, 8, 9, b - 1);
  pc.line(8, 9, 7, 10, b - 1);
  pc.line(11, 6, 10, 9, b - 1);
  pc.line(10, 9, 9, 10, b - 1);

  PP.applyShading(pc, pal.groups);
  const e = pal.groups.eyes.startIdx;
  pc.setPixel(14, 3, e + 2);
  pc.setPixel(14, 4, e);
  PP.applyOutlines(pc, pal.groups, 'black');
  renderPC(pc, 'bug-ant.png');
})();

// ============================================================
// DRAGONFLY — 22x10, long thin body, four transparent wings
// ============================================================
console.log('Dragonfly:');
(function() {
  const pal = makePal({ body: '#2266aa', wing: '#aaddff', eyes: '#ffffff', tail: '#1155aa' });
  const pc = new PC(22, 10);
  pc.setPalette(pal.palette, pal.groupForIndex);
  const b = pal.groups.body.startIdx + 2;
  const w = pal.groups.wing.startIdx + 2;
  const tl = pal.groups.tail.startIdx + 2;

  // Tail — long thin, extends left
  pc.hline(0, 5, 10, tl);
  pc.hline(1, 4, 8, tl);

  // Thorax
  pc.fillEllipse(12, 5, 3, 2, b);

  // Head — large compound eyes
  pc.fillCircle(17, 4, 2, b);

  // Wings — 4, two pairs
  // Front pair (larger)
  pc.fillEllipse(10, 2, 5, 1, w);
  pc.fillEllipse(10, 8, 5, 1, w);
  // Back pair
  pc.fillEllipse(8, 2, 4, 1, w);
  pc.fillEllipse(8, 8, 4, 1, w);
  // Wing veins
  pc.hline(6, 2, 8, w - 1);
  pc.hline(6, 8, 8, w - 1);

  PP.applyShading(pc, pal.groups);
  // Large compound eyes
  const e = pal.groups.eyes.startIdx;
  pc.fillCircle(16, 3, 1, e + 1);
  pc.fillCircle(18, 3, 1, e + 1);
  pc.setPixel(16, 3, e);
  pc.setPixel(18, 3, e);
  PP.applyOutlines(pc, pal.groups, 'tinted');
  renderPC(pc, 'bug-dragonfly.png');
})();

// ============================================================
// FIREFLY — 12x12, dark body with glowing abdomen
// ============================================================
console.log('Firefly:');
(function() {
  const pal = makePal({ body: '#444433', glow: '#ccff44', wing: '#666655', eyes: '#ffffff' });
  const pc = new PC(14, 16);
  pc.setPalette(pal.palette, pal.groupForIndex);
  const b = pal.groups.body.startIdx + 2;
  const g = pal.groups.glow.startIdx + 2;
  const w = pal.groups.wing.startIdx + 2;

  // Body — elongated
  pc.fillEllipse(7, 7, 3, 4, b);

  // Glowing abdomen (bottom half)
  pc.fillEllipse(7, 11, 3, 3, g);
  pc.fillEllipse(7, 10, 2, 2, g + 1); // bright core

  // Head
  pc.fillCircle(7, 3, 2, b);

  // Wings (folded along body, darker)
  pc.fillEllipse(3, 6, 2, 3, w);
  pc.fillEllipse(11, 6, 2, 3, w);

  // Antennae — distinct
  pc.line(5, 1, 3, 0, b - 1);
  pc.line(9, 1, 11, 0, b - 1);

  // Legs — 6, thin
  pc.line(5, 8, 3, 10, b - 1);
  pc.line(5, 10, 3, 12, b - 1);
  pc.line(9, 8, 11, 10, b - 1);
  pc.line(9, 10, 11, 12, b - 1);
  pc.setPixel(5, 12, b - 1);
  pc.setPixel(9, 12, b - 1);

  PP.applyShading(pc, pal.groups);
  const e = pal.groups.eyes.startIdx;
  pc.setPixel(6, 2, e + 2);
  pc.setPixel(8, 2, e + 2);
  pc.setPixel(6, 3, e);
  pc.setPixel(8, 3, e);
  PP.applyOutlines(pc, pal.groups, 'tinted');
  renderPC(pc, 'bug-firefly.png');
})();

// ============================================================
// BEETLE — 16x14, hard shell, horned head
// ============================================================
console.log('Beetle:');
(function() {
  const pal = makePal({ shell: '#226633', body: '#223322', horn: '#553311', eyes: '#ffffff' });
  const pc = new PC(16, 14);
  pc.setPalette(pal.palette, pal.groupForIndex);
  const sh = pal.groups.shell.startIdx + 2;
  const b = pal.groups.body.startIdx + 2;
  const h = pal.groups.horn.startIdx + 2;

  // Shell — wide oval
  pc.fillEllipse(8, 8, 6, 5, sh);
  // Shell highlight
  pc.fillEllipse(6, 6, 2, 2, sh + 1);
  // Center line
  pc.vline(8, 4, 9, b);

  // Head
  pc.fillCircle(8, 3, 2, b);

  // Horn
  pc.vline(8, 0, 2, h);
  pc.setPixel(7, 0, h);
  pc.setPixel(9, 0, h);

  // Legs — 6
  pc.line(2, 7, 0, 9, b);
  pc.line(2, 9, 0, 11, b);
  pc.line(3, 11, 1, 13, b);
  pc.line(14, 7, 16, 9, b);
  pc.line(14, 9, 16, 11, b);
  pc.line(13, 11, 15, 13, b);

  PP.applyShading(pc, pal.groups);
  const e = pal.groups.eyes.startIdx;
  pc.setPixel(7, 3, e + 2);
  pc.setPixel(9, 3, e + 2);
  pc.setPixel(7, 3, e);
  pc.setPixel(9, 3, e);
  PP.applyOutlines(pc, pal.groups, 'tinted');
  renderPC(pc, 'bug-beetle.png');
})();

// ============================================================
// CRICKET — 16x12, jumping legs, long antennae
// ============================================================
console.log('Cricket:');
(function() {
  const pal = makePal({ body: '#668833', legs: '#445522', eyes: '#ffffff' });
  const pc = new PC(16, 12);
  pc.setPalette(pal.palette, pal.groupForIndex);
  const b = pal.groups.body.startIdx + 2;
  const lg = pal.groups.legs.startIdx + 2;

  // Body — elongated, side view facing right
  pc.fillEllipse(8, 5, 5, 3, b);

  // Head
  pc.fillCircle(13, 4, 2, b);

  // Long antennae
  pc.line(14, 2, 15, 0, b - 1);
  pc.setPixel(15, 0, b - 1);

  // Back jumping legs — large, bent
  pc.line(4, 7, 2, 4, lg); // upper leg up
  pc.line(2, 4, 0, 8, lg); // lower leg down to ground
  pc.line(5, 7, 3, 4, lg);
  pc.line(3, 4, 1, 9, lg);

  // Front legs — small
  pc.line(10, 7, 9, 10, lg);
  pc.line(12, 7, 11, 10, lg);

  // Wing texture
  pc.setPixel(7, 4, b + 1);
  pc.setPixel(9, 4, b + 1);

  PP.applyShading(pc, pal.groups);
  const e = pal.groups.eyes.startIdx;
  pc.setPixel(14, 3, e + 2);
  pc.setPixel(14, 4, e);
  PP.applyOutlines(pc, pal.groups, 'tinted');
  renderPC(pc, 'bug-cricket.png');
})();

// ============================================================
// PLAYER with net — 24x32
// ============================================================
console.log('Player:');
(function() {
  const pal = makePal({
    skin: '#f5d0a9', shirt: '#44aa55', shorts: '#445566',
    shoes: '#664422', hair: '#553322', eyes: '#446644',
    net: '#aabbcc', handle: '#8b6914',
  });
  const pc = new PC(24, 32);
  pc.setPalette(pal.palette, pal.groupForIndex);
  const s = pal.groups.skin.startIdx + 2;
  const sh = pal.groups.shirt.startIdx + 2;
  const sr = pal.groups.shorts.startIdx + 2;
  const sho = pal.groups.shoes.startIdx + 2;
  const h = pal.groups.hair.startIdx + 2;
  const nt = pal.groups.net.startIdx + 2;
  const hd = pal.groups.handle.startIdx + 2;

  // Net handle (behind body)
  pc.line(16, 6, 22, 0, hd);
  pc.line(17, 6, 23, 0, hd);
  // Net ring
  pc.fillCircle(22, 2, 3, nt);
  pc.fillCircle(22, 2, 2, 0); // hollow center

  // Head
  pc.fillEllipse(10, 7, 5, 6, s);

  // Hair — messy cap
  pc.fillEllipse(10, 4, 5, 3, h);
  pc.fillRect(5, 5, 2, 4, h);
  pc.fillRect(14, 5, 2, 3, h);

  // Neck
  pc.fillRect(9, 13, 3, 2, s);

  // Shirt
  pc.fillRect(5, 15, 11, 8, sh);
  // Collar
  pc.hline(7, 15, 7, sh + 1);

  // Arms
  pc.fillRect(2, 15, 3, 8, s);
  pc.fillRect(16, 15, 3, 7, s);
  // Hands
  pc.fillCircle(3, 23, 1, s);
  pc.fillCircle(17, 22, 1, s);

  // Shorts
  pc.fillRect(5, 23, 5, 4, sr);
  pc.fillRect(11, 23, 5, 4, sr);

  // Legs
  pc.fillRect(6, 27, 3, 2, s);
  pc.fillRect(12, 27, 3, 2, s);

  // Shoes
  pc.fillRect(5, 29, 4, 2, sho);
  pc.fillRect(12, 29, 4, 2, sho);

  // Shirt pocket
  pc.fillRect(7, 17, 3, 2, sh - 1);

  PP.applyShading(pc, pal.groups);
  // Face after shading
  const e = pal.groups.eyes.startIdx;
  pc.hline(8, 7, 2, e + 2); pc.hline(8, 8, 2, e + 2);
  pc.setPixel(8, 8, e + 1); pc.setPixel(8, 7, e); pc.setPixel(8, 7, e + 3);
  pc.hline(11, 7, 2, e + 2); pc.hline(11, 8, 2, e + 2);
  pc.setPixel(12, 8, e + 1); pc.setPixel(12, 7, e); pc.setPixel(11, 7, e + 3);
  // Nose
  pc.setPixel(10, 9, s - 1);
  // Smile
  pc.hline(9, 11, 3, s - 1);
  pc.setPixel(8, 10, s - 1);
  pc.setPixel(12, 10, s - 1);
  PP.applyOutlines(pc, pal.groups, 'tinted');
  renderPC(pc, 'bug-player.png');
})();

console.log('\nDone. Check engine/sprites/verify/bug-*.png');
