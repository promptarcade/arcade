// Glyph Forge — Rune Fragment: Line
// 48x48 glowing straight stroke (diagonal) on dark stone cell
module.exports = {
  width: 48, height: 48, style: 'chibi', entityType: 'effect',
  outlineMode: 'none',
  colors: {
    stone: '#3a3a42', glow: '#55aaee', core: '#ccddff', crack: '#222228'
  },
  draw(pc, pal) {
    pc.setPixel(0, 0, pal.groups.stone.startIdx);
  },
  drawPost(pc, pal) {
    const sg = pal.groups.stone, gg = pal.groups.glow, cg = pal.groups.core;
    const crk = pal.groups.crack;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const W = 48, H = 48;

    // Stone background
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
        const vignette = Math.min(1, edge / 8) * 0.3 + 0.3;
        const grain = (Math.sin(x * 7.3 + y * 11.7) * 0.5 + 0.5) * 0.15;
        pc.setPixel(x, y, tone(sg, vignette + grain));
      }
    }

    // Grid edges
    for (let x = 0; x < W; x++) { pc.setPixel(x, 0, tone(crk, 0.3)); pc.setPixel(x, H - 1, tone(crk, 0.3)); }
    for (let y = 0; y < H; y++) { pc.setPixel(0, y, tone(crk, 0.3)); pc.setPixel(W - 1, y, tone(crk, 0.3)); }

    // Diagonal line from (8, 40) to (40, 8)
    const x0 = 8, y0 = 40, x1 = 40, y1 = 8;
    const strokeW = 3.0;

    for (let y = 2; y < H - 2; y++) {
      for (let x = 2; x < W - 2; x++) {
        // Distance from point to line segment
        const dx = x1 - x0, dy = y1 - y0;
        const len2 = dx * dx + dy * dy;
        let t = ((x - x0) * dx + (y - y0) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const px = x0 + t * dx, py = y0 + t * dy;
        const dist = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));

        if (dist < strokeW + 5) {
          const glowDist = Math.max(0, dist - strokeW);
          if (glowDist > 0 && glowDist < 5) {
            const glowF = 1 - glowDist / 5;
            pc.setPixel(x, y, tone(gg, 0.15 + glowF * glowF * 0.5));
          }
        }
        if (dist < strokeW) {
          const f = 1 - dist / strokeW;
          const v = f * f;
          if (v > 0.5) {
            pc.setPixel(x, y, tone(cg, 0.5 + v * 0.5));
          } else {
            pc.setPixel(x, y, tone(gg, 0.4 + v * 0.8));
          }
        }
      }
    }
  },
};
