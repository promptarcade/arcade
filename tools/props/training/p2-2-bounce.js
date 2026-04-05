// Phase 2, Exercise 2.2: Sphere on a bright surface with visible bounce light
// Training target: reflected/bounce light clearly illuminating the shadow side

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

    const cx = 64, cy = 52, r = 38;
    const lx = -0.55, ly = -0.65, lz = 0.52;

    // Bright ground plane — the brighter the ground, the more bounce light
    const groundY = cy + r + 4;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const d = (y - groundY) / (128 - groundY);
        // Bright surface — this is what creates the bounce
        pc.setPixel(x, y, tone(Math.max(0.1, 0.48 - d * 0.15)));
      }
    }

    // Cast shadow on ground
    const shCX = cx + 18, shCY = groundY + 3;
    for (let y = shCY - 9; y <= shCY + 9; y++) {
      for (let x = shCX - 35; x <= shCX + 35; x++) {
        if (x < 0 || x >= 128 || y < groundY || y >= 128) continue;
        const dx = (x - shCX) / 35, dy = (y - shCY) / 9;
        const d = dx * dx + dy * dy;
        if (d < 1) {
          const base = 0.48 - ((y - groundY) / (128 - groundY)) * 0.15;
          pc.setPixel(x, y, tone(Math.max(0.05, base * (1 - Math.pow(1 - d, 1.5) * 0.55))));
        }
      }
    }

    // Sphere with STRONG bounce light
    for (let y = cy - r - 1; y <= cy + r + 1; y++) {
      for (let x = cx - r - 1; x <= cx + r + 1; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > r * r) continue;

        const nx = dx / r, ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        // Direct light
        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const rz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rz), 50) * 0.6;

        const ambient = 0.03;

        // STRONG bounce light from bright ground — upward direction
        // Bounce light is strongest on bottom of sphere facing the ground
        const bounceDot = Math.max(0, ny * 0.5 + nx * 0.1); // mostly upward with slight rightward
        const bounce = bounceDot * 0.28; // strong enough to be clearly visible

        // Core shadow — now the core shadow sits BETWEEN direct light and bounce light
        // This is the key: bounce light lifts the shadow side, creating a visible core shadow band
        let core = 0;
        if (NdotL >= -0.08 && NdotL <= 0.18) {
          const t = Math.abs(NdotL - 0.04) / 0.13;
          core = Math.max(0, (1 - t * t)) * 0.1;
        }

        // Rim
        const rim = Math.pow(1 - nz, 4) * 0.06;

        let v = ambient + diffuse * 0.65 + specular + bounce + rim - core;
        v = Math.max(0, Math.min(1, v));
        v = v * v * (3 - 2 * v);

        if (x >= 0 && x < 128 && y >= 0 && y < 128) {
          pc.setPixel(x, y, tone(Math.max(0.02, v)));
        }
      }
    }

    // Contact shadow
    for (let x = cx - 14; x <= cx + 14; x++) {
      const dx = (x - cx) / 14;
      const w = 1 - dx * dx;
      if (groundY >= 0 && groundY < 128 && x >= 0 && x < 128) {
        pc.setPixel(x, groundY, tone(Math.max(0.02, 0.06 * (1 - w * 0.7))));
        if (groundY - 1 >= 0) pc.setPixel(x, groundY - 1, tone(0.1 * (1 - w * 0.4)));
      }
    }
  },
};
