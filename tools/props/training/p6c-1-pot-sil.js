// Phase 6C.1: Cooking Pot REDUX — silhouette at game scale (128x128)
// Reuse the verified profile from 6A.3. This time at the size it would appear in Soup Shop.
// Must read as a pot at game scale, not just in isolation.

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;

    const cx = 64, potTop = 22, potBot = 108;

    // Same verified profile — scaled to 128x128
    function potProfile(t) {
      const rimWidth = 50, bellyWidth = 54, baseWidth = 38;
      if (t < 0.03) return rimWidth;
      if (t < 0.08) return rimWidth - (t - 0.03) / 0.05 * 5;
      if (t < 0.15) return rimWidth - 5;
      if (t < 0.55) {
        const bellyT = (t - 0.15) / 0.4;
        return (rimWidth - 5) + Math.sin(bellyT * Math.PI) * (bellyWidth - rimWidth + 5);
      }
      if (t < 0.9) {
        const taperT = (t - 0.55) / 0.35;
        return bellyWidth - taperT * taperT * (bellyWidth - baseWidth);
      }
      return baseWidth;
    }

    // Body
    for (let y = potTop; y <= potBot; y++) {
      const t = (y - potTop) / (potBot - potTop);
      const halfW = Math.round(potProfile(t));
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 128) pc.setPixel(x, y, FLAT);
      }
    }

    // Rim ellipse
    const rimRX = 50, rimRY = 12;
    for (let y = potTop - rimRY; y <= potTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - potTop) / rimRY;
        if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
      }
    }

    // Handles
    for (const side of [-1, 1]) {
      const handleTopY = potTop + Math.round((potBot - potTop) * 0.15);
      const handleBotY = potTop + Math.round((potBot - potTop) * 0.5);
      const bodyEdge = cx + side * Math.round(potProfile(0.3));

      for (let y = handleTopY; y <= handleBotY; y++) {
        const t = (y - handleTopY) / (handleBotY - handleTopY);
        const curve = Math.sin(t * Math.PI);
        const outerX = bodyEdge + Math.round(14 * curve) * side;
        const innerX = bodyEdge + Math.round(7 * curve) * side;
        const minX = Math.min(outerX, innerX), maxX = Math.max(outerX, innerX);
        for (let x = minX; x <= maxX; x++) {
          if (x >= 0 && x < 128 && y >= 0 && y < 128) pc.setPixel(x, y, FLAT);
        }
        if (t < 0.06 || t > 0.94) {
          const connMin = Math.min(bodyEdge, bodyEdge + side * 5);
          const connMax = Math.max(bodyEdge, bodyEdge + side * 5);
          for (let x = connMin; x <= connMax; x++) {
            if (x >= 0 && x < 128 && y >= 0 && y < 128) pc.setPixel(x, y, FLAT);
          }
        }
      }
    }

    // Base
    for (let x = cx - 38; x <= cx + 38; x++) {
      if (x >= 0 && x < 128 && potBot + 1 < 128) pc.setPixel(x, potBot + 1, FLAT);
    }
  },
};
