// Counter Surface — 32x16 tiling terrain
// Marble/granite countertop with clean front edge.

module.exports = {
  width: 32, height: 16,
  colors: {
    surface: '#d0ccc4',   // grey-white marble
    edge: '#aaa8a0',      // front edge shadow
    speckle: '#b8b4ac',   // darker marble speckles
  },

  draw(pc, pal) {
    const s = pal.groups.surface.startIdx;
    const e = pal.groups.edge.startIdx;

    // Main surface
    pc.fillRect(0, 0, 32, 12, s + 2);

    // Highlight along back edge (top)
    pc.hline(0, 0, 32, s + 3);
    pc.hline(0, 1, 32, s + 3);

    // Front edge — beveled
    pc.hline(0, 12, 32, e + 2);
    pc.fillRect(0, 13, 32, 3, e + 1);
    pc.hline(0, 15, 32, e);

    // Marble speckle pattern
    const rng = sf2_seededRNG(333);
    pc.scatterNoise(0, 2, 32, 9, s + 1, 0.08, rng);
    pc.scatterNoise(2, 3, 28, 7, s + 3, 0.04, rng);

    // Subtle vein lines (marble has veins)
    pc.line(3, 4, 12, 7, s + 1);
    pc.line(18, 3, 28, 8, s + 1);
  },

  drawPost(pc, pal) {},
};
