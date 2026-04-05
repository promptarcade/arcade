// Level 4.1: Coloured Character — dual palette temperature shading
// Warm skin lit side, cool skin shadow. Hue shifts in shadows, not just darker.
// Each body part: skin (warm peach → cool mauve), hair (warm brown → cool brown),
// shirt (warm blue → cool navy), pants (warm grey → cool slate), shoes (dark)
module.exports = {
  width: 32,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    skinLit: '#F2C4A0',    // warm peach
    skinShd: '#9B7B8A',    // cool mauve
    hairLit: '#8B6542',    // warm brown
    hairShd: '#4A3B5A',    // cool purple-brown
    shirtLit: '#5B8EC2',   // warm blue
    shirtShd: '#2E3E6A',   // cool deep navy
    pantsLit: '#7A7A6E',   // warm grey-green
    pantsShd: '#3E4252',   // cool slate
    apronLit: '#E8E0D0',   // warm cream
    apronShd: '#9A95A8',   // cool lavender-grey
    shoeLit: '#5A4030',    // warm dark brown
    shoeShd: '#2A2035',    // cool dark purple
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.skinLit.startIdx); },
  drawPost(pc, pal) {
    // Tone helper for any group
    function tone(grp, frac) {
      return grp.startIdx + Math.max(0, Math.min(grp.toneCount - 1,
        Math.round(frac * (grp.toneCount - 1))));
    }
    // Dual palette: warm above threshold, cool below
    function dualTone(warmGrp, coolGrp, v, threshold) {
      threshold = threshold || 0.38;
      if (v > threshold) {
        return tone(warmGrp, v);
      } else {
        return tone(coolGrp, Math.max(0.04, v * 1.2));
      }
    }

    const sk = { w: pal.groups.skinLit, c: pal.groups.skinShd };
    const hr = { w: pal.groups.hairLit, c: pal.groups.hairShd };
    const sh = { w: pal.groups.shirtLit, c: pal.groups.shirtShd };
    const pn = { w: pal.groups.pantsLit, c: pal.groups.pantsShd };
    const ap = { w: pal.groups.apronLit, c: pal.groups.apronShd };
    const so = { w: pal.groups.shoeLit, c: pal.groups.shoeShd };

    pc.pixels[0] = 0;

    const W = 32, H = 48, cx = 15;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // ========================================
    // HELPERS
    // ========================================
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
        pc.setPixel(x, y, dualTone(mat.w, mat.c, v));
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
        const isFace = ny > -0.2 && ny < 0.6 && Math.abs(nx) < 0.55 && nz > 0.6;
        if (isFace) v = 0.5 + v * 0.5;

        px(x, y, sk, v);
      }
    }

    // Hair cap on top and sides
    for (let y = 1; y <= headCy + 3; y++) {
      const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y - headCy) / headRy) ** 2)) * headRx);
      const isTop = y < headCy - 2;

      if (isTop) {
        // Full hair coverage on top
        for (let x = cx - headHW - 1; x <= cx + headHW + 1; x++) {
          if (x < 0 || x >= W) continue;
          let v = sphereV(x, y, cx, headCy, 11);
          if (v < 0) continue;
          v *= 0.75;
          px(x, y, hr, v);
        }
      } else {
        // Side hair strips
        for (let dx = -1; dx <= 1; dx++) {
          const lhx = cx - headHW - 1 + dx;
          const rhx = cx + headHW + 1 + dx;
          if (lhx >= 0 && lhx < W) px(lhx, y, hr, 0.15 + dx * 0.02);
          if (rhx >= 0 && rhx < W) px(rhx, y, hr, 0.35 + dx * 0.05);
        }
      }
    }

    // Ears
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (dx * dx + dy * dy <= 1) {
          px(cx - headRx + dx, headCy + 1 + dy, sk, 0.25);
          px(cx + headRx + dx, headCy + 1 + dy, sk, 0.6);
        }

    // ========================================
    // NECK — occlusion shadow (skin)
    // ========================================
    for (let y = 23; y <= 24; y++)
      for (let x = cx - 2; x <= cx + 2; x++)
        px(x, y, sk, cylinderV(x, cx, 2) * 0.35);

    // ========================================
    // TORSO — cylinder (shirt)
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

    // ========================================
    // ARMS — thin cylinders (shirt sleeves)
    // ========================================
    for (let y = 26; y <= 32; y++) {
      for (let dx = 0; dx < 3; dx++) {
        const lax = tL - 3 + dx, rax = tL + torsoW + dx;
        if (lax >= 0) px(lax, y, sh, cylinderV(lax, tL - 1.5, 1.5) * 0.7);
        if (rax < W) px(rax, y, sh, cylinderV(rax, tL + torsoW + 1.5, 1.5));
      }
    }
    // Hands (skin)
    for (let y = 33; y <= 34; y++)
      for (let dx = 0; dx < 3; dx++) {
        px(tL - 3 + dx, y, sk, 0.3);
        px(tL + torsoW + dx, y, sk, 0.6);
      }

    // Belt line
    for (let x = tL + 1; x < tL + torsoW - 1; x++)
      px(x, 32, sh, 0.15);

    // ========================================
    // LEGS — cylinders (pants)
    // ========================================
    const legY = 33, legW = 4, legH = 7;
    for (let y = legY; y < legY + legH; y++) {
      for (let dx = 0; dx < legW; dx++) {
        const llx = cx - 5 + dx, rlx = cx + 1 + dx;
        px(llx, y, pn, cylinderV(llx, cx - 3, legW / 2) * 0.8);
        px(rlx, y, pn, cylinderV(rlx, cx + 3, legW / 2));
      }
    }

    // ========================================
    // SHOES
    // ========================================
    const shoeY = legY + legH;
    for (let y = shoeY; y < shoeY + 2; y++) {
      for (let dx = -1; dx < legW; dx++) px(cx - 5 + dx, y, so, 0.25);
      for (let dx = 0; dx <= legW; dx++) px(cx + 1 + dx, y, so, 0.5);
    }
  },
};
