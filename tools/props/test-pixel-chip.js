// Poker Chip — Pixel tier (16x16)
// Balatro-style: clean circle, stripe detail, bold color, minimal palette.
// Should read as a poker chip at tiny scale.

module.exports = {
  width: 16,
  height: 16,
  style: 'pixel',
  entityType: 'prop',
  colors: {
    body: '#cc3333',     // red chip
    stripe: '#eeeedd',   // white stripe
    edge: '#882222',     // dark edge
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const s = pal.groups.stripe.startIdx;
    const e = pal.groups.edge.startIdx;
    const cx = 8, cy = 8;

    // Chip body — filled circle, r=6
    pc.fillCircle(cx, cy, 6, b + 2);

    // Inner ring — slightly smaller circle outline
    // Draw ring by filling slightly smaller then clearing center
    for (let a = 0; a < 360; a += 5) {
      const rad = a * Math.PI / 180;
      const x = Math.round(cx + 4.5 * Math.cos(rad));
      const y = Math.round(cy + 4.5 * Math.sin(rad));
      if (pc.isFilled(x, y)) pc.setPixel(x, y, b + 1);
    }

    // Horizontal white stripe across center
    pc.hline(cx - 5, cy - 1, 11, s + 2);
    pc.hline(cx - 6, cy, 13, s + 2);
    pc.hline(cx - 5, cy + 1, 11, s + 2);

    // Clip stripe to circle — clear pixels outside the chip
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > 6.3 * 6.3) {
          pc.setPixel(x, y, 0);
        }
      }
    }

    // Edge notches — 4 small dashes at cardinal points on the edge
    // Top notch
    pc.setPixel(cx - 1, cy - 6, s + 2);
    pc.setPixel(cx, cy - 6, s + 2);
    pc.setPixel(cx + 1, cy - 6, s + 2);
    // Bottom notch
    pc.setPixel(cx - 1, cy + 6, s + 2);
    pc.setPixel(cx, cy + 6, s + 2);
    pc.setPixel(cx + 1, cy + 6, s + 2);
    // Left notch
    pc.setPixel(cx - 6, cy - 1, s + 2);
    pc.setPixel(cx - 6, cy, s + 2);
    pc.setPixel(cx - 6, cy + 1, s + 2);
    // Right notch
    pc.setPixel(cx + 6, cy - 1, s + 2);
    pc.setPixel(cx + 6, cy, s + 2);
    pc.setPixel(cx + 6, cy + 1, s + 2);

    // Highlight — upper-left quadrant lighter
    pc.setPixel(cx - 3, cy - 4, b + 3);
    pc.setPixel(cx - 2, cy - 4, b + 3);
    pc.setPixel(cx - 4, cy - 3, b + 3);
    pc.setPixel(cx - 3, cy - 3, b + 3);

    // Shadow — lower-right darker
    pc.setPixel(cx + 3, cy + 4, b + 0);
    pc.setPixel(cx + 4, cy + 3, b + 0);
    pc.setPixel(cx + 4, cy + 4, b + 0);
  },
};
