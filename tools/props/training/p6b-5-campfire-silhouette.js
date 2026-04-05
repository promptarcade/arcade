// Phase 6B.5: Campfire — SILHOUETTE ONLY
// Organic compound: logs (crossed) + flames (rising) + stones (ring around base)
// No geometric perfection — natural arrangement

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;
    const cx = 48, groundY = 72;
    const rng = sf2_seededRNG(42);

    // STONE RING — irregular circle of rounded stones at ground level
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + (rng() - 0.5) * 0.3;
      const r = 30 + (rng() - 0.5) * 6;
      const sx = Math.round(cx + Math.cos(angle) * r);
      const sy = Math.round(groundY + Math.sin(angle) * r * 0.35); // perspective squash
      const stoneR = 5 + Math.round(rng() * 3);

      for (let dy = -stoneR; dy <= stoneR; dy++) {
        for (let dx = -stoneR; dx <= stoneR; dx++) {
          if (dx * dx + dy * dy <= stoneR * stoneR) {
            const px = sx + dx, py = sy + dy;
            if (px >= 0 && px < 96 && py >= 0 && py < 96) pc.setPixel(px, py, FLAT);
          }
        }
      }
    }

    // LOGS — two crossed logs in the middle
    // Log 1: angled left-to-right
    for (let along = -25; along <= 25; along++) {
      const lx = cx + along;
      const ly = groundY - 3 + Math.round(along * 0.15);
      for (let w = -4; w <= 4; w++) {
        const px = lx, py = ly + w;
        if (px >= 0 && px < 96 && py >= 0 && py < 96) pc.setPixel(px, py, FLAT);
      }
    }
    // Log 2: angled perpendicular
    for (let along = -20; along <= 20; along++) {
      const lx = cx + Math.round(along * 0.4);
      const ly = groundY - 6 + Math.round(along * -0.3);
      for (let w = -3; w <= 3; w++) {
        const px = lx + w, py = ly;
        if (px >= 0 && px < 96 && py >= 0 && py < 96) pc.setPixel(px, py, FLAT);
      }
    }

    // FLAMES — irregular shapes rising from logs
    // Main flame: tall, tapers to a point, slightly wavy
    for (let y = groundY - 8; y >= groundY - 45; y--) {
      const t = (groundY - 8 - y) / 37; // 0=base, 1=tip
      const halfW = Math.round(14 * (1 - t) * (1 - t * 0.3) + Math.sin(y * 0.3) * 3);
      if (halfW < 1) { pc.setPixel(cx, y, FLAT); continue; }
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx + Math.round(Math.sin(y * 0.15) * 2);
        if (x >= 0 && x < 96 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }
    }

    // Side flames — smaller, flanking main
    for (const offset of [-10, 8]) {
      for (let y = groundY - 6; y >= groundY - 28; y--) {
        const t = (groundY - 6 - y) / 22;
        const halfW = Math.round(6 * (1 - t) + Math.sin(y * 0.25 + offset) * 2);
        if (halfW < 1) continue;
        for (let dx = -halfW; dx <= halfW; dx++) {
          const x = cx + offset + dx + Math.round(Math.sin(y * 0.2) * 1.5);
          if (x >= 0 && x < 96 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
        }
      }
    }
  },
};
