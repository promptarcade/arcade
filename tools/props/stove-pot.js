// Stove with bubbling pot — 40x32 background prop
// Gas burner ring with a large pot, steam/bubbles rising, orange flame glow.
module.exports = {
  width: 40, height: 32,
  colors: {
    stove: '#333333',   // dark stove surface
    burner: '#555555',  // burner ring
    pot: '#886644',     // copper pot
    steam: '#ddeeff',   // steam wisps
    flame: '#ff8822',   // gas flame
    food: '#bb8833',    // stew/soup colour
  },

  draw(pc, pal) {
    const sv = pal.groups.stove.startIdx;
    const bn = pal.groups.burner.startIdx;
    const pt = pal.groups.pot.startIdx;
    const sm = pal.groups.steam.startIdx;
    const fl = pal.groups.flame.startIdx;
    const fd = pal.groups.food.startIdx;

    // Stove surface
    pc.fillRect(0, 20, 40, 12, sv + 2);
    pc.hline(0, 20, 40, sv + 3);
    pc.hline(0, 31, 40, sv);
    // Burner grate lines
    pc.hline(4, 22, 32, bn + 2);
    pc.hline(4, 24, 32, bn + 2);
    pc.hline(4, 26, 32, bn + 1);
    // Knob on front
    pc.fillRect(18, 28, 4, 3, bn + 2);
    pc.setPixel(19, 28, bn + 3);

    // Gas flames — small blue-orange flickers under the pot
    pc.setPixel(10, 21, fl + 3);
    pc.setPixel(12, 20, fl + 2);
    pc.setPixel(14, 21, fl + 3);
    pc.setPixel(26, 21, fl + 3);
    pc.setPixel(28, 20, fl + 2);
    pc.setPixel(30, 21, fl + 3);
    // Blue base of flames
    pc.setPixel(11, 22, sv + 3);
    pc.setPixel(13, 22, sv + 3);
    pc.setPixel(27, 22, sv + 3);
    pc.setPixel(29, 22, sv + 3);

    // Pot sitting on burner
    pc.fillRect(6, 8, 28, 14, pt + 2);
    // Rim
    pc.hline(5, 8, 30, pt + 3);
    pc.hline(5, 9, 30, pt + 3);
    // Handles
    pc.fillRect(2, 12, 4, 3, pt + 1);
    pc.fillRect(34, 12, 4, 3, pt + 1);
    pc.setPixel(2, 12, pt + 2);
    pc.setPixel(37, 12, pt + 2);
    // Left highlight
    pc.vline(6, 10, 10, pt + 3);
    // Right shadow
    pc.vline(33, 10, 10, pt + 1);
    // Stew/soup visible at top
    pc.fillRect(7, 10, 26, 3, fd + 2);
    pc.fillRect(8, 10, 10, 2, fd + 3);

    // Bubbles in the stew
    pc.setPixel(12, 10, fd + 3);
    pc.setPixel(18, 11, fd + 3);
    pc.setPixel(24, 10, fd + 3);
    pc.setPixel(28, 11, fd + 3);
  },

  drawPost(pc, pal) {
    const sm = pal.groups.steam.startIdx;

    // Steam wisps rising above pot — drawn after shading
    pc.setPixel(14, 6, sm + 2);
    pc.setPixel(13, 4, sm + 3);
    pc.setPixel(15, 3, sm + 2);
    pc.setPixel(14, 1, sm + 3);

    pc.setPixel(22, 5, sm + 2);
    pc.setPixel(23, 3, sm + 3);
    pc.setPixel(21, 2, sm + 2);
    pc.setPixel(22, 0, sm + 3);

    pc.setPixel(28, 6, sm + 2);
    pc.setPixel(27, 4, sm + 3);
  },
};
