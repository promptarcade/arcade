// Exercise 2: Single arm at 64×32 HD — ATTEMPT 3
// KEY CHANGES: bump texture AFTER zone (not normal perturb), harder specular,
// wider tonal range (near-black to near-white), edge pairs pronounced,
// better hand articulation

module.exports = {
  width: 64, height: 32, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    fabCool: '#0e2040',    // very dark navy (push shadow end darker)
    fabWarm: '#88b8e8',    // bright sky blue (push lit end brighter)
    skinCool: '#5a3018',   // dark brown shadow
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

    // === ARM PROFILE ===
    const armLeft = 3, armRight = 59;
    const armLen = armRight - armLeft;
    const cy = 16;

    const sleeveEnd = 0.70;  // where sleeve fabric ends
    const handStart = 0.77;  // where clean skin begins

    function armHalfWidth(t) {
      if (t < 0.05) return 12 + t / 0.05 * 1;
      if (t < 0.35) return 13 - (t - 0.05) / 0.30 * 2;
      if (t < 0.50) return 11 - (t - 0.35) / 0.15 * 1;
      if (t < 0.70) return 10 - (t - 0.50) / 0.20 * 3;
      if (t < 0.78) return 7;
      if (t < 0.86) return 7 + (t - 0.78) / 0.08 * 2;
      if (t < 0.93) return 9 - (t - 0.86) / 0.07 * 2;
      return Math.max(1, 7 * (1.0 - (t - 0.93) / 0.07));
    }

    // Buffers
    const pixBuf = new Int16Array(W * H).fill(-1);
    const matBuf = new Uint8Array(W * H);
    const toneBuf = new Float32Array(W * H); // raw tone index (float)

    // === PASS 1: Zone-based cylinder fill ===
    for (let x = armLeft; x <= armRight; x++) {
      const t = (x - armLeft) / armLen;
      const halfW = armHalfWidth(t);
      if (halfW < 0.5) continue;

      const isSkin = t > handStart;
      const isTransition = t > sleeveEnd && t <= handStart;

      for (let y = Math.floor(cy - halfW); y <= Math.ceil(cy + halfW); y++) {
        if (y < 0 || y >= H) continue;
        const dy = y - cy;
        if (Math.abs(dy) > halfW) continue;
        const pidx = y * W + x;

        const nx = dy / (halfW + 0.5);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const NdotL = -0.12 * ly + nz * lz; // cylinder, lit from top-left
        let localV = Math.pow(Math.max(0, NdotL), 0.65);

        // Global position: shoulder brighter, hand darker
        localV *= (1.0 - t * 0.10);

        // Bounce on underside
        if (nx > 0.4) localV += 0.05;

        if (isSkin) {
          matBuf[pidx] = 2;
          // Skin specular (shinier)
          const spec = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 40) * 0.20;
          localV += spec;
        } else {
          matBuf[pidx] = 1;
          // Matte specular (weak)
          const spec = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 18) * 0.06;
          localV += spec;
        }

        // Cast shadow at shoulder
        if (x < armLeft + 5) {
          localV *= 0.3 + 0.7 * ((x - armLeft) / 5);
        }

        // Transition zone: dark crevice
        if (isTransition) {
          const bt = (t - sleeveEnd) / (handStart - sleeveEnd);
          if (bt < 0.35) localV *= 0.25 + bt * 1.5;
        }

        // Map to 0-15 tone range
        let tI = localV * 15;
        toneBuf[pidx] = tI;

        // Zone quantization: 5 zones with dithered edges
        const zoneSize = 15 / 5; // 3 tones per zone
        const zoneIdx = Math.floor(tI / zoneSize);
        const zoneFrac = (tI % zoneSize) / zoneSize;
        const dith = hash(x * 7 + 3, y * 11 + 5) < zoneFrac * 0.5 ? 1 : 0;
        const z = Math.min(4, Math.max(0, zoneIdx + dith));
        const zoneCenter = z * zoneSize + zoneSize * 0.5;

        const toneFn = isSkin ? skinTone : fabTone;
        pixBuf[pidx] = toneFn(Math.round(zoneCenter));
      }
    }

    // === PASS 2: Fabric bump texture (AFTER zone fill — brightness variation) ===
    // Use 3-4px blocks for visible texture, not per-pixel noise
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (matBuf[pidx] !== 1) continue;

        // Weave texture: 4px blocks with alternating brightness
        const bx = Math.floor(x / 4), by = Math.floor(y / 4);
        const blockHash = hash(bx * 17, by * 31);
        // Diagonal weave direction
        const weave = ((bx + by) % 2 === 0) ? 1.0 : -1.0;
        const bumpShift = (blockHash - 0.5) * 3.5 + weave * 0.8;

        // Apply as tone shift (not normal perturbation!)
        const currentTone = toneBuf[pidx];
        const bumpedTone = Math.max(0, Math.min(15, Math.round(currentTone + bumpShift)));
        pixBuf[pidx] = fabTone(bumpedTone);
      }
    }

    // === PASS 3: Fabric fold creases (dark-bright edge pairs) ===
    const foldTs = [0.20, 0.40, 0.56];
    for (const ft of foldPositions = foldTs) {
      const fx = armLeft + Math.round(ft * armLen);
      const halfW = armHalfWidth(ft);

      for (let y = Math.floor(cy - halfW + 2); y <= Math.ceil(cy + halfW - 2); y++) {
        if (y < 0 || y >= H) continue;
        // Dark crease (1px)
        if (pixBuf[y * W + fx] >= 0 && matBuf[y * W + fx] === 1) {
          pixBuf[y * W + fx] = fabTone(1);
        }
        // Bright ridge left of crease (toward light source)
        if (fx - 1 >= armLeft && pixBuf[y * W + fx - 1] >= 0 && matBuf[y * W + fx - 1] === 1) {
          pixBuf[y * W + fx - 1] = fabTone(13);
        }
      }
    }

    // === PASS 4: Outline (variable thickness: thick+dark shadow, thin+lighter lit) ===
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
        const isSkin = t > handStart;
        const toneFn = isSkin ? skinTone : fabTone;

        if (dy > 2) {
          // Shadow side: near-black
          pixBuf[y * W + x] = toneFn(0);
          // Second outline pixel inward for thick shadow edge
          const innerY = y - 1;
          if (innerY >= 0 && pixBuf[innerY * W + x] >= 0 && !outlineBuf[innerY * W + x]) {
            pixBuf[innerY * W + x] = toneFn(1);
          }
        } else if (dy < -2) {
          // Lit side: dark but not blackest
          pixBuf[y * W + x] = toneFn(1);
        } else {
          // Sides (left/right ends)
          pixBuf[y * W + x] = toneFn(0);
        }
      }
    }

    // === PASS 5: Inner rim highlight on lit side ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!outlineBuf[y * W + x]) continue;
        const dy = y - cy;
        if (dy >= -2) continue; // only lit (top) side
        const innerY = y + 1;
        if (innerY >= H) continue;
        if (pixBuf[innerY * W + x] < 0 || outlineBuf[innerY * W + x]) continue;

        const t = (x - armLeft) / armLen;
        const isSkin = t > handStart;
        const toneFn = isSkin ? skinTone : fabTone;
        pixBuf[innerY * W + x] = toneFn(13);
      }
    }

    // === PASS 6: Material boundary edge pair ===
    const creviceX = armLeft + Math.round(sleeveEnd * armLen);
    const ridgeX = armLeft + Math.round(handStart * armLen);
    for (let y = 0; y < H; y++) {
      // 2px dark crevice at sleeve terminus
      for (let dx = 0; dx <= 1; dx++) {
        const cx2 = creviceX + dx;
        if (cx2 < W && pixBuf[y * W + cx2] >= 0) pixBuf[y * W + cx2] = fabTone(0);
      }
      // 2px bright skin ridge
      for (let dx = 0; dx <= 1; dx++) {
        const rx = ridgeX + dx;
        if (rx < W && pixBuf[y * W + rx] >= 0 && matBuf[y * W + rx] === 2) {
          pixBuf[y * W + rx] = skinTone(dx === 0 ? 14 : 12);
        }
      }
    }

    // === PASS 7: Specular clusters (AFTER outline, skip outline pixels) ===
    // Upper arm: 5px L-shape, near-white
    const sp1x = armLeft + Math.round(0.22 * armLen);
    const sp1hw = armHalfWidth(0.22);
    const sp1y = cy - Math.round(sp1hw * 0.38);
    // Core: brightest
    for (const [ox, oy] of [[0,0],[1,0],[2,0],[0,1],[1,1]]) {
      const px = sp1x + ox, py = sp1y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H &&
          pixBuf[py * W + px] >= 0 && !outlineBuf[py * W + px] && matBuf[py * W + px] === 1) {
        pixBuf[py * W + px] = fabTone(15);
      }
    }
    // Halo
    for (const [ox, oy] of [[-1,-1],[0,-1],[1,-1],[2,-1],[3,0],[3,1],[-1,0],[-1,1],[0,2],[1,2]]) {
      const px = sp1x + ox, py = sp1y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H &&
          pixBuf[py * W + px] >= 0 && !outlineBuf[py * W + px] && matBuf[py * W + px] === 1) {
        pixBuf[py * W + px] = fabTone(13);
      }
    }

    // Forearm: 3px cluster
    const sp2x = armLeft + Math.round(0.48 * armLen);
    const sp2y = cy - Math.round(armHalfWidth(0.48) * 0.35);
    for (const [ox, oy] of [[0,0],[1,0],[0,1]]) {
      const px = sp2x + ox, py = sp2y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H &&
          pixBuf[py * W + px] >= 0 && !outlineBuf[py * W + px] && matBuf[py * W + px] === 1) {
        pixBuf[py * W + px] = fabTone(15);
      }
    }

    // Hand: 3px skin specular (shinier material)
    const sp3x = armLeft + Math.round(0.83 * armLen);
    const sp3y = cy - Math.round(armHalfWidth(0.83) * 0.30);
    for (const [ox, oy] of [[0,0],[1,0],[0,1]]) {
      const px = sp3x + ox, py = sp3y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H &&
          pixBuf[py * W + px] >= 0 && !outlineBuf[py * W + px] && matBuf[py * W + px] === 2) {
        pixBuf[py * W + px] = skinTone(15);
      }
    }

    // === PASS 8: Hand articulation ===
    // Finger grooves (3 dark lines suggesting 4 fingers)
    const fingerStartT = 0.91;
    const fingerEndT = 0.97;
    for (let fi = -1; fi <= 1; fi++) {
      const grooveY = cy + fi * 2;
      for (let x = armLeft + Math.round(fingerStartT * armLen); x <= armLeft + Math.round(fingerEndT * armLen); x++) {
        if (x >= W) continue;
        const pidx = grooveY * W + x;
        if (grooveY >= 0 && grooveY < H && pixBuf[pidx] >= 0 && matBuf[pidx] === 2 && !outlineBuf[pidx]) {
          pixBuf[pidx] = skinTone(2);
        }
      }
    }

    // Knuckle highlights (bright-dark pairs at knuckle line)
    const knuckleX = armLeft + Math.round(0.88 * armLen);
    for (let fi = -2; fi <= 2; fi++) {
      const ky = cy + fi * 2;
      if (ky < 0 || ky >= H) continue;
      // Bright knuckle top
      if (pixBuf[ky * W + knuckleX] >= 0 && matBuf[ky * W + knuckleX] === 2 && !outlineBuf[ky * W + knuckleX]) {
        pixBuf[ky * W + knuckleX] = skinTone(13);
      }
      // Dark underside
      if (ky + 1 < H && pixBuf[(ky+1) * W + knuckleX] >= 0 && matBuf[(ky+1) * W + knuckleX] === 2 && !outlineBuf[(ky+1) * W + knuckleX]) {
        pixBuf[(ky+1) * W + knuckleX] = skinTone(3);
      }
    }

    // Thumb suggestion: slight bump on bottom of hand
    const thumbX = armLeft + Math.round(0.82 * armLen);
    const thumbY = cy + Math.round(armHalfWidth(0.82) * 0.6);
    for (const [ox, oy] of [[0,0],[1,0],[0,-1]]) {
      const px = thumbX + ox, py = thumbY + oy;
      if (px >= 0 && px < W && py >= 0 && py < H &&
          pixBuf[py * W + px] >= 0 && matBuf[py * W + px] === 2 && !outlineBuf[py * W + px]) {
        pixBuf[py * W + px] = skinTone(10);
      }
    }

    // === WRITE BUFFER ===
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (pixBuf[y * W + x] >= 0) pc.setPixel(x, y, pixBuf[y * W + x]);
  },
};
