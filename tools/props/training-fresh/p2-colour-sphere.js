// Phase 2: Red sphere with colour temperature — REDO
// Goals: dispersed light (high ambient), smooth gradient, reads as RED throughout
// Lesson from attempt 1: don't use separate palettes with hard cutoffs — creates bands

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#cc3530',      // main red — single palette for smooth ramp
    highlight: '#ee7755', // warm accent for tight specular only
    ground: '#887766',
    groundshd: '#554433',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const hg = pal.groups.highlight;
    const gg = pal.groups.ground;
    const gs = pal.groups.groundshd;

    function tone(group, f) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(f * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const W = 128, H = 128;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    const r = 30;
    const horizonY = 80;
    const cx = 64, cy = horizonY - r + 2;

    // --- BACKGROUND + GROUND ---
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (y < horizonY) {
          const nearH = Math.max(0, 1 - (horizonY - y) / 40);
          pc.setPixel(x, y, tone(gs, 0.08 + nearH * 0.08));
        } else {
          const depth = (y - horizonY) / (H - horizonY);
          const side = (x - 64) / 128;
          pc.setPixel(x, y, tone(gg, Math.max(0.06, 0.42 - depth * 0.05 - side * 0.06)));
        }
      }
    }

    // --- CAST SHADOW ---
    const shCx = cx + 14, shCy = horizonY + 7;
    const shRx = 38, shRy = 14;
    for (let y = shCy - shRy; y <= shCy + shRy; y++) {
      for (let x = shCx - shRx; x <= shCx + shRx; x++) {
        if (x < 0 || x >= W || y < horizonY || y >= H) continue;
        const dx = (x - shCx) / shRx, dy = (y - shCy) / shRy;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const intensity = Math.pow(1 - d2, 1.2) * 0.75;
        pc.setPixel(x, y, tone(gs, Math.max(0.02, 0.4 * (1 - intensity))));
      }
    }

    // --- SPHERE ---
    // Key change: HIGH AMBIENT (0.15) for dispersed light
    // Most of the sphere should be in the bright-to-mid range
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > r * r) continue;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;

        const nx = dx / r, ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        // Stronger, visible specular
        const specular = Math.pow(diffuse, 20) * 0.5;

        // Surface micro-texture: perturb the normal slightly per-pixel
        // This breaks up the smooth concentric bands like scales do on the dragon
        const h1 = ((x * 13397 + y * 7919) & 0xFFFF) / 65536;
        const h2 = ((x * 6271 + y * 15731) & 0xFFFF) / 65536;
        const bumpStr = 0.15;
        const bnx = nx + (h1 - 0.5) * bumpStr;
        const bny = ny + (h2 - 0.5) * bumpStr;
        const bnLen = Math.sqrt(bnx * bnx + bny * bny + nz * nz);
        const bNdotL = (bnx * lx + bny * ly + nz * lz) / bnLen;
        const bDiffuse = Math.max(0, bNdotL);
        const bSpecular = Math.pow(bDiffuse, 20) * 0.5;

        let v = 0.15 + bDiffuse * 0.55 + bSpecular;
        v = Math.max(0, Math.min(1, v));
        // Gentler S-curve — less contrast push
        v = v * v * (3 - 2 * v) * 0.75 + v * 0.25;
        v = Math.max(0.05, v);

        // Dither to soften tone boundaries
        const hash = ((x * 7919 + y * 6271) & 0xFFFF) / 65536;
        const vd = Math.max(0.05, Math.min(1, v + (hash - 0.5) * 0.05));

        // Single palette — tight specular gets highlight palette, everything else body
        if (bSpecular > 0.18) {
          pc.setPixel(x, y, tone(hg, Math.min(1, 0.5 + bSpecular)));
        } else {
          pc.setPixel(x, y, tone(bg, vd));
        }
      }
    }
  },
};
