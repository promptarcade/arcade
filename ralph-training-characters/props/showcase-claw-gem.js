// Showcase: Dragon claw gripping a gem — 160×128 HD
// v4: Top-down view. Distinct separated fingers with gaps between them.
// Palm/knuckle area left, 3 fingers spread then curve to grip gem.
// Each finger is a separate tapered form with scales, clear background between.

module.exports = {
  width: 160, height: 128, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    scaleCool: '#0a2e14',
    scaleWarm: '#5cb870',
    talonCool: '#1a1008',
    talonWarm: '#c8a860',
    gemDeep:   '#600818',
    gemBright: '#f04830',
    gemCore:   '#f8c848',
    gemWhite:  '#f0e8f0',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.scaleCool.startIdx); },
  drawPost(pc, pal) {
    const scg = pal.groups.scaleCool, swg = pal.groups.scaleWarm;
    const tcg = pal.groups.talonCool, twg = pal.groups.talonWarm;
    const gdg = pal.groups.gemDeep, gbg = pal.groups.gemBright;
    const gcg = pal.groups.gemCore, gwg = pal.groups.gemWhite;

    function scaleTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? scg.startIdx + i : swg.startIdx + (i - 8);
    }
    function talonTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? tcg.startIdx + i : twg.startIdx + (i - 8);
    }
    function gemTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? gdg.startIdx + i : gbg.startIdx + (i - 8);
    }
    function gemCoreTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? gcg.startIdx + i : gwg.startIdx + (i - 8);
    }

    pc.pixels[0] = 0;
    const W = 160, H = 128;
    const lx = -0.45, ly = -0.55, lz = 0.7;

    let _seed = 42;
    function rng() { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; }
    function hash(x, y) { return (((x * 48611 ^ y * 97231) >>> 0) / 4294967295); }

    const pixBuf = new Int16Array(W * H).fill(-1);
    const zoneBuf = new Uint8Array(W * H);

    // Dark background
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        pixBuf[y * W + x] = scaleTone(hash(x, y) < 0.6 ? 0 : 1);

    // Gem position
    const gemCx = 110, gemCy = 64, gemR = 20;

    // === FINGER GEOMETRY ===
    // Top-down view: palm at left, 3 fingers splay out then curve RIGHT toward gem
    // Each finger is THIN (8-14px wide) with clear gaps between them
    // Joints at ~40% and ~70% along each finger
    const fingers = [
      // Top finger — angles up then curves down to gem
      { pts: [
        {x:15,y:30,w:14}, {x:35,y:18,w:13}, {x:55,y:14,w:12},  // base to first joint
        {x:72,y:18,w:11}, {x:86,y:28,w:10},                      // first to second joint
        {x:98,y:40,w:8}, {x:106,y:50,w:6}, {x:110,y:56,w:3}     // second joint to talon
      ], talonStart: 0.78, joints: [0.35, 0.55] },
      // Middle finger — straight across
      { pts: [
        {x:18,y:64,w:15}, {x:38,y:62,w:14}, {x:58,y:60,w:13},
        {x:75,y:59,w:12}, {x:88,y:60,w:10},
        {x:100,y:62,w:8}, {x:108,y:64,w:5}, {x:114,y:64,w:2}
      ], talonStart: 0.78, joints: [0.35, 0.58] },
      // Bottom finger — angles down then curves up to gem
      { pts: [
        {x:15,y:98,w:14}, {x:35,y:110,w:13}, {x:55,y:112,w:12},
        {x:72,y:108,w:11}, {x:86,y:100,w:10},
        {x:98,y:88,w:8}, {x:106,y:78,w:6}, {x:110,y:72,w:3}
      ], talonStart: 0.78, joints: [0.35, 0.55] },
    ];

    function fingerAt(finger, t) {
      const pts = finger.pts;
      const n = pts.length - 1;
      const raw = t * n;
      const idx = Math.min(n - 1, Math.floor(raw));
      const f = raw - idx;
      const s = f * f * (3 - 2 * f);
      return {
        x: pts[idx].x + (pts[idx+1].x - pts[idx].x) * s,
        y: pts[idx].y + (pts[idx+1].y - pts[idx].y) * s,
        w: pts[idx].w + (pts[idx+1].w - pts[idx].w) * s,
      };
    }

    // Precompute
    const SAMPLES = 300;
    const fingerSamples = fingers.map(f => {
      const arr = [];
      for (let i = 0; i <= SAMPLES; i++) arr.push(fingerAt(f, i / SAMPLES));
      return arr;
    });

    function pointInFinger(px, py) {
      let best = null;
      for (let fi = 0; fi < fingers.length; fi++) {
        const samps = fingerSamples[fi];
        let bestD2 = 1e9, bestI = 0;
        for (let i = 0; i <= SAMPLES; i++) {
          const p = samps[i];
          const d2 = (px - p.x) * (px - p.x) + (py - p.y) * (py - p.y);
          if (d2 < bestD2) { bestD2 = d2; bestI = i; }
        }
        const d = Math.sqrt(bestD2);
        const p = samps[bestI];
        const t = bestI / SAMPLES;
        if (d <= p.w) {
          const normDist = d / p.w;
          const side = (py > p.y) ? 1 : -1;
          if (!best || normDist < best.normDist)
            best = { fi, t, normDist, cx: p.x, cy: p.y, w: p.w, side, isTalon: t > fingers[fi].talonStart };
        }
      }
      return best;
    }

    // Is this t near a joint?
    function jointDarkening(fi, t) {
      const joints = fingers[fi].joints;
      for (const jt of joints) {
        const d = Math.abs(t - jt);
        if (d < 0.03) return 0.4 + d / 0.03 * 0.6; // darken at joint
      }
      return 1.0;
    }

    // Knuckle bump — slight width increase at joints
    function knuckleBump(fi, t) {
      const joints = fingers[fi].joints;
      let bump = 0;
      for (const jt of joints) {
        const d = Math.abs(t - jt);
        if (d < 0.06) bump = Math.max(bump, (1 - d / 0.06) * 3); // +3px at peak
      }
      return bump;
    }

    // === PALM AREA (connects finger bases) ===
    // Elliptical palm connecting the three finger origins
    const palmCx = 12, palmCy = 64, palmRx = 20, palmRy = 42;
    const palmBuf = new Uint8Array(W * H);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = (x - palmCx) / palmRx, dy = (y - palmCy) / palmRy;
        if (dx * dx + dy * dy <= 1.0) {
          palmBuf[y * W + x] = 1;
        }
      }
    }

    // ============================================================
    // PASS 0: SCALES — on fingers AND palm
    // ============================================================
    const scales = [];
    const baseR = 8;
    const gridSpacing = 11;

    for (let row = -2; row <= 14; row++) {
      for (let col = -2; col <= 16; col++) {
        const bx = col * gridSpacing + (row % 2) * (gridSpacing * 0.5);
        const by = row * (gridSpacing - 2);
        const jx = Math.round(bx + (rng() - 0.5) * 5);
        const jy = Math.round(by + (rng() - 0.5) * 4);
        if (jx < -5 || jx >= W + 5 || jy < -5 || jy >= H + 5) continue;

        // Must be inside a finger (non-talon) OR palm
        const fp = pointInFinger(jx, jy);
        const inPalm = jx >= 0 && jx < W && jy >= 0 && jy < H && palmBuf[jy * W + jx];
        if ((!fp || fp.isTalon) && !inPalm) continue;

        // Skip gem area
        const dg = Math.sqrt((jx - gemCx) * (jx - gemCx) + (jy - gemCy) * (jy - gemCy));
        if (dg < gemR + 3) continue;

        const r = baseR;
        const gnx = (jx - 80) / 100, gny = (jy - 64) / 80;
        const gb = Math.max(0.05, Math.min(0.95, 0.5 + gnx * lx * 0.8 + gny * ly * 0.8));
        scales.push({ x: jx, y: jy, r, gb, hash: ((jx * 73856093 ^ jy * 19349663) >>> 0) });
      }
    }
    scales.sort((a, b) => a.y - b.y);

    // Voronoi assignment — only pixels inside finger or palm
    const ownerBuf = new Int16Array(W * H).fill(-1);
    const distBuf = new Float32Array(W * H).fill(1e9);
    const dist2Buf = new Float32Array(W * H).fill(1e9);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const fp = pointInFinger(x, y);
        const inPalm = palmBuf[y * W + x];
        if ((!fp || fp.isTalon) && !inPalm) continue;
        if (fp && fp.isTalon) continue;

        const pidx = y * W + x;
        const dg = Math.sqrt((x - gemCx) * (x - gemCx) + (y - gemCy) * (y - gemCy));
        if (dg < gemR + 2) continue;

        let bestD = 1e9, best2D = 1e9, bestI = -1;
        for (let si = 0; si < scales.length; si++) {
          const s = scales[si];
          const d = Math.sqrt((x - s.x) * (x - s.x) + (y - s.y) * (y - s.y));
          if (d < bestD) { best2D = bestD; bestD = d; bestI = si; }
          else if (d < best2D) { best2D = d; }
        }
        if (bestI >= 0) {
          ownerBuf[pidx] = bestI; distBuf[pidx] = bestD; dist2Buf[pidx] = best2D;
          zoneBuf[pidx] = 1;
        }
      }
    }

    // Render scales
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 1) continue;
        const si = ownerBuf[pidx], s = scales[si], gb = s.gb, R = s.r;

        const dRatio = distBuf[pidx] / (dist2Buf[pidx] + 0.01);
        if (dRatio > 0.85) { pixBuf[pidx] = scaleTone(0); continue; }

        const dx = x - s.x, dy = y - s.y;
        const taper = dy / R > 0 ? 1.0 - dy / R * 0.3 : 1.0;
        const snx = dx / (R * taper + 0.5), sny = dy / (R * 1.05 + 0.5);
        const sn2 = snx * snx + sny * sny;
        const snz = Math.sqrt(Math.max(0.01, 1 - Math.min(1, sn2)));
        const localV = Math.pow(Math.max(0, snx * lx + sny * ly + snz * lz), 0.65);

        // Joint darkening — if this pixel is near a finger joint, darken
        const fp = pointInFinger(x, y);
        let jointMul = 1.0;
        if (fp && !fp.isTalon) jointMul = jointDarkening(fp.fi, fp.t);

        const bi = Math.round(gb * 6 * jointMul);
        const t0 = Math.max(0, bi), t1 = Math.min(12, bi + 2), t2 = Math.min(12, bi + 3);
        const t3 = Math.min(12, bi + 5), t4 = Math.min(12, bi + 6);
        let tI;
        if (localV < 0.18) tI = t0; else if (localV < 0.35) tI = t1;
        else if (localV < 0.55) tI = t2; else if (localV < 0.78) tI = t3; else tI = t4;

        // Micro pits
        let ps = s.hash;
        for (let p = 0; p < 3; p++) {
          ps = (ps * 16807) % 2147483647; const pdx2 = (ps % (R * 2 - 2)) - R + 1;
          ps = (ps * 16807) % 2147483647; const pdy2 = (ps % (R * 2 - 2)) - R + 1;
          if ((dx - pdx2) * (dx - pdx2) + (dy - pdy2) * (dy - pdy2) < 4) { tI = Math.max(t0, tI - 2); break; }
        }
        pixBuf[pidx] = scaleTone(tI);
      }
    }

    // Ridge detection
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 1 || pixBuf[pidx] === scaleTone(0)) continue;
        let nc = false;
        for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
          const ni = (y + oy) * W + (x + ox);
          if (ni >= 0 && ni < W * H && pixBuf[ni] === scaleTone(0) && zoneBuf[ni] === 1) { nc = true; break; }
        }
        if (!nc) continue;
        const si = ownerBuf[pidx], s = scales[si];
        pixBuf[pidx] = scaleTone(Math.min(12, Math.round(s.gb * 6) + 7));
      }
    }

    // ============================================================
    // PASS 1: TALONS (curved, sharp, bone-colored)
    // ============================================================
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const fp = pointInFinger(x, y);
        if (!fp || !fp.isTalon) continue;
        const pidx = y * W + x;

        // Skip gem area — talons curve around it
        const dg = Math.sqrt((x - gemCx) * (x - gemCx) + (y - gemCy) * (y - gemCy));
        if (dg < gemR - 1) continue;

        const nx = fp.normDist * fp.side;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const NdotL = nx * ly * -0.3 + nz * lz;
        let v = Math.pow(Math.max(0, NdotL), 0.65);

        const talonT = (fp.t - fingers[fp.fi].talonStart) / (1.0 - fingers[fp.fi].talonStart);
        v *= (1.0 - talonT * 0.2);
        v += Math.pow(Math.max(0, 2 * NdotL * nz - lz), 50) * 0.25;
        if (nx > 0.3) v += 0.04;
        v = Math.max(0.02, Math.min(1.0, v));
        v = v * v * (3 - 2 * v);

        // Dithered zones
        const thresholds = [0.12, 0.28, 0.48, 0.70];
        const centers = [0.06, 0.20, 0.38, 0.59, 0.85];
        const bw = 0.05;
        let zone = 0;
        for (let zi = 0; zi < 4; zi++) {
          if (v > thresholds[zi] + bw) zone = zi + 1;
          else if (v > thresholds[zi] - bw) {
            if (hash(x * 7 + y * 31, x * 13 - y * 5) < (v - (thresholds[zi] - bw)) / (bw * 2)) zone = zi + 1;
            break;
          }
        }
        pixBuf[pidx] = talonTone(centers[zone] * 15);
        zoneBuf[pidx] = 2;
      }
    }

    // ============================================================
    // PASS 2: GEM
    // ============================================================
    const NUM_FACETS = 8;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - gemCx, dy = y - gemCy;
        const absDx = Math.abs(dx), absDy = Math.abs(dy);
        const octDist = Math.max(absDx, absDy) * 0.924 + Math.min(absDx, absDy) * 0.383;
        if (octDist > gemR) continue;

        const pidx = y * W + x;
        const depth = 1.0 - octDist / gemR;
        const angle = Math.atan2(dy, dx);
        const facetAngle = (Math.floor(((angle + Math.PI) / (Math.PI * 2)) * NUM_FACETS) + 0.5) / NUM_FACETS * Math.PI * 2 - Math.PI;

        const fnx = Math.cos(facetAngle) * 0.35 + dx / (gemR + 1) * 0.25;
        const fny = Math.sin(facetAngle) * 0.35 + dy / (gemR + 1) * 0.25;
        const fnz = Math.sqrt(Math.max(0.1, 1 - fnx * fnx - fny * fny));

        let v = Math.max(0, fnx * lx + fny * ly + fnz * lz);
        v += depth * 0.35;
        v += Math.pow(Math.max(0, 2 * (fnx * lx + fny * ly + fnz * lz) * fnz - lz), 80) * 0.5;
        v = Math.max(0.05, Math.min(1.0, v));

        const angleInFacet = (((angle + Math.PI) / (Math.PI * 2)) * NUM_FACETS) % 1.0;
        const edgeDist = Math.min(angleInFacet, 1.0 - angleInFacet);
        if (edgeDist < 0.10) v *= 0.35 + edgeDist / 0.10 * 0.65;

        if (octDist > gemR * 0.85) v *= 1.0 - (octDist - gemR * 0.85) / (gemR * 0.15) * 0.6;
        if (depth > 0.55) v = Math.min(1.0, v + 0.15);

        let tI = Math.round(v * 15);
        pixBuf[pidx] = (depth > 0.45 && v > 0.55) ? gemCoreTone(tI) : gemTone(tI);
        zoneBuf[pidx] = 3;
      }
    }

    // Internal reflections
    for (let i = 0; i < 6; i++) {
      const ra = rng() * Math.PI * 2, rd = rng() * gemR * 0.55;
      const rx = gemCx + Math.cos(ra) * rd, ry = gemCy + Math.sin(ra) * rd;
      const rlen = 3 + Math.round(rng() * 5), rdir = rng() * Math.PI * 2;
      for (let s = 0; s < rlen; s++) {
        const px = Math.round(rx + Math.cos(rdir) * s), py = Math.round(ry + Math.sin(rdir) * s);
        if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 3)
          pixBuf[py * W + px] = gemCoreTone(Math.round(12 + (1 - s / rlen) * 3));
      }
    }

    // ============================================================
    // WRITE & SPECULAR
    // ============================================================
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (pixBuf[y * W + x] >= 0) pc.setPixel(x, y, pixBuf[y * W + x]);

    // Gem primary specular
    const gsx = gemCx - 6, gsy = gemCy - 7;
    for (const [ox, oy] of [[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2]]) {
      const px = gsx + ox, py = gsy + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 3)
        pc.setPixel(px, py, gemCoreTone(15));
    }
    for (const [ox, oy] of [[-1,-1],[0,-1],[1,-1],[2,-1],[3,-1],[4,-1],[4,0],[4,1],[4,2],
                             [-1,0],[-1,1],[-1,2],[0,3],[1,3],[2,3],[3,3]]) {
      const px = gsx + ox, py = gsy + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 3)
        pc.setPixel(px, py, gemCoreTone(13));
    }

    // Gem secondary specular
    const gs2x = gemCx + 5, gs2y = gemCy + 6;
    for (const [ox, oy] of [[0,0],[1,0],[0,1],[1,1]]) {
      const px = gs2x + ox, py = gs2y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 3)
        pc.setPixel(px, py, gemCoreTone(14));
    }

    // Knuckle highlights at joints
    for (let fi = 0; fi < fingers.length; fi++) {
      for (const jt of fingers[fi].joints) {
        const p = fingerAt(fingers[fi], jt);
        const kx = Math.round(p.x), ky = Math.round(p.y - p.w * 0.35);
        for (const [ox, oy] of [[0,0],[1,0],[0,1],[1,1]]) {
          const px = kx + ox, py = ky + oy;
          if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 1)
            pc.setPixel(px, py, scaleTone(12));
        }
      }
    }

    // Scale specular (sparse)
    let specCount = 0;
    for (const s of scales) {
      if (specCount >= 5) break;
      if (s.gb < 0.35 || s.gb > 0.55) continue;
      const dg = Math.sqrt((s.x - gemCx) * (s.x - gemCx) + (s.y - gemCy) * (s.y - gemCy));
      if (dg < 40) continue;
      const sx = s.x - Math.round(s.r * 0.2), sy = s.y - Math.round(s.r * 0.3);
      for (const [ox, oy] of [[0,0],[1,0],[0,1]]) {
        const px = sx + ox, py = sy + oy;
        if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 1)
          pc.setPixel(px, py, scaleTone(12));
      }
      specCount++;
    }

    // Talon specular
    for (let fi = 0; fi < fingers.length; fi++) {
      const t = fingers[fi].talonStart + (1.0 - fingers[fi].talonStart) * 0.3;
      const p = fingerAt(fingers[fi], t);
      const sx = Math.round(p.x), sy = Math.round(p.y - p.w * 0.3);
      for (const [ox, oy] of [[0,0],[1,0],[0,1]]) {
        const px = sx + ox, py = sy + oy;
        if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 2)
          pc.setPixel(px, py, talonTone(14));
      }
    }
  },
};
