// Shattered Realm — Watchtower (structure)
// 24x48 Pixel tier — wooden platform on stilts, ladder

module.exports = {
  width: 24, height: 48, style: 'pixel', entityType: 'prop',
  colors: {
    wood: '#7a5a2a',
    plank: '#9a7a4a',
    rope: '#8a7a5a',
    flag: '#aa3322',
  },
  draw(pc, pal) {
    const w = pal.groups.wood.startIdx;
    const p = pal.groups.plank.startIdx;
    const r = pal.groups.rope.startIdx;
    const f = pal.groups.flag.startIdx;

    // Stilts (4 legs)
    pc.vline(4, 18, 28, w+1);
    pc.vline(19, 18, 28, w+1);
    pc.vline(7, 18, 28, w+0);
    pc.vline(16, 18, 28, w+0);

    // Cross braces
    for (let i = 0; i < 3; i++) {
      const y = 24 + i * 8;
      pc.hline(4, y, 16, w+0);
      // Diagonal brace hints
      pc.setPixel(6 + i * 2, y + 2, w+0);
      pc.setPixel(16 - i * 2, y + 2, w+0);
    }

    // Platform
    pc.fillRect(2, 16, 20, 4, p+2);
    pc.hline(2, 16, 20, p+3);
    pc.hline(2, 19, 20, p+0);
    // Plank lines
    pc.vline(6, 16, 4, p+1);
    pc.vline(10, 16, 4, p+1);
    pc.vline(14, 16, 4, p+1);
    pc.vline(18, 16, 4, p+1);

    // Railing
    pc.vline(2, 10, 7, w+1);
    pc.vline(21, 10, 7, w+1);
    pc.hline(2, 10, 20, w+2);
    pc.hline(2, 13, 20, w+1);

    // Roof (simple)
    pc.fillTriangle(0, 6, 23, 6, 12, 0, w+1);
    pc.fillRect(2, 6, 20, 2, p+1);
    pc.hline(2, 6, 20, p+2);
    // Roof ridge
    pc.setPixel(12, 0, w+3);

    // Flag pole
    pc.vline(21, 0, 7, w+1);
    // Flag
    pc.fillRect(17, 0, 4, 3, f+2);
    pc.setPixel(18, 1, f+3);

    // Ladder (right side)
    pc.vline(21, 20, 24, w+1);
    pc.vline(23, 20, 24, w+1);
    for (let y = 22; y < 44; y += 3) {
      pc.hline(21, y, 3, w+2);
    }

    // Shadow at base
    pc.fillEllipse(12, 46, 10, 2, w+0);
  },
};
