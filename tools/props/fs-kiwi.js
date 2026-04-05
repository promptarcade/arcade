// Kiwi Fruit — 36x36 whole fruit for Fruit Slash
// Small fuzzy brown oval, slightly taller than wide.
// Visible hair/fuzz texture, flat ends top and bottom.

module.exports = {
  width: 36,
  height: 36,
  colors: {
    body: '#8b6914',    // warm brown
    fuzz: '#a07828',    // lighter brown fuzz
    cap: '#6b4e0a',     // darker brown flat ends
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const f = pal.groups.fuzz.startIdx;
    const c = pal.groups.cap.startIdx;
    const cx = 18, cy = 18;

    // Main oval body — slightly taller than wide
    pc.fillEllipse(cx, cy, 12, 14, b + 2);

    // Slightly darker equatorial band for shape definition
    pc.fillEllipse(cx + 1, cy, 11, 13, b + 1);
    // Restore main body on top, offset for 3D shading (light from upper-left)
    pc.fillEllipse(cx - 1, cy - 1, 10, 12, b + 2);

    // Highlight region upper-left
    pc.fillEllipse(cx - 4, cy - 5, 5, 5, b + 3);

    // Flat cut ends — top and bottom
    // Top flat cap
    pc.fillRect(cx - 4, cy - 14, 8, 2, c + 1);
    pc.hline(cx - 3, cy - 14, 6, c + 2);
    // Tiny navel dot
    pc.setPixel(cx, cy - 14, c + 0);

    // Bottom flat cap
    pc.fillRect(cx - 4, cy + 12, 8, 2, c + 1);
    pc.hline(cx - 3, cy + 13, 6, c + 2);
    pc.setPixel(cx, cy + 13, c + 0);

    // Fuzz texture — dense scatter over the body surface
    const rng = sf2_seededRNG(42);
    pc.scatterNoise(cx - 11, cy - 13, 22, 26, f + 2, 0.12, rng);
    const rng2 = sf2_seededRNG(99);
    pc.scatterNoise(cx - 10, cy - 12, 20, 24, f + 3, 0.06, rng2);

    // Darker fuzz specks for depth
    const rng3 = sf2_seededRNG(77);
    pc.scatterNoise(cx - 9, cy - 10, 20, 22, f + 0, 0.04, rng3);
  },

  drawPost(pc, pal) {
    const f = pal.groups.fuzz.startIdx;
    const cx = 18, cy = 18;

    // Extra fine fuzz hairs sticking out at edges — individual pixels
    // Left edge
    pc.setPixel(cx - 13, cy - 3, f + 1);
    pc.setPixel(cx - 13, cy + 1, f + 2);
    pc.setPixel(cx - 12, cy - 7, f + 1);
    pc.setPixel(cx - 12, cy + 5, f + 2);

    // Right edge
    pc.setPixel(cx + 13, cy - 2, f + 1);
    pc.setPixel(cx + 12, cy + 3, f + 2);
    pc.setPixel(cx + 12, cy - 6, f + 1);
    pc.setPixel(cx + 13, cy + 1, f + 2);

    // Subtle highlight specks on upper region
    pc.setPixel(cx - 5, cy - 8, f + 3);
    pc.setPixel(cx - 3, cy - 10, f + 3);
    pc.setPixel(cx - 6, cy - 4, f + 3);
  },
};
