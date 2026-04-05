// Exercise 5: The iris — radial fibres, colour gradation, vertical slit pupil
// TRANSFERABLE: Radial detail, colour gradients within a form, dominant focal element
// Iris should be BRIGHT and vibrant — warm gold centre, darker cooler edge
// Fibres are LIGHTER streaks radiating outward from pupil

module.exports = {
  width: 96, height: 96, style: 'hd', entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cool: '#781010',   // deep red H≈0° L≈27% — all shifted tones H=345°-20° (red-orange)
    warm: '#d06020',   // orange H≈17° L≈47% — deepShadow H=37°(amber), highlight H=2°(red)
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

    const W = 96, H = 96;
    const cx = 48, cy = 48;
    const irisR = 40;
    const pupilHalfW = 3.5;
    const pupilHalfH = 34;

    const lx = -0.5, ly = -0.6, lz = 0.63;

    let _seed = 137;
    function rng() { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; }

    // Generate radial fibres — each is a bright streak
    const NUM_FIBRES = 56;
    const fibres = [];
    for (let i = 0; i < NUM_FIBRES; i++) {
      const baseAngle = (i / NUM_FIBRES) * Math.PI * 2;
      const jitter = (rng() - 0.5) * 0.05;
      const brightness = 0.6 + rng() * 0.4; // 0.6-1.0 — fibres are bright
      const thick = 0.6 + rng() * 0.8; // thickness multiplier
      fibres.push({ angle: baseAngle + jitter, brightness, thick });
    }

    // === Fill background black ===
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        pc.setPixel(x, y, DARKEST);

    const pixBuf = new Int16Array(W * H).fill(-1);

    // === PASS 1: Iris with radial fibre pattern ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > irisR) continue;

        const pidx = y * W + x;
        const nd = dist / irisR; // 0 center, 1 edge

        // Skip pupil (drawn later)
        const yFrac = Math.min(1, (dy * dy) / (pupilHalfH * pupilHalfH));
        const pw = pupilHalfW * (1.0 - yFrac);
        if (pw > 0.3 && Math.abs(dx) < pw && Math.abs(dy) < pupilHalfH) continue;

        const angle = Math.atan2(dy, dx);

        // === Radial base brightness: bright centre, darker edge ===
        // Centre is palette 12-14 (bright gold), edge is palette 5-7 (mid amber)
        let radialBase;
        if (nd < 0.12) {
          radialBase = 14; // brightest at very center
        } else if (nd < 0.35) {
          radialBase = 14 - (nd - 0.12) / 0.23 * 2.5; // 14→11.5
        } else if (nd < 0.65) {
          radialBase = 11.5 - (nd - 0.35) / 0.3 * 3; // 11.5→8.5
        } else if (nd < 0.85) {
          radialBase = 8.5 - (nd - 0.65) / 0.2 * 2.5; // 8.5→6
        } else {
          radialBase = 6 - (nd - 0.85) / 0.15 * 4; // 6→2 (dark rim)
        }

        // === Find nearest fibre for modulation ===
        let bestDist = 1e9, bestFibre = null, secondDist = 1e9;
        for (const f of fibres) {
          let adiff = Math.abs(angle - f.angle);
          if (adiff > Math.PI) adiff = Math.PI * 2 - adiff;
          if (adiff < bestDist) {
            secondDist = bestDist;
            bestDist = adiff;
            bestFibre = f;
          } else if (adiff < secondDist) {
            secondDist = adiff;
          }
        }

        // Fibre modulation: fibre cores are BRIGHT, between-fibre is slightly DARKER
        // The difference is subtle at centre, more pronounced at edge
        const avgSpacing = Math.PI * 2 / NUM_FIBRES;
        const fibreHalfWidth = avgSpacing * 0.35 * bestFibre.thick;

        let fibreMod; // modulation: 1.0 = fibre core (bright), 0.0 = max darkening
        if (bestDist < fibreHalfWidth * 0.4) {
          // Fibre core — full brightness boost
          fibreMod = 1.0;
        } else if (bestDist < fibreHalfWidth) {
          // Fibre body — gradual falloff
          const t = (bestDist - fibreHalfWidth * 0.4) / (fibreHalfWidth * 0.6);
          fibreMod = 1.0 - t * 0.35;
        } else {
          // Between fibres — darker but not black
          fibreMod = 0.55;
        }

        // Fibre effect scales: subtle at centre, strong at mid/outer iris
        const fibreStrength = Math.min(1.0, Math.max(0, (nd - 0.1) * 3.0));
        // At centre: effectiveMod ≈ 1.0 (no fibre effect, just bright)
        // At mid/outer: effectiveMod = fibreMod (0.55-1.0)
        const effectiveMod = 1.0 - fibreStrength * (1.0 - fibreMod);

        // Apply: fibre brightens or dims the radial base
        // Fibre core: +2 tones, between-fibre: -2 tones from base
        const fibreOffset = (effectiveMod - 0.75) * 6; // range: -1.2 to +1.5
        let toneI = Math.round(radialBase + fibreOffset);

        // === Subtle dome lighting ===
        const inx = dx / (irisR + 0.5);
        const iny = dy / (irisR + 0.5);
        const inz = Math.sqrt(Math.max(0.05, 1 - Math.min(0.95, inx * inx + iny * iny)));
        const NdotL = inx * lx + iny * ly + inz * lz;
        const surfLight = 0.9 + Math.max(0, NdotL) * 0.1;
        toneI = Math.round(toneI * surfLight);

        // === Pupil-adjacent glow ===
        if (pw > 0 && Math.abs(dy) < pupilHalfH) {
          const edgeDist = Math.abs(dx) - pw;
          if (edgeDist >= 0 && edgeDist < 4) {
            toneI = Math.min(15, toneI + Math.round((4 - edgeDist) * 0.7));
          }
        }

        toneI = Math.max(0, Math.min(15, toneI));
        pixBuf[pidx] = toneIdx(toneI);
      }
    }

    // === PASS 2: Between-fibre dark lines (subtle crevices, mid-to-outer only) ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (pixBuf[pidx] < 0) continue;

        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nd = dist / irisR;
        if (nd < 0.25 || nd > 0.9) continue;

        const angle = Math.atan2(dy, dx);
        let minD = 1e9, secD = 1e9;
        for (const f of fibres) {
          let adiff = Math.abs(angle - f.angle);
          if (adiff > Math.PI) adiff = Math.PI * 2 - adiff;
          if (adiff < minD) { secD = minD; minD = adiff; }
          else if (adiff < secD) { secD = adiff; }
        }

        // Only darken the very boundary between fibres
        const ratio = minD / (secD + 0.001);
        if (ratio > 0.85) {
          const current = pixBuf[pidx];
          let curIdx = 0;
          for (let i = 0; i <= 15; i++) {
            if (toneIdx(i) === current) { curIdx = i; break; }
          }
          // Darken by 2 tones (subtle), proportional to how far out we are
          const darkAmount = Math.round(2 + nd * 1.5);
          pixBuf[pidx] = toneIdx(Math.max(1, curIdx - darkAmount));
        }
      }
    }

    // === PASS 3: Limbal ring (dark border, 2px wide) ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > irisR || dist < irisR - 2.5) continue;
        const pidx = y * W + x;
        const band = irisR - dist;
        pixBuf[pidx] = toneIdx(band < 1.0 ? 0 : 1);
      }
    }

    // === PASS 4: Vertical slit pupil (jet black) ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - cx, dy = y - cy;
        if (Math.abs(dy) > pupilHalfH + 1) continue;

        const yFrac = Math.min(1, (dy * dy) / (pupilHalfH * pupilHalfH));
        const pw = pupilHalfW * (1.0 - yFrac);
        if (pw < 0.2) continue;

        const pidx = y * W + x;
        if (Math.abs(dx) < pw) {
          pixBuf[pidx] = DARKEST;
        } else if (Math.abs(dx) < pw + 0.8) {
          pixBuf[pidx] = toneIdx(1);
        }
      }
    }

    // === Write buffer ===
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (pixBuf[y * W + x] >= 0)
          pc.setPixel(x, y, pixBuf[y * W + x]);

    // === PASS 5: Specular highlights (glossy wet surface) ===
    // Main specular — upper-left
    const spec1x = cx - 10, spec1y = cy - 15;
    for (const [ox, oy] of [[0,0],[1,0],[0,1],[1,1],[2,0],[0,2],[2,1]]) {
      const px = spec1x + ox, py = spec1y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H) {
        const d = Math.sqrt((px-cx)*(px-cx)+(py-cy)*(py-cy));
        if (d < irisR - 3) pc.setPixel(px, py, BRIGHTEST);
      }
    }
    for (const [ox, oy] of [[-1,-1],[0,-1],[1,-1],[2,-1],[3,0],[3,1],[-1,0],[-1,1],[-1,2],[0,3],[1,3],[2,2]]) {
      const px = spec1x + ox, py = spec1y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H) {
        const d = Math.sqrt((px-cx)*(px-cx)+(py-cy)*(py-cy));
        if (d < irisR - 3) pc.setPixel(px, py, SECOND);
      }
    }

    // Secondary specular — smaller, lower-right
    const spec2x = cx + 7, spec2y = cy + 10;
    for (const [ox, oy] of [[0,0],[1,0],[0,1]]) {
      const px = spec2x + ox, py = spec2y + oy;
      if (px >= 0 && px < W && py >= 0 && py < H) {
        const d = Math.sqrt((px-cx)*(px-cx)+(py-cy)*(py-cy));
        if (d < irisR - 3) pc.setPixel(px, py, BRIGHTEST);
      }
    }
  },
};
