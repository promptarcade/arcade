// Egg — 32x32 projectile
// Iteration 2: correct egg profile (wider bottom), simpler eyes, better proportions.

module.exports = {
  width: 32,
  height: 32,
  colors: {
    shell: '#f0e8d8',
    face: '#ffffff',
    pupil: '#221100',
    blush: '#eeaa88',
  },

  draw(pc, pal) {
    const s = pal.groups.shell.startIdx;
    const cx = 16, cy = 16;

    // Egg shape — narrow top, wide bottom, smooth curve
    for (let row = 0; row < 24; row++) {
      const t = row / 23;
      // True egg profile: narrow at top, widest at ~60% down, tapers at base
      let halfW;
      if (t < 0.6) {
        // Top to widest point — gradual expansion
        halfW = Math.round(4 + 6 * Math.sin(t / 0.6 * Math.PI / 2));
      } else {
        // Widest to bottom — gentle taper
        halfW = Math.round(10 - 3 * ((t - 0.6) / 0.4) * ((t - 0.6) / 0.4));
      }
      const y = cy - 12 + row;
      if (halfW > 0) {
        pc.hline(cx - halfW, y, halfW * 2 + 1, s + 2);
      }
    }

    // Smooth highlight — large oval, upper left
    pc.fillEllipse(cx - 3, cy - 5, 3, 4, s + 3);
    pc.setPixel(cx - 5, cy - 7, s + 3);

    // Subtle speckle
    const rng = sf2_seededRNG(123);
    pc.scatterNoise(cx - 7, cy - 6, 14, 16, s + 1, 0.03, rng);
  },

  drawPost(pc, pal) {
    const f = pal.groups.face.startIdx;
    const p = pal.groups.pupil.startIdx;
    const bl = pal.groups.blush.startIdx;
    const cx = 16, cy = 16;

    // Eyes — round, wide, simple. Worried look.
    // Left eye
    pc.fillRect(cx - 5, cy - 2, 3, 3, f + 2);
    pc.setPixel(cx - 4, cy - 1, f + 3);   // bright center
    pc.setPixel(cx - 4, cy, p + 2);        // pupil looking down
    pc.setPixel(cx - 5, cy - 2, f + 3);    // specular

    // Right eye
    pc.fillRect(cx + 3, cy - 2, 3, 3, f + 2);
    pc.setPixel(cx + 4, cy - 1, f + 3);
    pc.setPixel(cx + 4, cy, p + 2);
    pc.setPixel(cx + 3, cy - 2, f + 3);

    // Worried eyebrows — raised in center, angled up
    pc.setPixel(cx - 6, cy - 3, p + 1);
    pc.setPixel(cx - 5, cy - 4, p + 1);
    pc.setPixel(cx - 4, cy - 4, p + 1);
    pc.setPixel(cx + 4, cy - 4, p + 1);
    pc.setPixel(cx + 5, cy - 4, p + 1);
    pc.setPixel(cx + 6, cy - 3, p + 1);

    // Small worried 'o' mouth
    pc.setPixel(cx - 1, cy + 4, p + 1);
    pc.setPixel(cx, cy + 5, p + 1);
    pc.setPixel(cx + 1, cy + 4, p + 1);
    pc.setPixel(cx, cy + 3, p + 1);

    // Blush — close to face, small
    pc.setPixel(cx - 6, cy + 1, bl + 2);
    pc.setPixel(cx - 5, cy + 1, bl + 3);
    pc.setPixel(cx + 5, cy + 1, bl + 3);
    pc.setPixel(cx + 6, cy + 1, bl + 2);
  },
};
