// Level 6.2: 4-Frame Walk Cycle (Stardew pattern: 0→1→0→2)
// Frame 0: neutral stand. Frame 1: right step. Frame 2: left step.
// Legs: 2-3px stride. Body: 1px bob. Arms: counter-swing to legs.
// Layout: 3 unique frames side by side (96 × 48)
module.exports = {
  width: 96,
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
    const TW = 96, TH = 48;
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
    // DRAW WALK FRAME
    // opts: { bodyBob, leftLegShift, rightLegShift, leftArmShift, rightArmShift }
    // ========================================
    function drawFrame(frameX, opts) {
      const cx = frameX + 15;
      const bob = opts.bodyBob || 0;       // vertical offset for head+torso
      const lLeg = opts.leftLegShift || 0;  // horizontal leg offset
      const rLeg = opts.rightLegShift || 0;
      const lArm = opts.leftArmShift || 0;  // vertical arm offset
      const rArm = opts.rightArmShift || 0;

      // HEAD — bobs with body
      const headCy = 12 + bob, headRx = 10, headRy = 10;
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

      // Hair
      for (let y = Math.max(0, 1 + bob); y <= headCy + 3; y++) {
        const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y - headCy) / headRy) ** 2)) * headRx);
        if (y < headCy - 2) {
          for (let x = cx - headHW - 1; x <= cx + headHW + 1; x++) {
            if (x < 0 || x >= TW) continue;
            let v = sphereV(x, y, cx, headCy, headRx + 1);
            if (v < 0) continue;
            px(x, y, hr, v * 0.75);
          }
        } else {
          for (let dx = -1; dx <= 1; dx++) {
            const lhx = cx - headHW - 1 + dx, rhx = cx + headHW + 1 + dx;
            if (lhx >= 0 && lhx < TW) px(lhx, y, hr, 0.15 + dx * 0.02);
            if (rhx >= 0 && rhx < TW) px(rhx, y, hr, 0.35 + dx * 0.05);
          }
        }
      }
      for (let y = 3 + bob; y <= 7 + bob; y++)
        if (y >= 0) px(cx - 4, y, hr, 0.85);

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            px(cx - headRx + dx, headCy + 1 + dy, sk, 0.25);
            px(cx + headRx + dx, headCy + 1 + dy, sk, 0.6);
          }

      // Eyes
      const eyeY = headCy - 2;
      const leX = cx - Math.floor(5 / 2) - 3;
      const reX = cx + Math.ceil(5 / 2);
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
      for (let dx = -1; dx <= 1; dx++)
        px(cx + dx, headCy + 4, sk, 0.28);

      // Neck
      for (let y = headCy + headRy + 1; y <= headCy + headRy + 2; y++)
        for (let x = cx - 2; x <= cx + 2; x++)
          px(x, y, sk, cylinderV(x, cx, 2.5) * 0.35);

      // Torso — bobs with body
      const tL = cx - 7, torsoW = 14;
      const torsoTop = 25 + bob;
      for (let y = torsoTop; y <= torsoTop + 7; y++) {
        for (let x = tL; x < tL + torsoW; x++) {
          if (x < 0 || x >= TW || y < 0 || y >= TH) continue;
          if (y === torsoTop && (x === tL || x === tL + torsoW - 1)) continue;
          let v = cylinderV(x, cx, torsoW / 2);
          v *= (1.0 - ((y - torsoTop) / 8) * 0.12);
          px(x, y, sh, v);
        }
      }
      px(cx - 1, torsoTop, sh, 0.25);
      px(cx, torsoTop, sk, 0.5);
      px(cx + 1, torsoTop, sh, 0.25);
      for (let x = tL + 1; x < tL + torsoW - 1; x++)
        if (x >= 0 && x < TW) px(x, torsoTop + 7, sh, 0.15);

      // Left arm — counter-swings (shifts vertically)
      const armBase = torsoTop + 1;
      for (let y = armBase; y <= armBase + 6; y++) {
        for (let dx = 0; dx < 3; dx++) {
          const ax = tL - 3 + dx;
          if (ax >= 0 && y + lArm >= 0 && y + lArm < TH)
            px(ax, y + lArm, sh, cylinderV(ax, tL - 1.5, 1.5) * 0.7);
        }
      }
      for (let y = armBase + 7; y <= armBase + 8; y++)
        for (let dx = 0; dx < 3; dx++)
          if (tL - 3 + dx >= 0 && y + lArm >= 0 && y + lArm < TH)
            px(tL - 3 + dx, y + lArm, sk, 0.3);

      // Right arm
      for (let y = armBase; y <= armBase + 6; y++) {
        for (let dx = 0; dx < 3; dx++) {
          const ax = tL + torsoW + dx;
          if (ax < TW && y + rArm >= 0 && y + rArm < TH)
            px(ax, y + rArm, sh, cylinderV(ax, tL + torsoW + 1.5, 1.5));
        }
      }
      for (let y = armBase + 7; y <= armBase + 8; y++)
        for (let dx = 0; dx < 3; dx++)
          if (tL + torsoW + dx < TW && y + rArm >= 0 && y + rArm < TH)
            px(tL + torsoW + dx, y + rArm, sk, 0.6);

      // Legs — shift horizontally for stride
      const legY = 33;
      // Left leg
      for (let y = legY; y < legY + 7; y++) {
        for (let dx = 0; dx < 4; dx++) {
          const lx2 = cx - 5 + dx + lLeg;
          if (lx2 >= 0 && lx2 < TW)
            px(lx2, y, pn, cylinderV(lx2, cx - 3 + lLeg, 2) * 0.8);
        }
      }
      // Right leg
      for (let y = legY; y < legY + 7; y++) {
        for (let dx = 0; dx < 4; dx++) {
          const rx2 = cx + 1 + dx + rLeg;
          if (rx2 >= 0 && rx2 < TW)
            px(rx2, y, pn, cylinderV(rx2, cx + 3 + rLeg, 2));
        }
      }

      // Shoes — follow legs
      for (let y = 40; y < 42; y++) {
        for (let dx = -1; dx < 4; dx++) {
          const sx = cx - 5 + dx + lLeg;
          if (sx >= 0 && sx < TW) px(sx, y, so, 0.25);
        }
        for (let dx = 0; dx <= 4; dx++) {
          const sx = cx + 1 + dx + rLeg;
          if (sx >= 0 && sx < TW) px(sx, y, so, 0.5);
        }
      }
    }

    // Frame 0: Neutral stand (contact position)
    drawFrame(0, {
      bodyBob: 0,
      leftLegShift: 0, rightLegShift: 0,
      leftArmShift: 0, rightArmShift: 0,
    });

    // Frame 1: Right step forward (right leg ahead, left back, body up)
    drawFrame(32, {
      bodyBob: -1,  // body rises on pass
      leftLegShift: -2, rightLegShift: 2,   // legs split
      leftArmShift: -1, rightArmShift: 1,    // arms counter-swing
    });

    // Frame 2: Left step forward (mirror of frame 1)
    drawFrame(64, {
      bodyBob: -1,
      leftLegShift: 2, rightLegShift: -2,
      leftArmShift: 1, rightArmShift: -1,
    });
  },
};
