// Phase 6C.3: Whole Roast Chicken — SHADED (silhouette verified)
// Golden brown skin, drumsticks, breast, on white plate

module.exports = {
  width: 128, height: 96, style: 'hd', entityType: 'prop', outlineMode: 'none',
  colors: {
    skin: '#cc8833', skinshd: '#884422', bone: '#eeddcc',
    plate: '#eeeedd', plateshd: '#bbaa99', highlight: '#ffddaa',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.skin.startIdx); },
  drawPost(pc, pal) {
    const sk = pal.groups.skin, ss = pal.groups.skinshd, bn = pal.groups.bone;
    const pl = pal.groups.plate, ps = pal.groups.plateshd, hg = pal.groups.highlight;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;
    const cx = 64, cy = 42, lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(77);

    // PLATE
    const plateY = cy + 28, plateRX = 54, plateRY = 9;
    for (let y = plateY - plateRY; y <= plateY + plateRY + 4; y++) {
      for (let x = cx - plateRX - 1; x <= cx + plateRX + 1; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        if (y <= plateY + plateRY) {
          const dx = (x - cx) / plateRX, dy = (y - plateY) / plateRY;
          if (dx * dx + dy * dy <= 1) {
            const pnx = dx * 0.3, pnz = Math.sqrt(Math.max(0.1, 1 - pnx * pnx));
            let pv = 0.25 + Math.max(0, lx * pnx + ly * (-0.5) + lz * pnz) * 0.5;
            pv = pv * pv * (3 - 2 * pv);
            pc.setPixel(x, y, tone(pv > 0.45 ? pl : ps, Math.max(0.1, pv)));
          }
        } else {
          const sW = Math.round(plateRX * (1 - (y - plateY - plateRY) / 4 * 0.05));
          if (Math.abs(x - cx) <= sW) pc.setPixel(x, y, tone(ps, 0.15));
        }
      }
    }

    // BODY — large oval, golden brown roast skin
    const bodyRX = 38, bodyRY = 24;
    for (let y = cy - bodyRY; y <= cy + bodyRY; y++) {
      for (let x = cx - bodyRX; x <= cx + bodyRX; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / bodyRX, dy = (y - cy) / bodyRY;
        let rMod = 1;
        if (dy > 0.5) rMod += (dy - 0.5) * 0.2;
        if (dx * dx + dy * dy > rMod * rMod) continue;

        const nx = dx / rMod * 0.8, ny = dy / rMod * 0.7;
        const nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        const spec = Math.pow(Math.max(0, 2 * (nx * lx + ny * ly + nz * lz) * nz - lz), 20) * 0.2;
        const bounce = Math.max(0, ny * 0.25) * 0.08;

        let v = 0.08 + dot * 0.6 + spec + bounce;
        // Roast skin texture
        v += (rng() - 0.5) * 0.03;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.4 ? sk : ss, Math.max(0.04, v)));
      }
    }

    // Breast mound
    for (let y = cy - bodyRY - 3; y <= cy - bodyRY + 8; y++) {
      for (let x = cx - 14; x <= cx + 14; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / 14, dy = (y - (cy - bodyRY + 2)) / 6;
        if (dx * dx + dy * dy > 1 || dy > 0) continue;
        const nz = Math.sqrt(Math.max(0.1, 1 - dx * dx * 0.5));
        const dot = Math.max(0, ly * (-0.7) + lz * nz);
        let v = 0.15 + dot * 0.55;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.4 ? sk : ss, Math.max(0.05, v)));
      }
    }

    // DRUMSTICKS — asymmetric (natural objects aren't perfectly mirrored)
    const legs = [
      { bx: cx - 18, by: cy + bodyRY - 9, tx: cx - 38, ty: cy + bodyRY + 8 },   // left: wider angle, slightly shorter
      { bx: cx + 22, by: cy + bodyRY - 6, tx: cx + 34, ty: cy + bodyRY + 14 },   // right: steeper angle, longer
    ];
    for (const leg of legs) {
      const legBX = leg.bx, legBY = leg.by;
      const legTX = leg.tx, legTY = leg.ty;
      const dx = legTX - legBX, dy = legTY - legBY;
      const len = Math.sqrt(dx * dx + dy * dy);
      const perpX = -dy / len, perpY = dx / len;

      for (let t = 0; t <= 1; t += 0.004) {
        const px0 = legBX + dx * t, py0 = legBY + dy * t;
        const w = Math.round(7 * (1 - t * 0.55));
        for (let across = -w; across <= w; across++) {
          const px = Math.round(px0 + perpX * across), py = Math.round(py0 + perpY * across);
          if (px < 0 || px >= 128 || py < 0 || py >= 96) continue;
          const cf = across / (w + 1);
          const cnz = Math.sqrt(Math.max(0.1, 1 - cf * cf));
          const dot = Math.max(0, perpX * cf * lx + cnz * lz);
          let v = 0.1 + dot * 0.55;
          v = v * v * (3 - 2 * v);
          pc.setPixel(px, py, tone(v > 0.35 ? sk : ss, Math.max(0.04, v)));
        }
      }

      // Bone tip
      const boneR = 3;
      for (let bdy = -boneR; bdy <= boneR; bdy++) {
        for (let bdx = -boneR; bdx <= boneR; bdx++) {
          if (bdx * bdx + bdy * bdy > boneR * boneR) continue;
          const px = Math.round(legTX) + bdx, py = Math.round(legTY) + bdy;
          if (px >= 0 && px < 128 && py >= 0 && py < 96) {
            const d = Math.sqrt(bdx * bdx + bdy * bdy) / boneR;
            pc.setPixel(px, py, tone(bn, 0.4 + (1 - d) * 0.4));
          }
        }
      }
    }

    // Specular on body — glossy roasted skin
    const specX = cx - 12, specY = cy - 8;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy) / 5;
        if (d < 1) {
          const px = specX + dx, py = specY + dy;
          if (px >= 0 && px < 128 && py >= 0 && py < 96) {
            pc.setPixel(px, py, tone(hg, 0.5 + (1 - d) * 0.4));
          }
        }
      }
    }

    // Contact shadow on plate
    for (let dx = -30; dx <= 30; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 128 && cy + bodyRY + 1 < 96) {
        pc.setPixel(x, cy + bodyRY + 1, tone(ss, 0.06 * (1 - Math.abs(dx) / 30)));
      }
    }
  },
};
