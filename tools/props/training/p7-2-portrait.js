// Phase 7.2: Character Portrait — Illustrated tier (96×128)
// Fantasy adventurer, slightly angled 3/4 face
// Tests: anatomy (face proportions), lighting on curved forms,
// colour temperature (warm skin lit / cool skin shadow), hair material, eyes
//
// STEP 1: Silhouette only — verify head/neck/shoulder shape reads

module.exports = {
  width: 96, height: 128, style: 'illustrated', entityType: 'prop', outlineMode: 'none',
  colors: {
    skin: '#d4a574', skinshd: '#8b5e3c',
    hair: '#3b2218', hairshd: '#1a0e08',
    eye: '#3388aa', eyeshd: '#1a4466',
    lip: '#bb6655', white: '#eeeedd',
    cloth: '#553344', clothshd: '#2a1a22',
    metal: '#aab0b8', metalshd: '#556070',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.skin.startIdx); },
  drawPost(pc, pal) {
    const sk = pal.groups.skin, ss = pal.groups.skinshd;
    const hr = pal.groups.hair, hs = pal.groups.hairshd;
    const eg = pal.groups.eye, es = pal.groups.eyeshd;
    const lip = pal.groups.lip;
    const wh = pal.groups.white;
    const cl = pal.groups.cloth, cls = pal.groups.clothshd;
    const mt = pal.groups.metal, ms = pal.groups.metalshd;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;

    const cx = 48, lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(72);

    // =========================================
    // CONSTRUCTION: Head proportions (Loomis method adapted)
    // =========================================
    // Head: oval, wider at brow, narrower at chin
    // Width:Height ~ 3:4 for the cranium
    // Eye line: halfway down the head
    // Nose: 3/4 down from top to chin
    // Mouth: 7/8 down
    // Ears: eye line to nose line

    const headTop = 12;
    const headBot = 82;
    const headH = headBot - headTop;
    const headCX = cx + 2; // slightly off-centre for 3/4 angle
    const headMaxW = 30; // half-width at widest (brow level)

    // Head profile — elliptical with jaw taper
    function headProfile(t) { // t: 0=top, 1=chin
      if (t < 0.05) return headMaxW * 0.6; // crown
      if (t < 0.15) return headMaxW * (0.6 + (t - 0.05) / 0.1 * 0.4); // forehead widens
      if (t < 0.55) return headMaxW; // brow to cheek — widest
      if (t < 0.75) return headMaxW * (1 - (t - 0.55) / 0.2 * 0.2); // cheek to jaw taper
      if (t < 0.95) return headMaxW * (0.8 - (t - 0.75) / 0.2 * 0.45); // jaw to chin
      return headMaxW * 0.35; // chin
    }

    // Neck
    const neckTop = headBot - 4;
    const neckBot = 98;
    const neckW = 12;

    // Shoulders
    const shoulderTop = 95;
    const shoulderBot = 127;
    const shoulderW = 42;

    // =========================================
    // LAYER 1: Back hair (behind head)
    // =========================================
    const hairTop = headTop - 4;
    const hairSideExtra = 8;
    for (let y = hairTop; y <= neckBot + 6; y++) {
      const ht = Math.max(0, Math.min(1, (y - headTop) / headH));
      let baseW;
      if (y < headTop) {
        baseW = headProfile(0) + 4;
      } else if (y <= headBot) {
        baseW = headProfile(ht) + hairSideExtra;
      } else {
        // Hair flowing past head
        const fallT = (y - headBot) / 20;
        baseW = headProfile(1) + hairSideExtra * (1 - fallT * 0.5);
      }
      const halfW = Math.round(baseW);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = headCX + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
        // Hair normal — treat as cylinder wrapping around head
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        let v = 0.04 + dot * 0.45;
        // Strand variation
        const strand = Math.sin(x * 0.8 + y * 0.3) * 0.5 + Math.sin(x * 0.3 + y * 0.7) * 0.5;
        v += strand * 0.06;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.22 ? hr : hs, Math.max(0.02, v)));
      }
    }

    // =========================================
    // LAYER 2: Neck
    // =========================================
    for (let y = neckTop; y <= neckBot; y++) {
      const nt = (y - neckTop) / (neckBot - neckTop);
      const halfW = Math.round(neckW + nt * 4); // slightly widens
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = headCX + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        const bounce = Math.max(0, nx * 0.2) * 0.08;
        let v = 0.08 + dot * 0.52 + bounce;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.32 ? sk : ss, Math.max(0.04, v)));
      }
    }

    // =========================================
    // LAYER 3: Shoulders / Cloth
    // =========================================
    for (let y = shoulderTop; y <= shoulderBot; y++) {
      const st = (y - shoulderTop) / (shoulderBot - shoulderTop);
      // Shoulders curve: wide at top, slightly tapers
      const halfW = Math.round(shoulderW * (1 - st * 0.15));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = headCX + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
        const nx = dx / (halfW + 1);
        const ny = (y - shoulderTop) / (shoulderBot - shoulderTop) * 0.3 - 0.15;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        let v = 0.06 + dot * 0.42;
        // Cloth fold shadows
        const fold = Math.sin(dx * 0.15) * 0.06;
        v += fold;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.25 ? cl : cls, Math.max(0.03, v)));
      }
    }

    // =========================================
    // LAYER 4: Head / Face (skin)
    // =========================================
    const eyeLineY = headTop + Math.round(headH * 0.48);
    const noseY = headTop + Math.round(headH * 0.72);
    const mouthY = headTop + Math.round(headH * 0.82);

    for (let y = headTop; y <= headBot; y++) {
      const ht = (y - headTop) / headH;
      const halfW = Math.round(headProfile(ht));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = headCX + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
        // Sphere-ish normal for the head
        const nx = dx / (halfW + 1);
        const ny = (ht - 0.45) * 0.6; // vertical curvature centred at mid-face
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        const spec = Math.pow(Math.max(0, 2 * (lx * nx + ly * ny + lz * nz) * nz - lz), 30) * 0.15;
        const bounce = Math.max(0, ny * 0.3) * 0.1;
        // Ambient fill prevents total blackout on shadow side
        const ambient = 0.12;
        let v = ambient + dot * 0.52 + spec + bounce;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.28 ? sk : ss, Math.max(0.08, v)));
      }
    }

    // =========================================
    // LAYER 5: Facial features
    // =========================================

    // --- NOSE ---
    // A subtle nose shadow — ridge highlight + side shadows
    const noseRidgeX = headCX - 1; // slightly left of centre for 3/4
    for (let y = eyeLineY + 4; y <= noseY + 2; y++) {
      const nt = (y - eyeLineY - 4) / (noseY - eyeLineY - 2);
      // Ridge highlight
      if (noseRidgeX >= 0 && noseRidgeX < 96) {
        const ht = (y - headTop) / headH;
        const baseV = 0.65 + (1 - nt) * 0.1;
        pc.setPixel(noseRidgeX, y, tone(sk, baseV));
        if (noseRidgeX + 1 < 96) pc.setPixel(noseRidgeX + 1, y, tone(sk, baseV - 0.05));
      }
      // Right shadow (away from light)
      const shadowX = noseRidgeX + 3 + Math.round(nt * 1.5);
      if (shadowX >= 0 && shadowX < 96 && y < 128) {
        pc.setPixel(shadowX, y, tone(ss, 0.15 + nt * 0.08));
      }
    }
    // Nose tip — small rounded form
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy * 2) / 3;
        if (d > 1) continue;
        const px = noseRidgeX + dx, py = noseY + dy;
        if (px < 0 || px >= 96 || py < 0 || py >= 128) continue;
        const nnx = dx / 4, nny = dy / 3;
        const nnz = Math.sqrt(Math.max(0.1, 1 - nnx * nnx - nny * nny));
        const ndot = Math.max(0, lx * nnx + ly * nny + lz * nnz);
        let nv = 0.15 + ndot * 0.55;
        nv = nv * nv * (3 - 2 * nv);
        pc.setPixel(px, py, tone(nv > 0.35 ? sk : ss, Math.max(0.08, nv)));
      }
    }
    // Nostrils
    pc.setPixel(noseRidgeX - 2, noseY + 2, tone(ss, 0.06));
    pc.setPixel(noseRidgeX + 3, noseY + 2, tone(ss, 0.06));

    // --- EYES ---
    const eyeY = eyeLineY;
    const leftEyeX = headCX - 12;
    const rightEyeX = headCX + 10; // slightly asymmetric for 3/4
    const eyeW = 9, eyeH = 5; // larger eyes — most important feature

    function drawEye(ecx, ecy, sizeScale) {
      const eW = Math.round(eyeW * sizeScale);
      const eH = Math.round(eyeH * sizeScale);

      // Eye socket shadow
      for (let dy = -eH - 2; dy <= eH + 1; dy++) {
        for (let dx = -eW - 1; dx <= eW + 1; dx++) {
          const ex = ecx + dx, ey = ecy + dy;
          if (ex < 0 || ex >= 96 || ey < 0 || ey >= 128) continue;
          const d = Math.sqrt((dx / (eW + 2)) ** 2 + (dy / (eH + 2)) ** 2);
          if (d < 1) {
            pc.setPixel(ex, ey, tone(ss, 0.12 + (1 - d) * 0.06));
          }
        }
      }

      // Almond-shaped white of eye
      for (let dy = -eH; dy <= eH; dy++) {
        for (let dx = -eW; dx <= eW; dx++) {
          // Almond shape: pinch at corners, fuller in middle
          const xNorm = dx / eW; // -1 to 1
          const yNorm = dy / eH;
          // Vertical extent narrows at horizontal extremes
          const vertSqueeze = 1 - Math.pow(Math.abs(xNorm), 1.8) * 0.7;
          if (Math.abs(yNorm) > vertSqueeze) continue;
          const ex = ecx + dx, ey = ecy + dy;
          if (ex < 0 || ex >= 96 || ey < 0 || ey >= 128) continue;
          const d = Math.sqrt(xNorm * xNorm + (yNorm / vertSqueeze) * (yNorm / vertSqueeze));
          if (d > 1) continue;
          pc.setPixel(ex, ey, tone(wh, 0.5 + (1 - d) * 0.3));
        }
      }

      // Iris — large enough to be the focal point
      const irisR = 5;
      const irisCX = ecx - 1; // looking slightly left
      for (let dy = -irisR; dy <= irisR; dy++) {
        for (let dx = -irisR; dx <= irisR; dx++) {
          const d = Math.sqrt(dx * dx + dy * dy) / irisR;
          if (d > 1) continue;
          const ix = irisCX + dx, iy = ecy + dy;
          if (ix < 0 || ix >= 96 || iy < 0 || iy >= 128) continue;
          // Radial iris fibres
          const angle = Math.atan2(dy, dx);
          const fibre = Math.sin(angle * 8) * 0.08 + Math.sin(angle * 13) * 0.05;
          let iv = 0.2 + (1 - d) * 0.4 + fibre;
          iv = iv * iv * (3 - 2 * iv);
          pc.setPixel(ix, iy, tone(iv > 0.3 ? eg : es, Math.max(0.06, iv)));
        }
      }

      // Pupil
      const pupilR = 2;
      for (let dy = -pupilR; dy <= pupilR; dy++) {
        for (let dx = -pupilR; dx <= pupilR; dx++) {
          if (dx * dx + dy * dy > pupilR * pupilR) continue;
          const px = irisCX + dx, py = ecy + dy;
          if (px >= 0 && px < 96 && py >= 0 && py < 128) {
            pc.setPixel(px, py, tone(es, 0.02));
          }
        }
      }

      // Specular — upper left, pure bright
      pc.setPixel(irisCX - 1, ecy - 2, tone(wh, 0.95));
      pc.setPixel(irisCX - 1, ecy - 1, tone(wh, 0.85));
      pc.setPixel(irisCX, ecy - 2, tone(wh, 0.8));

      // Upper eyelid line — dark
      for (let dx = -eyeW; dx <= eyeW; dx++) {
        const d = Math.abs(dx / eyeW);
        if (d > 1) continue;
        const lidY = ecy - eyeH + Math.round(d * d * 1.5);
        const ex = ecx + dx;
        if (ex >= 0 && ex < 96 && lidY >= 0 && lidY < 128) {
          pc.setPixel(ex, lidY, tone(hs, 0.08));
          if (lidY - 1 >= 0) pc.setPixel(ex, lidY - 1, tone(ss, 0.18)); // lid crease
        }
      }

      // Lower lash line — subtle
      for (let dx = -eyeW + 1; dx <= eyeW - 1; dx++) {
        const d = Math.abs(dx / eyeW);
        const lidY = ecy + eyeH - Math.round(d * d * 1);
        const ex = ecx + dx;
        if (ex >= 0 && ex < 96 && lidY >= 0 && lidY < 128) {
          pc.setPixel(ex, lidY, tone(ss, 0.12));
        }
      }
    }

    drawEye(leftEyeX, eyeY, 1.0);
    drawEye(rightEyeX, eyeY, 0.75); // far eye distinctly narrower for 3/4

    // --- EYEBROWS ---
    for (let side = -1; side <= 1; side += 2) {
      const browCX = side < 0 ? leftEyeX : rightEyeX;
      const browY = eyeY - eyeH - 3;
      for (let dx = -eyeW; dx <= eyeW + 1; dx++) {
        const bx = browCX + dx, by = browY + Math.round(Math.abs(dx) * 0.2);
        if (bx >= 0 && bx < 96 && by >= 0 && by < 128) {
          pc.setPixel(bx, by, tone(hr, 0.2 + (1 - Math.abs(dx) / (eyeW + 1)) * 0.15));
          if (by + 1 < 128) pc.setPixel(bx, by + 1, tone(hr, 0.12));
        }
      }
    }

    // --- MOUTH ---
    const mouthW = 8;
    // Upper lip
    for (let dx = -mouthW; dx <= mouthW; dx++) {
      const d = Math.abs(dx) / mouthW;
      const lipYOff = Math.round(-Math.sqrt(Math.max(0, 1 - d * d)) * 1.5);
      const mx = headCX + dx, my = mouthY + lipYOff;
      if (mx >= 0 && mx < 96 && my >= 0 && my < 128) {
        let lv = 0.25 + (1 - d) * 0.35;
        lv = lv * lv * (3 - 2 * lv);
        pc.setPixel(mx, my, tone(lip, lv));
        if (my + 1 < 128) pc.setPixel(mx, my + 1, tone(lip, lv * 0.7));
      }
    }
    // Lower lip — fuller, brighter
    for (let dx = -mouthW + 1; dx <= mouthW - 1; dx++) {
      const d = Math.abs(dx) / (mouthW - 1);
      const lipYOff = Math.round(Math.sqrt(Math.max(0, 1 - d * d)) * 2);
      const mx = headCX + dx, my = mouthY + 1 + lipYOff;
      if (mx >= 0 && mx < 96 && my >= 0 && my < 128) {
        const nnx = dx / (mouthW + 1);
        const nny = 0.3;
        const nnz = Math.sqrt(Math.max(0.1, 1 - nnx * nnx - nny * nny));
        const ldot = Math.max(0, lx * nnx + ly * nny + lz * nnz);
        let lv = 0.15 + ldot * 0.5;
        lv = lv * lv * (3 - 2 * lv);
        pc.setPixel(mx, my, tone(lip, Math.max(0.1, lv)));
      }
    }
    // Mouth line
    for (let dx = -mouthW + 2; dx <= mouthW - 2; dx++) {
      const mx = headCX + dx;
      if (mx >= 0 && mx < 96 && mouthY < 128) {
        pc.setPixel(mx, mouthY + 1, tone(ss, 0.08));
      }
    }

    // =========================================
    // LAYER 6: Front hair (over forehead)
    // =========================================
    // Hair covers top of head, stops ABOVE eyes
    const bangStopY = eyeLineY - 6; // bangs end well above eye line
    for (let y = hairTop; y <= bangStopY; y++) {
      const ht = Math.max(0, (y - hairTop) / (bangStopY - hairTop));
      let hairHalfW;
      if (ht < 0.5) {
        // Top of hair — dome
        const headT = Math.max(0, (y - headTop) / headH);
        hairHalfW = Math.round((headT < 0 ? headMaxW * 0.7 : headProfile(headT)) + 5);
      } else {
        // Lower bangs — swept to the right, tapers
        const bangT = (ht - 0.5) / 0.5;
        hairHalfW = Math.round((headMaxW + 5) * (1 - bangT * 0.35));
      }

      for (let dx = -hairHalfW; dx <= hairHalfW; dx++) {
        const x = headCX + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
        const nx = dx / (hairHalfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);

        // Individual strand highlights
        const strand1 = Math.sin(x * 0.6 + y * 0.25) * 0.07;
        const strand2 = Math.sin(x * 0.35 + y * 0.55) * 0.05;
        const strand3 = Math.sin(x * 1.1 - y * 0.15) * 0.04;
        let v = 0.05 + dot * 0.48 + strand1 + strand2 + strand3;

        // Crown highlight — wide bright area upper-left
        const crownDX = (x - (headCX - 8)) / 20;
        const crownDY = (y - (hairTop + 10)) / 12;
        const crownD = crownDX * crownDX + crownDY * crownDY;
        if (crownD < 1) v += (1 - crownD) * 0.18;

        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.2 ? hr : hs, Math.max(0.02, v)));
      }
    }

    // Hair wisps at edges — break the smooth silhouette
    const wispSeeds = [
      { x: headCX - headMaxW - 4, y: headTop + 15, len: 8, angle: -0.3 },
      { x: headCX - headMaxW - 2, y: headTop + 25, len: 6, angle: -0.5 },
      { x: headCX + headMaxW + 3, y: headTop + 20, len: 7, angle: 0.4 },
      { x: headCX + headMaxW + 1, y: headTop + 30, len: 5, angle: 0.6 },
    ];
    for (const w of wispSeeds) {
      for (let i = 0; i < w.len; i++) {
        const wx = Math.round(w.x + Math.sin(w.angle) * i);
        const wy = w.y + i;
        if (wx >= 0 && wx < 96 && wy >= 0 && wy < 128) {
          pc.setPixel(wx, wy, tone(hr, 0.12 - i * 0.01));
        }
      }
    }

    // =========================================
    // LAYER 7: Ear (visible on right side for 3/4)
    // =========================================
    const earCX = headCX + headMaxW - 2;
    const earTopY = eyeLineY - 3;
    const earBotY = noseY + 1;
    for (let y = earTopY; y <= earBotY; y++) {
      const et = (y - earTopY) / (earBotY - earTopY);
      const earW = Math.round(5 * Math.sin(et * Math.PI));
      for (let dx = 0; dx <= earW; dx++) {
        const ex = earCX + dx, ey = y;
        if (ex < 0 || ex >= 96 || ey < 0 || ey >= 128) continue;
        const enx = dx / (earW + 1) * 0.5 + 0.4;
        const enz = Math.sqrt(Math.max(0.1, 1 - enx * enx));
        const edot = Math.max(0, lx * enx + lz * enz);
        let ev = 0.1 + edot * 0.4;
        // Inner ear shadow
        if (dx > 1 && dx < earW - 1 && et > 0.2 && et < 0.8) {
          ev -= 0.1;
        }
        ev = ev * ev * (3 - 2 * ev);
        pc.setPixel(ex, ey, tone(ev > 0.25 ? sk : ss, Math.max(0.05, ev)));
      }
    }

    // Small metal earring
    const ringY = earBotY + 2;
    for (let dy = -2; dy <= 3; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1 || d > 3) continue;
        const rx = earCX + 2 + dx, ry = ringY + dy;
        if (rx >= 0 && rx < 96 && ry >= 0 && ry < 128) {
          const rnx = dx / 3, rny = dy / 3;
          const rnz = Math.sqrt(Math.max(0.1, 1 - rnx * rnx - rny * rny));
          const rdot = Math.max(0, lx * rnx + ly * rny + lz * rnz);
          const rspec = Math.pow(Math.max(0, 2 * rdot * rnz - lz), 80) * 0.6;
          let rv = 0.1 + rdot * 0.3 + rspec;
          rv = rv * rv * rv * (rv * (rv * 6 - 15) + 10); // quintic for metal
          pc.setPixel(rx, ry, tone(rv > 0.35 ? mt : ms, Math.max(0.04, rv)));
        }
      }
    }

    // =========================================
    // LAYER 8: Collar / neckline detail
    // =========================================
    const collarY = neckBot - 3;
    for (let dx = -neckW - 6; dx <= neckW + 6; dx++) {
      const x = headCX + dx;
      if (x < 0 || x >= 96) continue;
      const d = Math.abs(dx) / (neckW + 6);
      // V-neck shape
      const colY = collarY + Math.round((1 - d) * 5);
      for (let t = 0; t < 3; t++) {
        const cy2 = colY - t;
        if (cy2 >= 0 && cy2 < 128) {
          let cv = 0.15 + (1 - d) * 0.2 + t * 0.05;
          cv = cv * cv * (3 - 2 * cv);
          pc.setPixel(x, cy2, tone(cv > 0.2 ? cl : cls, Math.max(0.04, cv)));
        }
      }
    }

    // =========================================
    // FINAL: Tinted outline pass (selout-style)
    // =========================================
    // Scan for edge pixels and darken them
    const tempPixels = new Uint8Array(pc.pixels);
    for (let y = 1; y < 127; y++) {
      for (let x = 1; x < 95; x++) {
        const idx = y * 96 + x;
        if (tempPixels[idx] === 0) continue;
        // Check if adjacent to transparent
        const hasEmpty = tempPixels[idx - 1] === 0 || tempPixels[idx + 1] === 0 ||
                        tempPixels[idx - 96] === 0 || tempPixels[idx + 96] === 0;
        if (hasEmpty) {
          // Darken this edge pixel
          const cur = tempPixels[idx];
          // Find which group this pixel belongs to and use its darkest tone
          for (const gName of Object.keys(pal.groups)) {
            const g = pal.groups[gName];
            if (cur >= g.startIdx && cur < g.startIdx + g.toneCount) {
              pc.setPixel(x, y, g.startIdx + Math.max(0, Math.min(1, Math.round(g.toneCount * 0.15))));
              break;
            }
          }
        }
      }
    }
  },
};
