// Phase 6C.4: Loaf of Bread — SHADED (silhouette verified: domed top, flat bottom)
// Warm golden crust, scoring lines, soft matte material

module.exports = {
  width: 128, height: 80, style: 'hd', entityType: 'prop', outlineMode: 'none',
  colors: { crust: '#cc9944', crustshd: '#885522', crumb: '#eedd99', highlight: '#ffeecc' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.crust.startIdx); },
  drawPost(pc, pal) {
    const cg = pal.groups.crust, cs = pal.groups.crustshd, cb = pal.groups.crumb, hg = pal.groups.highlight;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;
    const cx = 64, lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(44);
    const loafLeft = 14, loafRight = 114, loafBot = 66, loafW = loafRight - loafLeft;

    // Body with verified profile
    for (let x = loafLeft; x <= loafRight; x++) {
      const hT = (x - loafLeft) / loafW;
      let topY;
      if (hT < 0.12) topY = 46 - Math.sqrt(Math.max(0, 1 - (1 - hT / 0.12) ** 2)) * 24;
      else if (hT > 0.88) topY = 46 - Math.sqrt(Math.max(0, 1 - (1 - (1 - hT) / 0.12) ** 2)) * 24;
      else topY = 22 - Math.sin(((hT - 0.12) / 0.76) * Math.PI) * 4;
      topY = Math.round(topY);

      for (let y = topY; y <= loafBot; y++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 80) continue;
        const t = (y - topY) / (loafBot - topY);
        // Normal varies: top is curved dome, sides are flat, bottom is flat
        let nx, ny, nz;
        if (t < 0.3) {
          // Dome top
          nx = (x - cx) / 60 * 0.3;
          ny = -(1 - t * 3) * 0.7;
          nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        } else {
          // Sides
          const edgeDist = Math.min(x - loafLeft, loafRight - x) / 20;
          nx = edgeDist < 1 ? (x < cx ? -1 : 1) * (1 - edgeDist) * 0.5 : 0;
          ny = 0.1;
          nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny));
        }
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        const bounce = Math.max(0, ny * 0.2) * 0.06;

        let v = 0.1 + dot * 0.6 + bounce;
        v += (rng() - 0.5) * 0.03; // crust texture
        v = v * v * (3 - 2 * v);
        // Top is browner (more baked), sides lighter
        pc.setPixel(x, y, tone(t < 0.4 && v > 0.35 ? cg : (v > 0.3 ? cg : cs), Math.max(0.05, v)));
      }
    }

    // Scoring lines — diagonal slashes, MUST stay within loaf boundary
    for (let s = 0; s < 4; s++) {
      const scoreCX = loafLeft + 25 + s * 20;
      for (let along = -7; along <= 7; along++) {
        const sx = Math.round(scoreCX + along);
        const sy = Math.round(25 + along * 0.25 - Math.sin(((sx - loafLeft) / loafW) * Math.PI) * 3);
        // BOUNDARY CHECK: only draw inside the loaf
        if (sx >= loafLeft + 5 && sx <= loafRight - 5 && sy >= 0 && sy < 80 && pc.isFilled(sx, sy)) {
          pc.setPixel(sx, sy, tone(cb, 0.35));
          if (sy - 1 >= 0 && pc.isFilled(sx, sy - 1)) pc.setPixel(sx, sy - 1, tone(hg, 0.48));
          if (sy + 1 < 80 && pc.isFilled(sx, sy + 1)) pc.setPixel(sx, sy + 1, tone(cs, 0.18));
        }
      }
    }

    // Specular on dome — broad warm highlight (matte, not sharp)
    for (let y = 20; y < 32; y++) {
      for (let x = cx - 20; x < cx + 5; x++) {
        if (x >= loafLeft && x <= loafRight && y >= 0 && y < 80 && pc.isFilled(x, y) && rng() < 0.3) {
          pc.setPixel(x, y, tone(hg, 0.5 + rng() * 0.15));
        }
      }
    }

    // Bottom edge
    for (let x = loafLeft; x <= loafRight; x++) {
      if (x >= 0 && x < 128 && loafBot < 80) pc.setPixel(x, loafBot, tone(cs, 0.08));
    }

    // Contact shadow
    for (let x = loafLeft - 2; x <= loafRight + 2; x++) {
      if (x >= 0 && x < 128 && loafBot + 2 < 80) pc.setPixel(x, loafBot + 2, tone(cs, 0.04));
    }
  },
};
