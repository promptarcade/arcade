// Phase 6A.3: Cooking Pot — SHADED (silhouette verified: belly curve, wide rim, handles)

module.exports = {
  width: 128,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    copper: '#cc7744',
    coppershd: '#884422',
    interior: '#332222',
    rim: '#ddaa66',
    handle: '#888888',
    handleshd: '#555555',
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

    const cx = 64, potTop = 16, potBot = 82;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(42);

    // VERIFIED PROFILE from silhouette pass
    function potProfile(t) {
      const rimWidth = 46, bellyWidth = 48, baseWidth = 34;
      if (t < 0.03) return rimWidth;
      if (t < 0.08) return rimWidth - (t - 0.03) / 0.05 * 4;
      if (t < 0.15) return rimWidth - 4;
      if (t < 0.55) {
        const bellyT = (t - 0.15) / 0.4;
        return (rimWidth - 4) + Math.sin(bellyT * Math.PI) * (bellyWidth - rimWidth + 4);
      }
      if (t < 0.9) {
        const taperT = (t - 0.55) / 0.35;
        return bellyWidth - taperT * taperT * (bellyWidth - baseWidth);
      }
      return baseWidth;
    }

    // BODY — cylinder with verified profile + Phase 1-5 lighting
    for (let y = potTop; y <= potBot; y++) {
      const t = (y - potTop) / (potBot - potTop);
      const halfW = Math.round(potProfile(t));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 128 || y >= 96) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const NdotL = nx * lx + nz * lz;
        const dot = Math.max(0, NdotL);
        const rrz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rrz), 30) * 0.25;
        let v = 0.06 + dot * 0.58 + specular - t * 0.06;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.38 ? cg : cs, Math.max(0.04, v)));
      }
    }

    // Hammered copper texture
    for (let pass = 0; pass < 60; pass++) {
      const mx = cx + Math.round((rng() - 0.5) * 80);
      const my = potTop + 10 + Math.round(rng() * (potBot - potTop - 15));
      if (mx >= 0 && mx < 128 && my >= 0 && my < 96 && pc.isFilled(mx, my)) {
        pc.setPixel(mx, my, tone(cg, 0.48 + rng() * 0.1));
        if (my + 1 < 96) pc.setPixel(mx, my + 1, tone(cs, 0.28));
      }
    }

    // INTERIOR — visible through rim ellipse
    const rimRX = 46, rimRY = 10;
    for (let y = potTop - rimRY + 2; y <= potTop + rimRY + 2; y++) {
      for (let x = cx - rimRX + 3; x <= cx + rimRX - 3; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / (rimRX - 3), dy = (y - (potTop + 1)) / (rimRY + 1);
        if (dx * dx + dy * dy > 0.92) continue;
        const depth = 1 - Math.sqrt(dx * dx + dy * dy);
        pc.setPixel(x, y, tone(ig, 0.05 + depth * 0.12));
      }
    }

    // RIM — bright elliptical ring
    for (let y = potTop - rimRY; y <= potTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - potTop) / rimRY;
        const outerD = dx * dx + dy * dy;
        const innerDx = dx * (rimRX + 1) / (rimRX - 3);
        const innerDy = dy * rimRY / (rimRY - 1.5);
        if (outerD <= 1 && innerDx * innerDx + innerDy * innerDy >= 0.88) {
          const rimNX = dx * 0.5, rimNY = dy * 0.7;
          const rimNZ = Math.sqrt(Math.max(0.1, 1 - rimNX * rimNX - rimNY * rimNY));
          const rimDot = Math.max(0, lx * rimNX + ly * rimNY + lz * rimNZ);
          let rv = 0.15 + rimDot * 0.6 + Math.pow(Math.max(0, rimNZ), 40) * 0.2;
          rv = rv * rv * (3 - 2 * rv);
          pc.setPixel(x, y, tone(rg, Math.max(0.08, rv)));
        }
      }
    }

    // HANDLES
    for (const side of [-1, 1]) {
      const handleTopY = potTop + Math.round((potBot - potTop) * 0.15);
      const handleBotY = potTop + Math.round((potBot - potTop) * 0.5);
      const bodyEdgeAtMid = potProfile(0.3);

      for (let y = handleTopY; y <= handleBotY; y++) {
        const t = (y - handleTopY) / (handleBotY - handleTopY);
        const bodyEdge = cx + side * Math.round(potProfile((y - potTop) / (potBot - potTop)));
        const curve = Math.sin(t * Math.PI);
        const outerX = bodyEdge + Math.round(12 * curve) * side;
        const innerX = bodyEdge + Math.round(6 * curve) * side;
        const minX = Math.min(outerX, innerX), maxX = Math.max(outerX, innerX);

        for (let x = minX; x <= maxX; x++) {
          if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
          const crossFrac = (x - (minX + maxX) / 2) / ((maxX - minX) / 2 + 1);
          const hnx = crossFrac * 0.6 * side;
          const hnz = Math.sqrt(Math.max(0.1, 1 - hnx * hnx));
          const hdot = Math.max(0, lx * hnx + lz * hnz);
          let hv = 0.08 + hdot * 0.5;
          hv = hv * hv * (3 - 2 * hv);
          pc.setPixel(x, y, tone(hv > 0.3 ? hg : hs, Math.max(0.04, hv)));
        }

        if (t < 0.06 || t > 0.94) {
          const connMin = Math.min(bodyEdge, bodyEdge + side * 4);
          const connMax = Math.max(bodyEdge, bodyEdge + side * 4);
          for (let x = connMin; x <= connMax; x++) {
            if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, tone(hg, 0.25));
          }
        }
      }
    }

    // Specular streak on body
    for (let y = potTop + 10; y < potBot - 8; y++) {
      const t = (y - potTop) / (potBot - potTop);
      const specX = cx - Math.round(potProfile(t) * 0.38);
      if (specX >= 0 && specX + 2 < 128 && y >= 0 && y < 96) {
        pc.setPixel(specX, y, tone(cg, 0.7));
        pc.setPixel(specX + 1, y, tone(cg, 0.6));
      }
    }

    // Base shadow
    for (let dx = -34; dx <= 34; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 128 && potBot + 2 < 96) {
        pc.setPixel(x, potBot + 1, tone(cs, 0.05));
        pc.setPixel(x, potBot + 2, tone(cs, 0.03));
      }
    }
  },
};
