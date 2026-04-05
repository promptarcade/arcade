// Phase 3, Exercise 3.5: Master copy — reproduce a Stardew Valley-style turnip
// Training target: match professional palette and value structure exactly
// Reference: the chibi turnip we drew earlier, but now with proper colour temperature

module.exports = {
  width: 32,
  height: 36,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#e8c8dd',        // pale pink-white turnip body
    purple: '#8833aa',      // rich purple crown (cooler in shadow)
    leaf: '#44aa33',        // green leafy top
    leaflit: '#88cc44',     // warm yellow-green for lit leaf areas
    dirt: '#886633',        // warm brown root tip
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const pg = pal.groups.purple;
    const lg = pal.groups.leaf;
    const llg = pal.groups.leaflit;
    const dg = pal.groups.dirt;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 16, rootTop = 14;
    const lx = -0.55, ly = -0.65, lz = 0.52;

    // === LEAVES ===
    // Three leaves fanning upward — lit leaves use warm yellow-green, shadow uses cool green
    const leaves = [
      { tipX: cx, tipY: 1, baseL: cx - 4, baseR: cx + 4 },         // center (tallest)
      { tipX: cx - 7, tipY: 4, baseL: cx - 8, baseR: cx - 1 },     // left
      { tipX: cx + 7, tipY: 4, baseL: cx + 1, baseR: cx + 8 },     // right
    ];

    for (const leaf of leaves) {
      for (let y = leaf.tipY; y <= rootTop; y++) {
        const t = (y - leaf.tipY) / (rootTop - leaf.tipY);
        const left = Math.round(leaf.tipX + (leaf.baseL - leaf.tipX) * t);
        const right = Math.round(leaf.tipX + (leaf.baseR - leaf.tipX) * t);
        for (let x = left; x <= right; x++) {
          if (x < 0 || x >= 32 || y < 0 || y >= 36) continue;
          const xFrac = right > left ? (x - left) / (right - left) : 0.5;
          // Leaf normal: faces upward and outward
          const nx = (xFrac - 0.5) * 0.6;
          const ny = -0.7 + t * 0.3;
          const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny));
          const dot = Math.max(0, nx * lx + ny * ly + nz * lz);

          // Lit areas: warm yellow-green. Shadow: cool green.
          if (dot > 0.35) {
            pc.setPixel(x, y, tone(llg, 0.3 + dot * 0.6));
          } else {
            pc.setPixel(x, y, tone(lg, 0.15 + dot * 0.8));
          }
        }
      }
      // Leaf vein — center line, slightly darker
      for (let y = leaf.tipY + 1; y < rootTop - 1; y++) {
        const t = (y - leaf.tipY) / (rootTop - leaf.tipY);
        const vx = Math.round(leaf.tipX + ((leaf.baseL + leaf.baseR) / 2 - leaf.tipX) * t);
        if (vx >= 0 && vx < 32 && y >= 0 && y < 36) {
          pc.setPixel(vx, y, tone(lg, 0.55));
        }
      }
    }

    // === TURNIP ROOT BODY ===
    for (let row = 0; row < 19; row++) {
      const t = row / 18;
      let halfW;
      if (t < 0.12) halfW = Math.round(5 + 7 * (t / 0.12));
      else if (t < 0.5) halfW = Math.round(12 + 2 * Math.sin(((t - 0.12) / 0.38) * Math.PI / 2));
      else if (t < 0.8) halfW = Math.round(14 - 6 * ((t - 0.5) / 0.3));
      else halfW = Math.round(8 - 7 * ((t - 0.8) / 0.2));
      if (halfW <= 0) continue;

      const y = rootTop + row;
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 32 || y < 0 || y >= 36) continue;

        // Sphere-like normal for the bulb
        const nx = dx / (halfW + 1);
        const ny = (t - 0.4) * 0.8;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, nx * lx + ny * ly + nz * lz);

        let value = 0.1 + dot * 0.7;
        value = value * value * (3 - 2 * value);

        // Purple crown at top (rows 0-4)
        if (row < 5) {
          const purpleT = 1 - row / 4;
          if (purpleT > 0.3) {
            // Cool purple in shadow, warmer purple in light
            pc.setPixel(x, y, tone(pg, Math.max(0.05, value * 0.8)));
            continue;
          }
        }

        // Main body — pale pink, warmer in light
        pc.setPixel(x, y, tone(bg, Math.max(0.05, value)));
      }
    }

    // Root tip
    pc.setPixel(cx, rootTop + 18, tone(dg, 0.4));
    pc.setPixel(cx, rootTop + 19, tone(dg, 0.25));
    pc.setPixel(cx - 1, rootTop + 17, tone(dg, 0.35));
    pc.setPixel(cx + 1, rootTop + 17, tone(dg, 0.35));

    // Hair roots
    pc.setPixel(cx - 3, rootTop + 15, tone(dg, 0.3));
    pc.setPixel(cx + 4, rootTop + 13, tone(dg, 0.3));

    // Specular on body — small bright dot upper-left
    pc.setPixel(cx - 4, rootTop + 6, tone(bg, 1.0));
    pc.setPixel(cx - 3, rootTop + 6, tone(bg, 0.9));
    pc.setPixel(cx - 4, rootTop + 7, tone(bg, 0.85));
  },
};
