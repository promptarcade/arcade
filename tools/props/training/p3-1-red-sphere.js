// Phase 3, Exercise 3.1: Sphere in warm red — shadows shift cool, highlights shift warm
// Training target: map greyscale value structure to colour with proper temperature shifts

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    warm: '#cc3322',    // warm red for lit areas
    cool: '#662244',    // cool purple-red for shadow areas
    highlight: '#ffddbb', // warm highlight (shifts toward orange/yellow)
    ground: '#887766',  // neutral warm ground
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.warm.startIdx); },

  drawPost(pc, pal) {
    const wg = pal.groups.warm;
    const cg = pal.groups.cool;
    const hg = pal.groups.highlight;
    const gg = pal.groups.ground;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 58, cy = 52, r = 40;
    const lx = -0.55, ly = -0.65, lz = 0.52;

    // Ground — neutral warm
    const groundY = cy + r + 4;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const d = (y - groundY) / (128 - groundY);
        pc.setPixel(x, y, tone(gg, Math.max(0.1, 0.5 - d * 0.15)));
      }
    }

    // Cast shadow on ground — cooler than ground
    const shCX = cx + 18, shCY = groundY + 3;
    for (let y = shCY - 9; y <= shCY + 9; y++) {
      for (let x = shCX - 35; x <= shCX + 35; x++) {
        if (x < 0 || x >= 128 || y < groundY || y >= 128) continue;
        const dx = (x - shCX) / 35, dy = (y - shCY) / 9;
        const d = dx * dx + dy * dy;
        if (d < 1) {
          const intensity = Math.pow(1 - d, 1.5) * 0.5;
          pc.setPixel(x, y, tone(gg, Math.max(0.05, 0.45 * (1 - intensity))));
        }
      }
    }

    // Contact shadow
    for (let x = cx - 14; x <= cx + 14; x++) {
      const dx = (x - cx) / 14;
      if (Math.abs(dx) < 1 && groundY < 128 && x >= 0 && x < 128) {
        pc.setPixel(x, groundY, tone(cg, 0.05));
      }
    }

    // Sphere — the key exercise: colour temperature shift across the form
    for (let y = cy - r - 1; y <= cy + r + 1; y++) {
      for (let x = cx - r - 1; x <= cx + r + 1; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > r * r) continue;

        const nx = dx / r, ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);

        // Phong specular
        const rr = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rr), 50) * 0.7;

        const ambient = 0.03;
        const bounce = Math.max(0, ny * 0.35) * 0.15;

        let core = 0;
        if (NdotL >= -0.03 && NdotL <= 0.18) {
          core = Math.max(0, 1 - Math.abs(NdotL - 0.06) / 0.12) * 0.08;
        }

        const rim = Math.pow(1 - nz, 4) * 0.06;

        // Compute value (same as greyscale)
        let value = ambient + diffuse * 0.7 + bounce + rim - core;
        value = Math.max(0, Math.min(1, value));
        value = value * value * (3 - 2 * value);

        // COLOUR DECISION: which palette based on light/shadow
        // Lit areas → warm palette (red-orange)
        // Shadow areas → cool palette (purple-red)
        // The crossover happens at the terminator
        if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;

        if (specular > 0.1) {
          // Specular highlight — warmest: shifts toward yellow/orange
          pc.setPixel(x, y, tone(hg, Math.min(1, 0.5 + specular)));
        } else if (value > 0.4) {
          // Lit side — warm red
          pc.setPixel(x, y, tone(wg, value));
        } else if (value > 0.15) {
          // Transition zone — mix
          const mixT = (value - 0.15) / 0.25; // 0 = full cool, 1 = full warm
          if (mixT > 0.5) {
            pc.setPixel(x, y, tone(wg, value * 0.9));
          } else {
            pc.setPixel(x, y, tone(cg, value * 1.2 + 0.1));
          }
        } else {
          // Shadow side — cool purple-red
          pc.setPixel(x, y, tone(cg, Math.max(0.05, value * 1.5 + bounce * 2)));
        }
      }
    }
  },
};
