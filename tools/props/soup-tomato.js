// Soup Shop — Tomato (96x96, HD tier)
// Red round fruit, green star-shaped stem. Shiny skin.
// Reuse the apple technique from earlier but rounder, with visible segments.

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#cc3333',
    bodyshd: '#882222',
    stem: '#449933',
    stemlit: '#66bb44',
    highlight: '#ffccbb',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const bs = pal.groups.bodyshd;
    const sg = pal.groups.stem;
    const sl = pal.groups.stemlit;
    const hg = pal.groups.highlight;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, cy = 52, r = 34;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(88);

    // Tomato body — sphere with slight flattening top/bottom
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = x - cx, dy = y - cy;
        // Slightly wider than tall (squashed sphere)
        const ndx = dx / (r * 1.05), ndy = dy / (r * 0.95);
        if (ndx * ndx + ndy * ndy > 1) continue;

        const nx = ndx * 0.85;
        const ny = ndy * 0.75;
        const nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));

        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);

        // Tomato is shiny — moderate specular
        const NdotL = nx * lx + ny * ly + nz * lz;
        const rrx = 2 * NdotL * nx - lx;
        const rry = 2 * NdotL * ny - ly;
        const rrz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rrz), 35) * 0.35;

        const ambient = 0.05;
        const bounce = Math.max(0, ny * 0.3) * 0.1;

        // Segment lines — tomatoes have visible vertical lobes
        const angle = Math.atan2(dy, dx);
        const segmentLine = Math.abs(Math.sin(angle * 4 + 0.3)) < 0.08;

        let v = ambient + dot * 0.65 + specular + bounce;
        if (segmentLine) v *= 0.82; // segment groove is darker

        v = v * v * (3 - 2 * v);
        v = Math.max(0.03, Math.min(1, v));

        // Colour temp: warm bright red lit, cool dark red shadow
        if (specular > 0.08) {
          pc.setPixel(x, y, tone(hg, Math.min(1, 0.4 + specular * 1.2)));
        } else {
          pc.setPixel(x, y, tone(v > 0.35 ? bg : bs, v));
        }
      }
    }

    // Top dimple — slight concave area where stem connects
    for (let dy = -4; dy <= 2; dy++) {
      for (let dx = -6; dx <= 6; dx++) {
        const d = (dx * dx) / 36 + (dy * dy) / 8;
        if (d > 1) continue;
        const px = cx + dx, py = cy - r + 4 + dy;
        if (px >= 0 && px < 96 && py >= 0 && py < 96) {
          pc.setPixel(px, py, tone(bs, 0.15 + (1 - d) * 0.1));
        }
      }
    }

    // Green star-shaped stem (calyx)
    const stemCY = cy - r + 2;
    // 5 pointed star/leaves radiating from center
    for (let leaf = 0; leaf < 5; leaf++) {
      const leafAngle = (leaf / 5) * Math.PI * 2 - Math.PI / 2;
      for (let along = 0; along < 12; along++) {
        const t = along / 11;
        const lw = Math.round(3 * (1 - t * 0.7));
        const lxp = cx + Math.round(Math.cos(leafAngle) * along * 1.2);
        const lyp = stemCY + Math.round(Math.sin(leafAngle) * along * 0.8);

        for (let across = -lw; across <= lw; across++) {
          const px = lxp + Math.round(across * Math.sin(leafAngle));
          const py = lyp - Math.round(across * Math.cos(leafAngle));
          if (px < 0 || px >= 96 || py < 0 || py >= 96) continue;

          const leafNX = across / (lw + 1) * 0.4;
          const leafNY = -0.6;
          const leafNZ = Math.sqrt(Math.max(0.1, 1 - leafNX * leafNX - leafNY * leafNY));
          const leafDot = Math.max(0, lx * leafNX + ly * leafNY + lz * leafNZ);

          pc.setPixel(px, py, tone(leafDot > 0.35 ? sl : sg, 0.15 + leafDot * 0.6));
        }
      }
    }

    // Small stem nub at center
    for (let dy = -5; dy <= 0; dy++) {
      const w = Math.max(1, 2 + Math.round(dy * 0.3));
      for (let dx = -w; dx <= w; dx++) {
        const px = cx + dx, py = stemCY + dy;
        if (px >= 0 && px < 96 && py >= 0 && py < 96) {
          pc.setPixel(px, py, tone(sg, 0.3 + (1 + dy / 5) * 0.25));
        }
      }
    }

    // Main specular highlight
    const specX = cx - 10, specY = cy - 10;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy) / 3;
        const px = specX + dx, py = specY + dy;
        if (d < 1 && px >= 0 && px < 96 && py >= 0 && py < 96) {
          pc.setPixel(px, py, tone(hg, 0.7 + (1 - d) * 0.3));
        }
      }
    }
  },
};
