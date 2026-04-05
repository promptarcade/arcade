// Phase 3: Cooking pot — shaded, using the approved silhouette profile
// Applying lessons: cylinder lighting, bump texture, dispersed light, single palette per material

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

    function tone(group, f) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(f * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const W = 128, H = 96;
    const cx = 64;
    const potTop = 18, potBot = 80;
    const potH = potBot - potTop;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // Approved profile
    const rimW = 44, bodyW = 43, baseW = 34;
    function potProfile(t) {
      if (t < 0.05) return rimW;
      if (t < 0.12) return rimW - (t - 0.05) / 0.07 * (rimW - bodyW);
      if (t < 0.80) {
        const mid = (t - 0.12) / 0.68;
        return bodyW + Math.sin(mid * Math.PI) * 2.5;
      }
      const bt = (t - 0.80) / 0.20;
      const ease = bt * bt * (3 - 2 * bt);
      return bodyW - ease * (bodyW - baseW);
    }

    // --- HANDLES — short horizontal loops near rim ---
    for (const side of [-1, 1]) {
      const hCenterY = potTop + Math.round(potH * 0.18); // near the top
      const hHalfH = 6; // short — only 12px tall
      const bodyEdgeMid = Math.round(potProfile(0.18));

      for (let y = hCenterY - hHalfH; y <= hCenterY + hHalfH; y++) {
        if (y < 0 || y >= H) continue;
        const ht = (y - hCenterY) / hHalfH; // -1 to 1
        const bulge = Math.sqrt(Math.max(0, 1 - ht * ht)); // semicircle
        const bodyEdge = cx + side * Math.round(potProfile((y - potTop) / potH));

        const outerDist = Math.round(12 * bulge);
        const innerDist = Math.round(5 * bulge);
        const outerX = bodyEdge + outerDist * side;
        const innerX = bodyEdge + innerDist * side;
        const minX = Math.min(outerX, innerX), maxX = Math.max(outerX, innerX);
        const handleW = maxX - minX;

        for (let x = minX; x <= maxX; x++) {
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          // Cross-section lighting
          const crossT = handleW > 0 ? (x - minX) / handleW : 0.5;
          const hnx = (crossT - 0.5) * 2 * side * 0.6;
          const hny = ht * 0.3;
          const hnz = Math.sqrt(Math.max(0.1, 1 - hnx * hnx - hny * hny));
          const hdot = Math.max(0, lx * hnx + ly * hny + lz * hnz);
          let hv = 0.12 + hdot * 0.52 + Math.pow(hdot, 25) * 0.12;
          hv = hv * hv * (3 - 2 * hv) * 0.8 + hv * 0.2;
          pc.setPixel(x, y, tone(hv > 0.3 ? hg : hs, Math.max(0.04, hv)));
        }
      }
    }

    // --- POT BODY — cylinder lighting with bump ---
    for (let y = potTop; y <= potBot; y++) {
      const t = (y - potTop) / potH;
      const halfW = Math.round(potProfile(t));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;

        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));

        // Bump: horizontal streaks + fine grain
        const streak = Math.sin(y * 0.7 + nx * 2.5) * 0.03;
        const grain = (((x * 13397 + y * 7919) & 0xFFFF) / 65536 - 0.5) * 0.04;
        const bnx = nx + streak + grain;
        const bnz = Math.sqrt(Math.max(0.05, 1 - Math.min(0.95, bnx * bnx)));

        const NdotL = bnx * lx + bnz * lz;
        const dot = Math.max(0, NdotL);
        const specular = Math.pow(dot, 35) * 0.2;

        let v = 0.14 + dot * 0.54 + specular;
        v = v * v * (3 - 2 * v) * 0.8 + v * 0.2;
        v -= t * 0.03;
        v = Math.max(0.04, v);

        pc.setPixel(x, y, tone(v > 0.35 ? cg : cs, v));
      }
    }

    // --- INTERIOR ---
    const rimRX = 44, rimRY = 10;
    for (let y = potTop - rimRY + 2; y <= potTop + rimRY + 2; y++) {
      for (let x = cx - rimRX + 3; x <= cx + rimRX - 3; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const dx = (x - cx) / (rimRX - 3), dy = (y - (potTop + 1)) / (rimRY + 1);
        if (dx * dx + dy * dy > 0.92) continue;
        const depth = 1 - Math.sqrt(dx * dx + dy * dy);
        pc.setPixel(x, y, tone(ig, 0.04 + depth * 0.1));
      }
    }

    // --- RIM — torus lighting ---
    for (let y = potTop - rimRY; y <= potTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - potTop) / rimRY;
        const outerD = dx * dx + dy * dy;
        const innerDx = dx * (rimRX + 1) / (rimRX - 3);
        const innerDy = dy * rimRY / (rimRY - 1.5);
        if (outerD <= 1 && innerDx * innerDx + innerDy * innerDy >= 0.88) {
          const rnx = dx * 0.5, rny = dy * 0.7;
          const rnz = Math.sqrt(Math.max(0.1, 1 - rnx * rnx - rny * rny));
          const rdot = Math.max(0, lx * rnx + ly * rny + lz * rnz);
          let rv = 0.14 + rdot * 0.58 + Math.pow(rdot, 30) * 0.2;
          rv = rv * rv * (3 - 2 * rv);
          pc.setPixel(x, y, tone(rg, Math.max(0.06, rv)));
        }
      }
    }

    // --- SPECULAR STREAK ---
    for (let y = potTop + 8; y < potBot - 6; y++) {
      const t = (y - potTop) / potH;
      const specX = cx - Math.round(potProfile(t) * 0.38);
      if (specX >= 0 && specX + 1 < W && y >= 0 && y < H) {
        if (pc.isFilled(specX, y)) pc.setPixel(specX, y, tone(cg, 0.72));
        if (pc.isFilled(specX + 1, y)) pc.setPixel(specX + 1, y, tone(cg, 0.6));
      }
    }

    // --- BASE SHADOW ---
    for (let dx = -baseW; dx <= baseW; dx++) {
      const x = cx + dx;
      const w = 1 - (dx / baseW) * (dx / baseW);
      if (x >= 0 && x < W) {
        if (potBot + 1 < H) pc.setPixel(x, potBot + 1, tone(cs, Math.max(0.02, 0.06 * w)));
        if (potBot + 2 < H) pc.setPixel(x, potBot + 2, tone(cs, Math.max(0.01, 0.03 * w)));
      }
    }
  },
};
