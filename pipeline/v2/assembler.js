// ============================================================
// v2 Assembler — simple template compiler
// ============================================================

const fs = require('fs');
const path = require('path');

const TEMPLATE = path.join(__dirname, 'template', 'app.html');
const ENGINE = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');

function safeName(id) {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

function assemble({ title, shapes, behaviors, wiring, layout }) {
  let html = fs.readFileSync(TEMPLATE, 'utf8');
  const engine = fs.readFileSync(ENGINE, 'utf8');

  // Build shape renderers
  const shapeCode = shapes.map(s => {
    const palDef = Object.entries(s.colors)
      .map(([name, hex]) => `'${name}': '${hex}'`)
      .join(', ');

    return `var sprite_${safeName(s.id)} = (function() {
  var pal = ColorRamp.buildPalette({${palDef}});
  pal.palette[255] = sf2_packRGBA(20, 15, 10, 255);
  var pc = new PixelCanvas(${s.w}, ${s.h});
  (function(pc, pal) { ${s.drawBody} })(pc, pal);
  try { PostProcess.applyShading(pc, pal, { lightAngle: Math.PI * 0.75 }); } catch(e) {}
  var cvs = document.createElement('canvas');
  cvs.width = ${s.w}; cvs.height = ${s.h};
  var sCtx = cvs.getContext('2d');
  var img = sCtx.createImageData(${s.w}, ${s.h});
  for (var y = 0; y < ${s.h}; y++) {
    for (var x = 0; x < ${s.w}; x++) {
      var idx = pc.pixels[y * ${s.w} + x];
      var rgba = pal.palette[idx] || 0;
      var pi = (y * ${s.w} + x) * 4;
      img.data[pi] = rgba & 0xFF;
      img.data[pi+1] = (rgba >> 8) & 0xFF;
      img.data[pi+2] = (rgba >> 16) & 0xFF;
      img.data[pi+3] = (rgba >> 24) & 0xFF;
    }
  }
  sCtx.putImageData(img, 0, 0);
  return cvs;
})();`;
  }).join('\n\n');

  // Build shape state
  const stateEntries = shapes.map(s => {
    const pos = layout[s.id] || { x: '50%', y: '50%' };
    const xExpr = typeof pos === 'string' && pos === 'tile' ? '0'
      : pos.x.includes('%') ? `W * ${parseFloat(pos.x) / 100}` : pos.x;
    const yExpr = typeof pos === 'string' && pos === 'tile' ? '0'
      : pos.y.includes('%') ? `H * ${parseFloat(pos.y) / 100}` : pos.y;

    return `'${s.id}': { x: ${xExpr}, y: ${yExpr}, w: ${s.w}, h: ${s.h}, vx: 0, vy: 0, sprite: sprite_${safeName(s.id)}, visible: ${pos === 'tile' ? 'false' : 'true'} }`;
  }).join(',\n  ');
  const shapeState = `{\n  ${stateEntries}\n}`;

  // Build behavior functions
  const behaviorCode = behaviors.map(b => {
    return `var ${safeName(b.id)} = function(shapes, dt, W, H, S, inputState) {\n${b.code}\n};`;
  }).join('\n\n');
  const behaviorList = behaviors.map(b => safeName(b.id)).join(', ');

  // Tile backgrounds
  const tileShapes = shapes.filter(s => s.tile);
  const tileBg = tileShapes.map(s => {
    return `for (var ty = 0; ty * ${s.h} * S < H; ty++) for (var tx = 0; tx * ${s.w} * S < W; tx++) ctx.drawImage(sprite_${safeName(s.id)}, tx*${s.w}*S, ty*${s.h}*S, ${s.w}*S, ${s.h}*S);`;
  }).join('\n  ');

  const replacements = {
    '{{TITLE}}': title,
    '{{ENGINE}}': engine,
    '{{SHAPES}}': shapeCode,
    '{{SHAPE_STATE}}': shapeState,
    '{{BEHAVIORS}}': behaviorCode,
    '{{BEHAVIOR_LIST}}': behaviorList,
    '{{INPUT}}': wiring.inputCode || '',
    '{{TILE_BG}}': tileBg || '',
    '{{EVENT_HANDLERS}}': wiring.eventHandlers || '',
  };

  for (const [marker, value] of Object.entries(replacements)) {
    html = html.replace(marker, value);
  }

  const remaining = html.match(/\{\{[A-Z_]+\}\}/g);
  if (remaining) throw new Error(`Unreplaced markers: ${remaining.join(', ')}`);

  return html;
}

module.exports = { assemble };
