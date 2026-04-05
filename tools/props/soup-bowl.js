// Soup Shop — Serving Bowl (128x96, HD tier)
// White ceramic bowl, viewed slightly from above. Clean, simple, smooth.

module.exports = {
  width: 128,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#eeeedd',
    bodyshd: '#bbaa99',
    interior: '#ddddcc',
    shadow: '#998877',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const bs = pal.groups.bodyshd;
    const ig = pal.groups.interior;
    const sg = pal.groups.shadow;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 64, bowlTop = 18, bowlBot = 78;
    const bowlRX = 52, rimRY = 12;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // Bowl body — rounded sides, wider at top than bottom
    for (let y = bowlTop + rimRY; y <= bowlBot; y++) {
      const t = (y - bowlTop - rimRY) / (bowlBot - bowlTop - rimRY);
      // Bowl profile: wide at rim, curves inward toward base
      const halfW = Math.round(bowlRX * (1 - t * t * 0.4));

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 128 || y >= 96) continue;

        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);

        // Ceramic — smooth, slight sheen
        const NdotL = nx * lx + nz * lz;
        const rrz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rrz), 40) * 0.2;

        let v = 0.15 + dot * 0.55 + specular;
        v -= t * 0.08;
        v = v * v * (3 - 2 * v);
        v = Math.max(0.08, Math.min(1, v));

        pc.setPixel(x, y, tone(v > 0.45 ? bg : bs, v));
      }
    }

    // Interior — visible inside, darker than exterior (concave, less light)
    for (let y = bowlTop - rimRY + 3; y <= bowlTop + rimRY + 5; y++) {
      for (let x = cx - bowlRX + 5; x <= cx + bowlRX - 5; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / (bowlRX - 5), dy = (y - (bowlTop + 2)) / (rimRY + 3);
        if (dx * dx + dy * dy > 1) continue;

        // Concave interior — dark at edges, slightly lighter at centre
        const inx = -dx * 0.4, iny = -dy * 0.5;
        const inz = Math.sqrt(Math.max(0.1, 1 - inx * inx - iny * iny));
        const iDot = Math.max(0, lx * inx + ly * iny + lz * inz);
        let iv = 0.2 + iDot * 0.4;
        iv = iv * iv * (3 - 2 * iv);
        pc.setPixel(x, y, tone(ig, Math.max(0.1, iv)));
      }
    }

    // Rim — bright elliptical ring
    for (let y = bowlTop - rimRY; y <= bowlTop + rimRY; y++) {
      for (let x = cx - bowlRX - 1; x <= cx + bowlRX + 1; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / (bowlRX + 1), dy = (y - bowlTop) / rimRY;
        const outerD = dx * dx + dy * dy;
        const innerDx = dx * (bowlRX + 1) / (bowlRX - 4);
        const innerDy = dy * rimRY / (rimRY - 2);
        const innerD = innerDx * innerDx + innerDy * innerDy;

        if (outerD <= 1 && innerD >= 0.88) {
          const rimNX = dx * 0.5;
          const rimNY = dy * 0.7;
          const rimNZ = Math.sqrt(Math.max(0.1, 1 - rimNX * rimNX - rimNY * rimNY));
          const rimDot = Math.max(0, lx * rimNX + ly * rimNY + lz * rimNZ);
          let rv = 0.25 + rimDot * 0.55;
          rv = rv * rv * (3 - 2 * rv);
          pc.setPixel(x, y, tone(bg, Math.max(0.15, rv)));
        }
      }
    }

    // Base shadow — contact area at bottom
    const baseY = bowlBot;
    for (let x = cx - 30; x <= cx + 30; x++) {
      if (x >= 0 && x < 128 && baseY + 1 < 96) {
        const d = Math.abs(x - cx) / 30;
        pc.setPixel(x, baseY + 1, tone(sg, 0.08 * (1 - d)));
        pc.setPixel(x, baseY + 2, tone(sg, 0.04 * (1 - d)));
      }
    }

    // Specular highlight — soft, on the upper-left of the bowl body
    for (let y = bowlTop + rimRY + 3; y < bowlTop + rimRY + 18; y++) {
      const specX = cx - Math.round(bowlRX * 0.35);
      if (specX >= 0 && specX + 2 < 128 && y >= 0 && y < 96) {
        pc.setPixel(specX, y, tone(bg, 0.85));
        pc.setPixel(specX + 1, y, tone(bg, 0.78));
      }
    }
  },
};
