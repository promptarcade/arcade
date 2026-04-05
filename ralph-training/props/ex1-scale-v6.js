// Exercise 1, Iteration 6 attempt 5: Single dragon scale
// Voronoi tessellation (proven for texture + coverage)
// FIX: darker palette base, hardcoded extremes at ALL boundaries,
// multiple visible specular clusters, per-dome tonal extremes

module.exports = {
  width: 128, height: 128, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    warm: '#88d888',  // L≈70% — bright group
    cool: '#164218',  // L≈18% — dark group (darker for deeper shadows)
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.warm.startIdx); },
  drawPost(pc, pal) {
    const wg = pal.groups.warm, cg = pal.groups.cool;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const W = 128, H = 128;
    const cx = 64, cy = 55;
    const top = 6, bot = 120;
    const scaleH = bot - top;

    const lx = -0.5, ly = -0.6, lz = 0.63;

    // HARDCODED palette extremes — literal darkest and brightest indices
    const DARKEST = cg.startIdx; // absolute darkest tone
    const BRIGHTEST = wg.startIdx + wg.toneCount - 1; // absolute brightest

    // Shield silhouette
    function halfW(t) {
      if (t < 0 || t > 1) return 0;
      if (t < 0.04) return 40 * Math.sqrt(t / 0.04);
      if (t < 0.4) return 40 + t * 15;
      if (t < 0.5) return 46;
      const f = (t - 0.5) / 0.5;
      return Math.max(0, 46 * (1 - f * f));
    }

    function isInside(x, y) {
      const t = (y - top) / scaleH;
      const hw = halfW(t);
      return hw > 0 && Math.abs(x - cx) <= hw;
    }

    function hash(a, b) {
      let h = (a * 374761393 + b * 668265263 + 1274126177) | 0;
      h = ((h ^ (h >> 13)) * 1274126177) | 0;
      return ((h & 0x7fffffff) / 0x7fffffff);
    }

    // Dome centers
    const domes = [];
    const spacing = 9;
    for (let row = -2; row < 18; row++) {
      for (let col = -2; col < 16; col++) {
        const bx = cx - 55 + col * spacing + (row % 2) * (spacing * 0.48);
        const by = top - 5 + row * (spacing * 0.86);
        const jx = bx + (hash(col * 7 + 31, row * 13 + 47) - 0.5) * spacing * 0.45;
        const jy = by + (hash(col * 11 + 53, row * 7 + 29) - 0.5) * spacing * 0.4;
        const r = 5.5 + hash(col * 3 + 7, row * 5 + 11) * 1.5;
        domes.push({ x: jx, y: jy, r: r });
      }
    }

    // Global lighting
    function globalLight(x, y) {
      const t = (y - top) / scaleH;
      const hw = halfW(t);
      if (hw <= 0) return 0.3;
      const nxr = (x - cx) / (hw + 1);
      const nyr = (t - 0.3) * 1.2;
      const gnz = Math.sqrt(Math.max(0.05, 1 - nxr * nxr * 0.6 - nyr * nyr * 0.2));
      return Math.max(0, nxr * lx + nyr * ly * 0.3 + gnz * lz);
    }

    // For each pixel: Voronoi assignment + sphere lighting
    for (let y = top; y <= bot; y++) {
      for (let x = 0; x < W; x++) {
        if (!isInside(x, y)) continue;

        // Find 2 nearest domes
        let best1 = Infinity, best2 = Infinity;
        let d1 = null;
        for (const d of domes) {
          const ddx = x - d.x, ddy = y - d.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy) / d.r;
          if (dist < best1) {
            best2 = best1;
            best1 = dist;
            d1 = d;
          } else if (dist < best2) {
            best2 = dist;
          }
        }
        if (!d1) continue;

        const boundary = best2 - best1;

        // CREVICE: at Voronoi boundary — use ABSOLUTE DARKEST
        if (boundary < 0.13) {
          pc.setPixel(x, y, DARKEST);
          continue;
        }

        // RIDGE: just inside crevice — use ABSOLUTE BRIGHTEST
        if (boundary < 0.28) {
          pc.setPixel(x, y, BRIGHTEST);
          continue;
        }

        // DOME INTERIOR: per-pixel sphere lighting
        const ddx = x - d1.x, ddy = y - d1.y;
        const snx = ddx / d1.r, sny = ddy / d1.r;
        const snz = Math.sqrt(Math.max(0.01, 1 - snx * snx - sny * sny));

        const NdotL = snx * lx + sny * ly + snz * lz;
        const diffuse = Math.max(0, NdotL);
        const spec = Math.pow(Math.max(0, 2 * NdotL * snz - lz), 40) * 0.15;

        // Compute local brightness
        let v = 0.01 + diffuse * 0.78 + spec;

        // Gentle S-curve (less aggressive to spread tones)
        v = v * v * (3 - 2 * v) * 0.85 + v * 0.15;

        // Global modulation: multiplicative (preserves per-dome range)
        const gl = globalLight(x, y);
        const globalMod = 0.25 + gl * 0.75; // 0.25 in shadow, 1.0 in highlight
        v *= globalMod;

        v = Math.max(0, Math.min(1, v));

        // Map to palette — dual group
        if (v > 0.38) {
          pc.setPixel(x, y, tone(wg, v));
        } else {
          pc.setPixel(x, y, tone(cg, Math.max(0.02, v * 1.6)));
        }
      }
    }

    // Growth ring grooves: EXTREME dark-bright pairs
    const grooveTs = [0.18, 0.34, 0.50, 0.66, 0.82];
    for (const gt of grooveTs) {
      for (let x = cx - 46; x <= cx + 46; x++) {
        const nxr = (x - cx) / 46;
        const curved_t = gt + nxr * nxr * 0.025;
        const gy = Math.round(top + curved_t * scaleH);
        if (!isInside(x, gy)) continue;

        // 1px DARKEST crevice
        pc.setPixel(x, gy, DARKEST);
        // 1px BRIGHTEST ridge above
        if (gy - 1 >= 0 && isInside(x, gy - 1)) {
          pc.setPixel(x, gy - 1, BRIGHTEST);
        }
      }
    }

    // Border: DARKEST outline (2px) + BRIGHTEST inner ridge
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / scaleH;
      const hw = Math.round(halfW(t));
      if (hw <= 0) continue;
      for (let d = 0; d < 2; d++) {
        const lp = cx - hw + d, rp = cx + hw - d;
        if (lp >= 0 && lp < W) pc.setPixel(lp, y, DARKEST);
        if (rp >= 0 && rp < W) pc.setPixel(rp, y, DARKEST);
      }
      // Bright ridge 1px inside
      const lp3 = cx - hw + 3, rp3 = cx + hw - 3;
      if (lp3 >= 0 && lp3 < W && isInside(lp3, y)) pc.setPixel(lp3, y, BRIGHTEST);
      if (rp3 >= 0 && rp3 < W && isInside(rp3, y)) pc.setPixel(rp3, y, BRIGHTEST);
    }

    // Top edge: BRIGHTEST ridge (3px)
    for (let x = cx - 38; x <= cx + 38; x++) {
      if (isInside(x, top + 2)) pc.setPixel(x, top + 2, BRIGHTEST);
      if (isInside(x, top + 3)) pc.setPixel(x, top + 3, tone(wg, 0.85));
    }

    // Bottom: DARKEST converge
    for (let dy = 0; dy < 5; dy++) {
      const py = bot - dy;
      const bw = Math.round(dy * 1.2);
      for (let dx = -bw; dx <= bw; dx++) {
        if (cx + dx >= 0 && cx + dx < W && py >= 0 && py < H) {
          pc.setPixel(cx + dx, py, DARKEST);
        }
      }
    }

    // SPECULAR: 5 clusters across the scale on darker dome faces
    const specPositions = [
      { x: cx + 18, y: cy + 22 },   // lower-right (shadow)
      { x: cx - 8, y: cy + 30 },    // lower-left
      { x: cx + 5, y: cy + 10 },    // center
      { x: cx - 20, y: cy - 5 },    // upper-left
      { x: cx + 25, y: cy + 5 },    // right
    ];
    for (const sp of specPositions) {
      if (!isInside(sp.x, sp.y)) continue;
      // 2-3px L-shape cluster
      const shapes = [[[0,0],[1,0],[0,1]], [[0,0],[1,0],[-1,0]], [[0,0],[0,1],[1,1]]];
      const shapeIdx = Math.floor(hash(sp.x, sp.y) * shapes.length);
      for (const [sdx, sdy] of shapes[shapeIdx]) {
        const sx = sp.x + sdx, sy = sp.y + sdy;
        if (sx >= 0 && sx < W && sy >= 0 && sy < H && isInside(sx, sy)) {
          pc.setPixel(sx, sy, BRIGHTEST);
        }
      }
    }
  },
};
