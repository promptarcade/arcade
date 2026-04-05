// Phase 6, Exercise 6.4: Full scene — character in environment with props
// Training target: composition, value hierarchy, focal point through contrast
// Small scene: a warrior character standing next to a campfire, with a tree and rock

module.exports = {
  width: 160,
  height: 128,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    sky: '#223344',        // night sky
    ground: '#445533',     // dark green ground
    tree: '#335522',       // dark green tree
    treelit: '#558833',    // lit tree
    skin: '#ddbb88',
    hair: '#553322',
    armor: '#667788',      // steel armor
    armorlit: '#99aabb',
    fire: '#ff8822',       // warm fire light
    fireyel: '#ffcc44',
    rock: '#667766',
    rockdark: '#445544',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.sky.startIdx); },

  drawPost(pc, pal) {
    const skyg = pal.groups.sky;
    const grg = pal.groups.ground;
    const trg = pal.groups.tree;
    const tlg = pal.groups.treelit;
    const skg = pal.groups.skin;
    const hrg = pal.groups.hair;
    const ag = pal.groups.armor;
    const alg = pal.groups.armorlit;
    const fg = pal.groups.fire;
    const fyg = pal.groups.fireyel;
    const rkg = pal.groups.rock;
    const rdg = pal.groups.rockdark;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const W = 160, H = 128;
    const groundY = 95;
    const rng = sf2_seededRNG(42);

    // TWO LIGHT SOURCES:
    // 1. Moon: upper-left, cool, dim
    // 2. Campfire: center-right, warm, localized
    const fireCX = 100, fireCY = 88;

    function fireLight(x, y) {
      const dx = x - fireCX, dy = y - fireCY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return Math.max(0, 1 - dist / 70) * 0.5;
    }

    // === SKY ===
    for (let y = 0; y < groundY; y++) {
      for (let x = 0; x < W; x++) {
        const t = y / groundY;
        pc.setPixel(x, y, tone(skyg, 0.05 + (1 - t) * 0.2));
      }
    }

    // Stars
    for (let s = 0; s < 20; s++) {
      const sx = Math.round(rng() * (W - 1));
      const sy = Math.round(rng() * (groundY - 10));
      if (sx < W && sy < H) {
        pc.setPixel(sx, sy, tone(skyg, 0.6 + rng() * 0.4));
      }
    }

    // Moon — small, upper left
    const moonCX = 25, moonCY = 18, moonR = 8;
    for (let dy = -moonR; dy <= moonR; dy++) {
      for (let dx = -moonR; dx <= moonR; dx++) {
        if (dx * dx + dy * dy > moonR * moonR) continue;
        const px = moonCX + dx, py = moonCY + dy;
        if (px < 0 || px >= W || py < 0 || py >= H) continue;
        const d = Math.sqrt(dx * dx + dy * dy) / moonR;
        pc.setPixel(px, py, tone(skyg, 0.7 + (1 - d) * 0.3));
      }
    }

    // === GROUND ===
    for (let y = groundY; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const fl = fireLight(x, y);
        const base = 0.15 - ((y - groundY) / (H - groundY)) * 0.06;
        // Fire warms the ground near it
        if (fl > 0.05) {
          pc.setPixel(x, y, tone(grg, Math.max(0.03, base + fl * 0.3)));
        } else {
          pc.setPixel(x, y, tone(grg, Math.max(0.03, base)));
        }
      }
    }

    // === TREE (background left) — silhouette with fire-lit side ===
    const treeCX = 30, trunkBot = groundY;
    // Trunk
    for (let y = 50; y <= trunkBot; y++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = treeCX + dx;
        if (x < 0 || x >= W) continue;
        const fl = fireLight(x, y);
        pc.setPixel(x, y, tone(fl > 0.05 ? tlg : trg, 0.1 + fl * 0.3 + (dx < 0 ? 0.05 : 0)));
      }
    }
    // Canopy — large circle
    for (let dy = -25; dy <= 10; dy++) {
      for (let dx = -22; dx <= 22; dx++) {
        if (dx * dx + dy * dy > 22 * 22) continue;
        const x = treeCX + dx, y = 40 + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const fl = fireLight(x, y);
        const moonLit = (-dx / 22 * 0.3 + (-dy / 22) * 0.4) * 0.15;
        let v = 0.08 + Math.max(0, moonLit) + fl * 0.2;
        v += (rng() - 0.5) * 0.03;
        pc.setPixel(x, y, tone(fl > 0.08 ? tlg : trg, Math.max(0.03, v)));
      }
    }

    // === ROCK (right of fire) ===
    const rockCX = 130, rockCY = 88, rockRX = 14, rockRY = 10;
    for (let dy = -rockRY - 2; dy <= rockRY + 2; dy++) {
      for (let dx = -rockRX - 2; dx <= rockRX + 2; dx++) {
        const ndx = dx / rockRX, ndy = dy / rockRY;
        let rMod = 1 + Math.sin(Math.atan2(ndy, ndx) * 3) * 0.1;
        if (ndy > 0) rMod += ndy * 0.1;
        if (Math.sqrt(ndx * ndx + ndy * ndy) > rMod) continue;

        const x = rockCX + dx, y = rockCY + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;

        const nx = ndx * 0.7, ny = ndy * 0.6;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        // Moon light (cool)
        const moonDot = Math.max(0, -0.5 * nx - 0.6 * ny + 0.6 * nz) * 0.15;
        // Fire light (warm)
        const fl = fireLight(x, y);
        const fireDot = Math.max(0, (fireCX - x) / 40 * nx + nz * 0.5) * fl;

        let v = 0.05 + moonDot + fireDot * 0.4;
        v += (rng() - 0.5) * 0.03;
        pc.setPixel(x, y, tone(fireDot > moonDot ? rkg : rdg, Math.max(0.03, v)));
      }
    }

    // === CAMPFIRE — the warm light source ===
    // Log base
    for (let dx = -8; dx <= 8; dx++) {
      const x = fireCX + dx;
      if (x >= 0 && x < W) {
        pc.setPixel(x, fireCY + 2, tone(rdg, 0.2));
        pc.setPixel(x, fireCY + 3, tone(rdg, 0.15));
      }
    }

    // Fire — layers of flame
    for (let y = fireCY - 15; y <= fireCY + 1; y++) {
      const t = (fireCY + 1 - y) / 16; // 0 at base, 1 at top
      const halfW = Math.round(6 * (1 - t * 0.6) + Math.sin(y * 0.5 + rng() * 3) * 2);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = fireCX + dx;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const xFrac = Math.abs(dx) / (halfW + 1);

        // Fire colour: yellow at center/top, orange at edges/base
        if (t > 0.6 && xFrac < 0.4) {
          // Tip — brightest yellow
          pc.setPixel(x, y, tone(fyg, 0.7 + (1 - xFrac) * 0.3));
        } else if (xFrac < 0.5) {
          // Inner — warm yellow-orange
          pc.setPixel(x, y, tone(fyg, 0.4 + t * 0.3));
        } else {
          // Outer — orange-red
          pc.setPixel(x, y, tone(fg, 0.3 + t * 0.3));
        }
      }
    }

    // Ember particles
    for (let e = 0; e < 8; e++) {
      const ex = fireCX + Math.round((rng() - 0.5) * 20);
      const ey = fireCY - 18 - Math.round(rng() * 12);
      if (ex >= 0 && ex < W && ey >= 0 && ey < H) {
        pc.setPixel(ex, ey, tone(fg, 0.5 + rng() * 0.4));
      }
    }

    // Fire glow on ground
    for (let x = fireCX - 20; x <= fireCX + 20; x++) {
      if (x >= 0 && x < W && groundY < H) {
        const dx = Math.abs(x - fireCX) / 20;
        const glow = (1 - dx * dx) * 0.2;
        if (glow > 0.03) {
          pc.setPixel(x, groundY, tone(fg, glow + 0.05));
          if (groundY + 1 < H) pc.setPixel(x, groundY + 1, tone(fg, glow * 0.5 + 0.03));
        }
      }
    }

    // === CHARACTER — warrior standing by fire (focal point) ===
    // The character gets the HIGHEST CONTRAST in the scene (value hierarchy)
    const charCX = 75, charFeetY = groundY;
    const charH = 36, charW = 14;
    const charTopY = charFeetY - charH;

    // Shadow on ground
    for (let dx = -10; dx <= 10; dx++) {
      const x = charCX + dx;
      if (x >= 0 && x < W && charFeetY + 1 < H) {
        pc.setPixel(x, charFeetY + 1, tone(grg, 0.04));
      }
    }

    // Body — simplified chibi proportions
    // Head (large — chibi)
    const headCY = charTopY + 10, headR = 8;
    for (let dy = -headR; dy <= headR; dy++) {
      for (let dx = -headR; dx <= headR; dx++) {
        if (dx * dx + dy * dy > headR * headR) continue;
        const x = charCX + dx, y = headCY + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const nx = dx / headR, ny = dy / headR;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        const fl = fireLight(x, y);
        const fireDot = Math.max(0, (fireCX - x) / 40 * 0.5 + nz * 0.4) * fl;
        const moonDot = Math.max(0, -0.5 * nx - 0.6 * ny + 0.6 * nz) * 0.12;
        let v = 0.08 + moonDot + fireDot * 0.6;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(skg, Math.max(0.05, v)));
      }
    }

    // Hair — dome on head
    for (let dy = -headR - 2; dy <= -2; dy++) {
      for (let dx = -(headR - 1); dx <= headR - 1; dx++) {
        if (dx * dx + (dy + 4) * (dy + 4) > (headR + 1) * (headR + 1)) continue;
        const x = charCX + dx, y = headCY + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const fl = fireLight(x, y);
        pc.setPixel(x, y, tone(hrg, 0.1 + fl * 0.25));
      }
    }

    // Eyes
    for (const side of [-1, 1]) {
      const ex = charCX + side * 3;
      if (ex >= 0 && ex < W && headCY >= 0 && headCY < H) {
        pc.setPixel(ex, headCY, tone(skyg, 0.8)); // bright eye
        pc.setPixel(ex, headCY + 1, tone(hrg, 0.05)); // pupil
      }
    }

    // Torso — armored
    for (let y = headCY + headR; y <= charFeetY - 12; y++) {
      const t = (y - headCY - headR) / (charFeetY - 12 - headCY - headR);
      const halfW = Math.round(6 - t * 1);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = charCX + dx;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const fl = fireLight(x, y);
        const fireDot = Math.max(0, (fireCX - x) / 40 * 0.4 + nz * 0.4) * fl;
        const moonDot = Math.max(0, -0.5 * nx + 0.6 * nz) * 0.1;
        let v = 0.06 + moonDot + fireDot * 0.5;
        // Metal armor: sharper specular from fire
        const specular = Math.pow(Math.max(0, nz), 30) * fl * 0.4;
        v += specular;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.25 ? alg : ag, Math.max(0.04, v)));
      }
    }

    // Legs
    for (let y = charFeetY - 12; y <= charFeetY; y++) {
      for (const side of [-1, 1]) {
        for (let dx = side * 1; dx !== side * 4; dx += side) {
          const x = charCX + dx;
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          const fl = fireLight(x, y);
          pc.setPixel(x, y, tone(ag, 0.08 + fl * 0.2));
        }
      }
    }

    // Sword — vertical line on fire-side
    for (let y = headCY + 2; y <= charFeetY - 5; y++) {
      const x = charCX + 8;
      if (x >= 0 && x < W && y >= 0 && y < H) {
        const fl = fireLight(x, y);
        pc.setPixel(x, y, tone(alg, 0.15 + fl * 0.5));
        // Blade highlight
        if (fl > 0.1) pc.setPixel(x - 1, y, tone(alg, 0.08 + fl * 0.3));
      }
    }
    // Sword crossguard
    for (let dx = -3; dx <= 3; dx++) {
      const x = charCX + 8 + dx;
      const y = headCY + headR + 2;
      if (x >= 0 && x < W && y >= 0 && y < H) {
        pc.setPixel(x, y, tone(alg, 0.3));
      }
    }
  },
};
