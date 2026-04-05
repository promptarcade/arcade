// Phase 3, Exercise 3.3: Two spheres — warm and cool — side by side
// Training target: colour temperature contrast. Same light, different materials.

module.exports = {
  width: 128,
  height: 80,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    warmlit: '#cc3322',
    warmshd: '#662244',
    coollit: '#2255aa',
    coolshd: '#443366',
    highlight: '#ffeedd',
    ground: '#777777',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.ground.startIdx); },

  drawPost(pc, pal) {
    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const lx = -0.55, ly = -0.65, lz = 0.52;
    const hg = pal.groups.highlight;
    const gg = pal.groups.ground;

    // Ground
    const groundY = 62;
    for (let y = groundY; y < 80; y++) {
      for (let x = 0; x < 128; x++) {
        pc.setPixel(x, y, tone(gg, Math.max(0.1, 0.45 - ((y - groundY) / 18) * 0.1)));
      }
    }

    function drawSphere(cx, cy, r, litGroup, shdGroup) {
      // Cast shadow
      const shCX = cx + 12;
      for (let y = groundY; y < groundY + 6; y++) {
        for (let x = shCX - 18; x <= shCX + 18; x++) {
          if (x < 0 || x >= 128 || y >= 80) continue;
          const dx = (x - shCX) / 18, dy = (y - (groundY + 2)) / 4;
          const d = dx * dx + dy * dy;
          if (d < 1) pc.setPixel(x, y, tone(gg, Math.max(0.05, 0.35 * (0.6 + d * 0.4))));
        }
      }

      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy > r * r) continue;
          if (x < 0 || x >= 128 || y < 0 || y >= 80) continue;

          const nx = dx / r, ny = dy / r;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const NdotL = nx * lx + ny * ly + nz * lz;
          const diffuse = Math.max(0, NdotL);
          const rr = 2 * NdotL * nz - lz;
          const specular = Math.pow(Math.max(0, rr), 50) * 0.65;
          const bounce = Math.max(0, ny * 0.35) * 0.13;

          let core = 0;
          if (NdotL >= -0.03 && NdotL <= 0.18) {
            core = Math.max(0, 1 - Math.abs(NdotL - 0.06) / 0.12) * 0.07;
          }

          let value = 0.03 + diffuse * 0.68 + bounce + Math.pow(1 - nz, 4) * 0.05 - core;
          value = Math.max(0, Math.min(1, value));
          value = value * value * (3 - 2 * value);

          if (specular > 0.1) {
            pc.setPixel(x, y, tone(hg, Math.min(1, 0.5 + specular)));
          } else if (value > 0.4) {
            pc.setPixel(x, y, tone(litGroup, value));
          } else if (value > 0.15) {
            const mixT = (value - 0.15) / 0.25;
            pc.setPixel(x, y, tone(mixT > 0.5 ? litGroup : shdGroup, value * (mixT > 0.5 ? 0.9 : 1.2) + (mixT > 0.5 ? 0 : 0.1)));
          } else {
            pc.setPixel(x, y, tone(shdGroup, Math.max(0.05, value * 1.5 + bounce * 2)));
          }
        }
      }

      // Contact
      for (let x = cx - r/3; x <= cx + r/3; x++) {
        if (x >= 0 && x < 128 && groundY < 80) {
          pc.setPixel(x, groundY, tone(shdGroup, 0.04));
        }
      }
    }

    // Warm sphere (left) and cool sphere (right)
    drawSphere(38, 38, 22, pal.groups.warmlit, pal.groups.warmshd);
    drawSphere(90, 38, 22, pal.groups.coollit, pal.groups.coolshd);
  },
};
