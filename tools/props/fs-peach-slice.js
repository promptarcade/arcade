// Peach Slice — 40x44 cross-section view
// Orange-golden flesh, thin fuzzy skin ring, large brown/dark oval pit
// in center with texture. Slightly taller than wide (stone fruit shape).

module.exports = {
  width: 40,
  height: 44,
  colors: {
    skin: '#E8913A',      // orange-peach fuzzy skin
    flesh: '#FFCC66',     // golden-orange flesh
    pit: '#5C3A1E',       // dark brown pit/stone
  },

  draw(pc, pal) {
    const sk = pal.groups.skin.startIdx;
    const fl = pal.groups.flesh.startIdx;
    const pt = pal.groups.pit.startIdx;
    const cx = 20, cy = 22;

    // Outer skin ring — slightly oval, taller than wide
    pc.fillEllipse(cx, cy, 17, 19, sk + 2);

    // Darker fuzzy skin shading on bottom-right
    pc.fillEllipse(cx + 3, cy + 4, 15, 17, sk + 0);
    pc.fillEllipse(cx, cy, 16, 18, sk + 2);

    // Upper-left skin highlight
    pc.fillEllipse(cx - 4, cy - 5, 8, 9, sk + 3);
    pc.fillEllipse(cx, cy, 15, 17, sk + 2);

    // Fuzzy skin texture
    const rng = sf2_seededRNG(99);
    pc.scatterNoise(cx - 17, cy - 19, 34, 38, sk + 3, 0.06, rng);
    pc.scatterNoise(cx - 17, cy - 19, 34, 38, sk + 1, 0.04, rng);

    // Golden-orange flesh interior (2px skin ring)
    pc.fillEllipse(cx, cy, 15, 17, fl + 2);

    // Flesh depth — reddish-darker near pit, brighter outer ring
    pc.fillEllipse(cx, cy, 15, 17, fl + 3);
    pc.fillEllipse(cx, cy, 13, 15, fl + 2);
    pc.fillEllipse(cx, cy, 10, 12, fl + 1);
    pc.fillEllipse(cx, cy, 8, 9, fl + 2);

    // Slight radial streaks in flesh (fiber texture)
    const numStreaks = 10;
    for (let i = 0; i < numStreaks; i++) {
      const angle = (i / numStreaks) * Math.PI * 2;
      for (let r = 6; r <= 14; r++) {
        const px = Math.round(cx + Math.cos(angle) * r);
        const py = Math.round(cy + Math.sin(angle) * r * 1.1);
        // Check inside flesh boundary
        const nx = (px - cx) / 15;
        const ny = (py - cy) / 17;
        if (nx * nx + ny * ny < 0.85 && nx * nx + ny * ny > 0.15) {
          pc.setPixel(px, py, fl + 3);
        }
      }
    }

    // Large oval pit in center
    pc.fillEllipse(cx, cy, 6, 8, pt + 2);

    // Pit shading — darker center, lighter edges
    pc.fillEllipse(cx + 1, cy + 1, 5, 7, pt + 0);
    pc.fillEllipse(cx, cy, 5, 7, pt + 1);
    pc.fillEllipse(cx - 1, cy - 1, 4, 5, pt + 2);

    // Pit surface ridge — characteristic peach stone texture
    // Vertical ridge line down center of pit
    pc.vline(cx, cy - 6, 13, pt + 3);
    pc.vline(cx + 1, cy - 5, 11, pt + 0);

    // Horizontal texture ridges on pit
    pc.hline(cx - 4, cy - 3, 9, pt + 0);
    pc.hline(cx - 5, cy, 10, pt + 0);
    pc.hline(cx - 4, cy + 3, 9, pt + 0);
  },

  drawPost(pc, pal) {
    const sk = pal.groups.skin.startIdx;
    const fl = pal.groups.flesh.startIdx;
    const pt = pal.groups.pit.startIdx;
    const cx = 20, cy = 22;

    // Pit texture — pitted/rough surface detail
    const rng2 = sf2_seededRNG(101);
    pc.scatterNoise(cx - 5, cy - 7, 10, 14, pt + 0, 0.12, rng2);
    pc.scatterNoise(cx - 4, cy - 5, 8, 10, pt + 3, 0.06, rng2);

    // Highlight on pit upper-left
    pc.setPixel(cx - 2, cy - 4, pt + 3);
    pc.setPixel(cx - 3, cy - 3, pt + 3);
    pc.setPixel(cx - 2, cy - 3, pt + 3);

    // Flesh highlight — juicy sheen near skin
    for (let a = 2.5; a < 4.5; a += 0.1) {
      const r = 14;
      const px = Math.round(cx + Math.cos(a) * r);
      const py = Math.round(cy + Math.sin(a) * r * 1.1);
      const nx = (px - cx) / 15;
      const ny = (py - cy) / 17;
      if (nx * nx + ny * ny < 0.92) {
        pc.setPixel(px, py, fl + 3);
      }
    }

    // Bright juicy spots in flesh
    const rng3 = sf2_seededRNG(102);
    pc.scatterNoise(cx - 12, cy - 14, 24, 28, fl + 3, 0.02, rng3);

    // Skin fuzz dots on edge
    for (let a = 0; a < Math.PI * 2; a += 0.4) {
      const px = Math.round(cx + Math.cos(a) * 16.5);
      const py = Math.round(cy + Math.sin(a) * 18.5);
      const nx = (px - cx) / 17;
      const ny = (py - cy) / 19;
      if (nx * nx + ny * ny < 1.05 && nx * nx + ny * ny > 0.85) {
        pc.setPixel(px, py, sk + 3);
      }
    }
  },
};
