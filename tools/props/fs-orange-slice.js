// Orange Slice — 40x40 cross-section
// Circle: thin orange rind, white pith inside, 8-10 triangular citrus segments
// radiating from center with white membrane lines between them

module.exports = {
  width: 40,
  height: 40,
  colors: {
    rind: '#ee8811',
    pith: '#f0e8d0',
    flesh: '#ffaa33',
    membrane: '#f5f0e0',
  },

  draw(pc, pal) {
    const r = pal.groups.rind.startIdx;
    const p = pal.groups.pith.startIdx;
    const f = pal.groups.flesh.startIdx;
    const cx = 20, cy = 20;
    const outerR = 17;

    // Layer 1: Orange rind — full circle
    pc.fillCircle(cx, cy, outerR, r + 2);

    // Rind highlight on upper-left
    pc.fillCircle(cx - 3, cy - 3, outerR - 1, r + 2);
    for (let a = 0; a < Math.PI * 0.5; a += 0.1) {
      const px = Math.round(cx + Math.cos(a + Math.PI) * (outerR - 1));
      const py = Math.round(cy + Math.sin(a + Math.PI) * (outerR - 1));
      pc.setPixel(px, py, r + 3);
    }

    // Layer 2: White pith ring inside rind
    pc.fillCircle(cx, cy, outerR - 2, p + 2);

    // Layer 3: Flesh circle inside pith
    pc.fillCircle(cx, cy, outerR - 4, f + 2);

    // Small lighter core at center
    pc.fillCircle(cx, cy, 2, p + 3);

    // Flesh texture — juice vesicle pattern
    const rng = sf2_seededRNG(77);
    pc.scatterNoise(cx - 12, cy - 12, 24, 24, f + 3, 0.06, rng);
    const rng2 = sf2_seededRNG(88);
    pc.scatterNoise(cx - 10, cy - 10, 20, 20, f + 1, 0.03, rng2);
  },

  drawPost(pc, pal) {
    const m = pal.groups.membrane.startIdx;
    const p = pal.groups.pith.startIdx;
    const cx = 20, cy = 20;
    const segR = 13; // radius of the segment area

    // Draw 10 white membrane lines radiating from center
    // Evenly spaced around 360 degrees
    const numSegments = 10;
    for (let i = 0; i < numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2;
      // Draw line from center to edge of flesh area
      for (let d = 2; d <= segR; d++) {
        const px = Math.round(cx + Math.cos(angle) * d);
        const py = Math.round(cy + Math.sin(angle) * d);
        pc.setPixel(px, py, m + 2);
        // Make lines slightly thicker near the edge
        if (d > 7) {
          const px2 = Math.round(cx + Math.cos(angle + 0.05) * d);
          const py2 = Math.round(cy + Math.sin(angle + 0.05) * d);
          pc.setPixel(px2, py2, m + 1);
        }
      }
    }

    // Slight dimple dots along each membrane for texture
    for (let i = 0; i < numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2;
      const midAngle = angle + (Math.PI / numSegments);
      // Small highlight dot in middle of each segment at ~60% radius
      const hx = Math.round(cx + Math.cos(midAngle) * 8);
      const hy = Math.round(cy + Math.sin(midAngle) * 8);
      const f = pal.groups.flesh.startIdx;
      pc.setPixel(hx, hy, f + 3);
    }

    // Reinforce center pith circle
    pc.fillCircle(cx, cy, 2, p + 2);
    pc.setPixel(cx, cy, p + 3);

    // Outer rind edge highlight — a few bright pixels on top-left
    const r = pal.groups.rind.startIdx;
    pc.setPixel(cx - 10, cy - 14, r + 3);
    pc.setPixel(cx - 12, cy - 11, r + 3);
    pc.setPixel(cx - 14, cy - 8, r + 3);
  },
};
