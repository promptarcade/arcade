// Treasure Chest — HD tier (256x256)
// Sea of Stars style: 8-tone palette for smooth wood gradients.
// Uses tone() helper for palette-agnostic color references.

module.exports = {
  width: 256,
  height: 256,
  style: 'hd',
  entityType: 'prop',
  colors: {
    wood: '#8b5e3c',
    darkwood: '#5c3a1e',
    metal: '#b8a030',
    clasp: '#ddc040',
    iron: '#667788',
    lining: '#cc3344',
  },

  draw(pc, pal) {
    const wg = pal.groups.wood;
    const dwg = pal.groups.darkwood;
    const mg = pal.groups.metal;
    const cg = pal.groups.clasp;
    const ig = pal.groups.iron;
    const lg = pal.groups.lining;

    function tone(group, frac) {
      const idx = Math.round(frac * (group.toneCount - 1));
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1, idx));
    }

    const cx = 128;
    const chestLeft = 30, chestRight = 226;
    const chestW = (chestRight - chestLeft) / 2;
    const chestBot = 205, chestMid = 130, lidTopCenter = 52;
    const rng = sf2_seededRNG(101);

    // === GROUND SHADOW ===
    pc.fillEllipse(cx, chestBot + 8, chestW - 8, 8, tone(dwg, 0.0));
    pc.fillEllipse(cx, chestBot + 8, chestW + 2, 11, tone(dwg, 0.05));
    pc.fillEllipse(cx, chestBot + 6, chestW - 20, 5, tone(dwg, 0.0));

    // === CHEST BASE ===
    pc.fillRect(chestLeft, chestMid, chestRight - chestLeft, chestBot - chestMid, tone(wg, 0.6));

    // Vertical plank divisions
    const plankWidth = Math.floor((chestRight - chestLeft) / 5);
    for (let p = 1; p < 5; p++) {
      const px = chestLeft + p * plankWidth;
      pc.vline(px, chestMid + 2, chestBot - chestMid - 4, tone(dwg, 0.3));
      pc.vline(px + 1, chestMid + 2, chestBot - chestMid - 4, tone(dwg, 0.45));
    }

    // Horizontal plank seams
    const plankY1 = chestMid + Math.round((chestBot - chestMid) * 0.33);
    const plankY2 = chestMid + Math.round((chestBot - chestMid) * 0.66);
    pc.hline(chestLeft + 2, plankY1, chestRight - chestLeft - 4, tone(dwg, 0.25));
    pc.hline(chestLeft + 2, plankY2, chestRight - chestLeft - 4, tone(dwg, 0.25));

    // === DENSE WOOD GRAIN — front face ===
    for (let x = chestLeft + 2; x < chestRight - 2; x += 3) {
      const grainWobble = Math.round(rng() * 2 - 1);
      for (let y = chestMid + 2; y < chestBot - 2; y++) {
        if (rng() < 0.28) {
          const gx = x + grainWobble + Math.round(Math.sin(y * 0.06) * 1.2);
          if (gx >= chestLeft && gx < chestRight && pc.isFilled(gx, y)) {
            // Vary grain tone for richness
            const grainTone = 0.3 + rng() * 0.2;
            pc.setPixel(gx, y, tone(dwg, grainTone));
          }
        }
        if (rng() < 0.001) {
          pc.fillCircle(x, y, 2, tone(dwg, 0.2));
          pc.setPixel(x, y, tone(dwg, 0.05));
        }
      }
    }

    // Front face gradient — left shadow, warm center, right shadow
    for (let y = chestMid + 1; y < chestBot; y++) {
      // Left edge shadow (gradient from dark to mid)
      for (let dx = 0; dx < 16; dx++) {
        const x = chestLeft + dx;
        const t = dx / 15;
        if (pc.isFilled(x, y) && rng() < (1 - t) * 0.6) {
          pc.setPixel(x, y, tone(wg, 0.15 + t * 0.3));
        }
      }
      // Right edge subtle shadow
      for (let dx = 0; dx < 10; dx++) {
        const x = chestRight - 1 - dx;
        const t = dx / 9;
        if (pc.isFilled(x, y) && rng() < (1 - t) * 0.35) {
          pc.setPixel(x, y, tone(wg, 0.25 + t * 0.2));
        }
      }
    }
    // Bottom gradient — darkens toward base
    for (let y = chestBot - 30; y < chestBot; y++) {
      const t = (y - (chestBot - 30)) / 30;
      for (let x = chestLeft + 4; x < chestRight - 4; x++) {
        if (pc.isFilled(x, y) && rng() < t * 0.35) {
          pc.setPixel(x, y, tone(wg, 0.1 + (1 - t) * 0.15));
        }
      }
    }

    // === BARREL-VAULT LID ===
    const lidH = chestMid - lidTopCenter;
    for (let y = lidTopCenter; y <= chestMid; y++) {
      const t = (chestMid - y) / lidH;
      const halfW = Math.round(chestW * Math.sqrt(1 - t * t * 0.85));
      // Smooth gradient: brighter at top of arc, darker near base
      const toneFrac = 0.35 + t * 0.55; // 0.35 at base, 0.9 at top
      pc.hline(cx - halfW, y, halfW * 2 + 1, tone(wg, toneFrac));
    }

    // Lid grain
    for (let y = lidTopCenter + 3; y < chestMid - 3; y++) {
      const t = (chestMid - y) / lidH;
      const halfW = Math.round(chestW * Math.sqrt(1 - t * t * 0.85));
      for (let x = cx - halfW + 4; x < cx + halfW - 4; x += 3) {
        if (rng() < 0.22 && pc.isFilled(x, y)) {
          pc.setPixel(x, y, tone(dwg, 0.35 + rng() * 0.2));
        }
      }
    }

    // Lid highlight — bright band on upper-left
    for (let y = lidTopCenter + 8; y < lidTopCenter + Math.round(lidH * 0.35); y++) {
      const t = (chestMid - y) / lidH;
      const halfW = Math.round(chestW * Math.sqrt(1 - t * t * 0.85));
      for (let x = cx - Math.round(halfW * 0.7); x < cx - Math.round(halfW * 0.05); x++) {
        if (pc.isFilled(x, y) && rng() < 0.45) {
          pc.setPixel(x, y, tone(wg, 0.85 + rng() * 0.15));
        }
      }
    }

    // Lid edge shadows
    for (let y = lidTopCenter + 4; y < chestMid; y++) {
      const t = (chestMid - y) / lidH;
      const halfW = Math.round(chestW * Math.sqrt(1 - t * t * 0.85));
      if (halfW > 8) {
        pc.setPixel(cx - halfW + 1, y, tone(dwg, 0.0));
        pc.setPixel(cx - halfW + 2, y, tone(dwg, 0.15));
        pc.setPixel(cx + halfW - 1, y, tone(wg, 0.15));
      }
    }

    // === SEAM ===
    pc.hline(chestLeft, chestMid - 1, chestRight - chestLeft, tone(lg, 0.7));
    pc.hline(chestLeft, chestMid, chestRight - chestLeft, tone(lg, 0.3));
    pc.hline(chestLeft, chestMid + 1, chestRight - chestLeft, tone(dwg, 0.0));

    // === METAL BANDS ===
    function drawBand(bandY, halfW, curved) {
      for (let dy = -4; dy <= 4; dy++) {
        const y = bandY + dy;
        // Smooth gradient across band height
        const bandT = (dy + 4) / 8; // 0 at top, 1 at bottom
        const bandTone = bandT < 0.3 ? 0.85 : bandT < 0.6 ? 0.6 : 0.35;
        if (curved) {
          const t = (chestMid - y) / lidH;
          const hw = Math.round(chestW * Math.sqrt(1 - Math.max(0, t * t * 0.85)));
          if (hw > 4) pc.hline(cx - hw + 2, y, hw * 2 - 4, tone(mg, bandTone));
        } else {
          pc.hline(chestLeft + 2, y, chestRight - chestLeft - 4, tone(mg, bandTone));
        }
      }
    }

    // Lid band
    drawBand(chestMid - Math.round(lidH * 0.5), chestW, true);
    // Front top band
    drawBand(chestMid + 14, chestW, false);
    // Front bottom band
    drawBand(chestBot - 16, chestW, false);

    // Base bottom trim
    pc.hline(chestLeft, chestBot - 1, chestRight - chestLeft, tone(dwg, 0.05));
    pc.hline(chestLeft, chestBot, chestRight - chestLeft, tone(dwg, 0.0));

    // === CLASP ===
    const claspTopY = chestMid - 14;

    // Upper clasp
    pc.fillRect(cx - 10, claspTopY, 20, 10, tone(cg, 0.6));
    pc.hline(cx - 10, claspTopY, 20, tone(cg, 0.9));
    pc.vline(cx - 10, claspTopY + 1, 9, tone(cg, 0.3));
    pc.vline(cx + 9, claspTopY + 1, 9, tone(cg, 0.8));
    pc.fillRect(cx - 7, claspTopY + 3, 14, 5, tone(cg, 0.5));

    // Lower clasp
    pc.fillRect(cx - 16, chestMid + 3, 32, 28, tone(cg, 0.6));
    pc.hline(cx - 16, chestMid + 3, 32, tone(cg, 0.9));
    pc.hline(cx - 16, chestMid + 30, 32, tone(cg, 0.15));
    pc.vline(cx - 16, chestMid + 4, 26, tone(cg, 0.3));
    pc.vline(cx + 15, chestMid + 4, 26, tone(cg, 0.8));
    pc.fillRect(cx - 13, chestMid + 6, 26, 22, tone(cg, 0.4));
    pc.fillRect(cx - 11, chestMid + 7, 22, 20, tone(cg, 0.55));

    // Keyhole
    pc.fillCircle(cx, chestMid + 14, 5, tone(dwg, 0.0));
    pc.fillRect(cx - 2, chestMid + 14, 5, 10, tone(dwg, 0.0));
    pc.fillCircle(cx, chestMid + 14, 3, tone(dwg, 0.12));
    pc.fillRect(cx - 1, chestMid + 15, 3, 7, tone(dwg, 0.12));
    pc.fillCircle(cx, chestMid + 14, 2, tone(dwg, 0.0));
    pc.fillRect(cx - 1, chestMid + 15, 2, 6, tone(dwg, 0.0));

    // === RIVETS ===
    const rivetY1 = chestMid + 14, rivetY2 = chestBot - 16;
    const rivetXs = [chestLeft + 22, chestLeft + 54, chestRight - 54, chestRight - 22];
    for (const rx of rivetXs) {
      for (const ry of [rivetY1, rivetY2]) {
        pc.fillCircle(rx, ry, 4, tone(ig, 0.5));
        pc.fillCircle(rx, ry, 3, tone(ig, 0.35));
        pc.setPixel(rx - 1, ry - 2, tone(ig, 0.9));
        pc.setPixel(rx - 2, ry - 1, tone(ig, 0.85));
        pc.setPixel(rx + 1, ry + 2, tone(ig, 0.05));
        pc.setPixel(rx + 2, ry + 1, tone(ig, 0.1));
      }
    }

    // === CORNER BRACKETS ===
    const cornerSize = 20;
    // Top-left
    pc.fillRect(chestLeft, chestMid + 2, cornerSize, 5, tone(mg, 0.55));
    pc.fillRect(chestLeft, chestMid + 2, 5, cornerSize, tone(mg, 0.55));
    pc.hline(chestLeft, chestMid + 2, cornerSize, tone(mg, 0.85));
    pc.vline(chestLeft, chestMid + 2, cornerSize, tone(mg, 0.3));
    // Top-right
    pc.fillRect(chestRight - cornerSize, chestMid + 2, cornerSize, 5, tone(mg, 0.6));
    pc.fillRect(chestRight - 5, chestMid + 2, 5, cornerSize, tone(mg, 0.6));
    pc.hline(chestRight - cornerSize, chestMid + 2, cornerSize, tone(mg, 0.85));
    pc.vline(chestRight - 1, chestMid + 2, cornerSize, tone(mg, 0.8));
    // Bottom-left
    pc.fillRect(chestLeft, chestBot - 6, cornerSize, 5, tone(mg, 0.35));
    pc.fillRect(chestLeft, chestBot - cornerSize, 5, cornerSize, tone(mg, 0.35));
    // Bottom-right
    pc.fillRect(chestRight - cornerSize, chestBot - 6, cornerSize, 5, tone(mg, 0.5));
    pc.fillRect(chestRight - 5, chestBot - cornerSize, 5, cornerSize, tone(mg, 0.5));

    // === LEFT EDGE SHADOW ===
    for (let y = chestMid + 2; y < chestBot; y++) {
      pc.setPixel(chestLeft, y, tone(dwg, 0.0));
      pc.setPixel(chestLeft + 1, y, tone(dwg, 0.05));
      pc.setPixel(chestLeft + 2, y, tone(dwg, 0.15));
    }
    for (let y = chestMid + 2; y < chestBot; y++) {
      pc.setPixel(chestRight - 1, y, tone(wg, 0.2));
    }
  },

  drawPost(pc, pal) {
    const cg = pal.groups.clasp;
    const mg = pal.groups.metal;
    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1, Math.round(frac * (group.toneCount - 1))));
    }
    const cx = 128;
    // Clasp highlights
    pc.setPixel(cx - 10, 117, tone(cg, 0.95));
    pc.setPixel(cx - 9, 118, tone(cg, 0.9));
    // Metal band highlights
    pc.setPixel(cx - 60, 143, tone(mg, 0.95));
    pc.setPixel(cx + 60, 143, tone(mg, 0.9));
  },
};
