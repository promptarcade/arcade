// Exercise 7: Full dragon eye at 192x128
// VALUE HIERARCHY: iris = brightest/most contrast, scales = recede
// TRANSFERABLE: Focal point through contrast, value hierarchy across composition
// All techniques composed: Voronoi scales, zone-based rendering, concave socket,
// radial iris fibres, slit pupil, cast shadow, specular, rim lighting

module.exports = {
  width: 192, height: 128, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cool: '#2a6830',       // green shadow for scales (L≈22%)
    warm: '#8cd490',       // green bright for scales (L≈74%)
    irisDeep: '#781010',   // deep red H≈0° L≈27%
    irisBright: '#d06020', // orange H≈17° L≈47%
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.cool.startIdx); },
  drawPost(pc, pal) {
    const cg = pal.groups.cool, wg = pal.groups.warm;
    const ig = pal.groups.irisDeep, ibg = pal.groups.irisBright;

    const DARKEST = cg.startIdx;
    const SCALE_BRIGHT = wg.startIdx + wg.toneCount - 1;
    const SCALE_SECOND = wg.startIdx + wg.toneCount - 2;
    const IRIS_BRIGHT = ibg.startIdx + ibg.toneCount - 1;
    const IRIS_SECOND = ibg.startIdx + ibg.toneCount - 2;

    // Scale tone: maps 0-15 across cool+warm groups
    function scaleTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? cg.startIdx + i : wg.startIdx + (i - 8);
    }

    // Iris tone: maps 0-15 across irisDeep+irisBright groups
    function irisTone(i) {
      i = Math.max(0, Math.min(15, Math.round(i)));
      return i < 8 ? ig.startIdx + i : ibg.startIdx + (i - 8);
    }

    pc.pixels[0] = 0;

    const W = 192, H = 128, cx = 96, cy = 64;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    let _seed = 42;
    function rng() { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; }

    // === GEOMETRY ===
    const almondW = 42, almondH = 19;
    const IRIS_REF_R = 26;
    const pupilHalfW = 2.2, pupilHalfH = 15;

    function almondDist(x, y) {
      const dx = (x - cx) / almondW;
      const dy = (y - cy) / almondH;
      const xf = Math.abs(dx);
      const sharp = 1.0 + xf * xf * 0.5;
      return Math.sqrt(dx * dx + (dy * sharp) * (dy * sharp)) - 1.0;
    }

    function lidThickness(angle) {
      return Math.sin(angle) < 0 ? 7 : 3.5;
    }

    // === BUFFERS ===
    const pixBuf = new Int16Array(W * H).fill(-1);
    const zoneBuf = new Uint8Array(W * H); // 0=bg, 1=scale, 2=iris, 3=lid
    const irisLvl = new Uint8Array(W * H);

    // Fill background with dark noise
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const h = (((x * 48611 ^ y * 97231) >>> 0) / 4294967295);
        pc.setPixel(x, y, scaleTone(h < 0.7 ? 1 : 0));
      }

    // ============================================================
    // PASS 0: SURROUNDING SCALES (Voronoi, zone-based, green palette)
    // VALUE HIERARCHY: scales use REDUCED tonal window to recede
    // Scale tonal window: gb * 6 (NOT gb * 9) → palette 0-11 max
    // This ensures scales never reach the brightest tones
    // ============================================================
    const scales = [];
    const baseR = 10;

    // Main grid — wider coverage for 192x128
    for (let row = -8; row <= 8; row++) {
      for (let col = -9; col <= 9; col++) {
        const bx = cx + col * 13 + (row % 2) * 6.5;
        const by = cy + row * 11;
        const jx = Math.round(bx + (rng() - 0.5) * 5);
        const jy = Math.round(by + (rng() - 0.5) * 4);
        const ad = almondDist(jx, jy);
        if (ad < 0.18 || jx < 1 || jx >= W - 1 || jy < 1 || jy >= H - 1) continue;
        const r = ad < 0.4 ? Math.max(6, Math.round(baseR * 0.7)) :
                  ad < 0.7 ? Math.max(7, Math.round(baseR * 0.85)) : baseR;
        const gnx = (jx - cx) / 100, gny = (jy - cy) / 80;
        const gb = Math.max(0.05, Math.min(0.95, 0.5 + gnx * lx * 0.8 + gny * ly * 0.8));
        scales.push({ x: jx, y: jy, r, gb, hash: ((jx * 73856093 ^ jy * 19349663) >>> 0) });
      }
    }

    // Perimeter seeds near socket edge
    for (let angle = 0; angle < Math.PI * 2; angle += 0.25) {
      const cosA = Math.cos(angle), sinA = -Math.sin(angle);
      for (let ring = 0; ring < 3; ring++) {
        const dist = 0.25 + ring * 0.18;
        const ax = cx + cosA * almondW * (1.0 + dist * 0.9);
        const ay = cy + sinA * almondH * (1.0 + dist * 1.1);
        const jx = Math.round(ax + (rng() - 0.5) * 3);
        const jy = Math.round(ay + (rng() - 0.5) * 3);
        if (jx < 1 || jx >= W - 1 || jy < 1 || jy >= H - 1) continue;
        const ad = almondDist(jx, jy);
        if (ad < 0.15 || ad > 0.65) continue;
        let tooClose = false;
        for (const s of scales) {
          if ((s.x - jx) * (s.x - jx) + (s.y - jy) * (s.y - jy) < 64) { tooClose = true; break; }
        }
        if (tooClose) continue;
        const r = Math.max(5, Math.round(baseR * 0.6));
        const gnx = (jx - cx) / 100, gny = (jy - cy) / 80;
        const gb = Math.max(0.05, Math.min(0.95, 0.5 + gnx * lx * 0.8 + gny * ly * 0.8));
        scales.push({ x: jx, y: jy, r, gb, hash: ((jx * 73856093 ^ jy * 19349663) >>> 0) });
      }
    }
    scales.sort((a, b) => a.y - b.y);

    // Voronoi assignment for scales
    const ownerBuf = new Int16Array(W * H).fill(-1);
    const distBuf = new Float32Array(W * H).fill(1e9);
    const dist2Buf = new Float32Array(W * H).fill(1e9);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (almondDist(x, y) < 0) continue;
        const pidx = y * W + x;
        let bestD = 1e9, best2D = 1e9, bestI = -1;
        for (let si = 0; si < scales.length; si++) {
          const s = scales[si];
          const d = Math.sqrt((x - s.x) * (x - s.x) + (y - s.y) * (y - s.y));
          if (d < bestD) { best2D = bestD; bestD = d; bestI = si; }
          else if (d < best2D) { best2D = d; }
        }
        if (bestI >= 0) {
          ownerBuf[pidx] = bestI; distBuf[pidx] = bestD; dist2Buf[pidx] = best2D; zoneBuf[pidx] = 1;
        }
      }
    }

    // Render scales with zone-based rendering
    // KEY: reduced tonal window — scales use gb * 6 (max base = 6) so tones cap at ~13
    // This makes scales RECEDE compared to the iris
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 1) continue;
        const si = ownerBuf[pidx], s = scales[si], gb = s.gb, R = s.r;
        const dRatio = distBuf[pidx] / (dist2Buf[pidx] + 0.01);
        if (dRatio > 0.85) { pixBuf[pidx] = DARKEST; continue; }
        const dx = x - s.x, dy = y - s.y;
        const taper = dy / R > 0 ? 1.0 - dy / R * 0.3 : 1.0;
        const snx = dx / (R * taper + 0.5), sny = dy / (R * 1.05 + 0.5);
        const sn2 = snx * snx + sny * sny;
        const snz = Math.sqrt(Math.max(0.01, 1 - Math.min(1, sn2)));
        const localV = Math.pow(Math.max(0, snx * lx + sny * ly + snz * lz), 0.65);

        // REDUCED window: gb * 6 instead of gb * 9
        // This caps scale brightness well below iris brightness
        const bi = Math.round(gb * 6);
        const t0 = Math.max(0, bi), t1 = Math.min(13, bi + 2), t2 = Math.min(13, bi + 3);
        const t3 = Math.min(13, bi + 5), t4 = Math.min(13, bi + 6);
        let tI;
        if (localV < 0.18) tI = t0; else if (localV < 0.35) tI = t1;
        else if (localV < 0.55) tI = t2; else if (localV < 0.78) tI = t3; else tI = t4;

        // Micro pits for texture
        let ps = s.hash;
        for (let p = 0; p < 3; p++) {
          ps = (ps * 16807) % 2147483647; const pdx = (ps % (R * 2 - 2)) - R + 1;
          ps = (ps * 16807) % 2147483647; const pdy = (ps % (R * 2 - 2)) - R + 1;
          if ((dx - pdx) * (dx - pdx) + (dy - pdy) * (dy - pdy) < 4) { tI = Math.max(t0, tI - 2); break; }
        }
        pixBuf[pidx] = scaleTone(tI);
      }
    }

    // Ridge detection for scales
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 1 || pixBuf[pidx] === DARKEST) continue;
        let nc = false;
        for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
          const ni = (y + oy) * W + (x + ox);
          if (ni >= 0 && ni < W * H && pixBuf[ni] === DARKEST && zoneBuf[ni] === 1) { nc = true; break; }
        }
        if (!nc) continue;
        const si = ownerBuf[pidx], s = scales[si];
        // Ridge brightness also capped — scales don't get near-white ridges
        pixBuf[pidx] = scaleTone(Math.min(13, Math.round(s.gb * 6) + 7));
      }
    }

    // ============================================================
    // PASS 1: EYEBALL / IRIS (amber palette, fills ENTIRE socket)
    // VALUE HIERARCHY: iris uses FULL tonal range (0-15) — brightest element
    // ============================================================
    const NUM_FIBRES = 52;
    const fibres = [];
    for (let i = 0; i < NUM_FIBRES; i++) {
      const ba = (i / NUM_FIBRES) * Math.PI * 2;
      fibres.push({
        angle: ba + (rng() - 0.5) * 0.06,
        brightness: 0.5 + rng() * 0.5,
        thick: 0.5 + rng() * 1.0,
      });
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ad = almondDist(x, y);
        if (ad >= 0) continue;
        const pidx = y * W + x;
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const depth = -ad;

        // Limbal ring at socket edge (dark border)
        if (depth < 0.07) {
          pixBuf[pidx] = irisTone(0); irisLvl[pidx] = 0; zoneBuf[pidx] = 2; continue;
        }
        if (depth < 0.15) {
          const lvl = Math.round((depth - 0.07) / 0.08 * 2);
          pixBuf[pidx] = irisTone(lvl); irisLvl[pidx] = lvl; zoneBuf[pidx] = 2; continue;
        }

        // Normalized distance from center
        const nd = Math.min(1.0, dist / IRIS_REF_R);

        // Radial brightness: BRIGHT gold centre → darker amber edge
        // BOOSTED range for value hierarchy — iris centre reaches palette 15
        let rb;
        if (nd < 0.08) rb = 15;
        else if (nd < 0.25) rb = 15 - (nd - 0.08) / 0.17 * 1.5;
        else if (nd < 0.50) rb = 13.5 - (nd - 0.25) / 0.25 * 3;
        else if (nd < 0.75) rb = 10.5 - (nd - 0.50) / 0.25 * 3.5;
        else rb = 7 - (nd - 0.75) / 0.25 * 4;

        // Fibre modulation via angular Voronoi
        const angle = Math.atan2(dy, dx);
        let bestD = 1e9, bestF = null, secD = 1e9;
        for (const f of fibres) {
          let ad2 = Math.abs(angle - f.angle);
          if (ad2 > Math.PI) ad2 = Math.PI * 2 - ad2;
          if (ad2 < bestD) { secD = bestD; bestD = ad2; bestF = f; }
          else if (ad2 < secD) { secD = ad2; }
        }

        const avgSp = Math.PI * 2 / NUM_FIBRES;
        const fHW = avgSp * 0.35 * bestF.thick;
        let fm;
        if (bestD < fHW * 0.35) fm = 1.0;
        else if (bestD < fHW) fm = 1.0 - ((bestD - fHW * 0.35) / (fHW * 0.65)) * 0.4;
        else fm = 0.5;

        // Fibre strength scales with radial distance
        const fs = Math.min(1.0, Math.max(0, (nd - 0.06) * 3.0));
        const em = 1.0 - fs * (1.0 - fm);
        const fo = (em - 0.7) * 7;
        let tI = Math.round(rb + fo);

        // Eyeball dome lighting (subtle convex curvature)
        const enx = dx / (almondW * 0.8), eny = dy / (almondH * 1.5);
        const enz = Math.sqrt(Math.max(0.1, 1 - Math.min(0.9, enx * enx + eny * eny)));
        const sl = 0.82 + Math.max(0, enx * lx + eny * ly + enz * lz) * 0.18;
        tI = Math.round(tI * sl);

        // Pupil-adjacent glow
        const yFrac = Math.min(1, (dy * dy) / (pupilHalfH * pupilHalfH));
        const pw = pupilHalfW * (1.0 - yFrac);
        if (pw > 0.3 && Math.abs(dy) < pupilHalfH) {
          const ed = Math.abs(dx) - pw;
          if (ed >= 0 && ed < 3.5) tI = Math.min(15, tI + Math.round((3.5 - ed) * 0.9));
        }

        tI = Math.max(0, Math.min(15, tI));
        pixBuf[pidx] = irisTone(tI);
        irisLvl[pidx] = tI;
        zoneBuf[pidx] = 2;
      }
    }

    // Between-fibre dark lines (mid-to-outer iris)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 2) continue;
        const dx = x - cx, dy = y - cy;
        const nd = Math.sqrt(dx * dx + dy * dy) / IRIS_REF_R;
        if (nd < 0.18 || nd > 0.93) continue;
        const angle = Math.atan2(dy, dx);
        let minD = 1e9, secD2 = 1e9;
        for (const f of fibres) {
          let ad2 = Math.abs(angle - f.angle);
          if (ad2 > Math.PI) ad2 = Math.PI * 2 - ad2;
          if (ad2 < minD) { secD2 = minD; minD = ad2; } else if (ad2 < secD2) { secD2 = ad2; }
        }
        if (minD / (secD2 + 0.001) > 0.82) {
          const lvl = irisLvl[pidx];
          const darkened = Math.max(1, lvl - Math.round(2.5 + nd * 2));
          pixBuf[pidx] = irisTone(darkened);
          irisLvl[pidx] = darkened;
        }
      }
    }

    // Slit pupil (jet black)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 2) continue;
        const dx = x - cx, dy = y - cy;
        if (Math.abs(dy) > pupilHalfH + 1) continue;
        const yFrac = Math.min(1, (dy * dy) / (pupilHalfH * pupilHalfH));
        const pw = pupilHalfW * (1.0 - yFrac);
        if (pw < 0.2) continue;
        if (Math.abs(dx) < pw) { pixBuf[pidx] = DARKEST; irisLvl[pidx] = 0; }
        else if (Math.abs(dx) < pw + 0.8) { pixBuf[pidx] = irisTone(1); irisLvl[pidx] = 1; }
      }
    }

    // Cast shadow from upper lid onto iris top — MORE PRONOUNCED than ex6
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 2 || irisLvl[pidx] < 2) continue;
        const dy = y - cy;
        const sd = -(dy + almondH * 0.1) / (almondH * 0.55);
        if (sd > 0) {
          const ss = Math.min(1.0, sd * 1.8);
          const darkened = Math.max(1, Math.round(irisLvl[pidx] - ss * 6));
          pixBuf[pidx] = irisTone(darkened);
          irisLvl[pidx] = darkened;
        }
      }
    }

    // Lid reflection on lower iris (bright band — more distinct than ex6)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 2 || irisLvl[pidx] < 2) continue;
        const dx = x - cx, dy = y - cy;
        const reflY = (dy - almondH * 0.38) / (almondH * 0.12);
        if (Math.abs(reflY) < 1.0) {
          const yFrac = Math.min(1, (dy * dy) / (pupilHalfH * pupilHalfH));
          const pw = pupilHalfW * (1.0 - yFrac);
          if (Math.abs(dx) > pw + 1) {
            const rs = 1.0 - Math.abs(reflY);
            if (rs > 0.15) {
              const brightened = Math.min(15, Math.round(irisLvl[pidx] + rs * 3.5));
              pixBuf[pidx] = irisTone(brightened);
              irisLvl[pidx] = brightened;
            }
          }
        }
      }
    }

    // ============================================================
    // PASS 2: EYELID RIDGE (green palette, cylinder normals)
    // VALUE HIERARCHY: lid uses MID-RANGE — palette 2-11
    // ============================================================
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ad = almondDist(x, y);
        const angle = Math.atan2(-(y - cy), x - cx);
        const thick = lidThickness(angle);
        const lPD = ad * Math.min(almondW, almondH);
        if (lPD < -2 || lPD > thick) continue;
        const pidx = y * W + x;
        if (zoneBuf[pidx] === 1 && ad > 0.15) continue;

        const lidT = (lPD + 2) / (thick + 2);
        const rNz = Math.sqrt(Math.max(0.05, 1.0 - (2 * lidT - 1) * (2 * lidT - 1)));
        const eNx = -Math.sin(angle) * (2 * lidT - 1) * 0.3 + Math.cos(angle) * 0.1;
        const eNy = Math.cos(angle) * (2 * lidT - 1) * 0.3 + Math.sin(angle) * 0.1;
        let v = Math.pow(Math.max(0, eNx * lx + eNy * ly + rNz * lz), 0.65);
        if (lidT < 0.2) v *= lidT / 0.2 * 0.5;
        if ((y - cy) < 0) v = v * 1.0 + 0.05;

        // Mid-range tonal assignment — lid stays subdued
        let tI;
        if (v < 0.15) tI = 2; else if (v < 0.30) tI = 4;
        else if (v < 0.50) tI = 6; else if (v < 0.72) tI = 8; else tI = 10;
        const lH = (((x * 31337 ^ y * 17389) >>> 0) / 4294967295);
        if (lH < 0.08) tI = Math.max(2, tI - 1);

        pixBuf[pidx] = scaleTone(tI);
        zoneBuf[pidx] = 3;
      }
    }

    // Rim lighting on upper lid — slightly brighter for emphasis
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (zoneBuf[pidx] !== 3) continue;
        const ad = almondDist(x, y);
        const angle = Math.atan2(-(y - cy), x - cx);
        const thick = lidThickness(angle);
        const lPD = ad * Math.min(almondW, almondH);
        if (lPD <= (thick - 3) || lPD > thick) continue;
        if ((y - cy) < -2) pixBuf[pidx] = scaleTone((x - cx) < 10 ? 13 : 11);
        else if (angle < -0.3 || angle > Math.PI + 0.3) pixBuf[pidx] = scaleTone(9);
      }
    }

    // ============================================================
    // WRITE BUFFER TO CANVAS
    // ============================================================
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (pixBuf[y * W + x] >= 0) pc.setPixel(x, y, pixBuf[y * W + x]);

    // ============================================================
    // PASS 3: SPECULAR HIGHLIGHTS
    // VALUE HIERARCHY: eye specular = SINGLE BRIGHTEST POINT
    // ============================================================

    // Main iris specular — LARGER and more dramatic than ex6 (7-8px core)
    const sp1x = cx - 7, sp1y = cy - 8;
    // Core: near-white (SCALE_BRIGHT for reflected light color)
    for (const [ox, oy] of [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2]]) {
      const px = sp1x + ox, py = sp1y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 2)
        pc.setPixel(px, py, SCALE_BRIGHT);
    }
    // Halo: bright amber falloff
    for (const [ox, oy] of [[-1,-1],[0,-1],[1,-1],[2,-1],[3,-1],[3,0],[3,1],[3,2],
                             [-1,0],[-1,1],[-1,2],[0,3],[1,3],[2,3]]) {
      const px = sp1x + ox, py = sp1y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 2)
        pc.setPixel(px, py, IRIS_BRIGHT);
    }

    // Secondary iris specular — smaller, lower-right
    const sp2x = cx + 5, sp2y = cy + 6;
    for (const [ox, oy] of [[0,0],[1,0],[0,1],[1,1]]) {
      const px = sp2x + ox, py = sp2y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 2)
        pc.setPixel(px, py, SCALE_BRIGHT);
    }
    // Secondary halo
    for (const [ox, oy] of [[-1,0],[2,0],[0,-1],[1,-1],[-1,1],[2,1],[0,2],[1,2]]) {
      const px = sp2x + ox, py = sp2y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 2)
        pc.setPixel(px, py, IRIS_SECOND);
    }

    // Scale specular — FEWER and SMALLER than ex6 (scales should recede)
    // Only 2-3 specular clusters on scales, not every mid-brightness scale
    let scaleSpecCount = 0;
    for (const s of scales) {
      if (scaleSpecCount >= 3) break;
      if (s.gb < 0.35 || s.gb > 0.50) continue;
      if (s.x < 8 || s.x > W - 8 || s.y < 8 || s.y > H - 8) continue;
      // Skip scales too close to the eye (focal competition)
      const distToCenter = Math.sqrt((s.x - cx) * (s.x - cx) + (s.y - cy) * (s.y - cy));
      if (distToCenter < 50) continue;
      const sx = s.x - Math.round(s.r * 0.2), sy = s.y - Math.round(s.r * 0.3);
      // Smaller clusters (3px L-shape)
      for (const [ox, oy] of [[0,0],[1,0],[0,1]]) {
        const px = sx + ox, py = sy + oy;
        if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 1)
          pc.setPixel(px, py, SCALE_SECOND);
      }
      scaleSpecCount++;
    }

    // Lid specular — subtle, smaller than iris specular
    const lsx = cx - 14, lsy = cy - 17;
    for (const [ox, oy] of [[0,0],[1,0],[0,1]]) {
      const px = lsx + ox, py = lsy + oy;
      if (px >= 0 && px < W && py >= 0 && py < H && zoneBuf[py * W + px] === 3)
        pc.setPixel(px, py, SCALE_SECOND);
    }
  },
};
