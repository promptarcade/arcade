// Sizzle Street — Chef's Special (ornate plated dish with sauce art)
module.exports = {
  width: 32, height: 32,
  colors: {
    plate: '#f5f0e8',
    gold: '#daa520',
    main: '#8b4513',
    sauce: '#cc2222',
    herb: '#338833',
    cream: '#fff8dc',
  },
  draw(pc, pal) {
    const pl = pal.groups.plate.startIdx;
    const go = pal.groups.gold.startIdx;
    const ma = pal.groups.main.startIdx;
    const sa = pal.groups.sauce.startIdx;
    const he = pal.groups.herb.startIdx;
    const cr = pal.groups.cream.startIdx;

    // Ornate plate with gold rim
    pc.fillEllipse(16, 18, 14, 11, go + 2);
    pc.fillEllipse(16, 18, 13, 10, pl + 2);
    pc.fillEllipse(16, 17, 12, 9, pl + 3);

    // Gold rim dots
    for (let a = 0; a < 12; a++) {
      const angle = (a / 12) * Math.PI * 2;
      const x = Math.round(16 + 13 * Math.cos(angle));
      const y = Math.round(18 + 10 * Math.sin(angle));
      pc.setPixel(x, y, go + 3);
    }

    // Sauce art — elegant swirl on plate
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const x = Math.round(16 + (8 - t * 6) * Math.cos(t * Math.PI * 3));
      const y = Math.round(18 + (6 - t * 4) * Math.sin(t * Math.PI * 3));
      pc.setPixel(x, y, sa + 2);
      pc.setPixel(x + 1, y, sa + 3);
    }

    // Main protein — small elegant portion
    pc.fillEllipse(15, 16, 5, 3, ma + 2);
    pc.fillEllipse(15, 15, 4, 2, ma + 3);

    // Cream dollop
    pc.fillCircle(20, 15, 2, cr + 2);
    pc.setPixel(20, 14, cr + 3);

    // Herb garnish — tiny leaves
    pc.setPixel(12, 14, he + 3);
    pc.setPixel(11, 15, he + 2);
    pc.setPixel(13, 13, he + 2);
    pc.setPixel(19, 20, he + 3);
    pc.setPixel(18, 19, he + 2);

    // Microgreens on top
    pc.setPixel(14, 14, he + 3);
    pc.setPixel(16, 14, he + 3);
    pc.setPixel(15, 13, he + 2);
  },
  drawPost(pc, pal) {},
};
