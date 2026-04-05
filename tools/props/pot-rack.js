// Pot rack — 64x32 background decoration
// Iron bar across the top with S-hooks, hanging copper pots, silver pan, iron skillet.
module.exports = {
  width: 64, height: 32,
  colors: {
    bar: '#444444',       // dark iron rack bar
    hook: '#666666',      // S-hooks
    copper: '#996633',    // copper pot
    silver: '#aab0b8',    // silver pan
    iron: '#555555',      // cast iron skillet
  },

  draw(pc, pal) {
    const br = pal.groups.bar.startIdx;
    const hk = pal.groups.hook.startIdx;
    const co = pal.groups.copper.startIdx;
    const sv = pal.groups.silver.startIdx;
    const ir = pal.groups.iron.startIdx;

    // Main bar
    pc.fillRect(2, 1, 60, 3, br + 2);
    pc.hline(2, 1, 60, br + 3);  // top highlight
    pc.hline(2, 3, 60, br);      // bottom shadow
    // End caps
    pc.fillRect(0, 0, 3, 5, br + 1);
    pc.fillRect(61, 0, 3, 5, br + 1);

    // Hook + copper pot (left)
    pc.vline(12, 4, 5, hk + 2);
    pc.setPixel(12, 4, hk + 3);
    // Pot body
    pc.fillRect(6, 10, 12, 10, co + 2);
    pc.hline(5, 10, 14, co + 3);   // rim highlight
    pc.hline(5, 11, 14, co + 2);   // rim
    pc.vline(6, 11, 8, co + 3);    // left highlight
    pc.vline(17, 11, 8, co + 1);   // right shadow
    // Handle
    pc.fillRect(18, 12, 5, 2, co + 1);
    // Bottom round
    pc.hline(7, 20, 10, co + 1);

    // Hook + silver pan (center-left)
    pc.vline(28, 4, 4, hk + 2);
    pc.setPixel(28, 4, hk + 3);
    // Pan — flat wide profile
    pc.fillRect(22, 9, 14, 4, sv + 2);
    pc.hline(22, 9, 14, sv + 3);
    pc.hline(22, 12, 14, sv + 1);
    // Handle
    pc.fillRect(36, 10, 6, 2, sv + 1);
    pc.setPixel(36, 10, sv + 2);

    // Hook + iron skillet (center-right)
    pc.vline(46, 4, 5, hk + 2);
    pc.setPixel(46, 4, hk + 3);
    // Skillet — round with long handle
    pc.fillEllipse(46, 14, 7, 6, ir + 2);
    pc.fillEllipse(46, 13, 5, 4, ir + 3); // inner cooking surface lighter
    // Handle
    pc.fillRect(53, 13, 8, 2, ir + 1);
    pc.setPixel(53, 13, ir + 2);
  },
  drawPost(pc, pal) {},
};
