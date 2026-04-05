// Phase 2, Exercise 2.5: Still life — 3 objects grouped
// Training target: value hierarchy — focal point through contrast, depth via overlap

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { grey: '#888888' },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.grey.startIdx); },

  drawPost(pc, pal) {
    const g = pal.groups.grey;
    function tone(frac) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1,
        Math.round(frac * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const lx = -0.55, ly = -0.65, lz = 0.52;

    function drawSphere(cx, cy, r, contrastBoost) {
      contrastBoost = contrastBoost || 1;
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy > r * r) continue;
          if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;

          const nx = dx / r, ny = dy / r;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const NdotL = nx * lx + ny * ly + nz * lz;
          const diffuse = Math.max(0, NdotL);
          const rz = 2 * NdotL * nz - lz;
          const specular = Math.pow(Math.max(0, rz), 50) * 0.6 * contrastBoost;
          const ambient = 0.03;
          const reflected = Math.max(0, ny * 0.3) * 0.1;
          let core = 0;
          if (NdotL >= -0.03 && NdotL <= 0.16) {
            core = Math.max(0, 1 - Math.abs(NdotL - 0.05) / 0.11) * 0.06;
          }

          let v = ambient + diffuse * 0.68 * contrastBoost + specular + reflected - core;
          v = Math.max(0, Math.min(1, v));
          v = v * v * (3 - 2 * v);
          pc.setPixel(x, y, tone(Math.max(0.02, v)));
        }
      }
    }

    function drawCylinder(cx, topY, botY, rx, ry) {
      // Body
      for (let y = topY; y <= botY; y++) {
        for (let x = cx - rx; x <= cx + rx; x++) {
          const xFrac = (x - cx) / rx;
          if (Math.abs(xFrac) > 1) continue;
          if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;

          const nx = xFrac;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx));
          const NdotL = nx * lx + nz * lz;
          const diffuse = Math.max(0, NdotL);
          const rz = 2 * NdotL * nz - lz;
          const specular = Math.pow(Math.max(0, rz), 60) * 0.4;
          const vertFade = ((y - topY) / (botY - topY)) * 0.05;

          let v = 0.04 + diffuse * 0.62 + specular - vertFade;
          v = Math.max(0, Math.min(1, v));
          v = v * v * (3 - 2 * v);
          pc.setPixel(x, y, tone(Math.max(0.02, v)));
        }
      }
      // Top face
      for (let y = topY - ry; y <= topY + ry; y++) {
        for (let x = cx - rx; x <= cx + rx; x++) {
          const dx = (x - cx) / rx, dy = (y - topY) / ry;
          if (dx * dx + dy * dy > 1) continue;
          if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;
          const v = 0.04 + Math.max(0, -ly) * 0.55;
          pc.setPixel(x, y, tone(Math.max(0.03, v * v * (3 - 2 * v))));
        }
      }
    }

    // Background — subtle gradient, darker than ground
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const d = y / 128;
        pc.setPixel(x, y, tone(Math.max(0.02, 0.1 + d * 0.04)));
      }
    }

    // Ground plane
    const groundY = 100;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const d = (y - groundY) / (128 - groundY);
        pc.setPixel(x, y, tone(Math.max(0.06, 0.3 - d * 0.1)));
      }
    }

    // Cast shadows for all objects (draw before objects)
    // Back cylinder shadow
    for (let y = groundY; y < groundY + 6; y++) {
      for (let x = 80; x < 115; x++) {
        if (x >= 128) continue;
        const dx = (x - 96) / 18, dy = (y - groundY - 2) / 4;
        if (dx * dx + dy * dy < 1) {
          pc.setPixel(x, y, tone(Math.max(0.04, 0.25 * (0.6 + (dx * dx + dy * dy) * 0.4))));
        }
      }
    }

    // Main sphere shadow (largest, most prominent)
    for (let y = groundY; y < groundY + 8; y++) {
      for (let x = 44; x < 90; x++) {
        const dx = (x - 66) / 22, dy = (y - groundY - 3) / 5;
        if (dx * dx + dy * dy < 1) {
          pc.setPixel(x, y, tone(Math.max(0.03, 0.26 * (0.5 + (dx * dx + dy * dy) * 0.5))));
        }
      }
    }

    // BACK OBJECT: tall cylinder (partially occluded by sphere) — lower contrast
    drawCylinder(90, 40, 96, 14, 5);

    // MIDDLE OBJECT: sphere (focal point) — highest contrast
    drawSphere(56, 68, 28, 1.2);

    // FRONT OBJECT: small sphere — lower contrast (slightly muted)
    drawSphere(30, 86, 14, 0.8);

    // Occlusion shadow where small sphere meets ground
    for (let x = 20; x < 42; x++) {
      if (x >= 0 && x < 128 && groundY >= 0 && groundY < 128) {
        const dx = (x - 30) / 11;
        if (Math.abs(dx) < 1) {
          pc.setPixel(x, groundY, tone(0.04));
        }
      }
    }

    // Occlusion where main sphere meets ground
    for (let x = 34; x < 80; x++) {
      if (x >= 0 && x < 128 && groundY >= 0 && groundY < 128) {
        const dx = (x - 56) / 22;
        if (Math.abs(dx) < 1) {
          const w = 1 - dx * dx;
          pc.setPixel(x, groundY, tone(Math.max(0.02, 0.05 * (1 - w * 0.6))));
        }
      }
    }
  },
};
