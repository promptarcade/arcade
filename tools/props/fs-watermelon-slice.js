// Watermelon Slice — 48x48 cross-section
// Semicircle: green rind (3px), white pith (2px), pink-red flesh, black teardrop seeds

module.exports = {
  width: 48,
  height: 48,
  colors: {
    rind: '#2ecc40',
    pith: '#e8e8d0',
    flesh: '#ff4466',
    seed: '#1a1a1a',
  },

  draw(pc, pal) {
    const r = pal.groups.rind.startIdx;
    const p = pal.groups.pith.startIdx;
    const f = pal.groups.flesh.startIdx;
    const cx = 24, cy = 26;
    const outerR = 20;

    // Build semicircle from top (flat edge) down
    // Flat cut face is at the top, rind curves on the bottom

    // Draw full semicircle in layers from outside in
    // Layer 1: Green rind (outer 3px)
    for (let row = 0; row <= outerR; row++) {
      const y = cy + row;
      if (y >= 48) break;
      const halfW = Math.round(Math.sqrt(outerR * outerR - row * row));
      if (halfW > 0) {
        pc.hline(cx - halfW, y, halfW * 2 + 1, r + 2);
      }
    }
    // Also fill the flat top edge with rind (thin line)
    pc.hline(cx - outerR, cy, outerR * 2 + 1, r + 2);

    // Rind highlight on outer edge
    for (let row = outerR - 2; row <= outerR; row++) {
      const y = cy + row;
      if (y >= 48) break;
      const halfW = Math.round(Math.sqrt(outerR * outerR - row * row));
      if (halfW > 0) {
        pc.hline(cx - halfW, y, halfW * 2 + 1, r + 1);
      }
    }
    // Darker rind at very bottom curve
    for (let row = outerR - 1; row <= outerR; row++) {
      const y = cy + row;
      if (y >= 48) break;
      const halfW = Math.round(Math.sqrt(outerR * outerR - row * row));
      if (halfW > 0 && halfW <= 8) {
        pc.hline(cx - halfW, y, halfW * 2 + 1, r + 0);
      }
    }

    // Rind stripes — darker bands on the green
    for (let row = 2; row <= outerR; row++) {
      const y = cy + row;
      if (y >= 48) break;
      const halfW = Math.round(Math.sqrt(outerR * outerR - row * row));
      // Two vertical stripe bands
      if (halfW >= 8) {
        pc.setPixel(cx - 8, y, r + 0);
        pc.setPixel(cx + 8, y, r + 0);
      }
      if (halfW >= 14) {
        pc.setPixel(cx - 14, y, r + 1);
        pc.setPixel(cx + 14, y, r + 1);
      }
    }

    // Layer 2: White pith ring (next 2px inward)
    const pithR = outerR - 3;
    for (let row = 0; row <= pithR; row++) {
      const y = cy + row;
      const halfW = Math.round(Math.sqrt(pithR * pithR - row * row));
      if (halfW > 0) {
        pc.hline(cx - halfW, y, halfW * 2 + 1, p + 2);
      }
    }
    // Pith along flat top too
    pc.hline(cx - pithR, cy, pithR * 2 + 1, p + 2);

    // Layer 3: Red flesh interior
    const fleshR = outerR - 5;
    for (let row = 0; row <= fleshR; row++) {
      const y = cy + row;
      const halfW = Math.round(Math.sqrt(fleshR * fleshR - row * row));
      if (halfW > 0) {
        pc.hline(cx - halfW, y, halfW * 2 + 1, f + 2);
      }
    }
    // Fill flat top area with flesh too
    pc.hline(cx - fleshR, cy, fleshR * 2 + 1, f + 2);

    // Flesh gradient — lighter pink near center, darker near edges
    const innerR = fleshR - 4;
    for (let row = 0; row <= innerR; row++) {
      const y = cy + row;
      const halfW = Math.round(Math.sqrt(innerR * innerR - row * row));
      if (halfW > 0) {
        pc.hline(cx - halfW, y, halfW * 2 + 1, f + 3);
      }
    }

    // Subtle flesh texture
    const rng = sf2_seededRNG(42);
    pc.scatterNoise(cx - fleshR, cy, fleshR * 2, fleshR, f + 1, 0.04, rng);
  },

  drawPost(pc, pal) {
    const s = pal.groups.seed.startIdx;
    const cx = 24, cy = 26;

    // Teardrop seeds scattered in the flesh zone — 9 seeds
    // Each seed is a 2x3 teardrop: wider at top, point at bottom
    const seeds = [
      [cx - 10, cy + 4],
      [cx - 6, cy + 2],
      [cx - 3, cy + 7],
      [cx + 1, cy + 3],
      [cx + 5, cy + 6],
      [cx + 9, cy + 3],
      [cx - 8, cy + 9],
      [cx + 3, cy + 10],
      [cx + 7, cy + 9],
    ];
    for (const [sx, sy] of seeds) {
      // Teardrop: 2 wide at top, 1 at bottom
      pc.setPixel(sx, sy, s + 1);
      pc.setPixel(sx + 1, sy, s + 1);
      pc.setPixel(sx, sy + 1, s + 2);
      pc.setPixel(sx + 1, sy + 1, s + 2);
      pc.setPixel(sx, sy + 2, s + 1);
    }

    // Flat-face edge highlight along the top cut line
    const f = pal.groups.flesh.startIdx;
    pc.hline(cx - 14, cy, 29, f + 3);
  },
};
