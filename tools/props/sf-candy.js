// Snip & Feed — Wrapped candy 32x24
module.exports = {
  width: 32, height: 24,
  colors: { red: '#E53935', white: '#ffffff', wrapper: '#FFD54F' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const r = pal.groups.red.startIdx;
    const w = pal.groups.white.startIdx;
    const g = pal.groups.wrapper.startIdx;

    // Left wrapper twist
    pc.fillEllipse(5, 12, 4, 3, g + 2);
    pc.fillEllipse(3, 11, 2, 2, g + 3);
    pc.fillEllipse(3, 13, 2, 2, g + 1);
    // Twist creases
    pc.setPixel(4, 10, g);
    pc.setPixel(6, 10, g);
    pc.setPixel(4, 14, g);
    pc.setPixel(6, 14, g);

    // Right wrapper twist
    pc.fillEllipse(27, 12, 4, 3, g + 2);
    pc.fillEllipse(29, 11, 2, 2, g + 3);
    pc.fillEllipse(29, 13, 2, 2, g + 1);
    // Twist creases
    pc.setPixel(26, 10, g);
    pc.setPixel(28, 10, g);
    pc.setPixel(26, 14, g);
    pc.setPixel(28, 14, g);

    // Candy body — oval center
    pc.fillEllipse(16, 12, 10, 6, r + 2);

    // White stripes (diagonal)
    for (let i = -2; i <= 2; i++) {
      const cx = 16 + i * 4;
      for (let dy = -5; dy <= 5; dy++) {
        const x = cx + Math.floor(dy * 0.3);
        const y = 12 + dy;
        // Only draw if inside the candy ellipse
        const dx2 = (x - 16) / 10;
        const dy2 = (y - 12) / 6;
        if (dx2 * dx2 + dy2 * dy2 < 0.85) {
          pc.setPixel(x, y, w + 2);
          if (dy > -4) pc.setPixel(x + 1, y, w + 3);
        }
      }
    }

    // Highlight shine spot
    pc.fillCircle(13, 9, 2, w + 3);
    pc.setPixel(12, 8, w + 3);
  },
  drawPost(pc, pal) {},
};
