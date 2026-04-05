// Phase 1, Exercise 1.6: Organic form — rock/boulder in greyscale
// Training target: applying form principles to irregular shapes. No geometric perfection.

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { grey: '#888888' },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.grey.startIdx); },

  drawPost(pc, pal) {
    const g = pal.groups.grey;
    function tone(frac) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1,
        Math.round(frac * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 62, cy = 58;
    const lx = -0.55, ly = -0.65, lz = 0.52;
    const rng = sf2_seededRNG(42);

    // Ground
    const groundY = 100;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        pc.setPixel(x, y, tone(Math.max(0.05, 0.24 - ((y - groundY) / (128 - groundY)) * 0.06)));
      }
    }

    // Cast shadow
    for (let y = groundY; y < groundY + 10; y++) {
      for (let x = cx - 10; x < cx + 50; x++) {
        if (x < 0 || x >= 128 || y >= 128) continue;
        const dx = (x - (cx + 20)) / 30, dy = (y - (groundY + 3)) / 7;
        const d = dx * dx + dy * dy;
        if (d < 1) {
          pc.setPixel(x, y, tone(Math.max(0.02, 0.2 * (0.5 + d * 0.5))));
        }
      }
    }

    // Rock — irregular shape built from perturbed sphere
    // Pre-compute the rock shape as a height field with bumps
    const rockRX = 42, rockRY = 36;
    const bumps = [];
    for (let i = 0; i < 8; i++) {
      bumps.push({
        angle: rng() * Math.PI * 2,
        radius: 0.5 + rng() * 0.5,
        amplitude: 0.06 + rng() * 0.12,
        frequency: 2 + rng() * 3,
      });
    }

    // Cracks — store as line segments
    const cracks = [];
    for (let c = 0; c < 4; c++) {
      const startAngle = rng() * Math.PI * 2;
      const startR = 0.1 + rng() * 0.3;
      const endR = startR + 0.2 + rng() * 0.4;
      const drift = (rng() - 0.5) * 0.3;
      cracks.push({ startAngle, startR, endR, drift });
    }

    for (let y = cy - rockRY - 5; y <= cy + rockRY + 5; y++) {
      for (let x = cx - rockRX - 5; x <= cx + rockRX + 5; x++) {
        const dx = (x - cx) / rockRX;
        const dy = (y - cy) / rockRY;

        // Irregular boundary — perturb the ellipse with bumps
        let radiusMod = 1;
        const angle = Math.atan2(dy, dx);
        for (const bump of bumps) {
          const angleDiff = angle - bump.angle;
          radiusMod += bump.amplitude * Math.cos(angleDiff * bump.frequency);
        }

        // Flattened bottom (wider at base like a real rock)
        if (dy > 0) {
          radiusMod += dy * 0.15;
        }

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radiusMod) continue;

        // Surface normal — treat as perturbed sphere
        // Base sphere normal
        let nx = dx / radiusMod;
        let ny = (dy / radiusMod) * 0.85; // flatten the top
        let nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));

        // Add bump perturbation to the normal
        for (const bump of bumps) {
          const angleDiff = angle - bump.angle;
          const perturbStrength = bump.amplitude * 0.5;
          nx += Math.cos(bump.angle) * Math.sin(angleDiff * bump.frequency) * perturbStrength;
          ny += Math.sin(bump.angle) * Math.sin(angleDiff * bump.frequency) * perturbStrength;
        }
        // Re-normalize
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len; ny /= len; nz /= len;

        // Diffuse
        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);

        // Specular (rock is matte — weak specular)
        const r2z = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, r2z), 20) * 0.15;

        const ambient = 0.05;
        const reflected = Math.max(0, ny * 0.3) * 0.08;

        // Core shadow
        let core = 0;
        if (NdotL >= -0.02 && NdotL <= 0.15) {
          core = Math.max(0, 1 - Math.abs(NdotL - 0.05) / 0.1) * 0.06;
        }

        // Surface roughness — random per-pixel noise
        const roughness = (rng() - 0.5) * 0.05;

        let value = ambient + diffuse * 0.65 + specular + reflected - core + roughness;

        // Crack darkening — check if near any crack line
        for (const crack of cracks) {
          const crackAngle = crack.startAngle + dist / radiusMod * crack.drift;
          const crackDist = Math.abs(angle - crackAngle);
          const normalizedDist = dist / radiusMod;
          if (crackDist < 0.04 && normalizedDist > crack.startR && normalizedDist < crack.endR) {
            value -= 0.15;
          } else if (crackDist < 0.08 && normalizedDist > crack.startR && normalizedDist < crack.endR) {
            value -= 0.05; // soft edge of crack
          }
        }

        value = Math.max(0, Math.min(1, value));
        value = value * value * (3 - 2 * value);
        value = Math.max(0.02, value);

        if (x >= 0 && x < 128 && y >= 0 && y < 128) {
          pc.setPixel(x, y, tone(value));
        }
      }
    }

    // Contact shadow
    for (let x = cx - rockRX; x <= cx + rockRX; x++) {
      const dx = (x - cx) / rockRX;
      if (Math.abs(dx) > 1) continue;
      if (x >= 0 && x < 128 && groundY >= 0 && groundY < 128) {
        pc.setPixel(x, groundY, tone(0.03));
        if (groundY - 1 >= 0) pc.setPixel(x, groundY - 1, tone(0.06));
      }
    }
  },
};
