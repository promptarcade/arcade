// Sizzle Street — Stir Fry in a wok (top-down 3/4 view)
module.exports = {
  width: 32, height: 32,
  colors: {
    wok: '#444444',
    food: '#66aa44',
    carrot: '#ff8c00',
    pepper: '#dd3333',
    rice: '#ffffcc',
  },
  draw(pc, pal) {
    const w = pal.groups.wok.startIdx;
    const f = pal.groups.food.startIdx;
    const ca = pal.groups.carrot.startIdx;
    const pe = pal.groups.pepper.startIdx;
    const ri = pal.groups.rice.startIdx;

    // Wok body — dark round shape
    pc.fillEllipse(16, 17, 14, 11, w + 1);
    // Wok inner surface
    pc.fillEllipse(16, 16, 12, 9, w + 2);
    // Wok rim highlight
    pc.fillEllipse(16, 10, 12, 2, w + 3);

    // Food pile in the wok
    // Base layer — rice/noodle bed
    pc.fillEllipse(16, 16, 9, 6, ri + 2);

    // Green veggies — scattered pieces
    pc.fillRect(10, 13, 3, 2, f + 2);
    pc.fillRect(18, 14, 3, 2, f + 3);
    pc.fillRect(13, 17, 2, 3, f + 2);
    pc.fillRect(20, 16, 2, 2, f + 1);
    pc.fillRect(14, 11, 2, 2, f + 3);

    // Carrot pieces
    pc.fillRect(11, 15, 2, 2, ca + 2);
    pc.fillRect(17, 12, 3, 2, ca + 3);
    pc.fillRect(19, 18, 2, 2, ca + 2);

    // Red pepper bits
    pc.fillRect(15, 14, 2, 2, pe + 2);
    pc.fillRect(12, 18, 2, 2, pe + 3);
    pc.fillRect(21, 14, 2, 1, pe + 2);

    // Wok handles
    pc.fillRect(1, 15, 3, 2, w + 2);
    pc.fillRect(28, 15, 3, 2, w + 2);
  },
  drawPost(pc, pal) {},
};
