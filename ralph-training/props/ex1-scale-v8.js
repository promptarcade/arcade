// Exercise 1: Single dragon scale — iteration 8, attempt 37 (FINAL)
// BOLD CHANGE: every dome uses FULL 16-tone palette internally
// Global modulation ONLY on ridge brightness — communicates overall dome shape
// This ensures each cell has near-black shadow AND near-white highlight
// Minimum dome radius 6px for enough pixels to show the full gradient

module.exports = {
  width: 128, height: 128, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cool: '#2a6b2a',   // L≈22%
    warm: '#88d488',   // L≈74%
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.cool.startIdx); },
  drawPost(pc, pal) {
    const cg = pal.groups.cool, wg = pal.groups.warm;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    function tone16(v) {
      v = Math.max(0, Math.min(1, v));
      if (v < 0.5) return tone(cg, v * 2);
      return tone(wg, (v - 0.5) * 2);
    }
    pc.pixels[0] = 0;

    const W = 128, H = 128;
    const lx = -0.5, ly = -0.6, lz = 0.624;
    const lLen2D = Math.sqrt(lx * lx + ly * ly);
    const lx2d = lx / lLen2D, ly2d = ly / lLen2D;

    function hash(a, b) {
      let h = (a * 2654435761 ^ b * 2246822519) & 0x7fffffff;
      h = ((h >> 16) ^ h) * 0x45d9f3b;
      return ((h >> 16) ^ h & 0x7fffffff) / 0x7fffffff;
    }

    const cx = 64, cy = 60, scaleW = 48, scaleH = 54;
    function insideScale(x, y) {
      const dx = x - cx, dy = y - cy;
      const t = (dy + scaleH * 0.45) / scaleH;
      if (t < 0 || t > 1) return false;
      let halfW;
      if (t < 0.15) halfW = scaleW * 0.5 * (0.85 + t * 1.0);
      else if (t < 0.55) halfW = scaleW * 0.5;
      else { const tt = (t - 0.55) / 0.45; halfW = scaleW * 0.5 * (1 - tt * tt); }
      return Math.abs(dx) <= halfW;
    }

    // Voronoi domes — MINIMUM r=6 for more pixels per dome
    const domes = [];
    const rng = sf2_seededRNG(42);
    for (let row = 0; row < 14; row++) {
      for (let col = 0; col < 14; col++) {
        const baseR = 6 + Math.floor(rng() * 4); // r=6 to r=9
        const spacing = baseR * 1.55;
        const ox = (row % 2) * spacing * 0.5;
        const bx = 10 + col * spacing + ox + (rng() - 0.5) * spacing * 0.2;
        const by = 10 + row * spacing + (rng() - 0.5) * spacing * 0.2;
        if (bx >= 0 && bx < W && by >= 0 && by < H && insideScale(Math.round(bx), Math.round(by))) {
          domes.push({ x: bx, y: by, r: baseR });
        }
      }
    }
    // Fill remaining gaps
    for (let i = 0; i < 50; i++) {
      const bx = 20 + rng() * 88, by = 12 + rng() * 96;
      if (insideScale(Math.round(bx), Math.round(by))) {
        let tooClose = false;
        for (const d of domes) {
          if (Math.sqrt((bx - d.x) ** 2 + (by - d.y) ** 2) < 7) { tooClose = true; break; }
        }
        if (!tooClose) domes.push({ x: bx, y: by, r: 5 + Math.floor(rng() * 4) });
      }
    }

    const DARKEST = cg.startIdx;
    const BRIGHTEST = wg.startIdx + wg.toneCount - 1;

    // Global brightness (ONLY for ridge modulation)
    function globalFactor(x, y) {
      const gdx = (x - cx) / (scaleW * 0.5);
      const gdy = (y - cy) / (scaleH * 0.5);
      const gnx = gdx * 0.6, gny = gdy * 0.6;
      const gnz = Math.sqrt(Math.max(0.1, 1 - gnx * gnx - gny * gny));
      return Math.max(0, gnx * lx + gny * ly + gnz * lz);
    }

    // === MAIN RENDERING PASS ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!insideScale(x, y)) continue;

        let best1 = Infinity, best2 = Infinity, nearestIdx = 0;
        for (let i = 0; i < domes.length; i++) {
          const dist = Math.sqrt((x - domes[i].x) ** 2 + (y - domes[i].y) ** 2);
          if (dist < best1) { best2 = best1; best1 = dist; nearestIdx = i; }
          else if (dist < best2) { best2 = dist; }
        }

        const nearest = domes[nearestIdx];
        const edgeRatio = (best2 - best1) / (nearest.r * 1.5 + 1);

        // CREVICE: always DARKEST
        if (edgeRatio < 0.09) {
          pc.setPixel(x, y, DARKEST);
          continue;
        }

        // RIDGE: locally brightest — brightness varies by global position
        // Shadow-zone ridge: v=0.55, Highlight-zone ridge: v=0.95
        if (edgeRatio < 0.19) {
          const gf = globalFactor(x, y);
          const ridgeV = 0.55 + gf * 0.40;
          pc.setPixel(x, y, tone16(ridgeV));
          continue;
        }

        // DOME INTERIOR: FULL 16-tone range per dome
        // Use sphere normals for proper dome lighting
        const dx = x - nearest.x, dy = y - nearest.y;
        const r = nearest.r;
        const snx = dx / (r + 0.5), sny = dy / (r + 0.5);
        const snz = Math.sqrt(Math.max(0, 1 - snx * snx - sny * sny));
        const NdotL = snx * lx + sny * ly + snz * lz;
        let diffuse = Math.max(0, NdotL);

        // Bounce light to fill shadow side slightly
        const bounce = Math.max(0, sny * 0.3) * 0.15;

        // Full-range value: ambient + diffuse spans 0.03 to ~0.85
        let v = 0.03 + diffuse * 0.80 + bounce;

        // Gamma 0.65 for even distribution
        v = Math.pow(Math.max(0.001, v), 0.65);

        // Micro-roughness
        const rough = (hash(x * 3 + 17, y * 5 + 31) - 0.5) * 0.06;
        v = Math.max(0.02, Math.min(0.92, v + rough));

        // Cap interior BELOW ridge brightness
        // (ridges are always the locally brightest element)
        v = Math.min(v, 0.82);

        pc.setPixel(x, y, tone16(v));
      }
    }

    // === SPECULAR PASS: 3 large clusters on mid-tone domes ===
    const specCandidates = [];
    for (let i = 0; i < domes.length; i++) {
      const d = domes[i];
      if (d.r < 6) continue;
      const gf = globalFactor(d.x, d.y);
      if (gf > 0.20 && gf < 0.50) {
        specCandidates.push({ dome: d, gf });
      }
    }
    specCandidates.sort((a, b) => b.gf - a.gf);
    const specCount = Math.min(3, specCandidates.length);
    for (let si = 0; si < specCount; si++) {
      const d = specCandidates[si].dome;
      // Center of specular: dome's upper-left (light-facing) area
      const spx = Math.round(d.x + lx2d * d.r * 0.35);
      const spy = Math.round(d.y + ly2d * d.r * 0.35);

      // Core: 4-5px brightest
      const coreOffsets = [
        [0,0], [1,0], [-1,0], [0,-1], [0,1]
      ];
      for (const [ox, oy] of coreOffsets) {
        const px = spx + ox, py = spy + oy;
        if (px >= 2 && px < W - 2 && py >= 2 && py < H - 2 && insideScale(px, py)) {
          pc.setPixel(px, py, BRIGHTEST);
        }
      }
      // Halo: 8 surrounding pixels with second-brightest (asymmetric — skip some)
      const haloOffsets = [
        [-1,-1], [1,-1], [2,0], [1,1], [-1,1], [-2,0], [0,-2]
      ];
      const SECOND = wg.startIdx + wg.toneCount - 2;
      for (let hi = 0; hi < haloOffsets.length; hi++) {
        if ((si + hi) % 3 === 0) continue; // skip some for asymmetry
        const [ox, oy] = haloOffsets[hi];
        const px = spx + ox, py = spy + oy;
        if (px >= 2 && px < W - 2 && py >= 2 && py < H - 2 && insideScale(px, py)) {
          pc.setPixel(px, py, SECOND);
        }
      }
    }

    // === OUTLINE: dark border at scale silhouette ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!insideScale(x, y)) continue;
        for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          if (!insideScale(x + ox, y + oy)) { pc.setPixel(x, y, DARKEST); break; }
        }
      }
    }
  },
};
