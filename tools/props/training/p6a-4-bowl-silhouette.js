// Phase 6A.4: Soup Bowl — SILHOUETTE ONLY
// Key: MUCH wider than tall. Width:height = 2:1 or more.
// Shallow smooth curve. NOT a funnel, NOT a cone. A gentle U-shape.

module.exports = {
  width: 128,
  height: 64,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },

  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;

    const cx = 64, bowlTop = 10, bowlBot = 50;
    // Key proportion: width = 110, height = 40. Ratio > 2.5:1. WIDE and SHALLOW.

    function bowlProfile(t) { // t: 0=rim, 1=base
      const rimWidth = 55;
      const baseWidth = 22;

      if (t < 0.02) return rimWidth; // rim lip
      // CONCAVE curve — bowl shape is like the inside of a circle
      // Use cosine: stays wide at top then curves inward smoothly at the bottom
      const curveT = (t - 0.02) / 0.98;
      // cos(0)=1 (wide at top), cos(PI/2)=0 (narrow at bottom)
      const cosShape = Math.cos(curveT * Math.PI * 0.48);
      return Math.round(baseWidth + (rimWidth - baseWidth) * cosShape);
    }

    // Body
    for (let y = bowlTop; y <= bowlBot; y++) {
      const t = (y - bowlTop) / (bowlBot - bowlTop);
      const halfW = Math.round(bowlProfile(t));
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 64) pc.setPixel(x, y, FLAT);
      }
    }

    // Rim ellipse
    const rimRX = 55, rimRY = 9;
    for (let y = bowlTop - rimRY; y <= bowlTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 64) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - bowlTop) / rimRY;
        if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
      }
    }

    // Small foot/base ring
    for (let x = cx - 22; x <= cx + 22; x++) {
      if (x >= 0 && x < 128 && bowlBot + 1 < 64) {
        pc.setPixel(x, bowlBot + 1, FLAT);
        pc.setPixel(x, bowlBot + 2, FLAT);
      }
    }
  },
};
