// Snip & Feed — Collectible star 24x24
module.exports = {
  width: 24, height: 24,
  colors: { star: '#FFEB3B', outline: '#FF8F00' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const s = pal.groups.star.startIdx;
    const o = pal.groups.outline.startIdx;

    // 5-pointed star shape built row by row
    // Center at 12,12, radius ~10
    const pts = [
      [12, 1],   // top
      [14, 8],   // inner right-top
      [22, 9],   // right tip
      [16, 14],  // inner right-bottom
      [18, 22],  // bottom-right tip
      [12, 17],  // inner bottom
      [6, 22],   // bottom-left tip
      [8, 14],   // inner left-bottom
      [2, 9],    // left tip
      [10, 8],   // inner left-top
    ];

    // Fill the star using scanline approach
    for (let y = 1; y <= 22; y++) {
      // Find x intersections at this y
      let minX = 24, maxX = 0;
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        if ((y1 <= y && y2 >= y) || (y2 <= y && y1 >= y)) {
          if (y1 === y2) {
            minX = Math.min(minX, Math.min(x1, x2));
            maxX = Math.max(maxX, Math.max(x1, x2));
          } else {
            const t = (y - y1) / (y2 - y1);
            const x = Math.round(x1 + t * (x2 - x1));
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
          }
        }
      }
      if (minX <= maxX) {
        // Outline
        pc.setPixel(minX, y, o + 1);
        pc.setPixel(maxX, y, o + 1);
        // Fill
        for (let x = minX + 1; x < maxX; x++) {
          // Gradient: lighter toward center-top
          const dist = Math.abs(x - 12) + Math.abs(y - 10);
          pc.setPixel(x, y, dist < 5 ? s + 3 : dist < 9 ? s + 2 : s + 1);
        }
      }
    }

    // Top point outline
    pc.setPixel(12, 1, o + 1);
    pc.setPixel(11, 2, o); pc.setPixel(13, 2, o);

    // Sparkle highlight
    pc.setPixel(10, 7, s + 3);
    pc.setPixel(11, 6, s + 3);
    pc.setPixel(9, 8, s + 3);
  },
  drawPost(pc, pal) {},
};
