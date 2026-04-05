// Snip & Feed — Rope anchor (metallic hook/pin) 16x16
module.exports = {
  width: 16, height: 16,
  colors: { metal: '#BDBDBD', screw: '#757575' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const m = pal.groups.metal.startIdx;
    const s = pal.groups.screw.startIdx;

    // Base plate — rounded rectangle
    pc.fillEllipse(8, 6, 6, 5, m + 1);
    pc.fillRect(3, 3, 10, 6, m + 2);

    // Highlight on top
    pc.hline(4, 3, 8, m + 3);
    pc.hline(5, 4, 6, m + 3);

    // Shadow on bottom
    pc.hline(4, 9, 8, m);

    // Hook curve going down
    pc.vline(8, 9, 3, m + 2);
    pc.vline(9, 9, 3, m + 1);
    // Hook bottom curve
    pc.hline(8, 12, 3, m + 1);
    pc.hline(9, 13, 3, m + 2);
    // Hook tip going up
    pc.vline(11, 11, 2, m + 2);
    pc.setPixel(11, 10, m + 3);

    // Screw heads
    pc.fillCircle(5, 5, 1, s + 1);
    pc.setPixel(5, 5, s);
    pc.fillCircle(11, 5, 1, s + 1);
    pc.setPixel(11, 5, s);
  },
  drawPost(pc, pal) {},
};
