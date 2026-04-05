// Exercise 1: Single arm at 64×32 HD — Iteration 3
// FIX: zones wrap around cylinder cross-section (normal-based), not brightness steps
// FIX: soft dithered zone transitions (no hard segment boundaries)
// FIX: smooth cubic taper (organic silhouette), irregular texture (not grid)
// FIX: no hard fold creases — subtle drape via tonal modulation

module.exports = {
  width: 64, height: 32, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    fabCool: '#0e1e38',    // deep navy shadow
    fabWarm: '#7cb0e0',    // bright blue highlight
    skinCool: '#5a3018',   // dark warm shadow
    skinWarm: '#f8dcc0',   // bright peach highlight
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fabCool.startIdx); },
  drawPost(pc, pal) {
    const fcg = pal.groups.fabCool, fwg = pal.groups.fabWarm;
    const scg = pal.groups.skinCool, swg = pal.groups.skinWarm;

    function fabTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? fcg.startIdx + i : fwg.startIdx + (i - 8);
    }
    function skinTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? scg.startIdx + i : swg.startIdx + (i - 8);
    }

    pc.pixels[0] = 0;

    const W = 64, H = 32;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    function hash(x, y) { return (((x * 48611 ^ y * 97231) >>> 0) / 4294967295); }
    function hash2(x, y) { return (((x * 73856 ^ y * 19349) >>> 0) / 4294967295); }

    // === ARM PROFILE — smooth cubic curves, not linear segments ===
    const armLeft = 3, armRight = 59;
    const armLen = armRight - armLeft;
    const cy = 16;

    const sleeveEnd = 0.72;
    const handStart = 0.78;

    function armHalfWidth(t) {
      // Shoulder: 13px wide, smooth taper to elbow at t=0.45 (10px),
      // forearm tapers to wrist at t=0.72 (7px), hand bulges then tapers
      if (t < 0.0) return 12;
      if (t <= 0.45) {
        // Shoulder to elbow: gentle cubic ease-out
        const s = t / 0.45;
        return 13 - 3 * (s * s * (3 - 2 * s)); // 13 → 10, smooth
      }
      if (t <= 0.72) {
        // Elbow to wrist: slightly faster taper
        const s = (t - 0.45) / 0.27;
        return 10 - 3 * (s * s * (3 - 2 * s)); // 10 → 7
      }
      if (t <= 0.80) {
        // Wrist to palm start
        const s = (t - 0.72) / 0.08;
        return 7 + 2 * Math.sin(s * Math.PI * 0.5); // 7 → 9
      }
      if (t <= 0.93) {
        // Palm: round bulge
        const s = (t - 0.80) / 0.13;
        return 9 - 1.5 * Math.sin(s * Math.PI); // bulge shape, tapers
      }
      // Fingertips: rapid taper
      const s = (t - 0.93) / 0.07;
      return Math.max(1, 7.5 * (1.0 - s * s));
    }

    // Add organic edge jitter (±0.5px based on position hash)
    function armHalfWidthJittered(t, y) {
      const base = armHalfWidth(t);
      const j = (hash(Math.round(t * 100), y * 7 + 13) - 0.5) * 0.8;
      return base + j;
    }

    // Buffers
    const pixBuf = new Int16Array(W * H).fill(-1);
    const matBuf = new Uint8Array(W * H);  // 0=empty, 1=fabric, 2=skin
    const rawV = new Float32Array(W * H);  // raw lighting value

    // === PASS 1: Cylinder lighting with SMOOTH zones ===
    // Zones are defined by normal angle wrapping around the cylinder cross-section
    // Not by quantizing brightness into steps
    for (let x = armLeft; x <= armRight; x++) {
      const t = (x - armLeft) / armLen;
      const halfW = armHalfWidthJittered(t, 0);
      if (halfW < 0.5) continue;

      for (let y = 0; y < H; y++) {
        const dy = y - cy;
        const hw = armHalfWidthJittered(t, y);
        if (Math.abs(dy) > hw) continue;
        const pidx = y * W + x;

        // Cylinder normal (cross-section wraps around)
        const nx = dy / (hw + 0.5);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));

        // Main lighting: cylinder NdotL
        const NdotL = nx * ly * -0.3 + nz * lz;
        let v = Math.pow(Math.max(0, NdotL), 0.65);

        // Global position falloff: shoulder slightly brighter
        v *= (1.0 - t * 0.08);

        // Bounce light on underside
        if (nx > 0.3) v += 0.06 * (nx - 0.3);

        // Cast shadow at shoulder attachment
        if (x < armLeft + 4) {
          v *= 0.35 + 0.65 * ((x - armLeft) / 4);
        }

        // Determine material
        const isSkin = t > handStart;
        const isTransition = t > sleeveEnd && t <= handStart;

        if (isTransition) {
          // Soft crevice at sleeve-to-skin transition
          const bt = (t - sleeveEnd) / (handStart - sleeveEnd);
          if (bt < 0.3) v *= 0.3 + bt * 2.3;
          else if (bt < 0.5) v *= 0.7 + (bt - 0.3) * 1.5;
          matBuf[pidx] = bt < 0.4 ? 1 : 2;
        } else {
          matBuf[pidx] = isSkin ? 2 : 1;
        }

        // Specular
        if (isSkin || (isTransition && matBuf[pidx] === 2)) {
          const spec = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 35) * 0.18;
          v += spec;
        } else {
          const spec = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 20) * 0.08;
          v += spec;
        }

        // Clamp
        v = Math.max(0.02, Math.min(1.0, v));

        // S-curve for contrast
        v = v * v * (3 - 2 * v);

        rawV[pidx] = v;

        // === SOFT ZONE RENDERING ===
        // 5 zones based on v, but with DITHERED transitions between zones
        // Each zone boundary is a 3-pixel-wide blend band
        const zoneThresholds = [0.12, 0.30, 0.50, 0.72]; // 4 boundaries = 5 zones
        const zoneCenters = [0.06, 0.21, 0.40, 0.61, 0.86]; // brightness at zone center
        const blendWidth = 0.06; // how wide the dithered transition is

        let zone = 0;
        let blendFrac = 0; // 0 = fully in lower zone, 1 = fully in upper zone
        for (let zi = 0; zi < 4; zi++) {
          const thresh = zoneThresholds[zi];
          if (v > thresh + blendWidth) {
            zone = zi + 1;
          } else if (v > thresh - blendWidth) {
            // In the transition band — compute blend fraction
            blendFrac = (v - (thresh - blendWidth)) / (blendWidth * 2);
            // Dither: use hash to decide which zone this pixel belongs to
            const dith = hash(x * 7 + y * 31, x * 13 - y * 5);
            if (dith < blendFrac) {
              zone = zi + 1;
            } else {
              zone = zi;
            }
            break;
          }
        }

        // Map zone to palette tone
        const zoneBrightness = zoneCenters[zone];
        let tI = zoneBrightness * 15;

        const toneFn = matBuf[pidx] === 2 ? skinTone : fabTone;
        pixBuf[pidx] = toneFn(tI);
      }
    }

    // === PASS 2: Irregular fabric texture (NOT grid blocks) ===
    // Hash-based brightness variation at multiple scales
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (matBuf[pidx] !== 1) continue;

        // Multi-scale hash noise
        const n1 = (hash(x * 3 + 7, y * 5 + 11) - 0.5) * 1.5;  // fine grain
        const n2 = (hash2(Math.floor(x / 3) * 17, Math.floor(y / 3) * 23) - 0.5) * 1.8; // medium scale
        const bumpShift = n1 + n2;

        // Subtle drape modulation (gentle sine wave along arm length)
        const t = (x - armLeft) / armLen;
        const drape = Math.sin(t * Math.PI * 4.5) * 0.8;

        const currentV = rawV[pidx];
        const adjustedV = Math.max(0.02, Math.min(1.0, currentV + (bumpShift + drape) / 15));

        // Re-zone with the adjusted value (same soft zone logic)
        const zoneThresholds = [0.12, 0.30, 0.50, 0.72];
        const zoneCenters = [0.06, 0.21, 0.40, 0.61, 0.86];
        const blendWidth = 0.06;

        let zone = 0;
        for (let zi = 0; zi < 4; zi++) {
          const thresh = zoneThresholds[zi];
          if (adjustedV > thresh + blendWidth) {
            zone = zi + 1;
          } else if (adjustedV > thresh - blendWidth) {
            const bf = (adjustedV - (thresh - blendWidth)) / (blendWidth * 2);
            const dith = hash(x * 11 + y * 37, x * 19 - y * 7);
            if (dith < bf) zone = zi + 1;
            break;
          }
        }

        pixBuf[pidx] = fabTone(zoneCenters[zone] * 15);
      }
    }

    // === PASS 3: Outline — variable weight, organic ===
    const outlineBuf = new Uint8Array(W * H);
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
        const dy = y - cy;
        const t = (x - armLeft) / armLen;
        const toneFn = matBuf[y * W + x] === 2 ? skinTone : fabTone;

        if (dy > 1) {
          // Shadow side (bottom): thick dark outline
          pixBuf[y * W + x] = toneFn(0);
          // Second outline pixel on shadow side for thickness
          const innerY = y - 1;
          if (innerY >= 0 && pixBuf[innerY * W + x] >= 0 && !outlineBuf[innerY * W + x]) {
            const innerV = rawV[innerY * W + x];
            if (innerV < 0.4) pixBuf[innerY * W + x] = toneFn(1);
          }
        } else if (dy < -1) {
          // Lit side (top): thinner, slightly lighter outline
          pixBuf[y * W + x] = toneFn(1);
        } else {
          // Ends: dark
          pixBuf[y * W + x] = toneFn(0);
        }
      }
    }

    // === PASS 4: Lit-side rim highlight (inside outline, top edge) ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!outlineBuf[y * W + x]) continue;
        const dy = y - cy;
        if (dy >= -1) continue;
        const innerY = y + 1;
        if (innerY >= H) continue;
        if (pixBuf[innerY * W + x] < 0 || outlineBuf[innerY * W + x]) continue;

        const toneFn = matBuf[innerY * W + x] === 2 ? skinTone : fabTone;
        pixBuf[innerY * W + x] = toneFn(13);
      }
    }

    // === PASS 5: Specular clusters (after outline) ===
    function placeSpecular(tPos, toneFn, matId, coreSize) {
      const sx = armLeft + Math.round(tPos * armLen);
      const hw = armHalfWidth(tPos);
      const sy = cy - Math.round(hw * 0.35);

      // Core pixels
      const coreOffsets = coreSize >= 5 ?
        [[0,0],[1,0],[2,0],[0,1],[1,1]] :
        [[0,0],[1,0],[0,1]];
      for (const [ox, oy] of coreOffsets) {
        const px = sx + ox, py = sy + oy;
        if (px >= 0 && px < W && py >= 0 && py < H &&
            pixBuf[py * W + px] >= 0 && !outlineBuf[py * W + px] && matBuf[py * W + px] === matId) {
          pixBuf[py * W + px] = toneFn(15);
        }
      }
      // Halo
      const haloOffsets = coreSize >= 5 ?
        [[-1,-1],[0,-1],[1,-1],[2,-1],[3,0],[3,1],[-1,0],[-1,1],[0,2],[1,2]] :
        [[-1,0],[2,0],[0,-1],[1,-1],[-1,1],[0,2]];
      for (const [ox, oy] of haloOffsets) {
        const px = sx + ox, py = sy + oy;
        if (px >= 0 && px < W && py >= 0 && py < H &&
            pixBuf[py * W + px] >= 0 && !outlineBuf[py * W + px] && matBuf[py * W + px] === matId) {
          pixBuf[py * W + px] = toneFn(13);
        }
      }
    }

    placeSpecular(0.20, fabTone, 1, 5); // Upper arm
    placeSpecular(0.50, fabTone, 1, 3); // Forearm
    placeSpecular(0.84, skinTone, 2, 3); // Hand

    // === PASS 6: Hand articulation ===
    // Finger grooves (subtle dark lines)
    for (let fi = -1; fi <= 1; fi++) {
      const grooveY = cy + fi * 2;
      if (grooveY < 0 || grooveY >= H) continue;
      for (let x = armLeft + Math.round(0.90 * armLen); x <= armLeft + Math.round(0.96 * armLen); x++) {
        if (x >= W) continue;
        const pidx = grooveY * W + x;
        if (pixBuf[pidx] >= 0 && matBuf[pidx] === 2 && !outlineBuf[pidx]) {
          pixBuf[pidx] = skinTone(3);
        }
      }
    }

    // Knuckle highlights
    const knuckleX = armLeft + Math.round(0.87 * armLen);
    for (let fi = -2; fi <= 2; fi++) {
      const ky = cy + fi * 2;
      if (ky < 0 || ky >= H) continue;
      if (pixBuf[ky * W + knuckleX] >= 0 && matBuf[ky * W + knuckleX] === 2 && !outlineBuf[ky * W + knuckleX]) {
        pixBuf[ky * W + knuckleX] = skinTone(12);
      }
      if (ky + 1 < H && pixBuf[(ky+1) * W + knuckleX] >= 0 && matBuf[(ky+1) * W + knuckleX] === 2 && !outlineBuf[(ky+1) * W + knuckleX]) {
        pixBuf[(ky+1) * W + knuckleX] = skinTone(4);
      }
    }

    // === WRITE BUFFER ===
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (pixBuf[y * W + x] >= 0) pc.setPixel(x, y, pixBuf[y * W + x]);
  },
};
