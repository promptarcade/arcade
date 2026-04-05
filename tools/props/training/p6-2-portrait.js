// Phase 6, Exercise 6.2: Character portrait — Illustrated tier (96x128)
// Training target: anatomy + lighting + colour on a face
// Apply all fundamentals: sphere normals for head, cylinder for neck,
// colour temperature shift, proper eye construction, hair as mass not lines

module.exports = {
  width: 96,
  height: 128,
  style: 'illustrated',
  entityType: 'character',
  outlineMode: 'none',
  colors: {
    skin: '#e8b888',
    skinshd: '#a07055',
    hair: '#553322',
    hairlit: '#886644',
    eye: '#3366aa',
    lip: '#cc7766',
    highlight: '#ffeedd',
    cloth: '#334488',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.skin.startIdx); },

  drawPost(pc, pal) {
    const sk = pal.groups.skin;
    const ss = pal.groups.skinshd;
    const hr = pal.groups.hair;
    const hl = pal.groups.hairlit;
    const ey = pal.groups.eye;
    const lp = pal.groups.lip;
    const hg = pal.groups.highlight;
    const cl = pal.groups.cloth;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, headCY = 48, headRX = 30, headRY = 36;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(42);

    // Background — subtle warm-to-cool gradient
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 96; x++) {
        const t = y / 128;
        pc.setPixel(x, y, tone(cl, 0.08 + t * 0.06));
      }
    }

    // NECK — cylinder below head
    const neckTop = headCY + headRY - 8;
    const neckBot = 118;
    const neckW = 12;
    for (let y = neckTop; y <= neckBot; y++) {
      for (let x = cx - neckW; x <= cx + neckW; x++) {
        if (x < 0 || x >= 96) continue;
        const xFrac = (x - cx) / neckW;
        const nz = Math.sqrt(Math.max(0.05, 1 - xFrac * xFrac));
        const dot = Math.max(0, lx * xFrac + lz * nz);
        let v = 0.1 + dot * 0.55;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.35 ? sk : ss, Math.max(0.05, v)));
      }
    }

    // SHOULDERS/CLOTH — hint of clothing at bottom
    for (let y = 112; y < 128; y++) {
      for (let x = 0; x < 96; x++) {
        const dx = (x - cx) / 48;
        const shoulderY = 112 + Math.abs(dx) * 8;
        if (y < shoulderY) continue;
        const nz = Math.sqrt(Math.max(0.05, 1 - dx * dx * 0.5));
        const dot = Math.max(0, lx * dx * 0.5 + lz * nz);
        pc.setPixel(x, y, tone(cl, 0.1 + dot * 0.45));
      }
    }

    // HEAD — sphere (the Phase 1 foundation)
    for (let y = headCY - headRY; y <= headCY + headRY; y++) {
      for (let x = cx - headRX; x <= cx + headRX; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
        const dx = (x - cx) / headRX, dy = (y - headCY) / headRY;
        if (dx * dx + dy * dy > 1) continue;

        const nx = dx * 0.85;
        const ny = dy * 0.7;
        const nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);

        let v = 0.08 + dot * 0.65;
        // Bounce light from below (cloth reflects up onto chin)
        const bounce = Math.max(0, ny * 0.3) * 0.08;
        v += bounce;

        v = v * v * (3 - 2 * v);
        v = Math.max(0.03, Math.min(1, v));

        // Colour temp: lit = warm skin, shadow = cool skin
        pc.setPixel(x, y, tone(v > 0.35 ? sk : ss, v));
      }
    }

    // JAW — slightly more angular at the bottom
    // Darken the sides of the lower face for jaw definition
    for (let y = headCY + 10; y <= headCY + headRY; y++) {
      const jawT = (y - headCY - 10) / (headRY - 10);
      const jawNarrow = headRX * (1 - jawT * 0.25);
      for (let x = cx - headRX; x <= cx + headRX; x++) {
        if (Math.abs(x - cx) > jawNarrow && pc.isFilled(x, y)) {
          pc.setPixel(x, y, tone(ss, 0.1));
        }
      }
    }

    // NOSE — subtle ridge in center of face
    const noseTop = headCY + 2;
    const noseBot = headCY + 16;
    for (let y = noseTop; y <= noseBot; y++) {
      const t = (y - noseTop) / (noseBot - noseTop);
      const noseW = 2 + t * 2;
      // Nose ridge — lighter on left (lit side), darker on right
      for (let dx = -Math.round(noseW); dx <= Math.round(noseW); dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
        if (!pc.isFilled(x, y)) continue;
        const noseLit = dx < 0 ? 0.08 : -0.04;
        const curr = pc.getPixel(x, y);
        // Slightly brighten left side of nose, darken right
        if (dx <= 0) {
          pc.setPixel(x, y, tone(sk, 0.5 + noseLit));
        }
      }
    }
    // Nose tip — small bright bump
    pc.setPixel(cx - 1, noseBot, tone(sk, 0.65));
    pc.setPixel(cx, noseBot, tone(sk, 0.6));
    pc.setPixel(cx + 1, noseBot, tone(ss, 0.4));
    // Nostril shadows
    pc.setPixel(cx - 2, noseBot + 1, tone(ss, 0.15));
    pc.setPixel(cx + 2, noseBot + 1, tone(ss, 0.15));
    // Nose shadow (cast down from nose onto upper lip)
    for (let x = cx - 3; x <= cx + 3; x++) {
      if (x >= 0 && x < 96) {
        pc.setPixel(x, noseBot + 2, tone(ss, 0.18));
        pc.setPixel(x, noseBot + 3, tone(ss, 0.22));
      }
    }

    // EYES — the most important feature
    const eyeY = headCY - 2;
    const eyeGap = 10;
    for (const side of [-1, 1]) {
      const ex = cx + side * eyeGap;

      // Eye socket shadow — concave area
      for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -7; dx <= 7; dx++) {
          const d = (dx * dx) / 49 + (dy * dy) / 25;
          if (d > 1) continue;
          const px = ex + dx, py = eyeY + dy;
          if (px < 0 || px >= 96 || py < 0 || py >= 128) continue;
          pc.setPixel(px, py, tone(ss, 0.2 + (1 - d) * 0.1));
        }
      }

      // Sclera (white)
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          const d = (dx * dx) / 25 + (dy * dy) / 9;
          if (d > 1) continue;
          const px = ex + dx, py = eyeY + dy;
          if (px < 0 || px >= 96 || py < 0 || py >= 128) continue;
          // Sphere shading on eyeball
          const enx = dx / 6, eny = dy / 4;
          const enz = Math.sqrt(Math.max(0.1, 1 - enx * enx - eny * eny));
          const eDot = Math.max(0, lx * enx + ly * eny + lz * enz);
          pc.setPixel(px, py, tone(hg, 0.3 + eDot * 0.5));
        }
      }

      // Iris
      const irisX = ex + side * 1; // slightly looking at viewer
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx * dx + dy * dy > 5) continue;
          const px = irisX + dx, py = eyeY + dy;
          if (px < 0 || px >= 96 || py < 0 || py >= 128) continue;
          const d = Math.sqrt(dx * dx + dy * dy) / 2.5;
          pc.setPixel(px, py, tone(ey, 0.2 + (1 - d) * 0.5));
        }
      }

      // Pupil
      pc.setPixel(irisX, eyeY, tone(ey, 0.02));
      pc.setPixel(irisX, eyeY + 1, tone(ey, 0.02));

      // Specular — tiny bright dot, upper-left
      pc.setPixel(irisX - 1, eyeY - 1, tone(hg, 1.0));

      // Upper eyelid line — thick, dark
      for (let dx = -5; dx <= 5; dx++) {
        const px = ex + dx;
        const dy = Math.round(dx * dx * 0.05); // slight curve
        const py = eyeY - 3 + dy;
        if (px >= 0 && px < 96 && py >= 0 && py < 128) {
          pc.setPixel(px, py, tone(hr, 0.15));
          pc.setPixel(px, py + 1, tone(ss, 0.2)); // shadow from lid
        }
      }

      // Lower eyelid — thinner, lighter
      for (let dx = -4; dx <= 4; dx++) {
        const px = ex + dx;
        const dy = Math.round(dx * dx * 0.04);
        const py = eyeY + 3 - dy;
        if (px >= 0 && px < 96 && py >= 0 && py < 128) {
          pc.setPixel(px, py, tone(ss, 0.3));
        }
      }

      // Eyelash hint (upper outer corner)
      pc.setPixel(ex + side * 5, eyeY - 3, tone(hr, 0.12));
      pc.setPixel(ex + side * 6, eyeY - 4, tone(hr, 0.1));
    }

    // Eyebrows
    for (const side of [-1, 1]) {
      const browX = cx + side * eyeGap;
      for (let dx = -6; dx <= 4; dx++) {
        const px = browX + dx * side;
        const py = eyeY - 8 + Math.round(Math.abs(dx) * 0.3);
        if (px >= 0 && px < 96 && py >= 0 && py < 128) {
          pc.setPixel(px, py, tone(hr, 0.25));
          pc.setPixel(px, py + 1, tone(hr, 0.2));
        }
      }
    }

    // MOUTH
    const mouthY = headCY + 22;
    // Upper lip
    for (let dx = -6; dx <= 6; dx++) {
      const x = cx + dx;
      const dy = Math.round(-Math.abs(dx) * 0.15);
      if (x >= 0 && x < 96) {
        pc.setPixel(x, mouthY + dy, tone(lp, 0.4));
        // Cupid's bow
        if (Math.abs(dx) < 2) pc.setPixel(x, mouthY + dy - 1, tone(lp, 0.35));
      }
    }
    // Lower lip — rounder, catches light
    for (let dx = -5; dx <= 5; dx++) {
      const x = cx + dx;
      const dy = Math.round(dx * dx * 0.04);
      if (x >= 0 && x < 96) {
        pc.setPixel(x, mouthY + 2 + dy, tone(lp, 0.5 + (1 - Math.abs(dx) / 5) * 0.2));
        pc.setPixel(x, mouthY + 3 + dy, tone(lp, 0.35));
      }
    }
    // Mouth line — dark
    for (let dx = -5; dx <= 5; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 96) {
        pc.setPixel(x, mouthY + 1, tone(lp, 0.1));
      }
    }
    // Lower lip highlight
    pc.setPixel(cx - 1, mouthY + 2, tone(hg, 0.45));
    pc.setPixel(cx, mouthY + 2, tone(hg, 0.5));

    // Chin shadow under lower lip
    for (let dx = -4; dx <= 4; dx++) {
      if (cx + dx >= 0 && cx + dx < 96) {
        pc.setPixel(cx + dx, mouthY + 5, tone(ss, 0.22));
      }
    }

    // HAIR — mass, not individual strands. Treat as overlapping volumes.
    // Back hair (behind head — drawn over background but could peek around edges)
    for (let y = headCY - headRY - 6; y <= headCY + headRY + 4; y++) {
      for (let x = cx - headRX - 5; x <= cx + headRX + 5; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
        const dx = (x - cx) / (headRX + 5), dy = (y - (headCY - 8)) / (headRY + 12);
        if (dx * dx + dy * dy > 1) continue;
        // Only draw where no face exists yet (behind)
        if (pc.isFilled(x, y)) {
          // Check if it's background (very dark blue) — if so, draw hair
          const curr = pc.getPixel(x, y);
          if (curr === tone(cl, 0.08) || curr === tone(cl, 0.09) || curr === tone(cl, 0.1) || curr === tone(cl, 0.11) || curr === tone(cl, 0.12) || curr === tone(cl, 0.13) || curr === tone(cl, 0.14)) {
            // It's background — replace with hair
          } else {
            continue; // face pixel, don't overwrite
          }
        }

        const nx = dx * 0.7, ny = (dy - 0.2) * 0.8;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        let v = 0.05 + dot * 0.6;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.3 ? hl : hr, Math.max(0.03, v)));
      }
    }

    // Hair front — fringe/bangs across forehead
    for (let y = headCY - headRY - 4; y <= headCY - headRY + 14; y++) {
      for (let x = cx - headRX + 2; x <= cx + headRX - 2; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
        // Fringe shape: follows head curve, with strand-like bottom edge
        const dx = (x - cx) / headRX;
        const fringeBot = headCY - headRY + 10 + Math.sin(dx * 3) * 3 + Math.abs(dx) * 4;
        if (y > fringeBot) continue;
        if (y < headCY - headRY - 2) continue;

        const nx = dx * 0.5;
        const ny = -0.6 + (y - (headCY - headRY)) / 18 * 0.4;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        let v = 0.08 + dot * 0.6;

        // Individual strand variation
        const strandPhase = Math.floor((x - cx + headRX) / 3);
        v += ((strandPhase * 7 + 3) % 11) / 11 * 0.08 - 0.04;

        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.3 ? hl : hr, Math.max(0.03, v)));
      }
    }

    // Hair shine — broad highlight band on top of head
    for (let y = headCY - headRY; y < headCY - headRY + 8; y++) {
      for (let x = cx - 15; x <= cx + 5; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
        if (pc.isFilled(x, y) && rng() < 0.4) {
          pc.setPixel(x, y, tone(hl, 0.65 + rng() * 0.2));
        }
      }
    }

    // CHEEK BLUSH — subtle warm tint on the cheeks
    for (const side of [-1, 1]) {
      const blushCX = cx + side * 16;
      const blushCY = headCY + 10;
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          const d = (dx * dx) / 25 + (dy * dy) / 16;
          if (d > 1) continue;
          const px = blushCX + dx, py = blushCY + dy;
          if (px < 0 || px >= 96 || py < 0 || py >= 128) continue;
          if (pc.isFilled(px, py)) {
            const blushStrength = (1 - d) * 0.25;
            if (rng() < blushStrength) {
              pc.setPixel(px, py, tone(lp, 0.35));
            }
          }
        }
      }
    }

    // EAR — small, on the right side (partially hidden by hair on left)
    const earX = cx + headRX - 2;
    const earY = headCY + 2;
    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = 0; dx <= 5; dx++) {
        const d = (dx * dx) / 16 + (dy * dy) / 36;
        if (d > 1) continue;
        const px = earX + dx, py = earY + dy;
        if (px < 0 || px >= 96 || py < 0 || py >= 128) continue;
        const enx = dx / 4 * 0.5 + 0.4;
        const enz = Math.sqrt(Math.max(0.1, 1 - enx * enx));
        const eDot = Math.max(0, lx * enx + lz * enz);
        pc.setPixel(px, py, tone(eDot > 0.2 ? sk : ss, 0.15 + eDot * 0.45));
      }
    }
    // Ear inner shadow
    pc.setPixel(earX + 2, earY, tone(ss, 0.12));
    pc.setPixel(earX + 2, earY + 1, tone(ss, 0.1));
  },
};
