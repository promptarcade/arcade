// Onion — 32x32 projectile
// Iteration 2: rounder bulb body, cleaner taper at top, better proportions.

module.exports = {
  width: 32,
  height: 32,
  colors: {
    skin: '#997744',
    inner: '#ccaacc',
    root: '#ccbb99',
    face: '#ffeecc',
    pupil: '#221100',
  },

  draw(pc, pal) {
    const s = pal.groups.skin.startIdx;
    const inn = pal.groups.inner.startIdx;
    const r = pal.groups.root.startIdx;
    const cx = 16, cy = 18;

    // Bulb body — wide round sphere
    pc.fillCircle(cx, cy, 10, s + 2);

    // Taper to point at top — the distinctive onion neck
    for (let row = 0; row < 6; row++) {
      const halfW = Math.round(4 - row * 0.7);
      if (halfW > 0) {
        pc.hline(cx - halfW, cy - 10 - row, halfW * 2 + 1, s + 2);
      }
    }
    // Dry tip
    pc.setPixel(cx, cy - 16, s + 1);
    pc.setPixel(cx, cy - 17, s);

    // Papery skin texture — vertical streaks
    pc.vline(cx - 5, cy - 7, 14, s + 1);
    pc.vline(cx + 5, cy - 7, 14, s + 3);
    pc.vline(cx - 2, cy - 12, 4, s + 3);
    pc.vline(cx + 2, cy - 12, 4, s + 1);

    // Inner purple peeking at edges where skin peels
    pc.setPixel(cx - 9, cy, inn + 2);
    pc.setPixel(cx - 9, cy + 1, inn + 2);
    pc.setPixel(cx + 9, cy - 1, inn + 2);
    pc.setPixel(cx + 9, cy, inn + 2);

    // Root wisps at bottom
    pc.hline(cx - 2, cy + 9, 5, s + 1);
    pc.setPixel(cx - 1, cy + 10, r + 2);
    pc.setPixel(cx, cy + 10, r + 2);
    pc.setPixel(cx + 1, cy + 10, r + 2);
    pc.setPixel(cx, cy + 11, r + 1);
    pc.setPixel(cx - 2, cy + 10, r + 1);
    pc.setPixel(cx + 2, cy + 10, r + 1);

    // Glossy highlight
    pc.fillCircle(cx - 3, cy - 3, 2, s + 3);
    pc.setPixel(cx - 5, cy - 4, s + 3);

    // Texture scatter
    const rng = sf2_seededRNG(456);
    pc.scatterNoise(cx - 8, cy - 7, 16, 16, s + 1, 0.05, rng);
  },

  drawPost(pc, pal) {
    const f = pal.groups.face.startIdx;
    const p = pal.groups.pupil.startIdx;
    const cx = 16, cy = 18;

    // Half-lidded unimpressed eyes
    // Left eye
    pc.fillRect(cx - 6, cy - 1, 4, 2, f + 2);
    pc.setPixel(cx - 4, cy, p + 2);
    pc.setPixel(cx - 6, cy - 1, f + 3);
    // Heavy eyelid
    pc.hline(cx - 6, cy - 2, 4, p + 1);

    // Right eye
    pc.fillRect(cx + 2, cy - 1, 4, 2, f + 2);
    pc.setPixel(cx + 4, cy, p + 2);
    pc.setPixel(cx + 2, cy - 1, f + 3);
    pc.hline(cx + 2, cy - 2, 4, p + 1);

    // Flat mouth
    pc.hline(cx - 2, cy + 4, 5, p + 1);
  },
};
