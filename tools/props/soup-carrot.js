// Soup Shop — Carrot (96x96, HD tier)
// Orange tapered root with green leafy top
// Apply training: sphere normals on body, colour temp shift, individual leaf detail

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#ee8833',
    bodyshd: '#aa5522',
    leaf: '#55aa33',
    leaflit: '#88cc44',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const bs = pal.groups.bodyshd;
    const lg = pal.groups.leaf;
    const ll = pal.groups.leaflit;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(42);

    // === CARROT BODY — tapered cylinder with slight curve ===
    const bodyTop = 30, bodyBot = 90;
    for (let y = bodyTop; y <= bodyBot; y++) {
      const t = (y - bodyTop) / (bodyBot - bodyTop); // 0=top, 1=tip
      // Taper: wide at top, narrow at tip. Slight rightward curve.
      const curveX = Math.sin(t * 0.8) * 4;
      const halfW = Math.round(18 * (1 - t * 0.85));
      if (halfW < 1) {
        // Tip pixel
        const px = Math.round(cx + curveX);
        if (px >= 0 && px < 96) pc.setPixel(px, y, tone(bs, 0.25));
        continue;
      }

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = Math.round(cx + curveX + dx);
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;

        // Cylinder normal
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + ly * (-0.15) + lz * nz);

        // Phong specular — carrots are slightly shiny
        const NdotL = nx * lx + nz * lz;
        const rr = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rr), 30) * 0.25;

        let v = 0.08 + dot * 0.65 + specular;
        // Darken toward tip
        v *= 1 - t * 0.2;
        v = v * v * (3 - 2 * v);
        v = Math.max(0.03, Math.min(1, v));

        // Colour temp: lit = warm orange, shadow = cool dark orange
        pc.setPixel(x, y, tone(v > 0.35 ? bg : bs, v));
      }

      // Horizontal ring lines — carrots have visible growth rings
      if (t > 0.05 && t < 0.9 && Math.round(t * 25) % 3 === 0) {
        for (let dx = -halfW + 2; dx <= halfW - 2; dx++) {
          const x = Math.round(cx + curveX + dx);
          if (x >= 0 && x < 96) {
            pc.setPixel(x, y, tone(bs, 0.22 + Math.abs(dx / halfW) * 0.08));
          }
        }
      }
    }

    // Surface texture — subtle lengthwise streaks
    for (let streak = 0; streak < 12; streak++) {
      const startDX = (rng() - 0.5) * 28;
      const grainTone = 0.2 + rng() * 0.15;
      for (let y = bodyTop + 4; y < bodyBot - 8; y++) {
        const t = (y - bodyTop) / (bodyBot - bodyTop);
        const curveX = Math.sin(t * 0.8) * 4;
        const halfW = Math.round(18 * (1 - t * 0.85));
        const sx = Math.round(cx + curveX + startDX * (1 - t * 0.85));
        if (sx >= 0 && sx < 96 && Math.abs(sx - cx - curveX) < halfW - 2 && rng() < 0.5) {
          if (pc.isFilled(sx, y)) pc.setPixel(sx, y, tone(bs, grainTone));
        }
      }
    }

    // === GREEN LEAFY TOP — 3-4 leaves fanning upward ===
    const leaves = [
      { tipX: cx - 8, tipY: 3, baseX: cx - 3, angle: -0.3 },
      { tipX: cx, tipY: 0, baseX: cx, angle: 0 },
      { tipX: cx + 6, tipY: 2, baseX: cx + 2, angle: 0.25 },
      { tipX: cx + 12, tipY: 6, baseX: cx + 4, angle: 0.4 },
    ];

    for (const leaf of leaves) {
      for (let along = 0; along < 28; along++) {
        const t = along / 27;
        const lx2 = leaf.tipX + (leaf.baseX - leaf.tipX) * t;
        const ly2 = leaf.tipY + (bodyTop - leaf.tipY) * t;
        const width = Math.round(2 + Math.sin(t * Math.PI) * 5);

        for (let across = -width; across <= width; across++) {
          const px = Math.round(lx2 + across * Math.cos(leaf.angle + 1.57));
          const py = Math.round(ly2 + across * Math.sin(leaf.angle + 1.57));
          if (px < 0 || px >= 96 || py < 0 || py >= 96) continue;

          // Leaf normal
          const lnx = across / (width + 1) * 0.5 + Math.sin(leaf.angle) * 0.3;
          const lny = -0.6 + t * 0.3;
          const lnz = Math.sqrt(Math.max(0.05, 1 - lnx * lnx - lny * lny));
          const dot = Math.max(0, lx * lnx + ly * lny + lz * lnz);

          let v = 0.1 + dot * 0.7;
          v = v * v * (3 - 2 * v);

          // Warm lit = yellow-green, cool shadow = deep green
          pc.setPixel(px, py, tone(v > 0.4 ? ll : lg, Math.max(0.03, v)));
        }

        // Leaf vein — center line, slightly darker
        const vx = Math.round(lx2), vy = Math.round(ly2);
        if (vx >= 0 && vx < 96 && vy >= 0 && vy < 96 && t > 0.1) {
          pc.setPixel(vx, vy, tone(lg, 0.35));
        }
      }
    }

    // Specular on carrot body — broad highlight upper-left
    const specY = bodyTop + 12;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const px = cx - 6 + dx, py = specY + dy;
        if (px >= 0 && px < 96 && py >= 0 && py < 96 && pc.isFilled(px, py)) {
          const d = Math.sqrt(dx * dx + dy * dy) / 4;
          if (d < 1) pc.setPixel(px, py, tone(bg, 0.8 + (1 - d) * 0.2));
        }
      }
    }
  },
};
