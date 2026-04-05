// Level 3.3: Chef Greyscale — full character with toque
// Combines: sphere head (face bright), cylinder body, toque hat
// Verify toque reads as chef's hat before moving to colour
module.exports = {
  width: 32,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    grey: '#888888',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.grey.startIdx); },
  drawPost(pc, pal) {
    const g = pal.groups.grey;
    function tone(frac) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1,
        Math.round(frac * (g.toneCount - 1))));
    }
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

    function px(x, y, v) {
      if (x >= 0 && x < W && y >= 0 && y < H) pc.setPixel(x, y, tone(v));
    }

    // ========================================
    // TOQUE — tall chef hat, bright (white cloth)
    // Cylinder shape with puffy top
    // ========================================
    // Toque puff (top) — sphere-ish
    const toqueTop = 0, toquePuffCy = 2, toquePuffR = 6;
    for (let y = 0; y <= 4; y++) {
      for (let x = cx - 7; x <= cx + 7; x++) {
        if (x < 0 || x >= W) continue;
        const d = Math.sqrt(((x - cx) / 7) ** 2 + ((y - toquePuffCy) / 3) ** 2);
        if (d > 1) continue;
        let v = sphereV(x, y, cx, toquePuffCy, 7);
        if (v < 0) v = 0.6;
        // White cloth — shift everything brighter
        v = 0.4 + v * 0.6;
        px(x, y, v);
      }
    }
    // Toque body — cylinder
    for (let y = 4; y <= 7; y++) {
      for (let x = cx - 6; x <= cx + 6; x++) {
        if (x < 0 || x >= W) continue;
        let v = cylinderV(x, cx, 6);
        v = 0.35 + v * 0.65; // bright cloth
        px(x, y, v);
      }
    }
    // Toque band — darker stripe
    for (let x = cx - 7; x <= cx + 7; x++) {
      if (x < 0 || x >= W) continue;
      let v = cylinderV(x, cx, 7);
      v = 0.2 + v * 0.4; // darker band
      px(x, y = 7, v);
    }

    // ========================================
    // HEAD — sphere, face bright
    // ========================================
    const headCy = 14, headRx = 10, headRy = 10;
    for (let y = headCy - headRy; y <= headCy + headRy; y++) {
      for (let x = cx - headRx; x <= cx + headRx; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const nx = (x - cx) / headRx, ny = (y - headCy) / headRy;
        if (nx * nx + ny * ny > 1) continue;

        let v = sphereV(x, y, cx, headCy, 10);
        if (v < 0) continue;

        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const isFace = ny > -0.2 && ny < 0.6 && Math.abs(nx) < 0.55 && nz > 0.6;
        if (isFace) {
          v = 0.5 + v * 0.5; // keep face bright
        }

        px(x, y, v);
      }
    }

    // Hair (sides and back visible under toque)
    for (let y = 8; y <= headCy + 4; y++) {
      const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y - headCy) / headRy) ** 2)) * headRx);
      // Side hair strips
      for (let dx = -1; dx <= 1; dx++) {
        const lhx = cx - headHW - 1 + dx, rhx = cx + headHW + 1 + dx;
        if (lhx >= 0) px(lhx, y, 0.15 + dx * 0.02);
        if (rhx < W) px(rhx, y, 0.35 + dx * 0.05);
      }
    }

    // Ears
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (dx * dx + dy * dy <= 1) {
          px(cx - headRx + dx, headCy + 1 + dy, 0.25);
          px(cx + headRx + dx, headCy + 1 + dy, 0.55);
        }

    // ========================================
    // NECK — occlusion shadow
    // ========================================
    for (let y = 25; y <= 26; y++)
      for (let x = cx - 2; x <= cx + 2; x++) {
        let v = cylinderV(x, cx, 2) * 0.4;
        px(x, y, v);
      }

    // ========================================
    // TORSO — cylinder, with apron overlay
    // ========================================
    const tL = cx - 7, torsoW = 14;
    for (let y = 27; y <= 34; y++) {
      for (let x = tL; x < tL + torsoW; x++) {
        if (x < 0 || x >= W) continue;
        if (y === 27 && (x === tL || x === tL + torsoW - 1)) continue;
        let v = cylinderV(x, cx, torsoW / 2);
        const vy = (y - 27) / 8;
        v *= (1.0 - vy * 0.12);
        px(x, y, v);
      }
    }

    // Apron (brighter — white cloth over torso)
    for (let y = 29; y <= 37; y++) {
      const taper = y > 35 ? Math.floor((y - 35) * 0.5) : 0;
      for (let x = tL + taper; x < tL + torsoW - taper; x++) {
        if (x < 0 || x >= W) continue;
        let v = cylinderV(x, cx, torsoW / 2);
        v = 0.35 + v * 0.6; // bright cloth
        px(x, y, v);
      }
    }
    // Apron straps
    for (let y = 25; y <= 29; y++) {
      px(cx - 4, y, 0.7);
      px(cx + 4, y, 0.75);
    }

    // ========================================
    // ARMS — thin cylinders
    // ========================================
    for (let y = 28; y <= 34; y++) {
      // Left arm (shadow side)
      for (let dx = 0; dx < 3; dx++) {
        const ax = tL - 3 + dx;
        if (ax >= 0) px(ax, y, cylinderV(ax, tL - 1.5, 1.5) * 0.7);
      }
      // Right arm (lit side)
      for (let dx = 0; dx < 3; dx++) {
        const ax = tL + torsoW + dx;
        if (ax < W) px(ax, y, cylinderV(ax, tL + torsoW + 1.5, 1.5));
      }
    }
    // Hands
    for (let y = 35; y <= 36; y++) {
      for (let dx = 0; dx < 3; dx++) {
        px(tL - 3 + dx, y, 0.3);
        px(tL + torsoW + dx, y, 0.55);
      }
    }

    // ========================================
    // LEGS — cylinders
    // ========================================
    const legY = 35, legW = 4, legH = 7;
    for (let y = legY; y < legY + legH; y++) {
      for (let dx = 0; dx < legW; dx++) {
        // Left leg
        const llx = cx - 5 + dx;
        px(llx, y, cylinderV(llx, cx - 3, legW / 2) * 0.8);
        // Right leg
        const rlx = cx + 1 + dx;
        px(rlx, y, cylinderV(rlx, cx + 3, legW / 2));
      }
    }

    // ========================================
    // SHOES
    // ========================================
    const shoeY = legY + legH;
    for (let y = shoeY; y < shoeY + 2; y++) {
      for (let dx = -1; dx < legW; dx++) px(cx - 5 + dx, y, 0.22);
      for (let dx = 0; dx <= legW; dx++) px(cx + 1 + dx, y, 0.4);
    }
  },
};
