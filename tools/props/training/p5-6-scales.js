// Phase 5.6: Reptile scales on a curved surface
// Training: per-form lighting, tight packing, dark crevices between forms
// Key technique: each scale is a tiny dome with its own highlight/shadow,
// PLUS global position lighting blended in. Rows overlap (tight packing).

module.exports = {
  width: 96, height: 128, style: 'hd', entityType: 'prop', outlineMode: 'none',
  colors: {
    scale: '#558844',    // green scale
    scaleShd: '#334422', // dark scale shadow
    hi: '#aabb77',       // scale highlight
    crevice: '#112211',  // dark crevice between scales
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.scale.startIdx); },
  drawPost(pc, pal) {
    const sc = pal.groups.scale, ss = pal.groups.scaleShd, hg = pal.groups.hi, cr = pal.groups.crevice;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;

    const cx = 48, cy = 64;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // Underlying cylinder shape for the scale surface
    const cylHW = 40, cylTop = 8, cylBot = 120;

    // Fill with dark crevice colour first
    for (let y = cylTop; y <= cylBot; y++) {
      const hw = cylHW * Math.sqrt(Math.max(0, 1 - Math.pow((y - cy) / (cylBot - cylTop) * 2, 2) * 0.3));
      for (let dx = -Math.round(hw); dx <= Math.round(hw); dx++) {
        const x = cx + dx;
        if (x >= 0 && x < 96 && y < 128) pc.setPixel(x, y, tone(cr, 0.05));
      }
    }

    // Generate scale positions — hex grid with tight packing
    const scaleSize = 9;
    const rowSpacing = scaleSize - 2; // overlap for tight packing
    const scales = [];

    for (let row = 0; row < 20; row++) {
      const y = cylTop + 4 + row * rowSpacing;
      const offset = (row % 2) * (scaleSize * 0.5);
      for (let col = -5; col < 12; col++) {
        const x = cx - 40 + col * scaleSize + offset;
        // Small jitter (30%)
        const jx = x + ((row * 7 + col * 13) % 5 - 2) * 0.3;
        const jy = y + ((row * 11 + col * 3) % 5 - 2) * 0.3;
        scales.push({ x: Math.round(jx), y: Math.round(jy) });
      }
    }

    // Sort by Y for painter's order
    scales.sort((a, b) => a.y - b.y);

    // Draw each scale
    for (const s of scales) {
      const scaleR = Math.round(scaleSize * 0.55);

      for (let dy = -scaleR; dy <= scaleR; dy++) {
        for (let dx = -scaleR; dx <= scaleR; dx++) {
          if (dx * dx + dy * dy > scaleR * scaleR) continue;
          const px = s.x + dx, py = s.y + dy;
          if (px < 0 || px >= 96 || py < 0 || py >= 128) continue;

          // Check this pixel is within the cylinder
          const cylDx = px - cx;
          const cylT = (py - cy) / ((cylBot - cylTop) / 2);
          const cylMaxHW = cylHW * Math.sqrt(Math.max(0, 1 - cylT * cylT * 0.3));
          if (Math.abs(cylDx) > cylMaxHW) continue;

          // Global position lighting (cylinder)
          const gNx = cylDx / (cylMaxHW + 1);
          const gNz = Math.sqrt(Math.max(0.1, 1 - gNx * gNx));
          const globalLight = Math.max(0, gNx * lx + gNz * lz);

          // Per-scale dome lighting
          const snx = dx / (scaleR + 0.5), sny = dy / (scaleR + 0.5);
          const snz = Math.sqrt(Math.max(0, 1 - snx * snx - sny * sny));
          const localLight = Math.max(0, snx * lx + sny * ly + snz * lz);

          // Blend: 35% global, 65% local
          const blended = globalLight * 0.35 + localLight * 0.65;

          // Top-edge ridge highlight
          const ridge = dy < -scaleR + 2 ? 0.15 : 0;

          let v = 0.06 + blended * 0.6 + ridge;
          v = v * v * (3 - 2 * v);

          if (v > 0.55) {
            pc.setPixel(px, py, tone(hg, v));
          } else if (v > 0.3) {
            pc.setPixel(px, py, tone(sc, v + 0.1));
          } else {
            pc.setPixel(px, py, tone(ss, Math.max(0.06, v * 1.5)));
          }
        }
      }
    }
  },
};
