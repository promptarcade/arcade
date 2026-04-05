// Soup Shop — Onion (96x96, HD tier)
// Purple-white layered bulb with papery skin. Visible layer lines.

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#ddccbb',
    purple: '#9955aa',
    purpleshd: '#663377',
    root: '#aa9977',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const pg = pal.groups.purple;
    const ps = pal.groups.purpleshd;
    const rg = pal.groups.root;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, cy = 52;
    const rx = 32, ry = 30;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(33);

    // Onion body — sphere with vertical layer lines
    for (let y = cy - ry - 2; y <= cy + ry + 2; y++) {
      for (let x = cx - rx - 2; x <= cx + rx + 2; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        // Onion shape: slightly taller at top, narrow root at bottom
        let radiusMod = 1;
        if (dy > 0.3) radiusMod -= (dy - 0.3) * 0.25; // narrow toward root
        if (dy < -0.7) radiusMod -= (-0.7 - dy) * 0.3; // narrow toward stem

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radiusMod) continue;

        // Sphere normal
        const nx = dx / radiusMod;
        const ny = dy / radiusMod * 0.8;
        const nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);

        // Slight specular — onion skin has a papery sheen
        const NdotL = nx * lx + nz * lz;
        const rr = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rr), 25) * 0.2;

        let v = 0.06 + dot * 0.6 + specular;
        v = v * v * (3 - 2 * v);
        v = Math.max(0.03, Math.min(1, v));

        // Colour: upper half purple, fading to white/cream at bottom
        // With vertical layer lines visible
        const purpleAmount = Math.max(0, 1 - (dy + 0.3) * 1.5); // 1 at top, 0 at bottom
        const layerLine = Math.sin(Math.atan2(dy, dx) * 12 + dist * 8) > 0.7;

        if (purpleAmount > 0.5) {
          if (layerLine) {
            pc.setPixel(x, y, tone(ps, Math.max(0.03, v * 0.7)));
          } else {
            pc.setPixel(x, y, tone(v > 0.35 ? pg : ps, v));
          }
        } else {
          if (layerLine) {
            pc.setPixel(x, y, tone(rg, Math.max(0.05, v * 0.75)));
          } else {
            pc.setPixel(x, y, tone(bg, v));
          }
        }
      }
    }

    // Root tuft at bottom — thin brown strands
    for (let r = 0; r < 6; r++) {
      const rootAngle = (r / 6 - 0.5) * 0.6;
      for (let along = 0; along < 10 + rng() * 6; along++) {
        const rx2 = Math.round(cx + rootAngle * along * 2 + (rng() - 0.5) * 1.5);
        const ry2 = cy + ry + along;
        if (rx2 >= 0 && rx2 < 96 && ry2 >= 0 && ry2 < 96) {
          pc.setPixel(rx2, ry2, tone(rg, 0.2 + rng() * 0.15));
        }
      }
    }

    // Stem nub at top — small dry brown tip
    for (let dy = -6; dy <= 0; dy++) {
      const w = Math.max(1, Math.round(3 + dy * 0.4));
      for (let dx = -w; dx <= w; dx++) {
        const px = cx + dx, py = cy - ry + dy - 1;
        if (px >= 0 && px < 96 && py >= 0 && py < 96) {
          pc.setPixel(px, py, tone(rg, 0.25 + (1 + dy / 6) * 0.2));
        }
      }
    }

    // Papery skin texture — subtle vertical streaks
    for (let s = 0; s < 15; s++) {
      const sa = (rng() - 0.5) * Math.PI * 0.8;
      for (let y = cy - ry + 5; y < cy + ry - 5; y++) {
        const t = (y - cy) / ry;
        const sx = Math.round(cx + Math.sin(sa) * rx * (1 - t * t * 0.3));
        if (sx >= 0 && sx < 96 && y >= 0 && y < 96 && pc.isFilled(sx, y) && rng() < 0.4) {
          pc.setPixel(sx, y, tone(rg, 0.3 + rng() * 0.1));
        }
      }
    }
  },
};
