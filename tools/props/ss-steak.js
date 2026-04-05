// Sizzle Street — Steak Dinner (steak with garnish on a plate)
module.exports = {
  width: 32, height: 32,
  colors: {
    steak: '#6b3410',
    sear: '#8b4513',
    plate: '#e8e4dc',
    rim: '#c0b8a8',
    green: '#228b22',
    butter: '#ffd700',
  },
  draw(pc, pal) {
    const st = pal.groups.steak.startIdx;
    const se = pal.groups.sear.startIdx;
    const pl = pal.groups.plate.startIdx;
    const r = pal.groups.rim.startIdx;
    const g = pal.groups.green.startIdx;
    const bu = pal.groups.butter.startIdx;

    // Plate
    pc.fillEllipse(16, 18, 14, 11, pl + 2);
    pc.fillEllipse(16, 18, 14, 11, r + 2);
    pc.fillEllipse(16, 18, 12, 9, pl + 2);
    pc.fillEllipse(16, 17, 11, 8, pl + 3);

    // Steak — irregular oval
    pc.fillEllipse(14, 16, 8, 5, st + 2);
    pc.fillEllipse(14, 15, 7, 4, se + 2);
    // Grill marks
    for (let i = 0; i < 5; i++) {
      const x = 9 + i * 3;
      pc.setPixel(x, 14, st + 1);
      pc.setPixel(x, 16, st + 1);
      pc.setPixel(x + 1, 15, st + 1);
    }
    // Sear highlight
    pc.fillEllipse(12, 14, 3, 2, se + 3);

    // Butter pat on top
    pc.fillRect(13, 13, 3, 2, bu + 3);
    pc.setPixel(14, 13, bu + 3);

    // Green garnish — broccoli/herbs
    pc.fillCircle(22, 14, 2, g + 2);
    pc.fillCircle(24, 16, 2, g + 3);
    pc.fillCircle(23, 13, 1, g + 3);
    // Stems
    pc.setPixel(22, 16, g + 1);
    pc.setPixel(24, 18, g + 1);

    // Side — small potato wedges
    pc.fillEllipse(21, 21, 3, 2, bu + 2);
    pc.fillEllipse(19, 22, 2, 1, bu + 1);
  },
  drawPost(pc, pal) {},
};
