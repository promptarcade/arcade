// Knife block — 20x32 background prop
// Iteration 3: knives stored BLADE DOWN, handles visible sticking up.
module.exports = {
  width: 20, height: 32,
  colors: {
    block: '#776644',
    handle1: '#332211',  // dark wood
    handle2: '#882222',  // red
    handle3: '#222222',  // black
    rivet: '#cccccc',    // metal rivets on handles
  },

  draw(pc, pal) {
    const b = pal.groups.block.startIdx;
    const h1 = pal.groups.handle1.startIdx;
    const h2 = pal.groups.handle2.startIdx;
    const h3 = pal.groups.handle3.startIdx;
    const rv = pal.groups.rivet.startIdx;

    // Block body
    pc.fillRect(3, 14, 14, 16, b + 2);
    pc.hline(3, 14, 14, b + 3);
    pc.hline(3, 15, 14, b + 3);
    pc.hline(3, 29, 14, b);
    pc.hline(4, 30, 12, b);
    pc.vline(3, 16, 12, b + 3);
    pc.vline(16, 16, 12, b + 1);
    // Slot lines
    pc.setPixel(6, 14, b + 1);
    pc.setPixel(10, 14, b + 1);
    pc.setPixel(13, 14, b + 1);

    // Knife 1 — chef's knife handle (center, tallest)
    // Dark wood handle sticking up
    pc.fillRect(9, 3, 3, 12, h1 + 2);
    pc.vline(9, 3, 12, h1 + 3);   // left highlight
    pc.vline(11, 4, 10, h1 + 1);  // right shadow
    // Rounded top
    pc.setPixel(9, 3, 0); pc.setPixel(11, 3, 0);
    pc.setPixel(10, 2, h1 + 2);
    // Rivets
    pc.setPixel(10, 6, rv + 2);
    pc.setPixel(10, 9, rv + 2);
    // Bolster (metal strip where handle meets blade)
    pc.hline(9, 13, 3, rv + 1);

    // Knife 2 — paring knife (left, shorter, red handle)
    pc.fillRect(5, 7, 2, 8, h2 + 2);
    pc.vline(5, 7, 8, h2 + 3);
    pc.setPixel(5, 7, 0); // round top
    pc.setPixel(5, 6, h2 + 2);
    // Rivet
    pc.setPixel(6, 10, rv + 2);
    // Bolster
    pc.hline(5, 14, 2, rv + 1);

    // Knife 3 — bread knife (right, black handle)
    pc.fillRect(13, 5, 2, 10, h3 + 2);
    pc.vline(13, 5, 10, h3 + 3);
    pc.setPixel(14, 5, 0); // round top
    pc.setPixel(13, 4, h3 + 2);
    // Rivet
    pc.setPixel(14, 8, rv + 2);
    pc.setPixel(14, 11, rv + 2);
    // Bolster
    pc.hline(13, 14, 2, rv + 1);
  },
  drawPost(pc, pal) {},
};
