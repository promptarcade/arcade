// Phase 1, Exercise 1.4: Greyscale cone
// Training target: gradation on tapered form — light wraps differently at wide base vs narrow tip

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

    const cx = 60, tipY = 16, baseY = 96;
    const baseRX = 38, baseRY = 12;
    const lx = -0.55, ly = -0.65, lz = 0.52;

    // Ground
    const groundY = baseY + baseRY + 4;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        pc.setPixel(x, y, tone(Math.max(0.05, 0.26 - ((y - groundY) / (128 - groundY)) * 0.08)));
      }
    }

    // Cast shadow
    const shCX = cx + 18, shCY = groundY + 2;
    for (let y = shCY - 7; y <= shCY + 7; y++) {
      for (let x = shCX - 32; x <= shCX + 32; x++) {
        if (x < 0 || x >= 128 || y < groundY || y >= 128) continue;
        const dx = (x - shCX) / 32, dy = (y - shCY) / 7;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        pc.setPixel(x, y, tone(Math.max(0.02, 0.22 * (1 - Math.pow(1 - d, 1.5) * 0.5))));
      }
    }

    // Cone body
    for (let y = tipY; y <= baseY; y++) {
      const t = (y - tipY) / (baseY - tipY); // 0 at tip, 1 at base
      const rowR = t * baseRX; // radius at this height
      if (rowR < 0.5) {
        // Tip pixel
        pc.setPixel(cx, y, tone(0.45));
        continue;
      }

      for (let x = Math.round(cx - rowR); x <= Math.round(cx + rowR); x++) {
        const dx = x - cx;
        const xFrac = dx / rowR;
        if (Math.abs(xFrac) > 1) continue;

        // Cone surface normal: combination of horizontal (like cylinder) and upward tilt
        // The surface slopes inward toward the tip
        const slopeAngle = Math.atan2(baseRX, baseY - tipY); // angle of the side
        const horizontalNX = xFrac * Math.sin(slopeAngle);
        const verticalNY = -Math.cos(slopeAngle);
        const nz = Math.sqrt(Math.max(0, 1 - horizontalNX * horizontalNX - verticalNY * verticalNY));
        // Also factor in the circular cross-section
        const circNX = xFrac;
        const circNZ = Math.sqrt(Math.max(0, 1 - circNX * circNX));

        // Blend: the normal is mostly the circular cross-section direction
        // but tilted upward by the slope
        const nx = circNX * 0.8;
        const ny = verticalNY * 0.4;
        const finalNZ = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));

        const NdotL = nx * lx + ny * ly + finalNZ * lz;
        const diffuse = Math.max(0, NdotL);

        // Specular
        const r2x = 2 * NdotL * nx - lx;
        const r2z = 2 * NdotL * finalNZ - lz;
        const specular = Math.pow(Math.max(0, r2z), 50) * 0.45;

        const ambient = 0.04;

        // Core shadow
        let core = 0;
        if (NdotL >= -0.03 && NdotL <= 0.15) {
          core = (1 - Math.abs(NdotL - 0.05) / 0.1) * 0.06;
          core = Math.max(0, core);
        }

        // Reflected light on shadow side
        const reflected = nx > 0.3 ? (nx - 0.3) * 0.08 : 0;

        let value = ambient + diffuse * 0.68 + specular + reflected - core;
        value = Math.max(0, Math.min(1, value));
        value = value * value * (3 - 2 * value);
        value = Math.max(0.02, value);

        pc.setPixel(x, y, tone(value));
      }
    }

    // Base ellipse (bottom face, mostly in shadow since it faces down)
    for (let y = baseY - baseRY; y <= baseY + baseRY; y++) {
      for (let x = cx - baseRX; x <= cx + baseRX; x++) {
        const dx = (x - cx) / baseRX, dy = (y - baseY) / baseRY;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        // Only draw the visible lower rim (below the body)
        if (dy < 0) continue;
        // Faces downward — dark
        const edgeFade = Math.sqrt(d);
        pc.setPixel(x, y, tone(Math.max(0.03, 0.1 - edgeFade * 0.04)));
      }
    }

    // Contact shadow
    for (let x = cx - baseRX - 2; x <= cx + baseRX + 2; x++) {
      const dx = (x - cx) / baseRX;
      if (Math.abs(dx) > 1.05) continue;
      if (x >= 0 && x < 128 && groundY >= 0 && groundY < 128) {
        pc.setPixel(x, groundY, tone(0.04));
      }
    }
  },
};
