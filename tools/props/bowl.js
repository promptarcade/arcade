// Bowl — 16x16 tile (3/4 view, deeper than plate)
module.exports = {
  width: 16, height: 16,
  colors: { ceramic: '#dde4ee', pattern: '#4466aa', rim: '#bbbbcc' },
  draw(pc, pal) {
    const c = pal.groups.ceramic.startIdx;
    const p = pal.groups.pattern.startIdx;
    const r = pal.groups.rim.startIdx;
    // Bowl shape — half-circle from side
    pc.fillEllipse(8, 9, 6, 5, c + 2);
    // Clear top half to make it bowl-shaped (open top)
    pc.fillRect(1, 2, 14, 4, 0);
    // Rim — ellipse at top opening
    pc.fillEllipse(8, 6, 6, 2, c + 3);
    pc.fillEllipse(8, 6, 5, 1, r + 2);
    // Blue decorative band
    pc.hline(3, 9, 10, p + 2);
    pc.hline(3, 10, 10, p + 1);
    // Highlight on left side
    pc.vline(3, 7, 4, c + 3);
    // Base
    pc.hline(5, 14, 6, r + 1);
  },
  drawPost(pc, pal) {},
};
