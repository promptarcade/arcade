// Soup Shop — Cooking Pot (128x128, HD tier)
// Large copper pot on a burner. Handles on sides. Viewed slightly from above
// so we see inside the rim. This is the central game element.

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    copper: '#cc7744',
    coppershd: '#884422',
    interior: '#332222',
    rim: '#ddaa66',
    handle: '#777777',
    handleshd: '#444444',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.copper.startIdx); },

  drawPost(pc, pal) {
    const cg = pal.groups.copper;
    const cs = pal.groups.coppershd;
    const ig = pal.groups.interior;
    const rg = pal.groups.rim;
    const hg = pal.groups.handle;
    const hs = pal.groups.handleshd;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 64, potTop = 20, potBot = 105;
    const potRX = 50, rimRY = 10;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(42);

    // POT BODY — cylinder, slightly wider at top (pot flares out)
    for (let y = potTop + rimRY; y <= potBot; y++) {
      const t = (y - potTop - rimRY) / (potBot - potTop - rimRY);
      // Slight taper: wider at rim, narrower at base
      const halfW = Math.round(potRX * (1 - t * 0.12));

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 128 || y >= 128) continue;

        // Cylinder normal
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const NdotL = nx * lx + nz * lz;
        const dot = Math.max(0, NdotL);

        // Copper is semi-reflective — moderate specular
        const rrz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rrz), 30) * 0.3;

        const ambient = 0.06;
        // Slight vertical darkening toward bottom (less light reaches base)
        const vertFade = t * 0.08;

        let v = ambient + dot * 0.6 + specular - vertFade;
        v = v * v * (3 - 2 * v);
        v = Math.max(0.03, Math.min(1, v));

        pc.setPixel(x, y, tone(v > 0.38 ? cg : cs, v));
      }
    }

    // Copper surface texture — subtle hammered marks
    for (let pass = 0; pass < 80; pass++) {
      const mx = cx + Math.round((rng() - 0.5) * potRX * 1.6);
      const my = potTop + rimRY + 5 + Math.round(rng() * (potBot - potTop - rimRY - 10));
      if (mx >= 0 && mx < 128 && my >= 0 && my < 128 && pc.isFilled(mx, my)) {
        // Small dimple: slightly brighter centre
        pc.setPixel(mx, my, tone(cg, 0.5 + rng() * 0.12));
        if (mx + 1 < 128) pc.setPixel(mx + 1, my, tone(cg, 0.45));
        if (my + 1 < 128) pc.setPixel(mx, my + 1, tone(cs, 0.3));
      }
    }

    // DARK INTERIOR — visible inside the pot (above rim inner ellipse)
    for (let y = potTop - rimRY + 4; y <= potTop + rimRY + 4; y++) {
      for (let x = cx - potRX + 4; x <= cx + potRX - 4; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;
        const dx = (x - cx) / (potRX - 4), dy = (y - (potTop + 2)) / (rimRY + 2);
        if (dx * dx + dy * dy > 1) continue;
        // Interior is dark — looking down into the pot
        const depth = 1 - Math.sqrt(dx * dx + dy * dy);
        pc.setPixel(x, y, tone(ig, 0.05 + depth * 0.12));
      }
    }

    // RIM — bright metal ring at the top of the pot
    // Outer rim ellipse
    for (let y = potTop - rimRY; y <= potTop + rimRY; y++) {
      for (let x = cx - potRX - 2; x <= cx + potRX + 2; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;
        const dx = (x - cx) / (potRX + 2), dy = (y - potTop) / rimRY;
        const outerD = dx * dx + dy * dy;
        const innerD = (dx * potRX / (potRX - 4)) * (dx * potRX / (potRX - 4)) + (dy * rimRY / (rimRY - 2)) * (dy * rimRY / (rimRY - 2));

        if (outerD <= 1 && innerD >= 0.85) {
          // Rim surface — bright, metallic
          const rimNX = dx * 0.6;
          const rimNY = dy * 0.8;
          const rimNZ = Math.sqrt(Math.max(0.1, 1 - rimNX * rimNX - rimNY * rimNY));
          const rimDot = Math.max(0, lx * rimNX + ly * rimNY + lz * rimNZ);
          const rimSpec = Math.pow(Math.max(0, rimNZ), 40) * 0.25;
          let rv = 0.15 + rimDot * 0.6 + rimSpec;
          rv = rv * rv * (3 - 2 * rv);
          pc.setPixel(x, y, tone(rg, Math.max(0.08, rv)));
        }
      }
    }

    // HANDLES — two small loops on left and right sides
    for (const side of [-1, 1]) {
      const handleCX = cx + side * (potRX + 8);
      const handleCY = potTop + rimRY + 20;

      // Handle is a small rounded rectangle/loop
      for (let dy = -10; dy <= 10; dy++) {
        for (let dx = 0; dx < 8; dx++) {
          const hx = handleCX + dx * side;
          const hy = handleCY + dy;
          if (hx < 0 || hx >= 128 || hy < 0 || hy >= 128) continue;

          // Rounded ends
          const d = (dx * dx) / 16 + (dy * dy) / 100;
          if (d > 1) continue;

          // Metal handle shading
          const hnx = dx / 8 * side * 0.6;
          const hnz = Math.sqrt(Math.max(0.1, 1 - hnx * hnx));
          const hdot = Math.max(0, lx * hnx + lz * hnz);
          let hv = 0.1 + hdot * 0.55;
          hv = hv * hv * (3 - 2 * hv);
          pc.setPixel(hx, hy, tone(hv > 0.3 ? hg : hs, Math.max(0.05, hv)));
        }
      }

      // Handle attachment rivets — small bright dots where handle meets pot
      const rivetY1 = handleCY - 8, rivetY2 = handleCY + 8;
      const rivetX = cx + side * potRX;
      for (const ry of [rivetY1, rivetY2]) {
        if (rivetX >= 0 && rivetX < 128 && ry >= 0 && ry < 128) {
          pc.setPixel(rivetX, ry, tone(rg, 0.6));
          if (rivetX + side >= 0 && rivetX + side < 128) {
            pc.setPixel(rivetX + side, ry, tone(rg, 0.45));
          }
        }
      }
    }

    // Bottom edge — dark shadow under pot
    for (let x = cx - potRX + 6; x <= cx + potRX - 6; x++) {
      if (x >= 0 && x < 128 && potBot + 1 < 128) {
        pc.setPixel(x, potBot, tone(cs, 0.06));
        pc.setPixel(x, potBot + 1, tone(cs, 0.03));
      }
    }

    // Specular highlight band — vertical bright streak on left side of pot
    for (let y = potTop + rimRY + 5; y < potBot - 5; y++) {
      const t = (y - potTop - rimRY) / (potBot - potTop - rimRY);
      const specX = cx - Math.round(potRX * 0.4);
      if (specX >= 0 && specX + 1 < 128 && y >= 0 && y < 128) {
        pc.setPixel(specX, y, tone(cg, 0.7 + (1 - t) * 0.15));
        pc.setPixel(specX + 1, y, tone(cg, 0.6 + (1 - t) * 0.1));
        pc.setPixel(specX + 2, y, tone(cg, 0.5));
      }
    }
  },
};
