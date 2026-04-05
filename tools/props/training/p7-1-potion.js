// Phase 7.1: Master copy — health potion bottle
// Glass bottle with red liquid, cork stopper, label
// Tests: glass material (Fresnel), liquid, construction (bottle profile)

module.exports = {
  width: 64, height: 128, style: 'hd', entityType: 'prop', outlineMode: 'none',
  colors: {
    glass: '#88aacc', glassShd: '#445566',
    liquid: '#cc2233', liquidShd: '#661122',
    cork: '#aa8855', label: '#ddccaa',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.glass.startIdx); },
  drawPost(pc, pal) {
    const gl = pal.groups.glass, gs = pal.groups.glassShd;
    const lq = pal.groups.liquid, ls = pal.groups.liquidShd;
    const ck = pal.groups.cork, lb = pal.groups.label;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;
    const cx = 32, lx = -0.4, lz = 0.68;

    function bottleHW(t) {
      if (t < 0.04) return 5; // lip
      if (t < 0.08) return 4; // neck top
      if (t < 0.22) return 4; // neck
      if (t < 0.32) { const s = (t - 0.22) / 0.1; return 4 + s * s * 16; } // shoulder
      if (t < 0.85) return 20; // body
      if (t < 0.95) return 20 - (t - 0.85) / 0.1 * 4;
      return 16; // base
    }

    const top = 12, bot = 112;
    const liquidLine = 0.35; // liquid fills below this t value (from bottom)

    // Bottle body with glass + liquid
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / (bot - top);
      const hw = bottleHW(t);
      for (let dx = -Math.round(hw); dx <= Math.round(hw); dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 64 || y >= 128) continue;
        const nx = dx / (hw + 0.5);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const thickness = Math.abs(dx / (hw + 0.5));
        const diffuse = Math.max(0, nx * lx + nz * lz);
        const spec = Math.pow(Math.max(0, 2 * (nx * lx + nz * lz) * nz - lz), 60) * 0.5;
        const fresnel = Math.pow(1 - nz, 2) * 0.4 + 0.1;

        const isLiquid = t > (1 - liquidLine) && t < 0.88 && hw > 10;

        if (isLiquid && thickness < 0.5) {
          // Red liquid visible through glass
          let v = 0.15 + diffuse * 0.4 + spec * 0.3;
          v = v * v * (3 - 2 * v);
          pc.setPixel(x, y, tone(v > 0.35 ? lq : ls, Math.max(0.08, v)));
        } else if (thickness > 0.6 || !isLiquid) {
          // Glass edge or empty glass
          let v = fresnel + diffuse * 0.2 + spec;
          v = v * v * (3 - 2 * v);
          if (spec > 0.12) pc.setPixel(x, y, tone(gl, Math.min(0.9, 0.5 + spec)));
          else if (v > 0.3) pc.setPixel(x, y, tone(gl, v));
          else pc.setPixel(x, y, tone(gs, Math.max(0.05, v * 1.3)));
        } else {
          // Glass centre (thin, nearly transparent)
          pc.setPixel(x, y, tone(gs, fresnel * 0.3));
        }
      }
    }

    // Cork stopper
    const corkBot = top + Math.round((bot - top) * 0.06);
    for (let y = top - 4; y <= corkBot; y++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        if (x >= 0 && x < 64 && y >= 0 && y < 128) {
          const lit = dx < 0 ? 0.5 : 0.25;
          pc.setPixel(x, y, tone(ck, lit));
        }
      }
    }

    // Simple label on body
    const labelTop = top + Math.round((bot - top) * 0.5);
    const labelBot = labelTop + 12;
    for (let y = labelTop; y <= labelBot; y++) {
      for (let dx = -12; dx <= 12; dx++) {
        const x = cx + dx;
        if (x >= 0 && x < 64 && y < 128) {
          pc.setPixel(x, y, tone(lb, 0.45 + (dx < 0 ? 0.1 : 0)));
        }
      }
    }
  },
};
