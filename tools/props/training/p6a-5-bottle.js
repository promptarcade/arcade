// Phase 6A.5: Bottle — SHADED (silhouette verified: neck/shoulder/body/base)

module.exports = {
  width: 64,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    glass: '#336644',
    glassshd: '#1a3322',
    highlight: '#88ccaa',
    label: '#ddccaa',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.glass.startIdx); },

  drawPost(pc, pal) {
    const gg = pal.groups.glass;
    const gs = pal.groups.glassshd;
    const hg = pal.groups.highlight;
    const lg = pal.groups.label;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 32, top = 4, bot = 88;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // VERIFIED PROFILE
    function bottleProfile(t) {
      if (t < 0.03) return 6;
      if (t < 0.30) return 5;
      if (t < 0.42) {
        const s = (t - 0.30) / 0.12;
        const eased = s * s * (3 - 2 * s);
        return Math.round(5 + (22 - 5) * eased);
      }
      if (t < 0.88) return Math.round(22 - ((t - 0.42) / 0.46) * (22 - 20) * 0.3);
      return Math.round(22 - (22 - 20) * (0.3 + ((t - 0.88) / 0.12) * 0.7));
    }

    // Body — glass material (Phase 5 technique: Fresnel transparency)
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / (bot - top);
      const halfW = Math.round(bottleProfile(t));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 64 || y >= 96) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));

        // Fresnel: edges more opaque, centre more transparent
        const fresnel = Math.pow(1 - nz, 2) * 0.5 + 0.2;
        const NdotL = nx * lx + nz * lz;
        const dot = Math.max(0, NdotL);
        const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 50) * 0.4;

        let v = fresnel * 0.5 + dot * 0.35 + specular;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.4 ? gg : gs, Math.max(0.04, v)));
      }
    }

    // Left edge bright reflection streak (glass catches light on edge)
    for (let y = top + 3; y < bot - 3; y++) {
      const t = (y - top) / (bot - top);
      const halfW = bottleProfile(t);
      if (halfW < 3) continue;
      const hx = cx - halfW + 2;
      if (hx >= 0 && hx + 1 < 64 && y < 96) {
        pc.setPixel(hx, y, tone(hg, 0.6));
        pc.setPixel(hx + 1, y, tone(gg, 0.5));
      }
    }

    // Right edge darker
    for (let y = top + 3; y < bot - 3; y++) {
      const t = (y - top) / (bot - top);
      const halfW = bottleProfile(t);
      if (halfW < 3) continue;
      const hx = cx + halfW - 1;
      if (hx >= 0 && hx < 64 && y < 96) {
        pc.setPixel(hx, y, tone(gs, 0.18));
      }
    }

    // Label area — lighter rectangle on the body
    const labelTop = top + Math.round((bot - top) * 0.52);
    const labelBot = top + Math.round((bot - top) * 0.72);
    for (let y = labelTop; y <= labelBot; y++) {
      const t = (y - top) / (bot - top);
      const halfW = bottleProfile(t);
      const labelHW = Math.round(halfW * 0.75);
      for (let dx = -labelHW; dx <= labelHW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 64 || y >= 96) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        let lv = 0.2 + dot * 0.55;
        lv = lv * lv * (3 - 2 * lv);
        pc.setPixel(x, y, tone(lg, Math.max(0.1, lv)));
      }
    }

    // Mouth ellipse
    for (let y = top - 2; y <= top + 2; y++) {
      for (let x = cx - 6; x <= cx + 6; x++) {
        if (x < 0 || x >= 64 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / 6, dy = (y - top) / 2;
        if (dx * dx + dy * dy <= 1) {
          pc.setPixel(x, y, tone(gs, 0.08 + (1 - Math.sqrt(dx * dx + dy * dy)) * 0.1));
        }
      }
    }

    // Specular dot on shoulder
    const specY = top + Math.round((bot - top) * 0.35);
    pc.setPixel(cx - 8, specY, tone(hg, 0.95));
    pc.setPixel(cx - 7, specY, tone(hg, 0.8));
    pc.setPixel(cx - 8, specY + 1, tone(hg, 0.7));

    // Base shadow
    for (let dx = -20; dx <= 20; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 64 && bot + 2 < 96) {
        pc.setPixel(x, bot + 1, tone(gs, 0.04));
        pc.setPixel(x, bot + 2, tone(gs, 0.02));
      }
    }
  },
};
