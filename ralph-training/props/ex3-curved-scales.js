// Exercise 3: Scales wrapping around a curved surface (sphere)
// Combines: Voronoi tessellation, zone-based rendering, global sphere lighting
// Key technique: range-band shifting + foreshortened scale sizes at edges
// Multi-pass: interiors → boundaries → ridges → specular

module.exports = {
  width: 128, height: 128, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cool: '#2a6830',   // L≈22%
    warm: '#8cd490',   // L≈74%
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

    let _seed = 137;
    function rng() { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; }

    // Sphere definition — the underlying curved surface
    const scx = 64, scy = 64, sR = 56;

    // Fill background with near-black
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        pc.setPixel(x, y, DARKEST);

    // Compute sphere normal and depth at each pixel
    const sphereNz = new Float32Array(W * H);
    const sphereNdotL = new Float32Array(W * H);
    const insideSphere = new Uint8Array(W * H);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - scx, dy = y - scy;
        const d2 = dx * dx + dy * dy;
        if (d2 > sR * sR) continue;
        const idx = y * W + x;
        insideSphere[idx] = 1;
        const nx = dx / sR, ny = dy / sR;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        sphereNz[idx] = nz;
        sphereNdotL[idx] = Math.max(0, nx * lx + ny * ly + nz * lz);
      }
    }

    // Generate scale seeds on the visible sphere surface
    // Scale density varies: larger scales near center, smaller at edges (foreshortening)
    const scales = [];
    const baseR = 13; // base scale radius near center

    // Place scales in a grid pattern on the sphere, with spacing adjusted
    for (let row = -6; row <= 6; row++) {
      for (let col = -6; col <= 6; col++) {
        const baseX = scx + col * 16 + (row % 2) * 8;
        const baseY = scy + row * 13;

        // Jitter
        const jx = baseX + (rng() - 0.5) * 8;
        const jy = baseY + (rng() - 0.5) * 6;
        const px = Math.round(jx), py = Math.round(jy);

        // Must be inside sphere
        const dx = px - scx, dy = py - scy;
        const d2 = dx * dx + dy * dy;
        if (d2 > (sR - 4) * (sR - 4)) continue;

        // Scale size decreases at edges (foreshortening)
        // nz tells us how much the surface faces us
        const nx = dx / sR, ny = dy / sR;
        const nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));
        const r = Math.max(5, Math.round(baseR * nz));

        // Global brightness for this scale center
        const gb = Math.max(0, nx * lx + ny * ly + nz * lz);

        scales.push({
          x: px, y: py, r, gb,
          hash: ((px * 73856093 ^ py * 19349663) >>> 0)
        });
      }
    }

    scales.sort((a, b) => a.y - b.y);

    // Buffers
    const pixBuf = new Int16Array(W * H).fill(-1);
    const ownerBuf = new Int16Array(W * H).fill(-1);

    // Pass 1: Draw scale interiors with ZONE-BASED rendering
    for (let si = 0; si < scales.length; si++) {
      const s = scales[si];
      const R = s.r;
      const gb = s.gb; // global brightness at this scale's center

      // Range-band shifting: shadow scales → low palette, bright scales → high palette
      const baseIdx = Math.round(gb * 9); // 0-9 shift into 16-tone ramp
      const t0 = Math.max(0, baseIdx);
      const t1 = Math.min(15, baseIdx + 2);
      const t2 = Math.min(15, baseIdx + 4);
      const t3 = Math.min(15, baseIdx + 6);
      const t4 = Math.min(15, baseIdx + 7);

      // Micro pits for texture
      const pits = [];
      let ps = s.hash;
      for (let p = 0; p < 4; p++) {
        ps = (ps * 16807) % 2147483647;
        const pdx = (ps % (R * 2 - 4)) - R + 2;
        ps = (ps * 16807) % 2147483647;
        const pdy = (ps % (R * 2 - 4)) - R + 2;
        if (pdx * pdx + pdy * pdy < (R * 0.5) * (R * 0.5)) {
          pits.push({ dx: pdx, dy: pdy });
        }
      }
      // Micro bumps
      const bumps = [];
      for (let b = 0; b < 3; b++) {
        ps = (ps * 16807) % 2147483647;
        const bdx = (ps % (R * 2 - 4)) - R + 2;
        ps = (ps * 16807) % 2147483647;
        const bdy = (ps % (R * 2 - 4)) - R + 2;
        if (bdx * bdx + bdy * bdy < (R * 0.45) * (R * 0.45)) {
          bumps.push({ dx: bdx, dy: bdy });
        }
      }

      for (let dy = -R - 1; dy <= R + 2; dy++) {
        for (let dx = -R - 1; dx <= R + 1; dx++) {
          const px = s.x + dx, py = s.y + dy;
          if (px < 0 || px >= W || py < 0 || py >= H) continue;

          const pidx = py * W + px;
          if (!insideSphere[pidx]) continue;

          // Shield shape (tapered bottom)
          const normDy = dy / R;
          const taper = normDy > 0 ? 1.0 - normDy * 0.35 : 1.0;
          const effRx = R * taper;
          const effRy = R * 1.05;
          const distSq = (dx * dx) / (effRx * effRx + 0.01) + (dy * dy) / (effRy * effRy + 0.01);
          if (distSq > 1.0) continue;

          const edgeDist = 1.0 - Math.sqrt(distSq);

          // Per-scale dome NdotL
          const snx = dx / (effRx + 0.5);
          const sny = dy / (effRy + 0.5);
          const snz = Math.sqrt(Math.max(0.01, 1 - Math.min(1, snx * snx + sny * sny)));
          let NdotL = snx * lx + sny * ly + snz * lz;
          let localV = Math.max(0, NdotL);
          localV = Math.pow(localV, 0.65); // gamma for even distribution

          // ZONE-BASED: 5 discrete tonal zones
          let toneI;
          if (localV < 0.18) toneI = t0;       // deep shadow
          else if (localV < 0.35) toneI = t1;   // shadow
          else if (localV < 0.55) toneI = t2;   // mid
          else if (localV < 0.78) toneI = t3;   // highlight
          else toneI = t4;                        // bright peak

          // Micro pits: darker
          for (const pit of pits) {
            const pdx2 = dx - pit.dx, pdy2 = dy - pit.dy;
            if (pdx2 * pdx2 + pdy2 * pdy2 < 4) {
              toneI = Math.max(t0, toneI - 2);
              break;
            }
          }

          // Micro bumps: brighter
          for (const bump of bumps) {
            const bdx2 = dx - bump.dx, bdy2 = dy - bump.dy;
            if (bdx2 * bdx2 + bdy2 * bdy2 < 3) {
              toneI = Math.min(t4, toneI + 1);
              break;
            }
          }

          // Edge crevice
          if (edgeDist < 0.08) {
            toneI = Math.max(0, t0 - 2);
          }

          pixBuf[pidx] = toneIdx(toneI);
          ownerBuf[pidx] = si;
        }
      }
    }

    // Pass 2: Boundary detection
    const isBound = new Uint8Array(W * H);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const idx = y * W + x;
        if (ownerBuf[idx] < 0) continue;
        for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const ni = (y + oy) * W + (x + ox);
          if (ni >= 0 && ni < W * H && ownerBuf[ni] !== ownerBuf[idx]) {
            isBound[idx] = 1;
            break;
          }
        }
      }
    }

    // Make boundary pixels near-black (crevices)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (isBound[y * W + x]) pixBuf[y * W + x] = DARKEST;

    // Pass 3: Ridge detection — bright ridge 1-2px inside boundary
    for (let y = 2; y < H - 2; y++) {
      for (let x = 2; x < W - 2; x++) {
        const idx = y * W + x;
        if (ownerBuf[idx] < 0 || isBound[idx]) continue;

        let nearBound = false;
        for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
          const ni = (y + oy) * W + (x + ox);
          if (ni >= 0 && ni < W * H && isBound[ni]) { nearBound = true; break; }
        }
        if (!nearBound) continue;

        const si = ownerBuf[idx];
        const s = scales[si];
        const ridgeBase = Math.round(s.gb * 9);
        const ridgeTone = Math.min(15, ridgeBase + 8);
        pixBuf[idx] = toneIdx(ridgeTone);
      }
    }

    // Write buffer to canvas
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (pixBuf[y * W + x] >= 0)
          pc.setPixel(x, y, pixBuf[y * W + x]);

    // Pass 4: Specular — on mid-brightness scales for max contrast
    for (const s of scales) {
      if (s.x < 6 || s.x > W - 6 || s.y < 6 || s.y > H - 6) continue;
      const gb = s.gb;

      // Mid-brightness scales: big L-shaped specular with halo
      if (gb >= 0.30 && gb <= 0.55) {
        const sx = s.x - Math.round(s.r * 0.2);
        const sy = s.y - Math.round(s.r * 0.3);
        const core = [[0,0],[1,0],[2,0],[0,1],[0,2]];
        for (const [ox, oy] of core) {
          const px = sx + ox, py = sy + oy;
          if (px >= 0 && px < W && py >= 0 && py < H && insideSphere[py * W + px])
            pc.setPixel(px, py, BRIGHTEST);
        }
        const halo = [[-1,-1],[0,-1],[1,-1],[2,-1],[3,0],[-1,0],[-1,1],[-1,2],[1,1],[3,1],[0,3],[1,2]];
        for (const [ox, oy] of halo) {
          const px = sx + ox, py = sy + oy;
          if (px >= 0 && px < W && py >= 0 && py < H && insideSphere[py * W + px])
            pc.setPixel(px, py, SECOND);
        }
      }
      // Bright scales: small 2px dots
      else if (gb >= 0.60) {
        const sx = s.x - Math.round(s.r * 0.25);
        const sy = s.y - Math.round(s.r * 0.35);
        if (sx >= 0 && sx < W && sy >= 0 && sy < H && insideSphere[sy * W + sx])
          pc.setPixel(sx, sy, BRIGHTEST);
        if (sx + 1 < W && insideSphere[sy * W + sx + 1])
          pc.setPixel(sx + 1, sy, BRIGHTEST);
      }
    }

    // Sphere edge: darken pixels near the sphere boundary for curvature read
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        if (!insideSphere[idx]) continue;
        const dx = x - scx, dy = y - scy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const edgeDist = (sR - d) / sR;
        if (edgeDist < 0.06) {
          pc.setPixel(x, y, DARKEST);
        }
      }
    }
  },
};
