// Level 5.3: Complete Characters — Chef + 3 Customers with faces, clothing detail
// Applies Level 5.2 face features to Level 4.2 coloured characters
// Each character should have visible personality from the sprite alone
module.exports = {
  width: 136,
  height: 50,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    skinLit: '#F2C4A0', skinShd: '#9B7B8A',
    chefHairLit: '#8B6542', chefHairShd: '#4A3B5A',
    chefShirtLit: '#5B8EC2', chefShirtShd: '#2E3E6A',
    clothLit: '#E8E0D0', clothShd: '#9A95A8',
    blondeLit: '#D4B060', blondeShd: '#7A6848',
    redShirtLit: '#C85040', redShirtShd: '#6A2840',
    darkHairLit: '#3A3530', darkHairShd: '#1A1828',
    greenShirtLit: '#5AAA60', greenShirtShd: '#2A5A40',
    greyHairLit: '#A8A0A0', greyHairShd: '#605868',
    purpleShirtLit: '#8A5A8A', purpleShirtShd: '#4A2A5A',
    pantsLit: '#7A7A6E', pantsShd: '#3E4252',
    shoeLit: '#5A4030', shoeShd: '#2A2035',
    eyeWhite: '#EEEEF0',
    eyeIris: '#4488BB',
    eyeGreen: '#44AA55',
    eyeBrown: '#886644',
    eyePupil: '#181828',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.skinLit.startIdx); },
  drawPost(pc, pal) {
    const TW = 136, TH = 50;
    const pg = pal.groups;

    function tone(grp, frac) {
      return grp.startIdx + Math.max(0, Math.min(grp.toneCount - 1,
        Math.round(frac * (grp.toneCount - 1))));
    }
    function dt(wg, cg, v) {
      return v > 0.38 ? tone(wg, v) : tone(cg, Math.max(0.04, v * 1.2));
    }

    const sk = { w: pg.skinLit, c: pg.skinShd };
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
    // DRAW FULL CHARACTER with face
    // ========================================
    function drawCharacter(cx, opts) {
      const hairMat = opts.hair;
      const shirtMat = opts.shirt;
      const irisGrp = opts.irisGrp || pg.eyeIris;
      const scale = opts.scale || 1.0;
      const headCy = opts.headCy || 12;
      const headRx = Math.round(10 * scale), headRy = Math.round(10 * scale);

      // HEAD — sphere, face bright
      for (let y = headCy - headRy; y <= headCy + headRy; y++) {
        for (let x = cx - headRx; x <= cx + headRx; x++) {
          if (x < 0 || x >= TW || y < 0 || y >= TH) continue;
          const nx = (x - cx) / headRx, ny = (y - headCy) / headRy;
          if (nx * nx + ny * ny > 1) continue;
          let v = sphereV(x, y, cx, headCy, headRx);
          if (v < 0) continue;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          // Face bias: front face bright for features. ny<0.7 covers past the mouth.
          if (ny > -0.2 && ny < 0.7 && Math.abs(nx) < 0.55 && nz > 0.6)
            v = 0.5 + v * 0.5;
          px(x, y, sk, v);
        }
      }

      // Hair cap
      for (let y = Math.max(0, headCy - headRy - 2); y <= headCy + 3; y++) {
        const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y - headCy) / headRy) ** 2)) * headRx);
        if (y < headCy - Math.round(headRy * 0.2)) {
          for (let x = cx - headHW - 1; x <= cx + headHW + 1; x++) {
            if (x < 0 || x >= TW) continue;
            let v = sphereV(x, y, cx, headCy, headRx + 1);
            if (v < 0) continue;
            v *= 0.75;
            px(x, y, hairMat, v);
          }
        } else {
          for (let dx = -1; dx <= 1; dx++) {
            const lhx = cx - headHW - 1 + dx, rhx = cx + headHW + 1 + dx;
            if (lhx >= 0 && lhx < TW) px(lhx, y, hairMat, 0.15 + dx * 0.02);
            if (rhx >= 0 && rhx < TW) px(rhx, y, hairMat, 0.35 + dx * 0.05);
          }
        }
      }

      // Hair highlight
      for (let y = headCy - headRy + 1; y <= headCy - headRy + 5; y++) {
        if (y >= 0 && y < TH) {
          px(cx - Math.round(headRx * 0.4), y, hairMat, 0.85);
        }
      }

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            px(cx - headRx + dx, headCy + 1 + dy, sk, 0.25);
            px(cx + headRx + dx, headCy + 1 + dy, sk, 0.6);
          }

      // ---- EYES ----
      const eyeSize = Math.max(2, Math.round(4 * scale));
      const eyeY = headCy - Math.round(headRy * 0.2);
      const eyeGap = Math.round(5 * scale);

      if (eyeSize >= 4) {
        // Full 4×4 eyes
        const leX = cx - Math.floor(eyeGap / 2) - eyeSize + 1;
        const reX = cx + Math.ceil(eyeGap / 2);
        // White sclera
        for (let dy = 0; dy < eyeSize; dy++)
          for (let dx = 0; dx < eyeSize; dx++) {
            pxc(leX + dx, eyeY + dy, pg.eyeWhite, 0.85);
            pxc(reX + dx, eyeY + dy, pg.eyeWhite, 0.85);
          }
        // Iris
        for (let dy = 1; dy < eyeSize; dy++)
          for (let dx = 1; dx < eyeSize - 1; dx++) {
            pxc(leX + dx, eyeY + dy, irisGrp, 0.4 + dy * 0.12);
            pxc(reX + dx, eyeY + dy, irisGrp, 0.4 + dy * 0.12);
          }
        // Pupil
        for (let dy = 1; dy < eyeSize - 1; dy++)
          for (let dx = 1; dx < eyeSize - 1; dx++) {
            pxc(leX + dx, eyeY + dy, pg.eyePupil, 0.9);
            pxc(reX + dx, eyeY + dy, pg.eyePupil, 0.9);
          }
        // Specular
        pxc(leX + 1, eyeY + 1, pg.eyeWhite, 1.0);
        pxc(reX + 1, eyeY + 1, pg.eyeWhite, 1.0);
        // Lid line
        for (let dx = 0; dx < eyeSize; dx++) {
          pxc(leX + dx, eyeY - 1, pg.eyePupil, 0.5);
          pxc(reX + dx, eyeY - 1, pg.eyePupil, 0.5);
        }
      } else if (eyeSize >= 3) {
        // 3×3 eyes
        const leX = cx - Math.floor(eyeGap / 2) - eyeSize + 1;
        const reX = cx + Math.ceil(eyeGap / 2);
        for (let dy = 0; dy < 3; dy++)
          for (let dx = 0; dx < 3; dx++) {
            pxc(leX + dx, eyeY + dy, irisGrp, 0.6);
            pxc(reX + dx, eyeY + dy, irisGrp, 0.6);
          }
        pxc(leX + 1, eyeY + 1, pg.eyePupil, 0.9);
        pxc(reX + 1, eyeY + 1, pg.eyePupil, 0.9);
        pxc(leX, eyeY, pg.eyeWhite, 0.95);
        pxc(reX, eyeY, pg.eyeWhite, 0.95);
        for (let dx = 0; dx < 3; dx++) {
          pxc(leX + dx, eyeY - 1, pg.eyePupil, 0.5);
          pxc(reX + dx, eyeY - 1, pg.eyePupil, 0.5);
        }
      } else {
        // 2×2 eyes
        const leX = cx - Math.floor(eyeGap / 2) - 1;
        const reX = cx + Math.ceil(eyeGap / 2);
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            pxc(leX + dx, eyeY + dy, pg.eyePupil, 0.8);
            pxc(reX + dx, eyeY + dy, pg.eyePupil, 0.8);
          }
        pxc(leX, eyeY, pg.eyeWhite, 0.95);
        pxc(reX, eyeY, pg.eyeWhite, 0.95);
      }

      // Mouth
      const mouthY = headCy + Math.round(headRy * 0.4);
      const mouthW = Math.round(3 * scale);
      const mouthHalf = Math.floor(mouthW / 2);
      for (let dx = -mouthHalf; dx <= mouthHalf; dx++)
        px(cx + dx, mouthY, sk, 0.28);

      // Neck — 5px wide, overlaps head by 1px to avoid pinch
      const neckTop = headCy + headRy;
      for (let y = neckTop; y <= neckTop + 1; y++)
        for (let x = cx - 2; x <= cx + 2; x++)
          px(x, y, sk, cylinderV(x, cx, 2.5) * 0.35);

      // Torso
      const torsoW = Math.round(14 * scale), torsoH = Math.round(8 * scale);
      const tL = cx - Math.floor(torsoW / 2);
      const torsoTop = neckTop + 2;
      for (let y = torsoTop; y < torsoTop + torsoH; y++) {
        for (let x = tL; x < tL + torsoW; x++) {
          if (x < 0 || x >= TW) continue;
          if (y === torsoTop && (x === tL || x === tL + torsoW - 1)) continue;
          let v = cylinderV(x, cx, torsoW / 2);
          v *= (1.0 - ((y - torsoTop) / torsoH) * 0.12);
          px(x, y, shirtMat, v);
        }
      }

      // Arms
      const armTop = torsoTop + 1;
      const armW = Math.max(2, Math.round(3 * scale));
      const armH = Math.round(7 * scale);
      for (let y = armTop; y < armTop + armH; y++) {
        for (let dx = 0; dx < armW; dx++) {
          const lax = tL - armW + dx, rax = tL + torsoW + dx;
          if (lax >= 0) px(lax, y, shirtMat, cylinderV(lax, tL - armW / 2, armW / 2) * 0.7);
          if (rax < TW) px(rax, y, shirtMat, cylinderV(rax, tL + torsoW + armW / 2, armW / 2));
        }
      }
      // Hands
      for (let y = armTop + armH; y < armTop + armH + 2; y++)
        for (let dx = 0; dx < armW; dx++) {
          px(tL - armW + dx, y, sk, 0.3);
          px(tL + torsoW + dx, y, sk, 0.6);
        }

      // Belt
      for (let x = tL + 1; x < tL + torsoW - 1; x++)
        if (x >= 0 && x < TW) px(x, torsoTop + torsoH - 1, shirtMat, 0.15);

      // Collar
      px(cx - 1, torsoTop, shirtMat, 0.25);
      px(cx, torsoTop, sk, 0.5);
      px(cx + 1, torsoTop, shirtMat, 0.25);

      // Legs
      const legY = torsoTop + torsoH;
      const legW = Math.round(4 * scale), legH = Math.round(7 * scale);
      for (let y = legY; y < legY + legH; y++) {
        for (let dx = 0; dx < legW; dx++) {
          const llx = cx - 1 - legW + dx, rlx = cx + 1 + dx;
          px(llx, y, pn, cylinderV(llx, cx - 1 - legW / 2, legW / 2) * 0.8);
          px(rlx, y, pn, cylinderV(rlx, cx + 1 + legW / 2, legW / 2));
        }
      }

      // Shoes
      for (let y = legY + legH; y < legY + legH + 2; y++) {
        for (let dx = -1; dx < legW; dx++) px(cx - 1 - legW + dx, y, so, 0.25);
        for (let dx = 0; dx <= legW; dx++) px(cx + 1 + dx, y, so, 0.5);
      }

      return { tL, torsoW, torsoTop, torsoH, neckTop, legY, legH };
    }

    // ========================================
    // 1. CHEF — toque, apron, blue eyes
    // ========================================
    {
      const cx = 17;
      const cl = { w: pg.clothLit, c: pg.clothShd };
      const chSh = { w: pg.chefShirtLit, c: pg.chefShirtShd };
      const chHr = { w: pg.chefHairLit, c: pg.chefHairShd };

      // Toque puff
      for (let y = 0; y <= 4; y++)
        for (let x = cx - 7; x <= cx + 7; x++) {
          if (x < 0 || x >= TW) continue;
          const d = Math.sqrt(((x - cx) / 7) ** 2 + ((y - 2) / 3) ** 2);
          if (d > 1) continue;
          let v = sphereV(x, y, cx, 2, 7);
          if (v < 0) v = 0.6;
          px(x, y, cl, 0.4 + v * 0.6);
        }
      // Toque body
      for (let y = 4; y <= 7; y++)
        for (let x = cx - 6; x <= cx + 6; x++)
          if (x >= 0 && x < TW) px(x, y, cl, 0.35 + cylinderV(x, cx, 6) * 0.65);

      const parts = drawCharacter(cx, {
        hair: chHr, shirt: chSh, headCy: 14, irisGrp: pg.eyeIris
      });

      // Apron
      for (let y = parts.torsoTop + 2; y <= parts.legY + 3; y++) {
        const taper = y > parts.legY ? Math.floor((y - parts.legY) * 0.5) : 0;
        for (let x = parts.tL + taper; x < parts.tL + parts.torsoW - taper; x++)
          if (x >= 0 && x < TW) px(x, y, cl, 0.35 + cylinderV(x, cx, parts.torsoW / 2) * 0.6);
      }
      // Apron straps
      for (let y = parts.neckTop; y <= parts.torsoTop + 2; y++) {
        px(cx - 4, y, cl, 0.65);
        px(cx + 4, y, cl, 0.7);
      }
    }

    // ========================================
    // 2. CUSTOMER 1 — blonde, red shirt, green eyes, long hair
    // ========================================
    {
      const cx = 51;
      const c1Hr = { w: pg.blondeLit, c: pg.blondeShd };
      const c1Sh = { w: pg.redShirtLit, c: pg.redShirtShd };

      drawCharacter(cx, { hair: c1Hr, shirt: c1Sh, irisGrp: pg.eyeGreen });

      // Long flowing blonde hair
      for (let y = 8; y <= 30; y++) {
        const taper = y > 24 ? (y - 24) / 6 : 0;
        const w = Math.max(0, Math.round(2 - taper * 2));
        if (w > 0) {
          for (let dx = 0; dx < w; dx++) {
            const lhx = cx - 12 + dx, rhx = cx + 11 + dx;
            if (lhx >= 0) px(lhx, y, c1Hr, 0.2 + (y < 15 ? 0.1 : 0));
            if (rhx < TW) px(rhx, y, c1Hr, 0.45 + (y < 15 ? 0.1 : 0));
          }
        }
      }
    }

    // ========================================
    // 3. CUSTOMER 2 — kid, dark hair, green shirt, brown eyes
    // ========================================
    {
      const cx = 85;
      const c2Hr = { w: pg.darkHairLit, c: pg.darkHairShd };
      const c2Sh = { w: pg.greenShirtLit, c: pg.greenShirtShd };

      drawCharacter(cx, {
        hair: c2Hr, shirt: c2Sh, scale: 0.8, headCy: 16, irisGrp: pg.eyeBrown
      });

      // Spiky kid hair
      const spikes = [
        { x: cx - 4, w: 3, top: 5 },
        { x: cx - 1, w: 3, top: 4 },
        { x: cx + 2, w: 3, top: 6 },
      ];
      for (const sp of spikes) {
        for (let y = sp.top; y <= 8; y++) {
          const t = (y - sp.top) / (8 - sp.top + 1);
          const w = Math.max(1, Math.round(sp.w * t));
          const startX = sp.x + Math.floor((sp.w - w) / 2);
          for (let dx = 0; dx < w; dx++) {
            const sx = startX + dx;
            if (sx >= 0 && sx < TW) {
              let v = sphereV(sx, y, cx, 16, 9);
              if (v < 0) v = 0.3;
              v *= 0.7;
              px(sx, y, c2Hr, v);
            }
          }
        }
      }
    }

    // ========================================
    // 4. CUSTOMER 3 — elderly, grey hair bun, purple cardigan, blue eyes
    // ========================================
    {
      const cx = 119;
      const c3Hr = { w: pg.greyHairLit, c: pg.greyHairShd };
      const c3Sh = { w: pg.purpleShirtLit, c: pg.purpleShirtShd };

      drawCharacter(cx, { hair: c3Hr, shirt: c3Sh, irisGrp: pg.eyeIris });

      // Bun on top
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          if (dx * dx / 9 + dy * dy / 4 > 1) continue;
          const bx = cx + dx, by = 1 + dy;
          if (bx >= 0 && bx < TW && by >= 0) {
            let v = sphereV(bx, by, cx, 1, 3);
            if (v < 0) v = 0.4;
            v *= 0.8;
            px(bx, by, c3Hr, v);
          }
        }
    }
  },
};
