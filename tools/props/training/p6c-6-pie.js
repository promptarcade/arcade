// Phase 6C.6: Apple Pie — SHADED (silhouette verified: dish + domed pastry + crimped edge)
// Golden baked pastry, lattice top pattern, crimped crust edge

module.exports = {
  width: 128, height: 80, style: 'hd', entityType: 'prop', outlineMode: 'none',
  colors: {
    pastry: '#cc9944', pastryshd: '#996633',
    filling: '#883322', dish: '#eeddcc', dishshd: '#bbaa99',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.pastry.startIdx); },
  drawPost(pc, pal) {
    const pg = pal.groups.pastry, ps = pal.groups.pastryshd;
    const fg = pal.groups.filling;
    const dg = pal.groups.dish, ds = pal.groups.dishshd;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;
    const cx = 64, cy = 38, lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(66);
    const dishRX = 54, dishRY = 28;

    // DISH — visible sides below the pie
    for (let y = cy + dishRY; y <= cy + dishRY + 6; y++) {
      const sT = (y - cy - dishRY) / 6;
      const sW = Math.round(dishRX * (1 - sT * 0.05));
      for (let x = cx - sW; x <= cx + sW; x++) {
        if (x < 0 || x >= 128 || y >= 80) continue;
        const nx = (x - cx) / (sW + 1) * 0.3;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        let v = 0.12 + Math.max(0, lx * nx + lz * nz) * 0.35;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.25 ? dg : ds, Math.max(0.06, v)));
      }
    }

    // PIE TOP — elliptical dome with pastry
    for (let y = cy - dishRY + 2; y <= cy + dishRY; y++) {
      for (let x = cx - dishRX + 2; x <= cx + dishRX - 2; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 80) continue;
        const dx = (x - cx) / (dishRX - 2), dy = (y - cy) / dishRY;
        if (dx * dx + dy * dy > 1) continue;

        // Dome normal for the pastry top
        const nx = dx * 0.5, ny = dy * 0.4;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);

        // Lattice pattern — crossing strips
        const latX = Math.sin((x - cx) * 0.12 + (y - cy) * 0.08);
        const latY = Math.sin((x - cx) * 0.08 - (y - cy) * 0.12);
        const isLatticeStrip = latX > 0.3 || latY > 0.3;
        const isGap = !isLatticeStrip;

        if (isGap) {
          // Filling visible through lattice gaps — dark red
          let fv = 0.08 + dot * 0.3;
          fv = fv * fv * (3 - 2 * fv);
          pc.setPixel(x, y, tone(fg, Math.max(0.04, fv)));
        } else {
          // Pastry strip — golden brown
          let pv = 0.12 + dot * 0.6;
          // Lattice strips are slightly raised — brighter where they cross
          if (latX > 0.3 && latY > 0.3) pv += 0.08; // crossing point
          pv += (rng() - 0.5) * 0.02;
          pv = pv * pv * (3 - 2 * pv);
          pc.setPixel(x, y, tone(pv > 0.4 ? pg : ps, Math.max(0.05, pv)));
        }
      }
    }

    // CRIMPED CRUST EDGE — wavy ring around the dish rim
    for (let a = 0; a < 360; a++) {
      const rad = a * Math.PI / 180;
      const crimpR = dishRX + Math.sin(a * 0.15) * 2.5;
      const crimpRY = dishRY + 1 + Math.sin(a * 0.15) * 1.5;
      const px = Math.round(cx + Math.cos(rad) * crimpR);
      const py = Math.round(cy + Math.sin(rad) * crimpRY);
      if (px < 0 || px >= 128 || py < 0 || py >= 80) continue;

      // Crust edge — golden, slightly raised
      const edgeNX = Math.cos(rad) * 0.4;
      const edgeNY = Math.sin(rad) * 0.3;
      const edgeNZ = Math.sqrt(Math.max(0.1, 1 - edgeNX * edgeNX - edgeNY * edgeNY));
      const edgeDot = Math.max(0, lx * edgeNX + ly * edgeNY + lz * edgeNZ);
      let ev = 0.15 + edgeDot * 0.5;
      ev = ev * ev * (3 - 2 * ev);

      for (let w = -2; w <= 2; w++) {
        const wx = px + Math.round(Math.cos(rad) * w * 0.5);
        const wy = py + Math.round(Math.sin(rad) * w * 0.3);
        if (wx >= 0 && wx < 128 && wy >= 0 && wy < 80) {
          pc.setPixel(wx, wy, tone(ev > 0.35 ? pg : ps, Math.max(0.06, ev - Math.abs(w) * 0.05)));
        }
      }
    }

    // Dish rim — visible as a thin bright line between crust and dish sides
    for (let a = 100; a < 260; a++) { // only visible bottom half
      const rad = a * Math.PI / 180;
      const rx = Math.round(cx + Math.cos(rad) * dishRX);
      const ry = Math.round(cy + Math.sin(rad) * dishRY);
      if (rx >= 0 && rx < 128 && ry >= 0 && ry < 80) {
        pc.setPixel(rx, ry, tone(dg, 0.55));
      }
    }

    // Contact shadow
    for (let x = cx - dishRX; x <= cx + dishRX; x++) {
      if (x >= 0 && x < 128 && cy + dishRY + 8 < 80) {
        pc.setPixel(x, cy + dishRY + 8, tone(ds, 0.04 * (1 - Math.abs(x - cx) / dishRX)));
      }
    }
  },
};
