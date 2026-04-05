// Level 6.1: 2-Frame Idle Breathing — 500ms per frame
// Frame 1: exhale (neutral). Frame 2: inhale (torso up 1px, arms down 1px).
// Volume must be constant across frames.
// Layout: 2 frames side by side (64 × 48)
module.exports = {
  width: 64,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    skinLit: '#F2C4A0', skinShd: '#9B7B8A',
    hairLit: '#8B6542', hairShd: '#4A3B5A',
    shirtLit: '#5B8EC2', shirtShd: '#2E3E6A',
    pantsLit: '#7A7A6E', pantsShd: '#3E4252',
    shoeLit: '#5A4030', shoeShd: '#2A2035',
    eyeWhite: '#EEEEF0',
    eyeIris: '#4488BB',
    eyePupil: '#181828',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.skinLit.startIdx); },
  drawPost(pc, pal) {
    const TW = 64, TH = 48;
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
    const pn = { w: pg.pantsLit, c: pg.pantsShd };
    const so = { w: pg.shoeLit, c: pg.shoeShd };

    pc.pixels[0] = 0;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    function sphereV(x, y, scx, scy, r) {
      const nx = (x - scx) / r, ny = (y - scy) / r;
      const nz2 = 1 - nx * nx - ny * ny;
      if (nz2 < 0) return -1;
      const nz = Math.sqrt(nz2);
      const NdotL = nx * lx + ny * ly + nz * lz;
      const diffuse = Math.max(0, NdotL);
      const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 35) * 0.2;
      const bounce = Math.max(0, ny * 0.3) * 0.1;
      let v = 0.04 + diffuse * 0.68 + specular + bounce;
      v = v * v * (3 - 2 * v);
      return Math.max(0.02, Math.min(1, v));
    }

    function cylinderV(x, ccx, halfW) {
      const nx = (x - ccx) / (halfW + 0.5);
      const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
      const NdotL = nx * lx + nz * lz;
      const diffuse = Math.max(0, NdotL);
      const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 30) * 0.15;
      let v = 0.06 + diffuse * 0.62 + specular + 0.04;
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
    // DRAW ONE FRAME
    // breatheOffset: 0 = exhale (neutral), 1 = inhale (up)
    // ========================================
    function drawFrame(frameX, breatheOffset) {
      const cx = frameX + 15;
      const bo = breatheOffset; // 0 or -1 (up 1px on inhale)

      // HEAD — same position both frames (head stays still, Slynyrd reference)
      const headCy = 12, headRx = 10, headRy = 10;
      for (let y = headCy - headRy; y <= headCy + headRy; y++) {
        for (let x = cx - headRx; x <= cx + headRx; x++) {
          if (x < 0 || x >= TW || y < 0 || y >= TH) continue;
          const nx = (x - cx) / headRx, ny = (y - headCy) / headRy;
          if (nx * nx + ny * ny > 1) continue;
          let v = sphereV(x, y, cx, headCy, headRx);
          if (v < 0) continue;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          if (ny > -0.2 && ny < 0.7 && Math.abs(nx) < 0.55 && nz > 0.6)
            v = 0.5 + v * 0.5;
          px(x, y, sk, v);
        }
      }

      // Hair cap
      for (let y = 1; y <= headCy + 3; y++) {
        const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y - headCy) / headRy) ** 2)) * headRx);
        if (y < headCy - 2) {
          for (let x = cx - headHW - 1; x <= cx + headHW + 1; x++) {
            if (x < 0 || x >= TW) continue;
            let v = sphereV(x, y, cx, headCy, headRx + 1);
            if (v < 0) continue;
            v *= 0.75;
            px(x, y, hr, v);
          }
        } else {
          for (let dx = -1; dx <= 1; dx++) {
            const lhx = cx - headHW - 1 + dx, rhx = cx + headHW + 1 + dx;
            if (lhx >= 0 && lhx < TW) px(lhx, y, hr, 0.15 + dx * 0.02);
            if (rhx >= 0 && rhx < TW) px(rhx, y, hr, 0.35 + dx * 0.05);
          }
        }
      }

      // Hair highlight
      for (let y = 3; y <= 7; y++) px(cx - 4, y, hr, 0.85);

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            px(cx - headRx + dx, headCy + 1 + dy, sk, 0.25);
            px(cx + headRx + dx, headCy + 1 + dy, sk, 0.6);
          }

      // Eyes (4×4)
      const eyeY = headCy - 2;
      const eyeGap = 5;
      const leX = cx - Math.floor(eyeGap / 2) - 3;
      const reX = cx + Math.ceil(eyeGap / 2);
      for (let dy = 0; dy < 4; dy++)
        for (let dx = 0; dx < 4; dx++) {
          pxc(leX + dx, eyeY + dy, pg.eyeWhite, 0.85);
          pxc(reX + dx, eyeY + dy, pg.eyeWhite, 0.85);
        }
      for (let dy = 1; dy < 4; dy++)
        for (let dx = 1; dx < 3; dx++) {
          pxc(leX + dx, eyeY + dy, pg.eyeIris, 0.4 + dy * 0.12);
          pxc(reX + dx, eyeY + dy, pg.eyeIris, 0.4 + dy * 0.12);
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
      const mouthY = headCy + Math.round(headRy * 0.4);
      for (let dx = -1; dx <= 1; dx++) px(cx + dx, mouthY, sk, 0.28);

      // NECK — shifts with body
      const neckTop = headCy + headRy + 1;
      for (let y = neckTop; y <= neckTop + 1; y++)
        for (let x = cx - 2; x <= cx + 2; x++)
          px(x, y + bo, sk, cylinderV(x, cx, 2.5) * 0.35);

      // TORSO — shifts up on inhale
      const tL = cx - 7, torsoW = 14;
      const torsoTop = 25 + bo;
      for (let y = torsoTop; y <= torsoTop + 7; y++) {
        for (let x = tL; x < tL + torsoW; x++) {
          if (x < 0 || x >= TW || y < 0 || y >= TH) continue;
          if (y === torsoTop && (x === tL || x === tL + torsoW - 1)) continue;
          let v = cylinderV(x, cx, torsoW / 2);
          v *= (1.0 - ((y - torsoTop) / 8) * 0.12);
          px(x, y, sh, v);
        }
      }

      // Collar
      px(cx - 1, torsoTop, sh, 0.25);
      px(cx, torsoTop, sk, 0.5);
      px(cx + 1, torsoTop, sh, 0.25);

      // Belt
      for (let x = tL + 1; x < tL + torsoW - 1; x++)
        if (x >= 0 && x < TW) px(x, torsoTop + 7, sh, 0.15);

      // ARMS — drop 1px on inhale (counter to torso rise)
      const armTop = torsoTop + 1;
      const armShift = -bo; // arms go DOWN when torso goes UP
      for (let y = armTop; y <= armTop + 6; y++) {
        for (let dx = 0; dx < 3; dx++) {
          const lax = tL - 3 + dx, rax = tL + torsoW + dx;
          if (lax >= 0) px(lax, y + armShift, sh, cylinderV(lax, tL - 1.5, 1.5) * 0.7);
          if (rax < TW) px(rax, y + armShift, sh, cylinderV(rax, tL + torsoW + 1.5, 1.5));
        }
      }
      // Hands
      for (let y = armTop + 7; y <= armTop + 8; y++)
        for (let dx = 0; dx < 3; dx++) {
          px(tL - 3 + dx, y + armShift, sk, 0.3);
          px(tL + torsoW + dx, y + armShift, sk, 0.6);
        }

      // LEGS — stay planted (no movement on idle breathe)
      const legY = 33;
      for (let y = legY; y < legY + 7; y++) {
        for (let dx = 0; dx < 4; dx++) {
          px(cx - 5 + dx, y, pn, cylinderV(cx - 5 + dx, cx - 3, 2) * 0.8);
          px(cx + 1 + dx, y, pn, cylinderV(cx + 1 + dx, cx + 3, 2));
        }
      }

      // Shoes — stay planted
      for (let y = 40; y < 42; y++) {
        for (let dx = -1; dx < 4; dx++) px(cx - 5 + dx, y, so, 0.25);
        for (let dx = 0; dx <= 4; dx++) px(cx + 1 + dx, y, so, 0.5);
      }
    }

    // ========================================
    // FRAME 1: Exhale (neutral position)
    // ========================================
    drawFrame(0, 0);

    // ========================================
    // FRAME 2: Inhale (torso up 1px, arms down 1px)
    // ========================================
    drawFrame(32, -1);
  },
};
