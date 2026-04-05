// Glyph Forge — Rune Fragment: Angle
// 48x48 glowing 90-degree corner stroke on dark stone cell
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

    // Angle: vertical line from (14, 8) to (14, 34), then horizontal to (40, 34)
    const strokeW = 3.0;
    const segments = [
      { x0: 14, y0: 8, x1: 14, y1: 34 },   // vertical arm
      { x0: 14, y0: 34, x1: 40, y1: 34 },   // horizontal arm
    ];

    for (let y = 2; y < H - 2; y++) {
      for (let x = 2; x < W - 2; x++) {
        // Min distance to either segment
        let minDist = 999;
        for (const seg of segments) {
          const dx = seg.x1 - seg.x0, dy = seg.y1 - seg.y0;
          const len2 = dx * dx + dy * dy;
          let t = len2 === 0 ? 0 : ((x - seg.x0) * dx + (y - seg.y0) * dy) / len2;
          t = Math.max(0, Math.min(1, t));
          const px = seg.x0 + t * dx, py = seg.y0 + t * dy;
          const d = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
          if (d < minDist) minDist = d;
        }

        if (minDist < strokeW + 5) {
          const glowDist = Math.max(0, minDist - strokeW);
          if (glowDist > 0 && glowDist < 5) {
            const glowF = 1 - glowDist / 5;
            pc.setPixel(x, y, tone(gg, 0.15 + glowF * glowF * 0.5));
          }
        }
        if (minDist < strokeW) {
          const f = 1 - minDist / strokeW;
          const v = f * f;
          // Bright vertex at the corner
          const cornerDist = Math.sqrt((x - 14) * (x - 14) + (y - 34) * (y - 34));
          const cornerBoost = Math.max(0, 1 - cornerDist / 8) * 0.3;
          if (v + cornerBoost > 0.5) {
            pc.setPixel(x, y, tone(cg, Math.min(1, 0.4 + (v + cornerBoost) * 0.5)));
          } else {
            pc.setPixel(x, y, tone(gg, 0.4 + v * 0.8));
          }
        }
      }
    }
  },
};
