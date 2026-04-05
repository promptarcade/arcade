// Phase 5, Exercise 5.1: Metal sphere — hard specular, reflected environment, smooth gradient
module.exports = {
  width: 96,
  height: 96,
  style: 'illustrated',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    metal: '#888899',      // cool steel
    metalwarm: '#aaaaaa',  // warm highlight
    env: '#445566',        // reflected environment (dark sky/ground)
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.metal.startIdx); },

  drawPost(pc, pal) {
    const mg = pal.groups.metal;
    const mwg = pal.groups.metalwarm;
    const eg = pal.groups.env;
    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, cy = 42, r = 34;
    const lx = -0.55, ly = -0.65, lz = 0.52;

    // Ground
    const groundY = cy + r + 4;
    for (let y = groundY; y < 96; y++) {
      for (let x = 0; x < 96; x++) {
        pc.setPixel(x, y, tone(eg, Math.max(0.08, 0.35 - ((y - groundY) / (96 - groundY)) * 0.1)));
      }
    }

    // Cast shadow
    for (let y = groundY; y < groundY + 8; y++) {
      for (let x = cx + 5; x < cx + 40; x++) {
        if (x >= 96 || y >= 96) continue;
        const dx = (x - (cx + 18)) / 20, dy = (y - (groundY + 3)) / 5;
        if (dx * dx + dy * dy < 1) {
          pc.setPixel(x, y, tone(eg, Math.max(0.03, 0.3 * (0.5 + (dx * dx + dy * dy) * 0.5))));
        }
      }
    }

    // Metal sphere — key difference from matte: much tighter specular, environment reflection,
    // sharper value transitions (less gradual than lambertian)
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > r * r) continue;
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;

        const nx = dx / r, ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        const NdotL = nx * lx + ny * ly + nz * lz;

        // Metal has high reflectivity — reflects environment
        // Upper half reflects sky (lighter), lower half reflects ground (darker)
        const envReflect = ny < 0 ? 0.35 + (-ny) * 0.2 : 0.2 - ny * 0.15;

        // Diffuse is weaker on metal (it's mostly reflection)
        const diffuse = Math.max(0, NdotL) * 0.3;

        // Specular is MUCH harder and brighter on metal — Phong exponent very high
        const rr = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rr), 120) * 0.95;

        // Fresnel — metal edges are brighter (more reflective at glancing angles)
        const fresnel = Math.pow(1 - nz, 3) * 0.2;

        // Sharp core shadow — metal makes the terminator very defined
        let core = 0;
        if (NdotL >= -0.01 && NdotL <= 0.1) {
          core = Math.max(0, 1 - Math.abs(NdotL - 0.04) / 0.06) * 0.12;
        }

        let v = envReflect + diffuse + fresnel - core;
        // S-curve with more extreme contrast — metal has sharper transitions
        v = Math.max(0, Math.min(1, v));
        const s = v * v * v * (v * (v * 6 - 15) + 10); // quintic S-curve — sharper
        v = s;

        // Choose palette: warm for bright areas, cool for mid/dark
        if (specular > 0.05) {
          pc.setPixel(x, y, tone(mwg, Math.min(1, 0.6 + specular * 0.4)));
        } else if (v > 0.45) {
          pc.setPixel(x, y, tone(mwg, v));
        } else {
          pc.setPixel(x, y, tone(mg, Math.max(0.03, v * 1.3)));
        }
      }
    }

    // Very sharp specular highlight — metal specular is a tiny bright point
    const specX = cx - Math.round(r * 0.28);
    const specY = cy - Math.round(r * 0.32);
    pc.setPixel(specX, specY, tone(mwg, 1.0));
    pc.setPixel(specX + 1, specY, tone(mwg, 0.95));
    pc.setPixel(specX, specY + 1, tone(mwg, 0.9));

    // Ground reflection — subtle bright band at bottom where ground reflects onto sphere
    for (let x = cx - r + 4; x <= cx + r - 4; x++) {
      const y = cy + r - 3;
      if (x >= 0 && x < 96 && y >= 0 && y < 96) {
        const dx = (x - cx) / r;
        const reflBright = (1 - dx * dx) * 0.15;
        pc.setPixel(x, y, tone(mg, Math.max(0.1, 0.25 + reflBright)));
      }
    }

    // Contact shadow
    for (let x = cx - 10; x <= cx + 10; x++) {
      if (x >= 0 && x < 96 && groundY < 96) {
        pc.setPixel(x, groundY, tone(eg, 0.03));
      }
    }
  },
};
