// Exercise 1: Single dragon scale — Iteration 4, attempt 5 (FINAL)
// COMPLETE RETHINK. Previous attempts had good palette range but too-subtle rendering.
// Changes:
// 1. Surface covered with 4-5px VISIBLE micro-domes (not 2px dot pairs)
// 2. Grooves are 2px wide crevices with 2px ridges — WIDE enough to read
// 3. Base dome MUCH darker — almost all in shadow, tight bright lobe
// 4. Specular: 4-5px cluster on genuinely black background
// 5. Treat every surface region as part of a visible sub-form

module.exports = {
  width: 64,
  height: 64,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cool: '#206f20',       // L=28% → ramp L=12.6%–36.4%
    warm: '#90df90',       // L=72% → ramp L=32.4%–93.6%
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.cool.startIdx); },

  drawPost(pc, pal) {
    const cg = pal.groups.cool;
    const wg = pal.groups.warm;

    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }

    const DARK = cg.startIdx;
    const BRIGHT = wg.startIdx + wg.toneCount - 1;

    function mapV(v) {
      v = Math.max(0, Math.min(1, v));
      if (v < 0.40) return tone(cg, v / 0.40);
      return tone(wg, (v - 0.40) / 0.60);
    }

    pc.pixels[0] = 0;
    const W = 64, H = 64;
    const cx = 32, cy = 27;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const scaleTop = 6, scaleBot = 56, scaleH = 50, maxHW = 27;

    function scaleHW(y) {
      if (y < scaleTop || y > scaleBot) return 0;
      const t = (y - scaleTop) / scaleH;
      if (t < 0.06) return Math.round(maxHW * (0.55 + (t / 0.06) * 0.35));
      if (t < 0.20) {
        const s = (t - 0.06) / 0.14;
        return Math.round(maxHW * (0.90 + s * s * (3 - 2 * s) * 0.10));
      }
      if (t < 0.48) return maxHW;
      const s = (t - 0.48) / 0.52;
      return Math.max(0, Math.round(maxHW * Math.cos(s * Math.PI * 0.5)));
    }

    function hash(a, b) { return (((a * 12289 + b * 7919 + 31) & 0xFFFF) / 65536); }

    // ===== PHASE 1: Fill entire scale with DARK base =====
    // Start very dark — the scale begins in shadow, bright areas are ADDED
    for (let y = scaleTop; y <= scaleBot; y++) {
      const hw = scaleHW(y);
      if (hw <= 0) continue;
      for (let dx = -hw; dx <= hw; dx++) {
        const x = cx + dx;
        if (x >= 0 && x < W) pc.setPixel(x, y, mapV(0.03));
      }
    }

    // ===== PHASE 2: Dome lighting — add light to lit areas =====
    const vMap = new Float32Array(W * H);

    for (let y = scaleTop; y <= scaleBot; y++) {
      const hw = scaleHW(y);
      if (hw <= 0) continue;
      const t = (y - scaleTop) / scaleH;

      for (let dx = -hw; dx <= hw; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= W) continue;

        const xNorm = dx / (hw + 0.5);
        const rawNy = (t - 0.18) * 1.5;
        const rawNx = xNorm;
        const nSq = rawNx * rawNx + rawNy * rawNy;
        const rawNz = nSq >= 0.98 ? 0.1 : Math.sqrt(1 - nSq);

        const NdotL = rawNx * lx + rawNy * ly + rawNz * lz;
        const diffuse = Math.max(0, NdotL);

        let v = 0.003 + diffuse * 0.97;
        v = v * v * (3 - 2 * v); // S-curve

        vMap[y * W + x] = v;
        pc.setPixel(x, y, mapV(v));
      }
    }

    // ===== PHASE 3: Micro-domes covering the surface =====
    // These are 4-5px convex bumps, each a tiny lit dome
    // Each bump has: bright upper-left face, dark lower-right face
    // Enough of them to cover ~40% of the surface
    const bumps = [];
    for (let by = 0; by < 14; by++) {
      for (let bx = 0; bx < 14; bx++) {
        const h = hash(bx + 71, by + 71);
        if (h > 0.40) continue;

        const fx = Math.round(cx - 22 + bx * 3.4 + (hash(bx + 31, by + 31) - 0.5) * 4);
        const fy = Math.round(scaleTop + 4 + by * 3.6 + (hash(bx + 67, by + 67) - 0.5) * 4);
        const hw = scaleHW(fy);
        if (hw <= 0 || Math.abs(fx - cx) >= hw - 5) continue;
        if (fy < scaleTop + 4 || fy > scaleBot - 4) continue;

        const bumpR = 2; // 5x5 pixel bump
        const baseV = vMap[fy * W + fx] || 0.2;

        // Draw a tiny dome with its own lighting
        for (let bdy = -bumpR; bdy <= bumpR; bdy++) {
          for (let bdx = -bumpR; bdx <= bumpR; bdx++) {
            if (bdx * bdx + bdy * bdy > bumpR * bumpR + 1) continue;
            const px = fx + bdx, py = fy + bdy;
            if (px < 0 || px >= W || py < 0 || py >= H) continue;
            const bhw = scaleHW(py);
            if (bhw <= 0 || Math.abs(px - cx) >= bhw - 2) continue;

            // Micro-dome normal
            const bnx = bdx / (bumpR + 0.5);
            const bny = bdy / (bumpR + 0.5);
            const bnsq = bnx * bnx + bny * bny;
            if (bnsq >= 0.99) continue;
            const bnz = Math.sqrt(1 - bnsq);

            const bNdotL = bnx * lx + bny * ly + bnz * lz;
            const bDiffuse = Math.max(0, bNdotL);

            // Blend: 50% global dome position + 50% local bump lighting
            let bv = baseV * 0.5 + bDiffuse * 0.5;
            bv = bv * bv * (3 - 2 * bv);

            // Only draw if DIFFERENT from base — creates visible texture
            if (Math.abs(bv - baseV) > 0.08) {
              pc.setPixel(px, py, mapV(bv));
              vMap[py * W + px] = bv;
            }
          }
        }
      }
    }

    // ===== PHASE 4: Grooves — 2px wide crevices + 2px wide ridges =====
    const grooves = [
      { t: 0.10, span: 23, bow: 4.0 },
      { t: 0.24, span: 20, bow: 3.2 },
      { t: 0.40, span: 16, bow: 2.2 },
      { t: 0.54, span: 12, bow: 1.6 },
      { t: 0.70, span: 7,  bow: 0.8 },
    ];

    for (const g of grooves) {
      const baseY = scaleTop + Math.round(g.t * scaleH);
      for (let dx = -g.span; dx <= g.span; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= W) continue;

        // Skip some for organic irregularity
        if (hash(dx + 500, Math.round(g.t * 1000)) < 0.10) continue;

        const normDx = dx / g.span;
        const arc = (1 - normDx * normDx) * g.bow;
        const py = Math.round(baseY - arc);
        const hw = scaleHW(py);
        if (hw <= 0 || Math.abs(dx) >= hw - 4 || py < scaleTop + 4 || py > scaleBot - 5) continue;

        // 2px CREVICE (dark pair)
        pc.setPixel(x, py, DARK);
        if (py - 1 >= scaleTop) pc.setPixel(x, py - 1, DARK + 1);

        // 2px RIDGE (bright pair immediately below crevice)
        const ry1 = py + 1, ry2 = py + 2;
        if (ry2 < scaleBot - 3) {
          const rhw1 = scaleHW(ry1);
          const rhw2 = scaleHW(ry2);
          if (rhw1 > 0 && Math.abs(dx) < rhw1 - 3) {
            // Ridge: locally bright — at least 0.70 brightness
            const localV = vMap[ry1 * W + x] || 0.2;
            pc.setPixel(x, ry1, mapV(Math.min(1.0, Math.max(0.70, localV + 0.45))));
          }
          if (rhw2 > 0 && Math.abs(dx) < rhw2 - 3) {
            const localV = vMap[ry2 * W + x] || 0.2;
            pc.setPixel(x, ry2, mapV(Math.min(1.0, Math.max(0.55, localV + 0.30))));
          }
        }
      }
    }

    // ===== PHASE 5: Edge border — dark crevice + ridge pair =====
    for (let y = scaleTop; y <= scaleBot; y++) {
      const hw = scaleHW(y);
      if (hw < 3) continue;

      // Bottom tip: all dark
      if (y >= scaleBot - 2) {
        for (let dx = -hw; dx <= hw; dx++) {
          const x = cx + dx;
          if (x >= 0 && x < W) pc.setPixel(x, y, DARK);
        }
        continue;
      }

      // Left: crevice + ridge
      if (cx - hw >= 0) pc.setPixel(cx - hw, y, DARK);
      if (cx - hw + 1 < W) {
        const localV = vMap[y * W + (cx - hw + 1)] || 0.1;
        pc.setPixel(cx - hw + 1, y, mapV(Math.min(1, localV + 0.50)));
      }

      // Right
      if (cx + hw < W) pc.setPixel(cx + hw, y, DARK);
      if (cx + hw - 1 >= 0) {
        const localV = vMap[y * W + (cx + hw - 1)] || 0.1;
        pc.setPixel(cx + hw - 1, y, mapV(Math.min(1, localV + 0.45)));
      }
    }

    // Top edge
    const thw = scaleHW(scaleTop);
    for (let dx = -thw; dx <= thw; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < W) pc.setPixel(x, scaleTop, DARK);
    }
    const rhw = scaleHW(scaleTop + 1);
    for (let dx = -rhw + 2; dx < rhw - 2; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < W) pc.setPixel(x, scaleTop + 1, mapV(0.88));
    }

    // ===== PHASE 6: Specular — on genuinely dark area =====
    // Place in shadow zone (lower-right of dome)
    const spX = cx + 4, spY = cy + 12;

    // Create VERY dark surround (black ring)
    for (let dy = -7; dy <= 7; dy++) {
      for (let ddx = -7; ddx <= 7; ddx++) {
        const d2 = ddx * ddx + dy * dy;
        if (d2 <= 6 || d2 > 49) continue;
        const sx = spX + ddx, sy = spY + dy;
        if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;
        const hw = scaleHW(sy);
        if (hw > 0 && Math.abs(sx - cx) <= hw - 2) {
          pc.setPixel(sx, sy, DARK);
        }
      }
    }

    // L-shaped cluster: 4px
    pc.setPixel(spX, spY, BRIGHT);
    pc.setPixel(spX + 1, spY, BRIGHT);
    pc.setPixel(spX, spY - 1, BRIGHT);
    pc.setPixel(spX - 1, spY, BRIGHT - 1);
  },
};
