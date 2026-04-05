// Baby Wrangler — Sofa (60x24, top-down view)
module.exports = {
  width: 60, height: 24,
  colors: { fabric: '#5566aa', arm: '#4455aa', pillow: '#ee8855', cushion: '#4a55a0' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const f = pal.groups.fabric.startIdx + 2;
    const a = pal.groups.arm.startIdx + 2;
    const p = pal.groups.pillow.startIdx + 2;
    const c = pal.groups.cushion.startIdx + 2;
    // Back
    pc.fillRect(3, 0, 54, 8, f);
    // Seat
    pc.fillRect(3, 8, 54, 14, f + 1);
    // Arms
    pc.fillRect(0, 0, 4, 22, a);
    pc.fillRect(56, 0, 4, 22, a);
    // Arm tops (lighter)
    pc.fillRect(0, 0, 4, 3, a + 1);
    pc.fillRect(56, 0, 4, 3, a + 1);
    // Cushion dividers
    pc.vline(20, 8, 14, c);
    pc.vline(40, 8, 14, c);
    // Back cushion detail
    pc.hline(5, 4, 50, f - 1);
    // Throw pillow
    pc.fillEllipse(12, 11, 5, 4, p);
    pc.fillEllipse(12, 10, 3, 2, p + 1);
    // Front edge shadow
    pc.hline(3, 22, 54, f - 1);
    pc.hline(3, 23, 54, f - 1);
  },
};
