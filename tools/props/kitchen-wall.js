// Kitchen Wall — 32x16 tiling background
// Subway tile pattern, cream with grey grout lines.

module.exports = {
  width: 32, height: 16,
  colors: {
    tile: '#e8e4d8',    // cream subway tile
    grout: '#aaa498',   // grey grout
  },

  draw(pc, pal) {
    const t = pal.groups.tile.startIdx;
    const g = pal.groups.grout.startIdx;

    // Fill with grout colour
    pc.fillRect(0, 0, 32, 16, g + 1);

    // Draw subway tiles — each tile is ~8x4px with 1px grout between
    // Row 0 (offset)
    for (let x = -4; x < 32; x += 9) {
      pc.fillRect(Math.max(0, x), 0, Math.min(8, 32 - Math.max(0, x)), 3, t + 2);
    }
    // Row 1
    for (let x = 0; x < 32; x += 9) {
      pc.fillRect(x, 4, Math.min(8, 32 - x), 3, t + 2);
    }
    // Row 2 (offset)
    for (let x = -4; x < 32; x += 9) {
      pc.fillRect(Math.max(0, x), 8, Math.min(8, 32 - Math.max(0, x)), 3, t + 2);
    }
    // Row 3
    for (let x = 0; x < 32; x += 9) {
      pc.fillRect(x, 12, Math.min(8, 32 - x), 3, t + 2);
    }

    // Subtle highlight on top edge of each tile
    for (let x = -4; x < 32; x += 9) {
      if (x >= 0) pc.hline(x, 0, Math.min(8, 32-x), t + 3);
      if (x >= 0) pc.hline(x, 8, Math.min(8, 32-x), t + 3);
    }
    for (let x = 0; x < 32; x += 9) {
      pc.hline(x, 4, Math.min(8, 32-x), t + 3);
      pc.hline(x, 12, Math.min(8, 32-x), t + 3);
    }
  },

  drawPost(pc, pal) {},
};
