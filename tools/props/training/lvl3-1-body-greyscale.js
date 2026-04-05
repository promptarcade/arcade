// Level 3.1: Character Body Greyscale — form shading on chibi body
// Head = sphere (face stays bright), Torso = cylinder, Arms = cylinders, Legs = cylinders
// Neck = occlusion shadow, Hair on top gets full form shading
// Light from upper-left
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
    // HELPER: sphere shading at a point
    // ========================================
    function sphereShade(x, y, scx, scy, r) {
      const nx = (x - scx) / r, ny = (y - scy) / r;
      const nz2 = 1 - nx * nx - ny * ny;
      if (nz2 < 0) return -1;
      const nz = Math.sqrt(nz2);
      const NdotL = nx * lx + ny * ly + nz * lz;
      const diffuse = Math.max(0, NdotL);
      const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 35) * 0.25;
      const bounce = Math.max(0, ny * 0.3) * 0.12;
      let v = 0.04 + diffuse * 0.68 + specular + bounce;
      v = v * v * (3 - 2 * v); // S-curve
      return Math.max(0.02, Math.min(1, v));
    }

    // ========================================
    // HELPER: cylinder shading (vertical)
    // ========================================
    function cylinderShade(x, ccx, halfW) {
      const nx = (x - ccx) / (halfW + 0.5);
      const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
      const NdotL = nx * lx + nz * lz;
      const diffuse = Math.max(0, NdotL);
      const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 30) * 0.15;
      const bounce = 0.04; // subtle ambient from sides
      let v = 0.06 + diffuse * 0.62 + specular + bounce;
      v = v * v * (3 - 2 * v);
      return Math.max(0.02, Math.min(1, v));
    }

    // ========================================
    // HEAD — sphere with face bias
    // ========================================
    const headCy = 12, headRx = 10, headRy = 10;
    for (let y = headCy - headRy; y <= headCy + headRy; y++) {
      for (let x = 0; x < W; x++) {
        const nx = (x - cx) / headRx, ny = (y - headCy) / headRy;
        if (nx * nx + ny * ny > 1) continue;

        let v = sphereShade(x, y, cx, headCy, 10);
        if (v < 0) continue;

        // Face bias: the front-facing surface (where nz is high) stays brighter
        // This is where features will be placed later
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        // Face is the front-center area below eye level
        const isFaceArea = ny > -0.3 && ny < 0.6 && Math.abs(nx) < 0.6 && nz > 0.6;
        if (isFaceArea) {
          // Brighten face area — keep it as a canvas for features
          v = Math.max(v, 0.55); // floor brightness
          // Still allow subtle directional shading
          v = v * 0.7 + 0.3; // compress range toward bright
        }

        pc.setPixel(x, y, tone(v));
      }
    }

    // Hair on top of head — full sphere shading, no face bias
    for (let y = 1; y <= 6; y++) {
      const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y - 12) / 10) ** 2)) * 10);
      for (let x = cx - headHW - 1; x <= cx + headHW + 1; x++) {
        if (x < 0 || x >= W) continue;
        // Treat hair as part of head sphere but darker base tone
        let v = sphereShade(x, y, cx, headCy, 11);
        if (v < 0) continue;
        // Hair is slightly darker than skin
        v = v * 0.75;
        pc.setPixel(x, y, tone(v));
      }
    }

    // Ears — small sphere shading
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (dx * dx + dy * dy <= 1) {
          const ex1 = cx - headRx + dx, ex2 = cx + headRx + dx;
          const ey = headCy + 1 + dy;
          // Left ear (shadowed side)
          if (ex1 >= 0 && ex1 < W) pc.setPixel(ex1, ey, tone(0.25));
          // Right ear (lit side)
          if (ex2 >= 0 && ex2 < W) pc.setPixel(ex2, ey, tone(0.55));
        }

    // ========================================
    // NECK — occlusion shadow (dark)
    // ========================================
    const neckTop = 23;
    for (let y = neckTop; y <= neckTop + 1; y++)
      for (let x = cx - 2; x <= cx + 2; x++)
        if (x >= 0 && x < W) {
          // Neck is in shadow from head above
          const v = cylinderShade(x, cx, 2) * 0.5; // darkened by occlusion
          pc.setPixel(x, y, tone(v));
        }

    // ========================================
    // TORSO — cylinder
    // ========================================
    const torsoW = 14, torsoH = 8;
    const torsoLeft = cx - Math.floor(torsoW / 2);
    const torsoTop = 25;
    for (let y = torsoTop; y < torsoTop + torsoH; y++) {
      for (let x = torsoLeft; x < torsoLeft + torsoW; x++) {
        if (x < 0 || x >= W) continue;
        // Skip rounded corners
        if (y === torsoTop && (x === torsoLeft || x === torsoLeft + torsoW - 1)) continue;
        let v = cylinderShade(x, cx, torsoW / 2);
        // Slight vertical falloff (brighter at top near light)
        const vy = (y - torsoTop) / torsoH;
        v *= (1.0 - vy * 0.15);
        pc.setPixel(x, y, tone(v));
      }
    }

    // ========================================
    // ARMS — thin cylinders
    // ========================================
    const armTop = torsoTop + 1;
    const armH = 7;
    // Left arm (shadow side)
    for (let y = armTop; y < armTop + armH; y++) {
      for (let dx = 0; dx < 3; dx++) {
        const ax = torsoLeft - 3 + dx;
        if (ax >= 0 && ax < W) {
          let v = cylinderShade(ax, torsoLeft - 1.5, 1.5);
          v *= 0.7; // shadow side of body
          pc.setPixel(ax, y, tone(v));
        }
      }
    }
    // Right arm (lit side)
    for (let y = armTop; y < armTop + armH; y++) {
      for (let dx = 0; dx < 3; dx++) {
        const ax = torsoLeft + torsoW + dx;
        if (ax >= 0 && ax < W) {
          let v = cylinderShade(ax, torsoLeft + torsoW + 1.5, 1.5);
          pc.setPixel(ax, y, tone(v));
        }
      }
    }

    // Hands
    for (let y = armTop + armH; y < armTop + armH + 2; y++) {
      for (let dx = 0; dx < 3; dx++) {
        const lhx = torsoLeft - 3 + dx, rhx = torsoLeft + torsoW + dx;
        if (lhx >= 0) pc.setPixel(lhx, y, tone(0.25)); // shadow hand
        if (rhx < W) pc.setPixel(rhx, y, tone(0.55));  // lit hand
      }
    }

    // ========================================
    // BELT — subtle dark line
    // ========================================
    const legBase = torsoTop + torsoH;
    for (let x = torsoLeft + 1; x < torsoLeft + torsoW - 1; x++)
      pc.setPixel(x, legBase - 1, tone(0.18));

    // ========================================
    // LEGS — cylinders with gap
    // ========================================
    const legY = legBase;
    const legW = 4, legH = 7;
    const leftLegX = cx - 1 - legW, rightLegX = cx + 1;

    for (let y = legY; y < legY + legH; y++) {
      // Left leg
      for (let dx = 0; dx < legW; dx++) {
        const lx2 = leftLegX + dx;
        let v = cylinderShade(lx2, leftLegX + legW / 2, legW / 2);
        v *= 0.8; // slightly in shadow
        pc.setPixel(lx2, y, tone(v));
      }
      // Right leg
      for (let dx = 0; dx < legW; dx++) {
        const rx2 = rightLegX + dx;
        let v = cylinderShade(rx2, rightLegX + legW / 2, legW / 2);
        pc.setPixel(rx2, y, tone(v));
      }
    }

    // ========================================
    // SHOES — flat with subtle shading
    // ========================================
    const shoeY = legY + legH;
    for (let y = shoeY; y < shoeY + 2; y++) {
      // Left shoe
      for (let dx = -1; dx < legW; dx++) {
        const sx = leftLegX + dx;
        if (sx >= 0) pc.setPixel(sx, y, tone(0.3));
      }
      // Right shoe
      for (let dx = 0; dx <= legW; dx++) {
        const sx = rightLegX + dx;
        if (sx < W) pc.setPixel(sx, y, tone(0.5));
      }
    }
  },
};
