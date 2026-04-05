// Baby Wrangler — Bookshelf (16x40, against wall, side view)
module.exports = {
  width: 16, height: 40,
  colors: { wood: '#8b6914', shelf: '#6a5010', red: '#cc3333', blue: '#3366cc', green: '#44aa44', gold: '#ccaa33' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const w = pal.groups.wood.startIdx + 2;
    const sh = pal.groups.shelf.startIdx + 2;
    // Main body
    pc.fillRect(0, 0, 16, 40, w);
    // Side panels
    pc.vline(0, 0, 40, w - 1);
    pc.vline(15, 0, 40, w - 1);
    // 5 shelves
    const bookColors = [
      [0xcc3333, 0x3366cc, 0x44aa44, 0xccaa33],
      [0x8833aa, 0xcc6633, 0x3388aa, 0xdd4444],
      [0x44aa44, 0xcc3333, 0x5544aa, 0xddaa33],
      [0x3366cc, 0xcc6633, 0x44aa44, 0x884422],
    ];
    for (let s = 0; s < 5; s++) {
      const sy = s * 8;
      pc.hline(0, sy, 16, sh); // shelf plank
      pc.hline(0, sy + 1, 16, sh);
      // Books on shelf (except bottom shelf which has a plant)
      if (s < 4) {
        const colorGroups = [
          pal.groups.red.startIdx + 2,
          pal.groups.blue.startIdx + 2,
          pal.groups.green.startIdx + 2,
          pal.groups.gold.startIdx + 2,
        ];
        let bx = 2;
        for (let b = 0; b < 4; b++) {
          const bw = 2 + (b % 2);
          const bh = 5 + (b % 2);
          const bookIdx = colorGroups[(s + b) % 4];
          pc.fillRect(bx, sy + 2, bw, bh, bookIdx);
          bx += bw + 1;
        }
      }
    }
    // Small plant on bottom shelf
    pc.fillRect(5, 34, 4, 4, w + 1); // pot
    pc.fillCircle(7, 32, 3, w + 1); // leaves placeholder
  },
};
