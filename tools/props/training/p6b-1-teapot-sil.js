// Phase 6B.1: Teapot — body + spout + handle + lid
// Compound: 4 parts must read as unified whole

module.exports = {
  width: 128, height: 96, style: 'hd', entityType: 'prop', outlineMode: 'none',
  colors: { body: '#aa7755', shd: '#664433', hi: '#ddbb88' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },
  drawPost(pc, pal) {
    const bg = pal.groups.body, sg = pal.groups.shd, hg = pal.groups.hi;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;
    const cx = 58, cy = 50, lx = -0.5, ly = -0.6, lz = 0.63;

    // Body — squat sphere
    const bodyR = 28;
    for (let py = cy - bodyR; py <= cy + bodyR; py++) {
      for (let px = cx - bodyR - 3; px <= cx + bodyR + 3; px++) {
        if (px < 0 || px >= 128 || py < 0 || py >= 96) continue;
        const dx = px - cx, dy = py - cy;
        const squash = 0.85; // wider than tall
        if (dx * dx + (dy / squash) * (dy / squash) > bodyR * bodyR) continue;
        const nx = dx / bodyR, ny = dy / bodyR / squash;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const diffuse = Math.max(0, nx * lx + ny * ly + nz * lz);
        const spec = Math.pow(Math.max(0, 2 * (nx * lx + ny * ly + nz * lz) * nz - lz), 30) * 0.2;
        let v = 0.06 + diffuse * 0.58 + spec;
        v = v * v * (3 - 2 * v);
        if (v > 0.55) pc.setPixel(px, py, tone(hg, v));
        else if (v > 0.3) pc.setPixel(px, py, tone(bg, v + 0.1));
        else pc.setPixel(px, py, tone(sg, Math.max(0.05, v * 1.3)));
      }
    }

    // Lid — small dome on top
    const lidCY = cy - bodyR + 2;
    for (let dy = -4; dy <= 4; dy++) {
      const lw = Math.round(14 * Math.sqrt(Math.max(0, 1 - (dy / 4) * (dy / 4))));
      for (let dx = -lw; dx <= lw; dx++) {
        const x = cx + dx, y = lidCY + dy;
        if (x >= 0 && x < 128 && y >= 0 && y < 96) {
          let lv = 0.1 + Math.max(0, -ly) * 0.5;
          lv = lv * lv * (3 - 2 * lv);
          pc.setPixel(x, y, tone(lv > 0.4 ? bg : sg, Math.max(0.06, lv)));
        }
      }
    }
    // Knob on lid
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        if (dx * dx + dy * dy <= 4) {
          const x = cx + dx, y = lidCY - 5 + dy;
          if (x >= 0 && x < 128 && y >= 0 && y < 96)
            pc.setPixel(x, y, tone(bg, 0.5));
        }

    // Spout — curves out to the left
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const sx = cx - bodyR + 2 - Math.pow(t, 0.7) * 20;
      const sy = cy - 8 - t * 15;
      const sw = Math.max(2, 5 - t * 3);
      for (let dy = -Math.round(sw); dy <= Math.round(sw); dy++) {
        const px = Math.round(sx), py = Math.round(sy + dy);
        if (px >= 0 && px < 128 && py >= 0 && py < 96) {
          const lit = dy < 0 ? 0.5 : 0.2;
          pc.setPixel(px, py, tone(lit > 0.35 ? bg : sg, lit));
        }
      }
    }

    // Handle — C-shape on the right
    for (let angle = -1.3; angle <= 1.3; angle += 0.05) {
      const hx = cx + bodyR - 2 + Math.cos(angle) * 15;
      const hy = cy + Math.sin(angle) * 22;
      for (let tw = -3; tw <= 3; tw++) {
        const px = Math.round(hx + Math.cos(angle) * tw);
        const py = Math.round(hy + Math.sin(angle) * tw);
        if (px >= 0 && px < 128 && py >= 0 && py < 96)
          pc.setPixel(px, py, tone(tw < 0 ? bg : sg, tw < 0 ? 0.45 : 0.18));
      }
    }
  },
};
