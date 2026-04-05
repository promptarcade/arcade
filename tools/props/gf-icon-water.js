// Glyph Forge — Element Icon: Water (droplet)
// 24x24 UI icon
module.exports = {
  width: 24, height: 24, style: 'chibi', entityType: 'effect',
  outlineMode: 'none',
  colors: {
    bg: '#1a1a22', drop: '#3388cc', core: '#88ccff', spec: '#ddeeff'
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.bg.startIdx); },
  drawPost(pc, pal) {
    const bg = pal.groups.bg, dr = pal.groups.drop, co = pal.groups.core, sp = pal.groups.spec;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;
    const W = 24, H = 24, cx = 12;

    // Dark background
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        pc.setPixel(x, y, tone(bg, 0.3));

    // Droplet — inverted teardrop (point up, round bottom)
    for (let y = 3; y < 22; y++) {
      const t = (y - 3) / 19;
      let halfW;
      if (t < 0.2) halfW = t / 0.2 * 3; // pointed tip
      else if (t < 0.6) halfW = 3 + (t - 0.2) / 0.4 * 5; // widening
      else {
        // Round bottom — circular
        const bt = (t - 0.6) / 0.4;
        halfW = 8 * Math.cos(bt * Math.PI * 0.5);
      }
      for (let x = Math.floor(cx - halfW); x <= Math.ceil(cx + halfW); x++) {
        if (x < 1 || x >= W - 1) continue;
        const dx = (x - cx) / (halfW + 0.1);
        const edgeDist = 1 - Math.abs(dx);
        // Sphere-like shading on the round bottom
        const ny = t * 2 - 1;
        const nx = dx * 0.8;
        const nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));
        const NdotL = nx * (-0.5) + ny * (-0.6) + nz * 0.63;
        const v = Math.max(0.15, NdotL * 0.5 + 0.4);
        if (edgeDist > 0.5 && t > 0.3) {
          pc.setPixel(x, y, tone(co, Math.min(1, v + 0.2)));
        } else {
          pc.setPixel(x, y, tone(dr, Math.min(1, v)));
        }
      }
    }
    // Specular highlight upper-left of round part
    pc.setPixel(9, 12, tone(sp, 0.9));
    pc.setPixel(10, 11, tone(sp, 1.0));
    pc.setPixel(10, 12, tone(sp, 0.8));
  },
};
