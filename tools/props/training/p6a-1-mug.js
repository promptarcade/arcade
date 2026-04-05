// Phase 6A, Exercise 1: Coffee Mug — SHADED (silhouette verified)
// Profile function from silhouette pass, now with full lighting.

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#cc6644',       // warm terracotta
    bodyshd: '#884433',    // cool shadow
    interior: '#442222',   // dark inside
    rim: '#ddaa77',        // bright rim edge
    handle: '#bb5533',     // handle (same material, slightly different angle)
    handleshd: '#773322',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const bs = pal.groups.bodyshd;
    const ig = pal.groups.interior;
    const rg = pal.groups.rim;
    const hg = pal.groups.handle;
    const hs = pal.groups.handleshd;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 40, bodyTop = 18, bodyBot = 80;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // VERIFIED PROFILE from silhouette pass
    function mugProfile(t) {
      const rimWidth = 25;
      const bodyWidth = 23;
      const baseWidth = 21;
      if (t < 0.03) return rimWidth;
      if (t < 0.08) return rimWidth - (t - 0.03) / 0.05 * 3;
      if (t < 0.85) {
        const bellyT = (t - 0.08) / 0.77;
        return bodyWidth + Math.sin(bellyT * Math.PI) * 1.5;
      }
      const baseT = (t - 0.85) / 0.15;
      return bodyWidth - baseT * (bodyWidth - baseWidth);
    }

    // BODY — cylinder with verified profile, now with Phase 1-2 lighting
    for (let y = bodyTop; y <= bodyBot; y++) {
      const t = (y - bodyTop) / (bodyBot - bodyTop);
      const halfW = Math.round(mugProfile(t));

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y >= 96) continue;

        // Cylinder normal
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const NdotL = nx * lx + nz * lz;
        const dot = Math.max(0, NdotL);

        // Ceramic — slight sheen (not as shiny as metal, not as matte as wood)
        const rrz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rrz), 25) * 0.2;

        const ambient = 0.06;
        const vertFade = t * 0.06;

        let v = ambient + dot * 0.6 + specular - vertFade;
        v = v * v * (3 - 2 * v);
        v = Math.max(0.04, Math.min(1, v));

        // Phase 3 colour temp: warm lit, cool shadow
        pc.setPixel(x, y, tone(v > 0.38 ? bg : bs, v));
      }
    }

    // Base foot — small ring at bottom
    for (let y = bodyBot; y <= bodyBot + 3; y++) {
      const baseW = 21;
      for (let dx = -baseW; dx <= baseW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y >= 96) continue;
        const nx = dx / (baseW + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        pc.setPixel(x, y, tone(bs, 0.1 + dot * 0.3));
      }
    }

    // INTERIOR — visible dark inside through rim ellipse
    const rimRX = 25, rimRY = 7;
    for (let y = bodyTop - rimRY + 2; y <= bodyTop + rimRY; y++) {
      for (let x = cx - rimRX + 2; x <= cx + rimRX - 2; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / (rimRX - 2), dy = (y - bodyTop) / rimRY;
        if (dx * dx + dy * dy > 0.92) continue;

        // Concave interior — dark
        const depth = 1 - Math.sqrt(dx * dx + dy * dy);
        pc.setPixel(x, y, tone(ig, 0.06 + depth * 0.15));
      }
    }

    // RIM — bright elliptical ring
    for (let y = bodyTop - rimRY; y <= bodyTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / (rimRX + 1), dy = (y - bodyTop) / rimRY;
        const outerD = dx * dx + dy * dy;
        const innerDx = dx * (rimRX + 1) / (rimRX - 2);
        const innerDy = dy * rimRY / (rimRY - 1.5);
        const innerD = innerDx * innerDx + innerDy * innerDy;

        if (outerD <= 1 && innerD >= 0.9) {
          const rimNX = dx * 0.5, rimNY = dy * 0.7;
          const rimNZ = Math.sqrt(Math.max(0.1, 1 - rimNX * rimNX - rimNY * rimNY));
          const rimDot = Math.max(0, lx * rimNX + ly * rimNY + lz * rimNZ);
          let rv = 0.2 + rimDot * 0.6;
          rv = rv * rv * (3 - 2 * rv);
          pc.setPixel(x, y, tone(rg, Math.max(0.1, rv)));
        }
      }
    }

    // HANDLE — D-shape with Phase 5 cylinder lighting
    const handleTopY = bodyTop + Math.round((bodyBot - bodyTop) * 0.2);
    const handleBotY = bodyTop + Math.round((bodyBot - bodyTop) * 0.75);
    const handleExtend = 18;
    const handleThickness = 5;

    for (let y = handleTopY; y <= handleBotY; y++) {
      const t = (y - handleTopY) / (handleBotY - handleTopY);
      const bodyEdge = cx + Math.round(mugProfile(0.2 + t * 0.55));
      const curve = Math.sin(t * Math.PI);
      const outerX = bodyEdge + Math.round(handleExtend * curve);
      const innerX = bodyEdge + Math.round((handleExtend - handleThickness) * curve);

      for (let x = innerX; x <= outerX; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;

        // Handle cross-section is a small circle — compute normal across it
        const handleMidX = (innerX + outerX) / 2;
        const crossFrac = (x - handleMidX) / ((outerX - innerX) / 2 + 1);
        const hnx = crossFrac * 0.7 + 0.3; // handle faces outward-right
        const hnz = Math.sqrt(Math.max(0.1, 1 - hnx * hnx));
        const hdot = Math.max(0, lx * hnx + lz * hnz);

        let hv = 0.08 + hdot * 0.55;
        hv = hv * hv * (3 - 2 * hv);
        pc.setPixel(x, y, tone(hv > 0.3 ? hg : hs, Math.max(0.04, hv)));
      }

      // Handle connection to body
      if (t < 0.06 || t > 0.94) {
        for (let x = bodyEdge; x <= bodyEdge + 5; x++) {
          if (x >= 0 && x < 96 && y >= 0 && y < 96) {
            pc.setPixel(x, y, tone(hg, 0.25));
          }
        }
      }
    }

    // Specular streak — vertical bright line on left side of body
    for (let y = bodyTop + 8; y < bodyBot - 8; y++) {
      const specX = cx - 12;
      if (specX >= 0 && specX + 1 < 96 && y >= 0 && y < 96) {
        pc.setPixel(specX, y, tone(bg, 0.72));
        pc.setPixel(specX + 1, y, tone(bg, 0.62));
      }
    }

    // Contact shadow
    for (let dx = -20; dx <= 20; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 96 && bodyBot + 4 < 96) {
        const d = Math.abs(dx) / 20;
        pc.setPixel(x, bodyBot + 4, tone(bs, 0.04 * (1 - d)));
      }
    }
  },
};
