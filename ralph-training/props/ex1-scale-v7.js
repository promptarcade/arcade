// Exercise 1, Iteration 7 attempt 5: Single dragon scale
// KEY FIXES:
// 1. Palette L=20% / L=76% — cool tones span L=9-26% (visually distinct),
//    warm tones span L=34-99%. Combined: 9-99% range, each tone distinguishable.
// 2. Specular at dome HIGHLIGHT peaks (upper-left where NdotL is max),
//    matching reference images where catchlights sit on bright scale surfaces.
// 3. Stronger ridge brightness at cell boundaries.
// 4. No global modulation, gamma 0.65 curve.

module.exports = {
  width: 128, height: 128, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    warm: '#9ce89c',  // L≈76% — warm group, tones L=34-99%
    cool: '#1a4c1a',  // L≈20% — cool group, tones L=9-26%
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.warm.startIdx); },
  drawPost(pc, pal) {
    const wg = pal.groups.warm, cg = pal.groups.cool;

    // Unified 16-tone ramp
    const ramp = [];
    for (let i = 0; i < cg.toneCount; i++) ramp.push(cg.startIdx + i);
    for (let i = 0; i < wg.toneCount; i++) ramp.push(wg.startIdx + i);
    const NT = ramp.length;
    function toneV(v) {
      return ramp[Math.max(0, Math.min(NT - 1, Math.round(v * (NT - 1))))];
    }
    const DARKEST = ramp[0];
    const BRIGHTEST = ramp[NT - 1];

    pc.pixels[0] = 0;

    const W = 128, H = 128;
    const cx = 64, cy = 55;
    const top = 6, bot = 120;
    const scaleH = bot - top;
    const lx = -0.5, ly = -0.6, lz = 0.63;

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

    function globalLight(x, y) {
      const t = (y - top) / scaleH;
      const hw = halfW(t);
      if (hw <= 0) return 0.3;
      const nxr = (x - cx) / (hw + 1);
      const nyr = (t - 0.3) * 1.2;
      const gnz = Math.sqrt(Math.max(0.05, 1 - nxr * nxr * 0.6 - nyr * nyr * 0.2));
      return Math.max(0, nxr * lx + nyr * ly * 0.3 + gnz * lz);
    }

    // Dome centers — varied sizes
    const domes = [];
    const spacing = 9;
    for (let row = -2; row < 18; row++) {
      for (let col = -2; col < 16; col++) {
        const bx = cx - 55 + col * spacing + (row % 2) * (spacing * 0.48);
        const by = top - 5 + row * (spacing * 0.86);
        const jx = bx + (hash(col * 7 + 31, row * 13 + 47) - 0.5) * spacing * 0.45;
        const jy = by + (hash(col * 11 + 53, row * 7 + 29) - 0.5) * spacing * 0.4;
        const distC = Math.sqrt((jx - cx) * (jx - cx) + (jy - cy) * (jy - cy));
        const sizeVar = hash(col * 3 + 7, row * 5 + 11);
        const r = (4 + sizeVar * 4) * Math.max(0.55, 1 - distC / 85);
        domes.push({ x: jx, y: jy, r: Math.max(3.5, r), specX: 0, specY: 0, maxV: 0 });
      }
    }

    // Render all pixels — track brightest pixel per dome for specular
    for (let y = top; y <= bot; y++) {
      for (let x = 0; x < W; x++) {
        if (!isInside(x, y)) continue;

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

        // CREVICE: DARKEST
        if (boundary < 0.12) {
          pc.setPixel(x, y, DARKEST);
          continue;
        }

        // RIDGE: strong bright accent, varies by global position
        if (boundary < 0.24) {
          const gl = globalLight(x, y);
          // Ridge is SIGNIFICANTLY brighter than dome interior nearby
          const ridgeV = 0.55 + gl * 0.42;
          pc.setPixel(x, y, toneV(ridgeV));
          continue;
        }

        // DOME INTERIOR: full range per dome, no global modulation
        const ddx = x - d1.x, ddy = y - d1.y;
        const snx = ddx / d1.r, sny = ddy / d1.r;
        const snz = Math.sqrt(Math.max(0.01, 1 - snx * snx - sny * sny));
        const NdotL = snx * lx + sny * ly + snz * lz;

        let v = 0.04 + Math.max(0, NdotL) * 0.96;

        // Gamma 0.65 — even tone distribution
        v = Math.pow(v, 0.65);

        v = Math.max(0, Math.min(1, v));

        // Track brightest pixel position per dome (for specular placement)
        if (v > d1.maxV) {
          d1.maxV = v;
          d1.specX = x;
          d1.specY = y;
        }

        pc.setPixel(x, y, toneV(v));
      }
    }

    // Growth ring grooves
    const grooveTs = [0.15, 0.28, 0.44, 0.60, 0.77];
    const grooveLens = [0.65, 0.85, 1.0, 0.90, 0.55];
    for (let i = 0; i < grooveTs.length; i++) {
      const gt = grooveTs[i];
      const hw = halfW(gt);
      const ext = grooveLens[i];
      for (let x = cx - Math.round(hw * ext); x <= cx + Math.round(hw * ext); x++) {
        const nxr = (x - cx) / 46;
        const gy = Math.round(top + (gt + nxr * nxr * 0.02) * scaleH);
        if (!isInside(x, gy)) continue;
        const gl = globalLight(x, gy);
        pc.setPixel(x, gy, DARKEST);
        if (gy - 1 >= top && isInside(x, gy - 1)) {
          pc.setPixel(x, gy - 1, toneV(0.60 + gl * 0.35));
        }
      }
    }

    // Border
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / scaleH;
      const hw = Math.round(halfW(t));
      if (hw <= 0) continue;
      for (let d = 0; d < 2; d++) {
        const lp = cx - hw + d, rp = cx + hw - d;
        if (lp >= 0 && lp < W) pc.setPixel(lp, y, DARKEST);
        if (rp >= 0 && rp < W) pc.setPixel(rp, y, DARKEST);
      }
      const lp3 = cx - hw + 3, rp3 = cx + hw - 3;
      if (lp3 >= 0 && lp3 < W && isInside(lp3, y))
        pc.setPixel(lp3, y, toneV(0.55 + globalLight(lp3, y) * 0.40));
      if (rp3 >= 0 && rp3 < W && isInside(rp3, y))
        pc.setPixel(rp3, y, toneV(0.55 + globalLight(rp3, y) * 0.40));
    }

    // Top edge
    for (let x = cx - 38; x <= cx + 38; x++) {
      if (isInside(x, top + 2))
        pc.setPixel(x, top + 2, toneV(0.60 + globalLight(x, top + 2) * 0.35));
    }

    // Bottom point
    for (let dy = 0; dy < 5; dy++) {
      const py = bot - dy;
      const bw = Math.round(dy * 1.2);
      for (let dx = -bw; dx <= bw; dx++) {
        if (cx + dx >= 0 && cx + dx < W && py >= 0 && py < H)
          pc.setPixel(cx + dx, py, DARKEST);
      }
    }

    // SPECULAR: At HIGHLIGHT PEAKS of selected domes
    // Place at the brightest pixel of each selected dome (upper-left where NdotL is max)
    // Pick every 3rd dome that's inside the silhouette and has a valid specular position
    const insideDomes = domes.filter(d =>
      isInside(Math.round(d.x), Math.round(d.y)) &&
      d.maxV > 0.7 &&
      d.specX > 0 && d.specY > 0
    );
    // Select ~8 well-distributed domes for specular
    let specCount = 0;
    for (let i = 0; i < insideDomes.length && specCount < 8; i += 3) {
      const d = insideDomes[i];
      const sx = d.specX, sy = d.specY;
      if (!isInside(sx, sy)) continue;

      // 2-3px BRIGHTEST cluster at the highlight peak
      const offsets = [
        [0, 0], [1, 0],
        hash(sx, sy) > 0.5 ? [0, 1] : [-1, 0] // asymmetric
      ];
      for (const [odx, ody] of offsets) {
        const px = sx + odx, py = sy + ody;
        if (px >= 0 && px < W && py >= 0 && py < H && isInside(px, py)) {
          pc.setPixel(px, py, BRIGHTEST);
        }
      }
      specCount++;
    }
  },
};
