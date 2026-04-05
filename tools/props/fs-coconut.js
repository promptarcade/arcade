// Coconut — 44x44 whole fruit for Fruit Slash
// Rough brown sphere with fibrous hairy texture.
// Three dark "eyes" (two near top, one below).

module.exports = {
  width: 44,
  height: 44,
  colors: {
    shell: '#6b3a1f',     // dark brown shell
    fiber: '#8b5e3c',     // lighter brown fibers
    eye: '#2a1508',       // very dark eye sockets
  },

  draw(pc, pal) {
    const s = pal.groups.shell.startIdx;
    const f = pal.groups.fiber.startIdx;
    const e = pal.groups.eye.startIdx;
    const cx = 22, cy = 22;

    // Main spherical body
    pc.fillCircle(cx, cy, 18, s + 2);

    // 3D shading — darker right/bottom edge
    pc.fillCircle(cx + 2, cy + 2, 17, s + 1);
    // Restore lit area upper-left
    pc.fillCircle(cx - 1, cy - 1, 16, s + 2);

    // Broad highlight upper-left
    pc.fillEllipse(cx - 6, cy - 7, 7, 6, s + 3);
    pc.fillEllipse(cx - 8, cy - 9, 4, 3, s + 3);

    // Fibrous texture — coarse, hairy surface
    const rng1 = sf2_seededRNG(101);
    pc.scatterNoise(cx - 16, cy - 16, 32, 32, f + 2, 0.14, rng1);
    const rng2 = sf2_seededRNG(202);
    pc.scatterNoise(cx - 14, cy - 14, 28, 28, f + 1, 0.08, rng2);
    const rng3 = sf2_seededRNG(303);
    pc.scatterNoise(cx - 15, cy - 15, 30, 30, f + 3, 0.05, rng3);
    // Extra coarse dark fibers
    const rng4 = sf2_seededRNG(404);
    pc.scatterNoise(cx - 13, cy - 13, 26, 26, s + 0, 0.06, rng4);

    // Fiber strands — vertical lines suggesting husk texture
    for (let i = -3; i <= 3; i++) {
      const xo = cx + i * 4;
      pc.setPixel(xo, cy - 10, f + 0);
      pc.setPixel(xo, cy - 5, f + 1);
      pc.setPixel(xo, cy, f + 0);
      pc.setPixel(xo, cy + 5, f + 1);
      pc.setPixel(xo, cy + 10, f + 0);
    }
  },

  drawPost(pc, pal) {
    const e = pal.groups.eye.startIdx;
    const s = pal.groups.shell.startIdx;
    const cx = 22, cy = 22;

    // Three characteristic "eyes" of the coconut
    // Two eyes near top, close together
    // Left eye
    pc.fillEllipse(cx - 5, cy - 4, 3, 2, e + 0);
    pc.fillEllipse(cx - 5, cy - 4, 2, 1, e + 1);

    // Right eye
    pc.fillEllipse(cx + 5, cy - 4, 3, 2, e + 0);
    pc.fillEllipse(cx + 5, cy - 4, 2, 1, e + 1);

    // Bottom eye (slightly larger, centered below)
    pc.fillEllipse(cx, cy + 3, 3, 3, e + 0);
    pc.fillEllipse(cx, cy + 3, 2, 2, e + 1);

    // Slight ridge ring connecting the three eyes
    pc.setPixel(cx - 3, cy - 2, s + 0);
    pc.setPixel(cx - 1, cy - 1, s + 0);
    pc.setPixel(cx + 1, cy - 1, s + 0);
    pc.setPixel(cx + 3, cy - 2, s + 0);
    pc.setPixel(cx - 2, cy + 1, s + 0);
    pc.setPixel(cx + 2, cy + 1, s + 0);
  },
};
