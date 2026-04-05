// Phase 6C.5: Wedge of Cheese — SHADED (silhouette verified: triangular profile)
// Yellow cheese with holes on cut face, darker rind on top/back

module.exports = {
  width: 96, height: 80, style: 'hd', entityType: 'prop', outlineMode: 'none',
  colors: { cheese: '#ddcc44', cheeseshd: '#aa9922', rind: '#cc9933', rindshd: '#886622' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.cheese.startIdx); },
  drawPost(pc, pal) {
    const cg = pal.groups.cheese, cs = pal.groups.cheeseshd;
    const rg = pal.groups.rind, rs = pal.groups.rindshd;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;
    const lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(55);
    const backX = 12, frontX = 84, topBackY = 16, botY = 64;
    const topFrontY = botY - 6;

    // WEDGE BODY — two distinct faces: cut face (front) and rind (top slope)
    for (let x = backX; x <= frontX; x++) {
      const t = (x - backX) / (frontX - backX);
      const topY = Math.round(topBackY + (topFrontY - topBackY) * t);
      // Rind curve
      const rindCurve = Math.sin(t * Math.PI) * 2;

      for (let y = Math.round(topY - rindCurve); y <= botY; y++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 80) continue;

        const isRind = y <= topY + 2; // top surface = rind
        const isCutFace = x <= backX + 3; // left face = exposed cut

        if (isRind) {
          // RIND — darker, aged surface
          const rnx = (x - (backX + frontX) / 2) / ((frontX - backX) / 2) * 0.2;
          const rny = -0.7;
          const rnz = Math.sqrt(Math.max(0.1, 1 - rnx * rnx - rny * rny));
          const dot = Math.max(0, lx * rnx + ly * rny + lz * rnz);
          let v = 0.1 + dot * 0.55;
          v = v * v * (3 - 2 * v);
          pc.setPixel(x, y, tone(v > 0.35 ? rg : rs, Math.max(0.05, v)));
        } else if (isCutFace) {
          // CUT FACE — bright yellow, visible holes
          const fny = (y - (topY + botY) / 2) / ((botY - topY) / 2) * 0.3;
          const fnz = Math.sqrt(Math.max(0.1, 1 - 0.5 * 0.5 - fny * fny));
          const dot = Math.max(0, lx * (-0.5) + ly * fny + lz * fnz);
          let v = 0.15 + dot * 0.55;
          v = v * v * (3 - 2 * v);
          pc.setPixel(x, y, tone(v > 0.4 ? cg : cs, Math.max(0.08, v)));
        } else {
          // FRONT/SIDE face
          const fnx = (x - backX) / (frontX - backX) * 0.3 + 0.1;
          const fny = (y - (topY + botY) / 2) / ((botY - topY) / 2) * 0.2;
          const fnz = Math.sqrt(Math.max(0.1, 1 - fnx * fnx - fny * fny));
          const dot = Math.max(0, lx * fnx + ly * fny + lz * fnz);
          let v = 0.12 + dot * 0.55;
          v = v * v * (3 - 2 * v);
          pc.setPixel(x, y, tone(v > 0.38 ? cg : cs, Math.max(0.06, v)));
        }
      }
    }

    // HOLES on cut face — circular dark spots
    const holes = [
      { x: backX + 8, y: 35, r: 5 },
      { x: backX + 14, y: 50, r: 4 },
      { x: backX + 6, y: 44, r: 3 },
      { x: backX + 18, y: 38, r: 3 },
      { x: backX + 12, y: 56, r: 2 },
    ];
    for (const h of holes) {
      for (let dy = -h.r; dy <= h.r; dy++) {
        for (let dx = -h.r; dx <= h.r; dx++) {
          if (dx * dx + dy * dy > h.r * h.r) continue;
          const px = h.x + dx, py = h.y + dy;
          if (px >= backX && px <= frontX && py >= 0 && py < 80) {
            const d = Math.sqrt(dx * dx + dy * dy) / h.r;
            // Hole: dark centre, lighter ring (concave)
            if (d < 0.7) {
              pc.setPixel(px, py, tone(cs, 0.1));
            } else {
              pc.setPixel(px, py, tone(cs, 0.1 + (d - 0.7) / 0.3 * 0.2));
            }
            // Highlight on upper rim of hole
            if (dy === -h.r + 1 && Math.abs(dx) < h.r - 1) {
              pc.setPixel(px, py, tone(cg, 0.55));
            }
          }
        }
      }
    }

    // Holes on front face (smaller, fewer)
    for (let i = 0; i < 6; i++) {
      const hx = backX + 20 + Math.round(rng() * 50);
      const hy = 25 + Math.round(rng() * 32);
      const hr = 2 + Math.round(rng() * 2);
      // Check it's within the wedge
      const topAtHx = topBackY + (topFrontY - topBackY) * ((hx - backX) / (frontX - backX));
      if (hy < topAtHx + 4 || hy > botY - 3) continue;
      for (let dy = -hr; dy <= hr; dy++) {
        for (let dx = -hr; dx <= hr; dx++) {
          if (dx * dx + dy * dy > hr * hr) continue;
          const px = hx + dx, py = hy + dy;
          if (px >= backX && px <= frontX && py >= 0 && py < 80 && pc.isFilled(px, py)) {
            pc.setPixel(px, py, tone(cs, 0.12 + Math.sqrt(dx * dx + dy * dy) / hr * 0.12));
          }
        }
      }
    }

    // Edge highlight — bright line where top rind meets front face
    for (let x = backX + 2; x < frontX - 2; x++) {
      const t = (x - backX) / (frontX - backX);
      const edgeY = Math.round(topBackY + (topFrontY - topBackY) * t + 2);
      if (x >= 0 && x < 96 && edgeY >= 0 && edgeY < 80) {
        pc.setPixel(x, edgeY, tone(cg, 0.65));
      }
    }

    // Bottom edge
    for (let x = backX; x <= frontX; x++) {
      if (x >= 0 && x < 96 && botY < 80) pc.setPixel(x, botY, tone(cs, 0.08));
    }

    // Contact shadow
    for (let x = backX; x <= frontX; x++) {
      if (x >= 0 && x < 96 && botY + 2 < 80) pc.setPixel(x, botY + 2, tone(cs, 0.04));
    }
  },
};
