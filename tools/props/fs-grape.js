// Grape Cluster — 40x44 for Fruit Slash
// 7 small purple spheres in a triangular bunch, green stem at top.
// Each grape has a highlight dot.

module.exports = {
  width: 40,
  height: 44,
  colors: {
    grape: '#7b2d8e',     // rich purple
    stem: '#4a8c2a',      // green stem/vine
  },

  draw(pc, pal) {
    const g = pal.groups.grape.startIdx;
    const s = pal.groups.stem.startIdx;
    const cx = 20, cy = 24;

    // Green stem at top
    pc.fillRect(cx - 1, cy - 20, 3, 6, s + 2);
    pc.setPixel(cx, cy - 21, s + 3);
    pc.setPixel(cx - 1, cy - 20, s + 1);
    pc.setPixel(cx + 1, cy - 20, s + 3);

    // Small leaf at top-right of stem
    pc.fillEllipse(cx + 4, cy - 18, 4, 2, s + 2);
    pc.fillEllipse(cx + 4, cy - 18, 3, 1, s + 3);
    // Leaf vein
    pc.hline(cx + 2, cy - 18, 5, s + 1);

    // Vine tendril curling left
    pc.setPixel(cx - 3, cy - 17, s + 2);
    pc.setPixel(cx - 4, cy - 16, s + 2);
    pc.setPixel(cx - 4, cy - 15, s + 1);

    // Stem connects down to first grape
    pc.vline(cx, cy - 14, 3, s + 1);

    // Draw individual grapes in a triangular cluster
    // Row 1 (top): 1 grape
    const grapes = [
      { x: cx,     y: cy - 10 },   // top center

      // Row 2: 2 grapes
      { x: cx - 5, y: cy - 4 },
      { x: cx + 5, y: cy - 4 },

      // Row 3: 3 grapes (widest)
      { x: cx - 7, y: cy + 3 },
      { x: cx,     y: cy + 3 },
      { x: cx + 7, y: cy + 3 },

      // Row 4 (bottom): 1 grape hanging below
      { x: cx,     y: cy + 10 },
    ];

    // Draw each grape as a shaded circle
    for (const grape of grapes) {
      // Base circle
      pc.fillCircle(grape.x, grape.y, 5, g + 1);
      // Lit area
      pc.fillCircle(grape.x - 1, grape.y - 1, 4, g + 2);
      // Core highlight
      pc.fillCircle(grape.x - 1, grape.y - 1, 2, g + 3);
    }

    // Dark gap lines between grapes for separation
    // Between row 2 grapes
    pc.setPixel(cx, cy - 4, g + 0);
    // Between row 3 grapes
    pc.setPixel(cx - 3, cy + 3, g + 0);
    pc.setPixel(cx + 3, cy + 3, g + 0);
    // Between rows
    pc.setPixel(cx - 3, cy - 1, g + 0);
    pc.setPixel(cx + 3, cy - 1, g + 0);
    pc.setPixel(cx, cy + 6, g + 0);
  },

  drawPost(pc, pal) {
    const g = pal.groups.grape.startIdx;
    const cx = 20, cy = 24;

    // Specular highlight dot on each grape (upper-left)
    const grapes = [
      { x: cx,     y: cy - 10 },
      { x: cx - 5, y: cy - 4 },
      { x: cx + 5, y: cy - 4 },
      { x: cx - 7, y: cy + 3 },
      { x: cx,     y: cy + 3 },
      { x: cx + 7, y: cy + 3 },
      { x: cx,     y: cy + 10 },
    ];

    for (const grape of grapes) {
      pc.setPixel(grape.x - 2, grape.y - 3, g + 3);
    }
  },
};
