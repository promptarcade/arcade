// Ladle Slingshot — 32x48
// Y-shaped wooden ladle mounted in a stand with rubber bands.

module.exports = {
  width: 32, height: 48,
  colors: {
    wood: '#996633',      // warm wood handle
    metal: '#aab0b8',     // ladle bowl (metal)
    band: '#cc4444',      // red rubber band
    base: '#776644',      // darker wood base/stand
  },

  draw(pc, pal) {
    const w = pal.groups.wood.startIdx;
    const m = pal.groups.metal.startIdx;
    const b = pal.groups.band.startIdx;
    const bs = pal.groups.base.startIdx;
    const cx = 16;

    // Base / stand block at bottom
    pc.fillRect(6, 40, 20, 7, bs + 2);
    pc.hline(6, 40, 20, bs + 3);  // top highlight
    pc.hline(7, 47, 18, bs);      // bottom shadow
    pc.vline(6, 41, 6, bs + 3);   // left highlight
    pc.vline(25, 41, 6, bs + 1);  // right shadow
    // Wood grain on base
    pc.hline(8, 43, 16, bs + 1);
    pc.hline(9, 45, 14, bs + 1);

    // Handle — thick vertical pole rising from base
    pc.fillRect(cx - 2, 14, 5, 28, w + 2);
    // Handle highlight left side
    pc.vline(cx - 2, 15, 26, w + 3);
    // Handle shadow right side
    pc.vline(cx + 2, 15, 26, w + 1);
    // Handle wood grain
    pc.setPixel(cx, 20, w + 1);
    pc.setPixel(cx, 26, w + 1);
    pc.setPixel(cx, 32, w + 1);
    pc.setPixel(cx - 1, 23, w + 3);
    pc.setPixel(cx - 1, 29, w + 3);

    // Y-fork at top — two prongs splitting
    // Left prong
    pc.fillRect(cx - 7, 4, 4, 12, w + 2);
    pc.vline(cx - 7, 5, 10, w + 3);
    pc.vline(cx - 4, 5, 10, w + 1);
    // Diagonal connecting left prong to handle
    pc.line(cx - 4, 14, cx - 2, 18, w + 2);
    pc.line(cx - 5, 14, cx - 2, 17, w + 2);

    // Right prong
    pc.fillRect(cx + 4, 4, 4, 12, w + 2);
    pc.vline(cx + 4, 5, 10, w + 3);
    pc.vline(cx + 7, 5, 10, w + 1);
    // Diagonal connecting right prong to handle
    pc.line(cx + 4, 14, cx + 2, 18, w + 2);
    pc.line(cx + 5, 14, cx + 2, 17, w + 2);

    // Rounded tops on prongs
    pc.hline(cx - 6, 4, 2, w + 3);
    pc.hline(cx + 5, 4, 2, w + 3);
    pc.setPixel(cx - 7, 4, 0);
    pc.setPixel(cx + 7, 4, 0);

    // Notches where rubber band attaches
    pc.setPixel(cx - 7, 8, w);
    pc.setPixel(cx + 7, 8, w);

    // Rubber band — red, stretched between prong tips
    // Left band segment (from left prong notch, hanging down to center)
    pc.line(cx - 7, 8, cx - 4, 14, b + 2);
    pc.line(cx - 4, 14, cx, 16, b + 2);
    // Right band segment
    pc.line(cx + 7, 8, cx + 4, 14, b + 2);
    pc.line(cx + 4, 14, cx, 16, b + 2);
    // Band highlight
    pc.setPixel(cx - 6, 9, b + 3);
    pc.setPixel(cx + 6, 9, b + 3);

    // Ladle bowl — metal cup shape resting in the band cradle
    pc.fillEllipse(cx, 17, 4, 3, m + 2);
    pc.fillEllipse(cx, 16, 3, 2, m + 3);  // highlight on rim
    pc.setPixel(cx, 19, m + 1);            // shadow at bottom of cup
  },

  drawPost(pc, pal) {},
};
