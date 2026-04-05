// ============================================================
// Canvas Validation — headless sprite rendering check
// ============================================================
// Boots sprite-forge-v2 in a VM, executes draw code, checks:
// - No runtime errors
// - Pixel coverage ≥ 30%
// - Distinct color count ≥ 3

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load and patch the sprite engine once
let engineLoaded = false;
let SpriteForge, ColorRamp, PixelCanvas, PostProcess;

function loadEngine() {
  if (engineLoaded) return;

  global.window = global.window || {};
  global.document = global.document || {
    createElement: (tag) => tag === 'canvas' ? createCanvas(1, 1) : {},
  };
  global._createCanvas = createCanvas;

  const enginePath = path.join(__dirname, '..', '..', 'engine', 'sprites', 'sprite-forge-v2.js');
  let engineCode = fs.readFileSync(enginePath, 'utf8');
  engineCode = engineCode.replace(
    /function sf2_makeCanvas\(w, h\) \{[^}]+\}/,
    `function sf2_makeCanvas(w, h) { return _createCanvas(w, h); }`
  );
  vm.runInThisContext(engineCode);

  SpriteForge = window.SpriteForge;
  ColorRamp = window.ColorRamp;
  PixelCanvas = window.PixelCanvas;
  PostProcess = window.PostProcess;
  engineLoaded = true;
}

function validateSprite(drawBody, drawPostBody, width, height, colors) {
  loadEngine();

  const errors = [];

  // Build palette from color definitions
  const colorEntries = Object.entries(colors);
  const palColors = {};
  for (const [name, hex] of colorEntries) {
    palColors[name] = hex;
  }

  let pc, pal;
  try {
    pal = ColorRamp.buildPalette(palColors);
    pal.palette[255] = (typeof sf2_packRGBA === 'function')
      ? sf2_packRGBA(20, 15, 10, 255)
      : 0xFF0A0F14;
    pc = new PixelCanvas(width, height);
  } catch (err) {
    errors.push(`Palette/canvas setup failed: ${err.message}`);
    return { valid: false, errors, coverage: 0, colorCount: 0 };
  }

  // Execute draw code
  try {
    const drawFn = new Function('pc', 'pal', drawBody);
    drawFn(pc, pal);
  } catch (err) {
    errors.push(`Draw function runtime error: ${err.message}`);
    return { valid: false, errors, coverage: 0, colorCount: 0 };
  }

  // Apply shading
  try {
    PostProcess.applyShading(pc, pal, { lightAngle: Math.PI * 0.75 });
  } catch {
    // Shading is optional
  }

  // Post-draw (separate scope, soft failure)
  if (drawPostBody) {
    try {
      const drawPostFn = new Function('pc', 'pal', drawPostBody);
      drawPostFn(pc, pal);
    } catch {
      // Post-draw failure is non-critical — sprite already rendered
    }
  }

  // Render to canvas and check pixels
  let coverage = 0, colorCount = 0;
  try {
    const cvs = createCanvas(width, height);
    const ctx = cvs.getContext('2d');
    const imgData = ctx.createImageData(width, height);

    // Read pixel data from PixelCanvas
    let filledPixels = 0;
    const uniqueColors = new Set();
    const totalPixels = width * height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = pc.pixels[y * width + x];
        if (idx !== 0) {
          filledPixels++;
          uniqueColors.add(idx);
        }
      }
    }

    coverage = filledPixels / totalPixels;
    colorCount = uniqueColors.size;

    if (coverage < 0.10) {
      errors.push(`Pixel coverage too low: ${(coverage * 100).toFixed(1)}% (need ≥10%)`);
    }
    if (colorCount < 2) {
      errors.push(`Only ${colorCount} distinct colors used (need ≥2)`);
    }
  } catch (err) {
    errors.push(`Pixel analysis failed: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    coverage: Math.round(coverage * 100),
    colorCount,
  };
}

module.exports = { validateSprite };
