// Phase 6A.5: Bottle — SILHOUETTE ONLY
// Distinct zones: narrow neck → shoulder flare → wide body → base.
// Taller than wide (1:2.5 ratio). Neck is ~30% of body width.

module.exports = {
  width: 64,
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

    const cx = 32, top = 4, bot = 88;

    function bottleProfile(t) { // t: 0=top (mouth), 1=bottom (base)
      const mouthWidth = 6;
      const neckWidth = 5;
      const shoulderWidth = 22;
      const bodyWidth = 22;
      const baseWidth = 20;

      // Mouth/lip (0 - 0.03): slight flare
      if (t < 0.03) return mouthWidth;
      // Neck (0.03 - 0.30): thin, straight
      if (t < 0.30) return neckWidth;
      // Shoulder (0.30 - 0.42): smooth flare from neck to body
      if (t < 0.42) {
        const shoulderT = (t - 0.30) / 0.12;
        // Smooth S-curve transition
        const eased = shoulderT * shoulderT * (3 - 2 * shoulderT);
        return Math.round(neckWidth + (shoulderWidth - neckWidth) * eased);
      }
      // Body (0.42 - 0.88): wide, very slight taper
      if (t < 0.88) {
        const bodyT = (t - 0.42) / 0.46;
        return Math.round(bodyWidth - bodyT * (bodyWidth - baseWidth) * 0.3);
      }
      // Base (0.88 - 1.0): slight narrowing
      const baseT = (t - 0.88) / 0.12;
      return Math.round(bodyWidth - (bodyWidth - baseWidth) * (0.3 + baseT * 0.7));
    }

    // Body
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / (bot - top);
      const halfW = Math.round(bottleProfile(t));
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 64 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }
    }

    // Mouth ellipse at very top
    const mouthRX = 6, mouthRY = 2;
    for (let y = top - mouthRY; y <= top + mouthRY; y++) {
      for (let x = cx - mouthRX; x <= cx + mouthRX; x++) {
        if (x < 0 || x >= 64 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / mouthRX, dy = (y - top) / mouthRY;
        if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
      }
    }

    // Base
    for (let x = cx - 20; x <= cx + 20; x++) {
      if (x >= 0 && x < 64 && bot + 1 < 96) pc.setPixel(x, bot + 1, FLAT);
    }
  },
};
