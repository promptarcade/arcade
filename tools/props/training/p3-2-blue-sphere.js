// Phase 3, Exercise 3.2: Sphere in cool blue — opposite temperature shifts
// Shadows shift toward warm purple, highlights shift toward cool cyan-white

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cool: '#2255aa',      // cool blue for lit areas
    warm: '#443366',      // warm purple-blue for shadow areas
    highlight: '#bbddff', // cool highlight (shifts toward cyan)
    ground: '#667788',    // cool neutral ground
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.cool.startIdx); },

  drawPost(pc, pal) {
    const cg = pal.groups.cool;
    const wg = pal.groups.warm;
    const hg = pal.groups.highlight;
    const gg = pal.groups.ground;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 58, cy = 52, r = 40;
    const lx = -0.55, ly = -0.65, lz = 0.52;

    const groundY = cy + r + 4;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        pc.setPixel(x, y, tone(gg, Math.max(0.1, 0.5 - ((y - groundY) / (128 - groundY)) * 0.15)));
      }
    }

    // Cast shadow — shifts warmer than ground
    const shCX = cx + 18, shCY = groundY + 3;
    for (let y = shCY - 9; y <= shCY + 9; y++) {
      for (let x = shCX - 35; x <= shCX + 35; x++) {
        if (x < 0 || x >= 128 || y < groundY || y >= 128) continue;
        const dx = (x - shCX) / 35, dy = (y - shCY) / 9;
        const d = dx * dx + dy * dy;
        if (d < 1) {
          pc.setPixel(x, y, tone(gg, Math.max(0.05, 0.4 * (1 - Math.pow(1 - d, 1.5) * 0.5))));
        }
      }
    }

    for (let x = cx - 14; x <= cx + 14; x++) {
      const dx = (x - cx) / 14;
      if (Math.abs(dx) < 1 && groundY < 128 && x >= 0 && x < 128) {
        pc.setPixel(x, groundY, tone(wg, 0.05));
      }
    }

    // Sphere — cool object: lit = bright blue, shadow = warm purple
    for (let y = cy - r - 1; y <= cy + r + 1; y++) {
      for (let x = cx - r - 1; x <= cx + r + 1; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > r * r) continue;

        const nx = dx / r, ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const rr = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rr), 50) * 0.7;

        const ambient = 0.03;
        const bounce = Math.max(0, ny * 0.35) * 0.15;

        let core = 0;
        if (NdotL >= -0.03 && NdotL <= 0.18) {
          core = Math.max(0, 1 - Math.abs(NdotL - 0.06) / 0.12) * 0.08;
        }

        let value = ambient + diffuse * 0.7 + bounce + Math.pow(1 - nz, 4) * 0.06 - core;
        value = Math.max(0, Math.min(1, value));
        value = value * value * (3 - 2 * value);

        if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;

        if (specular > 0.1) {
          // Specular — coolest: shifts toward cyan-white
          pc.setPixel(x, y, tone(hg, Math.min(1, 0.5 + specular)));
        } else if (value > 0.4) {
          // Lit — cool blue
          pc.setPixel(x, y, tone(cg, value));
        } else if (value > 0.15) {
          const mixT = (value - 0.15) / 0.25;
          if (mixT > 0.5) {
            pc.setPixel(x, y, tone(cg, value * 0.9));
          } else {
            pc.setPixel(x, y, tone(wg, value * 1.2 + 0.1));
          }
        } else {
          // Shadow — warm purple-blue
          pc.setPixel(x, y, tone(wg, Math.max(0.05, value * 1.5 + bounce * 2)));
        }
      }
    }
  },
};
