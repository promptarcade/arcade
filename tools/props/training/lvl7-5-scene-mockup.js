// Level 7.5: Game Mockup — Soup Shop kitchen scene (160 × 90)
// Kitchen background, chef, 2 customers, stove+pot, counter, food, UI elements
// Player (chef) is focal point. Consistent light, dual palette, atmosphere.
// Smaller than spec 320×180 to keep render reasonable — same composition.
module.exports = {
  width: 160,
  height: 90,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    // Background
    wallLit: '#8A7A68', wallShd: '#4A4038',
    floorLit: '#6A5A48', floorShd: '#3A3028',
    // Characters — shared skin
    skinLit: '#F2C4A0', skinShd: '#9B7B8A',
    // Chef
    chefHairLit: '#8B6542', chefHairShd: '#4A3B5A',
    chefShirtLit: '#5B8EC2', chefShirtShd: '#2E3E6A',
    clothLit: '#E8E0D0', clothShd: '#9A95A8',
    // Customer 1
    blondeLit: '#D4B060', blondeShd: '#7A6848',
    redShirtLit: '#C85040', redShirtShd: '#6A2840',
    // Customer 2
    darkHairLit: '#3A3530', darkHairShd: '#1A1828',
    greenShirtLit: '#5AAA60', greenShirtShd: '#2A5A40',
    // Props
    ironLit: '#5A5A6A', ironShd: '#2A2A35',
    copperLit: '#CC7744', copperShd: '#6A3322',
    counterLit: '#C8B090', counterShd: '#7A6848',
    flameLit: '#FF8830', flameShd: '#AA3310',
    // Food
    tomatoLit: '#DD4433', tomatoShd: '#882222',
    carrotLit: '#DD8833', carrotShd: '#885522',
    // Pants/shoes shared
    pantsLit: '#7A7A6E', pantsShd: '#3E4252',
    shoeLit: '#5A4030', shoeShd: '#2A2035',
    // Eyes
    eyeWhite: '#EEEEF0', eyeIris: '#4488BB', eyePupil: '#181828',
    // UI
    uiLit: '#DDCC88', uiShd: '#886644',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.wallLit.startIdx); },
  drawPost(pc, pal) {
    const TW = 160, TH = 90;
    const pg = pal.groups;

    function tone(grp, frac) {
      return grp.startIdx + Math.max(0, Math.min(grp.toneCount - 1,
        Math.round(frac * (grp.toneCount - 1))));
    }
    function dt(wg, cg, v) {
      return v > 0.38 ? tone(wg, v) : tone(cg, Math.max(0.04, v * 1.2));
    }

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
      const NdotL = nx * lx + nz * lz;
      let v = 0.06 + Math.max(0, NdotL) * 0.62 +
              Math.pow(Math.max(0, 2 * NdotL * nz - lz), 30) * 0.15 + 0.04;
      v = v * v * (3 - 2 * v);
      return Math.max(0.02, Math.min(1, v));
    }

    function px(x, y, wg, cg, v) {
      if (x >= 0 && x < TW && y >= 0 && y < TH)
        pc.setPixel(x, y, dt(wg, cg, v));
    }
    function pxc(x, y, grp, v) {
      if (x >= 0 && x < TW && y >= 0 && y < TH)
        pc.setPixel(x, y, tone(grp, Math.max(0, Math.min(1, v))));
    }

    // ========================================
    // BACKGROUND — wall + floor
    // ========================================
    const floorY = 52;
    // Wall
    for (let y = 0; y < floorY; y++)
      for (let x = 0; x < TW; x++) {
        // Subtle vertical gradient (darker at top = ceiling shadow)
        const v = 0.35 + (y / floorY) * 0.2;
        // Subtle horizontal light from left
        const h = (x / TW) * 0.08;
        px(x, y, pg.wallLit, pg.wallShd, v - h);
      }
    // Floor
    for (let y = floorY; y < TH; y++)
      for (let x = 0; x < TW; x++) {
        const v = 0.45 - ((y - floorY) / (TH - floorY)) * 0.15;
        // Tile pattern
        const tile = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2) * 0.04;
        px(x, y, pg.floorLit, pg.floorShd, v + tile);
      }

    // ========================================
    // COUNTER — back wall, right side
    // ========================================
    const counterL = 95, counterR = 155, counterTop = 32, counterBot = 55;
    for (let y = counterTop; y <= counterBot; y++)
      for (let x = counterL; x <= counterR; x++) {
        if (x >= TW || y >= TH) continue;
        let v = cylinderV(x, (counterL + counterR) / 2, (counterR - counterL) / 2);
        const grain = Math.sin(y * 1.2 + x * 0.15) * 0.03;
        px(x, y, pg.counterLit, pg.counterShd, v + grain);
      }
    // Counter top surface
    for (let x = counterL; x <= counterR; x++)
      if (x < TW) px(x, counterTop, pg.counterLit, pg.counterShd, 0.7);

    // Food on counter — small tomato and carrot
    // Tomato (small sphere)
    for (let y = 27; y <= 33; y++)
      for (let x = 105; x <= 113; x++) {
        const r = 4, cx2 = 109, cy2 = 30;
        let v = sphereV(x, y, cx2, cy2, r);
        if (v >= 0) px(x, y, pg.tomatoLit, pg.tomatoShd, v);
      }
    // Carrot (small horizontal cylinder)
    for (let y = 29; y <= 32; y++)
      for (let x = 118; x <= 132; x++) {
        if (x >= TW) continue;
        const hw = 2 - (x - 118) * 0.08; // tapers
        if (Math.abs(y - 30.5) <= hw) {
          let v = cylinderV(x, 125, 7);
          px(x, y, pg.carrotLit, pg.carrotShd, v);
        }
      }

    // ========================================
    // STOVE + POT — back wall, left-center
    // ========================================
    const stoveCx = 55;
    // Stove body
    for (let y = 28; y <= 55; y++)
      for (let x = stoveCx - 14; x <= stoveCx + 14; x++) {
        if (x < 0 || x >= TW || y >= TH) continue;
        let v = cylinderV(x, stoveCx, 14);
        v *= (1 - (y - 28) / 30 * 0.2);
        px(x, y, pg.ironLit, pg.ironShd, v);
      }
    // Stove top
    for (let x = stoveCx - 14; x <= stoveCx + 14; x++)
      if (x >= 0 && x < TW) px(x, 28, pg.ironLit, pg.ironShd, 0.55);

    // Flame
    for (let dx = -3; dx <= 3; dx++)
      if (stoveCx + dx >= 0 && stoveCx + dx < TW) {
        px(stoveCx + dx, 29, pg.flameLit, pg.flameShd, 0.7 - Math.abs(dx) * 0.1);
        px(stoveCx + dx, 30, pg.flameLit, pg.flameShd, 0.4 - Math.abs(dx) * 0.08);
      }

    // Pot on stove
    for (let y = 18; y <= 28; y++) {
      const t = (y - 18) / 10;
      const hw = Math.round(8 + Math.sin(t * Math.PI * 0.6) * 2);
      for (let x = stoveCx - hw; x <= stoveCx + hw; x++) {
        if (x < 0 || x >= TW) continue;
        let v = cylinderV(x, stoveCx, hw);
        // Metal: quintic S-curve
        const nx = (x - stoveCx) / (hw + 0.5);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const spec = Math.pow(Math.max(0, 2 * (nx * lx + nz * lz) * nz - lz), 60) * 0.4;
        v = Math.min(1, v + spec);
        px(x, y, pg.copperLit, pg.copperShd, v);
      }
    }
    // Pot rim
    for (let x = stoveCx - 9; x <= stoveCx + 9; x++)
      if (x >= 0 && x < TW) {
        px(x, 18, pg.copperLit, pg.copperShd, 0.75);
        px(x, 19, pg.ironLit, pg.ironShd, 0.08); // dark interior
      }
    // Pot handles
    for (let dy = 0; dy < 2; dy++) {
      px(stoveCx - 10, 21 + dy, pg.ironLit, pg.ironShd, 0.45);
      px(stoveCx + 10, 21 + dy, pg.ironLit, pg.ironShd, 0.55);
    }

    // ========================================
    // MINI CHARACTER HELPER
    // ========================================
    function drawMiniChar(cx, groundY, hairW, hairC, shirtW, shirtC, opts) {
      opts = opts || {};
      const headCy = groundY - 30;
      const headR = 7;
      const irisGrp = opts.irisGrp || pg.eyeIris;

      // Head
      for (let y = headCy - headR; y <= headCy + headR; y++)
        for (let x = cx - headR; x <= cx + headR; x++) {
          if (x < 0 || x >= TW || y < 0 || y >= TH) continue;
          const nx = (x - cx) / headR, ny = (y - headCy) / headR;
          if (nx * nx + ny * ny > 1) continue;
          let v = sphereV(x, y, cx, headCy, headR);
          if (v < 0) continue;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          // Face bias (lesson learned: ny<0.7, simple formula)
          if (ny > -0.2 && ny < 0.7 && Math.abs(nx) < 0.55 && nz > 0.6)
            v = 0.5 + v * 0.5;
          px(x, y, pg.skinLit, pg.skinShd, v);
        }

      // Hair cap
      for (let y = Math.max(0, headCy - headR - 1); y <= headCy + 2; y++) {
        const hw = Math.round(Math.sqrt(Math.max(0, 1 - ((y - headCy) / headR) ** 2)) * headR);
        if (y < headCy - 1) {
          for (let x = cx - hw - 1; x <= cx + hw + 1; x++) {
            if (x < 0 || x >= TW) continue;
            let v = sphereV(x, y, cx, headCy, headR + 1);
            if (v >= 0) px(x, y, hairW, hairC, v * 0.75);
          }
        }
      }

      // Eyes (3×3 at this scale)
      const eyeY = headCy - 1;
      const leX = cx - 4, reX = cx + 1;
      for (let dy = 0; dy < 3; dy++)
        for (let dx = 0; dx < 3; dx++) {
          pxc(leX + dx, eyeY + dy, irisGrp, 0.5);
          pxc(reX + dx, eyeY + dy, irisGrp, 0.5);
        }
      pxc(leX + 1, eyeY + 1, pg.eyePupil, 0.9);
      pxc(reX + 1, eyeY + 1, pg.eyePupil, 0.9);
      pxc(leX, eyeY, pg.eyeWhite, 0.95);
      pxc(reX, eyeY, pg.eyeWhite, 0.95);
      // Lid lines
      for (let dx = 0; dx < 3; dx++) {
        pxc(leX + dx, eyeY - 1, pg.eyePupil, 0.4);
        pxc(reX + dx, eyeY - 1, pg.eyePupil, 0.4);
      }

      // Mouth
      for (let dx = -1; dx <= 1; dx++)
        px(cx + dx, headCy + Math.round(headR * 0.4), pg.skinLit, pg.skinShd, 0.28);

      // Neck (5px wide — lesson learned)
      const neckTop = headCy + headR + 1;
      for (let y = neckTop; y <= neckTop + 1; y++)
        for (let x = cx - 2; x <= cx + 2; x++)
          px(x, y, pg.skinLit, pg.skinShd, cylinderV(x, cx, 2.5) * 0.35);

      // Torso
      const tL = cx - 5, torsoW = 10;
      const torsoTop = neckTop + 2;
      for (let y = torsoTop; y < torsoTop + 6; y++)
        for (let x = tL; x < tL + torsoW; x++) {
          if (x < 0 || x >= TW || y >= TH) continue;
          px(x, y, shirtW, shirtC, cylinderV(x, cx, torsoW / 2));
        }

      // Arms
      for (let y = torsoTop + 1; y < torsoTop + 5; y++) {
        for (let dx = 0; dx < 2; dx++) {
          if (tL - 2 + dx >= 0) px(tL - 2 + dx, y, shirtW, shirtC, cylinderV(tL - 2 + dx, tL - 1, 1) * 0.7);
          if (tL + torsoW + dx < TW) px(tL + torsoW + dx, y, shirtW, shirtC, cylinderV(tL + torsoW + dx, tL + torsoW + 1, 1));
        }
      }
      // Hands
      for (let dx = 0; dx < 2; dx++) {
        px(tL - 2 + dx, torsoTop + 5, pg.skinLit, pg.skinShd, 0.3);
        px(tL + torsoW + dx, torsoTop + 5, pg.skinLit, pg.skinShd, 0.6);
      }

      // Legs
      const legY = torsoTop + 6;
      for (let y = legY; y < legY + 5; y++) {
        for (let dx = 0; dx < 3; dx++) {
          px(cx - 4 + dx, y, pg.pantsLit, pg.pantsShd, cylinderV(cx - 4 + dx, cx - 2.5, 1.5) * 0.8);
          px(cx + 1 + dx, y, pg.pantsLit, pg.pantsShd, cylinderV(cx + 1 + dx, cx + 2.5, 1.5));
        }
      }

      // Shoes
      for (let y = legY + 5; y < legY + 7; y++) {
        for (let dx = -1; dx < 3; dx++) px(cx - 4 + dx, y, pg.shoeLit, pg.shoeShd, 0.25);
        for (let dx = 0; dx <= 3; dx++) px(cx + 1 + dx, y, pg.shoeLit, pg.shoeShd, 0.5);
      }

      return { torsoTop, tL, torsoW };
    }

    // ========================================
    // CHEF (focal point — center-left, near stove)
    // ========================================
    {
      const cx = 38, groundY = 82;

      // Toque
      const headCy = groundY - 30;
      for (let y = headCy - 14; y <= headCy - 7; y++)
        for (let x = cx - 5; x <= cx + 5; x++) {
          if (x < 0 || x >= TW || y < 0) continue;
          const d = Math.sqrt(((x - cx) / 5) ** 2 + ((y - (headCy - 11)) / 3) ** 2);
          if (d <= 1) px(x, y, pg.clothLit, pg.clothShd, 0.5 + sphereV(x, y, cx, headCy - 11, 5) * 0.4);
        }
      // Toque band
      for (let x = cx - 5; x <= cx + 5; x++)
        if (x >= 0 && x < TW) px(x, headCy - 7, pg.clothLit, pg.clothShd, 0.4);

      const parts = drawMiniChar(cx, groundY,
        pg.chefHairLit, pg.chefHairShd,
        pg.chefShirtLit, pg.chefShirtShd);

      // Apron over torso
      for (let y = parts.torsoTop + 1; y < parts.torsoTop + 8; y++) {
        const taper = y > parts.torsoTop + 6 ? 1 : 0;
        for (let x = parts.tL + taper; x < parts.tL + parts.torsoW - taper; x++)
          if (x >= 0 && x < TW && y < TH)
            px(x, y, pg.clothLit, pg.clothShd, 0.4 + cylinderV(x, cx, parts.torsoW / 2) * 0.55);
      }
    }

    // ========================================
    // CUSTOMER 1 — right side, near counter
    // ========================================
    drawMiniChar(115, 82,
      pg.blondeLit, pg.blondeShd,
      pg.redShirtLit, pg.redShirtShd);

    // ========================================
    // CUSTOMER 2 — far right, smaller (kid)
    // ========================================
    drawMiniChar(140, 82,
      pg.darkHairLit, pg.darkHairShd,
      pg.greenShirtLit, pg.greenShirtShd);

    // ========================================
    // UI — score/order bar at top
    // ========================================
    // Top bar background
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < TW; x++)
        px(x, y, pg.uiLit, pg.uiShd, 0.2 + (y / 8) * 0.1);

    // "SOUP SHOP" text area (simplified as bright blocks)
    for (let x = 4; x <= 44; x++)
      px(x, 3, pg.uiLit, pg.uiShd, 0.8);
    for (let x = 4; x <= 44; x++)
      px(x, 4, pg.uiLit, pg.uiShd, 0.7);

    // Score indicator (right side)
    for (let x = 120; x <= 155; x++)
      for (let y = 2; y <= 5; y++)
        if (x < TW) px(x, y, pg.uiLit, pg.uiShd, 0.6);

    // Order bubbles (small circles above customers)
    // Customer 1 wants tomato
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++)
        if (dx * dx + dy * dy <= 9)
          px(115 + dx, 40 + dy, pg.clothLit, pg.clothShd, 0.75);
    // Tiny red dot = tomato icon
    px(114, 39, pg.tomatoLit, pg.tomatoShd, 0.7);
    px(115, 39, pg.tomatoLit, pg.tomatoShd, 0.8);
    px(114, 40, pg.tomatoLit, pg.tomatoShd, 0.6);
    px(115, 40, pg.tomatoLit, pg.tomatoShd, 0.7);
  },
};
