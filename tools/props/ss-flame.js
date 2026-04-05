// Sizzle Street — Cooking Flame icon (24x24)
module.exports = {
  width: 24, height: 24,
  colors: {
    orange: '#ff6600',
    yellow: '#ffcc00',
    red: '#cc2200',
    core: '#ffffaa',
  },
  draw(pc, pal) {
    const o = pal.groups.orange.startIdx;
    const y = pal.groups.yellow.startIdx;
    const r = pal.groups.red.startIdx;
    const c = pal.groups.core.startIdx;

    // Outer flame shape — red base
    pc.fillEllipse(12, 14, 6, 8, r + 2);
    // Taper the top
    pc.fillTriangle(12, 3, 7, 14, 17, 14, r + 2);

    // Middle flame — orange
    pc.fillEllipse(12, 15, 5, 6, o + 2);
    pc.fillTriangle(12, 5, 8, 14, 16, 14, o + 2);

    // Inner flame — yellow
    pc.fillEllipse(12, 16, 3, 5, y + 2);
    pc.fillTriangle(12, 8, 10, 16, 14, 16, y + 3);

    // Core — bright white-yellow
    pc.fillEllipse(12, 18, 2, 3, c + 2);
    pc.setPixel(12, 16, c + 3);
    pc.setPixel(12, 15, c + 3);

    // Flicker tips
    pc.setPixel(9, 8, r + 3);
    pc.setPixel(14, 6, r + 3);
    pc.setPixel(11, 4, o + 3);

    // Flame wisps
    pc.setPixel(8, 10, o + 3);
    pc.setPixel(16, 9, o + 3);
  },
  drawPost(pc, pal) {},
};
