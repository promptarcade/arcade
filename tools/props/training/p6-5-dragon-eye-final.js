// Phase 6, Exercise 6.5: Dragon Eye — FINAL EXAM (post-curriculum)
// Every technique from Phases 1-5 applied. Reference: green dragon close-up.
//
// KEY CHANGE from previous attempts: scale packing from exercise 5.6.
// Tight hex grid, minimal jitter, overlapping rows, thin crevice lines.

module.exports = {
  width: 256,
  height: 160,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    scalelit: '#55aa44',
    scaleshd: '#1a4a22',
    irisgreen: '#44882a',
    irisgold: '#cc9911',
    irisdark: '#773300',
    pupil: '#050302',
    sclera: '#bbaa66',
    highlight: '#ffffee',
    flesh: '#664433',
    bone: '#ccaa66',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.scalelit.startIdx); },

  drawPost(pc, pal) {
    const slg = pal.groups.scalelit;
    const ssg = pal.groups.scaleshd;
    const igg = pal.groups.irisgreen;
    const ig = pal.groups.irisgold;
    const idg = pal.groups.irisdark;
    const pg = pal.groups.pupil;
    const sg = pal.groups.sclera;
    const hg = pal.groups.highlight;
    const fg = pal.groups.flesh;
    const bg = pal.groups.bone;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const W = 256, H = 160;
    const cx = 128, cy = 80;
    const eyeRX = 48, eyeRY = 28;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(777);

    function sphLight(x, y) {
      const nx = (x - cx) / 140, ny = (y - cy) / 100;
      const nz2 = Math.max(0, 1 - nx * nx - ny * ny);
      if (nz2 <= 0) return 0.02;
      return 0.06 + Math.max(0, lx * nx + ly * ny + lz * Math.sqrt(nz2)) * 0.7;
    }

    function scaleCol(b) {
      const v = b * b * (3 - 2 * b);
      if (v > 0.38) return tone(slg, (v - 0.38) / 0.62 * 0.82 + 0.12);
      return tone(ssg, v / 0.38 * 0.55 + 0.02);
    }

    // === 1. CREVICE BASE — dark, thin lines between scales ===
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        pc.setPixel(x, y, tone(ssg, sphLight(x, y) * 0.1));
      }
    }

    // === 2. SCALES — 5.6 technique: tight hex grid, overlapping rows ===
    const scaleSize = 10;
    const seeds = [];

    for (let row = -3; row < 22; row++) {
      for (let col = -3; col < 30; col++) {
        const bx = col * (scaleSize - 1) + (row % 2) * (scaleSize * 0.48);
        const by = row * (scaleSize - 2); // OVERLAP: rows closer than scale height

        // Small jitter — tight packing priority (lesson from 5.6)
        const jx = bx + (rng() - 0.5) * scaleSize * 0.3;
        const jy = by + (rng() - 0.5) * scaleSize * 0.25;

        const distFromEye = Math.sqrt((jx - cx) ** 2 + ((jy - cy) * 1.3) ** 2);
        if (distFromEye < 40) continue;

        // Size varies: smaller near eye, larger at edges
        const distFactor = Math.min(1, 0.35 + (distFromEye - 40) * 0.005);
        const randFactor = 0.85 + rng() * 0.3;
        const size = Math.max(3, Math.round(scaleSize * distFactor * randFactor));

        seeds.push({ x: jx, y: jy, size, dist: distFromEye });
      }
    }
    seeds.sort((a, b) => a.y - b.y);

    for (const s of seeds) {
      const halfS = Math.round(s.size / 2);
      const gLight = sphLight(s.x, s.y);

      for (let dy = -halfS; dy <= halfS; dy++) {
        for (let dx = -halfS; dx <= halfS; dx++) {
          const px = Math.round(s.x + dx), py = Math.round(s.y + dy);
          if (px < 0 || px >= W || py < 0 || py >= H) continue;

          // Shape — rounded, slightly taller than wide
          const ndx = dx / (halfS + 0.5), ndy = dy / (halfS + 0.5);
          const shapeDist = ndx * ndx + ndy * ndy * 0.85;
          if (shapeDist > 0.9) continue;

          // Skip inside eye zone
          const edx = px - cx, edy = py - cy;
          if ((edx * edx) / ((eyeRX + 6) ** 2) + (edy * edy) / ((eyeRY + 6) ** 2) < 0.78) continue;

          // Phase 1 sphere normal per pixel
          const lnx = ndx * 0.7;
          const lny = (ndy - 0.25) * 1.0;
          const lnz = Math.sqrt(Math.max(0.08, 1 - lnx * lnx - lny * lny));
          const localDot = Math.max(0, lx * lnx + ly * lny + lz * lnz);

          let combined = gLight * 0.35 + localDot * 0.65;

          // Edge darkening — thin, not aggressive
          if (shapeDist > 0.72) combined *= 1 - (shapeDist - 0.72) / 0.18 * 0.35;

          combined += (rng() - 0.5) * 0.015;
          pc.setPixel(px, py, scaleCol(Math.max(0.02, Math.min(1, combined))));
        }
      }

      // Top edge ridge highlight
      const topY = Math.round(s.y - halfS);
      if (topY >= 0 && topY < H && gLight > 0.15) {
        for (let dx = -Math.round(halfS * 0.5); dx <= Math.round(halfS * 0.5); dx++) {
          const px = Math.round(s.x + dx);
          if (px >= 0 && px < W) pc.setPixel(px, topY, scaleCol(Math.min(1, gLight + 0.28)));
        }
      }

      // Bottom overlap shadow (Phase 2 contact shadow)
      const botY = Math.round(s.y + halfS);
      if (botY >= 0 && botY + 1 < H) {
        for (let dx = -Math.round(halfS * 0.4); dx <= Math.round(halfS * 0.4); dx++) {
          const px = Math.round(s.x + dx);
          if (px >= 0 && px < W) {
            pc.setPixel(px, botY, scaleCol(Math.max(0.005, gLight * 0.06)));
            if (botY + 1 < H) pc.setPixel(px, botY + 1, scaleCol(Math.max(0.003, gLight * 0.03)));
          }
        }
      }
    }

    // === 3. WRINKLES at eye corners ===
    for (let w = 0; w < 16; w++) {
      const side = w < 8 ? -1 : 1;
      const idx = w % 8;
      const baseAngle = side === -1 ? (Math.PI + (idx - 4) * 0.1) : ((idx - 4) * 0.1);
      const startR = 42 + rng() * 8;
      const endR = startR + 8 + rng() * 18;
      let wobble = 0;
      for (let r = startR; r < endR; r++) {
        wobble += (rng() - 0.5) * 0.2;
        const wx = Math.round(cx + r * Math.cos(baseAngle + wobble * 0.01));
        const wy = Math.round(cy + r * 0.6 * Math.sin(baseAngle + wobble * 0.01));
        if (wx < 1 || wx >= W - 1 || wy < 1 || wy >= H - 1) continue;
        pc.setPixel(wx, wy, tone(ssg, 0.0));
        pc.setPixel(wx, wy - 1, scaleCol(sphLight(wx, wy) * 0.6 + 0.08));
      }
    }

    // === 4. BONE SPIKES above eye ===
    const spikes = [
      { x: cx - 28, y: cy - 34, angle: -0.5, len: 20, w: 5 },
      { x: cx - 8, y: cy - 38, angle: -0.15, len: 24, w: 6 },
      { x: cx + 14, y: cy - 40, angle: 0.1, len: 26, w: 6 },
      { x: cx + 34, y: cy - 36, angle: 0.35, len: 20, w: 5 },
      { x: cx + 50, y: cy - 30, angle: 0.55, len: 16, w: 4 },
    ];
    for (const sp of spikes) {
      const cosA = Math.cos(sp.angle - Math.PI / 2), sinA = Math.sin(sp.angle - Math.PI / 2);
      for (let along = 0; along < sp.len; along++) {
        const t = along / sp.len;
        const width = Math.max(1, Math.round(sp.w * (1 - t * 0.75)));
        for (let across = -width; across <= width; across++) {
          const px = Math.round(sp.x + along * sinA + across * cosA);
          const py = Math.round(sp.y - along * cosA + across * sinA);
          if (px < 0 || px >= W || py < 0 || py >= H) continue;
          const crossT = across / (width + 1);
          const nxS = crossT * 0.7, nyS = -0.4 + t * 0.3;
          const nzS = Math.sqrt(Math.max(0.1, 1 - nxS * nxS - nyS * nyS));
          let bv = 0.12 + Math.max(0, lx * nxS + ly * nyS + lz * nzS) * 0.65;
          if (t > 0.65) bv *= 1 - (t - 0.65) / 0.35 * 0.35;
          bv = bv * bv * (3 - 2 * bv);
          pc.setPixel(px, py, tone(bg, Math.max(0.03, bv)));
        }
      }
    }

    // === 5. EYE SOCKET (Phase 2 occlusion) ===
    for (let y = cy - 36; y <= cy + 36; y++) {
      for (let x = cx - 54; x <= cx + 54; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const dx = x - cx, dy = y - cy;
        const eDist = Math.sqrt((dx * dx) / (50 * 50) + (dy * dy) / (32 * 32));
        if (eDist > 1) continue;
        if (eDist > 0.76) {
          pc.setPixel(x, y, tone(fg, Math.max(0, (1 - (eDist - 0.76) / 0.24) * 0.12)));
        } else {
          const fnx = -dx / 52, fny = -dy / 34;
          const fnz = Math.sqrt(Math.max(0.05, 1 - fnx * fnx - fny * fny));
          pc.setPixel(x, y, tone(fg, 0.08 + Math.max(0, lx * fnx + ly * fny + lz * fnz) * 0.4));
        }
      }
    }

    // === 6. SCLERA (Phase 1 sphere) ===
    for (let y = cy - eyeRY; y <= cy + eyeRY; y++) {
      for (let x = cx - eyeRX; x <= cx + eyeRX; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const dx = x - cx, dy = y - cy;
        const xFrac = Math.abs(dx) / eyeRX;
        const maxDY = eyeRY * (1 - xFrac * xFrac) * 0.88;
        if (Math.abs(dy) > maxDY) continue;
        const enx = dx / eyeRX, eny = dy / (eyeRY * 1.15);
        const enz = Math.sqrt(Math.max(0.05, 1 - enx * enx - eny * eny));
        const eDot = Math.max(0, lx * enx + ly * eny + lz * enz);
        const edgeAO = 1 - Math.pow(Math.abs(dy) / maxDY, 2) * 0.4;
        const cornerAO = 1 - Math.pow(xFrac, 2.5) * 0.45;
        pc.setPixel(x, y, tone(sg, Math.max(0.04, (0.15 + eDot * 0.65) * edgeAO * cornerAO)));
      }
    }

    // Blood vessels
    for (let v = 0; v < 16; v++) {
      const angle = (v / 16) * Math.PI * 2 + rng() * 0.2;
      let wobble = 0;
      for (let r = 24; r < 36 + rng() * 10; r++) {
        wobble += (rng() - 0.5) * 0.5;
        const vx = Math.round(cx + r * Math.cos(angle) + wobble);
        const vy = Math.round(cy + r * 0.58 * Math.sin(angle) + wobble * 0.2);
        if (vx < 0 || vx >= W || vy < 0 || vy >= H) continue;
        const vxf = Math.abs(vx - cx) / eyeRX;
        if (Math.abs(vy - cy) <= eyeRY * (1 - vxf * vxf) * 0.88)
          pc.setPixel(vx, vy, tone(fg, 0.3));
      }
    }

    // === 7. IRIS — Phase 5 glass technique: individual fibers, multi-colour bands ===
    const irisR = 22;
    const pupilRX = 4, pupilRY = 19;

    for (let y = cy - irisR - 1; y <= cy + irisR + 1; y++) {
      for (let x = cx - irisR - 1; x <= cx + irisR + 1; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > irisR) continue;
        const pChk = (dx * dx) / (pupilRX * pupilRX) + (dy * dy) / (pupilRY * pupilRY);
        if (pChk <= 1) continue;

        const angle = Math.atan2(dy, dx);
        const radialT = dist / irisR;

        // Concave bowl (Phase 1)
        const inx = -dx / (irisR * 1.3), iny = -dy / (irisR * 1.3);
        const inz = Math.sqrt(Math.max(0.1, 1 - inx * inx - iny * iny));
        const iDot = Math.max(0, lx * inx + ly * iny + lz * inz);

        // Individual fiber (Phase 5 — each unique, not sine wave)
        const fiberIdx = Math.floor((angle + Math.PI) / (Math.PI * 2) * 36);
        const fiberBright = 0.3 + ((fiberIdx * 7 + 13) % 17) / 17 * 0.5;
        const fiberEdge = Math.abs((angle + Math.PI) / (Math.PI * 2) * 36 - fiberIdx - 0.5) * 2;
        const fiber = fiberEdge < 0.65 ? fiberBright : fiberBright * 0.45;

        let brightness = iDot * 0.42 + fiber * 0.42 + Math.sin(dist * 1.2) * 0.05;

        // Colour bands (Phase 3 temperature)
        let colour;
        if (radialT > 0.78) {
          const limbal = radialT > 0.88 ? (1 - (radialT - 0.88) / 0.12 * 0.6) : 1;
          brightness *= limbal;
          colour = tone(igg, Math.max(0.03, Math.min(1, brightness)));
        } else if (radialT > 0.4) {
          colour = tone(ig, Math.max(0.03, Math.min(1, brightness)));
        } else {
          brightness *= 0.5 + radialT * 1.2;
          colour = tone(idg, Math.max(0.03, Math.min(1, brightness)));
        }

        // Band transitions — dithered
        if (radialT > 0.73 && radialT <= 0.78) {
          colour = rng() < (radialT - 0.73) / 0.05
            ? tone(igg, Math.max(0.03, brightness))
            : tone(ig, Math.max(0.03, brightness));
        }

        pc.setPixel(x, y, colour);
      }
    }

    // Gold flecks
    for (let f = 0; f < 40; f++) {
      const fa = rng() * Math.PI * 2, fr = 6 + rng() * 13;
      const fx = Math.round(cx + fr * Math.cos(fa)), fy = Math.round(cy + fr * Math.sin(fa));
      if (fx >= 0 && fx < W && fy >= 0 && fy < H) pc.setPixel(fx, fy, tone(ig, 0.88 + rng() * 0.12));
    }

    // === 8. PUPIL ===
    for (let y = cy - pupilRY - 1; y <= cy + pupilRY + 1; y++) {
      for (let x = cx - pupilRX - 1; x <= cx + pupilRX + 1; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const dx = x - cx, dy = y - cy;
        const pChk = (dx * dx) / (pupilRX * pupilRX) + (dy * dy) / (pupilRY * pupilRY);
        if (pChk <= 1) pc.setPixel(x, y, tone(pg, Math.sqrt(pChk) * 0.04));
        else if (pChk <= 1.15) pc.setPixel(x, y, tone(idg, 0.05));
      }
    }

    // === 9. EYELIDS ===
    for (let x = cx - eyeRX - 8; x <= cx + eyeRX + 8; x++) {
      if (x < 0 || x >= W) continue;
      const dx = x - cx, xFrac = Math.abs(dx) / (eyeRX + 8);
      if (xFrac > 1) continue;
      const lidEdgeY = cy - eyeRY * (1 - xFrac * xFrac) * 0.88 - 2;
      const thickness = Math.round(12 + (1 - xFrac) * 8);
      const gb = sphLight(x, cy - 30);
      for (let dy = 0; dy < thickness; dy++) {
        const py = Math.round(lidEdgeY - dy);
        if (py < 0 || py >= H) continue;
        const foldT = dy / thickness;
        const lny = -0.9 + foldT * 1.5;
        const lnz = Math.sqrt(Math.max(0.05, 1 - lny * lny * 0.7));
        pc.setPixel(x, py, scaleCol(gb * 0.3 + Math.max(0, ly * lny + lz * lnz) * 0.6 + (rng() - 0.5) * 0.02));
      }
      const creaseY = Math.round(lidEdgeY - thickness * 0.5);
      if (creaseY >= 0 && creaseY < H) pc.setPixel(x, creaseY, tone(ssg, 0.0));
      const edgeY = Math.round(lidEdgeY);
      if (edgeY >= 0 && edgeY + 2 < H) {
        pc.setPixel(x, edgeY, tone(pg, 0.0));
        pc.setPixel(x, edgeY + 1, tone(fg, 0.04));
        pc.setPixel(x, edgeY + 2, tone(fg, 0.1));
      }
    }
    // Lower lid
    for (let x = cx - eyeRX - 5; x <= cx + eyeRX + 5; x++) {
      if (x < 0 || x >= W) continue;
      const dx = x - cx, xFrac = Math.abs(dx) / (eyeRX + 5);
      if (xFrac > 1) continue;
      const lidEdgeY = cy + eyeRY * (1 - xFrac * xFrac) * 0.88 + 2;
      const thickness = Math.round(6 + (1 - xFrac) * 5);
      const gb = sphLight(x, cy + 25);
      for (let dy = 0; dy < thickness; dy++) {
        const py = Math.round(lidEdgeY + dy);
        if (py < 0 || py >= H) continue;
        const foldT = dy / thickness;
        const lny = 0.7 - foldT * 1.0;
        const lnz = Math.sqrt(Math.max(0.05, 1 - lny * lny * 0.7));
        pc.setPixel(x, py, scaleCol(gb * 0.3 + Math.max(0, ly * lny + lz * lnz) * 0.5));
      }
      const edgeY = Math.round(lidEdgeY);
      if (edgeY >= 0 && edgeY < H) {
        pc.setPixel(x, edgeY, tone(pg, 0.0));
        if (edgeY - 1 >= 0) pc.setPixel(x, edgeY - 1, tone(fg, 0.06));
      }
    }

    // === 10. SPECULAR + HIGHLIGHTS ===
    const s1x = cx - 8, s1y = cy - 7;
    for (let y = s1y - 4; y <= s1y + 4; y++) {
      for (let x = s1x - 4; x <= s1x + 4; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const d = Math.sqrt((x - s1x) ** 2 + (y - s1y) ** 2);
        if (d <= 2) pc.setPixel(x, y, tone(hg, 1.0));
        else if (d <= 4) pc.setPixel(x, y, tone(hg, 0.45 * (1 - (d - 2) / 2)));
      }
    }
    const s2x = cx + 10, s2y = cy + 4;
    for (let y = s2y - 2; y <= s2y + 2; y++) {
      for (let x = s2x - 2; x <= s2x + 2; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const d = Math.sqrt((x - s2x) ** 2 + (y - s2y) ** 2);
        if (d <= 2) pc.setPixel(x, y, tone(hg, 0.4 + (1 - d / 2) * 0.45));
      }
    }

    // Wet lid edge
    for (let x = cx - 42; x <= cx + 42; x++) {
      if (x < 0 || x >= W) continue;
      const dx = x - cx, xFrac = Math.abs(dx) / 46;
      if (xFrac > 1) continue;
      const upperY = Math.round(cy - eyeRY * (1 - xFrac * xFrac) * 0.88);
      if (upperY >= 0 && upperY + 1 < H) {
        pc.setPixel(x, upperY, tone(hg, (0.25 + (1 - xFrac) * 0.4) * 0.6));
        pc.setPixel(x, upperY + 1, tone(sg, 0.7));
      }
    }

    // Iris catchlight arc
    for (let a = 205; a < 305; a++) {
      const rad = a * Math.PI / 180;
      const hx = Math.round(cx + 21 * Math.cos(rad)), hy = Math.round(cy + 21 * Math.sin(rad));
      if (hx >= 0 && hx < W && hy >= 0 && hy < H) pc.setPixel(hx, hy, tone(ig, 0.92));
    }

    // Limbal ring
    for (let a = 0; a < 360; a++) {
      const rad = a * Math.PI / 180;
      for (let dr = 0; dr < 2; dr++) {
        const lxx = Math.round(cx + (irisR + dr) * Math.cos(rad));
        const lyy = Math.round(cy + (irisR + dr) * Math.sin(rad));
        if (lxx >= 0 && lxx < W && lyy >= 0 && lyy < H) pc.setPixel(lxx, lyy, tone(igg, 0.02));
      }
    }

    // Scale specular highlights — upper-left only
    const rng2 = sf2_seededRNG(888);
    for (let s = 0; s < 100; s++) {
      const sx = Math.round(rng2() * (W - 1)), sy = Math.round(rng2() * (H - 1));
      if (sx - cx > 10 || sy - cy > 5) continue;
      const dist = Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2);
      if (dist < 48) continue;
      if (pc.isFilled(sx, sy) && sy > 1) {
        pc.setPixel(sx, sy, tone(slg, 0.82 + rng2() * 0.18));
        pc.setPixel(sx, sy - 1, tone(slg, 0.72));
      }
    }
  },
};
