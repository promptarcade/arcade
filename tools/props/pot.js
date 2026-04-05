// Pot — 16x16 tile (copper/iron cooking pot with handles)
module.exports = {
  width: 16, height: 16,
  colors: { metal: '#886644', handle: '#554433', rim: '#aa8855' },
  draw(pc, pal) {
    const m = pal.groups.metal.startIdx;
    const h = pal.groups.handle.startIdx;
    const r = pal.groups.rim.startIdx;
    // Pot body — cylinder
    pc.fillRect(3, 4, 10, 10, m + 2);
    // Rounded bottom
    pc.hline(4, 14, 8, m + 1);
    pc.hline(5, 15, 6, m);
    // Rim at top — bright metal edge
    pc.hline(2, 3, 12, r + 2);
    pc.hline(2, 4, 12, r + 3);
    // Handles — stick out on sides
    pc.fillRect(0, 6, 3, 3, h + 2);
    pc.fillRect(13, 6, 3, 3, h + 2);
    pc.setPixel(0, 6, h + 3);
    pc.setPixel(15, 6, h + 3);
    // Highlight streak down left side
    pc.vline(4, 5, 8, m + 3);
    // Shadow on right
    pc.vline(12, 5, 8, m + 1);
    // Subtle rivet dots on handles
    pc.setPixel(1, 7, h);
    pc.setPixel(14, 7, h);
  },
  drawPost(pc, pal) {},
};
