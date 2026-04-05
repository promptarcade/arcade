// Soup Shop — Potato (96x96, HD tier)
// Brown lumpy oval with eyes/spots. Matte surface (like the rock from training).

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#ccaa77',
    bodyshd: '#886644',
    spot: '#997755',
    highlight: '#eeddbb',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const bs = pal.groups.bodyshd;
    const sp = pal.groups.spot;
    const hg = pal.groups.highlight;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 52, cy = 50;
    const rx = 28, ry = 24;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(55);

    // Bumpy shape — perturbed ellipse (Phase 1 rock technique)
    const bumps = [];
    for (let i = 0; i < 6; i++) {
      bumps.push({
        angle: rng() * Math.PI * 2,
        amplitude: 0.04 + rng() * 0.08,
        frequency: 2 + rng() * 2,
      });
    }

    for (let y = cy - ry - 4; y <= cy + ry + 4; y++) {
      for (let x = cx - rx - 4; x <= cx + rx + 4; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        let radiusMod = 1;
        const angle = Math.atan2(dy, dx);
        for (const bump of bumps) {
          radiusMod += bump.amplitude * Math.cos((angle - bump.angle) * bump.frequency);
        }
        // Slightly wider at bottom
        if (dy > 0) radiusMod += dy * 0.08;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radiusMod) continue;

        // Perturbed sphere normal
        let nx = dx / radiusMod;
        let ny = (dy / radiusMod) * 0.75;
        let nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));
        for (const bump of bumps) {
          nx += Math.cos(bump.angle) * Math.sin((angle - bump.angle) * bump.frequency) * bump.amplitude * 0.35;
        }
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len; ny /= len; nz /= len;

        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        // Matte — no specular (potato is not shiny)
        const ambient = 0.06;
        const bounce = Math.max(0, ny * 0.25) * 0.08;
        const roughness = (rng() - 0.5) * 0.04;

        let v = ambient + dot * 0.62 + bounce + roughness;
        v = v * v * (3 - 2 * v);
        v = Math.max(0.03, Math.min(1, v));

        pc.setPixel(x, y, tone(v > 0.38 ? bg : bs, v));
      }
    }

    // Potato eyes — small dark dimples scattered across surface
    for (let e = 0; e < 8; e++) {
      const ea = rng() * Math.PI * 2;
      const er = 0.4 + rng() * 0.4;
      let radiusMod = 1;
      for (const bump of bumps) {
        radiusMod += bump.amplitude * Math.cos((ea - bump.angle) * bump.frequency);
      }
      const ex = Math.round(cx + rx * er * Math.cos(ea) * radiusMod);
      const ey = Math.round(cy + ry * er * Math.sin(ea) * radiusMod);
      if (ex >= 1 && ex < 95 && ey >= 1 && ey < 95 && pc.isFilled(ex, ey)) {
        // Small dimple: dark centre, lighter ring
        pc.setPixel(ex, ey, tone(sp, 0.12));
        pc.setPixel(ex - 1, ey, tone(sp, 0.2));
        pc.setPixel(ex + 1, ey, tone(sp, 0.25));
        pc.setPixel(ex, ey - 1, tone(sp, 0.18));
        pc.setPixel(ex, ey + 1, tone(sp, 0.28));
      }
    }

    // Subtle highlight — broad, soft (matte material from Phase 5)
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -10; dx <= 10; dx++) {
        const px = cx - 10 + dx, py = cy - 8 + dy;
        if (px >= 0 && px < 96 && py >= 0 && py < 96 && pc.isFilled(px, py)) {
          const d = Math.sqrt(dx * dx + dy * dy) / 10;
          if (d < 1 && rng() < (1 - d) * 0.35) {
            pc.setPixel(px, py, tone(hg, 0.45 + (1 - d) * 0.2));
          }
        }
      }
    }
  },
};
