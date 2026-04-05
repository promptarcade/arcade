// Soup Shop — Bell Pepper (96x96, HD tier)
// Red bell shape, shiny smooth skin, green stem. Very glossy surface.

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#dd4444',
    bodyshd: '#882233',
    stem: '#449933',
    highlight: '#ff9977',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const bs = pal.groups.bodyshd;
    const sg = pal.groups.stem;
    const hg = pal.groups.highlight;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, cy = 52;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(99);

    // Bell pepper shape — wider at top, 3-4 lobes, tapers to bottom point
    for (let y = 18; y <= 88; y++) {
      const t = (y - 18) / 70; // 0=top, 1=bottom
      let halfW;
      if (t < 0.08) {
        // Narrow shoulder near stem
        halfW = Math.round(12 + t / 0.08 * 22);
      } else if (t < 0.5) {
        // Widest — bulging lobes
        halfW = Math.round(34 + Math.sin((t - 0.08) / 0.42 * Math.PI * 0.5) * 4);
      } else if (t < 0.85) {
        // Tapering
        const u = (t - 0.5) / 0.35;
        halfW = Math.round(38 - u * u * 20);
      } else {
        // Bottom point
        const u = (t - 0.85) / 0.15;
        halfW = Math.round(18 * (1 - u));
      }
      if (halfW < 1) continue;

      // Lobe profile — 3 bumps across the width
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;

        const xFrac = dx / (halfW + 1);
        // Lobe bumps — 3 lobes create a bumpy cross-section
        const lobeBump = Math.sin(xFrac * Math.PI * 3) * 0.12;

        // Normal with lobe perturbation
        const nx = xFrac * 0.8 + Math.cos(xFrac * Math.PI * 3) * 0.15;
        const ny = (t - 0.35) * 0.5;
        const nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));

        const NdotL = nx * lx + ny * ly + nz * lz;
        const dot = Math.max(0, NdotL);

        // Bell pepper is VERY shiny — high specular
        const rrz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rrz), 45) * 0.5;

        const ambient = 0.05;
        const bounce = Math.max(0, ny * 0.25) * 0.08;

        let v = ambient + dot * 0.6 + specular + bounce + lobeBump;

        // Groove lines between lobes — dark vertical creases
        const lobePhase = xFrac * 3;
        const nearGroove = Math.abs(lobePhase - Math.round(lobePhase)) < 0.08;
        if (nearGroove && t > 0.1 && t < 0.9) v *= 0.65;

        v = v * v * (3 - 2 * v);
        v = Math.max(0.03, Math.min(1, v));

        if (specular > 0.12) {
          pc.setPixel(x, y, tone(hg, Math.min(1, 0.4 + specular)));
        } else {
          pc.setPixel(x, y, tone(v > 0.35 ? bg : bs, v));
        }
      }
    }

    // Stem — short green cylinder at top
    for (let y = 8; y <= 20; y++) {
      const t = (y - 8) / 12;
      const halfW = Math.round(4 + t * 2);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + ly * (-0.5) + lz * nz);
        let v = 0.1 + dot * 0.6;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(sg, Math.max(0.05, v)));
      }
    }

    // Main specular — large, bright, upper-left (pepper is very glossy)
    const specCX = cx - 12, specCY = 35;
    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy) / 6;
        const px = specCX + dx, py = specCY + dy;
        if (d < 1 && px >= 0 && px < 96 && py >= 0 && py < 96 && pc.isFilled(px, py)) {
          pc.setPixel(px, py, tone(hg, 0.6 + (1 - d) * 0.4));
        }
      }
    }

    // Secondary specular — smaller, on another lobe
    const spec2CX = cx + 10, spec2CY = 40;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy) / 3;
        const px = spec2CX + dx, py = spec2CY + dy;
        if (d < 1 && px >= 0 && px < 96 && py >= 0 && py < 96 && pc.isFilled(px, py)) {
          pc.setPixel(px, py, tone(hg, 0.45 + (1 - d) * 0.3));
        }
      }
    }
  },
};
