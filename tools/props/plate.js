// Plate — 16x16 tile (side view — flat disc)
// Iteration 5: draw everything in drawPost to bypass auto-shading entirely.
module.exports = {
  width: 16, height: 16,
  outlineMode: 'none',
  colors: { ceramic: '#eeeeee', rim: '#bbbbbb', pattern: '#7788aa' },
  draw(pc, pal) {
    // Empty — all drawing in drawPost to avoid shading interference
  },
  drawPost(pc, pal) {
    const c = pal.groups.ceramic.startIdx;
    const r = pal.groups.rim.startIdx;
    const p = pal.groups.pattern.startIdx;

    // Bright top edge
    pc.hline(2, 7, 12, c + 3);
    // Ceramic face
    pc.hline(1, 8, 14, c + 2);
    // Shadow bottom edge
    pc.hline(2, 9, 12, r + 1);
    // Blue stripe
    pc.hline(4, 8, 8, p + 2);
    // Rim ends
    pc.setPixel(1, 7, r + 2);
    pc.setPixel(1, 9, r + 1);
    pc.setPixel(14, 7, r + 2);
    pc.setPixel(14, 9, r + 1);
    // Shadow underneath
    pc.hline(4, 10, 8, r);
  },
};
