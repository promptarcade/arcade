// Phase 4, Exercise 4.2: Same object — black outline vs selout vs no outline
// Training target: understand how outline mode changes readability and style
// Three identical spheres, different outline treatments

module.exports = {
  width: 128,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#cc6633',
    dark: '#663311',
    outline: '#221100',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const dg = pal.groups.dark;
    const og = pal.groups.outline;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const r = 14;
    const spheres = [
      { cx: 18, cy: 24, mode: 'black' },
      { cx: 60, cy: 24, mode: 'selout' },
      { cx: 102, cy: 24, mode: 'none' },
    ];

    // Labels would go here in a real tutorial — we just draw the spheres

    for (const s of spheres) {
      // Sphere interior
      for (let y = s.cy - r; y <= s.cy + r; y++) {
        for (let x = s.cx - r; x <= s.cx + r; x++) {
          const dx = x - s.cx, dy = y - s.cy;
          if (dx * dx + dy * dy > r * r) continue;
          if (x < 0 || x >= 128 || y < 0 || y >= 48) continue;

          const nx = dx / r, ny = dy / r;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const dot = Math.max(0, -0.55 * nx - 0.65 * ny + 0.52 * nz);
          let v = 0.15 + dot * 0.65;
          v = v * v * (3 - 2 * v);
          pc.setPixel(x, y, tone(bg, Math.max(0.05, v)));
        }
      }

      // Specular
      pc.setPixel(s.cx - 4, s.cy - 4, tone(bg, 1.0));
      pc.setPixel(s.cx - 3, s.cy - 4, tone(bg, 0.85));

      // Outline pass — check each pixel outside the sphere
      for (let y = s.cy - r - 1; y <= s.cy + r + 1; y++) {
        for (let x = s.cx - r - 1; x <= s.cx + r + 1; x++) {
          const dx = x - s.cx, dy = y - s.cy;
          const dist2 = dx * dx + dy * dy;
          if (dist2 <= r * r) continue; // inside sphere
          if (x < 0 || x >= 128 || y < 0 || y >= 48) continue;

          // Check if adjacent to sphere
          let adjacent = false;
          let nearestTone = 0;
          for (const [ndx, ndy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nx = x + ndx, ny = y + ndy;
            if (nx < 0 || nx >= 128 || ny < 0 || ny >= 48) continue;
            const nd = (nx - s.cx) ** 2 + (ny - s.cy) ** 2;
            if (nd <= r * r) {
              adjacent = true;
              // Get brightness of adjacent interior pixel for selout
              const inx = (nx - s.cx) / r, iny = (ny - s.cy) / r;
              const inz = Math.sqrt(Math.max(0, 1 - inx * inx - iny * iny));
              nearestTone = Math.max(0, -0.55 * inx - 0.65 * iny + 0.52 * inz);
              break;
            }
          }

          if (!adjacent) continue;

          if (s.mode === 'black') {
            // Uniform dark outline
            pc.setPixel(x, y, tone(og, 0.15));
          } else if (s.mode === 'selout') {
            // Tinted outline — darkest shade of nearest interior region
            // Lit side gets lighter outline, shadow side gets darker
            const outlineBright = Math.max(0.02, nearestTone * 0.25);
            pc.setPixel(x, y, tone(dg, outlineBright));
          }
          // 'none' — no outline drawn
        }
      }
    }
  },
};
