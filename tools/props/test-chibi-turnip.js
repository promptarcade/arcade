// Turnip Crop — Chibi tier (32x36)
// Coral Island / Stardew Valley style: round bulbous root, leafy top,
// warm palette, tinted outlines, reads as a freshly pulled turnip.

module.exports = {
  width: 32,
  height: 36,
  style: 'chibi',
  entityType: 'prop',
  colors: {
    body: '#e8c8dd',       // pale pink-white turnip body
    purple: '#9944aa',     // purple crown where stem meets root
    leaf: '#55aa44',       // green leafy top
    stem: '#77bb55',       // lighter green stem
    dirt: '#996644',       // soil/root tip
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const p = pal.groups.purple.startIdx;
    const lf = pal.groups.leaf.startIdx;
    const st = pal.groups.stem.startIdx;
    const d = pal.groups.dirt.startIdx;
    const cx = 16, rootTop = 14;

    // === LEAFY TOP (3 leaves fanning out) ===

    // Center leaf — tallest, broad
    pc.fillTriangle(cx, 2, cx - 4, 14, cx + 4, 14, lf + 2);
    // Fill it out with a wider base
    pc.fillRect(cx - 3, 10, 7, 4, lf + 2);
    // Center vein
    pc.vline(cx, 3, 10, lf + 3);

    // Left leaf — angled left
    pc.fillTriangle(cx - 3, 5, cx - 10, 12, cx - 2, 14, lf + 2);
    // Left leaf vein
    pc.line(cx - 3, 6, cx - 7, 11, lf + 3);
    // Left leaf shading
    pc.line(cx - 9, 12, cx - 5, 12, lf + 1);

    // Right leaf — angled right
    pc.fillTriangle(cx + 3, 5, cx + 10, 12, cx + 2, 14, lf + 2);
    // Right leaf vein
    pc.line(cx + 3, 6, cx + 7, 11, lf + 3);
    // Right leaf shading
    pc.line(cx + 9, 12, cx + 5, 12, lf + 1);

    // Small inner leaves
    pc.fillTriangle(cx - 1, 8, cx - 5, 14, cx + 1, 14, st + 2);
    pc.fillTriangle(cx + 1, 8, cx - 1, 14, cx + 5, 14, st + 2);

    // === TURNIP ROOT BODY ===

    // Main bulb — wide ellipse, slightly tapered bottom
    // Upper section (widest)
    for (let row = 0; row < 18; row++) {
      const t = row / 17;
      let halfW;
      if (t < 0.15) {
        // Top where crown meets root — starts narrow
        halfW = Math.round(6 + 6 * (t / 0.15));
      } else if (t < 0.5) {
        // Widest part of the bulb
        const u = (t - 0.15) / 0.35;
        halfW = Math.round(12 + 2 * Math.sin(u * Math.PI / 2));
      } else if (t < 0.8) {
        // Start tapering
        const u = (t - 0.5) / 0.3;
        halfW = Math.round(14 - 6 * u);
      } else {
        // Tail — tapers to narrow root tip
        const u = (t - 0.8) / 0.2;
        halfW = Math.round(8 - 7 * u);
      }
      const y = rootTop + row;
      if (halfW > 0) {
        pc.hline(cx - halfW, y, halfW * 2 + 1, b + 2);
      }
    }

    // Purple crown — gradient at top of root
    for (let row = 0; row < 5; row++) {
      const t = row / 4;
      const y = rootTop + row;
      // Get the width at this row
      let halfW = Math.round(6 + 6 * Math.min(1, (row / 17) / 0.15));
      if (halfW > 14) halfW = 14;
      // Purple fades: full purple at top, blending at bottom
      const purpleW = Math.round(halfW * (1 - t * 0.5));
      pc.hline(cx - purpleW, y, purpleW * 2 + 1, p + 2);
      // Darker purple at very top
      if (row < 2) {
        pc.hline(cx - purpleW + 1, y, purpleW * 2 - 1, p + 1);
      }
    }

    // Highlight — upper-left on the white part
    pc.fillEllipse(cx - 4, rootTop + 7, 3, 4, b + 3);
    // Smaller specular dot
    pc.setPixel(cx - 5, rootTop + 5, b + 3);
    pc.setPixel(cx - 4, rootTop + 5, b + 3);

    // Right-side shadow
    for (let row = 4; row < 15; row++) {
      const t = row / 17;
      let halfW;
      if (t < 0.15) halfW = Math.round(6 + 6 * (t / 0.15));
      else if (t < 0.5) halfW = Math.round(12 + 2 * Math.sin(((t - 0.15) / 0.35) * Math.PI / 2));
      else if (t < 0.8) halfW = Math.round(14 - 6 * ((t - 0.5) / 0.3));
      else halfW = Math.round(8 - 7 * ((t - 0.8) / 0.2));
      const y = rootTop + row;
      if (halfW > 4) {
        pc.setPixel(cx + halfW - 1, y, b + 0);
        pc.setPixel(cx + halfW - 2, y, b + 1);
      }
    }

    // Bottom shadow on the underside
    for (let row = 14; row < 17; row++) {
      const t = row / 17;
      let halfW;
      if (t < 0.8) halfW = Math.round(14 - 6 * ((t - 0.5) / 0.3));
      else halfW = Math.round(8 - 7 * ((t - 0.8) / 0.2));
      const y = rootTop + row;
      if (halfW > 1) {
        pc.hline(cx - halfW + 1, y, halfW * 2 - 1, b + 1);
      }
    }

    // Root tip — small brown/dirty point
    pc.setPixel(cx, rootTop + 17, d + 2);
    pc.setPixel(cx, rootTop + 18, d + 1);
    pc.setPixel(cx - 1, rootTop + 16, d + 2);
    pc.setPixel(cx + 1, rootTop + 16, d + 2);

    // Thin root lines (hair roots)
    pc.setPixel(cx - 3, rootTop + 14, d + 2);
    pc.setPixel(cx - 4, rootTop + 15, d + 1);
    pc.setPixel(cx + 4, rootTop + 12, d + 2);
    pc.setPixel(cx + 5, rootTop + 13, d + 1);
  },

  drawPost(pc, pal) {
    const b = pal.groups.body.startIdx;
    const cx = 16, rootTop = 14;

    // Restore specular highlights that shading may have dulled
    pc.setPixel(cx - 5, rootTop + 5, b + 3);
    pc.setPixel(cx - 4, rootTop + 5, b + 3);
    pc.setPixel(cx - 4, rootTop + 6, b + 3);
  },
};
