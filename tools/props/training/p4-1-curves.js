// Phase 4, Exercise 4.1: Clean curves at 16px, 32px, 64px
// Training target: line consistency, anti-aliasing, jaggies avoidance
// Draw the same circle at three sizes to see how curve quality scales

module.exports = {
  width: 128,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    line: '#224466',
    fill: '#5588bb',
    aa: '#336688',     // anti-alias intermediate colour
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },

  drawPost(pc, pal) {
    const lg = pal.groups.line;
    const fg = pal.groups.fill;
    const ag = pal.groups.aa;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    // Three circles: 8px radius (16px diameter), 14px, 20px
    const circles = [
      { cx: 14, cy: 24, r: 7 },
      { cx: 46, cy: 24, r: 13 },
      { cx: 94, cy: 24, r: 20 },
    ];

    for (const c of circles) {
      // Filled circle with proper anti-aliased edge
      for (let y = c.cy - c.r - 2; y <= c.cy + c.r + 2; y++) {
        for (let x = c.cx - c.r - 2; x <= c.cx + c.r + 2; x++) {
          if (x < 0 || x >= 128 || y < 0 || y >= 48) continue;
          const dx = x - c.cx, dy = y - c.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= c.r - 1.2) {
            // Interior — filled with shading
            const nx = dx / c.r, ny = dy / c.r;
            const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
            const dot = Math.max(0, -0.55 * nx - 0.65 * ny + 0.52 * nz);
            let v = 0.2 + dot * 0.6;
            v = v * v * (3 - 2 * v);
            pc.setPixel(x, y, tone(fg, Math.max(0.1, v)));
          } else if (dist <= c.r + 0.5) {
            // Edge — outline
            pc.setPixel(x, y, tone(lg, 0.4));
          } else if (dist <= c.r + 1.2) {
            // Anti-alias zone — intermediate colour at sub-pixel boundary
            const aaStrength = 1 - (dist - c.r - 0.5) / 0.7;
            if (aaStrength > 0.1) {
              pc.setPixel(x, y, tone(ag, aaStrength * 0.5));
            }
          }
        }
      }

      // Specular
      const sx = c.cx - Math.round(c.r * 0.3);
      const sy = c.cy - Math.round(c.r * 0.3);
      if (sx >= 0 && sx < 128 && sy >= 0 && sy < 48) {
        pc.setPixel(sx, sy, tone(fg, 1.0));
        if (c.r > 10) {
          if (sx + 1 < 128) pc.setPixel(sx + 1, sy, tone(fg, 0.85));
          if (sy + 1 < 48) pc.setPixel(sx, sy + 1, tone(fg, 0.85));
        }
      }
    }
  },
};
