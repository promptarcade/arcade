// Phase 3: Pot silhouette — learning from what worked
// Key lessons from QC: 128x96 canvas, wide proportions, rim extends above body,
// profile widths ~46px. Wider than tall = cooking pot, not stock pot.

module.exports = {
  width: 128,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    fill: '#555555',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },

  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const BODY = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    const DARK = fg.startIdx + 0;
    const RIM = fg.startIdx + Math.round((fg.toneCount - 1) * 0.65);
    pc.pixels[0] = 0;

    const W = 128, H = 96;
    const cx = 64;
    const potTop = 18, potBot = 80;
    const potH = potBot - potTop;

    // Profile — wide cooking pot, nearly straight sides
    function potProfile(t) {
      const rimW = 44, bodyW = 43, baseW = 34;
      if (t < 0.05) return rimW;                          // rim flare
      if (t < 0.12) return rimW - (t - 0.05) / 0.07 * (rimW - bodyW); // taper to body
      if (t < 0.80) {
        // Gentle belly — peaks around t=0.45, only 2.5px wider than bodyW
        const mid = (t - 0.12) / 0.68;
        return bodyW + Math.sin(mid * Math.PI) * 2.5;
      }
      // smooth taper to base
      const bt = (t - 0.80) / 0.20;
      const ease = bt * bt * (3 - 2 * bt); // smoothstep
      return bodyW - ease * (bodyW - baseW);
    }

    // Fill body
    for (let y = potTop; y <= potBot; y++) {
      const t = (y - potTop) / potH;
      const hw = Math.round(potProfile(t));
      for (let x = cx - hw; x <= cx + hw; x++) {
        if (x >= 0 && x < W && y >= 0 && y < H) pc.setPixel(x, y, BODY);
      }
    }

    // Interior — ellipse visible through rim, extends above potTop
    const rimRX = 44, rimRY = 10;
    for (let y = potTop - rimRY + 2; y <= potTop + rimRY + 2; y++) {
      for (let x = cx - rimRX + 3; x <= cx + rimRX - 3; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const dx = (x - cx) / (rimRX - 3), dy = (y - (potTop + 1)) / (rimRY + 1);
        if (dx * dx + dy * dy < 0.92) {
          pc.setPixel(x, y, DARK);
        }
      }
    }

    // Rim — elliptical ring around opening
    for (let y = potTop - rimRY; y <= potTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - potTop) / rimRY;
        const outerD = dx * dx + dy * dy;
        const innerDx = dx * (rimRX + 1) / (rimRX - 3);
        const innerDy = dy * rimRY / (rimRY - 1.5);
        if (outerD <= 1 && innerDx * innerDx + innerDy * innerDy >= 0.88) {
          pc.setPixel(x, y, RIM);
        }
      }
    }

    // Handles — extend past belly peak (t=0.55) so body never juts below them
    for (const side of [-1, 1]) {
      const hTop = potTop + Math.round(potH * 0.10);
      const hBot = potTop + Math.round(potH * 0.58); // past the belly→taper transition
      for (let y = hTop; y <= hBot; y++) {
        const t = (y - hTop) / (hBot - hTop);
        const bodyEdge = cx + side * Math.round(potProfile((y - potTop) / potH));
        const curve = Math.sin(t * Math.PI);
        const outerX = bodyEdge + Math.round(10 * curve) * side;
        const innerX = bodyEdge + Math.round(4 * curve) * side;
        const minX = Math.min(outerX, innerX), maxX = Math.max(outerX, innerX);
        for (let x = minX; x <= maxX; x++) {
          if (x >= 0 && x < W && y >= 0 && y < H) pc.setPixel(x, y, BODY);
        }
      }
    }
  },
};
