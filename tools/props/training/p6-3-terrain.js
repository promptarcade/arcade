// Phase 6, Exercise 6.3: Terrain tile set — grass, dirt, water, stone
// Training target: consistent style across a SET of tiles. All four must look
// like they belong in the same game.

module.exports = {
  width: 128,
  height: 32,  // four 32x32 tiles side by side
  style: 'chibi',
  entityType: 'terrain',
  outlineMode: 'none',
  colors: {
    grass: '#448833',
    grasslit: '#66aa44',
    dirt: '#886644',
    dirtdark: '#664422',
    water: '#3366aa',
    waterlit: '#5588cc',
    stone: '#778888',
    stonedark: '#556666',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.grass.startIdx); },

  drawPost(pc, pal) {
    const grg = pal.groups.grass;
    const glg = pal.groups.grasslit;
    const drg = pal.groups.dirt;
    const ddg = pal.groups.dirtdark;
    const wg = pal.groups.water;
    const wlg = pal.groups.waterlit;
    const stg = pal.groups.stone;
    const sdg = pal.groups.stonedark;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const rng = sf2_seededRNG(42);
    const tileSize = 32;

    // === TILE 1: GRASS (0-31) ===
    // Base fill + vertical tuft clusters
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        pc.setPixel(x, y, tone(grg, 0.35 + rng() * 0.08));
      }
    }
    // Tufts — vertical 2-4px clusters, highlights at tips
    for (let tx = 1; tx < 31; tx += 2 + Math.round(rng() * 2)) {
      const tufts = 2 + Math.round(rng() * 2);
      for (let ty = 0; ty < tufts; ty++) {
        const baseY = 4 + Math.round(rng() * 22);
        const height = 2 + Math.round(rng() * 3);
        for (let dy = 0; dy < height; dy++) {
          const py = baseY + dy;
          if (py < 32) {
            if (dy === 0) {
              // Tip — bright
              pc.setPixel(tx, py, tone(glg, 0.6 + rng() * 0.2));
            } else {
              // Body — mid
              pc.setPixel(tx, py, tone(grg, 0.4 + rng() * 0.15));
            }
          }
        }
        // Shadow at base
        if (baseY + height < 32) {
          pc.setPixel(tx, baseY + height, tone(grg, 0.15 + rng() * 0.05));
        }
      }
    }

    // === TILE 2: DIRT (32-63) ===
    for (let y = 0; y < 32; y++) {
      for (let x = 32; x < 64; x++) {
        pc.setPixel(x, y, tone(drg, 0.35 + rng() * 0.1));
      }
    }
    // Small round clusters (pebble texture)
    for (let p = 0; p < 20; p++) {
      const px = 33 + Math.round(rng() * 28);
      const py = 1 + Math.round(rng() * 28);
      const pr = 1 + Math.round(rng());
      for (let dy = -pr; dy <= pr; dy++) {
        for (let dx = -pr; dx <= pr; dx++) {
          if (dx * dx + dy * dy <= pr * pr) {
            const xx = px + dx, yy = py + dy;
            if (xx >= 32 && xx < 64 && yy >= 0 && yy < 32) {
              pc.setPixel(xx, yy, tone(drg, 0.28 + rng() * 0.15));
            }
          }
        }
      }
      // Pebble highlight
      if (px >= 32 && px < 64 && py > 0 && py < 32) {
        pc.setPixel(px, py - 1, tone(drg, 0.55));
      }
    }
    // Crack lines
    for (let c = 0; c < 3; c++) {
      let crackX = 35 + Math.round(rng() * 24);
      let crackY = 3 + Math.round(rng() * 10);
      for (let step = 0; step < 8 + Math.round(rng() * 8); step++) {
        if (crackX >= 32 && crackX < 64 && crackY >= 0 && crackY < 32) {
          pc.setPixel(crackX, crackY, tone(ddg, 0.15 + rng() * 0.08));
        }
        crackX += Math.round((rng() - 0.5) * 2);
        crackY += 1 + Math.round(rng());
      }
    }

    // === TILE 3: WATER (64-95) ===
    for (let y = 0; y < 32; y++) {
      for (let x = 64; x < 96; x++) {
        // Water uses interconnected blob shapes
        const wx = (x - 64) / 32, wy = y / 32;
        const wave = Math.sin(wx * 8 + wy * 3) * 0.5 + Math.sin(wy * 12 - wx * 2) * 0.3;
        const base = 0.3 + wave * 0.12;
        pc.setPixel(x, y, tone(wg, Math.max(0.1, base + rng() * 0.04)));
      }
    }
    // Wave crests — bright highlights
    for (let y = 0; y < 32; y++) {
      for (let x = 64; x < 96; x++) {
        const wx = (x - 64) / 32, wy = y / 32;
        const wave = Math.sin(wx * 8 + wy * 3);
        if (wave > 0.6) {
          pc.setPixel(x, y, tone(wlg, 0.5 + (wave - 0.6) * 0.8));
        }
      }
    }
    // Sparkle dots
    for (let s = 0; s < 5; s++) {
      const sx = 65 + Math.round(rng() * 28);
      const sy = 1 + Math.round(rng() * 28);
      if (sx < 96 && sy < 32) {
        pc.setPixel(sx, sy, tone(wlg, 0.85 + rng() * 0.15));
      }
    }

    // === TILE 4: STONE (96-127) ===
    // Irregular stone shapes with mortar lines between
    // First fill with mortar (dark)
    for (let y = 0; y < 32; y++) {
      for (let x = 96; x < 128; x++) {
        pc.setPixel(x, y, tone(sdg, 0.12 + rng() * 0.04));
      }
    }
    // Place stones — irregular rectangles
    const stones = [];
    for (let row = 0; row < 4; row++) {
      let sx = 97;
      while (sx < 126) {
        const sw = 4 + Math.round(rng() * 6);
        const sh = 5 + Math.round(rng() * 2);
        const sy = row * 8 + Math.round(rng() * 2);
        stones.push({ x: sx, y: sy, w: Math.min(sw, 126 - sx), h: sh });
        sx += sw + 1; // 1px mortar gap
      }
    }
    for (const s of stones) {
      for (let dy = 0; dy < s.h; dy++) {
        for (let dx = 0; dx < s.w; dx++) {
          const px = s.x + dx, py = s.y + dy;
          if (px >= 96 && px < 128 && py >= 0 && py < 32) {
            // Per-stone shading: top-left bright, bottom-right dark
            const tx = dx / s.w, ty = dy / s.h;
            let sv = 0.3 + (1 - tx) * 0.15 + (1 - ty) * 0.15;
            sv += (rng() - 0.5) * 0.06;
            pc.setPixel(px, py, tone(stg, Math.max(0.1, sv)));
          }
        }
      }
      // Top edge highlight
      for (let dx = 0; dx < s.w; dx++) {
        const px = s.x + dx;
        if (px >= 96 && px < 128 && s.y >= 0 && s.y < 32) {
          pc.setPixel(px, s.y, tone(stg, 0.55 + rng() * 0.1));
        }
      }
      // Bottom edge shadow
      const botY = s.y + s.h - 1;
      for (let dx = 0; dx < s.w; dx++) {
        const px = s.x + dx;
        if (px >= 96 && px < 128 && botY >= 0 && botY < 32) {
          pc.setPixel(px, botY, tone(sdg, 0.2));
        }
      }
    }
  },
};
