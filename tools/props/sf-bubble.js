// Snip & Feed — Soap bubble 40x40
module.exports = {
  width: 40, height: 40,
  colors: { bubble: '#B3E5FC', shine: '#ffffff', rainbow: '#CE93D8' },
  outlineMode: 'none',
  draw(pc, pal) {
    const b = pal.groups.bubble.startIdx;
    const sh = pal.groups.shine.startIdx;
    const rb = pal.groups.rainbow.startIdx;

    // Outer bubble ring — thin transparent border
    pc.fillCircle(20, 20, 18, b);
    // Inner transparent area (slightly lighter)
    pc.fillCircle(20, 20, 16, b + 1);
    // Even more transparent center
    pc.fillCircle(20, 20, 13, b + 2);
    pc.fillCircle(20, 20, 9, b + 3);

    // Rainbow sheen — upper left arc
    for (let a = 2.0; a < 3.8; a += 0.08) {
      const x = Math.round(20 + Math.cos(a) * 14);
      const y = Math.round(20 + Math.sin(a) * 14);
      pc.setPixel(x, y, rb + 2);
      pc.setPixel(x + 1, y, rb + 3);
    }
    // Second rainbow band
    for (let a = 2.2; a < 3.5; a += 0.08) {
      const x = Math.round(20 + Math.cos(a) * 12);
      const y = Math.round(20 + Math.sin(a) * 12);
      pc.setPixel(x, y, rb + 1);
    }

    // Main shine highlight — upper left
    pc.fillCircle(13, 12, 4, sh + 3);
    pc.fillCircle(12, 11, 2, sh + 3);
    // Small secondary highlight
    pc.fillCircle(15, 15, 1, sh + 2);

    // Rim highlights — bottom right
    for (let a = -0.5; a < 0.8; a += 0.1) {
      const x = Math.round(20 + Math.cos(a) * 16);
      const y = Math.round(20 + Math.sin(a) * 16);
      pc.setPixel(x, y, sh + 1);
    }
  },
  drawPost(pc, pal) {},
};
