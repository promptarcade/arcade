// Pineapple Slice — 40x40 cross-section
// Circle: brown spiky rind ring, golden-yellow flesh,
// concentric lighter ring pattern, darker core circle in center

module.exports = {
  width: 40,
  height: 40,
  colors: {
    rind: '#8b6914',
    flesh: '#f0c030',
    ring: '#f8dd70',
    core: '#aa8822',
  },

  draw(pc, pal) {
    const r = pal.groups.rind.startIdx;
    const f = pal.groups.flesh.startIdx;
    const cx = 20, cy = 20;
    const outerR = 17;

    // Layer 1: Brown rind — full circle
    pc.fillCircle(cx, cy, outerR, r + 2);

    // Spiky texture on rind edge — small triangular bumps
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const bx = Math.round(cx + Math.cos(angle) * (outerR + 1));
      const by = Math.round(cy + Math.sin(angle) * (outerR + 1));
      pc.setPixel(bx, by, r + 1);
      // Alternating darker bumps
      if (i % 2 === 0) {
        const bx2 = Math.round(cx + Math.cos(angle) * (outerR + 2));
        const by2 = Math.round(cy + Math.sin(angle) * (outerR + 2));
        pc.setPixel(bx2, by2, r + 0);
      }
    }

    // Rind detail — darker inner edge
    for (let a = 0; a < Math.PI * 2; a += 0.12) {
      const ex = Math.round(cx + Math.cos(a) * outerR);
      const ey = Math.round(cy + Math.sin(a) * outerR);
      pc.setPixel(ex, ey, r + 0);
      const ex2 = Math.round(cx + Math.cos(a) * (outerR - 1));
      const ey2 = Math.round(cy + Math.sin(a) * (outerR - 1));
      pc.setPixel(ex2, ey2, r + 1);
    }

    // Rind texture — scaly pattern
    const rng = sf2_seededRNG(99);
    pc.scatterNoise(cx - outerR, cy - outerR, outerR * 2, outerR * 2, r + 0, 0.05, rng);

    // Layer 2: Golden flesh interior
    pc.fillCircle(cx, cy, outerR - 3, f + 2);

    // Flesh highlight — brighter upper area
    pc.fillCircle(cx - 2, cy - 2, outerR - 6, f + 3);

    // Flesh texture — fibrous
    const rng2 = sf2_seededRNG(111);
    pc.scatterNoise(cx - 12, cy - 12, 24, 24, f + 1, 0.04, rng2);
  },

  drawPost(pc, pal) {
    const rg = pal.groups.ring.startIdx;
    const c = pal.groups.core.startIdx;
    const f = pal.groups.flesh.startIdx;
    const cx = 20, cy = 20;

    // Concentric ring pattern — lighter bands visible in flesh
    // Ring at radius ~6
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      const rx = Math.round(cx + Math.cos(a) * 6);
      const ry = Math.round(cy + Math.sin(a) * 6);
      pc.setPixel(rx, ry, rg + 2);
    }
    // Ring at radius ~10
    for (let a = 0; a < Math.PI * 2; a += 0.08) {
      const rx = Math.round(cx + Math.cos(a) * 10);
      const ry = Math.round(cy + Math.sin(a) * 10);
      pc.setPixel(rx, ry, rg + 2);
      // Slightly thicker
      const rx2 = Math.round(cx + Math.cos(a) * 9);
      const ry2 = Math.round(cy + Math.sin(a) * 9);
      pc.setPixel(rx2, ry2, rg + 1);
    }

    // "Eye" pattern — small dots arranged in a spiral/radial pattern
    // These are the remnants of the pineapple's scales visible in cross-section
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      // Dots at radius ~8
      const dx = Math.round(cx + Math.cos(angle) * 8);
      const dy = Math.round(cy + Math.sin(angle) * 8);
      pc.setPixel(dx, dy, f + 0);
    }
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.3;
      // Dots at radius ~12
      const dx = Math.round(cx + Math.cos(angle) * 12);
      const dy = Math.round(cy + Math.sin(angle) * 12);
      pc.setPixel(dx, dy, f + 0);
    }

    // Dark core circle in center
    pc.fillCircle(cx, cy, 3, c + 2);
    pc.fillCircle(cx, cy, 2, c + 1);
    pc.setPixel(cx, cy, c + 0);
    // Core edge highlight
    pc.setPixel(cx - 1, cy - 2, c + 3);
    pc.setPixel(cx + 1, cy - 2, c + 3);
  },
};
