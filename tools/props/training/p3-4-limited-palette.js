// Phase 3, Exercise 3.4: Simple prop in extreme 5-colour constraint
// Training target: meaningful colour choices when every colour must earn its place
// Subject: a potion bottle — glass, liquid, cork, highlight

module.exports = {
  width: 32,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#2244aa',     // deep blue (glass + liquid + shadow in one ramp)
    cork: '#aa7744',     // warm brown
  },
  // Only 2 colour groups × 4 tones = 8 palette slots.
  // But we challenge ourselves to use only 5 distinct values total.

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const b = pal.groups.body;
    const c = pal.groups.cork;
    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 16, neckTop = 8, neckBot = 16, bodyTop = 16, bodyBot = 42;
    const neckW = 4, bodyW = 11;

    // Cork (top)
    for (let y = neckTop - 4; y < neckTop + 1; y++) {
      for (let x = cx - neckW - 1; x <= cx + neckW + 1; x++) {
        if (x < 0 || x >= 32 || y < 0 || y >= 48) continue;
        const xFrac = (x - cx) / (neckW + 1);
        const yFrac = (y - (neckTop - 4)) / 4;
        // Cork is a small cylinder
        const lit = Math.max(0, -xFrac * 0.5 + 0.5);
        pc.setPixel(x, y, tone(c, 0.2 + lit * 0.6));
      }
    }

    // Neck
    for (let y = neckTop; y <= neckBot; y++) {
      for (let x = cx - neckW; x <= cx + neckW; x++) {
        if (x < 0 || x >= 32 || y < 0 || y >= 48) continue;
        const xFrac = (x - cx) / neckW;
        const lit = Math.max(0, 1 - Math.abs(xFrac + 0.3) * 1.5);
        pc.setPixel(x, y, tone(b, 0.3 + lit * 0.4));
      }
    }

    // Body — round bottle
    for (let y = bodyTop; y <= bodyBot; y++) {
      const yFrac = (y - bodyTop) / (bodyBot - bodyTop);
      // Bottle profile: narrow at top, wide in middle, narrower at bottom
      let halfW;
      if (yFrac < 0.15) halfW = Math.round(neckW + (bodyW - neckW) * (yFrac / 0.15));
      else if (yFrac < 0.7) halfW = bodyW;
      else halfW = Math.round(bodyW * (1 - (yFrac - 0.7) / 0.3 * 0.15));

      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x < 0 || x >= 32 || y < 0 || y >= 48) continue;
        const xFrac = (x - cx) / halfW;

        // Cylinder-like lighting across the body
        const lit = Math.max(0, 1 - Math.abs(xFrac + 0.3) * 1.3);
        // Darker liquid at bottom
        const liquidDark = yFrac > 0.4 ? (yFrac - 0.4) * 0.15 : 0;

        pc.setPixel(x, y, tone(b, Math.max(0.05, 0.2 + lit * 0.55 - liquidDark)));
      }
    }

    // Glass highlight — vertical bright streak on left side
    for (let y = bodyTop + 3; y < bodyBot - 4; y++) {
      const yFrac = (y - bodyTop) / (bodyBot - bodyTop);
      if (yFrac < 0.1 || yFrac > 0.85) continue;
      const halfW = yFrac < 0.15 ? neckW : bodyW;
      const hx = cx - Math.round(halfW * 0.45);
      if (hx >= 0 && hx < 32 && y >= 0 && y < 48) {
        pc.setPixel(hx, y, tone(b, 0.85));
        if (hx + 1 < 32) pc.setPixel(hx + 1, y, tone(b, 0.7));
      }
    }

    // Specular dot — tiny, bright, upper-left of body
    pc.setPixel(cx - 5, bodyTop + 4, tone(b, 1.0));
    pc.setPixel(cx - 4, bodyTop + 3, tone(b, 0.9));

    // Liquid level line — subtle horizontal mark
    const liquidY = bodyTop + Math.round((bodyBot - bodyTop) * 0.38);
    const lw = bodyW - 2;
    for (let x = cx - lw; x <= cx + lw; x++) {
      if (x >= 0 && x < 32) {
        pc.setPixel(x, liquidY, tone(b, 0.55));
      }
    }

    // Bottom flat edge
    for (let x = cx - bodyW + 1; x <= cx + bodyW - 1; x++) {
      if (x >= 0 && x < 32 && bodyBot < 48) {
        pc.setPixel(x, bodyBot, tone(b, 0.08));
        pc.setPixel(x, bodyBot + 1, tone(b, 0.04));
      }
    }
  },
};
