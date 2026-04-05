// Glyph Forge — Crack Overlay
// 48x48 thin jagged crack lines on stone with subtle red underglow
module.exports = {
  width: 48, height: 48, style: 'chibi', entityType: 'effect',
  outlineMode: 'none',
  colors: {
    stone: '#3a3a42', crack: '#111115', glow: '#882211', edge: '#332222'
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.stone.startIdx); },
  drawPost(pc, pal) {
    const sg = pal.groups.stone, ck = pal.groups.crack, gl = pal.groups.glow, ed = pal.groups.edge;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;
    const W = 48, H = 48;

    // Stone background with grain
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
        const vignette = Math.min(1, edge / 8) * 0.3 + 0.3;
        const grain = (Math.sin(x * 7.3 + y * 11.7) * 0.5 + 0.5) * 0.15;
        pc.setPixel(x, y, tone(sg, vignette + grain));
      }
    }

    // Grid edges
    for (let x = 0; x < W; x++) { pc.setPixel(x, 0, tone(ck, 0.3)); pc.setPixel(x, H - 1, tone(ck, 0.3)); }
    for (let y = 0; y < H; y++) { pc.setPixel(0, y, tone(ck, 0.3)); pc.setPixel(W - 1, y, tone(ck, 0.3)); }

    // Crack paths — thin random walks
    function hashR(seed) { return ((seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; }

    function drawCrack(sx, sy, angle, len, seed) {
      let x = sx, y = sy, a = angle;
      for (let i = 0; i < len; i++) {
        a += (hashR(seed + i * 7) - 0.5) * 0.9;
        x += Math.cos(a) * 1.2;
        y += Math.sin(a) * 1.2;
        const px = Math.round(x), py = Math.round(y);
        if (px < 1 || px >= W - 1 || py < 1 || py >= H - 1) break;

        // Very subtle red glow — just 1-2px radius
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 2.2 && d > 0.5) {
              const gx = px + dx, gy = py + dy;
              if (gx >= 1 && gx < W - 1 && gy >= 1 && gy < H - 1) {
                const glowF = 1 - d / 2.2;
                pc.setPixel(gx, gy, tone(gl, glowF * 0.4));
              }
            }
          }
        }
        // Dark edge — 1px around crack
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ex = px + dx, ey = py + dy;
            if (ex >= 1 && ex < W - 1 && ey >= 1 && ey < H - 1) {
              pc.setPixel(ex, ey, tone(ed, 0.3));
            }
          }
        }
        // Dark crack core — 1px line
        pc.setPixel(px, py, tone(ck, 0.05));
      }
    }

    // Main crack: runs from upper area diagonally
    drawCrack(10, 6, 0.8, 35, 42);
    // Branch from main
    drawCrack(22, 20, 1.8, 15, 99);
    drawCrack(18, 16, -0.3, 12, 157);
    // Secondary crack from right
    drawCrack(38, 12, 2.3, 20, 213);
    // Small splinter
    drawCrack(30, 32, -1.0, 10, 301);
  },
};
