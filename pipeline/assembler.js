// ============================================================
// Assembler — contract-enforcing template compiler, zero AI
// ============================================================
// Validates and normalizes at every join point. Enforces:
// - Sprite keys always quoted
// - Mechanic constructors always receive arrays
// - Layout code references all sprites
// - No strict mode (generated code can't guarantee compliance)

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, 'template', 'game.html');
const ENGINE_PATH = path.join(__dirname, '..', 'engine', 'sprites', 'sprite-forge-v2.js');

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '');
}

function buildSpriteBlock(s) {
  // Always quote color keys to handle hyphens
  const palDef = Object.entries(s.colors)
    .map(([name, hex]) => `    '${name}': '${hex}'`)
    .join(',\n');

  return `
// --- Sprite: ${s.name} (${s.width}x${s.height}) ---
const sprite_${safeName(s.name)} = (function() {
  var colors = {\n${palDef}\n  };
  var pal = ColorRamp.buildPalette(colors);
  pal.palette[255] = sf2_packRGBA(20, 15, 10, 255);
  var pc = new PixelCanvas(${s.width}, ${s.height});

  // Draw
  (function(pc, pal) {
    ${s.drawBody}
  })(pc, pal);

  // Shading
  PostProcess.applyShading(pc, pal, { lightAngle: Math.PI * 0.75 });

  ${s.drawPostBody ? `// Post-draw\n  (function(pc, pal) {\n    ${s.drawPostBody}\n  })(pc, pal);` : ''}

  // Render to ImageData
  var cvs = document.createElement('canvas');
  cvs.width = ${s.width}; cvs.height = ${s.height};
  var sCtx = cvs.getContext('2d');
  var img = sCtx.createImageData(${s.width}, ${s.height});
  for (var y = 0; y < ${s.height}; y++) {
    for (var x = 0; x < ${s.width}; x++) {
      var idx = pc.pixels[y * ${s.width} + x];
      var rgba = pal.palette[idx] || 0;
      var pi = (y * ${s.width} + x) * 4;
      img.data[pi]     = rgba & 0xFF;
      img.data[pi + 1] = (rgba >> 8) & 0xFF;
      img.data[pi + 2] = (rgba >> 16) & 0xFF;
      img.data[pi + 3] = (rgba >> 24) & 0xFF;
    }
  }
  sCtx.putImageData(img, 0, 0);
  return cvs;
})();`;
}

function buildMechanicBlock(m) {
  return `
// --- Mechanic: ${m.className} ---
${m.classCode}`;
}

function buildEntityNormalizer() {
  // Injected before mechanics — ensures constructors always get arrays
  return `
// Entity array normalizer — contract enforcement
function _toEntityArray(arg) {
  if (Array.isArray(arg)) return arg;
  if (arg && typeof arg === 'object') {
    if (Array.isArray(arg.entities)) return arg.entities;
    if (Array.isArray(arg.sprites)) return arg.sprites;
    return [arg];
  }
  return [];
}`;
}

function assemble({ title, sprites, mechanics, layout }) {
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const engine = fs.readFileSync(ENGINE_PATH, 'utf8');

  const spriteCode = sprites.map(buildSpriteBlock).join('\n\n');
  const mechanicsCode = buildEntityNormalizer() + mechanics.map(buildMechanicBlock).join('\n\n');

  // Normalize layout code: ensure mechanic constructors use _toEntityArray
  let stateCode = layout.stateCode || '';
  for (const m of mechanics) {
    // Match both `new ClassName()` (empty) and `new ClassName(xxx)` (with args)
    const reEmpty = new RegExp(`new\\s+${m.className}\\s*\\(\\)`, 'g');
    stateCode = stateCode.replace(reEmpty, `new ${m.className}([])`);

    const reArgs = new RegExp(`new\\s+${m.className}\\s*\\(([^)]+)\\)`, 'g');
    stateCode = stateCode.replace(reArgs, (match, arg) => {
      if (arg === '[]' || arg.includes('_toEntityArray')) return match;
      return `new ${m.className}(_toEntityArray(${arg}))`;
    });
  }

  const replacements = {
    '{{TITLE}}': title,
    '{{ENGINE}}': engine,
    '{{SPRITES}}': spriteCode,
    '{{MECHANICS}}': mechanicsCode,
    '{{LAYOUT}}': stateCode,
    '{{INPUT}}': layout.inputCode || '',
    '{{UPDATE}}': layout.updateCode || '',
    '{{DRAW}}': layout.drawCode || '',
    '{{BOOT}}': layout.bootCode || '',
  };

  for (const [marker, value] of Object.entries(replacements)) {
    html = html.replace(marker, value);
  }

  // Verify no unreplaced markers remain
  const remaining = html.match(/\{\{[A-Z]+\}\}/g);
  if (remaining) {
    throw new Error(`Unreplaced markers in template: ${remaining.join(', ')}`);
  }

  return html;
}

module.exports = { assemble };
