// Snip & Feed — Empty star (greyed out, for HUD) 24x24
module.exports = {
  width: 24, height: 24,
  colors: { star: '#9E9E9E', outline: '#616161' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const s = pal.groups.star.startIdx;
    const o = pal.groups.outline.startIdx;

    const pts = [
      [12, 1], [14, 8], [22, 9], [16, 14], [18, 22],
      [12, 17], [6, 22], [8, 14], [2, 9], [10, 8],
    ];

    for (let y = 1; y <= 22; y++) {
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
        pc.setPixel(minX, y, o + 1);
        pc.setPixel(maxX, y, o + 1);
        for (let x = minX + 1; x < maxX; x++) {
          const dist = Math.abs(x - 12) + Math.abs(y - 10);
          pc.setPixel(x, y, dist < 5 ? s + 2 : dist < 9 ? s + 1 : s);
        }
      }
    }
    pc.setPixel(12, 1, o + 1);
    pc.setPixel(11, 2, o); pc.setPixel(13, 2, o);
  },
  drawPost(pc, pal) {},
};
