// ============================================================
// Sprite Lab Core — reusable helpers for sprite verification
// ============================================================
// Usage:
//   const lab = require('./sprite-lab-core');
//   lab.renderPC(pc, 'my-sprite.png');
//   lab.renderSheet(sfResult, 'my-sheet.png');
//   lab.renderStatic(sfStaticResult, 'my-prop.png');
//   lab.renderComposite([{label, pc}, ...], 'comparison.png');

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// ENGINE LOADING
// ============================================================

// Patch globals for the engine
global.window = global.window || {};
global.document = global.document || {
  createElement: (tag) => tag === 'canvas' ? createCanvas(1, 1) : {},
};

// Make createCanvas available to the VM context (require doesn't work there)
global._createCanvas = createCanvas;

const enginePath = path.join(__dirname, '..', 'engine', 'sprites', 'sprite-forge-v2.js');
let engineCode = fs.readFileSync(enginePath, 'utf8');
engineCode = engineCode.replace(
  /function sf2_makeCanvas\(w, h\) \{[^}]+\}/,
  `function sf2_makeCanvas(w, h) { return _createCanvas(w, h); }`
);
vm.runInThisContext(engineCode);

const SpriteForge = window.SpriteForge;
const ColorRamp = window.ColorRamp;
const PixelCanvas = window.PixelCanvas;
const PostProcess = window.PostProcess;

if (!SpriteForge || !SpriteForge.character) {
  throw new Error('Failed to load SpriteForge engine. Keys: ' + Object.keys(window.SpriteForge || {}));
}

// ============================================================
// OUTPUT DIRECTORY
// ============================================================

const outDir = path.join(__dirname, '..', 'engine', 'sprites', 'verify');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ============================================================
// HELPERS
// ============================================================

function makePal(colors, opts) {
  const pal = ColorRamp.buildPalette(colors, opts);
  pal.palette[255] = sf2_packRGBA(20, 15, 10, 255);
  return pal;
}

// ============================================================
// RENDERERS
// ============================================================

// Render a PixelCanvas to PNG at given scale, with pixel grid and game-scale inset
function renderPC(pc, filename, opts) {
  opts = opts || {};
  var scale = opts.scale || 8;
  var showGameScale = opts.gameScale !== false; // default true

  var mainW = pc.width * scale;
  var mainH = pc.height * scale;
  // If showing game scale, add space on the right for 1x, 2x, 4x previews
  var previewW = showGameScale ? Math.max(pc.width * 4 + 16, 80) : 0;
  var totalW = mainW + previewW;
  var totalH = mainH;

  var cvs = createCanvas(totalW, totalH);
  var ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, totalW, totalH);

  // Draw main (8x) sprite
  blitPC(ctx, pc, 0, 0, scale);

  // Pixel grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (var x = 0; x <= pc.width; x++) {
    ctx.beginPath(); ctx.moveTo(x * scale, 0); ctx.lineTo(x * scale, mainH); ctx.stroke();
  }
  for (var y = 0; y <= pc.height; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * scale); ctx.lineTo(mainW, y * scale); ctx.stroke();
  }

  // Game-scale previews on the right
  if (showGameScale) {
    var px = mainW + 8;
    var py = 8;

    // Labels
    ctx.fillStyle = '#667';
    ctx.font = '10px monospace';

    // 4x preview
    ctx.fillText('4x', px, py - 2);
    py += 2;
    blitPC(ctx, pc, px, py, 4);
    py += pc.height * 4 + 12;

    // 2x preview
    ctx.fillStyle = '#667';
    ctx.fillText('2x', px, py - 2);
    py += 2;
    blitPC(ctx, pc, px, py, 2);
    py += pc.height * 2 + 12;

    // 1x preview (actual game size)
    ctx.fillStyle = '#667';
    ctx.fillText('1x', px, py - 2);
    py += 2;
    blitPC(ctx, pc, px, py, 1);
  }

  var outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, cvs.toBuffer('image/png'));
  console.log('  -> ' + filename + ' (' + pc.width + 'x' + pc.height + ')');
}

// Render a SpriteForge.character/creature/buildSheet result (full sprite sheet)
function renderSheet(result, filename, opts) {
  opts = opts || {};
  var scale = opts.scale || 6;
  var sheet = result.sheet;
  var src = sheet.canvas;
  var fw = sheet.frameWidth;
  var fh = sheet.frameHeight;

  // Main sheet at scale
  var mainW = src.width * scale;
  var mainH = src.height * scale;
  // Add space for game-scale preview of first frame
  var previewW = Math.max(fw * 4 + 16, 60);
  var totalW = mainW + previewW;

  var cvs = createCanvas(totalW, mainH);
  var ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, totalW, mainH);

  // Draw full sheet scaled
  ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, mainW, mainH);

  // Frame grid
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (var x = 0; x <= src.width; x += fw) {
    ctx.beginPath(); ctx.moveTo(x * scale, 0); ctx.lineTo(x * scale, mainH); ctx.stroke();
  }
  for (var y = 0; y <= src.height; y += fh) {
    ctx.beginPath(); ctx.moveTo(0, y * scale); ctx.lineTo(mainW, y * scale); ctx.stroke();
  }

  // Game-scale previews of first frame on the right
  var px = mainW + 8;
  var py = 8;
  ctx.fillStyle = '#667';
  ctx.font = '10px monospace';

  // 4x
  ctx.fillText('4x', px, py - 2); py += 2;
  ctx.drawImage(src, 0, 0, fw, fh, px, py, fw * 4, fh * 4);
  py += fh * 4 + 12;

  // 2x
  ctx.fillStyle = '#667';
  ctx.fillText('2x', px, py - 2); py += 2;
  ctx.drawImage(src, 0, 0, fw, fh, px, py, fw * 2, fh * 2);
  py += fh * 2 + 12;

  // 1x
  ctx.fillStyle = '#667';
  ctx.fillText('1x', px, py - 2); py += 2;
  ctx.drawImage(src, 0, 0, fw, fh, px, py, fw, fh);

  var outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, cvs.toBuffer('image/png'));
  console.log('  -> ' + filename + ' (sheet ' + src.width + 'x' + src.height + ', frame ' + fw + 'x' + fh + ')');
}

// Render a SpriteForge.static() result
function renderStatic(result, filename, opts) {
  renderPC(result.pc, filename, opts);
}

// Render multiple sprites side-by-side in a contact sheet
function renderComposite(items, filename, opts) {
  opts = opts || {};
  var scale = opts.scale || 6;
  var padding = opts.padding || 8;
  var labelH = 14;

  // items = [{ label, pc }] or [{ label, result }] (sheet result)
  // Calculate total size
  var totalW = padding;
  var maxH = 0;
  var entries = items.map(function(item) {
    var w, h;
    if (item.pc) {
      w = item.pc.width * scale;
      h = item.pc.height * scale;
    } else if (item.result && item.result.sheet) {
      var fw = item.result.sheet.frameWidth;
      var fh = item.result.sheet.frameHeight;
      w = fw * scale;
      h = fh * scale;
    } else {
      w = 32 * scale; h = 32 * scale;
    }
    totalW += w + padding;
    if (h > maxH) maxH = h;
    return { ...item, drawW: w, drawH: h };
  });
  var totalH = maxH + labelH + padding * 2;

  var cvs = createCanvas(totalW, totalH);
  var ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, totalW, totalH);

  var x = padding;
  entries.forEach(function(entry) {
    var y = padding + labelH;
    // Label
    ctx.fillStyle = '#889';
    ctx.font = '11px monospace';
    ctx.fillText(entry.label || '', x, y - 3);

    if (entry.pc) {
      blitPC(ctx, entry.pc, x, y, scale);
    } else if (entry.result && entry.result.sheet) {
      var sheet = entry.result.sheet;
      ctx.drawImage(sheet.canvas, 0, 0, sheet.frameWidth, sheet.frameHeight,
                    x, y, sheet.frameWidth * scale, sheet.frameHeight * scale);
    }

    x += entry.drawW + padding;
  });

  var outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, cvs.toBuffer('image/png'));
  console.log('  -> ' + filename + ' (composite, ' + items.length + ' sprites)');
}

// Low-level: blit a PixelCanvas to a canvas context at given position and scale
function blitPC(ctx, pc, dx, dy, scale) {
  for (var y = 0; y < pc.height; y++) {
    for (var x = 0; x < pc.width; x++) {
      var idx = pc.pixels[y * pc.width + x];
      if (idx === 0) continue;
      var rgba = pc.palette[idx];
      var r = rgba & 0xFF, g = (rgba >> 8) & 0xFF, b = (rgba >> 16) & 0xFF;
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(dx + x * scale, dy + y * scale, scale, scale);
    }
  }
}

// ============================================================
// CLI FILTER
// ============================================================

// Returns true if this sprite should be rendered based on CLI args.
// Usage: if (lab.shouldRender('knight')) { ... }
// With no CLI args, renders everything.
var _cliFilter = null;
function shouldRender(name) {
  if (_cliFilter === null) {
    var args = process.argv.slice(2);
    _cliFilter = args.length > 0 ? args.map(function(a) { return a.toLowerCase(); }) : [];
  }
  if (_cliFilter.length === 0) return true;
  var lower = name.toLowerCase();
  return _cliFilter.some(function(f) { return lower.includes(f); });
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Engine references
  SpriteForge,
  ColorRamp,
  PixelCanvas,
  PostProcess,

  // Helpers
  makePal,
  outDir,

  // Renderers
  renderPC,
  renderSheet,
  renderStatic,
  renderComposite,

  // CLI
  shouldRender,
};
