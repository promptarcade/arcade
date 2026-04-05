// Phase 6A.6: Frying Pan — SHADED (silhouette verified: wide disc + long handle)

module.exports = {
  width: 128,
  height: 64,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    metal: '#444455',
    metalshd: '#222233',
    interior: '#333344',
    handle: '#886644',
    handleshd: '#553322',
    highlight: '#aabbcc',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.metal.startIdx); },

  drawPost(pc, pal) {
    const mg = pal.groups.metal;
    const ms = pal.groups.metalshd;
    const ig = pal.groups.interior;
    const hg = pal.groups.handle;
    const hs = pal.groups.handleshd;
    const hlg = pal.groups.highlight;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 44, cy = 28;
    const panRX = 34, panRY = 18;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // PAN BODY — elliptical disc viewed from above-angle
    // Interior (cooking surface) — dark, slightly roughened
    for (let y = cy - panRY; y <= cy + panRY; y++) {
      for (let x = cx - panRX; x <= cx + panRX; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 64) continue;
        const dx = (x - cx) / panRX, dy = (y - cy) / panRY;
        if (dx * dx + dy * dy > 1) continue;

        // Interior is a concave disc
        const inx = -dx * 0.3, iny = -dy * 0.4;
        const inz = Math.sqrt(Math.max(0.1, 1 - inx * inx - iny * iny));
        const iDot = Math.max(0, lx * inx + ly * iny + lz * inz);
        let iv = 0.08 + iDot * 0.3;
        iv = iv * iv * (3 - 2 * iv);
        pc.setPixel(x, y, tone(ig, Math.max(0.04, iv)));
      }
    }

    // RIM — bright metal ring around the edge
    for (let y = cy - panRY - 2; y <= cy + panRY + 2; y++) {
      for (let x = cx - panRX - 2; x <= cx + panRX + 2; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 64) continue;
        const dx = (x - cx) / (panRX + 2), dy = (y - cy) / (panRY + 2);
        const outerD = dx * dx + dy * dy;
        const innerDx = dx * (panRX + 2) / panRX;
        const innerDy = dy * (panRY + 2) / panRY;
        const innerD = innerDx * innerDx + innerDy * innerDy;

        if (outerD <= 1 && innerD >= 0.92) {
          const rimNX = dx * 0.6, rimNY = dy * 0.7;
          const rimNZ = Math.sqrt(Math.max(0.1, 1 - rimNX * rimNX - rimNY * rimNY));
          const rimDot = Math.max(0, lx * rimNX + ly * rimNY + lz * rimNZ);
          const rimSpec = Math.pow(Math.max(0, rimNZ), 30) * 0.2;
          let rv = 0.1 + rimDot * 0.5 + rimSpec;
          rv = rv * rv * (3 - 2 * rv);
          pc.setPixel(x, y, tone(mg, Math.max(0.06, rv)));
        }
      }
    }

    // SIDE visible below rim (front-facing depth of pan)
    const panDepth = 6;
    for (let y = cy + panRY; y <= cy + panRY + panDepth; y++) {
      const sideT = (y - cy - panRY) / panDepth;
      const halfW = Math.round((panRX + 1) * (1 - sideT * 0.05));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 128 || y >= 64) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + nz * lz);
        let v = 0.06 + dot * 0.4;
        v -= sideT * 0.08;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.25 ? mg : ms, Math.max(0.03, v)));
      }
    }

    // HANDLE — long wooden handle extending right
    const handleAttachX = cx + panRX - 2;
    const handleLen = 42;
    const handleW = 4;
    const handleY = cy;

    for (let along = 0; along < handleLen; along++) {
      const t = along / handleLen;
      let w = handleW;
      if (t < 0.08) w = handleW + 2; // wide attachment
      else if (t > 0.88) w = handleW + 1; // grip end

      for (let dy = -w; dy <= w; dy++) {
        const x = handleAttachX + along;
        const y = handleY + dy;
        if (x < 0 || x >= 128 || y < 0 || y >= 64) continue;

        // Handle is a cylinder lying on its side
        const ny = dy / (w + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - ny * ny));
        const dot = Math.max(0, ly * ny + lz * nz);
        let hv = 0.1 + dot * 0.55;
        hv = hv * hv * (3 - 2 * hv);
        pc.setPixel(x, y, tone(hv > 0.35 ? hg : hs, Math.max(0.05, hv)));
      }
    }

    // Handle rivet
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (dx * dx + dy * dy > 4) continue;
        const x = handleAttachX + 5 + dx, y = handleY + dy;
        if (x >= 0 && x < 128 && y >= 0 && y < 64) {
          const d = Math.sqrt(dx * dx + dy * dy) / 2;
          pc.setPixel(x, y, tone(mg, 0.3 + (1 - d) * 0.25));
        }
      }
    }

    // Specular on rim — metal sheen
    for (let a = -60; a < 60; a++) {
      const rad = (a - 90) * Math.PI / 180;
      const sx = Math.round(cx + (panRX + 1) * Math.cos(rad));
      const sy = Math.round(cy + (panRY + 1) * Math.sin(rad));
      if (sx >= 0 && sx < 128 && sy >= 0 && sy < 64) {
        pc.setPixel(sx, sy, tone(hlg, 0.5 + Math.cos(a * Math.PI / 120) * 0.3));
      }
    }

    // Contact shadow
    for (let dx = -panRX; dx <= panRX; dx++) {
      const x = cx + dx;
      const shadowY = cy + panRY + panDepth + 2;
      if (x >= 0 && x < 128 && shadowY < 64) {
        pc.setPixel(x, shadowY, tone(ms, 0.04 * (1 - Math.abs(dx) / panRX)));
      }
    }
  },
};
