// Level 5.1: Eyes at Multiple Scales
// 12px head: 2×2 eyes (dark + specular)
// 16px head: 3×3 eyes (iris + pupil + specular)
// 20px head: 4×4 eyes (white + iris + pupil + specular + lid line)
// Each must be the dominant face feature at its scale
// Layout: 3 heads side by side (96 × 48)
module.exports = {
  width: 96,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    skinLit: '#F2C4A0',
    skinShd: '#9B7B8A',
    hairLit: '#8B6542',
    hairShd: '#4A3B5A',
    eyeWhite: '#EEEEF0',
    eyeIris: '#4488BB',
    eyePupil: '#181828',
    eyeShd: '#887888',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.skinLit.startIdx); },
  drawPost(pc, pal) {
    const TW = 96, TH = 48;
    const pg = pal.groups;

    function tone(grp, frac) {
      return grp.startIdx + Math.max(0, Math.min(grp.toneCount - 1,
        Math.round(frac * (grp.toneCount - 1))));
    }
    function dt(wg, cg, v) {
      return v > 0.38 ? tone(wg, v) : tone(cg, Math.max(0.04, v * 1.2));
    }

    const sk = { w: pg.skinLit, c: pg.skinShd };
    const hr = { w: pg.hairLit, c: pg.hairShd };

    pc.pixels[0] = 0;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    function sphereV(x, y, scx, scy, r) {
      const nx = (x - scx) / r, ny = (y - scy) / r;
      const nz2 = 1 - nx * nx - ny * ny;
      if (nz2 < 0) return -1;
      const nz = Math.sqrt(nz2);
      const NdotL = nx * lx + ny * ly + nz * lz;
      const diffuse = Math.max(0, NdotL);
      const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 35) * 0.2;
      const bounce = Math.max(0, ny * 0.3) * 0.1;
      let v = 0.04 + diffuse * 0.68 + specular + bounce;
      v = v * v * (3 - 2 * v);
      return Math.max(0.02, Math.min(1, v));
    }

    function px(x, y, mat, v) {
      if (x >= 0 && x < TW && y >= 0 && y < TH)
        pc.setPixel(x, y, dt(mat.w, mat.c, v));
    }
    function pxc(x, y, grp, v) {
      if (x >= 0 && x < TW && y >= 0 && y < TH)
        pc.setPixel(x, y, tone(grp, Math.max(0, Math.min(1, v))));
    }

    // Draw a head with face and hair
    function drawHead(cx, cy, r) {
      // Head sphere
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          if (x < 0 || x >= TW || y < 0 || y >= TH) continue;
          const nx = (x - cx) / r, ny = (y - cy) / r;
          if (nx * nx + ny * ny > 1) continue;
          let v = sphereV(x, y, cx, cy, r);
          if (v < 0) continue;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          if (ny > -0.2 && ny < 0.6 && Math.abs(nx) < 0.55 && nz > 0.6)
            v = 0.5 + v * 0.5;
          px(x, y, sk, v);
        }
      }

      // Hair on top
      for (let y = cy - r - 2; y <= cy - Math.round(r * 0.2); y++) {
        if (y < 0) continue;
        const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y - cy) / r) ** 2)) * r);
        for (let x = cx - headHW - 1; x <= cx + headHW + 1; x++) {
          if (x < 0 || x >= TW) continue;
          let v = sphereV(x, y, cx, cy, r + 1);
          if (v < 0) continue;
          v *= 0.7;
          px(x, y, hr, v);
        }
      }

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            px(cx - r + dx, cy + 1 + dy, sk, 0.25);
            px(cx + r + dx, cy + 1 + dy, sk, 0.6);
          }
    }

    // ========================================
    // 1. SMALL HEAD (12px radius=6) — 2×2 eyes
    // ========================================
    {
      const cx = 14, cy = 24, r = 6;
      drawHead(cx, cy, r);

      // Eye positions: centered on face, gap=3
      const eyeY = cy; // eyes at center
      const eyeGap = 3;
      const leX = cx - Math.floor(eyeGap / 2) - 1; // left eye left edge
      const reX = cx + Math.ceil(eyeGap / 2);       // right eye left edge

      // 2×2 eyes: dark fill + specular dot
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          pxc(leX + dx, eyeY + dy, pg.eyePupil, 0.8);
          pxc(reX + dx, eyeY + dy, pg.eyePupil, 0.8);
        }
      }
      // Specular: 1px upper-left of each eye
      pxc(leX, eyeY, pg.eyeWhite, 0.95);
      pxc(reX, eyeY, pg.eyeWhite, 0.95);

      // Mouth: 3px line below eyes
      const mouthY = cy + Math.round(r * 0.4);
      for (let dx = -1; dx <= 1; dx++)
        px(cx + dx, mouthY, sk, 0.3);
    }

    // ========================================
    // 2. MEDIUM HEAD (16px radius=8) — 3×3 eyes
    // ========================================
    {
      const cx = 44, cy = 24, r = 8;
      drawHead(cx, cy, r);

      const eyeY = cy - 1;
      const eyeGap = 4;
      const leX = cx - Math.floor(eyeGap / 2) - 2;
      const reX = cx + Math.ceil(eyeGap / 2);

      // 3×3 eyes: iris fill + pupil center + specular
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          pxc(leX + dx, eyeY + dy, pg.eyeIris, 0.6);
          pxc(reX + dx, eyeY + dy, pg.eyeIris, 0.6);
        }
      }
      // Pupil: center pixel darker
      pxc(leX + 1, eyeY + 1, pg.eyePupil, 0.9);
      pxc(reX + 1, eyeY + 1, pg.eyePupil, 0.9);
      // Specular: upper-left
      pxc(leX, eyeY, pg.eyeWhite, 0.95);
      pxc(reX, eyeY, pg.eyeWhite, 0.95);
      // Upper lid line (1px dark above)
      for (let dx = 0; dx < 3; dx++) {
        pxc(leX + dx, eyeY - 1, pg.eyePupil, 0.6);
        pxc(reX + dx, eyeY - 1, pg.eyePupil, 0.6);
      }

      // Mouth
      const mouthY = cy + Math.round(r * 0.35);
      for (let dx = -1; dx <= 1; dx++)
        px(cx + dx, mouthY, sk, 0.3);
    }

    // ========================================
    // 3. LARGE HEAD (20px radius=10) — 4×4 eyes
    // ========================================
    {
      const cx = 78, cy = 26, r = 10;
      drawHead(cx, cy, r);

      const eyeY = cy - 2;
      const eyeGap = 5;
      const leX = cx - Math.floor(eyeGap / 2) - 3;
      const reX = cx + Math.ceil(eyeGap / 2);

      // 4×4 eyes: white fill + iris + pupil + specular
      // White sclera
      for (let dy = 0; dy < 4; dy++)
        for (let dx = 0; dx < 4; dx++) {
          pxc(leX + dx, eyeY + dy, pg.eyeWhite, 0.85);
          pxc(reX + dx, eyeY + dy, pg.eyeWhite, 0.85);
        }
      // Iris (2×3 in center-bottom)
      for (let dy = 1; dy < 4; dy++)
        for (let dx = 1; dx < 3; dx++) {
          pxc(leX + dx, eyeY + dy, pg.eyeIris, 0.5 + dy * 0.1);
          pxc(reX + dx, eyeY + dy, pg.eyeIris, 0.5 + dy * 0.1);
        }
      // Pupil (2×2 center)
      for (let dy = 1; dy < 3; dy++)
        for (let dx = 1; dx < 3; dx++) {
          pxc(leX + dx, eyeY + dy, pg.eyePupil, 0.9);
          pxc(reX + dx, eyeY + dy, pg.eyePupil, 0.9);
        }
      // Specular: 1px white upper-left of pupil
      pxc(leX + 1, eyeY + 1, pg.eyeWhite, 1.0);
      pxc(reX + 1, eyeY + 1, pg.eyeWhite, 1.0);
      // Upper lid line (1px dark above eye)
      for (let dx = 0; dx < 4; dx++) {
        pxc(leX + dx, eyeY - 1, pg.eyePupil, 0.5);
        pxc(reX + dx, eyeY - 1, pg.eyePupil, 0.5);
      }
      // Lower lid hint (subtle shadow)
      for (let dx = 0; dx < 4; dx++) {
        px(leX + dx, eyeY + 4, sk, 0.4);
        px(reX + dx, eyeY + 4, sk, 0.4);
      }

      // Mouth: wider at this scale
      const mouthY = cy + Math.round(r * 0.4);
      for (let dx = -2; dx <= 2; dx++)
        px(cx + dx, mouthY, sk, 0.32);
    }
  },
};
