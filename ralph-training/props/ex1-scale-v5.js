// Exercise 1, Iteration 5, Attempt 5: Single dragon scale at 128x128
// HYBRID: dome gradient + varied organic texture features
// Much darker cool base for true near-black crevices
// Features VARY in size (3-7px), density, and shape
// Groove pairs with absolute extreme contrast
// Larger specular cluster (6px irregular)

module.exports = {
  width: 128, height: 128, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cool: '#082808',   // L≈10% — deepShadow at ~4.5%, truly near-black
    warm: '#a0efa0',   // L≈78% — highlight at ~100%, near-white
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.cool.startIdx); },
  drawPost(pc, pal) {
    const cg = pal.groups.cool, wg = pal.groups.warm;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    function tone16(v) {
      v = Math.max(0, Math.min(1, v));
      if (v < 0.45) return tone(cg, v / 0.45);
      return tone(wg, (v - 0.45) / 0.55);
    }
    pc.pixels[0] = 0;

    const DARKEST = cg.startIdx;
    const BRIGHTEST = wg.startIdx + wg.toneCount - 1;
    const BRIGHT_HI = wg.startIdx + wg.toneCount - 2;

    const W = 128, H = 128;
    const cx = 64, cy = 58;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    const scaleTop = 10, scaleBot = 118;
    const scaleH = scaleBot - scaleTop;
    const maxHW = 50;

    function shieldHalfWidth(t) {
      if (t < 0.05) return maxHW * 0.85 + (maxHW * 0.15) * (t / 0.05);
      if (t < 0.25) return maxHW;
      const taper = (t - 0.25) / 0.75;
      return maxHW * (1 - taper * taper);
    }

    // Inside mask
    const inside = new Uint8Array(W * H);
    for (let y = scaleTop; y <= scaleBot; y++) {
      const t = (y - scaleTop) / scaleH;
      const hw = shieldHalfWidth(t);
      if (hw < 1) continue;
      for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) {
        if (x >= 0 && x < W) inside[y * W + x] = 1;
      }
    }

    // --- Dome lighting (base form) ---
    const brightness = new Float32Array(W * H);
    for (let y = scaleTop; y <= scaleBot; y++) {
      const t = (y - scaleTop) / scaleH;
      const hw = shieldHalfWidth(t);
      if (hw < 1) continue;
      for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) {
        if (x < 0 || x >= W || !inside[y * W + x]) continue;
        const dx = x - cx, dy = y - cy;
        const nx = dx / (hw + 1);
        const ny = dy / (scaleH * 0.5 + 1);
        const nSq = nx * nx + ny * ny;
        const nz = nSq < 1 ? Math.sqrt(1 - nSq) : 0.05;
        const NdotL = nx * lx + ny * ly + nz * lz;
        let v = 0.005 + Math.max(0, NdotL) * 0.92;
        // S-curve
        v = v * v * (3 - 2 * v);
        brightness[y * W + x] = v;
      }
    }

    // --- Grooves: mark positions ---
    const groovePositions = [0.18, 0.33, 0.48, 0.63, 0.78];
    function grooveYAt(gi, x) {
      const dx = (x - cx) / maxHW;
      return Math.round(scaleTop + scaleH * groovePositions[gi] + dx * dx * 8);
    }
    const isGroove = new Uint8Array(W * H);
    const isRidge = new Uint8Array(W * H);
    for (let gi = 0; gi < groovePositions.length; gi++) {
      for (let x = 0; x < W; x++) {
        const gy = grooveYAt(gi, x);
        if (gy < scaleTop + 2 || gy >= scaleBot - 4) continue;
        // 2px crevice
        if (inside[gy * W + x]) isGroove[gy * W + x] = 1;
        if (gy + 1 < H && inside[(gy + 1) * W + x]) isGroove[(gy + 1) * W + x] = 1;
        // 1px ridge above
        if (gy - 1 >= 0 && inside[(gy - 1) * W + x]) isRidge[(gy - 1) * W + x] = 1;
      }
    }

    // --- Varied texture features ---
    // Mix of sizes: small (r=2), medium (r=3-4), large (r=5-6)
    // Placement: organic, not grid — random with collision avoidance
    const rng = sf2_seededRNG(42);
    const features = [];
    for (let attempt = 0; attempt < 600; attempt++) {
      const fx = Math.round(cx - maxHW * 0.9 + rng() * maxHW * 1.8);
      const fy = Math.round(scaleTop + 4 + rng() * (scaleH - 8));
      if (fx < 4 || fx >= W - 4 || fy < 4 || fy >= H - 4) continue;
      if (!inside[fy * W + fx]) continue;
      // Skip groove zones
      if (isGroove[fy * W + fx] || isRidge[fy * W + fx]) continue;

      // Vary size based on position: larger in center, smaller at edges
      const distFromCenter = Math.sqrt((fx - cx) * (fx - cx) + (fy - cy) * (fy - cy)) / (maxHW * 0.8);
      const baseR = distFromCenter < 0.5 ? 3 + Math.round(rng() * 3) : 2 + Math.round(rng() * 1);

      // Collision check with varied minimum spacing
      let tooClose = false;
      for (const f of features) {
        const minDist = (f.r + baseR) * 0.8;
        if (Math.abs(f.x - fx) < minDist && Math.abs(f.y - fy) < minDist) {
          tooClose = true; break;
        }
      }
      if (tooClose) continue;

      features.push({ x: fx, y: fy, r: baseR });
      if (features.length >= 80) break;
    }

    // --- Render base: start with dark crevice everywhere ---
    const pixelPalette = new Int16Array(W * H).fill(-1);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (inside[y * W + x]) {
          // Base: dome gradient mapped to palette but shifted DARK
          // Most of the surface starts as the crevice between features
          const v = brightness[y * W + x] * 0.3; // very dark base
          pixelPalette[y * W + x] = tone16(v);
        }
      }
    }

    // --- Draw each texture feature as a convex dome ---
    features.sort((a, b) => a.y - b.y); // painter's order
    for (const feat of features) {
      for (let dy = -feat.r; dy <= feat.r; dy++) {
        for (let dx = -feat.r; dx <= feat.r; dx++) {
          if (dx * dx + dy * dy > feat.r * feat.r + 1) continue;
          const px = feat.x + dx, py = feat.y + dy;
          if (px < 0 || px >= W || py < 0 || py >= H) continue;
          if (!inside[py * W + px]) continue;
          if (isGroove[py * W + px] || isRidge[py * W + px]) continue;

          // Per-feature dome normal
          const lnx = dx / (feat.r + 0.5);
          const lny = dy / (feat.r + 0.5);
          const lnz = Math.sqrt(Math.max(0, 1 - lnx * lnx - lny * lny));
          const localNdotL = lnx * lx + lny * ly + lnz * lz;
          const localDiffuse = Math.max(0, localNdotL);

          // Global brightness at this position
          const gv = brightness[py * W + px];

          // Blend: feature has its own lighting modulated by global position
          // Feature gets FULL local range, scaled by global position
          // In bright zone: feature spans 0.3..1.0
          // In dark zone: feature spans 0.0..0.5
          const featureBase = gv * 0.3;
          const featureRange = 0.3 + gv * 0.5;
          let v = featureBase + localDiffuse * featureRange;

          // S-curve for per-feature contrast
          v = v * v * (3 - 2 * v);

          pixelPalette[py * W + px] = tone16(v);
        }
      }
    }

    // --- Groove pairs: hardcoded extremes ---
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (isGroove[y * W + x]) {
          pixelPalette[y * W + x] = DARKEST;
        }
        if (isRidge[y * W + x]) {
          // Ridge brightness relative to zone
          const gv = brightness[y * W + x];
          const ridgeV = Math.min(1, gv + 0.4);
          // In bright zones: near-white. In shadow: still notably bright
          pixelPalette[y * W + x] = tone16(Math.max(0.6, ridgeV));
        }
      }
    }

    // --- Silhouette edge ---
    for (let y = scaleTop; y <= scaleBot; y++) {
      for (let x = 0; x < W; x++) {
        if (!inside[y * W + x]) continue;
        const isEdge = (
          (x > 0 && !inside[y * W + (x - 1)]) ||
          (x < W - 1 && !inside[y * W + (x + 1)]) ||
          (y > 0 && !inside[(y - 1) * W + x]) ||
          (y < H - 1 && !inside[(y + 1) * W + x])
        );
        if (isEdge) pixelPalette[y * W + x] = DARKEST;
      }
    }

    // --- Specular: 6-pixel irregular cluster on dark side of dome ---
    // Place on right edge where dome curves away from light (naturally dark)
    const specX = cx + 25, specY = cy - 5;
    // Irregular cluster: not perfectly symmetric
    const specPixels = [
      [specX, specY], [specX + 1, specY], [specX + 2, specY],
      [specX, specY + 1], [specX + 2, specY + 1],
      [specX + 1, specY + 2],
    ];
    for (const [sx, sy] of specPixels) {
      if (sx >= 0 && sx < W && sy >= 0 && sy < H && inside[sy * W + sx]) {
        pixelPalette[sy * W + sx] = BRIGHTEST;
      }
    }

    // --- Final render ---
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (pixelPalette[y * W + x] >= 0) {
          pc.setPixel(x, y, pixelPalette[y * W + x]);
        }
      }
    }
  },
};
