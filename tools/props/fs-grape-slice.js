// Grape Slice — 36x36 cross-section view
// Small circle. Thin purple skin ring, translucent pale green/white flesh,
// 2-3 small teardrop-shaped seeds visible inside.

module.exports = {
  width: 36,
  height: 36,
  colors: {
    skin: '#6B2D8B',      // purple grape skin
    flesh: '#D4EDBA',     // pale green translucent flesh
    seeds: '#8B7355',     // tan-brown grape seeds
  },

  draw(pc, pal) {
    const sk = pal.groups.skin.startIdx;
    const fl = pal.groups.flesh.startIdx;
    const se = pal.groups.seeds.startIdx;
    const cx = 18, cy = 18;

    // Purple skin outer ring
    pc.fillCircle(cx, cy, 14, sk + 2);

    // Darker purple shading on bottom-right
    pc.fillEllipse(cx + 3, cy + 3, 12, 12, sk + 0);
    pc.fillCircle(cx, cy, 13, sk + 2);

    // Highlight on upper-left skin edge
    pc.fillEllipse(cx - 4, cy - 4, 7, 7, sk + 3);
    pc.fillCircle(cx, cy, 12, sk + 2);

    // Pale green/white flesh interior (2px skin ring)
    pc.fillCircle(cx, cy, 12, fl + 2);

    // Translucent depth — slightly darker near edges, lighter center
    pc.fillCircle(cx, cy, 12, fl + 1);
    pc.fillCircle(cx, cy, 11, fl + 2);
    pc.fillCircle(cx, cy, 9, fl + 3);
    pc.fillCircle(cx, cy, 7, fl + 2);

    // Very subtle center — grapes are fairly uniform inside
    pc.fillCircle(cx, cy, 4, fl + 3);
  },

  drawPost(pc, pal) {
    const sk = pal.groups.skin.startIdx;
    const fl = pal.groups.flesh.startIdx;
    const se = pal.groups.seeds.startIdx;
    const cx = 18, cy = 18;

    // Seed 1 — teardrop shape, upper-left of center
    pc.fillEllipse(cx - 3, cy - 2, 2, 3, se + 2);
    pc.setPixel(cx - 3, cy - 5, se + 1);   // tapered top
    pc.setPixel(cx - 3, cy - 4, se + 2);
    pc.setPixel(cx - 2, cy - 2, se + 3);   // highlight

    // Seed 2 — teardrop shape, right of center
    pc.fillEllipse(cx + 3, cy + 1, 2, 3, se + 2);
    pc.setPixel(cx + 3, cy - 2, se + 1);   // tapered top
    pc.setPixel(cx + 3, cy - 1, se + 2);
    pc.setPixel(cx + 4, cy + 1, se + 3);   // highlight

    // Seed 3 — smaller, lower-left
    pc.fillEllipse(cx - 1, cy + 4, 1, 2, se + 2);
    pc.setPixel(cx - 1, cy + 2, se + 1);   // tapered top
    pc.setPixel(cx, cy + 4, se + 3);       // highlight

    // Skin highlight — glossy purple sheen on edge
    for (let a = 2.8; a < 4.5; a += 0.12) {
      const px = Math.round(cx + Math.cos(a) * 13);
      const py = Math.round(cy + Math.sin(a) * 13);
      pc.setPixel(px, py, sk + 3);
    }

    // Subtle flesh translucency texture
    const rng = sf2_seededRNG(55);
    pc.scatterNoise(cx - 9, cy - 9, 18, 18, fl + 3, 0.04, rng);
    pc.scatterNoise(cx - 9, cy - 9, 18, 18, fl + 1, 0.02, rng);
  },
};
