// Phase 6A, Exercise 2: Wine Glass — SILHOUETTE ONLY
// Three distinct widths: wide bowl at top, thin stem, flat base.
// The challenge: smooth transitions between drastically different widths.
// Proportions: total height ~3x bowl width. Stem is ~5% of bowl width.

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },

  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;

    const cx = 48;

    // Wine glass profile — the construction exercise
    // Reference proportions:
    //   Bowl: occupies top 40% of height, widest at ~30% down
    //   Stem: occupies middle 35%, very thin (3-4px wide)
    //   Base: occupies bottom 10%, wide flat disc
    //   Rim: slightly wider than widest bowl point

    const glassTop = 6, glassBot = 88;
    const totalH = glassBot - glassTop;

    function glassProfile(t) { // t: 0=top (rim), 1=bottom (base)
      const rimWidth = 24;
      const bowlMax = 22;
      const stemWidth = 3;
      const baseWidth = 20;

      // Rim (0 - 0.02)
      if (t < 0.02) return rimWidth;

      // Bowl (0.02 - 0.42): ROUNDED U-shape, widest at ~35% down from rim
      if (t < 0.42) {
        const bowlT = (t - 0.02) / 0.4;
        if (bowlT < 0.35) {
          // Upper bowl — widens from rim to max belly
          const expand = Math.sin(bowlT / 0.35 * Math.PI / 2);
          return rimWidth - 4 + expand * (bowlMax - rimWidth + 6);
        }
        // Lower bowl — narrows from max toward stem, smooth curve
        const narrowT = (bowlT - 0.35) / 0.65;
        const bowlWidth = bowlMax - Math.pow(narrowT, 1.5) * (bowlMax - stemWidth);
        return Math.max(stemWidth, Math.round(bowlWidth));
      }

      // Stem (0.42 - 0.82): thin vertical column
      if (t < 0.82) return stemWidth;

      // Base transition (0.82 - 0.88): flares out from stem to base
      if (t < 0.88) {
        const flareT = (t - 0.82) / 0.06;
        return Math.round(stemWidth + (baseWidth - stemWidth) * flareT * flareT);
      }

      // Base disc (0.88 - 1.0): flat wide
      return baseWidth;
    }

    // Draw flat fill
    for (let y = glassTop; y <= glassBot; y++) {
      const t = (y - glassTop) / totalH;
      const halfW = Math.round(glassProfile(t));
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 96 && y >= 0 && y < 96) {
          pc.setPixel(x, y, FLAT);
        }
      }
    }

    // Rim ellipse at top
    const rimRX = 24, rimRY = 5;
    for (let y = glassTop - rimRY; y <= glassTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - glassTop) / rimRY;
        if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
      }
    }

    // Base ellipse at bottom
    const baseRX = 20, baseRY = 4;
    const baseY = glassBot;
    for (let y = baseY - baseRY; y <= baseY + baseRY; y++) {
      for (let x = cx - baseRX - 1; x <= cx + baseRX + 1; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / (baseRX + 1), dy = (y - baseY) / baseRY;
        if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
      }
    }
  },
};
