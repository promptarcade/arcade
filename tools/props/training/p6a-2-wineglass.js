// Phase 6A.2: Wine Glass — SHADED (silhouette verified: bowl + stem + base)
// Glass material: Fresnel transparency, specular, delicate

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    glass: '#99bbcc',
    glassshd: '#445566',
    highlight: '#eeffff',
    wine: '#771133',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.glass.startIdx); },

  drawPost(pc, pal) {
    const gg = pal.groups.glass;
    const gs = pal.groups.glassshd;
    const hg = pal.groups.highlight;
    const wg = pal.groups.wine;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, lx = -0.5, ly = -0.6, lz = 0.63;
    const glassTop = 6, glassBot = 88;
    const totalH = glassBot - glassTop;

    // VERIFIED PROFILE from silhouette
    function glassProfile(t) {
      const rimWidth = 24, bowlMax = 22, stemWidth = 3, baseWidth = 20;
      if (t < 0.02) return rimWidth;
      if (t < 0.42) {
        const bowlT = (t - 0.02) / 0.4;
        if (bowlT < 0.35) {
          const expand = Math.sin(bowlT / 0.35 * Math.PI / 2);
          return rimWidth - 4 + expand * (bowlMax - rimWidth + 6);
        }
        const narrowT = (bowlT - 0.35) / 0.65;
        return Math.max(stemWidth, Math.round(bowlMax - Math.pow(narrowT, 1.5) * (bowlMax - stemWidth)));
      }
      if (t < 0.82) return stemWidth;
      if (t < 0.88) {
        const flareT = (t - 0.82) / 0.06;
        return Math.round(stemWidth + (baseWidth - stemWidth) * flareT * flareT);
      }
      return baseWidth;
    }

    // Wine level — fills lower 40% of bowl
    const wineTopT = 0.02 + 0.4 * 0.55; // 55% down the bowl

    // GLASS BODY — Fresnel transparency
    for (let y = glassTop; y <= glassBot; y++) {
      const t = (y - glassTop) / totalH;
      const halfW = Math.round(glassProfile(t));
      if (halfW < 1) continue;

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y >= 96) continue;

        const xFrac = dx / (halfW + 1);
        const thickness = Math.abs(xFrac); // glass thickness at edges

        // Glass normal
        const nx = xFrac;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));

        // Fresnel: edges opaque, centre transparent
        const fresnel = Math.pow(1 - nz, 2) * 0.55 + 0.12;

        const NdotL = nx * lx + nz * lz;
        const dot = Math.max(0, NdotL);
        const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 60) * 0.4;

        // Is this in the wine zone?
        const inBowl = t >= 0.02 && t < 0.42;
        const inWine = inBowl && t >= wineTopT;

        if (inWine && thickness < 0.6) {
          // Wine visible through glass
          const wineLit = 0.15 + dot * 0.25;
          pc.setPixel(x, y, tone(wg, Math.max(0.05, wineLit)));
        } else if (t >= 0.82) {
          // Base — solid glass, not transparent
          let v = 0.1 + dot * 0.4 + specular;
          v = v * v * (3 - 2 * v);
          pc.setPixel(x, y, tone(v > 0.35 ? gg : gs, Math.max(0.04, v)));
        } else if (halfW <= 3) {
          // Stem — thin solid glass
          let v = 0.08 + dot * 0.45 + specular * 0.5;
          v = v * v * (3 - 2 * v);
          pc.setPixel(x, y, tone(v > 0.3 ? gg : gs, Math.max(0.03, v)));
        } else {
          // Bowl or base flare — transparent glass
          if (thickness < 0.45) {
            // Centre — nearly transparent, faint tint
            pc.setPixel(x, y, tone(gg, fresnel * 0.25));
          } else {
            // Edge — visible glass
            let v = fresnel + dot * 0.2 + specular;
            v = v * v * (3 - 2 * v);
            pc.setPixel(x, y, tone(v > 0.4 ? gg : gs, Math.max(0.04, v)));
          }
        }
      }
    }

    // Wine meniscus — bright line at wine level
    const wineY = Math.round(glassTop + wineTopT * totalH);
    const wineHW = Math.round(glassProfile(wineTopT));
    for (let dx = -wineHW + 3; dx <= wineHW - 3; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 96 && wineY >= 0 && wineY < 96) {
        pc.setPixel(x, wineY, tone(hg, 0.25 + (1 - Math.abs(dx) / wineHW) * 0.2));
      }
    }

    // Left edge bright reflection streak
    for (let y = glassTop + 3; y < glassBot - 3; y++) {
      const t = (y - glassTop) / totalH;
      const halfW = glassProfile(t);
      if (halfW < 3) continue;
      const hx = cx - halfW + 1;
      if (hx >= 0 && hx < 96 && y < 96) {
        pc.setPixel(hx, y, tone(hg, 0.55));
        if (hx + 1 < 96) pc.setPixel(hx + 1, y, tone(gg, 0.4));
      }
    }

    // Specular dot on bowl
    const specY = glassTop + Math.round(totalH * 0.12);
    pc.setPixel(cx - 10, specY, tone(hg, 0.95));
    pc.setPixel(cx - 9, specY, tone(hg, 0.8));
    pc.setPixel(cx - 10, specY + 1, tone(hg, 0.7));

    // Rim highlight
    const rimRX = 24, rimRY = 4;
    for (let x = cx - rimRX; x <= cx + rimRX; x++) {
      const dx = (x - cx) / rimRX;
      if (Math.abs(dx) > 1) continue;
      const ry = glassTop + Math.round(rimRY * Math.sqrt(1 - dx * dx));
      if (x >= 0 && x < 96 && glassTop - 1 >= 0) {
        pc.setPixel(x, glassTop - 1, tone(hg, 0.3 + (1 - Math.abs(dx)) * 0.3));
      }
    }

    // Base shadow
    for (let dx = -20; dx <= 20; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 96 && glassBot + 2 < 96) {
        pc.setPixel(x, glassBot + 1, tone(gs, 0.04 * (1 - Math.abs(dx) / 20)));
      }
    }
  },
};
