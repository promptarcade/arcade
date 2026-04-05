// Level 6.4: Variable-Timing Action — Chef Stirring
// 4 frames with different hold times:
// Frame 1: Anticipation (arm pulls back) — SLOW (200ms)
// Frame 2: Action (arm swings forward into pot) — FAST (80ms)
// Frame 3: Impact hold (spoon in pot, slight squash) — LONG (300ms)
// Frame 4: Recovery (arm returns to rest) — MODERATE (150ms)
// The timing curve creates weight and snap.
// Layout: 4 frames (128 × 48)
module.exports = {
  width: 128,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    skinLit: '#F2C4A0', skinShd: '#9B7B8A',
    hairLit: '#8B6542', hairShd: '#4A3B5A',
    shirtLit: '#5B8EC2', shirtShd: '#2E3E6A',
    clothLit: '#E8E0D0', clothShd: '#9A95A8',
    pantsLit: '#7A7A6E', pantsShd: '#3E4252',
    shoeLit: '#5A4030', shoeShd: '#2A2035',
    eyeWhite: '#EEEEF0',
    eyeIris: '#4488BB',
    eyePupil: '#181828',
    potLit: '#887060', potShd: '#3A2828',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.skinLit.startIdx); },
  drawPost(pc, pal) {
    const TW = 128, TH = 48;
    const pg = pal.groups;

    function tone(grp, frac) {
      return grp.startIdx + Math.max(0, Math.min(grp.toneCount - 1,
        Math.round(frac * (grp.toneCount - 1))));
    }
    function dt(wg, cg, v) {
      return v > 0.38 ? tone(wg, v) : tone(cg, Math.max(0.04, v * 1.2));
    }

    const sk = { w: pg.skinLit, c: pg.skinShd };
    const hr = { w: pg.hairLit, c: pg.hairShd };
    const sh = { w: pg.shirtLit, c: pg.shirtShd };
    const cl = { w: pg.clothLit, c: pg.clothShd };
    const pn = { w: pg.pantsLit, c: pg.pantsShd };
    const so = { w: pg.shoeLit, c: pg.shoeShd };
    const pt = { w: pg.potLit, c: pg.potShd };

    pc.pixels[0] = 0;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    function sphereV(x, y, scx, scy, r) {
      const nx = (x - scx) / r, ny = (y - scy) / r;
      const nz2 = 1 - nx * nx - ny * ny;
      if (nz2 < 0) return -1;
      const nz = Math.sqrt(nz2);
      const NdotL = nx * lx + ny * ly + nz * lz;
      let v = 0.04 + Math.max(0, NdotL) * 0.68 +
              Math.pow(Math.max(0, 2 * NdotL * nz - lz), 35) * 0.2 +
              Math.max(0, ny * 0.3) * 0.1;
      v = v * v * (3 - 2 * v);
      return Math.max(0.02, Math.min(1, v));
    }

    function cylinderV(x, ccx, halfW) {
      const nx = (x - ccx) / (halfW + 0.5);
      const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
      let v = 0.06 + Math.max(0, nx * lx + nz * lz) * 0.62 +
              Math.pow(Math.max(0, 2 * (nx * lx + nz * lz) * nz - lz), 30) * 0.15 + 0.04;
      v = v * v * (3 - 2 * v);
      return Math.max(0.02, Math.min(1, v));
    }

    function px(x, y, mat, v) {
      if (x >= 0 && x < TW && y >= 0 && y < TH)
        pc.setPixel(x, y, dt(mat.w, mat.c, v));
    }
    function pxc(x, y, grp, v) {
      if (x >= 0 && x < TW && y >= 0 && y < TH)
        pc.setPixel(x, y, tone(grp, Math.max(0, Math.min(1, v))));
    }

    // ========================================
    // DRAW CHEF FRAME
    // rArmAngle: 0=down, negative=back, positive=forward
    // rArmExtend: how far the arm reaches (0-1)
    // bodyLean: forward lean in pixels
    // ========================================
    function drawFrame(frameX, opts) {
      const cx = frameX + 15;
      const lean = opts.bodyLean || 0;
      const rArmAngle = opts.rArmAngle || 0; // -1 to 1
      const rArmLen = opts.rArmLen || 7;

      // Toque
      for (let y = 0; y <= 4; y++)
        for (let x = cx - 7; x <= cx + 7; x++) {
          if (x < 0 || x >= TW) continue;
          const d = Math.sqrt(((x - cx) / 7) ** 2 + ((y - 2) / 3) ** 2);
          if (d > 1) continue;
          let v = sphereV(x, y, cx, 2, 7);
          if (v < 0) v = 0.6;
          px(x, y, cl, 0.4 + v * 0.6);
        }
      for (let y = 4; y <= 7; y++)
        for (let x = cx - 6; x <= cx + 6; x++)
          if (x >= 0 && x < TW) px(x, y, cl, 0.35 + cylinderV(x, cx, 6) * 0.65);

      // Head
      const headCy = 14;
      for (let y = headCy - 10; y <= headCy + 10; y++) {
        for (let x = cx - 10; x <= cx + 10; x++) {
          if (x < 0 || x >= TW || y < 0 || y >= TH) continue;
          const nx = (x - cx) / 10, ny = (y - headCy) / 10;
          if (nx * nx + ny * ny > 1) continue;
          let v = sphereV(x, y, cx, headCy, 10);
          if (v < 0) continue;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          if (ny > -0.2 && ny < 0.7 && Math.abs(nx) < 0.55 && nz > 0.6)
            v = 0.5 + v * 0.5;
          px(x, y, sk, v);
        }
      }

      // Hair
      for (let y = 8; y <= 17; y++) {
        const hw = Math.round(Math.sqrt(Math.max(0, 1 - ((y - 14) / 10) ** 2)) * 10);
        if (y < 12) {
          for (let x = cx - hw - 1; x <= cx + hw + 1; x++)
            if (x >= 0 && x < TW) { let v = sphereV(x, y, cx, 14, 11); if (v >= 0) px(x, y, hr, v * 0.75); }
        } else {
          for (let dx = -1; dx <= 1; dx++) {
            if (cx - hw - 1 + dx >= 0) px(cx - hw - 1 + dx, y, hr, 0.15);
            if (cx + hw + 1 + dx < TW) px(cx + hw + 1 + dx, y, hr, 0.35);
          }
        }
      }

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            px(cx - 10 + dx, headCy + 1 + dy, sk, 0.25);
            px(cx + 10 + dx, headCy + 1 + dy, sk, 0.6);
          }

      // Eyes
      const eyeY = 12;
      const leX = cx - 5, reX = cx + 2;
      for (let dy = 0; dy < 4; dy++)
        for (let dx = 0; dx < 4; dx++) {
          pxc(leX + dx, eyeY + dy, pg.eyeWhite, 0.85);
          pxc(reX + dx, eyeY + dy, pg.eyeWhite, 0.85);
        }
      for (let dy = 1; dy < 3; dy++)
        for (let dx = 1; dx < 3; dx++) {
          pxc(leX + dx, eyeY + dy, pg.eyePupil, 0.9);
          pxc(reX + dx, eyeY + dy, pg.eyePupil, 0.9);
        }
      pxc(leX + 1, eyeY + 1, pg.eyeWhite, 1.0);
      pxc(reX + 1, eyeY + 1, pg.eyeWhite, 1.0);
      for (let dx = 0; dx < 4; dx++) {
        pxc(leX + dx, eyeY - 1, pg.eyePupil, 0.5);
        pxc(reX + dx, eyeY - 1, pg.eyePupil, 0.5);
      }

      // Mouth
      for (let dx = -1; dx <= 1; dx++) px(cx + dx, 18, sk, 0.28);

      // Neck
      for (let y = 25; y <= 26; y++)
        for (let x = cx - 2; x <= cx + 2; x++)
          px(x, y, sk, cylinderV(x, cx, 2.5) * 0.35);

      // Torso + apron
      const tL = cx - 7, torsoW = 14;
      for (let y = 27; y <= 34; y++) {
        for (let x = tL; x < tL + torsoW; x++) {
          if (x < 0 || x >= TW) continue;
          if (y === 27 && (x === tL || x === tL + torsoW - 1)) continue;
          px(x, y, sh, cylinderV(x, cx, torsoW / 2) * (1 - (y - 27) * 0.015));
        }
      }
      // Apron
      for (let y = 29; y <= 37; y++) {
        const taper = y > 35 ? (y - 35) : 0;
        for (let x = tL + taper; x < tL + torsoW - taper; x++)
          if (x >= 0 && x < TW) px(x, y, cl, 0.35 + cylinderV(x, cx, torsoW / 2) * 0.6);
      }

      // Left arm (at side, mostly still)
      for (let y = 28; y <= 34; y++)
        for (let dx = 0; dx < 3; dx++)
          if (tL - 3 + dx >= 0) px(tL - 3 + dx, y, sh, cylinderV(tL - 3 + dx, tL - 1.5, 1.5) * 0.7);
      for (let y = 35; y <= 36; y++)
        for (let dx = 0; dx < 3; dx++)
          if (tL - 3 + dx >= 0) px(tL - 3 + dx, y, sk, 0.3);

      // Right arm — animated! Angle determines position
      const armStartX = tL + torsoW;
      const armStartY = 28;
      for (let i = 0; i < rArmLen; i++) {
        const t = i / rArmLen;
        // Arm curves from torso outward and forward based on angle
        const ax = Math.round(armStartX + i * (0.5 + rArmAngle * 0.4));
        const ay = Math.round(armStartY + i * (1 - Math.abs(rArmAngle) * 0.3));
        for (let dx = 0; dx < 3; dx++)
          if (ax + dx >= 0 && ax + dx < TW && ay >= 0 && ay < TH)
            px(ax + dx, ay, sh, 0.55);
      }
      // Hand at end of arm
      const handX = Math.round(armStartX + rArmLen * (0.5 + rArmAngle * 0.4));
      const handY = Math.round(armStartY + rArmLen * (1 - Math.abs(rArmAngle) * 0.3));
      for (let dx = 0; dx < 3; dx++)
        if (handX + dx >= 0 && handX + dx < TW && handY >= 0 && handY < TH)
          px(handX + dx, handY, sk, 0.55);

      // Spoon (from hand)
      if (opts.showSpoon) {
        for (let dy = 0; dy <= 4; dy++)
          if (handX + 1 >= 0 && handX + 1 < TW && handY + dy >= 0 && handY + dy < TH)
            pxc(handX + 1, handY + dy, pg.potShd, 0.5);
      }

      // Legs (static)
      for (let y = 35; y < 42; y++) {
        for (let dx = 0; dx < 4; dx++) {
          px(cx - 5 + dx, y, pn, cylinderV(cx - 5 + dx, cx - 3, 2) * 0.8);
          px(cx + 1 + dx, y, pn, cylinderV(cx + 1 + dx, cx + 3, 2));
        }
      }
      for (let y = 42; y < 44; y++) {
        for (let dx = -1; dx < 4; dx++) px(cx - 5 + dx, y, so, 0.25);
        for (let dx = 0; dx <= 4; dx++) px(cx + 1 + dx, y, so, 0.5);
      }

      // Pot (static, in front of character at lower right)
      const potCx = cx + 12, potTop = 38;
      for (let y = potTop; y < potTop + 6; y++) {
        const bulge = y > potTop + 1 ? 1 : 0;
        for (let x = potCx - 4 - bulge; x <= potCx + 4 + bulge; x++)
          if (x >= 0 && x < TW && y < TH)
            px(x, y, pt, cylinderV(x, potCx, 4 + bulge));
      }
      // Pot rim
      for (let x = potCx - 5; x <= potCx + 5; x++)
        if (x >= 0 && x < TW) px(x, potTop, pt, 0.6);
    }

    // Frame 1: ANTICIPATION — arm pulls back (200ms)
    drawFrame(0, { rArmAngle: -0.6, rArmLen: 6, showSpoon: true, bodyLean: 0 });

    // Frame 2: ACTION — arm swings forward fast (80ms)
    drawFrame(32, { rArmAngle: 0.8, rArmLen: 8, showSpoon: true, bodyLean: 1 });

    // Frame 3: IMPACT — spoon in pot, arm extended (300ms hold)
    drawFrame(64, { rArmAngle: 0.5, rArmLen: 7, showSpoon: true, bodyLean: 0 });

    // Frame 4: RECOVERY — arm returning to neutral (150ms)
    drawFrame(96, { rArmAngle: 0.1, rArmLen: 7, showSpoon: true, bodyLean: 0 });
  },
};
