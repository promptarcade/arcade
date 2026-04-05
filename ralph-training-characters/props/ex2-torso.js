// Exercise 2: Character torso at 64×64 HD — Attempt 2
// FIX: jar silhouette → broad shoulders tapering to waist
// FIX: invisible texture → stronger drape modulation, visible hash noise
// FIX: tiny V-neck → prominent 10px collar opening
// FIX: weak edges → 2+2px dark/bright pairs at every boundary
// FIX: no material distinction → different specular/texture per material
// FIX: no hue shift → warm highlights, cool shadows via palette endpoints

module.exports = {
  width: 64, height: 64, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    fabCool: '#0a0c28',    // deep indigo shadow (purple-shifted)
    fabWarm: '#90d0f8',    // cyan-white highlight (warm-shifted)
    beltCool: '#180a04',   // near-black cool brown shadow
    beltWarm: '#d8a858',   // warm golden highlight
    skinCool: '#3a1808',   // dark russet shadow
    skinWarm: '#f8d8b8',   // bright peach highlight
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fabCool.startIdx); },
  drawPost(pc, pal) {
    const fcg = pal.groups.fabCool, fwg = pal.groups.fabWarm;
    const bcg = pal.groups.beltCool, bwg = pal.groups.beltWarm;
    const scg = pal.groups.skinCool, swg = pal.groups.skinWarm;

    function fabTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? fcg.startIdx + i : fwg.startIdx + (i - 8);
    }
    function beltTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? bcg.startIdx + i : bwg.startIdx + (i - 8);
    }
    function skinTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? scg.startIdx + i : swg.startIdx + (i - 8);
    }

    pc.pixels[0] = 0;

    const W = 64, H = 64;
    const cx = 32, topY = 3, botY = 60;
    const bodyLen = botY - topY;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    function hash(x, y) { return (((x * 48611 ^ y * 97231) >>> 0) / 4294967295); }
    function hash2(x, y) { return (((x * 73856 ^ y * 19349) >>> 0) / 4294967295); }
    function hash3(x, y) { return (((x * 29173 ^ y * 61403) >>> 0) / 4294967295); }

    // === TORSO PROFILE — human proportions ===
    // Broad shoulders, chest taper, narrow waist, slight hip flare
    function torsoHalfWidth(t) {
      if (t < 0.06) {
        // Neck: narrow
        const s = t / 0.06;
        return 5 + s * 1;
      }
      if (t <= 0.14) {
        // Neck to shoulder: RAPID widening — the defining feature
        const s = (t - 0.06) / 0.08;
        const ss = s * s * (3 - 2 * s);
        return 6 + ss * 22; // 6 → 28 (WIDE shoulders)
      }
      if (t <= 0.30) {
        // Shoulder plateau + slight chest
        const s = (t - 0.14) / 0.16;
        return 28 - s * 2; // 28 → 26
      }
      if (t <= 0.55) {
        // Chest to waist: NOTICEABLE taper
        const s = (t - 0.30) / 0.25;
        const ss = s * s * (3 - 2 * s);
        return 26 - ss * 8; // 26 → 18 (NARROW waist)
      }
      if (t <= 0.65) {
        // Belt region: holds at waist width
        return 18;
      }
      if (t <= 0.85) {
        // Below belt to hips: slight flare
        const s = (t - 0.65) / 0.20;
        return 18 + s * 4; // 18 → 22
      }
      // Hem: stable
      return 22;
    }

    function torsoHalfWidthJ(t, y) {
      const base = torsoHalfWidth(t);
      const j = (hash(Math.round(t * 200), y * 7 + 31) - 0.5) * 0.6;
      return base + j;
    }

    // Material zones — t-based
    // Skin: neck (t < 0.06)
    // Collar: t 0.06 to 0.18 (overlaps shoulder transition)
    // Belt: t 0.55 to 0.65
    // Fabric: everything else
    const NECK_END = 0.06;
    const COLLAR_END = 0.18;
    const BELT_START = 0.55;
    const BELT_END = 0.65;

    // V-neck dimensions — prominent
    const vneckTopT = 0.06;
    const vneckBotT = 0.22; // deep V
    const vneckMaxHalfW = 6; // wide V opening

    function isVneck(t, dx) {
      if (t < vneckTopT || t > vneckBotT) return false;
      const vProgress = (t - vneckTopT) / (vneckBotT - vneckTopT);
      const vHalfW = 1 + vProgress * vneckMaxHalfW;
      return Math.abs(dx) < vHalfW;
    }

    function getMaterial(t, dx) {
      if (t < NECK_END) return 3; // skin
      if (isVneck(t, dx)) return 3; // skin in V opening
      if (t >= BELT_START && t <= BELT_END) return 2; // belt
      if (t >= 0.06 && t < COLLAR_END) return 4; // collar fabric
      return 1; // fabric
    }

    // Buffers
    const pixBuf = new Int16Array(W * H).fill(-1);
    const matBuf = new Uint8Array(W * H);
    const rawV = new Float32Array(W * H);
    const outlineBuf = new Uint8Array(W * H);

    // Zone rendering
    const zoneThresholds = [0.12, 0.28, 0.48, 0.70];
    const zoneCenters = [0.05, 0.19, 0.38, 0.59, 0.85];
    const blendWidth = 0.06;

    function assignZone(v, x, y) {
      let zone = 0;
      for (let zi = 0; zi < 4; zi++) {
        const thresh = zoneThresholds[zi];
        if (v > thresh + blendWidth) {
          zone = zi + 1;
        } else if (v > thresh - blendWidth) {
          const bf = (v - (thresh - blendWidth)) / (blendWidth * 2);
          const dith = hash(x * 11 + y * 37, x * 19 - y * 7);
          if (dith < bf) zone = zi + 1;
          break;
        }
      }
      return zone;
    }

    // === PASS 1: Base cylinder lighting ===
    for (let y = topY; y <= botY; y++) {
      const t = (y - topY) / bodyLen;

      for (let x = 0; x < W; x++) {
        const dx = x - cx;
        const hw = torsoHalfWidthJ(t, x);
        if (Math.abs(dx) > hw) continue;
        const pidx = y * W + x;

        const matId = getMaterial(t, dx);
        matBuf[pidx] = matId;

        // Cylinder normal
        const nx = dx / (hw + 0.5);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));

        // NdotL with slight vertical bias
        const nyBias = -0.12;
        let NdotL = nx * lx + nyBias * ly + nz * lz;
        let v = Math.pow(Math.max(0, NdotL), 0.65);

        // Bounce light on shadow side
        if (nx > 0.3) v += 0.05 * (nx - 0.3);

        // Vertical falloff — shoulders brighter
        v *= (1.0 - t * 0.10);

        // Material-specific specular
        if (matId === 2) {
          // Leather belt: high gloss
          const spec = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 50) * 0.20;
          v += spec;
        } else if (matId === 3) {
          // Skin: subtle sheen
          const spec = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 25) * 0.08;
          v += spec;
        } else {
          // Fabric: very matte
          const spec = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 15) * 0.04;
          v += spec;
        }

        v = Math.max(0.02, Math.min(1.0, v));
        v = v * v * (3 - 2 * v);
        rawV[pidx] = v;

        // Zone assignment
        const zone = assignZone(v, x, y);
        const toneFn = matId === 2 ? beltTone : matId === 3 ? skinTone : fabTone;
        pixBuf[pidx] = toneFn(zoneCenters[zone] * 15);
      }
    }

    // === PASS 2: Fabric texture — STRONGER than attempt 1 ===
    for (let y = topY; y <= botY; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        const mat = matBuf[pidx];
        if (mat !== 1 && mat !== 4) continue;

        const t = (y - topY) / bodyLen;
        const dx = x - cx;
        const hw = torsoHalfWidth(t);
        const xNorm = dx / (hw + 1);

        // Multi-scale hash noise — AMPLIFIED
        const n1 = (hash(x * 5 + 13, y * 7 + 19) - 0.5) * 2.0;
        const n2 = (hash2(Math.floor(x / 3) * 23, Math.floor(y / 3) * 29) - 0.5) * 2.5;
        const n3 = (hash3(Math.floor(x / 5) * 11, Math.floor(y / 5) * 41) - 0.5) * 1.5;

        // Drape modulation — VISIBLE vertical folds
        const drape = Math.sin(xNorm * Math.PI * 3.0) * 1.5;
        const drape2 = Math.sin(xNorm * Math.PI * 1.8 + 0.9) * 0.8;

        // Pull from waist creates downward V-folds
        const waistPull = t > 0.40 && t < 0.55 ?
          Math.sin(xNorm * Math.PI * 2.0) * (1.0 - Math.abs(t - 0.48) / 0.08) * 1.5 : 0;

        const bumpShift = (n1 + n2 + n3 + drape + drape2 + waistPull);

        const currentV = rawV[pidx];
        // STRONGER effect: divide by 8 not 14
        const adjustedV = Math.max(0.02, Math.min(1.0, currentV + bumpShift / 8));

        const zone = assignZone(adjustedV, x, y);
        pixBuf[pidx] = fabTone(zoneCenters[zone] * 15);
      }
    }

    // === PASS 3: Belt leather texture ===
    for (let y = topY; y <= botY; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (matBuf[pidx] !== 2) continue;

        const n1 = (hash(x * 7 + 3, y * 11 + 5) - 0.5) * 2.5;
        const n2 = (hash2(Math.floor(x / 2) * 31, Math.floor(y / 2) * 37) - 0.5) * 1.8;

        const currentV = rawV[pidx];
        const adjustedV = Math.max(0.02, Math.min(1.0, currentV + (n1 + n2) / 10));

        const zone = assignZone(adjustedV, x, y);
        pixBuf[pidx] = beltTone(zoneCenters[zone] * 15);
      }
    }

    // === PASS 4: V-neck collar detail ===
    for (let y = topY; y <= botY; y++) {
      const t = (y - topY) / bodyLen;
      if (t < vneckTopT || t > vneckBotT + 0.02) continue;

      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (pixBuf[pidx] < 0) continue;
        const dx = x - cx;

        const vProgress = (t - vneckTopT) / (vneckBotT - vneckTopT);
        const vHalfW = 1 + Math.min(1, vProgress) * vneckMaxHalfW;

        // V-neck edges: collar lapel ridges
        const distFromEdge = Math.abs(Math.abs(dx) - vHalfW);
        if (Math.abs(dx) < vHalfW + 3 && Math.abs(dx) >= vHalfW && t <= vneckBotT) {
          // Collar edge: bright ridge on fabric side
          if (distFromEdge < 1.5) {
            pixBuf[pidx] = fabTone(13);
            matBuf[pidx] = 4;
          } else if (distFromEdge < 3) {
            pixBuf[pidx] = fabTone(11);
            matBuf[pidx] = 4;
          }
        }

        // Inside V: skin with shadow
        if (Math.abs(dx) < vHalfW && t <= vneckBotT) {
          // Deeper = darker (concave shadow)
          const depth = vProgress;
          const skinV = Math.max(0.15, 0.5 - depth * 0.3);
          const zone = assignZone(skinV, x, y);
          pixBuf[pidx] = skinTone(zoneCenters[zone] * 15);
          matBuf[pidx] = 3;

          // Dark crevice right at V edge
          if (Math.abs(Math.abs(dx) - vHalfW) < 1) {
            pixBuf[pidx] = skinTone(1);
          }
        }

        // Bottom of V: point crevice
        if (t > vneckBotT - 0.02 && t <= vneckBotT && Math.abs(dx) < 2) {
          pixBuf[pidx] = fabTone(0);
        }
      }
    }

    // === PASS 5: Edge pairs at material boundaries ===
    const beltTopY = topY + Math.round(BELT_START * bodyLen);
    const beltBotY = topY + Math.round(BELT_END * bodyLen);

    for (let x = 0; x < W; x++) {
      // Belt top edge pair: 2px dark crevice above + 2px bright ridge on belt
      for (let dy = -2; dy <= -1; dy++) {
        const py = beltTopY + dy;
        if (py >= 0 && py < H && pixBuf[py * W + x] >= 0 && matBuf[py * W + x] === 1) {
          pixBuf[py * W + x] = fabTone(dy === -2 ? 1 : 0); // dark crevice
        }
      }
      for (let dy = 0; dy <= 1; dy++) {
        const py = beltTopY + dy;
        if (py >= 0 && py < H && pixBuf[py * W + x] >= 0) {
          pixBuf[py * W + x] = beltTone(dy === 0 ? 13 : 12); // bright ridge
          matBuf[py * W + x] = 2;
        }
      }

      // Belt bottom edge pair
      for (let dy = -1; dy <= 0; dy++) {
        const py = beltBotY + dy;
        if (py >= 0 && py < H && pixBuf[py * W + x] >= 0) {
          pixBuf[py * W + x] = beltTone(dy === -1 ? 12 : 11); // bright ridge
        }
      }
      for (let dy = 1; dy <= 2; dy++) {
        const py = beltBotY + dy;
        if (py >= 0 && py < H && pixBuf[py * W + x] >= 0 && matBuf[py * W + x] === 1) {
          pixBuf[py * W + x] = fabTone(dy === 1 ? 0 : 1); // dark crevice
        }
      }

      // Hem highlight at bottom
      const hemY = botY - 1;
      if (pixBuf[hemY * W + x] >= 0 && matBuf[hemY * W + x] === 1) {
        pixBuf[hemY * W + x] = fabTone(10);
      }
    }

    // Belt buckle — larger, more visible
    const beltMidY = Math.round((beltTopY + beltBotY) / 2);
    for (let by = beltMidY - 2; by <= beltMidY + 2; by++) {
      for (let bx = cx - 3; bx <= cx + 2; bx++) {
        if (bx >= 0 && bx < W && by >= 0 && by < H && pixBuf[by * W + bx] >= 0) {
          const isEdge = by === beltMidY - 2 || by === beltMidY + 2 || bx === cx - 3 || bx === cx + 2;
          const isInner = !isEdge;
          if (isEdge) {
            pixBuf[by * W + bx] = beltTone(13);
          } else {
            // Inner buckle: bright metal
            const bNx = (bx - cx + 0.5) / 3;
            const bNz = Math.sqrt(Math.max(0.1, 1 - bNx * bNx));
            const bSpec = Math.pow(Math.max(0, bNx * lx + bNz * lz), 80) * 0.5;
            pixBuf[by * W + bx] = beltTone(Math.min(15, Math.round(10 + bSpec * 5)));
          }
        }
      }
    }

    // Shoulder seam lines — from collar edge to shoulder corner
    const collarEndY = topY + Math.round(COLLAR_END * bodyLen);
    for (let side = -1; side <= 1; side += 2) {
      // Seam from collar edge (near neck) diagonally to shoulder
      const startX = cx + side * 6;
      const startY = topY + Math.round(0.08 * bodyLen);
      const endX = cx + side * 26;
      const endY = topY + Math.round(0.16 * bodyLen);
      const steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
      for (let s = 0; s <= steps; s++) {
        const sx = Math.round(startX + (endX - startX) * s / steps);
        const sy = Math.round(startY + (endY - startY) * s / steps);
        if (sx >= 0 && sx < W && sy >= 0 && sy < H && pixBuf[sy * W + sx] >= 0) {
          // Stitch marks every 3px
          if (s % 3 < 2) {
            // Dark seam line
            pixBuf[sy * W + sx] = fabTone(2);
            // Bright ridge above seam
            if (sy - 1 >= 0 && pixBuf[(sy - 1) * W + sx] >= 0) {
              const aboveV = rawV[(sy - 1) * W + sx];
              if (aboveV > 0.2) pixBuf[(sy - 1) * W + sx] = fabTone(11);
            }
          }
        }
      }
    }

    // === PASS 6: Outline — variable weight ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (pixBuf[pidx] < 0) continue;
        for (const [ox, oy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
          const nx2 = x + ox, ny2 = y + oy;
          if (nx2 < 0 || nx2 >= W || ny2 < 0 || ny2 >= H || pixBuf[ny2 * W + nx2] < 0) {
            outlineBuf[pidx] = 1; break;
          }
        }
      }
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!outlineBuf[y * W + x]) continue;
        const pidx = y * W + x;
        const dx = x - cx;
        const mat = matBuf[pidx];
        const toneFn = mat === 2 ? beltTone : mat === 3 ? skinTone : fabTone;

        if (dx > 2) {
          // Shadow side: thick dark
          pixBuf[pidx] = toneFn(0);
          const innerX = x - 1;
          if (innerX >= 0 && pixBuf[y * W + innerX] >= 0 && !outlineBuf[y * W + innerX]) {
            if (rawV[y * W + innerX] < 0.35) pixBuf[y * W + innerX] = toneFn(1);
          }
        } else if (dx < -2) {
          // Lit side: lighter
          pixBuf[pidx] = toneFn(1);
        } else {
          pixBuf[pidx] = toneFn(0);
        }
      }
    }

    // === PASS 7: Lit-side rim (left edge) ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!outlineBuf[y * W + x]) continue;
        const dx = x - cx;
        if (dx >= -2) continue;
        const innerX = x + 1;
        if (innerX >= W) continue;
        const innerPidx = y * W + innerX;
        if (pixBuf[innerPidx] < 0 || outlineBuf[innerPidx]) continue;
        const mat = matBuf[innerPidx];
        const toneFn = mat === 2 ? beltTone : mat === 3 ? skinTone : fabTone;
        pixBuf[innerPidx] = toneFn(13);
      }
    }

    // === PASS 8: Specular — coherent upper-left ===
    // Main chest specular
    const chestSpecX = cx - 9, chestSpecY = topY + Math.round(0.24 * bodyLen);
    for (const [ox, oy] of [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2]]) {
      const px = chestSpecX + ox, py = chestSpecY + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && pixBuf[py * W + px] >= 0 &&
          !outlineBuf[py * W + px] && matBuf[py * W + px] === 1) {
        pixBuf[py * W + px] = fabTone(15);
      }
    }
    for (const [ox, oy] of [[-1,-1],[0,-1],[1,-1],[2,-1],[3,0],[3,1],[-1,0],[-1,1],[-1,2],[0,3],[1,3]]) {
      const px = chestSpecX + ox, py = chestSpecY + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && pixBuf[py * W + px] >= 0 &&
          !outlineBuf[py * W + px] && matBuf[py * W + px] === 1) {
        pixBuf[py * W + px] = fabTone(13);
      }
    }

    // Shoulder specular — left shoulder
    const shSpecX = cx - 18, shSpecY = topY + Math.round(0.13 * bodyLen);
    for (const [ox, oy] of [[0,0],[1,0],[0,1]]) {
      const px = shSpecX + ox, py = shSpecY + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && pixBuf[py * W + px] >= 0 &&
          !outlineBuf[py * W + px]) {
        pixBuf[py * W + px] = fabTone(14);
      }
    }

    // Belt buckle specular
    if (pixBuf[(beltMidY - 1) * W + (cx - 2)] >= 0) {
      pixBuf[(beltMidY - 1) * W + (cx - 2)] = beltTone(15);
      pixBuf[(beltMidY - 1) * W + (cx - 1)] = beltTone(15);
    }

    // Lower tunic specular (small)
    const ltSpecX = cx - 7, ltSpecY = topY + Math.round(0.78 * bodyLen);
    for (const [ox, oy] of [[0,0],[1,0]]) {
      const px = ltSpecX + ox, py = ltSpecY + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && pixBuf[py * W + px] >= 0 &&
          !outlineBuf[py * W + px] && matBuf[py * W + px] === 1) {
        pixBuf[py * W + px] = fabTone(14);
      }
    }

    // === WRITE BUFFER ===
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (pixBuf[y * W + x] >= 0) pc.setPixel(x, y, pixBuf[y * W + x]);
  },
};
