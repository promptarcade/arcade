// Phase 5, Exercise 5.2: Wooden plank — grain, warm colour, matte surface
module.exports = {
  width: 96,
  height: 64,
  style: 'illustrated',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    wood: '#8b5e3c',
    wooddark: '#5c3a1e',
    woodlit: '#b8844c',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.wood.startIdx); },

  drawPost(pc, pal) {
    const wg = pal.groups.wood;
    const wdg = pal.groups.wooddark;
    const wlg = pal.groups.woodlit;
    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const rng = sf2_seededRNG(42);
    const lx = -0.55, ly = -0.65, lz = 0.52;

    // Plank — 3/4 view, showing top face and front edge
    const plankLeft = 8, plankRight = 88;
    const topFaceTop = 10, topFaceBot = 32;
    const frontTop = 32, frontBot = 52;
    const depth = 5; // perspective offset for top face

    // Ground shadow
    for (let y = frontBot + 2; y < 64; y++) {
      for (let x = plankLeft + 8; x < plankRight + 8; x++) {
        if (x >= 96 || y >= 64) continue;
        const t = (y - frontBot - 2) / (64 - frontBot - 2);
        pc.setPixel(x, y, tone(wdg, Math.max(0.03, 0.15 * (0.5 + t * 0.5))));
      }
    }

    // FRONT FACE — facing viewer, medium bright
    for (let y = frontTop; y <= frontBot; y++) {
      for (let x = plankLeft; x <= plankRight; x++) {
        if (x >= 96 || y >= 64) continue;
        const nx = 0, ny = 0.1, nz = 0.99;
        const dot = Math.max(0, nx * lx + ny * ly + nz * lz);
        const base = 0.15 + dot * 0.5;
        pc.setPixel(x, y, tone(wg, Math.max(0.05, base)));
      }
    }

    // Front face — individual grain lines (vertical, each unique)
    for (let gx = plankLeft + 2; gx < plankRight - 2; gx += 2) {
      const grainDrift = (rng() - 0.5) * 1.5;
      const grainTone = 0.2 + rng() * 0.25;
      for (let y = frontTop + 1; y < frontBot - 1; y++) {
        const x = Math.round(gx + grainDrift + Math.sin(y * 0.15) * 0.8);
        if (x >= plankLeft && x < plankRight && x < 96 && y < 64) {
          if (rng() < 0.7) {
            pc.setPixel(x, y, tone(wdg, grainTone + rng() * 0.1));
          }
        }
      }
    }

    // Front face knots (1-2 random)
    for (let k = 0; k < 2; k++) {
      const kx = plankLeft + 15 + Math.round(rng() * 50);
      const ky = frontTop + 5 + Math.round(rng() * 12);
      const kr = 2 + Math.round(rng() * 2);
      for (let dy = -kr; dy <= kr; dy++) {
        for (let dx = -kr; dx <= kr; dx++) {
          if (dx * dx + dy * dy <= kr * kr) {
            const px = kx + dx, py = ky + dy;
            if (px >= plankLeft && px <= plankRight && py >= frontTop && py <= frontBot && px < 96 && py < 64) {
              const d = Math.sqrt(dx * dx + dy * dy) / kr;
              pc.setPixel(px, py, tone(wdg, 0.1 + d * 0.2));
            }
          }
        }
      }
      // Knot ring
      for (let a = 0; a < 360; a += 15) {
        const rad = a * Math.PI / 180;
        const rx = Math.round(kx + (kr + 1) * Math.cos(rad));
        const ry = Math.round(ky + (kr + 1) * Math.sin(rad));
        if (rx >= plankLeft && rx <= plankRight && ry >= frontTop && ry <= frontBot && rx < 96 && ry < 64) {
          pc.setPixel(rx, ry, tone(wdg, 0.25));
        }
      }
    }

    // TOP FACE — facing up, brightest
    for (let y = topFaceTop; y < topFaceBot; y++) {
      const t = (y - topFaceTop) / (topFaceBot - topFaceTop);
      const rowLeft = Math.round(plankLeft - depth * (1 - t));
      const rowRight = Math.round(plankRight - depth * (1 - t));
      for (let x = rowLeft; x <= rowRight; x++) {
        if (x < 0 || x >= 96 || y >= 64) continue;
        const dot = Math.max(0, -ly); // top face normal is (0, -1, 0)
        const base = 0.2 + dot * 0.55;
        pc.setPixel(x, y, tone(wlg, Math.max(0.1, base - t * 0.04)));
      }
    }

    // Top face grain — horizontal lines
    for (let gy = topFaceTop + 2; gy < topFaceBot - 1; gy += 2) {
      const t = (gy - topFaceTop) / (topFaceBot - topFaceTop);
      const rowLeft = Math.round(plankLeft - depth * (1 - t));
      const rowRight = Math.round(plankRight - depth * (1 - t));
      const grainTone = 0.3 + rng() * 0.2;
      for (let x = rowLeft + 2; x < rowRight - 2; x++) {
        if (x < 96 && rng() < 0.6) {
          pc.setPixel(x, gy, tone(wg, grainTone));
        }
      }
    }

    // Top front edge — bright highlight line where top meets front
    for (let x = plankLeft; x <= plankRight; x++) {
      if (x < 96 && frontTop < 64) {
        pc.setPixel(x, frontTop, tone(wlg, 0.8));
      }
    }

    // Front bottom edge — dark
    for (let x = plankLeft; x <= plankRight; x++) {
      if (x < 96 && frontBot < 64) {
        pc.setPixel(x, frontBot, tone(wdg, 0.08));
      }
    }

    // Left edge shadow
    for (let y = frontTop; y <= frontBot; y++) {
      if (plankLeft < 96 && y < 64) {
        pc.setPixel(plankLeft, y, tone(wdg, 0.1));
        pc.setPixel(plankLeft + 1, y, tone(wdg, 0.18));
      }
    }

    // Wood matte highlight — broad, soft, NOT a hard specular
    // This is the key difference from metal: wide gentle highlight, no sharp point
    for (let y = frontTop + 3; y < frontBot - 3; y++) {
      for (let x = plankLeft + 10; x < plankLeft + 30; x++) {
        if (x >= 96 || y >= 64) continue;
        if (rng() < 0.25) {
          pc.setPixel(x, y, tone(wlg, 0.45 + rng() * 0.1));
        }
      }
    }
  },
};
