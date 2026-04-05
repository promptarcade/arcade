// Phase 1: Greyscale sphere — form shadow, core shadow, reflected light, cast shadow
// Written from scratch for isolated training run

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    grey: '#999999',
  },

  draw(pc, pal) {
    pc.setPixel(0, 0, pal.groups.grey.startIdx);
  },

  drawPost(pc, pal) {
    const g = pal.groups.grey;
    function tone(f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1,
        Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const W = 128, H = 128;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    const r = 30;
    const horizonY = 80;  // where ground meets background
    const cx = 64, cy = horizonY - r + 2; // sink 2px into ground to hide aliased bottom

    // --- BACKGROUND + GROUND as one continuous fill ---
    // Above horizon: dark background, getting slightly lighter near horizon
    // Below horizon: ground surface, lit from upper-left, receding into distance
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (y < horizonY) {
          // Background — very subtle gradient toward horizon
          const nearHorizon = Math.max(0, 1 - (horizonY - y) / 40);
          pc.setPixel(x, y, tone(0.08 + nearHorizon * 0.08));
        } else {
          // Ground surface — brightest near horizon (distance), darker near viewer
          const depth = (y - horizonY) / (H - horizonY);  // 0=horizon, 1=bottom
          const side = (x - 64) / 128;
          // Near the horizon = far away = lighter; close to viewer = darker
          let v = 0.42 - depth * 0.12 - side * 0.05;
          pc.setPixel(x, y, tone(Math.max(0.08, v)));
        }
      }
    }

    // --- CAST SHADOW on ground ---
    const shCx = cx + 14, shCy = horizonY + 7;
    const shRx = 38, shRy = 14;
    for (let y = shCy - shRy; y <= shCy + shRy; y++) {
      for (let x = shCx - shRx; x <= shCx + shRx; x++) {
        if (x < 0 || x >= W || y < horizonY || y >= H) continue;
        const dx = (x - shCx) / shRx, dy = (y - shCy) / shRy;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const intensity = Math.pow(1 - d2, 1.2) * 0.75;
        const base = 0.42 - ((y - horizonY) / (H - horizonY)) * 0.12;
        pc.setPixel(x, y, tone(Math.max(0.02, base * (1 - intensity))));
      }
    }

    // --- SPHERE (drawn last, on top of everything) ---
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > r * r) continue;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;

        const nx = dx / r, ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const specular = Math.pow(diffuse, 14) * 0.45;
        const bounce = Math.max(0, ny * 0.35) * 0.14;

        let core = 0;
        if (NdotL > -0.04 && NdotL < 0.2) {
          const dist = Math.abs(NdotL - 0.06) / 0.14;
          core = Math.max(0, 1 - dist * dist) * 0.07;
        }

        const rim = Math.pow(1 - nz, 4) * 0.05;

        let v = 0.03 + diffuse * 0.7 + specular + bounce + rim - core;
        v = Math.max(0, Math.min(1, v));
        v = v * v * (3 - 2 * v);
        v = Math.max(0.02, v);

        pc.setPixel(x, y, tone(v));
      }
    }
  },
};
