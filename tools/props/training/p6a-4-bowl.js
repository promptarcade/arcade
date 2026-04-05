// Phase 6A.4: Soup Bowl — SHADED (silhouette verified: wide shallow concave curve)

module.exports = {
  width: 128,
  height: 64,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#eeeedd',
    bodyshd: '#bbaa99',
    interior: '#ddddcc',
    rim: '#ffffff',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const bs = pal.groups.bodyshd;
    const ig = pal.groups.interior;
    const rg = pal.groups.rim;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 64, bowlTop = 10, bowlBot = 50;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // VERIFIED PROFILE from silhouette
    function bowlProfile(t) {
      const rimWidth = 55, baseWidth = 22;
      if (t < 0.02) return rimWidth;
      const curveT = (t - 0.02) / 0.98;
      return Math.round(baseWidth + (rimWidth - baseWidth) * Math.cos(curveT * Math.PI * 0.48));
    }

    // BODY — curved sides with cylinder lighting
    for (let y = bowlTop; y <= bowlBot; y++) {
      const t = (y - bowlTop) / (bowlBot - bowlTop);
      const halfW = Math.round(bowlProfile(t));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 128 || y >= 64) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        const NdotL = nx * lx + nz * lz;
        const rrz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rrz), 35) * 0.18;
        let v = 0.18 + dot * 0.5 + specular - t * 0.06;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.48 ? bg : bs, Math.max(0.1, v)));
      }
    }

    // INTERIOR — concave, visible through rim
    const rimRX = 55, rimRY = 9;
    for (let y = bowlTop - rimRY + 2; y <= bowlTop + rimRY + 3; y++) {
      for (let x = cx - rimRX + 4; x <= cx + rimRX - 4; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 64) continue;
        const dx = (x - cx) / (rimRX - 4), dy = (y - (bowlTop + 1)) / (rimRY + 2);
        if (dx * dx + dy * dy > 0.93) continue;
        const inx = -dx * 0.35, iny = -dy * 0.45;
        const inz = Math.sqrt(Math.max(0.1, 1 - inx * inx - iny * iny));
        const iDot = Math.max(0, lx * inx + ly * iny + lz * inz);
        let iv = 0.22 + iDot * 0.4;
        iv = iv * iv * (3 - 2 * iv);
        pc.setPixel(x, y, tone(ig, Math.max(0.12, iv)));
      }
    }

    // RIM — bright ring
    for (let y = bowlTop - rimRY; y <= bowlTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 64) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - bowlTop) / rimRY;
        const outerD = dx * dx + dy * dy;
        const innerDx = dx * (rimRX + 1) / (rimRX - 3);
        const innerDy = dy * rimRY / (rimRY - 1.5);
        if (outerD <= 1 && innerDx * innerDx + innerDy * innerDy >= 0.9) {
          const rimNX = dx * 0.4, rimNY = dy * 0.6;
          const rimNZ = Math.sqrt(Math.max(0.1, 1 - rimNX * rimNX - rimNY * rimNY));
          const rimDot = Math.max(0, lx * rimNX + ly * rimNY + lz * rimNZ);
          let rv = 0.3 + rimDot * 0.5;
          rv = rv * rv * (3 - 2 * rv);
          pc.setPixel(x, y, tone(rg, Math.max(0.2, rv)));
        }
      }
    }

    // Base foot
    for (let y = bowlBot; y <= bowlBot + 3; y++) {
      for (let dx = -22; dx <= 22; dx++) {
        const x = cx + dx;
        if (x >= 0 && x < 128 && y >= 0 && y < 64) {
          const nx = dx / 23;
          const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
          const dot = Math.max(0, lx * nx + lz * nz);
          pc.setPixel(x, y, tone(bs, 0.12 + dot * 0.25));
        }
      }
    }

    // Specular on body — soft ceramic sheen
    for (let y = bowlTop + 6; y < bowlBot - 4; y++) {
      const t = (y - bowlTop) / (bowlBot - bowlTop);
      const halfW = bowlProfile(t);
      const specX = cx - Math.round(halfW * 0.35);
      if (specX >= 0 && specX + 1 < 128 && y >= 0 && y < 64) {
        pc.setPixel(specX, y, tone(bg, 0.82));
        pc.setPixel(specX + 1, y, tone(bg, 0.72));
      }
    }

    // Contact shadow
    for (let dx = -22; dx <= 22; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 128 && bowlBot + 4 < 64) {
        pc.setPixel(x, bowlBot + 4, tone(bs, 0.06 * (1 - Math.abs(dx) / 22)));
      }
    }
  },
};
