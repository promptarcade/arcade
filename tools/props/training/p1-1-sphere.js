// Phase 1, Exercise 1.1: Greyscale sphere, upper-left light
// Training target: form shadow, core shadow, reflected light, cast shadow, terminator
// ALL drawing in drawPost to bypass auto-shading (we want manual lighting control)

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    grey: '#888888',
  },

  draw(pc, pal) {
    // Minimal draw — just fill to prevent empty canvas
    // A single pixel so the engine doesn't skip processing
    pc.setPixel(0, 0, pal.groups.grey.startIdx);
  },

  drawPost(pc, pal) {
    const g = pal.groups.grey;
    function tone(frac) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1,
        Math.round(frac * (g.toneCount - 1))));
    }

    // Clear the dummy pixel
    pc.pixels[0] = 0;

    const cx = 58, cy = 52;
    const r = 40;
    const lx = -0.55, ly = -0.65, lz = 0.52;

    // Ground plane
    const groundY = cy + r + 4;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const distFromCenter = Math.abs(x - cx) / 64;
        const depth = (y - groundY) / (128 - groundY);
        pc.setPixel(x, y, tone(Math.max(0.05, 0.28 - depth * 0.1 - distFromCenter * 0.06)));
      }
    }

    // Cast shadow on ground
    const shadowCX = cx + 20;
    const shadowCY = groundY + 3;
    const shadowRX = 36, shadowRY = 10;
    for (let y = shadowCY - shadowRY; y <= shadowCY + shadowRY; y++) {
      for (let x = shadowCX - shadowRX; x <= shadowCX + shadowRX; x++) {
        if (x < 0 || x >= 128 || y < groundY || y >= 128) continue;
        const dx = (x - shadowCX) / shadowRX;
        const dy = (y - shadowCY) / shadowRY;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        const intensity = Math.pow(1 - d, 1.5) * 0.55;
        const base = 0.28 - ((y - groundY) / (128 - groundY)) * 0.1;
        pc.setPixel(x, y, tone(Math.max(0.02, base * (1 - intensity))));
      }
    }

    // Contact shadow
    for (let x = cx - 14; x <= cx + 14; x++) {
      const dx = (x - cx) / 14;
      const w = (1 - dx * dx);
      if (groundY >= 0 && groundY < 128 && x >= 0 && x < 128) {
        pc.setPixel(x, groundY, tone(Math.max(0.01, 0.05 * (1 - w * 0.8))));
        if (groundY - 1 >= 0) pc.setPixel(x, groundY - 1, tone(0.08 * (1 - w * 0.5)));
      }
    }

    // Sphere — full manual lighting
    for (let y = cy - r - 1; y <= cy + r + 1; y++) {
      for (let x = cx - r - 1; x <= cx + r + 1; x++) {
        const dx = x - cx, dy = y - cy;
        const dist2 = dx * dx + dy * dy;
        if (dist2 > r * r) continue;

        const nx = dx / r;
        const ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        // Lambert diffuse
        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);

        // Phong specular
        const rx = 2 * NdotL * nx - lx;
        const ry = 2 * NdotL * ny - ly;
        const rz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rz), 50) * 0.7;

        // Ambient
        const ambient = 0.03;

        // Reflected light from ground (upward bounce, strongest at bottom)
        const reflected = Math.max(0, ny * 0.4) * 0.15;

        // Core shadow — dark band at the terminator
        let coreShadow = 0;
        if (NdotL >= -0.05 && NdotL <= 0.2) {
          const tDist = Math.abs(NdotL - 0.05) / 0.15;
          coreShadow = (1 - tDist * tDist) * 0.08;
        }

        // Rim/Fresnel
        const rim = Math.pow(1 - nz, 4) * 0.06;

        let value = ambient + diffuse * 0.72 + specular + reflected + rim - coreShadow;

        // S-curve contrast boost
        value = Math.max(0, Math.min(1, value));
        value = value * value * (3 - 2 * value);
        value = Math.max(0.02, Math.min(1, value));

        pc.setPixel(x, y, tone(value));
      }
    }
  },
};
