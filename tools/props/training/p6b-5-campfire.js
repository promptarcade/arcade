// Phase 6B.5: Campfire — SHADED (silhouette verified)
// Organic compound: logs + flames + stones. Multiple materials + light emission.

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    stone: '#778877',
    stoneshd: '#445544',
    log: '#664422',
    logshd: '#332211',
    flame: '#ff8822',
    flameyel: '#ffcc44',
    ember: '#cc4411',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.stone.startIdx); },

  drawPost(pc, pal) {
    const stg = pal.groups.stone;
    const sts = pal.groups.stoneshd;
    const lg = pal.groups.log;
    const ls = pal.groups.logshd;
    const fg = pal.groups.flame;
    const fy = pal.groups.flameyel;
    const eg = pal.groups.ember;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, groundY = 72;
    const rng = sf2_seededRNG(42);

    // Fire is the LIGHT SOURCE — everything is lit from it
    function fireLight(x, y) {
      const dx = x - cx, dy = y - (groundY - 10);
      return Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 55) * 0.7;
    }

    // STONE RING — each stone is a Phase 1 sphere with fire lighting
    const stones = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + (rng() - 0.5) * 0.3;
      const r = 30 + (rng() - 0.5) * 5;
      stones.push({
        x: Math.round(cx + Math.cos(angle) * r),
        y: Math.round(groundY + Math.sin(angle) * r * 0.35),
        r: 5 + Math.round(rng() * 3),
      });
    }

    for (const s of stones) {
      for (let dy = -s.r; dy <= s.r; dy++) {
        for (let dx = -s.r; dx <= s.r; dx++) {
          if (dx * dx + dy * dy > s.r * s.r) continue;
          const px = s.x + dx, py = s.y + dy;
          if (px < 0 || px >= 96 || py < 0 || py >= 96) continue;

          // Stone lit by fire
          const nx = dx / s.r, ny = dy / s.r;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          // Fire direction from this stone toward centre
          const toCX = cx - s.x, toCY = (groundY - 10) - s.y;
          const toLen = Math.sqrt(toCX * toCX + toCY * toCY) || 1;
          const fireDot = Math.max(0, nx * (toCX / toLen) + ny * (toCY / toLen) + nz * 0.3);
          const fl = fireLight(px, py);

          let v = 0.05 + fireDot * fl * 0.6 + nz * 0.08;
          v = v * v * (3 - 2 * v);
          pc.setPixel(px, py, tone(v > 0.2 ? stg : sts, Math.max(0.03, v)));
        }
      }
    }

    // LOGS — crossed, lit by fire
    const logs = [
      { x1: cx - 22, y1: groundY - 1, x2: cx + 22, y2: groundY - 5, w: 4 },
      { x1: cx - 8, y1: groundY + 4, x2: cx + 15, y2: groundY - 10, w: 3 },
    ];

    for (const log of logs) {
      const dx = log.x2 - log.x1, dy = log.y2 - log.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len, ny = dx / len; // perpendicular

      for (let along = 0; along < len; along++) {
        const t = along / len;
        const px0 = log.x1 + dx * t;
        const py0 = log.y1 + dy * t;

        for (let across = -log.w; across <= log.w; across++) {
          const px = Math.round(px0 + nx * across);
          const py = Math.round(py0 + ny * across);
          if (px < 0 || px >= 96 || py < 0 || py >= 96) continue;

          // Cylinder normal across the log
          const crossFrac = across / (log.w + 1);
          const cnz = Math.sqrt(Math.max(0.1, 1 - crossFrac * crossFrac));
          const fl = fireLight(px, py);
          // Log lit from above by fire
          const dot = Math.max(0, -crossFrac * 0.3 + cnz * 0.5) * fl + 0.05;

          // Ends of logs may be charred (darker)
          const charred = (t < 0.15 || t > 0.85) ? 0.3 : 0;

          let v = dot * 0.8 - charred;
          v = v * v * (3 - 2 * v);
          pc.setPixel(px, py, tone(v > 0.15 ? lg : ls, Math.max(0.02, v)));
        }
      }
    }

    // FLAMES — the light source itself. Brightest element.
    for (let y = groundY - 8; y >= groundY - 42; y--) {
      const t = (groundY - 8 - y) / 34; // 0=base, 1=tip
      const baseW = 13;
      const halfW = Math.round(baseW * (1 - t * t) + Math.sin(y * 0.3 + rng() * 3) * 2.5);
      if (halfW < 1) {
        if (t < 0.95) pc.setPixel(cx + Math.round(Math.sin(y * 0.15) * 1.5), y, tone(fy, 0.6));
        continue;
      }

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx + Math.round(Math.sin(y * 0.12) * 2);
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;

        const xFrac = Math.abs(dx) / (halfW + 1);

        // Flame colour: yellow centre/tip, orange outer, red base
        if (t > 0.6 && xFrac < 0.4) {
          // Tip — brightest yellow-white
          pc.setPixel(x, y, tone(fy, 0.75 + (1 - xFrac) * 0.25));
        } else if (xFrac < 0.45) {
          // Inner — yellow-orange
          pc.setPixel(x, y, tone(fy, 0.4 + t * 0.3 + (1 - xFrac) * 0.15));
        } else {
          // Outer — orange-red
          pc.setPixel(x, y, tone(fg, 0.25 + t * 0.35));
        }
      }
    }

    // Ember base — glowing coals at the bottom of the fire
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -12; dx <= 12; dx++) {
        const x = cx + dx, y = groundY - 5 + dy;
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const d = Math.sqrt(dx * dx + dy * dy * 3) / 12;
        if (d < 1 && rng() < (1 - d) * 0.7) {
          pc.setPixel(x, y, tone(eg, 0.3 + (1 - d) * 0.5));
        }
      }
    }

    // Ember sparks floating up
    for (let s = 0; s < 10; s++) {
      const sx = cx + Math.round((rng() - 0.5) * 24);
      const sy = groundY - 42 - Math.round(rng() * 15);
      if (sx >= 0 && sx < 96 && sy >= 0 && sy < 96) {
        pc.setPixel(sx, sy, tone(fg, 0.4 + rng() * 0.4));
      }
    }

    // Fire glow on ground
    for (let x = cx - 25; x <= cx + 25; x++) {
      if (x >= 0 && x < 96 && groundY + 1 < 96) {
        const d = Math.abs(x - cx) / 25;
        const glow = (1 - d * d) * 0.15;
        if (glow > 0.02) {
          pc.setPixel(x, groundY + 1, tone(fg, glow + 0.03));
        }
      }
    }
  },
};
