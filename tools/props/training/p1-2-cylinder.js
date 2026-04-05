// Phase 1, Exercise 1.2: Greyscale cylinder, side light
// Training target: light wrapping around a curved surface, top/bottom plane contrast

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

    const cx = 60, topY = 22, botY = 92;
    const rx = 34, ry = 12; // ellipse radii for top/bottom faces
    const lx = -0.6, ly = -0.5, lz = 0.62;

    // Ground
    const groundY = botY + ry + 4;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const d = (y - groundY) / (128 - groundY);
        pc.setPixel(x, y, tone(Math.max(0.05, 0.26 - d * 0.08)));
      }
    }

    // Cast shadow
    const shCX = cx + 22, shCY = groundY + 2;
    for (let y = shCY - 8; y <= shCY + 8; y++) {
      for (let x = shCX - 38; x <= shCX + 38; x++) {
        if (x < 0 || x >= 128 || y < groundY || y >= 128) continue;
        const dx = (x - shCX) / 38, dy = (y - shCY) / 8;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        const base = 0.26 - ((y - groundY) / (128 - groundY)) * 0.08;
        pc.setPixel(x, y, tone(Math.max(0.02, base * (1 - Math.pow(1 - d, 1.5) * 0.5))));
      }
    }

    // Contact shadow
    for (let x = cx - rx - 2; x <= cx + rx + 2; x++) {
      const dx = (x - cx) / rx;
      if (Math.abs(dx) > 1) continue;
      if (x >= 0 && x < 128 && groundY - 1 >= 0) {
        const w = 1 - dx * dx;
        pc.setPixel(x, groundY, tone(0.04 * w + 0.04));
        pc.setPixel(x, groundY - 1, tone(0.07 * w + 0.05));
      }
    }

    // Cylinder body — each vertical column has the same normal
    for (let y = topY + 1; y <= botY; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const dx = x - cx;
        const xFrac = dx / rx;
        if (Math.abs(xFrac) > 1) continue;

        // Cylinder normal: horizontal only (nx, 0, nz)
        const nx = xFrac;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx));

        // Diffuse
        const NdotL = nx * lx + nz * lz; // ny=0 for cylinder body
        const diffuse = Math.max(0, NdotL);

        // Specular
        const rx2 = 2 * NdotL * nx - lx;
        const rz2 = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rz2), 60) * 0.5;

        // Ambient + reflected
        const ambient = 0.04;
        const reflected = nx > 0.5 ? (nx - 0.5) * 0.1 : 0; // right side gets ground bounce

        // Core shadow at terminator
        let core = 0;
        if (NdotL >= -0.03 && NdotL <= 0.18) {
          const t = Math.abs(NdotL - 0.06) / 0.12;
          core = (1 - t * t) * 0.07;
        }

        // Vertical gradient: slightly darker at bottom (less light reaches there)
        const vertFade = ((y - topY) / (botY - topY)) * 0.06;

        let value = ambient + diffuse * 0.7 + specular + reflected - core - vertFade;
        value = Math.max(0, Math.min(1, value));
        value = value * value * (3 - 2 * value);
        value = Math.max(0.02, Math.min(1, value));

        pc.setPixel(x, y, tone(value));
      }
    }

    // Top ellipse face — flat plane facing up
    for (let y = topY - ry; y <= topY + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const dx = (x - cx) / rx, dy = (y - topY) / ry;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;

        // Normal: straight up (0, -1, 0)
        // But add slight curvature at edges for a beveled feel
        const edgeFade = Math.sqrt(d);
        const ny = -0.95 + edgeFade * 0.3;
        const nz = Math.sqrt(Math.max(0, 1 - ny * ny));

        const NdotL = ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const specular = Math.pow(Math.max(0, nz), 80) * 0.3;
        const ambient = 0.05;

        let value = ambient + diffuse * 0.65 + specular;
        // Darken edge to separate from body
        value *= 1 - edgeFade * 0.15;
        value = Math.max(0, Math.min(1, value));
        value = value * value * (3 - 2 * value);
        value = Math.max(0.03, value);

        pc.setPixel(x, y, tone(value));
      }
    }

    // Top edge rim — bright highlight where top face meets body
    for (let x = cx - rx; x <= cx + rx; x++) {
      const dx = (x - cx) / rx;
      if (Math.abs(dx) > 1) continue;
      const edgeY = Math.round(topY + ry * Math.sqrt(1 - dx * dx));
      // Bright rim on light-facing side
      const nx = dx;
      const rimBright = Math.max(0, (-nx * lx + lz * 0.5)) * 0.3 + 0.15;
      if (edgeY >= 0 && edgeY < 128 && x >= 0 && x < 128) {
        pc.setPixel(x, edgeY, tone(Math.min(0.85, rimBright + 0.2)));
      }
    }

    // Bottom edge — dark line where body meets ground-facing plane
    for (let x = cx - rx; x <= cx + rx; x++) {
      const dx = (x - cx) / rx;
      if (Math.abs(dx) > 1) continue;
      const edgeY = Math.round(botY + ry * Math.sqrt(Math.max(0, 1 - dx * dx)));
      if (edgeY >= 0 && edgeY < 128 && x >= 0 && x < 128) {
        pc.setPixel(x, edgeY, tone(0.04));
        if (edgeY - 1 >= 0) pc.setPixel(x, edgeY - 1, tone(0.08));
      }
    }
  },
};
