// Phase 2, Exercise 2.4: Backlit object — dramatic rim lighting
// Training target: edge light separates object from dark background, silhouette reads

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

    // Light is BEHIND the object — coming from behind and slightly above
    // This means the front face is in shadow, edges are bright
    const lx = 0.0, ly = -0.3, lz = -0.95; // light from behind

    const cx = 64, cy = 55, r = 40;

    // Dark background with subtle gradient (light source behind creates a glow)
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const dx = (x - cx) / 64, dy = (y - cy) / 64;
        const d = Math.sqrt(dx * dx + dy * dy);
        // Glow behind the sphere position — brighter behind where light bleeds around
        const glow = Math.max(0, 0.2 - d * 0.12);
        pc.setPixel(x, y, tone(Math.max(0.02, 0.06 + glow)));
      }
    }

    // Ground — dark, with subtle light spill
    const groundY = cy + r + 4;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        pc.setPixel(x, y, tone(Math.max(0.03, 0.1 - ((y - groundY) / (128 - groundY)) * 0.04)));
      }
    }

    // Sphere — mostly dark front face with bright rim edges
    for (let y = cy - r - 1; y <= cy + r + 1; y++) {
      for (let x = cx - r - 1; x <= cx + r + 1; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > r * r) continue;

        const nx = dx / r, ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        // Direct light from behind — the BACK of the sphere is lit
        // But we see the front, so direct light contribution is near zero
        const NdotL = nx * lx + ny * ly + nz * lz;
        const directLight = Math.max(0, NdotL) * 0.1; // very weak from front view

        // RIM LIGHT — this is the star of the show
        // Bright where surface normal is nearly perpendicular to view (edge of sphere)
        // AND where the surface faces toward the light (back edges)
        const rimFresnel = Math.pow(1 - nz, 2.5); // edge brightness
        // But only on the side facing the light (back/top)
        const facingLight = Math.max(0, -NdotL); // how much this face points toward light
        const rim = rimFresnel * facingLight * 0.85;

        // Subtle ambient — very dark front
        const ambient = 0.04;

        // Faint fill light from the front (so the sphere isn't pure black)
        const fill = nz * 0.06;

        let v = ambient + directLight + rim + fill;
        v = Math.max(0, Math.min(1, v));
        // Less aggressive S-curve — we want to preserve the subtle dark tones
        v = v * v * (3 - 2 * v) * 0.7 + v * 0.3;

        if (x >= 0 && x < 128 && y >= 0 && y < 128) {
          pc.setPixel(x, y, tone(Math.max(0.02, v)));
        }
      }
    }

    // Light spill around the sphere edges — the glow that bleeds past the silhouette
    for (let y = cy - r - 6; y <= cy + r + 6; y++) {
      for (let x = cx - r - 6; x <= cx + r + 6; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r || dist > r + 5) continue;

        // Glow is strongest at top and sides (where backlight bleeds)
        const angle = Math.atan2(dy, dx);
        const glowStrength = Math.max(0, -Math.sin(angle) * 0.3 + 0.2); // stronger at top
        const falloff = 1 - (dist - r) / 5;

        if (x >= 0 && x < 128 && y >= 0 && y < 128) {
          const existing = pc.getPixel(x, y);
          const v = Math.min(0.4, glowStrength * falloff * 0.35);
          if (v > 0.03) pc.setPixel(x, y, tone(v));
        }
      }
    }
  },
};
