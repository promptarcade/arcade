// Glyph Forge — Element Icon: Fire (flame)
// 24x24 UI icon
module.exports = {
  width: 24, height: 24, style: 'chibi', entityType: 'effect',
  outlineMode: 'none',
  colors: {
    bg: '#1a1a22', flame: '#ff6b35', core: '#ffcc88', tip: '#ffeecc'
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.bg.startIdx); },
  drawPost(pc, pal) {
    const bg = pal.groups.bg, fl = pal.groups.flame, co = pal.groups.core, tp = pal.groups.tip;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;
    const W = 24, H = 24, cx = 12;

    // Dark background
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        pc.setPixel(x, y, tone(bg, 0.3));

    // Flame shape — teardrop pointing up
    for (let y = 2; y < 22; y++) {
      const t = (y - 2) / 20; // 0=top, 1=bottom
      // Flame widens toward bottom, tapers to point at top
      let halfW;
      if (t < 0.15) halfW = t / 0.15 * 2; // sharp tip
      else if (t < 0.5) halfW = 2 + (t - 0.15) / 0.35 * 5; // widening
      else halfW = 7 - (t - 0.5) / 0.5 * 4; // narrowing base
      // Slight flicker asymmetry
      const wobble = Math.sin(y * 1.8) * 0.7;
      for (let x = Math.floor(cx - halfW + wobble); x <= Math.ceil(cx + halfW + wobble); x++) {
        if (x < 1 || x >= W - 1) continue;
        const dx = (x - cx - wobble) / (halfW + 0.1);
        const edgeDist = 1 - Math.abs(dx);
        // Inner core is bright, outer is orange
        if (edgeDist > 0.6 && t > 0.1 && t < 0.7) {
          const v = (edgeDist - 0.6) / 0.4;
          if (v > 0.5) pc.setPixel(x, y, tone(tp, 0.5 + v * 0.5));
          else pc.setPixel(x, y, tone(co, 0.4 + v * 0.8));
        } else if (edgeDist > 0) {
          pc.setPixel(x, y, tone(fl, 0.3 + edgeDist * 0.6));
        }
      }
    }
  },
};
