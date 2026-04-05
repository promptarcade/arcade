// Level 3.2: Head Close-up — 64×64 greyscale
// Goal: hair has full 3D form shading, face has subtle directional tone
// Face = bright canvas you COULD draw features on
// Hair wraps around head, drawn AFTER head sphere
module.exports = {
  width: 64,
  height: 64,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    grey: '#888888',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.grey.startIdx); },
  drawPost(pc, pal) {
    const g = pal.groups.grey;
    function tone(frac) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1,
        Math.round(frac * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const W = 64, H = 64;
    const cx = 32, cy = 34;
    const headRx = 22, headRy = 22;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // ========================================
    // HEAD — sphere, face area kept bright
    // ========================================
    for (let y = cy - headRy; y <= cy + headRy; y++) {
      for (let x = cx - headRx; x <= cx + headRx; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const nx = (x - cx) / headRx, ny = (y - cy) / headRy;
        if (nx * nx + ny * ny > 1) continue;

        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 35) * 0.2;
        const bounce = Math.max(0, ny * 0.3) * 0.1;

        let v = 0.04 + diffuse * 0.68 + specular + bounce;
        v = v * v * (3 - 2 * v);
        v = Math.max(0.02, Math.min(1, v));

        // Face bias: front-center area stays bright
        const isFace = ny > -0.25 && ny < 0.55 && Math.abs(nx) < 0.55 && nz > 0.65;
        if (isFace) {
          // Keep face bright but allow subtle directional shading
          // Compress shadow range — face never goes below 0.5
          v = 0.5 + v * 0.5;
        }

        pc.setPixel(x, y, tone(v));
      }
    }

    // Ears — small bumps on sides
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (dx * dx + dy * dy > 4) continue;
        const ey = cy + 2 + dy;
        // Left ear
        const lEx = cx - headRx - 1 + dx;
        if (lEx >= 0 && lEx < W && ey >= 0 && ey < H) {
          const ev = 0.2 + (dx + 2) * 0.06; // gradient across ear
          pc.setPixel(lEx, ey, tone(ev));
        }
        // Right ear
        const rEx = cx + headRx + 1 + dx;
        if (rEx >= 0 && rEx < W && ey >= 0 && ey < H) {
          const ev = 0.4 + (dx + 2) * 0.08;
          pc.setPixel(rEx, ey, tone(ev));
        }
      }
    }

    // ========================================
    // HAIR — wraps around top and sides of head
    // Drawn AFTER head so it overlays
    // Full sphere shading (no face bias)
    // ========================================

    // Hair covers the top ~55% of the head and extends 3-4px beyond
    const hairCy = cy - 4; // hair sphere center is higher than head
    const hairRx = headRx + 3, hairRy = headRy - 2;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const hnx = (x - cx) / hairRx, hny = (y - hairCy) / hairRy;
        if (hnx * hnx + hny * hny > 1) continue;

        // Hair only covers the TOP portion — above eye level
        // And wraps around the SIDES above the ears
        const isTop = y < cy - 2; // above eye level
        const isSide = Math.abs(x - cx) > headRx - 3 && y < cy + 3;
        // Fringe/bangs come down to just above eyes
        const isFringe = y >= cy - 6 && y <= cy - 1 && Math.abs(x - cx) < headRx - 2;

        if (!isTop && !isSide && !isFringe) continue;

        const nz = Math.sqrt(Math.max(0, 1 - hnx * hnx - hny * hny));
        const NdotL = hnx * lx + hny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 25) * 0.3;
        const bounce = Math.max(0, hny * 0.2) * 0.08;

        let v = 0.03 + diffuse * 0.55 + specular + bounce;
        v = v * v * (3 - 2 * v);
        v = Math.max(0.02, Math.min(0.85, v)); // hair never goes pure white

        // Hair highlight — bright streak on lit side
        const highlightStrip = Math.abs(hnx + 0.3) < 0.15 && hny < -0.1 && hny > -0.6;
        if (highlightStrip) v = Math.min(0.9, v + 0.2);

        pc.setPixel(x, y, tone(v));
      }
    }

    // ========================================
    // NECK — below head, occlusion shadow
    // ========================================
    const neckTop = cy + headRy + 1;
    for (let y = neckTop; y < Math.min(H, neckTop + 5); y++) {
      const neckW = 5;
      for (let x = cx - neckW; x <= cx + neckW; x++) {
        if (x < 0 || x >= W || y >= H) continue;
        // Cylinder shading with occlusion darkening
        const nx = (x - cx) / (neckW + 0.5);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const NdotL = nx * lx + nz * lz;
        let v = 0.05 + Math.max(0, NdotL) * 0.35; // dark — head shadow
        // Darker at top (closer to head)
        const depth = (y - neckTop) / 5;
        v *= (0.5 + depth * 0.5);
        pc.setPixel(x, y, tone(v));
      }
    }
  },
};
