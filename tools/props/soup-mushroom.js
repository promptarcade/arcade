// Soup Shop — Mushroom (96x96, HD tier)
// Tan dome cap on white stem, spots on cap. Two distinct material zones.

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cap: '#ccaa88',
    capshd: '#886644',
    stem: '#eeddcc',
    stemshd: '#bbaa99',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.cap.startIdx); },

  drawPost(pc, pal) {
    const cg = pal.groups.cap;
    const cs = pal.groups.capshd;
    const sg = pal.groups.stem;
    const ss = pal.groups.stemshd;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(66);

    // STEM — cylinder, slightly wider at base
    const stemTop = 50, stemBot = 88, stemW = 14;
    for (let y = stemTop; y <= stemBot; y++) {
      const t = (y - stemTop) / (stemBot - stemTop);
      const halfW = Math.round(stemW * (1 + t * 0.2)); // wider at base
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y >= 96) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        const specular = Math.pow(Math.max(0, 2 * (nx * lx + nz * lz) * nz - lz), 40) * 0.15;
        let v = 0.12 + dot * 0.55 + specular;
        v -= t * 0.06; // darker toward base
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.4 ? sg : ss, Math.max(0.05, v)));
      }
    }

    // GILL UNDERSIDE — visible below the cap, radial lines converging to stem
    // This is a wide disc seen from slightly below — visible between cap edge and stem
    const gillTopY = 44, gillBotY = 54;
    const gillRX = 34;
    for (let y = gillTopY; y <= gillBotY; y++) {
      const t = (y - gillTopY) / (gillBotY - gillTopY); // 0=top of gill area, 1=bottom
      // Gill disc is wider at top (under cap edge), narrower at bottom (near stem)
      const halfW = Math.round(gillRX * (1 - t * 0.55));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;

        // Skip the stem area
        const stemHW = Math.round(stemW * (1 + ((y - stemTop) / (stemBot - stemTop)) * 0.2));
        if (Math.abs(dx) < stemHW && t > 0.3) continue;

        // Radial gill lines — converge toward center
        const angle = Math.atan2(t - 0.5, dx / halfW);
        const isGill = Math.abs(Math.sin(angle * 12)) < 0.3;

        // Underside faces down — dark, with gill line contrast
        const baseBright = 0.12 + (1 - t) * 0.08;
        if (isGill) {
          pc.setPixel(x, y, tone(cs, baseBright - 0.06));
        } else {
          pc.setPixel(x, y, tone(ss, baseBright + 0.05));
        }
      }
    }

    // Cap edge rim — visible ring where cap overhangs the gills
    for (let dx = -gillRX; dx <= gillRX; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 96 && gillTopY >= 0 && gillTopY < 96) {
        const xFrac = Math.abs(dx) / gillRX;
        if (xFrac <= 1) {
          pc.setPixel(x, gillTopY, tone(cs, 0.22 + (1 - xFrac) * 0.08));
          if (gillTopY - 1 >= 0) pc.setPixel(x, gillTopY - 1, tone(cg, 0.35));
        }
      }
    }

    // CAP — dome shape on top, positioned so bottom edge meets gill area
    const capCY = 28, capRX = 36, capRY = 20;
    for (let y = capCY - capRY; y <= capCY + capRY; y++) {
      for (let x = cx - capRX; x <= cx + capRX; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / capRX, dy = (y - capCY) / capRY;
        // Draw the full visible dome
        if (dy > 0.95) continue;
        if (dx * dx + dy * dy > 1) continue;

        // Dome normal
        const nx = dx * 0.8;
        const ny = dy * 0.7;
        const nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);

        // Slight sheen — mushroom caps are somewhat smooth
        const NdotL = nx * lx + ny * ly + nz * lz;
        const rrz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rrz), 20) * 0.18;

        const bounce = Math.max(0, ny * 0.2) * 0.06;
        let v = 0.06 + dot * 0.6 + specular + bounce;
        v = v * v * (3 - 2 * v);
        v = Math.max(0.03, Math.min(1, v));

        pc.setPixel(x, y, tone(v > 0.35 ? cg : cs, v));
      }
    }

    // Cap spots — lighter circles on the dome
    for (let spot = 0; spot < 6; spot++) {
      const sa = rng() * Math.PI - Math.PI / 2; // upper half
      const sr = 0.3 + rng() * 0.5;
      const spotCX = Math.round(cx + Math.cos(sa) * capRX * sr);
      const spotCY = Math.round(capCY + Math.sin(sa) * capRY * sr * 0.7);
      const spotR = 3 + Math.round(rng() * 3);

      for (let dy = -spotR; dy <= spotR; dy++) {
        for (let dx = -spotR; dx <= spotR; dx++) {
          if (dx * dx + dy * dy > spotR * spotR) continue;
          const px = spotCX + dx, py = spotCY + dy;
          if (px < 0 || px >= 96 || py < 0 || py >= 96) continue;
          if (!pc.isFilled(px, py)) continue;
          // Only on cap area
          const cdx = (px - cx) / capRX, cdy = (py - capCY) / capRY;
          if (cdx * cdx + cdy * cdy > 0.95 || cdy > 0.8) continue;
          const d = Math.sqrt(dx * dx + dy * dy) / spotR;
          pc.setPixel(px, py, tone(cg, 0.55 + (1 - d) * 0.25));
        }
      }
    }

    // Cap bottom edge — dark shadow where cap overhangs gills
    for (let x = cx - capRX + 2; x <= cx + capRX - 2; x++) {
      const dx = (x - cx) / capRX;
      if (Math.abs(dx) > 0.95) continue;
      const edgeY = Math.round(capCY + capRY * Math.sqrt(1 - dx * dx) * 0.95);
      if (edgeY >= 0 && edgeY < 96 && x >= 0 && x < 96) {
        pc.setPixel(x, edgeY, tone(cs, 0.1));
      }
    }

    // Contact shadow at stem base
    for (let dx = -18; dx <= 18; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 96 && stemBot + 1 < 96) {
        const d = Math.abs(dx) / 18;
        pc.setPixel(x, stemBot + 1, tone(cs, 0.04 * (1 - d)));
      }
    }
  },
};
