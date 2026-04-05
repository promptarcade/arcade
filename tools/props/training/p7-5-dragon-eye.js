// Phase 7.5: Dragon Eye — FINAL EXAM
// HD tier (256×256, 8-tone palettes). Everything at maximum quality.
// Tests ALL skills: construction, sphere lighting, scale texture (tight packing),
// colour temperature, individual iris fibres, full tonal range per form,
// speculars, material variety (scales, wet glossy eye surface)
//
// Subject: a single enormous dragon eye, filling the canvas.
// Gold/amber iris, vertical slit pupil, surrounding dark green scales.

module.exports = {
  width: 256, height: 256, style: 'hd', entityType: 'prop', outlineMode: 'none',
  colors: {
    iris: '#ccaa33', irisshd: '#886611',
    pupil: '#111108', sclera: '#ddddbb',
    scale: '#2a5533', scaleshd: '#0e2a15',
    scalehi: '#448844',
    skin: '#556644', skinshd: '#2a3322',
    highlight: '#ffffee',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.iris.startIdx); },
  drawPost(pc, pal) {
    const ir = pal.groups.iris, is = pal.groups.irisshd;
    const pu = pal.groups.pupil;
    const sc = pal.groups.sclera;
    const sg = pal.groups.scale, ss = pal.groups.scaleshd, sh = pal.groups.scalehi;
    const sk = pal.groups.skin, sks = pal.groups.skinshd;
    const hg = pal.groups.highlight;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;

    const W = 256, H = 256;
    const cx = 128, cy = 128;
    const lx = -0.45, ly = -0.55, lz = 0.7;
    const rng = sf2_seededRNG(75);

    // ===========================
    // CONSTRUCTION
    // ===========================
    // Eye opening: horizontal ellipse
    const eyeRX = 90, eyeRY = 55;
    // Iris: circle inside the eye opening
    const irisR = 50;
    // Pupil: vertical slit
    const pupilHW = 5, pupilHH = 38;
    // Eyelids: define the opening boundary
    // Upper lid curves down more steeply, lower lid is flatter

    function eyeOpeningY(x) {
      // Returns {top, bot} — the Y coordinates of the eye opening at this X
      const xNorm = (x - cx) / eyeRX;
      if (Math.abs(xNorm) > 1) return null;
      const baseH = Math.sqrt(1 - xNorm * xNorm) * eyeRY;
      // Upper lid: more curvature, slight droop at outer corner
      const upperDroop = xNorm > 0.3 ? (xNorm - 0.3) * 8 : 0;
      const top = cy - baseH * 0.95 + upperDroop;
      // Lower lid: flatter
      const bot = cy + baseH * 0.75;
      return { top: Math.round(top), bot: Math.round(bot) };
    }

    // ===========================
    // LAYER 1: Scales (entire canvas, will be overdrawn by eye)
    // ===========================
    // Generate scale seeds — tight packing with row overlap
    const scales = [];
    const scaleSize = 16;
    const rowSpacing = scaleSize - 3; // overlap for tight packing
    for (let row = -1; row < Math.ceil(H / rowSpacing) + 1; row++) {
      const baseY = row * rowSpacing;
      const offset = (row % 2) * (scaleSize * 0.55);
      for (let col = -1; col < Math.ceil(W / (scaleSize * 0.9)) + 1; col++) {
        const baseX = col * scaleSize * 0.9 + offset;
        // Small jitter (30%)
        const jx = baseX + (rng() - 0.5) * scaleSize * 0.3;
        const jy = baseY + (rng() - 0.5) * scaleSize * 0.25;
        // Scale size varies — smaller near eye, larger at edges
        const distFromEye = Math.sqrt((jx - cx) * (jx - cx) / (eyeRX * eyeRX) + (jy - cy) * (jy - cy) / (eyeRY * eyeRY));
        const sizeF = distFromEye < 1.3 ? 0.6 + distFromEye * 0.3 : 1.0;
        scales.push({
          x: jx, y: jy,
          r: scaleSize * 0.5 * sizeF,
          bright: 0.15 + rng() * 0.15,
          hueShift: rng() * 0.06 - 0.03, // subtle per-scale colour variation
        });
      }
    }
    // Sort by Y for painter's order
    scales.sort((a, b) => a.y - b.y);

    // Helper: map brightness to scale colour (Phase 5 technique)
    function scaleCol(v) {
      v = v * v * (3 - 2 * v); // S-curve
      if (v > 0.45) return tone(sh, Math.min(0.92, (v - 0.45) / 0.55 * 0.8 + 0.15));
      if (v > 0.2) return tone(sg, Math.max(0.05, (v - 0.2) / 0.25 * 0.6 + 0.1));
      return tone(ss, Math.max(0.02, v / 0.2 * 0.5));
    }

    // Draw each scale — Phase 5 technique: global position light + per-scale dome light
    for (const s of scales) {
      const halfS = Math.round(s.r);

      // GLOBAL position lighting (where is this scale on the head?)
      const gdx = (s.x - cx) / 140; // normalize to head radius
      const gdy = (s.y - cy) / 140;
      const gnz = Math.sqrt(Math.max(0.05, 1 - gdx * gdx - gdy * gdy));
      const gLight = Math.max(0, lx * gdx + ly * gdy + lz * gnz) * 0.5 + 0.15;

      // Draw scale dome
      for (let dy = -halfS; dy <= halfS; dy++) {
        for (let dx = -halfS; dx <= halfS; dx++) {
          const px = Math.round(s.x + dx), py = Math.round(s.y + dy);
          if (px < 0 || px >= W || py < 0 || py >= H) continue;

          const normDX = dx / (halfS + 0.5);
          const normDY = dy / (halfS + 0.5);
          const shapeDist = normDX * normDX + normDY * normDY * 0.85;
          if (shapeDist > 0.9) continue;

          // LOCAL dome normal (Phase 1 sphere per scale)
          const lnx = normDX * 0.7;
          const lny = (normDY - 0.25) * 1.0; // bias top toward light
          const lnz = Math.sqrt(Math.max(0.08, 1 - lnx * lnx - lny * lny));
          const localDot = Math.max(0, lx * lnx + ly * lny + lz * lnz);

          // COMBINE global + local (the key Phase 5 blend)
          let combined = gLight * 0.35 + localDot * 0.65 + s.hueShift;

          // Edge darkening — gentler than before
          if (shapeDist > 0.7) {
            combined *= 1 - (shapeDist - 0.7) / 0.2 * 0.4;
          }

          combined += (rng() - 0.5) * 0.015; // micro texture
          pc.setPixel(px, py, scaleCol(Math.max(0.02, Math.min(1, combined))));
        }
      }

      // TOP EDGE BRIGHT RIDGE — the catchlight that defines each scale
      const topY = Math.round(s.y - halfS);
      if (topY >= 0 && topY < H && gLight > 0.12) {
        for (let dx = -Math.round(halfS * 0.5); dx <= Math.round(halfS * 0.5); dx++) {
          const rpx = Math.round(s.x + dx);
          if (rpx >= 0 && rpx < W) {
            pc.setPixel(rpx, topY, scaleCol(Math.min(1, gLight + 0.3)));
          }
        }
      }

      // BOTTOM EDGE OCCLUSION — very dark, separates scales
      const botY = Math.round(s.y + halfS);
      if (botY >= 0 && botY + 1 < H) {
        for (let dx = -Math.round(halfS * 0.4); dx <= Math.round(halfS * 0.4); dx++) {
          const rpx = Math.round(s.x + dx);
          if (rpx >= 0 && rpx < W) {
            pc.setPixel(rpx, botY, scaleCol(Math.max(0.005, gLight * 0.06)));
            if (botY + 1 < H) pc.setPixel(rpx, botY + 1, scaleCol(Math.max(0.003, gLight * 0.03)));
          }
        }
      }
    }

    // SPECULAR DOTS on lit-side scales
    const rng2 = sf2_seededRNG(888);
    for (let i = 0; i < 200; i++) {
      const sx = Math.round(rng2() * (W - 1)), sy = Math.round(rng2() * (H - 1));
      // Only on lit side (upper-left)
      const gdx = (sx - cx) / 140, gdy = (sy - cy) / 140;
      const gLight = Math.max(0, lx * gdx + ly * gdy + lz * Math.sqrt(Math.max(0, 1 - gdx * gdx - gdy * gdy)));
      if (gLight < 0.3) continue;
      // Don't put speculars on the eye area
      const eyeOpening = eyeOpeningY(sx);
      if (eyeOpening && sy > eyeOpening.top - 5 && sy < eyeOpening.bot + 5) continue;
      if (pc.isFilled(sx, sy) && sy > 1) {
        pc.setPixel(sx, sy, tone(sh, 0.85 + rng2() * 0.15));
        if (sy - 1 >= 0) pc.setPixel(sx, sy - 1, tone(sh, 0.7));
      }
    }

    // ===========================
    // LAYER 2: Eyelids / Skin around eye
    // ===========================
    // Thick skin folds above and below the eye opening
    for (let x = cx - eyeRX - 15; x <= cx + eyeRX + 15; x++) {
      if (x < 0 || x >= W) continue;
      const opening = eyeOpeningY(x);

      // Upper lid fold — thick skin above the opening
      const lidTop = opening ? opening.top - 18 : cy - eyeRY - 10;
      const lidBot = opening ? opening.top : cy - eyeRY + 5;
      for (let y = Math.max(0, lidTop); y <= Math.min(H - 1, lidBot + 2); y++) {
        const lt = (y - lidTop) / Math.max(1, lidBot - lidTop);
        const nx = (x - cx) / (eyeRX + 15) * 0.3;
        const ny = (lt - 0.5) * 0.5;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        let v = 0.06 + dot * 0.35;
        // Wrinkle lines
        if (Math.abs(Math.sin(x * 0.15 + y * 0.3)) > 0.85) v -= 0.04;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.2 ? sk : sks, Math.max(0.03, v)));
      }

      // Lower lid
      const lowerTop = opening ? opening.bot - 2 : cy + eyeRY - 5;
      const lowerBot = opening ? opening.bot + 12 : cy + eyeRY + 8;
      for (let y = Math.max(0, lowerTop); y <= Math.min(H - 1, lowerBot); y++) {
        const lt = (y - lowerTop) / Math.max(1, lowerBot - lowerTop);
        const nx = (x - cx) / (eyeRX + 15) * 0.3;
        const ny = lt * 0.4;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        let v = 0.05 + dot * 0.3;
        if (Math.abs(Math.sin(x * 0.12 + y * 0.25)) > 0.88) v -= 0.03;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.18 ? sk : sks, Math.max(0.03, v)));
      }
    }

    // Lid edge lines — dark crease at the opening boundary
    for (let x = cx - eyeRX; x <= cx + eyeRX; x++) {
      const opening = eyeOpeningY(x);
      if (!opening) continue;
      // Upper lid line — dark, 2px thick
      for (let t = 0; t < 3; t++) {
        const ly2 = opening.top + t;
        if (ly2 >= 0 && ly2 < H && x >= 0 && x < W) {
          pc.setPixel(x, ly2, tone(sks, 0.03 + t * 0.02));
        }
      }
      // Lower lid line
      for (let t = 0; t < 2; t++) {
        const ly2 = opening.bot - t;
        if (ly2 >= 0 && ly2 < H && x >= 0 && x < W) {
          pc.setPixel(x, ly2, tone(sks, 0.05 + t * 0.02));
        }
      }
    }

    // ===========================
    // LAYER 3: Sclera (white of eye)
    // ===========================
    for (let x = cx - eyeRX; x <= cx + eyeRX; x++) {
      const opening = eyeOpeningY(x);
      if (!opening) continue;
      for (let y = opening.top + 3; y <= opening.bot - 2; y++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        // Check if we're outside the iris
        const dx = x - cx, dy = y - cy;
        const distFromIris = Math.sqrt(dx * dx + dy * dy) / irisR;
        if (distFromIris < 1.05) continue; // will be drawn by iris layer

        // Sclera lighting — slightly convex
        const enx = (x - cx) / eyeRX * 0.3;
        const eny = (y - cy) / eyeRY * 0.2;
        const enz = Math.sqrt(Math.max(0.2, 1 - enx * enx - eny * eny));
        const edot = Math.max(0, lx * enx + ly * eny + lz * enz);
        let v = 0.25 + edot * 0.4;
        // Blood vessel hints — subtle reddish-dark streaks
        const vessel = Math.sin(x * 0.15 + y * 0.08) * Math.sin(x * 0.05 - y * 0.12);
        if (vessel > 0.4) v -= 0.06;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(sc, Math.max(0.1, v)));
      }
    }

    // ===========================
    // LAYER 4: Iris — the centrepiece
    // ===========================
    for (let dy = -irisR; dy <= irisR; dy++) {
      for (let dx = -irisR; dx <= irisR; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy) / irisR;
        if (d > 1) continue;
        const px = cx + dx, py = cy + dy;
        if (px < 0 || px >= W || py < 0 || py >= H) continue;

        // Check eye opening
        const opening = eyeOpeningY(px);
        if (!opening || py < opening.top + 3 || py > opening.bot - 2) continue;

        // Iris sphere normal
        const inx = dx / irisR, iny = dy / irisR;
        const inz = Math.sqrt(Math.max(0.05, 1 - inx * inx - iny * iny));
        const NdotL = inx * lx + iny * ly + inz * lz;
        const idot = Math.max(0, NdotL);

        // INDIVIDUAL IRIS FIBRES — radial streaks
        const angle = Math.atan2(dy, dx);
        // Multiple unique fibre frequencies — NOT a single sine
        const fibre1 = Math.sin(angle * 17 + d * 3) * 0.07;
        const fibre2 = Math.sin(angle * 23 - d * 5) * 0.05;
        const fibre3 = Math.sin(angle * 31 + 1.5) * 0.04;
        const fibre4 = Math.sin(angle * 11 + d * 8) * 0.03;
        const fibreTotal = fibre1 + fibre2 + fibre3 + fibre4;

        // Radial gradient: darker near edge, brighter in middle
        const radialV = 0.3 + (1 - d) * 0.25;

        // Pupil proximity darkening
        const pupilDist = Math.sqrt((dx / (pupilHW * 2)) ** 2 + (dy / pupilHH) ** 2);
        const pupilDarken = pupilDist < 1.5 ? (1.5 - pupilDist) * 0.15 : 0;

        let v = radialV + idot * 0.3 + fibreTotal - pupilDarken;

        // Edge ring — dark limbal ring at iris border
        if (d > 0.88) {
          v -= (d - 0.88) / 0.12 * 0.25;
        }

        // Specular on iris surface (wet)
        const ispec = Math.pow(Math.max(0, 2 * NdotL * inz - lz), 45) * 0.2;
        v += ispec;

        v = v * v * (3 - 2 * v);
        pc.setPixel(px, py, tone(v > 0.35 ? ir : is, Math.max(0.04, v)));
      }
    }

    // ===========================
    // LAYER 5: Pupil — vertical slit
    // ===========================
    for (let dy = -pupilHH - 2; dy <= pupilHH + 2; dy++) {
      // Pupil width varies: wider at center, narrow points at top/bottom
      const yFrac = Math.abs(dy) / pupilHH;
      const slitW = pupilHW * Math.max(0.3, 1 - yFrac * yFrac);
      for (let dx = -Math.ceil(slitW) - 1; dx <= Math.ceil(slitW) + 1; dx++) {
        const px = cx + dx, py = cy + dy;
        if (px < 0 || px >= W || py < 0 || py >= H) continue;

        const opening = eyeOpeningY(px);
        if (!opening || py < opening.top + 3 || py > opening.bot - 2) continue;

        const dNorm = Math.abs(dx) / slitW;
        if (dNorm > 1.2) continue;

        if (dNorm < 0.85) {
          // Pure black pupil interior
          pc.setPixel(px, py, tone(pu, 0.02));
        } else if (dNorm < 1.0) {
          // Soft edge — transition to iris
          const edge = (dNorm - 0.85) / 0.15;
          pc.setPixel(px, py, tone(pu, 0.02 + edge * 0.08));
        } else {
          // Feathered outer edge
          const fade = (dNorm - 1.0) / 0.2;
          if (fade < 1) {
            pc.setPixel(px, py, tone(is, 0.06 + fade * 0.12));
          }
        }
      }
    }

    // ===========================
    // LAYER 6: Specular highlights — THE key detail
    // ===========================
    // Primary specular — upper-left, small and bright
    const specCX = cx - 18, specCY = cy - 20;
    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = -6; dx <= 6; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy) / 6;
        if (d > 1) continue;
        const spx = specCX + dx, spy = specCY + dy;
        if (spx < 0 || spx >= W || spy < 0 || spy >= H) continue;
        const opening = eyeOpeningY(spx);
        if (!opening || spy < opening.top + 3 || spy > opening.bot - 2) continue;
        // Extreme brightness — pure white at centre
        const sv = 0.7 + (1 - d) * 0.3;
        pc.setPixel(spx, spy, tone(hg, sv));
      }
    }

    // Secondary specular — smaller, lower-right (secondary light)
    const spec2CX = cx + 12, spec2CY = cy + 8;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy) / 3;
        if (d > 1) continue;
        const spx = spec2CX + dx, spy = spec2CY + dy;
        if (spx < 0 || spx >= W || spy < 0 || spy >= H) continue;
        const opening = eyeOpeningY(spx);
        if (!opening || spy < opening.top + 3 || spy > opening.bot - 2) continue;
        pc.setPixel(spx, spy, tone(hg, 0.5 + (1 - d) * 0.25));
      }
    }

    // ===========================
    // LAYER 7: Wet eye surface reflection
    // ===========================
    // Subtle curved highlight along the lower lid edge (tear film)
    for (let x = cx - eyeRX + 10; x <= cx + eyeRX - 10; x++) {
      const opening = eyeOpeningY(x);
      if (!opening) continue;
      const wy = opening.bot - 4;
      if (wy >= 0 && wy < H && x >= 0 && x < W) {
        const dist = Math.abs(x - cx) / eyeRX;
        const intensity = (1 - dist * dist) * 0.35;
        if (intensity > 0.05) {
          pc.setPixel(x, wy, tone(hg, intensity));
          if (wy - 1 >= 0) pc.setPixel(x, wy - 1, tone(sc, 0.3 + intensity * 0.3));
        }
      }
    }

    // Rim highlight along upper lid — wet glossy edge
    for (let x = cx - eyeRX + 5; x <= cx + eyeRX - 5; x++) {
      const opening = eyeOpeningY(x);
      if (!opening) continue;
      const uy = opening.top + 3;
      if (uy >= 0 && uy < H && x >= 0 && x < W) {
        const dist = Math.abs(x - cx) / eyeRX;
        const intensity = (1 - dist) * 0.2;
        if (intensity > 0.03) {
          pc.setPixel(x, uy, tone(hg, intensity + 0.15));
        }
      }
    }

    // ===========================
    // LAYER 8: Small scales near the eye (skin texture detail)
    // ===========================
    // Tiny scales right along the lid edges — finer detail density
    for (let i = 0; i < 60; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = eyeRX + 5 + rng() * 20;
      const sx = Math.round(cx + Math.cos(angle) * dist * 0.9);
      const sy = Math.round(cy + Math.sin(angle) * dist * 0.6);
      if (sx < 2 || sx >= W - 2 || sy < 2 || sy >= H - 2) continue;
      // Only draw where there's already skin (not scales or eye)
      const existing = pc.pixels[sy * W + sx];
      if (existing === 0) continue;
      // Tiny 3-4px highlight dot
      const tinyR = 2 + Math.round(rng());
      for (let dy2 = -tinyR; dy2 <= tinyR; dy2++) {
        for (let dx2 = -tinyR; dx2 <= tinyR; dx2++) {
          if (dx2 * dx2 + dy2 * dy2 > tinyR * tinyR) continue;
          const tx = sx + dx2, ty = sy + dy2;
          if (tx < 0 || tx >= W || ty < 0 || ty >= H) continue;
          const tnx = dx2 / (tinyR + 0.5), tny = dy2 / (tinyR + 0.5);
          const tnz = Math.sqrt(Math.max(0.1, 1 - tnx * tnx - tny * tny));
          const tdot = Math.max(0, lx * tnx + ly * tny + lz * tnz);
          let tv = 0.06 + tdot * 0.2;
          tv = tv * tv * (3 - 2 * tv);
          pc.setPixel(tx, ty, tone(tv > 0.15 ? sk : sks, Math.max(0.03, tv)));
        }
      }
    }
  },
};
