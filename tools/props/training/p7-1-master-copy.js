// Phase 7.1: Master copy — a game-ready health potion bottle
// Apply EVERYTHING: construction (verified bottle profile from 6A.5),
// glass material (Phase 5.3), colour (Phase 3), liquid inside.
// This should look like it belongs in a published RPG.

module.exports = {
  width: 64, height: 96, style: 'hd', entityType: 'prop', outlineMode: 'none',
  colors: {
    glass: '#88bbcc', glassshd: '#334455',
    liquid: '#cc2244', liquidshd: '#661122',
    cork: '#aa8855', corkshd: '#775533',
    highlight: '#eeffff',
    label: '#ddccaa',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.glass.startIdx); },
  drawPost(pc, pal) {
    const gg = pal.groups.glass, gs = pal.groups.glassshd;
    const lg = pal.groups.liquid, ls = pal.groups.liquidshd;
    const cg = pal.groups.cork, css = pal.groups.corkshd;
    const hg = pal.groups.highlight, lb = pal.groups.label;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;
    const cx = 32, lx = -0.5, ly = -0.6, lz = 0.63;
    const top = 12, bot = 84;

    // VERIFIED PROFILE from 6A.5
    function profile(t) {
      if (t < 0.03) return 5;  // mouth
      if (t < 0.28) return 4;  // neck
      if (t < 0.40) { const s = (t - 0.28) / 0.12; return Math.round(4 + 16 * s * s * (3 - 2 * s)); } // shoulder
      if (t < 0.88) return Math.round(20 - ((t - 0.40) / 0.48) * 2); // body tapers slightly
      return Math.round(20 - 2 - ((t - 0.88) / 0.12) * 3); // base
    }

    const liquidTopT = 0.35; // liquid fills from shoulder down
    const corkTopT = 0.0, corkBotT = 0.08;

    // CORK
    for (let y = top; y <= top + Math.round((bot - top) * corkBotT); y++) {
      const t = (y - top) / (bot - top);
      const halfW = Math.round(profile(t) * 1.1); // cork slightly wider than neck
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 64 || y >= 96) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        let v = 0.15 + dot * 0.5;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.35 ? cg : css, Math.max(0.06, v)));
      }
    }

    // GLASS BODY — Fresnel transparency + liquid
    for (let y = top + Math.round((bot - top) * corkBotT); y <= bot; y++) {
      const t = (y - top) / (bot - top);
      const halfW = Math.round(profile(t));
      if (halfW < 1) continue;
      const inLiquid = t >= liquidTopT;

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 64 || y >= 96) continue;
        const xFrac = dx / (halfW + 1);
        const thickness = Math.abs(xFrac);
        const nz = Math.sqrt(Math.max(0.05, 1 - xFrac * xFrac));
        const fresnel = Math.pow(1 - nz, 2) * 0.5 + 0.12;
        const NdotL = xFrac * lx + nz * lz;
        const dot = Math.max(0, NdotL);
        const spec = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 55) * 0.4;

        if (inLiquid) {
          if (thickness < 0.5) {
            // Liquid visible through centre
            let lv = 0.12 + dot * 0.35;
            lv = lv * lv * (3 - 2 * lv);
            pc.setPixel(x, y, tone(lv > 0.25 ? lg : ls, Math.max(0.04, lv)));
          } else {
            // Glass edge tints the liquid
            pc.setPixel(x, y, tone(ls, Math.max(0.03, fresnel * 0.3 + dot * 0.1)));
          }
        } else {
          // Empty glass above liquid
          if (thickness < 0.45) {
            pc.setPixel(x, y, tone(gg, fresnel * 0.25));
          } else {
            let gv = fresnel + dot * 0.2 + spec;
            gv = gv * gv * (3 - 2 * gv);
            pc.setPixel(x, y, tone(gv > 0.4 ? gg : gs, Math.max(0.04, gv)));
          }
        }
      }
    }

    // Liquid meniscus
    const meniscusY = top + Math.round((bot - top) * liquidTopT);
    const meniscusHW = Math.round(profile(liquidTopT));
    for (let dx = -meniscusHW + 2; dx <= meniscusHW - 2; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 64 && meniscusY >= 0 && meniscusY < 96) {
        pc.setPixel(x, meniscusY, tone(hg, 0.2 + (1 - Math.abs(dx) / meniscusHW) * 0.2));
        if (meniscusY + 1 < 96) pc.setPixel(x, meniscusY + 1, tone(lg, 0.4));
      }
    }

    // Left edge reflection streak
    for (let y = top + 5; y < bot - 3; y++) {
      const t = (y - top) / (bot - top);
      const halfW = profile(t);
      if (halfW < 3) continue;
      const hx = cx - halfW + 1;
      if (hx >= 0 && hx + 1 < 64 && y < 96) {
        pc.setPixel(hx, y, tone(hg, 0.55));
        pc.setPixel(hx + 1, y, tone(gg, 0.4));
      }
    }

    // Specular on shoulder
    const specY = top + Math.round((bot - top) * 0.32);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy) / 3;
        if (d < 1) {
          const px = cx - 8 + dx, py = specY + dy;
          if (px >= 0 && px < 64 && py >= 0 && py < 96) {
            pc.setPixel(px, py, tone(hg, 0.7 + (1 - d) * 0.3));
          }
        }
      }
    }

    // Small label on body
    const labelTop = top + Math.round((bot - top) * 0.55);
    const labelBot = top + Math.round((bot - top) * 0.72);
    for (let y = labelTop; y <= labelBot; y++) {
      const t = (y - top) / (bot - top);
      const halfW = Math.round(profile(t) * 0.7);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 64 || y >= 96) continue;
        const nx = dx / (profile(t) + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        let lv = 0.2 + dot * 0.5;
        lv = lv * lv * (3 - 2 * lv);
        pc.setPixel(x, y, tone(lb, Math.max(0.1, lv)));
      }
    }

    // Mouth ellipse
    for (let y = top - 2; y <= top + 2; y++) {
      for (let x = cx - 5; x <= cx + 5; x++) {
        if (x < 0 || x >= 64 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / 5, dy = (y - top) / 2;
        if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, tone(gs, 0.06 + (1 - Math.sqrt(dx * dx + dy * dy)) * 0.08));
      }
    }

    // Base + shadow
    for (let dx = -15; dx <= 15; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 64 && bot + 1 < 96) { pc.setPixel(x, bot, tone(gs, 0.06)); pc.setPixel(x, bot + 1, tone(gs, 0.03)); }
    }
  },
};
