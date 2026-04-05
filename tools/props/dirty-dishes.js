// Dirty dish pile — 40x28 background prop
// Iteration 3: side view plates (flat lines), clearly stacked.
// Drawn in drawPost to bypass shading that destroys thin shapes.
module.exports = {
  width: 40, height: 28,
  outlineMode: 'none',
  colors: {
    plate: '#eeeee8',
    rim: '#bbbbaa',
    mug: '#ddddcc',
    mugRim: '#ccccbb',
    coffee: '#553311',
    stain: '#aa7744',
    sauce: '#cc3333',
    water: '#99bbdd',
    fork: '#bbbbbb',
  },

  draw(pc, pal) {
    // empty — all in drawPost to avoid shading
  },

  drawPost(pc, pal) {
    const p = pal.groups.plate.startIdx;
    const r = pal.groups.rim.startIdx;
    const m = pal.groups.mug.startIdx;
    const mr = pal.groups.mugRim.startIdx;
    const cf = pal.groups.coffee.startIdx;
    const st = pal.groups.stain.startIdx;
    const sa = pal.groups.sauce.startIdx;
    const w = pal.groups.water.startIdx;
    const f = pal.groups.fork.startIdx;

    // Water puddle at base
    pc.fillEllipse(16, 25, 12, 2, w + 2);

    // Stack of 4 plates — side view, each is 2-3px tall, wide
    // Plate 1 (bottom) — widest
    pc.hline(2, 22, 22, r + 1);  // shadow under
    pc.hline(1, 21, 24, p + 2);  // body
    pc.hline(1, 20, 24, p + 3);  // top highlight
    // Plate 2
    pc.hline(3, 18, 20, r + 1);
    pc.hline(2, 17, 22, p + 2);
    pc.hline(2, 16, 22, p + 3);
    // Food stain on plate 2
    pc.hline(8, 17, 5, st + 2);
    // Plate 3
    pc.hline(4, 14, 18, r + 1);
    pc.hline(3, 13, 20, p + 2);
    pc.hline(3, 12, 20, p + 3);
    // Sauce smear on plate 3
    pc.hline(10, 13, 3, sa + 2);
    pc.setPixel(13, 13, sa + 1);
    // Plate 4 (top, slightly askew — offset right)
    pc.hline(7, 10, 16, r + 1);
    pc.hline(6, 9, 18, p + 2);
    pc.hline(6, 8, 18, p + 3);

    // Sauce drip down the side of the stack
    pc.vline(5, 14, 7, sa + 2);
    pc.setPixel(5, 21, sa + 1);


    // Fork — lying flat in front of the stack
    pc.hline(1, 24, 14, f + 2);
    // Tines
    pc.setPixel(1, 23, f + 2);
    pc.setPixel(3, 23, f + 2);
    pc.setPixel(5, 23, f + 2);
    pc.setPixel(7, 23, f + 2);
    // Handle thickens
    pc.hline(10, 23, 5, f + 1);

    // Crumbs
    pc.setPixel(20, 23, st + 2);
    pc.setPixel(35, 20, st + 1);
    pc.setPixel(15, 25, st + 2);
  },
};
