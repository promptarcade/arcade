// Phase 6C.1: Cooking Pot REDUX — SHADED at game scale (128x128)
// Verified belly profile + copper material from 6A.3

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
    handle: '#888888',
    handleshd: '#555555',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.copper.startIdx); },

  drawPost(pc, pal) {
    const cg = pal.groups.copper, cs = pal.groups.coppershd;
    const ig = pal.groups.interior, rg = pal.groups.rim;
    const hg = pal.groups.handle, hs = pal.groups.handleshd;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 64, potTop = 22, potBot = 108;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(42);

    function potProfile(t) {
      const rimW = 50, bellyW = 54, baseW = 38;
      if (t < 0.03) return rimW;
      if (t < 0.08) return rimW - (t - 0.03) / 0.05 * 5;
      if (t < 0.15) return rimW - 5;
      if (t < 0.55) {
        const bt = (t - 0.15) / 0.4;
        return (rimW - 5) + Math.sin(bt * Math.PI) * (bellyW - rimW + 5);
      }
      if (t < 0.9) {
        const tt = (t - 0.55) / 0.35;
        return bellyW - tt * tt * (bellyW - baseW);
      }
      return baseW;
    }

    // Body
    for (let y = potTop; y <= potBot; y++) {
      const t = (y - potTop) / (potBot - potTop);
      const halfW = Math.round(potProfile(t));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 128 || y >= 128) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const NdotL = nx * lx + nz * lz;
        const dot = Math.max(0, NdotL);
        const spec = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 30) * 0.25;
        let v = 0.06 + dot * 0.58 + spec - t * 0.06;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.38 ? cg : cs, Math.max(0.04, v)));
      }
    }

    // Hammered texture
    for (let p = 0; p < 70; p++) {
      const mx = cx + Math.round((rng() - 0.5) * 90);
      const my = potTop + 12 + Math.round(rng() * (potBot - potTop - 18));
      if (mx >= 0 && mx < 128 && my < 128 && pc.isFilled(mx, my)) {
        pc.setPixel(mx, my, tone(cg, 0.48 + rng() * 0.1));
        if (my + 1 < 128) pc.setPixel(mx, my + 1, tone(cs, 0.28));
      }
    }

    // Interior
    const rimRX = 50, rimRY = 12;
    for (let y = potTop - rimRY + 2; y <= potTop + rimRY + 2; y++) {
      for (let x = cx - rimRX + 3; x <= cx + rimRX - 3; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;
        const dx = (x - cx) / (rimRX - 3), dy = (y - (potTop + 1)) / (rimRY + 1);
        if (dx * dx + dy * dy > 0.92) continue;
        pc.setPixel(x, y, tone(ig, 0.05 + (1 - Math.sqrt(dx * dx + dy * dy)) * 0.12));
      }
    }

    // Rim
    for (let y = potTop - rimRY; y <= potTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - potTop) / rimRY;
        const oD = dx * dx + dy * dy;
        const iDx = dx * (rimRX + 1) / (rimRX - 3), iDy = dy * rimRY / (rimRY - 1.5);
        if (oD <= 1 && iDx * iDx + iDy * iDy >= 0.88) {
          const rNX = dx * 0.5, rNY = dy * 0.7;
          const rNZ = Math.sqrt(Math.max(0.1, 1 - rNX * rNX - rNY * rNY));
          let rv = 0.15 + Math.max(0, lx * rNX + ly * rNY + lz * rNZ) * 0.6 + Math.pow(Math.max(0, rNZ), 40) * 0.2;
          rv = rv * rv * (3 - 2 * rv);
          pc.setPixel(x, y, tone(rg, Math.max(0.08, rv)));
        }
      }
    }

    // Handles
    for (const side of [-1, 1]) {
      const hTopY = potTop + Math.round((potBot - potTop) * 0.15);
      const hBotY = potTop + Math.round((potBot - potTop) * 0.5);
      for (let y = hTopY; y <= hBotY; y++) {
        const t = (y - hTopY) / (hBotY - hTopY);
        const bodyEdge = cx + side * Math.round(potProfile((y - potTop) / (potBot - potTop)));
        const curve = Math.sin(t * Math.PI);
        const outerX = bodyEdge + Math.round(14 * curve) * side;
        const innerX = bodyEdge + Math.round(7 * curve) * side;
        const minX = Math.min(outerX, innerX), maxX = Math.max(outerX, innerX);
        for (let x = minX; x <= maxX; x++) {
          if (x < 0 || x >= 128 || y >= 128) continue;
          const cf = (x - (minX + maxX) / 2) / ((maxX - minX) / 2 + 1);
          const hnx = cf * 0.6 * side, hnz = Math.sqrt(Math.max(0.1, 1 - hnx * hnx));
          let hv = 0.08 + Math.max(0, lx * hnx + lz * hnz) * 0.5;
          hv = hv * hv * (3 - 2 * hv);
          pc.setPixel(x, y, tone(hv > 0.3 ? hg : hs, Math.max(0.04, hv)));
        }
        if (t < 0.06 || t > 0.94) {
          for (let x = Math.min(bodyEdge, bodyEdge + side * 5); x <= Math.max(bodyEdge, bodyEdge + side * 5); x++) {
            if (x >= 0 && x < 128 && y < 128) pc.setPixel(x, y, tone(hg, 0.25));
          }
        }
      }
    }

    // Specular streak
    for (let y = potTop + 12; y < potBot - 10; y++) {
      const t = (y - potTop) / (potBot - potTop);
      const sx = cx - Math.round(potProfile(t) * 0.38);
      if (sx >= 0 && sx + 1 < 128 && y < 128) {
        pc.setPixel(sx, y, tone(cg, 0.7));
        pc.setPixel(sx + 1, y, tone(cg, 0.6));
      }
    }

    // Shadow
    for (let dx = -38; dx <= 38; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 128 && potBot + 2 < 128) {
        pc.setPixel(x, potBot + 1, tone(cs, 0.05));
        pc.setPixel(x, potBot + 2, tone(cs, 0.03));
      }
    }
  },
};
