// Level 5.2: Full Face at Target Scale
// 20px chibi head with: 4×4 eyes, 3px mouth, upper lid lines, hair highlight
// No nose at this scale. Face should read as expressive.
module.exports = {
  width: 32,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    skinLit: '#F2C4A0', skinShd: '#9B7B8A',
    hairLit: '#8B6542', hairShd: '#4A3B5A',
    eyeWhite: '#EEEEF0',
    eyeIris: '#4488BB',
    eyePupil: '#181828',
    shirtLit: '#5B8EC2', shirtShd: '#2E3E6A',
    pantsLit: '#7A7A6E', pantsShd: '#3E4252',
    shoeLit: '#5A4030', shoeShd: '#2A2035',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.skinLit.startIdx); },
  drawPost(pc, pal) {
    const W = 32, H = 48;
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
    const cx = 15;

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
      if (x >= 0 && x < W && y >= 0 && y < H)
        pc.setPixel(x, y, dt(mat.w, mat.c, v));
    }
    function pxc(x, y, grp, v) {
      if (x >= 0 && x < W && y >= 0 && y < H)
        pc.setPixel(x, y, tone(grp, Math.max(0, Math.min(1, v))));
    }

    // ========================================
    // HEAD — sphere, face bright (skin)
    // ========================================
    const headCy = 12, headRx = 10, headRy = 10;
    for (let y = headCy - headRy; y <= headCy + headRy; y++) {
      for (let x = cx - headRx; x <= cx + headRx; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const nx = (x - cx) / headRx, ny = (y - headCy) / headRy;
        if (nx * nx + ny * ny > 1) continue;
        let v = sphereV(x, y, cx, headCy, 10);
        if (v < 0) continue;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        // Face bias: front face bright for features. ny<0.7 covers past the mouth.
        if (ny > -0.2 && ny < 0.7 && Math.abs(nx) < 0.55 && nz > 0.6)
          v = 0.5 + v * 0.5;
        px(x, y, sk, v);
      }
    }

    // Hair cap on top
    for (let y = 1; y <= headCy + 3; y++) {
      const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y - headCy) / headRy) ** 2)) * headRx);
      if (y < headCy - 2) {
        for (let x = cx - headHW - 1; x <= cx + headHW + 1; x++) {
          if (x < 0 || x >= W) continue;
          let v = sphereV(x, y, cx, headCy, 11);
          if (v < 0) continue;
          v *= 0.75;
          px(x, y, hr, v);
        }
      } else {
        for (let dx = -1; dx <= 1; dx++) {
          const lhx = cx - headHW - 1 + dx, rhx = cx + headHW + 1 + dx;
          if (lhx >= 0) px(lhx, y, hr, 0.15 + dx * 0.02);
          if (rhx >= 0 && rhx < W) px(rhx, y, hr, 0.35 + dx * 0.05);
        }
      }
    }

    // Hair highlight — 1-2px bright streak on lit side
    for (let y = 3; y <= 7; y++) {
      const hx = cx - 4; // lit side
      px(hx, y, hr, 0.85);
      if (y >= 4 && y <= 6) px(hx + 1, y, hr, 0.7);
    }

    // Ears
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (dx * dx + dy * dy <= 1) {
          px(cx - headRx + dx, headCy + 1 + dy, sk, 0.25);
          px(cx + headRx + dx, headCy + 1 + dy, sk, 0.6);
        }

    // ========================================
    // EYES — 4×4 (white + iris + pupil + specular + lid)
    // ========================================
    const eyeY = headCy - 2; // above center
    const eyeGap = 5;
    const leX = cx - Math.floor(eyeGap / 2) - 3;
    const reX = cx + Math.ceil(eyeGap / 2);

    // White sclera
    for (let dy = 0; dy < 4; dy++)
      for (let dx = 0; dx < 4; dx++) {
        pxc(leX + dx, eyeY + dy, pg.eyeWhite, 0.85);
        pxc(reX + dx, eyeY + dy, pg.eyeWhite, 0.85);
      }
    // Iris (2×3 bottom area)
    for (let dy = 1; dy < 4; dy++)
      for (let dx = 1; dx < 3; dx++) {
        pxc(leX + dx, eyeY + dy, pg.eyeIris, 0.4 + dy * 0.15);
        pxc(reX + dx, eyeY + dy, pg.eyeIris, 0.4 + dy * 0.15);
      }
    // Pupil (2×2 center)
    for (let dy = 1; dy < 3; dy++)
      for (let dx = 1; dx < 3; dx++) {
        pxc(leX + dx, eyeY + dy, pg.eyePupil, 0.9);
        pxc(reX + dx, eyeY + dy, pg.eyePupil, 0.9);
      }
    // Specular (upper-left of pupil — toward light)
    pxc(leX + 1, eyeY + 1, pg.eyeWhite, 1.0);
    pxc(reX + 1, eyeY + 1, pg.eyeWhite, 1.0);
    // Upper lid line (dark, 1px above eye)
    for (let dx = 0; dx < 4; dx++) {
      pxc(leX + dx, eyeY - 1, pg.eyePupil, 0.5);
      pxc(reX + dx, eyeY - 1, pg.eyePupil, 0.5);
    }

    // ========================================
    // MOUTH — 3px line in shadow skin tone
    // ========================================
    const mouthY = headCy + Math.round(headRy * 0.4);
    for (let dx = -1; dx <= 1; dx++)
      px(cx + dx, mouthY, sk, 0.28);

    // ========================================
    // NECK — 5px wide, overlaps head by 1px
    // ========================================
    const neckTop = headCy + headRy;
    for (let y = neckTop; y <= neckTop + 1; y++)
      for (let x = cx - 2; x <= cx + 2; x++)
        px(x, y, sk, cylinderV(x, cx, 2.5) * 0.35);

    // ========================================
    // TORSO (shirt) — cylinder
    // ========================================
    const tL = cx - 7, torsoW = 14;
    for (let y = 25; y <= 32; y++) {
      for (let x = tL; x < tL + torsoW; x++) {
        if (x < 0 || x >= W) continue;
        if (y === 25 && (x === tL || x === tL + torsoW - 1)) continue;
        let v = cylinderV(x, cx, torsoW / 2);
        v *= (1.0 - ((y - 25) / 8) * 0.12);
        px(x, y, sh, v);
      }
    }

    // Arms
    for (let y = 26; y <= 32; y++) {
      for (let dx = 0; dx < 3; dx++) {
        const lax = tL - 3 + dx, rax = tL + torsoW + dx;
        if (lax >= 0) px(lax, y, sh, cylinderV(lax, tL - 1.5, 1.5) * 0.7);
        if (rax < W) px(rax, y, sh, cylinderV(rax, tL + torsoW + 1.5, 1.5));
      }
    }
    // Hands
    for (let y = 33; y <= 34; y++)
      for (let dx = 0; dx < 3; dx++) {
        px(tL - 3 + dx, y, sk, 0.3);
        px(tL + torsoW + dx, y, sk, 0.6);
      }

    // Belt
    for (let x = tL + 1; x < tL + torsoW - 1; x++)
      px(x, 32, sh, 0.15);

    // Collar detail — V-neckline
    px(cx - 1, 25, sh, 0.25);
    px(cx, 25, sk, 0.5);
    px(cx + 1, 25, sh, 0.25);

    // ========================================
    // LEGS (pants) — cylinders
    // ========================================
    const legY = 33, legW = 4, legH = 7;
    for (let y = legY; y < legY + legH; y++) {
      for (let dx = 0; dx < legW; dx++) {
        const llx = cx - 5 + dx, rlx = cx + 1 + dx;
        px(llx, y, pn, cylinderV(llx, cx - 3, legW / 2) * 0.8);
        px(rlx, y, pn, cylinderV(rlx, cx + 3, legW / 2));
      }
    }

    // Shoes
    const shoeY = legY + legH;
    for (let y = shoeY; y < shoeY + 2; y++) {
      for (let dx = -1; dx < legW; dx++) px(cx - 5 + dx, y, so, 0.25);
      for (let dx = 0; dx <= legW; dx++) px(cx + 1 + dx, y, so, 0.5);
    }
  },
};
