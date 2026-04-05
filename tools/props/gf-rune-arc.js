// Glyph Forge — Rune Fragment: Arc
// 48x48 glowing curved stroke on dark stone cell
module.exports = {
  width: 48, height: 48, style: 'chibi', entityType: 'effect',
  outlineMode: 'none',
  colors: {
    stone: '#3a3a42', glow: '#55aaee', core: '#ccddff', crack: '#222228'
  },
  draw(pc, pal) {
    // Dummy pixel to trigger pipeline
    pc.setPixel(0, 0, pal.groups.stone.startIdx);
  },
  drawPost(pc, pal) {
    const sg = pal.groups.stone, gg = pal.groups.glow, cg = pal.groups.core;
    const crk = pal.groups.crack;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 24, cy = 24, W = 48, H = 48;

    // Stone background — subtle grain
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
        const vignette = Math.min(1, edge / 8) * 0.3 + 0.3;
        // Grain noise
        const grain = (Math.sin(x * 7.3 + y * 11.7) * 0.5 + 0.5) * 0.15;
        pc.setPixel(x, y, tone(sg, vignette + grain));
      }
    }

    // Etched grid lines (faint)
    for (let x = 0; x < W; x++) {
      pc.setPixel(x, 0, tone(crk, 0.3));
      pc.setPixel(x, H - 1, tone(crk, 0.3));
    }
    for (let y = 0; y < H; y++) {
      pc.setPixel(0, y, tone(crk, 0.3));
      pc.setPixel(W - 1, y, tone(crk, 0.3));
    }

    // Arc stroke — quarter circle from lower-left to upper-right area
    const arcCx = 12, arcCy = 36; // centre of arc circle
    const arcR = 24;
    const strokeW = 3.5;

    for (let y = 2; y < H - 2; y++) {
      for (let x = 2; x < W - 2; x++) {
        const dx = x - arcCx, dy = y - arcCy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const distFromArc = Math.abs(dist - arcR);

        // Only draw in upper-right quadrant of the circle
        const angle = Math.atan2(-dy, dx);
        if (angle < 0.15 || angle > 1.42) continue;

        if (distFromArc < strokeW + 4) {
          // Glow falloff
          const glowDist = Math.max(0, distFromArc - strokeW);
          if (glowDist < 4) {
            const glowF = 1 - glowDist / 4;
            const intensity = glowF * glowF * 0.4;
            pc.setPixel(x, y, tone(gg, 0.2 + intensity * 0.6));
          }
        }
        if (distFromArc < strokeW) {
          // Core stroke — brightest at centre
          const f = 1 - distFromArc / strokeW;
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
