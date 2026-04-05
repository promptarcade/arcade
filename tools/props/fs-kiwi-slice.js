// Kiwi Slice — 36x36 cross-section view
// Thin brown fuzzy skin ring, bright green flesh, white starburst core
// with radiating lines, ring of small black seeds around core area.

module.exports = {
  width: 36,
  height: 36,
  colors: {
    skin: '#8B6914',      // brown fuzzy outer skin
    flesh: '#76B947',     // bright kiwi green
    core: '#F5F5DC',      // white/cream starburst center
    seeds: '#1A1A1A',     // tiny black seeds
  },

  draw(pc, pal) {
    const sk = pal.groups.skin.startIdx;
    const fl = pal.groups.flesh.startIdx;
    const co = pal.groups.core.startIdx;
    const se = pal.groups.seeds.startIdx;
    const cx = 18, cy = 18;

    // Outer skin ring — full circle
    pc.fillCircle(cx, cy, 15, sk + 2);

    // Fuzzy texture on skin
    const rng = sf2_seededRNG(77);
    pc.scatterNoise(cx - 15, cy - 15, 30, 30, sk + 1, 0.08, rng);
    pc.scatterNoise(cx - 15, cy - 15, 30, 30, sk + 3, 0.05, rng);

    // Green flesh inside skin (2px skin ring)
    pc.fillCircle(cx, cy, 13, fl + 2);

    // Slightly darker green ring just inside the skin for depth
    pc.fillCircle(cx, cy, 13, fl + 1);
    pc.fillCircle(cx, cy, 12, fl + 2);

    // Brighter green in inner area
    pc.fillCircle(cx, cy, 10, fl + 3);
    pc.fillCircle(cx, cy, 8, fl + 2);

    // White/cream starburst core center
    pc.fillCircle(cx, cy, 3, co + 2);
    pc.fillCircle(cx, cy, 2, co + 3);

    // Radiating white lines from center (starburst pattern)
    const numRays = 12;
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2;
      for (let r = 3; r <= 9; r++) {
        const px = Math.round(cx + Math.cos(angle) * r);
        const py = Math.round(cy + Math.sin(angle) * r);
        // Thinner lines further out
        if (r <= 6) {
          pc.setPixel(px, py, co + 2);
        } else {
          pc.setPixel(px, py, co + 1);
        }
      }
    }
  },

  drawPost(pc, pal) {
    const se = pal.groups.seeds.startIdx;
    const co = pal.groups.core.startIdx;
    const fl = pal.groups.flesh.startIdx;
    const cx = 18, cy = 18;

    // Ring of seeds arranged around the core area (radius ~7-8px from center)
    const numSeeds = 16;
    const seedRadius = 7.5;
    for (let i = 0; i < numSeeds; i++) {
      const angle = (i / numSeeds) * Math.PI * 2;
      const sx = Math.round(cx + Math.cos(angle) * seedRadius);
      const sy = Math.round(cy + Math.sin(angle) * seedRadius);
      pc.setPixel(sx, sy, se + 2);
      // Some seeds slightly elongated radially
      if (i % 3 === 0) {
        const sx2 = Math.round(cx + Math.cos(angle) * (seedRadius + 1));
        const sy2 = Math.round(cy + Math.sin(angle) * (seedRadius + 1));
        pc.setPixel(sx2, sy2, se + 1);
      }
    }

    // Second ring of seeds at slightly different radius for natural look
    const numSeeds2 = 12;
    const seedRadius2 = 9;
    for (let i = 0; i < numSeeds2; i++) {
      const angle = (i / numSeeds2) * Math.PI * 2 + 0.15;
      const sx = Math.round(cx + Math.cos(angle) * seedRadius2);
      const sy = Math.round(cy + Math.sin(angle) * seedRadius2);
      pc.setPixel(sx, sy, se + 2);
    }

    // Bright center dot
    pc.setPixel(cx, cy, co + 3);

    // Green flesh texture
    const rng2 = sf2_seededRNG(88);
    pc.scatterNoise(cx - 10, cy - 10, 20, 20, fl + 3, 0.03, rng2);
  },
};
