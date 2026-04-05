// Orange — 40x40 whole fruit for Fruit Slash
// Round sphere, dimpled texture, navel at bottom, tiny stem indent at top.

module.exports = {
  width: 40,
  height: 40,
  colors: {
    body: '#ee8811',      // saturated orange
    navel: '#cc6600',     // darker orange for navel/indent
    stem: '#556633',      // olive-green stem area
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const n = pal.groups.navel.startIdx;
    const st = pal.groups.stem.startIdx;
    const cx = 20, cy = 20;

    // Main spherical body
    pc.fillCircle(cx, cy, 15, b + 2);

    // Lower shadow for 3D roundness
    pc.fillEllipse(cx + 1, cy + 5, 12, 10, b + 1);
    // Restore upper area
    pc.fillEllipse(cx, cy - 2, 14, 12, b + 2);

    // Large highlight zone — upper left
    pc.fillEllipse(cx - 4, cy - 5, 7, 5, b + 3);

    // Dimpled texture — scattered noise across whole surface
    const rng = sf2_seededRNG(77);
    pc.scatterNoise(cx - 12, cy - 12, 24, 24, b + 1, 0.08, rng);
    // Lighter dimples in highlight area
    const rng2 = sf2_seededRNG(88);
    pc.scatterNoise(cx - 9, cy - 9, 12, 10, b + 3, 0.06, rng2);

    // Navel indent at bottom — small dark circle
    pc.fillCircle(cx, cy + 13, 2, n + 1);
    pc.setPixel(cx, cy + 13, n + 0);
    // Ring around navel
    pc.setPixel(cx - 2, cy + 12, n + 2);
    pc.setPixel(cx + 2, cy + 12, n + 2);
    pc.setPixel(cx, cy + 15, n + 2);

    // Stem indent at top — small depression
    pc.fillRect(cx - 1, cy - 15, 3, 2, st + 1);
    pc.setPixel(cx, cy - 16, st + 2);
    // Tiny green calyx around stem
    pc.setPixel(cx - 2, cy - 14, st + 2);
    pc.setPixel(cx + 2, cy - 14, st + 2);
    pc.setPixel(cx - 1, cy - 14, st + 3);
    pc.setPixel(cx + 1, cy - 14, st + 3);
  },

  drawPost(pc, pal) {
    const b = pal.groups.body.startIdx;
    const cx = 20, cy = 20;

    // Sharp specular highlights — small bright dots
    pc.setPixel(cx - 6, cy - 8, b + 3);
    pc.setPixel(cx - 5, cy - 9, b + 3);
    pc.setPixel(cx - 7, cy - 7, b + 3);

    // Subtle peel texture detail — tiny dark spots
    const rng3 = sf2_seededRNG(99);
    pc.scatterNoise(cx - 10, cy - 4, 20, 16, b + 0, 0.02, rng3);
  },
};
