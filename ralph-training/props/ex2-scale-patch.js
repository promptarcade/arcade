// Exercise 2: Patch of scales — Attempt 4
// KEY CHANGE: Zone-based rendering within each dome (not smooth gradient)
// Each dome has 3 sharp zones: dark shadow, mid body, bright highlight
// This makes 4-5 tones PER DOME visually distinct via deliberate jumps
// Ridge pixels = absolute bright (warm palette top), crevice = absolute dark
// Specular only on mid-brightness scales for maximum contrast

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
    const DARKEST = cg.startIdx;           // absolute darkest
    const DARK2 = cg.startIdx + 1;
    const DARK3 = cg.startIdx + 2;
    const MID_LO = cg.startIdx + 4;
    const MID = cg.startIdx + 6;
    const MID_HI = cg.startIdx + 7;
    const BRIGHT_LO = wg.startIdx + 1;
    const BRIGHT = wg.startIdx + 3;
    const BRIGHT_HI = wg.startIdx + 5;
    const NEAR_WHITE = wg.startIdx + 6;
    const BRIGHTEST = wg.startIdx + wg.toneCount - 1;
    const SECOND = wg.startIdx + wg.toneCount - 2;

    function tone16(v) {
      v = Math.max(0, Math.min(1, v));
      const idx = Math.round(v * 15);
      if (idx < 8) return cg.startIdx + idx;
      return wg.startIdx + (idx - 8);
    }
    pc.pixels[0] = 0;

    const W = 128, H = 128;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    let _seed = 42;
    function rng() { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; }

    // Near-black base
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        pc.setPixel(x, y, DARKEST);

    // Scale layout
    const scaleR = 14;
    const rowSp = 19, colSp = 21;
    const scales = [];

    for (let row = -1; row < 8; row++) {
      const baseY = 6 + row * rowSp;
      const xOff = (row % 2) * (colSp * 0.5);
      for (let col = -1; col < 7; col++) {
        const baseX = 5 + col * colSp + xOff;
        const jx = baseX + (rng() - 0.5) * colSp * 0.15;
        const jy = baseY + (rng() - 0.5) * rowSp * 0.15;
        const r = scaleR + Math.round((rng() - 0.5) * 4);
        scales.push({ x: Math.round(jx), y: Math.round(jy), r, hash: ((Math.round(jx) * 73856093 ^ Math.round(jy) * 19349663) >>> 0) });
      }
    }
    scales.sort((a, b) => a.y - b.y);

    // Global brightness with S-curve
    function globalBright(sx, sy) {
      const raw = 1.0 - (sx / W * 0.3 + sy / H * 0.55);
      const t = Math.max(0, Math.min(1, raw));
      return t * t * (3 - 2 * t);
    }

    // Buffers
    const pixBuf = new Int16Array(W * H).fill(-1); // palette index per pixel
    const ownerBuf = new Int16Array(W * H).fill(-1);

    // Pass 1: Draw scale interiors with ZONE-BASED rendering
    for (let si = 0; si < scales.length; si++) {
      const s = scales[si];
      const R = s.r;
      const gb = globalBright(s.x, s.y);

      // Per-scale palette mapping: 5 tones from dark to bright
      // gb determines which 5-tone range to use
      // Shadow scales: tones 0-6 (very dark to mid)
      // Mid scales: tones 3-11 (dark-mid to bright)
      // Bright scales: tones 7-15 (mid to near-white)
      const baseIdx = Math.round(gb * 9); // 0-9, shift into 16-tone ramp
      const t0 = Math.max(0, baseIdx);
      const t1 = Math.min(15, baseIdx + 2);
      const t2 = Math.min(15, baseIdx + 4);
      const t3 = Math.min(15, baseIdx + 6);
      const t4 = Math.min(15, baseIdx + 7); // ridge tone (locally brightest)

      function toneIdx(i) {
        if (i < 8) return cg.startIdx + i;
        return wg.startIdx + (i - 8);
      }

      // Micro pits
      const pits = [];
      let ps = s.hash;
      for (let p = 0; p < 4; p++) {
        ps = (ps * 16807) % 2147483647;
        const pdx = (ps % (R * 2 - 6)) - R + 3;
        ps = (ps * 16807) % 2147483647;
        const pdy = (ps % (R * 2 - 6)) - R + 3;
        if (pdx * pdx + pdy * pdy < (R * 0.55) * (R * 0.55)) {
          pits.push({ dx: pdx, dy: pdy });
        }
      }
      // Micro bumps (bright spots)
      const bumps = [];
      for (let b = 0; b < 3; b++) {
        ps = (ps * 16807) % 2147483647;
        const bdx = (ps % (R * 2 - 6)) - R + 3;
        ps = (ps * 16807) % 2147483647;
        const bdy = (ps % (R * 2 - 6)) - R + 3;
        if (bdx * bdx + bdy * bdy < (R * 0.5) * (R * 0.5)) {
          bumps.push({ dx: bdx, dy: bdy });
        }
      }

      for (let dy = -R - 1; dy <= R + 2; dy++) {
        for (let dx = -R - 1; dx <= R + 1; dx++) {
          const px = s.x + dx, py = s.y + dy;
          if (px < 0 || px >= W || py < 0 || py >= H) continue;

          // Shield shape
          const normDy = dy / R;
          const taper = normDy > 0 ? 1.0 - normDy * 0.4 : 1.0;
          const effRx = R * taper;
          const effRy = R * 1.08;
          const distSq = (dx * dx) / (effRx * effRx + 0.01) + (dy * dy) / (effRy * effRy + 0.01);
          if (distSq > 1.0) continue;

          const edgeDist = 1.0 - Math.sqrt(distSq);

          // Dome NdotL
          const nx = dx / (effRx + 0.5);
          const ny = dy / (effRy + 0.5);
          const nz = Math.sqrt(Math.max(0.01, 1 - Math.min(1, nx * nx + ny * ny)));
          let NdotL = nx * lx + ny * ly + nz * lz;
          let localV = Math.max(0, NdotL);
          localV = Math.pow(localV, 0.65);

          // ZONE-BASED: map continuous localV to 5 discrete zones with sharp jumps
          let toneI;
          if (localV < 0.18) toneI = t0;       // deep shadow
          else if (localV < 0.35) toneI = t1;   // shadow
          else if (localV < 0.55) toneI = t2;   // mid
          else if (localV < 0.78) toneI = t3;   // highlight
          else toneI = t4;                        // bright peak

          // Micro pits: drop down one tone
          for (const pit of pits) {
            const pdx2 = dx - pit.dx, pdy2 = dy - pit.dy;
            if (pdx2 * pdx2 + pdy2 * pdy2 < 4) { // within 2px
              toneI = Math.max(t0, toneI - 2);
              break;
            }
          }

          // Micro bumps: raise one tone
          for (const bump of bumps) {
            const bdx2 = dx - bump.dx, bdy2 = dy - bump.dy;
            if (bdx2 * bdx2 + bdy2 * bdy2 < 3) { // within ~1.7px
              toneI = Math.min(t4, toneI + 1);
              break;
            }
          }

          // Crevice: 1px at edge
          if (edgeDist < 0.08) {
            toneI = Math.max(0, t0 - 2); // even darker than scale's darkest
          }

          const idx = py * W + px;
          pixBuf[idx] = toneIdx(toneI);
          ownerBuf[idx] = si;
        }
      }
    }

    // Pass 2: Ridge detection — bright ridge 1-2px inside each boundary
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

    // Make boundary pixels near-black
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        if (isBound[idx]) pixBuf[idx] = DARKEST;
      }
    }

    // Ridge: 1-2px inside boundary, on the LIT SIDE (upper-left direction)
    for (let y = 2; y < H - 2; y++) {
      for (let x = 2; x < W - 2; x++) {
        const idx = y * W + x;
        if (ownerBuf[idx] < 0 || isBound[idx]) continue;

        // Check if adjacent to boundary
        let nearBound = false;
        for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
          const ni = (y + oy) * W + (x + ox);
          if (ni >= 0 && ni < W * H && isBound[ni]) { nearBound = true; break; }
        }
        if (!nearBound) continue;

        // This pixel is 1px inside the boundary — make it a ridge
        const si = ownerBuf[idx];
        const s = scales[si];
        const gb = globalBright(s.x, s.y);
        const baseIdx = Math.round(gb * 9);
        const ridgeTone = Math.min(15, baseIdx + 8); // 2 tones above normal peak
        function toneIdx(i) {
          if (i < 8) return cg.startIdx + i;
          return wg.startIdx + (i - 8);
        }
        pixBuf[idx] = toneIdx(ridgeTone);
      }
    }

    // Write buffer
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (pixBuf[y * W + x] >= 0)
          pc.setPixel(x, y, pixBuf[y * W + x]);

    // Specular: on mid-brightness scales ONLY (gb 0.3-0.55) for max contrast
    for (const s of scales) {
      if (s.x < 8 || s.x > W - 8 || s.y < 8 || s.y > H - 8) continue;
      const gb = globalBright(s.x, s.y);
      if (gb < 0.28 || gb > 0.58) continue;

      // Position: upper-left of dome (toward light)
      const sx = s.x - Math.round(s.r * 0.2);
      const sy = s.y - Math.round(s.r * 0.3);

      // Irregular 5px L-shaped cluster
      const core = [[0,0],[1,0],[2,0],[0,1],[0,2]];
      for (const [ox, oy] of core) {
        const px = sx + ox, py = sy + oy;
        if (px >= 0 && px < W && py >= 0 && py < H) pc.setPixel(px, py, BRIGHTEST);
      }
      // Halo
      const halo = [[-1,-1],[0,-1],[1,-1],[2,-1],[3,0],[-1,0],[-1,1],[-1,2],[1,1],[3,1],[0,3],[1,2]];
      for (const [ox, oy] of halo) {
        const px = sx + ox, py = sy + oy;
        if (px >= 0 && px < W && py >= 0 && py < H) pc.setPixel(px, py, SECOND);
      }
    }

    // Also add small 2px speculars on bright-zone scales (gb > 0.6)
    for (const s of scales) {
      if (s.x < 5 || s.x > W - 5 || s.y < 5 || s.y > H - 5) continue;
      const gb = globalBright(s.x, s.y);
      if (gb < 0.60) continue;
      const sx = s.x - Math.round(s.r * 0.25);
      const sy = s.y - Math.round(s.r * 0.35);
      if (sx >= 0 && sx < W && sy >= 0 && sy < H) pc.setPixel(sx, sy, BRIGHTEST);
      if (sx + 1 < W) pc.setPixel(sx + 1, sy, BRIGHTEST);
    }
  },
};
