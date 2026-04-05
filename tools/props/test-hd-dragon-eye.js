// Dragon Eye v2 — HD tier (256x256)
// Rebuilt from scratch using green dragon reference.
// Key lessons from reference:
// - Scales are LARGE irregular polygons, not tiny uniform bumps
// - Crevices between scales are near-BLACK
// - Each scale is a distinct 3D convex form with its own specular
// - Iris has multiple color bands (green outer, gold mid, orange inner)
// - Bone spikes above eye
// - Extreme contrast range

module.exports = {
  width: 256,
  height: 256,
  style: 'hd',
  entityType: 'prop',
  colors: {
    scale: '#1a4a18',       // deep shadow green
    scalelit: '#44aa38',    // bright lit green
    iris: '#cc8800',        // golden-orange inner iris
    irisgreen: '#44882a',   // green outer iris ring
    pupil: '#050302',       // near-black
    sclera: '#aa9955',      // yellowish
    highlight: '#ffffee',   // white specular
    flesh: '#6b3322',       // dark brown socket
    bone: '#ccaa66',        // tan bone spikes
  },

  draw(pc, pal) {
    const scg = pal.groups.scale;
    const slg = pal.groups.scalelit;
    const ig = pal.groups.iris;
    const igg = pal.groups.irisgreen;
    const pg = pal.groups.pupil;
    const sg = pal.groups.sclera;
    const hg = pal.groups.highlight;
    const fg = pal.groups.flesh;
    const bg = pal.groups.bone;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }

    const cx = 130, cy = 135; // slightly off-center
    const rng = sf2_seededRNG(777);
    const eyeRX = 52, eyeRY = 30;

    // Sphere lighting helper
    function sphereLight(x, y) {
      const nx = (x - cx) / 140;
      const ny = (y - cy) / 140;
      const nz2 = Math.max(0, 1 - nx * nx - ny * ny);
      if (nz2 <= 0) return 0.02;
      return 0.05 + Math.max(0, -0.45 * nx - 0.55 * ny + 0.65 * Math.sqrt(nz2)) * 0.7;
    }

    // S-curve contrast
    function contrast(v) {
      const c = Math.max(0, Math.min(1, v));
      return c * c * (3 - 2 * c);
    }

    // Scale color: crossfade dark/lit green palettes
    function scaleColor(brightness) {
      const b = contrast(brightness);
      if (b > 0.38) {
        return tone(slg, (b - 0.38) / 0.62 * 0.85 + 0.1);
      }
      return tone(scg, b / 0.38 * 0.6);
    }

    // === 1. FILL CANVAS WITH NEAR-BLACK (crevice color) ===
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        // Very dark base — the gaps between scales
        const sl = sphereLight(x, y);
        pc.setPixel(x, y, tone(scg, sl * 0.15));
      }
    }

    // === 2. GENERATE LARGE IRREGULAR SCALES ===
    // Voronoi-like: scatter seed points, each owns a region
    const scaleSeeds = [];

    // Brow ridge — huge plates above eye
    for (let i = 0; i < 8; i++) {
      scaleSeeds.push({
        x: 30 + i * 30 + (rng() - 0.5) * 15,
        y: 20 + (rng() - 0.5) * 15 + Math.sin(i * 0.7) * 10,
        size: 22 + rng() * 10,
        zone: 'brow',
      });
    }

    // Above eye — large plates
    for (let i = 0; i < 10; i++) {
      scaleSeeds.push({
        x: 20 + i * 25 + (rng() - 0.5) * 10,
        y: 55 + (rng() - 0.5) * 12,
        size: 18 + rng() * 8,
        zone: 'upper',
      });
    }

    // Around socket — medium scales
    for (let a = 0; a < 24; a++) {
      const angle = (a / 24) * Math.PI * 2;
      const r = 65 + rng() * 15;
      scaleSeeds.push({
        x: cx + r * Math.cos(angle) + (rng() - 0.5) * 10,
        y: cy + r * 0.7 * Math.sin(angle) + (rng() - 0.5) * 8,
        size: 12 + rng() * 6,
        zone: 'socket',
      });
    }

    // Below eye — medium plates
    for (let i = 0; i < 12; i++) {
      scaleSeeds.push({
        x: 20 + i * 22 + (rng() - 0.5) * 10,
        y: 195 + (rng() - 0.5) * 15,
        size: 14 + rng() * 8,
        zone: 'lower',
      });
    }

    // Fill remaining space — scattered medium/small scales
    for (let i = 0; i < 80; i++) {
      const sx = rng() * 256;
      const sy = rng() * 256;
      const distFromEye = Math.sqrt((sx - cx) ** 2 + ((sy - cy) * 1.3) ** 2);
      if (distFromEye < 50) continue;
      const size = distFromEye < 80 ? 6 + rng() * 6 : 10 + rng() * 10;
      scaleSeeds.push({ x: sx, y: sy, size, zone: 'fill' });
    }

    // Near-eye tiny scales
    for (let a = 0; a < 30; a++) {
      const angle = (a / 30) * Math.PI * 2;
      const r = 45 + rng() * 12;
      scaleSeeds.push({
        x: cx + r * Math.cos(angle) + (rng() - 0.5) * 6,
        y: cy + r * 0.65 * Math.sin(angle) + (rng() - 0.5) * 5,
        size: 5 + rng() * 4,
        zone: 'near',
      });
    }

    // Draw each scale as a convex 3D form
    for (const seed of scaleSeeds) {
      const { x: sx, y: sy, size } = seed;
      const halfS = Math.round(size / 2);
      const globalB = sphereLight(sx, sy);

      for (let dy = -halfS; dy <= halfS; dy++) {
        for (let dx = -halfS; dx <= halfS; dx++) {
          const px = Math.round(sx + dx);
          const py = Math.round(sy + dy);
          if (px < 0 || px >= 256 || py < 0 || py >= 256) continue;

          // Irregular shape — slightly randomized boundary
          const shapeDist = Math.sqrt(dx * dx * (1 + 0.3 * Math.sin(Math.atan2(dy, dx) * 3)) +
                                       dy * dy * (1 + 0.2 * Math.cos(Math.atan2(dy, dx) * 5)));
          if (shapeDist > halfS * 0.9) continue;

          // Don't draw inside eye area
          const edx = px - cx, edy = py - cy;
          const eyeDist = (edx * edx) / ((eyeRX + 8) * (eyeRX + 8)) + (edy * edy) / ((eyeRY + 8) * (eyeRY + 8));
          if (eyeDist < 0.85) continue;

          // Per-pixel 3D normal on convex scale surface
          const nx = dx / (halfS + 1);
          const ny = (dy / (halfS + 1) - 0.15); // bias upward — top faces light
          const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));

          // Light dot product
          const localDot = Math.max(0, -0.45 * nx - 0.55 * ny + 0.65 * nz);

          // Combine global position lighting with local surface lighting
          let brightness = globalB * 0.3 + localDot * 0.7;

          // Edge darkening — scales darken at their border
          const edgeFade = shapeDist / (halfS * 0.9);
          if (edgeFade > 0.75) {
            brightness *= 1 - (edgeFade - 0.75) / 0.25 * 0.6;
          }

          brightness += (rng() - 0.5) * 0.02;
          pc.setPixel(px, py, scaleColor(Math.max(0, Math.min(1, brightness))));
        }
      }

      // Specular highlight on each scale — small bright dot, upper-left
      if (globalB > 0.25 && size > 6) {
        const specX = Math.round(sx - halfS * 0.25);
        const specY = Math.round(sy - halfS * 0.3);
        if (specX >= 0 && specX < 256 && specY >= 0 && specY < 256) {
          const specBright = Math.min(1, globalB + 0.35);
          pc.setPixel(specX, specY, scaleColor(specBright));
          if (size > 12 && specX + 1 < 256) {
            pc.setPixel(specX + 1, specY, scaleColor(specBright * 0.9));
            if (specY + 1 < 256) pc.setPixel(specX, specY + 1, scaleColor(specBright * 0.85));
          }
        }
      }
    }

    // === 3. BONE SPIKES above eye ===
    const spikeData = [
      { x: cx - 35, y: cy - 42, angle: -0.6, len: 28, w: 7 },
      { x: cx - 15, y: cy - 48, angle: -0.3, len: 32, w: 8 },
      { x: cx + 8,  y: cy - 50, angle: 0.0,  len: 35, w: 9 },
      { x: cx + 30, y: cy - 46, angle: 0.25, len: 30, w: 7 },
      { x: cx + 48, y: cy - 40, angle: 0.5,  len: 24, w: 6 },
    ];

    for (const spike of spikeData) {
      const cosA = Math.cos(spike.angle - Math.PI / 2);
      const sinA = Math.sin(spike.angle - Math.PI / 2);

      for (let along = 0; along < spike.len; along++) {
        const t = along / spike.len;
        const width = Math.round(spike.w * (1 - t * 0.7)); // tapers toward tip

        for (let across = -width; across <= width; across++) {
          const px = Math.round(spike.x + along * sinA + across * cosA);
          const py = Math.round(spike.y - along * cosA + across * sinA);
          if (px < 0 || px >= 256 || py < 0 || py >= 256) continue;

          // 3D shading on spike
          const crossT = across / (width + 1);
          const nxS = crossT * 0.8;
          const nyS = -0.3 + t * 0.2;
          const nzS = Math.sqrt(Math.max(0.1, 1 - nxS * nxS - nyS * nyS));
          const sDot = Math.max(0, -0.45 * nxS - 0.55 * nyS + 0.65 * nzS);

          let boneBright = 0.15 + sDot * 0.7;
          // Tip is darker
          if (t > 0.7) boneBright *= 1 - (t - 0.7) / 0.3 * 0.4;

          pc.setPixel(px, py, tone(bg, Math.max(0, Math.min(1, boneBright))));
        }
      }
    }

    // === 4. EYE SOCKET — deep recessed cavity ===
    for (let y = cy - 42; y <= cy + 42; y++) {
      for (let x = cx - 62; x <= cx + 62; x++) {
        const dx = x - cx, dy = y - cy;
        const eDist = Math.sqrt((dx * dx) / (58 * 58) + (dy * dy) / (38 * 38));
        if (eDist > 1 || eDist < 0.82) continue;

        // Deep shadow rim
        const rimT = (eDist - 0.82) / 0.18;
        pc.setPixel(x, y, tone(fg, Math.max(0, (1 - rimT) * 0.15)));
      }
    }

    // Inner socket flesh
    for (let y = cy - 36; y <= cy + 36; y++) {
      for (let x = cx - 56; x <= cx + 56; x++) {
        const dx = x - cx, dy = y - cy;
        const eDist = Math.sqrt((dx * dx) / (52 * 52) + (dy * dy) / (32 * 32));
        if (eDist > 1) continue;

        const fnx = -dx / 56;
        const fny = -dy / 36;
        const fnz = Math.sqrt(Math.max(0.05, 1 - fnx * fnx - fny * fny));
        const fDot = Math.max(0, -0.4 * fnx - 0.5 * fny + 0.7 * fnz);
        pc.setPixel(x, y, tone(fg, 0.1 + fDot * 0.45));
      }
    }

    // === 5. SCLERA — curved eyeball ===
    for (let y = cy - eyeRY; y <= cy + eyeRY; y++) {
      for (let x = cx - eyeRX; x <= cx + eyeRX; x++) {
        const dx = x - cx, dy = y - cy;
        const xFrac = Math.abs(dx) / eyeRX;
        const maxDY = eyeRY * (1 - xFrac * xFrac) * 0.88;
        if (Math.abs(dy) > maxDY) continue;

        // Sphere normal
        const enx = dx / eyeRX;
        const eny = dy / (eyeRY * 1.15);
        const enz = Math.sqrt(Math.max(0.05, 1 - enx * enx - eny * eny));
        const eDot = Math.max(0, -0.35 * enx - 0.45 * eny + 0.8 * enz);

        // Corner + lid AO
        const edgeAO = 1 - Math.pow(Math.abs(dy) / maxDY, 2) * 0.45;
        const cornerAO = 1 - Math.pow(xFrac, 2.5) * 0.5;

        pc.setPixel(x, y, tone(sg, Math.max(0.03, (0.15 + eDot * 0.7) * edgeAO * cornerAO)));
      }
    }

    // Blood vessels
    for (let v = 0; v < 18; v++) {
      const angle = (v / 18) * Math.PI * 2 + rng() * 0.2;
      const startR = 30, endR = 42 + rng() * 8;
      let wobble = 0;
      for (let r = startR; r < endR; r++) {
        wobble += (rng() - 0.5) * 0.5;
        const vx = Math.round(cx + r * Math.cos(angle) + wobble);
        const vy = Math.round(cy + r * 0.58 * Math.sin(angle) + wobble * 0.2);
        if (vx < 0 || vx >= 256 || vy < 0 || vy >= 256) continue;
        const vxf = Math.abs(vx - cx) / eyeRX;
        if (Math.abs(vy - cy) <= eyeRY * (1 - vxf * vxf) * 0.88) {
          pc.setPixel(vx, vy, tone(fg, 0.3));
        }
      }
    }

    // === 6. IRIS — multi-color bands ===
    const irisR = 28;
    const pupilRX = 6, pupilRY = 24;

    for (let y = cy - irisR - 1; y <= cy + irisR + 1; y++) {
      for (let x = cx - irisR - 1; x <= cx + irisR + 1; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > irisR) continue;

        const pupilCheck = (dx * dx) / (pupilRX * pupilRX) + (dy * dy) / (pupilRY * pupilRY);
        if (pupilCheck <= 1) continue;

        const angle = Math.atan2(dy, dx);
        const radialT = dist / irisR; // 0=center, 1=edge

        // Concave bowl lighting
        const inx = -dx / (irisR * 1.3);
        const iny = -dy / (irisR * 1.3);
        const inz = Math.sqrt(Math.max(0.1, 1 - inx * inx - iny * iny));
        const iDot = Math.max(0, -0.35 * inx - 0.45 * iny + 0.75 * inz);

        // Radial fibers — individually distinct, not sine wave
        const fiberAngle = angle * 30;
        const fiberPhase = Math.floor(fiberAngle / Math.PI);
        const fiberT = (fiberAngle / Math.PI - fiberPhase);
        // Each fiber is a bright streak with dark gaps
        const fiber = fiberT > 0.15 && fiberT < 0.85 ? 0.7 + (0.5 - Math.abs(fiberT - 0.5)) * 0.6 : 0.2;

        // Concentric rings
        const ring = Math.sin(dist * 1.2) * 0.08;

        let brightness = iDot * 0.5 + fiber * 0.35 + ring + 0.1;

        // Color band selection based on radial position
        // Outer ring: green
        // Middle: gold-orange
        // Inner (near pupil): deep orange
        let irisColor;
        if (radialT > 0.75) {
          // Outer — green, with dark limbal ring at very edge
          const limbalDark = radialT > 0.88 ? (1 - (radialT - 0.88) / 0.12 * 0.7) : 1;
          brightness *= limbalDark;
          irisColor = tone(igg, Math.max(0, Math.min(1, brightness)));
        } else if (radialT > 0.35) {
          // Middle — golden orange
          irisColor = tone(ig, Math.max(0, Math.min(1, brightness)));
        } else {
          // Inner — darker orange, muted near pupil
          brightness *= 0.5 + radialT * 1.3;
          irisColor = tone(ig, Math.max(0, Math.min(1, brightness * 0.75)));
        }

        // Transition zones — blend at boundaries
        if (radialT > 0.7 && radialT <= 0.75) {
          // Green/gold transition
          irisColor = rng() < (radialT - 0.7) / 0.05
            ? tone(igg, Math.max(0, Math.min(1, brightness)))
            : tone(ig, Math.max(0, Math.min(1, brightness)));
        }

        brightness += (rng() - 0.5) * 0.03;
        pc.setPixel(x, y, irisColor);
      }
    }

    // Bright gold flecks in mid-iris
    for (let f = 0; f < 50; f++) {
      const fa = rng() * Math.PI * 2;
      const fr = 8 + rng() * 14;
      const fx = Math.round(cx + fr * Math.cos(fa));
      const fy = Math.round(cy + fr * Math.sin(fa));
      if (fx >= 0 && fx < 256 && fy >= 0 && fy < 256) {
        pc.setPixel(fx, fy, tone(ig, 0.88 + rng() * 0.12));
      }
    }

    // === 7. PUPIL ===
    for (let y = cy - pupilRY - 1; y <= cy + pupilRY + 1; y++) {
      for (let x = cx - pupilRX - 1; x <= cx + pupilRX + 1; x++) {
        const dx = x - cx, dy = y - cy;
        const pCheck = (dx * dx) / (pupilRX * pupilRX) + (dy * dy) / (pupilRY * pupilRY);
        if (pCheck <= 1) {
          pc.setPixel(x, y, tone(pg, Math.sqrt(pCheck) * 0.05));
        } else if (pCheck <= 1.15) {
          pc.setPixel(x, y, tone(ig, 0.06));
        }
      }
    }

    // === 8. EYELIDS — thick scaly folds ===
    // Upper lid
    for (let x = cx - eyeRX - 10; x <= cx + eyeRX + 10; x++) {
      const dx = x - cx;
      const xFrac = Math.abs(dx) / (eyeRX + 10);
      if (xFrac > 1) continue;
      const lidEdgeY = cy - eyeRY * (1 - xFrac * xFrac) * 0.88 - 2;
      const thickness = Math.round(14 + (1 - xFrac) * 10);
      const gb = sphereLight(x, cy - 35);

      for (let dy = 0; dy < thickness; dy++) {
        const py = Math.round(lidEdgeY - dy);
        if (py < 0 || py >= 256 || x < 0 || x >= 256) continue;

        const foldT = dy / thickness;
        const lny = -0.9 + foldT * 1.5;
        const lnz = Math.sqrt(Math.max(0.05, 1 - lny * lny * 0.7));
        const lDot = Math.max(0, -0.55 * lny + 0.6 * lnz);
        let lidB = gb * 0.3 + lDot * 0.65;
        lidB += (rng() - 0.5) * 0.02;
        pc.setPixel(x, py, scaleColor(lidB));
      }

      // Crease
      const creaseY = Math.round(lidEdgeY - thickness * 0.5);
      if (creaseY >= 0 && creaseY + 1 < 256 && x >= 0 && x < 256) {
        pc.setPixel(x, creaseY, tone(scg, 0.0));
        pc.setPixel(x, creaseY + 1, scaleColor(gb * 0.5));
      }

      // Lid edge shadow — deep black line where lid meets eyeball
      const edgeY = Math.round(lidEdgeY);
      if (edgeY >= 0 && edgeY + 2 < 256 && x >= 0 && x < 256) {
        pc.setPixel(x, edgeY, tone(pg, 0.0));
        pc.setPixel(x, edgeY + 1, tone(fg, 0.04));
        if (edgeY + 2 < 256) pc.setPixel(x, edgeY + 2, tone(fg, 0.1));
      }
    }

    // Lower lid
    for (let x = cx - eyeRX - 6; x <= cx + eyeRX + 6; x++) {
      const dx = x - cx;
      const xFrac = Math.abs(dx) / (eyeRX + 6);
      if (xFrac > 1) continue;
      const lidEdgeY = cy + eyeRY * (1 - xFrac * xFrac) * 0.88 + 2;
      const thickness = Math.round(8 + (1 - xFrac) * 6);
      const gb = sphereLight(x, cy + 30);

      for (let dy = 0; dy < thickness; dy++) {
        const py = Math.round(lidEdgeY + dy);
        if (py < 0 || py >= 256 || x < 0 || x >= 256) continue;

        const foldT = dy / thickness;
        const lny = 0.7 - foldT * 1.0;
        const lnz = Math.sqrt(Math.max(0.05, 1 - lny * lny * 0.7));
        const lDot = Math.max(0, -0.55 * lny + 0.6 * lnz);
        pc.setPixel(x, py, scaleColor(gb * 0.3 + lDot * 0.5));
      }

      const edgeY = Math.round(lidEdgeY);
      if (edgeY >= 0 && edgeY < 256 && x >= 0 && x < 256) {
        pc.setPixel(x, edgeY, tone(pg, 0.0));
        if (edgeY - 1 >= 0) pc.setPixel(x, edgeY - 1, tone(fg, 0.06));
      }
    }

    // === 9. WRINKLES at eye corners ===
    for (let w = 0; w < 16; w++) {
      const side = w < 8 ? -1 : 1;
      const idx = w % 8;
      const baseAngle = side === -1 ? (Math.PI + (idx - 4) * 0.12) : ((idx - 4) * 0.12);
      const startR = 48 + rng() * 8;
      const endR = startR + 10 + rng() * 18;
      let wobble = 0;

      for (let r = startR; r < endR; r++) {
        wobble += (rng() - 0.5) * 0.2;
        const wx = Math.round(cx + r * Math.cos(baseAngle + wobble * 0.01));
        const wy = Math.round(cy + r * 0.65 * Math.sin(baseAngle + wobble * 0.01));
        if (wx < 1 || wx >= 255 || wy < 1 || wy >= 255) continue;

        pc.setPixel(wx, wy, tone(scg, 0.0));
        pc.setPixel(wx, wy - 1, scaleColor(sphereLight(wx, wy) * 0.7 + 0.1));
      }
    }
  },

  drawPost(pc, pal) {
    const hg = pal.groups.highlight;
    const ig = pal.groups.iris;
    const igg = pal.groups.irisgreen;
    const sg = pal.groups.sclera;
    const slg = pal.groups.scalelit;
    const fg = pal.groups.flesh;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }

    const cx = 130, cy = 135;
    const eyeRX = 52, eyeRY = 30;

    // === SPECULAR on eyeball — primary ===
    const s1x = cx - 10, s1y = cy - 9;
    for (let y = s1y - 6; y <= s1y + 6; y++) {
      for (let x = s1x - 6; x <= s1x + 6; x++) {
        const d = Math.sqrt((x - s1x) ** 2 + (y - s1y) ** 2);
        if (d > 6 || x < 0 || x >= 256 || y < 0 || y >= 256) continue;
        if (d <= 3) pc.setPixel(x, y, tone(hg, 1.0));
        else pc.setPixel(x, y, tone(hg, 0.6 * (1 - (d - 3) / 3)));
      }
    }

    // Secondary specular
    const s2x = cx + 14, s2y = cy + 5;
    for (let y = s2y - 3; y <= s2y + 3; y++) {
      for (let x = s2x - 3; x <= s2x + 3; x++) {
        const d = Math.sqrt((x - s2x) ** 2 + (y - s2y) ** 2);
        if (d <= 3 && x >= 0 && x < 256 && y >= 0 && y < 256) {
          pc.setPixel(x, y, tone(hg, 0.4 + (1 - d / 3) * 0.5));
        }
      }
    }

    // === WET LID EDGES ===
    for (let x = cx - 48; x <= cx + 48; x++) {
      const dx = x - cx;
      const xFrac = Math.abs(dx) / 52;
      if (xFrac > 1) continue;
      const wetB = 0.25 + (1 - xFrac) * 0.5;

      const upperY = Math.round(cy - eyeRY * (1 - xFrac * xFrac) * 0.88);
      if (upperY >= 0 && upperY + 1 < 256 && x >= 0 && x < 256) {
        pc.setPixel(x, upperY, tone(hg, wetB * 0.7));
        pc.setPixel(x, upperY + 1, tone(sg, 0.75));
      }
    }

    // === IRIS RING HIGHLIGHT ===
    for (let a = 200; a < 310; a++) {
      const rad = a * Math.PI / 180;
      const hx = Math.round(cx + 27 * Math.cos(rad));
      const hy = Math.round(cy + 27 * Math.sin(rad));
      if (hx >= 0 && hx < 256 && hy >= 0 && hy < 256) {
        pc.setPixel(hx, hy, tone(ig, 0.95));
      }
    }

    // === LIMBAL RING ===
    for (let a = 0; a < 360; a++) {
      const rad = a * Math.PI / 180;
      for (let dr = 0; dr < 2; dr++) {
        const lx = Math.round(cx + (28 + dr) * Math.cos(rad));
        const ly = Math.round(cy + (28 + dr) * Math.sin(rad));
        if (lx >= 0 && lx < 256 && ly >= 0 && ly < 256) {
          pc.setPixel(lx, ly, tone(igg, 0.02));
        }
      }
    }

    // === SCALE SPECULAR HIGHLIGHTS — on lit-side scales ===
    const rng2 = sf2_seededRNG(888);
    for (let s = 0; s < 80; s++) {
      const sx = Math.round(rng2() * 255);
      const sy = Math.round(rng2() * 255);
      const dx = sx - cx, dy = sy - cy;
      if (dx > 10 || dy > 5) continue; // upper-left only
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 55) continue;
      if (pc.isFilled(sx, sy) && sy > 1) {
        pc.setPixel(sx, sy, tone(slg, 0.85 + rng2() * 0.15));
        pc.setPixel(sx, sy - 1, tone(slg, 0.75));
      }
    }
  },
};
