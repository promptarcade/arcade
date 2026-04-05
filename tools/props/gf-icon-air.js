// Glyph Forge — Element Icon: Air (spiral)
// 24x24 UI icon
module.exports = {
  width: 24, height: 24, style: 'chibi', entityType: 'effect',
  outlineMode: 'none',
  colors: {
    bg: '#1a1a22', wind: '#aa88dd', core: '#ccaaff', glow: '#eeccff'
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.bg.startIdx); },
  drawPost(pc, pal) {
    const bg = pal.groups.bg, wi = pal.groups.wind, co = pal.groups.core, gl = pal.groups.glow;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;
    const W = 24, H = 24, cx = 12, cy = 12;

    // Dark background
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        pc.setPixel(x, y, tone(bg, 0.3));

    // Spiral — Archimedean spiral with decreasing radius
    const strokeW = 1.8;
    const turns = 2.5;
    const maxR = 9;
    const steps = 200;

    // Pre-compute spiral points
    const spiralPts = [];
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const angle = t * turns * Math.PI * 2;
      const r = maxR * (1 - t * 0.7); // shrinks toward center
      spiralPts.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        t: t
      });
    }

    // Draw spiral with glow
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        let minDist = 999;
        let nearT = 0;
        for (const pt of spiralPts) {
          const d = Math.sqrt((x - pt.x) * (x - pt.x) + (y - pt.y) * (y - pt.y));
          if (d < minDist) { minDist = d; nearT = pt.t; }
        }

        if (minDist < strokeW + 3) {
          const glowDist = Math.max(0, minDist - strokeW);
          if (glowDist > 0 && glowDist < 3) {
            const glowF = 1 - glowDist / 3;
            pc.setPixel(x, y, tone(wi, 0.15 + glowF * glowF * 0.4));
          }
        }
        if (minDist < strokeW) {
          const f = 1 - minDist / strokeW;
          // Brighter toward centre of spiral
          const centerBright = nearT * 0.3;
          if (f + centerBright > 0.6) {
            pc.setPixel(x, y, tone(gl, Math.min(1, 0.4 + f * 0.4 + centerBright)));
          } else {
            pc.setPixel(x, y, tone(co, 0.4 + f * 0.5));
          }
        }
      }
    }
  },
};
