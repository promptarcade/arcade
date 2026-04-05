// Phase 6C.2: Soup Bowl REDUX — silhouette at game scale (128x96)
// Verified cosine profile from 6A.4, now at production size.

module.exports = {
  width: 128,
  height: 80,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;

    const cx = 64, bowlTop = 12, bowlBot = 60;

    function bowlProfile(t) {
      const rimWidth = 58, baseWidth = 24;
      if (t < 0.02) return rimWidth;
      const curveT = (t - 0.02) / 0.98;
      return Math.round(baseWidth + (rimWidth - baseWidth) * Math.cos(curveT * Math.PI * 0.48));
    }

    for (let y = bowlTop; y <= bowlBot; y++) {
      const t = (y - bowlTop) / (bowlBot - bowlTop);
      const halfW = Math.round(bowlProfile(t));
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 80) pc.setPixel(x, y, FLAT);
      }
    }

    // Rim ellipse
    const rimRX = 58, rimRY = 10;
    for (let y = bowlTop - rimRY; y <= bowlTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 80) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - bowlTop) / rimRY;
        if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
      }
    }

    // Base foot
    for (let y = bowlBot; y <= bowlBot + 3; y++) {
      for (let x = cx - 24; x <= cx + 24; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 80) pc.setPixel(x, y, FLAT);
      }
    }
  },
};
