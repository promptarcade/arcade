// Phase 6B.4: Treasure Chest — SHADED (silhouette verified: barrel-vault lid + box)

module.exports = {
  width: 128,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    wood: '#8b5e3c',
    woodshd: '#5c3a1e',
    metal: '#b8a030',
    metalshd: '#886622',
    iron: '#667788',
    ironshd: '#445566',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.wood.startIdx); },

  drawPost(pc, pal) {
    const wg = pal.groups.wood;
    const ws = pal.groups.woodshd;
    const mg = pal.groups.metal;
    const ms = pal.groups.metalshd;
    const ig = pal.groups.iron;
    const is = pal.groups.ironshd;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 64, lx = -0.5, ly = -0.6, lz = 0.63;
    const chestLeft = 16, chestRight = 112;
    const lidTopY = 12, seamY = 42, boxBotY = 82;
    const chestW = (chestRight - chestLeft) / 2;
    const rng = sf2_seededRNG(42);

    // BOX — front face with wood grain
    for (let y = seamY; y <= boxBotY; y++) {
      for (let x = chestLeft; x <= chestRight; x++) {
        if (x >= 128 || y >= 96) continue;
        const nx = (x - cx) / chestW * 0.15;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        let v = 0.15 + dot * 0.45 - ((y - seamY) / (boxBotY - seamY)) * 0.06;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.35 ? wg : ws, Math.max(0.05, v)));
      }
    }

    // Wood grain on front face
    for (let gx = chestLeft + 3; gx < chestRight - 3; gx += 3) {
      const drift = (rng() - 0.5) * 1.5;
      const grainT = 0.2 + rng() * 0.15;
      for (let y = seamY + 2; y < boxBotY - 2; y++) {
        const x = Math.round(gx + drift + Math.sin(y * 0.06) * 1);
        if (x >= chestLeft && x < chestRight && y < 96 && rng() < 0.3) {
          pc.setPixel(x, y, tone(ws, grainT));
        }
      }
    }

    // LID — barrel vault with gradient
    for (let y = lidTopY; y <= seamY; y++) {
      const t = (seamY - y) / (seamY - lidTopY);
      const halfW = Math.round(chestW * Math.sqrt(1 - t * t * 0.7));
      const lidTone = 0.2 + t * 0.45; // brighter at top
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const nx = (x - cx) / (halfW + 1) * 0.3;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        let v = lidTone + Math.max(0, lx * nx + lz * nz) * 0.15;
        v += (rng() - 0.5) * 0.02;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.38 ? wg : ws, Math.max(0.05, v)));
      }
    }

    // Lid grain
    for (let gx = cx - chestW + 5; gx < cx + chestW - 5; gx += 4) {
      for (let y = lidTopY + 2; y < seamY - 1; y++) {
        const t = (seamY - y) / (seamY - lidTopY);
        const halfW = Math.round(chestW * Math.sqrt(1 - t * t * 0.7));
        if (Math.abs(gx - cx) < halfW - 3 && rng() < 0.2) {
          pc.setPixel(gx, y, tone(ws, 0.25 + rng() * 0.1));
        }
      }
    }

    // SEAM — dark line between lid and box
    for (let x = chestLeft; x <= chestRight; x++) {
      if (x < 128 && seamY < 96) {
        pc.setPixel(x, seamY, tone(ws, 0.04));
        pc.setPixel(x, seamY + 1, tone(ws, 0.08));
      }
    }

    // METAL BANDS — horizontal strips across front
    for (const bandY of [seamY + 8, boxBotY - 10]) {
      for (let dy = -3; dy <= 3; dy++) {
        const y = bandY + dy;
        if (y < 0 || y >= 96) continue;
        const bandTone = dy < -1 ? 0.65 : dy > 1 ? 0.25 : 0.45;
        for (let x = chestLeft + 1; x < chestRight; x++) {
          if (x < 128) pc.setPixel(x, y, tone(mg, bandTone));
        }
      }
    }

    // Lid band
    const lidBandY = lidTopY + Math.round((seamY - lidTopY) * 0.5);
    for (let dy = -3; dy <= 3; dy++) {
      const y = lidBandY + dy;
      if (y < 0 || y >= 96) continue;
      const t = (seamY - y) / (seamY - lidTopY);
      const halfW = Math.round(chestW * Math.sqrt(1 - t * t * 0.7));
      const bandTone = dy < -1 ? 0.65 : dy > 1 ? 0.25 : 0.45;
      for (let x = cx - halfW + 1; x <= cx + halfW - 1; x++) {
        if (x >= 0 && x < 128) pc.setPixel(x, y, tone(mg, bandTone));
      }
    }

    // CLASP — golden lock in centre
    for (let y = seamY - 7; y <= seamY + 14; y++) {
      for (let x = cx - 8; x <= cx + 8; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / 8, dy = (y - seamY - 3) / 10;
        let cv = 0.2 + Math.max(0, -dx * lx * 0.3 + lz * 0.5) * 0.5;
        cv = cv * cv * (3 - 2 * cv);
        pc.setPixel(x, y, tone(cv > 0.4 ? mg : ms, Math.max(0.06, cv)));
      }
    }
    // Keyhole
    pc.setPixel(cx, seamY + 5, tone(ws, 0.02));
    pc.setPixel(cx, seamY + 6, tone(ws, 0.02));
    pc.setPixel(cx - 1, seamY + 7, tone(ws, 0.02));
    pc.setPixel(cx, seamY + 7, tone(ws, 0.02));
    pc.setPixel(cx + 1, seamY + 7, tone(ws, 0.02));

    // RIVETS on bands
    for (const bandY of [seamY + 8, boxBotY - 10]) {
      for (const rx of [chestLeft + 15, chestLeft + 40, chestRight - 40, chestRight - 15]) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx * dx + dy * dy > 4) continue;
            const px = rx + dx, py = bandY + dy;
            if (px >= 0 && px < 128 && py >= 0 && py < 96) {
              const d = Math.sqrt(dx * dx + dy * dy) / 2;
              pc.setPixel(px, py, tone(ig, 0.2 + (1 - d) * 0.35));
            }
          }
        }
        // Rivet highlight
        if (rx - 1 >= 0 && bandY - 1 >= 0) pc.setPixel(rx - 1, bandY - 1, tone(ig, 0.65));
      }
    }

    // BASE TRIM — slightly wider
    for (let y = boxBotY; y <= boxBotY + 3; y++) {
      for (let x = chestLeft - 2; x <= chestRight + 2; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, tone(ws, 0.12));
      }
    }

    // Left edge shadow
    for (let y = seamY; y <= boxBotY; y++) {
      if (chestLeft < 128 && y < 96) {
        pc.setPixel(chestLeft, y, tone(ws, 0.04));
        pc.setPixel(chestLeft + 1, y, tone(ws, 0.08));
      }
    }

    // Contact shadow
    for (let x = chestLeft - 2; x <= chestRight + 2; x++) {
      if (x >= 0 && x < 128 && boxBotY + 4 < 96) {
        pc.setPixel(x, boxBotY + 4, tone(ws, 0.03));
      }
    }
  },
};
