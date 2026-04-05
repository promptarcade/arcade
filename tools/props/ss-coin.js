// Sizzle Street — Gold Coin icon (24x24)
module.exports = {
  width: 24, height: 24,
  colors: {
    gold: '#ffd700',
    dark: '#b8860b',
    shine: '#ffffaa',
  },
  draw(pc, pal) {
    const g = pal.groups.gold.startIdx;
    const d = pal.groups.dark.startIdx;
    const s = pal.groups.shine.startIdx;

    // Coin body
    pc.fillCircle(12, 12, 9, g + 2);
    // Inner ring
    pc.fillCircle(12, 12, 7, g + 3);
    pc.fillCircle(12, 12, 6, g + 2);

    // Edge shadow (bottom-right)
    for (let a = -0.3; a < 1.3; a += 0.05) {
      const x = Math.round(12 + 9 * Math.cos(a));
      const y = Math.round(12 + 9 * Math.sin(a));
      pc.setPixel(x, y, d + 1);
    }

    // Shine (top-left)
    for (let a = 2.5; a < 4.0; a += 0.05) {
      const x = Math.round(12 + 9 * Math.cos(a));
      const y = Math.round(12 + 9 * Math.sin(a));
      pc.setPixel(x, y, s + 2);
    }

    // $ symbol
    // Vertical bar
    pc.vline(12, 7, 10, d + 2);
    // Top curve
    pc.hline(10, 8, 4, d + 2);
    pc.setPixel(9, 9, d + 2);
    pc.hline(9, 10, 3, d + 2);
    // Middle
    pc.hline(11, 12, 3, d + 2);
    // Bottom curve
    pc.hline(11, 14, 3, d + 2);
    pc.setPixel(14, 13, d + 2);
    pc.hline(10, 15, 4, d + 2);

    // Highlight specular
    pc.setPixel(8, 7, s + 3);
    pc.setPixel(9, 6, s + 2);
  },
  drawPost(pc, pal) {},
};
