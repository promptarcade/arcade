// Phase 5, Exercise 5.4: Cloth draped over a sphere — ATTEMPT 2
// Fix: cloth CLINGS to sphere on top (smooth), gradually separates at sides,
// folds only appear where cloth hangs free. Varying fold depth.

module.exports = {
  width: 96,
  height: 96,
  style: 'illustrated',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cloth: '#993333',
    clothshd: '#552233',
    clothlit: '#cc6644',
    ground: '#667766',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.cloth.startIdx); },

  drawPost(pc, pal) {
    const cg = pal.groups.cloth;
    const csg = pal.groups.clothshd;
    const clg = pal.groups.clothlit;
    const gg = pal.groups.ground;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }

    function clothCol(value) {
      if (value > 0.45) return tone(clg, value);
      if (value > 0.2) return tone(value > 0.32 ? cg : csg, Math.max(0.05, value * 1.1));
      return tone(csg, Math.max(0.03, value * 1.4));
    }

    pc.pixels[0] = 0;

    const cx = 48, cy = 38, sphereR = 26;
    const lx = -0.55, ly = -0.65, lz = 0.52;
    const rng = sf2_seededRNG(55);

    // Ground
    const groundY = 80;
    for (let y = groundY; y < 96; y++) {
      for (let x = 0; x < 96; x++) {
        pc.setPixel(x, y, tone(gg, Math.max(0.08, 0.4 - ((y - groundY) / 16) * 0.1)));
      }
    }

    // Cast shadow
    for (let y = groundY; y < groundY + 7; y++) {
      for (let x = cx + 2; x < cx + 38; x++) {
        if (x >= 96 || y >= 96) continue;
        const dx = (x - (cx + 16)) / 20, dy = (y - (groundY + 3)) / 4;
        if (dx * dx + dy * dy < 1) {
          pc.setPixel(x, y, tone(gg, Math.max(0.04, 0.35 * (0.55 + (dx * dx + dy * dy) * 0.45))));
        }
      }
    }

    // The cloth surface — computed per pixel
    // Three zones:
    // 1. TOP: cloth conforms to sphere (use sphere normals)
    // 2. TRANSITION: cloth peels away from sphere at the equator
    // 3. HANGING: cloth falls under gravity with folds

    // Pre-compute fold pattern — each fold has a random depth and width
    const numFolds = 7;
    const folds = [];
    for (let i = 0; i < numFolds; i++) {
      folds.push({
        xPos: (i / (numFolds - 1)) * 2 - 1, // -1 to 1 across width
        depth: 0.15 + rng() * 0.25,
        width: 0.08 + rng() * 0.06,
      });
    }

    const clothEdgeL = cx - sphereR - 10;
    const clothEdgeR = cx + sphereR + 10;

    for (let y = cy - sphereR - 3; y <= groundY; y++) {
      for (let x = clothEdgeL; x <= clothEdgeR; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;

        const dx = x - cx, dy = y - cy;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const angleFromCenter = Math.atan2(dy, dx);

        let nx, ny, nz;
        let inCloth = false;

        // Zone 1: On the sphere (above equator, within sphere radius)
        if (distFromCenter <= sphereR + 1 && dy <= sphereR * 0.15) {
          // Cloth conforms to sphere — sphere normals
          nx = dx / sphereR;
          ny = dy / sphereR;
          nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));

          // Slight cloth wrinkle texture on top of sphere normals
          const wrinkle = Math.sin(dx * 0.5) * Math.cos(dy * 0.4) * 0.04;
          nx += wrinkle;

          inCloth = true;
        }
        // Zone 2+3: Below sphere equator — peeling away and hanging
        else if (y > cy - sphereR * 0.2) {
          // How far down from peel point
          const hangStart = cy + sphereR * 0.15;
          const hangT = Math.max(0, Math.min(1, (y - hangStart) / (groundY - hangStart)));

          // Cloth width — starts at sphere width, slightly expands, then narrows at ground
          const sphereWidthAtY = dy < sphereR
            ? Math.sqrt(Math.max(0, sphereR * sphereR - dy * dy))
            : sphereR * 0.3;
          const hangWidth = sphereR + 6 + hangT * 4 - hangT * hangT * 8;

          const xFrac = dx / Math.max(1, hangWidth); // -1 to 1 across cloth width
          if (Math.abs(xFrac) > 1.05) continue;

          // Transition zone: near the sphere, cloth still curves with it
          // Further down: gravity takes over, folds appear
          const transitionT = Math.min(1, hangT * 3); // 0=still on sphere, 1=fully hanging

          // Fold normal — sum contributions from each fold
          let foldNX = 0;
          for (const fold of folds) {
            const distToFold = xFrac - fold.xPos;
            const foldInfluence = Math.exp(-distToFold * distToFold / (fold.width * fold.width));
            foldNX += foldInfluence * Math.sign(distToFold) * fold.depth;
          }

          // Blend between sphere normal (transition) and fold normal (hanging)
          if (transitionT < 1 && distFromCenter < sphereR + 8) {
            // Still near sphere — blend sphere curvature with fold
            const sphereNX = dx / (sphereR + 4);
            const sphereNY = dy / (sphereR + 4);
            nx = sphereNX * (1 - transitionT) + foldNX * transitionT;
            ny = sphereNY * (1 - transitionT) + (0.1 * transitionT); // gradually face downward
          } else {
            // Fully hanging — folds dominate
            nx = foldNX * transitionT;
            ny = 0.05 + hangT * 0.1; // slightly faces down (gravity)
          }
          nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));

          inCloth = true;
        }

        if (!inCloth) continue;

        // Diffuse — cloth is matte, NO specular
        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const ambient = 0.06;
        const bounce = Math.max(0, ny * 0.2) * 0.08;

        let value = ambient + diffuse * 0.68 + bounce;
        value = Math.max(0, Math.min(1, value));
        // Soft S-curve — cloth has gentle transitions
        value = value * value * (3 - 2 * value) * 0.65 + value * 0.35;
        value = Math.max(0.03, value);

        pc.setPixel(x, y, clothCol(value));
      }
    }

    // Fold valley creases — dark lines where cloth dips inward
    for (const fold of folds) {
      const foldScreenX = Math.round(cx + fold.xPos * (sphereR + 6));
      const hangStart = cy + Math.round(sphereR * 0.4);

      for (let y = hangStart; y < groundY - 1; y++) {
        const hangT = (y - hangStart) / (groundY - hangStart);
        // Crease gets deeper further down
        const creaseStrength = hangT * fold.depth * 2;
        if (creaseStrength < 0.1) continue;

        const fx = foldScreenX + Math.round(Math.sin(y * 0.08) * 1.5); // slight wobble
        if (fx >= 0 && fx < 96 && y >= 0 && y < 96 && pc.isFilled(fx, y)) {
          pc.setPixel(fx, y, tone(csg, Math.max(0.02, 0.08 - creaseStrength * 0.04)));
          // Bright catchlight on the ridge next to the valley
          if (fx - 2 >= 0 && pc.isFilled(fx - 2, y)) {
            const ridgeBright = creaseStrength * 0.15;
            pc.setPixel(fx - 2, y, clothCol(0.35 + ridgeBright));
          }
        }
      }
    }

    // Hem line at bottom
    for (let x = clothEdgeL + 2; x <= clothEdgeR - 2; x++) {
      if (x >= 0 && x < 96 && groundY - 1 >= 0 && groundY - 1 < 96) {
        if (pc.isFilled(x, groundY - 1)) {
          pc.setPixel(x, groundY - 1, tone(csg, 0.06));
        }
      }
    }

    // Contact shadow line where cloth meets ground
    for (let x = clothEdgeL; x <= clothEdgeR; x++) {
      if (x >= 0 && x < 96 && groundY < 96) {
        pc.setPixel(x, groundY, tone(gg, Math.max(0.03, 0.2)));
      }
    }
  },
};
