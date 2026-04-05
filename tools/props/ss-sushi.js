// Sizzle Street — Sushi Platter (3/4 top-down, wooden board with 3 distinct pieces)
module.exports = {
  width: 32, height: 32,
  outlineMode: 'none',
  colors: {
    board: '#8b6b4a',
    rice: '#f5f5e8',
    salmon: '#fa8072',
    tuna: '#cc3333',
    nori: '#2d4a2d',
    avocado: '#6b8e23',
    soy: '#3a2010',
  },
  draw(pc, pal) {
    const bd = pal.groups.board.startIdx;
    const ri = pal.groups.rice.startIdx;
    const sa = pal.groups.salmon.startIdx;
    const tu = pal.groups.tuna.startIdx;
    const no = pal.groups.nori.startIdx;
    const av = pal.groups.avocado.startIdx;
    const so = pal.groups.soy.startIdx;

    // Wooden serving board — warm rectangle with rounded ends
    pc.fillRect(2, 10, 28, 16, bd + 1);
    pc.fillRect(3, 9, 26, 18, bd + 2);
    // Wood grain highlights
    pc.hline(4, 12, 24, bd + 3);
    pc.hline(4, 16, 24, bd + 3);
    pc.hline(4, 20, 24, bd + 3);
    pc.hline(4, 24, 24, bd + 3);

    // === Salmon Nigiri (left) ===
    // Rice base — rounded rectangle
    pc.fillRect(4, 16, 7, 5, ri + 2);
    pc.fillRect(5, 15, 5, 7, ri + 2);
    pc.hline(5, 15, 5, ri + 3);  // top highlight
    // Salmon draped on top
    pc.fillRect(4, 14, 7, 4, sa + 2);
    pc.fillRect(5, 13, 5, 4, sa + 2);
    pc.hline(5, 13, 5, sa + 3);  // highlight
    // Salmon grain lines
    pc.hline(5, 15, 5, sa + 1);
    // Nori belt
    pc.fillRect(6, 14, 3, 7, no + 2);
    pc.fillRect(6, 14, 3, 1, no + 3);

    // === Tuna Nigiri (center) ===
    // Rice base
    pc.fillRect(13, 16, 7, 5, ri + 2);
    pc.fillRect(14, 15, 5, 7, ri + 2);
    pc.hline(14, 15, 5, ri + 3);
    // Tuna on top — deeper red
    pc.fillRect(13, 14, 7, 4, tu + 2);
    pc.fillRect(14, 13, 5, 4, tu + 2);
    pc.hline(14, 13, 5, tu + 3);
    // Tuna marbling
    pc.setPixel(15, 14, tu + 3);
    pc.setPixel(17, 15, tu + 3);
    // Nori belt
    pc.fillRect(15, 14, 3, 7, no + 2);
    pc.fillRect(15, 14, 3, 1, no + 3);

    // === Maki Roll trio (right) — 3 small circles ===
    // Roll 1
    pc.fillCircle(24, 14, 3, no + 2);
    pc.fillCircle(24, 14, 2, ri + 2);
    pc.fillCircle(24, 14, 1, av + 2);
    pc.setPixel(24, 14, av + 3);
    // Roll 2
    pc.fillCircle(24, 20, 3, no + 2);
    pc.fillCircle(24, 20, 2, ri + 2);
    pc.fillCircle(24, 20, 1, sa + 2);
    pc.setPixel(24, 20, sa + 3);
    // Roll 3
    pc.fillCircle(28, 17, 3, no + 1);
    pc.fillCircle(28, 17, 2, ri + 2);
    pc.fillCircle(28, 17, 1, tu + 2);
    pc.setPixel(28, 17, tu + 3);

    // Soy sauce dish — small dark circle, bottom-left
    pc.fillCircle(6, 25, 2, so + 1);
    pc.fillCircle(6, 25, 1, so + 2);
    pc.setPixel(5, 24, so + 3);

    // Wasabi — tiny green mound
    pc.fillRect(10, 24, 2, 2, av + 2);
    pc.setPixel(10, 24, av + 3);
  },
  drawPost(pc, pal) {},
};
