// Baby Wrangler — Coffee table (40x20, top-down)
module.exports = {
  width: 40, height: 20,
  colors: { wood: '#8b6914', top: '#a07828', mug: '#dddddd' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const w = pal.groups.wood.startIdx + 2;
    const t = pal.groups.top.startIdx + 2;
    const m = pal.groups.mug.startIdx + 2;
    // Table legs (visible at corners, top-down)
    pc.fillRect(1, 1, 3, 3, w - 1);
    pc.fillRect(36, 1, 3, 3, w - 1);
    pc.fillRect(1, 16, 3, 3, w - 1);
    pc.fillRect(36, 16, 3, 3, w - 1);
    // Table top
    pc.fillRect(0, 0, 40, 20, t);
    // Wood grain lines
    pc.hline(3, 5, 34, t - 1);
    pc.hline(5, 10, 30, t - 1);
    pc.hline(2, 15, 36, t - 1);
    // Edge highlight (top-left = light direction)
    pc.hline(0, 0, 40, t + 1);
    pc.vline(0, 0, 20, t + 1);
    // Edge shadow
    pc.hline(0, 19, 40, w);
    pc.vline(39, 0, 20, w);
    // Mug
    pc.fillCircle(32, 6, 3, m);
    pc.fillCircle(32, 6, 2, m + 1);
    pc.setPixel(32, 6, m - 1); // coffee inside
    // Mug handle
    pc.setPixel(35, 5, m); pc.setPixel(35, 6, m); pc.setPixel(35, 7, m);
  },
};
