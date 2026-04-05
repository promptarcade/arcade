// Tin Can — 16x16 tile (silver cylinder with label)
module.exports = {
  width: 16, height: 16,
  colors: { metal: '#aab0b8', label: '#cc4444', lid: '#888890' },
  draw(pc, pal) {
    const m = pal.groups.metal.startIdx;
    const l = pal.groups.label.startIdx;
    const d = pal.groups.lid.startIdx;
    // Can body
    pc.fillRect(3, 2, 10, 12, m + 2);
    // Top lid — ellipse
    pc.hline(4, 1, 8, d + 2);
    pc.hline(3, 2, 10, d + 3);
    // Bottom — same width as body, no taper
    pc.hline(3, 14, 10, m + 1);
    pc.hline(3, 15, 10, m);
    // Ribs — horizontal lines
    pc.hline(3, 4, 10, m + 1);
    pc.hline(3, 12, 10, m + 1);
    // Label — red band in middle
    pc.fillRect(3, 5, 10, 6, l + 2);
    // Label highlights
    pc.vline(4, 5, 6, l + 3);
    pc.vline(11, 5, 6, l + 1);
    // Label text suggestion (tiny white marks)
    pc.hline(6, 7, 4, l + 3);
    pc.hline(6, 9, 3, l + 3);
    // Metal highlight on left
    pc.vline(4, 3, 9, m + 3);
    // Shadow on right
    pc.vline(12, 3, 9, m + 1);
  },
  drawPost(pc, pal) {},
};
