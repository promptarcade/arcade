// Phase 6A.3: Cooking Pot — SILHOUETTE ONLY
// THE FAILED OBJECT. Must get this right.
// Reference: pot is WIDER than tall. Belly bulges outward. Rim flares. Base narrower than belly.
// Two handles on sides. Viewed slightly from above — interior visible.

module.exports = {
  width: 128,
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

    const cx = 64, potTop = 16, potBot = 82;
    // Key fix: pot is WIDER than tall. Width ~100px, height ~66px.

    function potProfile(t) { // t: 0=rim, 1=base
      const rimWidth = 46;    // wide rim with flare
      const bellyWidth = 48;  // widest at belly
      const baseWidth = 34;   // noticeably narrower base

      if (t < 0.03) return rimWidth;                    // rim lip flares out
      if (t < 0.08) return rimWidth - (t - 0.03) / 0.05 * 4; // rim to neck
      if (t < 0.15) return rimWidth - 4;                // slight neck below rim
      if (t < 0.55) {
        // BELLY — the defining curve. Widest at ~35%
        const bellyT = (t - 0.15) / 0.4;
        return (rimWidth - 4) + Math.sin(bellyT * Math.PI) * (bellyWidth - rimWidth + 4);
      }
      if (t < 0.9) {
        // Lower body — tapers from belly to base
        const taperT = (t - 0.55) / 0.35;
        return bellyWidth - taperT * taperT * (bellyWidth - baseWidth);
      }
      // Base
      return baseWidth;
    }

    // Body
    for (let y = potTop; y <= potBot; y++) {
      const t = (y - potTop) / (potBot - potTop);
      const halfW = Math.round(potProfile(t));
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }
    }

    // Rim ellipse — visible top
    const rimRX = 46, rimRY = 10;
    for (let y = potTop - rimRY; y <= potTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - potTop) / rimRY;
        if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
      }
    }

    // Handles — small loops on left and right
    for (const side of [-1, 1]) {
      const handleCX = cx + side * (potProfile(0.3) + 10);
      const handleTopY = potTop + Math.round((potBot - potTop) * 0.15);
      const handleBotY = potTop + Math.round((potBot - potTop) * 0.5);

      for (let y = handleTopY; y <= handleBotY; y++) {
        const t = (y - handleTopY) / (handleBotY - handleTopY);
        const curve = Math.sin(t * Math.PI);
        const outerX = handleCX + Math.round(10 * curve) * side;
        const innerX = handleCX + Math.round(5 * curve) * side;
        const minX = Math.min(outerX, innerX);
        const maxX = Math.max(outerX, innerX);
        for (let x = minX; x <= maxX; x++) {
          if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
        }
        // Connection bars
        if (t < 0.07 || t > 0.93) {
          const bodyEdge = cx + side * Math.round(potProfile((y - potTop) / (potBot - potTop)));
          const connMin = Math.min(bodyEdge, handleCX);
          const connMax = Math.max(bodyEdge, handleCX);
          for (let x = connMin; x <= connMax; x++) {
            if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
          }
        }
      }
    }

    // Base — flat bottom line
    for (let x = cx - 34; x <= cx + 34; x++) {
      if (x >= 0 && x < 128 && potBot + 1 < 96) pc.setPixel(x, potBot + 1, FLAT);
    }
  },
};
