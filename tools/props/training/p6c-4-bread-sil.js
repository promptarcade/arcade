// Phase 6C.4: Loaf of Bread — SILHOUETTE ONLY
// Soft rounded rectangle with a domed top. Scoring lines on top.
// Side view, slightly from above.

module.exports = {
  width: 128,
  height: 80,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;

    const cx = 64, cy = 44;

    // Bread loaf: rounded rectangle with domed top
    // Width:height roughly 2:1. Rounded ends. Top is a gentle dome.
    const loafLeft = 14, loafRight = 114;
    const loafBot = 66;
    const loafW = loafRight - loafLeft;

    for (let x = loafLeft; x <= loafRight; x++) {
      // Horizontal position 0-1
      const hT = (x - loafLeft) / loafW;

      // Top profile: dome shape, highest in centre, rounded at ends
      // Use a combination of flat top + rounded ends
      let topY;
      if (hT < 0.12) {
        // Left end rounds up
        const endT = hT / 0.12;
        topY = 46 - Math.sqrt(Math.max(0, 1 - (1 - endT) * (1 - endT))) * 24;
      } else if (hT > 0.88) {
        // Right end rounds up
        const endT = (1 - hT) / 0.12;
        topY = 46 - Math.sqrt(Math.max(0, 1 - (1 - endT) * (1 - endT))) * 24;
      } else {
        // Centre dome — gentle arc
        const centreT = (hT - 0.12) / 0.76;
        topY = 22 - Math.sin(centreT * Math.PI) * 4;
      }

      topY = Math.round(topY);

      for (let y = topY; y <= loafBot; y++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 80) pc.setPixel(x, y, FLAT);
      }
    }

    // Rounded bottom corners
    for (const side of [loafLeft, loafRight]) {
      const cornerR = 6;
      const cornerX = side === loafLeft ? side + cornerR : side - cornerR;
      const cornerY = loafBot - cornerR;
      for (let dy = 0; dy <= cornerR; dy++) {
        for (let dx = -cornerR; dx <= cornerR; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > cornerR) {
            const px = cornerX + dx + (side === loafLeft ? -cornerR : cornerR);
            const py = cornerY + dy;
            // Clear pixels outside the rounded corner
            if (px >= 0 && px < 128 && py >= 0 && py < 80) {
              pc.setPixel(px, py, 0); // clear
            }
          }
        }
      }
    }
  },
};
