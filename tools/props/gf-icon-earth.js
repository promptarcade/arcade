// Glyph Forge — Element Icon: Earth (leaf)
// 24x24 UI icon
module.exports = {
  width: 24, height: 24, style: 'chibi', entityType: 'effect',
  outlineMode: 'none',
  colors: {
    bg: '#1a1a22', leaf: '#66aa44', vein: '#88cc66', tip: '#aaee88'
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.bg.startIdx); },
  drawPost(pc, pal) {
    const bg = pal.groups.bg, lf = pal.groups.leaf, vn = pal.groups.vein, tp = pal.groups.tip;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;
    const W = 24, H = 24;

    // Dark background
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        pc.setPixel(x, y, tone(bg, 0.3));

    // Leaf shape — pointed oval tilted slightly, tip at upper-right
    const lcx = 12, lcy = 12;
    const angle = -0.4; // slight tilt
    const lenA = 10, lenB = 5; // semi-axes

    for (let y = 2; y < 22; y++) {
      for (let x = 2; x < 22; x++) {
        const dx = x - lcx, dy = y - lcy;
        // Rotate into leaf space
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const lx = dx * cos + dy * sin;
        const ly = -dx * sin + dy * cos;
        // Ellipse test
        const d = (lx * lx) / (lenA * lenA) + (ly * ly) / (lenB * lenB);
        if (d > 1) continue;

        // Shading — upper-left light
        const v = 0.3 + (1 - d) * 0.4 + (-dx * 0.3 - dy * 0.3) / 15;
        pc.setPixel(x, y, tone(lf, Math.max(0.1, Math.min(0.9, v))));
      }
    }

    // Central vein — line from stem to tip
    for (let i = -8; i < 9; i++) {
      const vx = Math.round(lcx + Math.cos(angle) * i);
      const vy = Math.round(lcy + Math.sin(angle) * i);
      if (vx >= 2 && vx < 22 && vy >= 2 && vy < 22) {
        pc.setPixel(vx, vy, tone(vn, 0.7));
      }
    }
    // Side veins
    for (let j = -2; j <= 2; j++) {
      if (j === 0) continue;
      const bx = lcx + Math.round(Math.cos(angle) * j * 2.5);
      const by = lcy + Math.round(Math.sin(angle) * j * 2.5);
      for (let k = 1; k < 4; k++) {
        const perpAngle = angle + (j > 0 ? 1.2 : -1.2);
        const sx = Math.round(bx + Math.cos(perpAngle) * k);
        const sy = Math.round(by + Math.sin(perpAngle) * k);
        if (sx >= 2 && sx < 22 && sy >= 2 && sy < 22) {
          pc.setPixel(sx, sy, tone(vn, 0.5));
        }
      }
    }

    // Highlight near tip
    pc.setPixel(17, 9, tone(tp, 0.8));
    pc.setPixel(18, 8, tone(tp, 0.9));
  },
};
