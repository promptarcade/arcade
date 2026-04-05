// Phase 6B.3: Lantern — SHADED (silhouette verified: handle + cap + glass + base + feet)
// Compound: metal frame, glass panels (Fresnel), flame inside (self-illuminating)

module.exports = {
  width: 64,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    metal: '#776655',
    metalshd: '#443322',
    glass: '#88aacc',
    glassshd: '#334455',
    flame: '#ffaa33',
    flameyel: '#ffdd66',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.metal.startIdx); },

  drawPost(pc, pal) {
    const mg = pal.groups.metal;
    const ms = pal.groups.metalshd;
    const gg = pal.groups.glass;
    const gs = pal.groups.glassshd;
    const fg = pal.groups.flame;
    const fy = pal.groups.flameyel;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 32, lx = -0.5, ly = -0.6, lz = 0.63;

    const handleTopY = 4, capTopY = 22, capBotY = 26;
    const glassTopY = 26, glassBotY = 68;
    const baseTopY = 68, baseBotY = 78;

    // Flame position (light source inside)
    const flameCX = cx, flameCY = (glassTopY + glassBotY) / 2;
    function flameLight(x, y) {
      const dx = x - flameCX, dy = y - flameCY;
      return Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 35) * 0.5;
    }

    // HANDLE — metal arch, lit by flame from below
    for (let t = 0; t <= 1; t += 0.008) {
      const angle = Math.PI * t;
      const hx = cx + Math.cos(angle) * 12;
      const hy = capTopY - 4 - Math.sin(angle) * 16;

      for (let w = -2; w <= 2; w++) {
        const px = Math.round(hx + w), py = Math.round(hy);
        if (px < 0 || px >= 64 || py < 0 || py >= 96) continue;

        // Handle lit from below by flame + ambient from above
        const fl = flameLight(px, py);
        const aboveDot = Math.max(0, ly * (-0.8) + lz * 0.5) * 0.15;
        let v = 0.06 + fl * 0.4 + aboveDot;
        v = v * v * (3 - 2 * v);
        pc.setPixel(px, py, tone(v > 0.2 ? mg : ms, Math.max(0.03, v)));
      }
    }

    // CAP — flat metal disc
    for (let y = capTopY; y <= capBotY; y++) {
      const halfW = 16;
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 64 || y >= 96) continue;
        const nx = dx / (halfW + 1) * 0.3;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + ly * (-0.7) + lz * nz);
        const fl = flameLight(x, y);
        let v = 0.08 + dot * 0.35 + fl * 0.25;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.25 ? mg : ms, Math.max(0.04, v)));
      }
    }

    // GLASS BODY — transparent with Fresnel, flame visible through it
    for (let y = glassTopY; y <= glassBotY; y++) {
      const t = (y - glassTopY) / (glassBotY - glassTopY);
      const halfW = Math.round(14 + Math.sin(t * Math.PI) * 2);

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 64 || y >= 96) continue;

        const xFrac = dx / (halfW + 1);
        const thickness = Math.abs(xFrac);
        const nz = Math.sqrt(Math.max(0.05, 1 - xFrac * xFrac));
        const fresnel = Math.pow(1 - nz, 2) * 0.4 + 0.1;

        const fl = flameLight(x, y);

        if (thickness < 0.4) {
          // Centre — flame visible through glass, warm glow
          if (fl > 0.15) {
            // Near flame — warm orange glow
            pc.setPixel(x, y, tone(fg, fl * 0.7 + 0.1));
          } else {
            // Away from flame — faint glass tint
            pc.setPixel(x, y, tone(gg, fresnel * 0.2 + fl * 0.3));
          }
        } else {
          // Edge — glass visible with flame warmth tinting it
          let v = fresnel + fl * 0.3;
          v = v * v * (3 - 2 * v);
          if (fl > 0.1) {
            pc.setPixel(x, y, tone(fg, Math.max(0.05, v * 0.5)));
          } else {
            pc.setPixel(x, y, tone(v > 0.3 ? gg : gs, Math.max(0.03, v)));
          }
        }
      }
    }

    // Metal frame RIBS — vertical bars over the glass
    for (let y = glassTopY; y <= glassBotY; y++) {
      const t = (y - glassTopY) / (glassBotY - glassTopY);
      const halfW = Math.round(14 + Math.sin(t * Math.PI) * 2);
      for (let rib = 0; rib < 4; rib++) {
        const ribX = cx + Math.round((rib / 3 - 0.5) * halfW * 1.5);
        if (ribX >= 0 && ribX + 1 < 64 && y >= 0 && y < 96) {
          const fl = flameLight(ribX, y);
          let rv = 0.06 + fl * 0.3;
          rv = rv * rv * (3 - 2 * rv);
          pc.setPixel(ribX, y, tone(rv > 0.15 ? mg : ms, Math.max(0.03, rv)));
          pc.setPixel(ribX + 1, y, tone(ms, Math.max(0.02, rv * 0.6)));
        }
      }
    }

    // FLAME — bright self-illuminating centre
    for (let y = flameCY - 12; y <= flameCY + 4; y++) {
      const ft = (flameCY + 4 - y) / 16;
      const halfW = Math.round(4 * (1 - ft * ft) + Math.sin(y * 0.4) * 1);
      if (halfW < 1) {
        pc.setPixel(cx, y, tone(fy, 0.7));
        continue;
      }
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 64 || y < 0 || y >= 96) continue;
        const xF = Math.abs(dx) / (halfW + 1);
        if (ft > 0.5 && xF < 0.4) {
          pc.setPixel(x, y, tone(fy, 0.8 + (1 - xF) * 0.2));
        } else {
          pc.setPixel(x, y, tone(fg, 0.4 + ft * 0.3));
        }
      }
    }

    // Wick — tiny dark line below flame
    pc.setPixel(cx, flameCY + 5, tone(ms, 0.1));
    pc.setPixel(cx, flameCY + 6, tone(ms, 0.08));

    // BASE — metal platform with feet
    for (let y = baseTopY; y <= baseBotY; y++) {
      const t = (y - baseTopY) / (baseBotY - baseTopY);
      const halfW = Math.round(16 + (1 - t) * 2);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 64 || y >= 96) continue;
        const nx = dx / (halfW + 1) * 0.3;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        const fl = flameLight(x, y);
        let v = 0.06 + dot * 0.3 + fl * 0.2;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.2 ? mg : ms, Math.max(0.03, v)));
      }
    }

    // Feet
    for (const side of [-1, 1]) {
      const footX = cx + side * 14;
      for (let dy = 0; dy < 4; dy++) {
        const py = baseBotY + dy;
        if (py >= 96) continue;
        for (let w = -2; w <= 2; w++) {
          const px = footX + w;
          if (px >= 0 && px < 64) {
            pc.setPixel(px, py, tone(ms, 0.1 + (1 - dy / 4) * 0.08));
          }
        }
      }
    }

    // Flame glow on cap underside — bright warm reflection
    for (let dx = -12; dx <= 12; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 64 && capBotY < 96) {
        const d = Math.abs(dx) / 12;
        pc.setPixel(x, capBotY, tone(fg, (1 - d * d) * 0.3 + 0.05));
      }
    }

    // Contact shadow
    for (let dx = -16; dx <= 16; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 64 && baseBotY + 5 < 96) {
        pc.setPixel(x, baseBotY + 5, tone(ms, 0.03 * (1 - Math.abs(dx) / 16)));
      }
    }
  },
};
