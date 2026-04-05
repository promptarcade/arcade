// Soup Shop — Broccoli (96x96, HD tier)
// Green tree-like floret head on thick stem. Bumpy fractal surface.

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    floret: '#448833',
    floretlit: '#66aa44',
    stem: '#88aa66',
    stemshd: '#667744',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.floret.startIdx); },

  drawPost(pc, pal) {
    const fg = pal.groups.floret;
    const fl = pal.groups.floretlit;
    const sg = pal.groups.stem;
    const ss = pal.groups.stemshd;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(44);

    // STEM — thick tapered cylinder
    const stemTop = 55, stemBot = 90, stemW = 10;
    for (let y = stemTop; y <= stemBot; y++) {
      const t = (y - stemTop) / (stemBot - stemTop);
      const halfW = Math.round(stemW * (1 + t * 0.3));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y >= 96) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        let v = 0.1 + dot * 0.55;
        v -= t * 0.05;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.35 ? sg : ss, Math.max(0.05, v)));
      }
    }

    // Small branch stubs on stem
    for (const stub of [{x: cx - 10, y: 62}, {x: cx + 8, y: 68}]) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = 0; dx < 6; dx++) {
          const px = stub.x + (stub.x < cx ? -dx : dx);
          const py = stub.y + dy;
          if (px >= 0 && px < 96 && py >= 0 && py < 96) {
            const d = Math.sqrt(dx * dx / 9 + dy * dy / 4);
            if (d < 1) pc.setPixel(px, py, tone(sg, 0.2 + (1 - d) * 0.25));
          }
        }
      }
    }

    // FLORET HEAD — cluster of bumpy dome shapes (fractal-like)
    // Build as overlapping small spheres packed into a large dome
    const headCY = 32, headRX = 36, headRY = 28;

    // First: fill the dome shape with base colour
    for (let y = headCY - headRY; y <= headCY + headRY * 0.3; y++) {
      for (let x = cx - headRX; x <= cx + headRX; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / headRX, dy = (y - headCY) / headRY;
        if (dx * dx + dy * dy > 1) continue;
        // Base dome shading
        const nx = dx * 0.7, ny = dy * 0.6;
        const nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        let v = 0.06 + dot * 0.5;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.3 ? fg : fg, Math.max(0.03, v)));
      }
    }

    // Now overlay individual floret bumps — small spheres packed tightly
    const florets = [];
    for (let i = 0; i < 45; i++) {
      const angle = rng() * Math.PI * 2;
      const r = rng() * 0.85;
      const fx = cx + Math.round(Math.cos(angle) * headRX * r);
      const fy = headCY + Math.round(Math.sin(angle) * headRY * r * 0.7) - Math.round(r * 5);
      const fSize = 5 + Math.round(rng() * 6);
      // Only place in the dome area
      const dx = (fx - cx) / headRX, dy = (fy - headCY) / headRY;
      if (dx * dx + dy * dy > 0.95) continue;
      florets.push({ x: fx, y: fy, size: fSize });
    }

    // Sort by Y for painter's order
    florets.sort((a, b) => a.y - b.y);

    for (const f of florets) {
      const halfS = Math.round(f.size / 2);
      // Global light at this floret's position
      const gdx = (f.x - cx) / headRX, gdy = (f.y - headCY) / headRY;
      const gnz = Math.sqrt(Math.max(0.01, 1 - gdx * gdx * 0.5 - gdy * gdy * 0.3));
      const gLight = Math.max(0, lx * gdx * 0.7 + ly * gdy * 0.6 + lz * gnz) * 0.5 + 0.15;

      for (let dy = -halfS; dy <= halfS; dy++) {
        for (let dx = -halfS; dx <= halfS; dx++) {
          const d = dx * dx + dy * dy;
          if (d > halfS * halfS) continue;
          const px = f.x + dx, py = f.y + dy;
          if (px < 0 || px >= 96 || py < 0 || py >= 96) continue;

          // Per-floret sphere normal
          const lnx = dx / (halfS + 1) * 0.6;
          const lny = (dy / (halfS + 1) - 0.2) * 0.8;
          const lnz = Math.sqrt(Math.max(0.08, 1 - lnx * lnx - lny * lny));
          const localDot = Math.max(0, lx * lnx + ly * lny + lz * lnz);

          let v = gLight * 0.35 + localDot * 0.65;
          v += (rng() - 0.5) * 0.03; // texture noise
          v = v * v * (3 - 2 * v);
          v = Math.max(0.03, Math.min(1, v));

          // Warm-lit = bright green, cool shadow = deep green
          pc.setPixel(px, py, tone(v > 0.4 ? fl : fg, v));
        }
      }

      // Tiny highlight on each floret top
      if (gLight > 0.25 && f.size > 5) {
        const hx = f.x - 1, hy = f.y - halfS + 1;
        if (hx >= 0 && hx < 96 && hy >= 0 && hy < 96) {
          pc.setPixel(hx, hy, tone(fl, Math.min(1, gLight + 0.3)));
        }
      }
    }

    // CONNECT floret head to stem — fill the gap between stem top and floret bottom
    // The stem flares outward where it meets the head
    for (let y = stemTop - 8; y <= stemTop + 2; y++) {
      const t = (y - (stemTop - 8)) / 10;
      const flareW = Math.round(stemW * (1 + (1 - t) * 1.2)); // wide at top, narrows to stem width
      for (let dx = -flareW; dx <= flareW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const nx = dx / (flareW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        let v = 0.08 + dot * 0.45;
        v = v * v * (3 - 2 * v);
        // Use stem colour for the flare connection
        pc.setPixel(x, y, tone(v > 0.3 ? sg : ss, Math.max(0.04, v)));
      }
    }

    // Dark shadow line where floret mass sits on the flare
    for (let dx = -18; dx <= 18; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 96 && stemTop - 8 >= 0) {
        pc.setPixel(x, stemTop - 8, tone(fg, 0.05));
      }
    }

    // Contact shadow
    for (let dx = -14; dx <= 14; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 96 && stemBot + 1 < 96) {
        pc.setPixel(x, stemBot + 1, tone(ss, 0.04));
      }
    }
  },
};
