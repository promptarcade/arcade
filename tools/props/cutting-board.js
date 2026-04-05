// Cutting Board — 16x16 tile (wooden rectangle with grain)
module.exports = {
  width: 16, height: 16,
  colors: { wood: '#bb9966', grain: '#997744' },
  draw(pc, pal) {
    const w = pal.groups.wood.startIdx;
    const g = pal.groups.grain.startIdx;
    // Board body
    pc.fillRect(1, 3, 14, 10, w + 2);
    // Top edge highlight
    pc.hline(1, 3, 14, w + 3);
    // Bottom shadow
    pc.hline(1, 12, 14, w + 1);
    pc.hline(2, 13, 12, w);
    // Grain lines — horizontal
    pc.hline(2, 5, 12, g + 2);
    pc.hline(3, 7, 10, g + 1);
    pc.hline(2, 9, 11, g + 2);
    pc.hline(4, 11, 8, g + 1);
    // Handle hole at right end
    pc.fillCircle(13, 8, 1, w);
    pc.setPixel(13, 7, w + 3);
    // Left edge lighter
    pc.vline(1, 4, 8, w + 3);
    // Knife score marks
    pc.setPixel(5, 6, g);
    pc.setPixel(7, 8, g);
    pc.setPixel(9, 5, g);
  },
  drawPost(pc, pal) {},
};
