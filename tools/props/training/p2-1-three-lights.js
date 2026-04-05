// Phase 2, Exercise 2.1: Same sphere, 3 different light directions
// Training target: understanding how moving the light changes EVERYTHING
// Three spheres side by side: left-lit, top-lit, right-lit

module.exports = {
  width: 128,
  height: 48,
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

    const r = 16;
    const lights = [
      { cx: 22, cy: 24, lx: -0.7, ly: -0.3, lz: 0.65 },  // left light
      { cx: 64, cy: 24, lx: 0.0, ly: -0.8, lz: 0.6 },     // top light
      { cx: 106, cy: 24, lx: 0.7, ly: -0.3, lz: 0.65 },   // right light
    ];

    // Ground for each
    for (let x = 0; x < 128; x++) {
      for (let y = 40; y < 48; y++) {
        pc.setPixel(x, y, tone(0.2 - (y - 40) / 48 * 0.08));
      }
    }

    for (const L of lights) {
      const { cx, cy, lx, ly, lz } = L;

      // Cast shadow — offset OPPOSITE to light direction
      const shOX = Math.round(-lx * 12);
      const shOY = 4;
      for (let y = cy + r + 1; y < 42; y++) {
        for (let x = cx + shOX - 12; x <= cx + shOX + 12; x++) {
          if (x < 0 || x >= 128 || y < 0 || y >= 48) continue;
          const dx = (x - (cx + shOX)) / 12, dy = (y - (cy + r + 2)) / 4;
          const d = dx * dx + dy * dy;
          if (d < 1) {
            pc.setPixel(x, y, tone(Math.max(0.03, 0.18 * (0.6 + d * 0.4))));
          }
        }
      }

      // Sphere
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy > r * r) continue;

          const nx = dx / r, ny = dy / r;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

          const NdotL = nx * lx + ny * ly + nz * lz;
          const diffuse = Math.max(0, NdotL);
          const rr = 2 * NdotL * nz - lz;
          const specular = Math.pow(Math.max(0, rr), 50) * 0.6;
          const ambient = 0.03;
          const reflected = Math.max(0, ny * 0.3) * 0.12;

          let core = 0;
          if (NdotL >= -0.03 && NdotL <= 0.16) {
            core = Math.max(0, 1 - Math.abs(NdotL - 0.05) / 0.11) * 0.06;
          }

          let v = ambient + diffuse * 0.72 + specular + reflected - core;
          v = Math.max(0, Math.min(1, v));
          v = v * v * (3 - 2 * v);

          if (x >= 0 && x < 128 && y >= 0 && y < 48) {
            pc.setPixel(x, y, tone(Math.max(0.02, v)));
          }
        }
      }
    }
  },
};
