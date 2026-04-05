// Exercise 4: The eye socket — concave form with rim lighting (iteration 12 rewrite)
// TRANSFERABLE: How to render concave forms (bowls, sockets, cave entrances)
// FIX from iteration 11: scales around socket must be DENSELY packed — no bare background
// Uses tighter grid + extra ring of scales near socket perimeter

module.exports = {
  width: 128, height: 128, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cool: '#2a6830',   // L≈22% — shadow/deep socket
    warm: '#8cd490',   // L≈74% — lit scales/rim
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.cool.startIdx); },
  drawPost(pc, pal) {
    const cg = pal.groups.cool, wg = pal.groups.warm;
    const DARKEST = cg.startIdx;
    const BRIGHTEST = wg.startIdx + wg.toneCount - 1;
    const SECOND = wg.startIdx + wg.toneCount - 2;

    function toneIdx(i) {
      i = Math.max(0, Math.min(15, i));
      if (i < 8) return cg.startIdx + i;
      return wg.startIdx + (i - 8);
    }

    pc.pixels[0] = 0;

    const W = 128, H = 128;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    let _seed = 42;
    function rng() { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; }

    // === GEOMETRY ===
    const cx = 64, cy = 64;
    const almondW = 46; // half-width of almond
    const almondH = 20; // half-height of almond

    function almondDist(x, y) {
      const dx = (x - cx) / almondW;
      const dy = (y - cy) / almondH;
      const xFactor = Math.abs(dx);
      const sharpening = 1.0 + xFactor * xFactor * 0.5;
      const d = dx * dx + (dy * sharpening) * (dy * sharpening);
      return Math.sqrt(d) - 1.0;
    }

    function lidThickness(angle) {
      const sinA = Math.sin(angle);
      if (sinA < 0) return 7;
      return 3.5;
    }

    // === FILL BACKGROUND with dark textured base ===
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const h = (((x * 48611 ^ y * 97231) >>> 0) / 4294967295);
        pc.setPixel(x, y, toneIdx(h < 0.7 ? 1 : 0));
      }

    // === PASS 0: Dense surrounding scales (Voronoi, zone-based) ===
    // Key fix: MUCH tighter grid spacing (13x11 instead of 18x15)
    // Plus extra perimeter seeds near the socket edge
    const scales = [];
    const baseR = 10;

    // Main grid — tighter spacing for dense packing
    for (let row = -7; row <= 7; row++) {
      for (let col = -7; col <= 7; col++) {
        const bx = cx + col * 13 + (row % 2) * 6.5;
        const by = cy + row * 11;
        const jx = Math.round(bx + (rng() - 0.5) * 5);
        const jy = Math.round(by + (rng() - 0.5) * 4);

        const ad = almondDist(jx, jy);
        if (ad < 0.18) continue; // skip scales inside or overlapping socket
        if (jx < 1 || jx >= W - 1 || jy < 1 || jy >= H - 1) continue;

        // Distance from almond edge determines scale size
        // Scales near socket are slightly smaller, but NOT too small
        const r = ad < 0.4 ? Math.max(6, Math.round(baseR * 0.7)) :
                  ad < 0.7 ? Math.max(7, Math.round(baseR * 0.85)) :
                  baseR;

        const gnx = (jx - cx) / 80, gny = (jy - cy) / 80;
        const gb = Math.max(0.05, Math.min(0.95, 0.5 + gnx * lx * 0.8 + gny * ly * 0.8));

        scales.push({
          x: jx, y: jy, r, gb,
          hash: ((jx * 73856093 ^ jy * 19349663) >>> 0)
        });
      }
    }

    // Extra ring of small scales immediately around the socket perimeter
    // This fills the gap between the main grid and the lid
    for (let angle = 0; angle < Math.PI * 2; angle += 0.28) {
      const cosA = Math.cos(angle), sinA = -Math.sin(angle);
      // Place scales at multiple distances from the socket edge
      for (let ring = 0; ring < 3; ring++) {
        const dist = 0.25 + ring * 0.18; // almond distance from edge
        // Convert almondDist back to pixel coordinates approximately
        const ax = cx + cosA * almondW * (1.0 + dist * 0.9);
        const ay = cy + sinA * almondH * (1.0 + dist * 1.1);
        const jx = Math.round(ax + (rng() - 0.5) * 3);
        const jy = Math.round(ay + (rng() - 0.5) * 3);

        if (jx < 1 || jx >= W - 1 || jy < 1 || jy >= H - 1) continue;
        const ad = almondDist(jx, jy);
        if (ad < 0.15 || ad > 0.65) continue;

        // Check not too close to existing seeds
        let tooClose = false;
        for (const s of scales) {
          const d2 = (s.x - jx) * (s.x - jx) + (s.y - jy) * (s.y - jy);
          if (d2 < 64) { tooClose = true; break; } // 8px min distance
        }
        if (tooClose) continue;

        const r = Math.max(5, Math.round(baseR * 0.6));
        const gnx = (jx - cx) / 80, gny = (jy - cy) / 80;
        const gb = Math.max(0.05, Math.min(0.95, 0.5 + gnx * lx * 0.8 + gny * ly * 0.8));

        scales.push({
          x: jx, y: jy, r, gb,
          hash: ((jx * 73856093 ^ jy * 19349663) >>> 0)
        });
      }
    }

    scales.sort((a, b) => a.y - b.y);

    // Voronoi assignment: every pixel outside the socket belongs to its nearest scale
    const pixBuf = new Int16Array(W * H).fill(-1);
    const ownerBuf = new Int16Array(W * H).fill(-1);
    const zoneBuf = new Uint8Array(W * H); // 0=bg, 1=scale, 2=socket, 3=lid
    const distBuf = new Float32Array(W * H).fill(1e9);
    const dist2Buf = new Float32Array(W * H).fill(1e9); // second-nearest for crevice detection

    // Voronoi pass: assign every non-socket pixel to nearest scale
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ad = almondDist(x, y);
        if (ad < 0.0) continue; // inside socket — handled later

        const pidx = y * W + x;
        let bestD = 1e9, best2D = 1e9, bestI = -1;
        for (let si = 0; si < scales.length; si++) {
          const s = scales[si];
          const d2 = (x - s.x) * (x - s.x) + (y - s.y) * (y - s.y);
          const d = Math.sqrt(d2);
          if (d < bestD) { best2D = bestD; bestD = d; bestI = si; }
          else if (d < best2D) { best2D = d; }
        }
        if (bestI >= 0) {
          ownerBuf[pidx] = bestI;
          distBuf[pidx] = bestD;
          dist2Buf[pidx] = best2D;
          zoneBuf[pidx] = 1;
        }
      }
    }

    // Render scales using zone-based rendering (proven from ex2/ex3)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 1) continue;

        const si = ownerBuf[pidx];
        const s = scales[si];
        const gb = s.gb;
        const R = s.r;

        // Crevice detection via Voronoi boundary
        const dRatio = distBuf[pidx] / (dist2Buf[pidx] + 0.01);
        const isCrevice = dRatio > 0.85; // close to boundary between two cells

        if (isCrevice) {
          pixBuf[pidx] = DARKEST;
          continue;
        }

        // Shield-shaped dome: taper the lower portion
        const dx = x - s.x, dy = y - s.y;
        const normDy = dy / R;
        const taper = normDy > 0 ? 1.0 - normDy * 0.3 : 1.0;
        const effRx = R * taper;
        const effRy = R * 1.05;

        // Per-scale dome NdotL
        const snx = dx / (effRx + 0.5);
        const sny = dy / (effRy + 0.5);
        const sn2 = snx * snx + sny * sny;
        const snz = Math.sqrt(Math.max(0.01, 1 - Math.min(1, sn2)));
        let NdotL = snx * lx + sny * ly + snz * lz;
        let localV = Math.max(0, NdotL);
        localV = Math.pow(localV, 0.65); // gamma

        // Range-band shifting based on global brightness
        const baseI = Math.round(gb * 9);
        const t0 = Math.max(0, baseI);
        const t1 = Math.min(15, baseI + 2);
        const t2 = Math.min(15, baseI + 4);
        const t3 = Math.min(15, baseI + 6);
        const t4 = Math.min(15, baseI + 7);

        // Zone-based tonal mapping (5 zones)
        let toneI;
        if (localV < 0.18) toneI = t0;
        else if (localV < 0.35) toneI = t1;
        else if (localV < 0.55) toneI = t2;
        else if (localV < 0.78) toneI = t3;
        else toneI = t4;

        // Micro pits (texture)
        let ps = s.hash;
        for (let p = 0; p < 3; p++) {
          ps = (ps * 16807) % 2147483647;
          const pdx = (ps % (R * 2 - 2)) - R + 1;
          ps = (ps * 16807) % 2147483647;
          const pdy = (ps % (R * 2 - 2)) - R + 1;
          const pd2 = (dx - pdx) * (dx - pdx) + (dy - pdy) * (dy - pdy);
          if (pd2 < 4) { toneI = Math.max(t0, toneI - 2); break; }
        }

        pixBuf[pidx] = toneIdx(toneI);
      }
    }

    // Ridge detection: pixels adjacent to crevices get boosted
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 1) continue;
        if (pixBuf[pidx] === DARKEST) continue; // is a crevice pixel

        let nearCrevice = false;
        for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
          const ni = (y + oy) * W + (x + ox);
          if (ni >= 0 && ni < W * H && pixBuf[ni] === DARKEST && zoneBuf[ni] === 1) {
            nearCrevice = true; break;
          }
        }
        if (!nearCrevice) continue;

        const si = ownerBuf[pidx];
        const s = scales[si];
        const ridgeBase = Math.round(s.gb * 9);
        const ridgeTone = Math.min(15, ridgeBase + 8);
        pixBuf[pidx] = toneIdx(ridgeTone);
      }
    }

    // === PASS 1: Socket interior — CONCAVE depth lighting ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ad = almondDist(x, y);
        if (ad >= 0) continue;

        const pidx = y * W + x;
        const depth = -ad;
        const maxDepth = 0.85;
        const nd = Math.min(1, depth / maxDepth);

        const lateralX = (x - cx) / almondW;
        const lateralY = (y - cy) / almondH;

        const rimFactor = 1.0 - nd;
        const cnz = rimFactor * 0.8 + 0.05;
        const cnx = lateralX * (1.0 - rimFactor * 0.5);
        const cny = lateralY * (1.0 - rimFactor * 0.5) - 0.3 * nd;

        const cNdotL = cnx * lx + cny * ly + cnz * lz;
        let v = Math.max(0, cNdotL);
        const depthDarken = Math.pow(1.0 - nd, 1.5);
        v = v * depthDarken;
        const ambientOcc = 0.02 + 0.08 * (1.0 - nd);
        v = ambientOcc + v * 0.7;

        let toneI;
        if (v < 0.06) toneI = 0;
        else if (v < 0.12) toneI = 1;
        else if (v < 0.20) toneI = 2;
        else if (v < 0.35) toneI = 4;
        else toneI = 5;

        // Subtle wrinkle texture
        const hash2 = (((x >> 1) * 48611 ^ (y >> 1) * 97231) >>> 0) / 4294967295;
        if (hash2 < 0.15 && nd > 0.15) toneI = Math.max(0, toneI - 1);
        if (hash2 > 0.85 && nd < 0.5) toneI = Math.min(5, toneI + 1);

        pixBuf[pidx] = toneIdx(toneI);
        zoneBuf[pidx] = 2;
      }
    }

    // === PASS 2: Eyelid ridge ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ad = almondDist(x, y);
        const angle = Math.atan2(-(y - cy), x - cx);
        const thick = lidThickness(angle);
        const lidPixDist = ad * Math.min(almondW, almondH);

        if (lidPixDist < -2 || lidPixDist > thick) continue;

        const pidx = y * W + x;
        if (zoneBuf[pidx] === 1 && ad > 0.15) continue;

        const lidT = (lidPixDist + 2) / (thick + 2);
        const ridgeNz = Math.sqrt(Math.max(0.05, 1.0 - (2 * lidT - 1) * (2 * lidT - 1)));

        const edgeNx = -Math.sin(angle) * (2 * lidT - 1) * 0.3 + Math.cos(angle) * 0.1;
        const edgeNy = Math.cos(angle) * (2 * lidT - 1) * 0.3 + Math.sin(angle) * 0.1;

        let NdotL = edgeNx * lx + edgeNy * ly + ridgeNz * lz;
        let v = Math.max(0, NdotL);
        v = Math.pow(v, 0.65);

        if (lidT < 0.2) v *= lidT / 0.2 * 0.5;

        const isUpper = (y - cy) < 0;
        if (isUpper) v = v * 1.0 + 0.05;

        let toneI;
        if (v < 0.15) toneI = 2;
        else if (v < 0.30) toneI = 4;
        else if (v < 0.50) toneI = 6;
        else if (v < 0.72) toneI = 9;
        else toneI = 11;

        const lHash = (((x * 31337 ^ y * 17389) >>> 0) / 4294967295);
        if (lHash < 0.08) toneI = Math.max(2, toneI - 1);

        pixBuf[pidx] = toneIdx(toneI);
        zoneBuf[pidx] = 3;
      }
    }

    // === PASS 3: Rim lighting on upper lid ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 3) continue;

        const ad = almondDist(x, y);
        const angle = Math.atan2(-(y - cy), x - cx);
        const thick = lidThickness(angle);
        const lidPixDist = ad * Math.min(almondW, almondH);

        const isRim = lidPixDist > (thick - 3) && lidPixDist <= thick;
        if (!isRim) continue;

        const isUpper = (y - cy) < -2;
        const isLeft = (x - cx) < 10;

        if (isUpper) {
          const lateralBright = isLeft ? 14 : 12;
          pixBuf[pidx] = toneIdx(lateralBright);
        } else if (angle < -0.3 || angle > Math.PI + 0.3) {
          pixBuf[pidx] = toneIdx(10);
        }
      }
    }

    // === PASS 4: Upper lid cast shadow ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 2) continue;

        const ad = almondDist(x, y);
        const depth = -ad;
        const isNearTopEdge = (y - cy) < -almondH * 0.3 && depth < 0.3;
        if (isNearTopEdge) pixBuf[pidx] = toneIdx(0);
      }
    }

    // === Write pixel buffer ===
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (pixBuf[y * W + x] >= 0)
          pc.setPixel(x, y, pixBuf[y * W + x]);

    // === PASS 5: Specular on mid-brightness scales ===
    for (const s of scales) {
      if (s.gb < 0.30 || s.gb > 0.55) continue;
      if (s.x < 6 || s.x > W - 6 || s.y < 6 || s.y > H - 6) continue;

      const sx = s.x - Math.round(s.r * 0.2);
      const sy = s.y - Math.round(s.r * 0.3);
      const core = [[0,0],[1,0],[2,0],[0,1],[0,2]];
      for (const [ox, oy] of core) {
        const px = sx + ox, py = sy + oy;
        if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 1)
          pc.setPixel(px, py, BRIGHTEST);
      }
      const halo = [[-1,-1],[0,-1],[1,-1],[2,-1],[3,0],[-1,0],[-1,1],[0,3]];
      for (const [ox, oy] of halo) {
        const px = sx + ox, py = sy + oy;
        if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 1)
          pc.setPixel(px, py, SECOND);
      }
    }

    // === PASS 6: Lid specular ===
    const specX = cx - 12, specY = cy - 18;
    const lidSpec = [[0,0],[1,0],[-1,1],[0,1],[1,1]];
    for (const [ox, oy] of lidSpec) {
      const px = specX + ox, py = specY + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 3)
        pc.setPixel(px, py, BRIGHTEST);
    }
  },
};
