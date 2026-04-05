// Glyph Forge — Completed Glyph Symbol
// 96x96 (covers 2x2 cells) — mystical symbol combining all stroke types
module.exports = {
  width: 96, height: 96, style: 'chibi', entityType: 'effect',
  outlineMode: 'none',
  colors: {
    stone: '#2a2a32', glow: '#55aaee', core: '#ccddff', bright: '#ffffff'
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.stone.startIdx); },
  drawPost(pc, pal) {
    const sg = pal.groups.stone, gg = pal.groups.glow, cg = pal.groups.core, br = pal.groups.bright;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;
    const W = 96, H = 96, cx = 48, cy = 48;

    // Dark stone background
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
        const vignette = Math.min(1, edge / 12) * 0.25 + 0.2;
        const grain = (Math.sin(x * 5.1 + y * 8.3) * 0.5 + 0.5) * 0.1;
        pc.setPixel(x, y, tone(sg, vignette + grain));
      }
    }

    const strokeW = 3.5;

    // Helper: distance to line segment
    function distToSeg(px, py, x0, y0, x1, y1) {
      const dx = x1 - x0, dy = y1 - y0;
      const len2 = dx * dx + dy * dy;
      let t = len2 === 0 ? 0 : ((px - x0) * dx + (py - y0) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const nx = x0 + t * dx, ny = y0 + t * dy;
      return Math.sqrt((px - nx) * (px - nx) + (py - ny) * (py - ny));
    }

    // Full glyph symbol — combines: outer circle, inner cross, diagonal lines, central dot
    for (let y = 4; y < H - 4; y++) {
      for (let x = 4; x < W - 4; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 1. Outer circle (radius 36)
        const circDist = Math.abs(dist - 36);

        // 2. Inner cross (through center)
        const crossDist = Math.min(
          distToSeg(x, y, cx, cy - 24, cx, cy + 24),
          distToSeg(x, y, cx - 24, cy, cx + 24, cy)
        );

        // 3. Diagonal accents (corners)
        const diagDist = Math.min(
          distToSeg(x, y, cx - 20, cy - 20, cx - 10, cy - 10),
          distToSeg(x, y, cx + 10, cy - 10, cx + 20, cy - 20),
          distToSeg(x, y, cx - 20, cy + 20, cx - 10, cy + 10),
          distToSeg(x, y, cx + 10, cy + 10, cx + 20, cy + 20)
        );

        // 4. Small arcs at cardinal points
        const arcDist1 = Math.abs(Math.sqrt((x - cx) * (x - cx) + (y - (cy - 36)) * (y - (cy - 36))) - 8);
        const arcDist2 = Math.abs(Math.sqrt((x - cx) * (x - cx) + (y - (cy + 36)) * (y - (cy + 36))) - 8);
        const arcDist3 = Math.abs(Math.sqrt((x - (cx - 36)) * (x - (cx - 36)) + (y - cy) * (y - cy)) - 8);
        const arcDist4 = Math.abs(Math.sqrt((x - (cx + 36)) * (x - (cx + 36)) + (y - cy) * (y - cy)) - 8);
        // Only show arcs facing outward
        const arcDist = Math.min(
          (y < cy - 28) ? arcDist1 : 999,
          (y > cy + 28) ? arcDist2 : 999,
          (x < cx - 28) ? arcDist3 : 999,
          (x > cx + 28) ? arcDist4 : 999
        );

        // Minimum distance to any element
        const minD = Math.min(circDist, crossDist, diagDist, arcDist);

        // Draw with glow
        if (minD < strokeW + 6) {
          const glowDist = Math.max(0, minD - strokeW);
          if (glowDist > 0 && glowDist < 6) {
            const glowF = 1 - glowDist / 6;
            pc.setPixel(x, y, tone(gg, 0.1 + glowF * glowF * 0.5));
          }
        }
        if (minD < strokeW) {
          const f = 1 - minD / strokeW;
          const v = f * f;
          if (v > 0.6) {
            pc.setPixel(x, y, tone(cg, 0.5 + v * 0.5));
          } else {
            pc.setPixel(x, y, tone(gg, 0.4 + v * 0.8));
          }
        }

        // 5. Central dot
        if (dist < 6) {
          const dotF = 1 - dist / 6;
          if (dotF > 0.5) pc.setPixel(x, y, tone(br, 0.5 + dotF * 0.5));
          else pc.setPixel(x, y, tone(cg, 0.5 + dotF * 0.8));
        }
      }
    }
  },
};
