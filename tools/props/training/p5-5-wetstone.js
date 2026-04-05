// Phase 5, Exercise 5.5: Wet stone — matte base + sharp speculars + darkened saturated colour
module.exports = {
  width: 96,
  height: 96,
  style: 'illustrated',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    stone: '#556655',      // muted green-grey when wet
    stonedark: '#334433',  // darker when wet (saturated)
    highlight: '#eeffee',  // specular on wet surface
    ground: '#667766',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.stone.startIdx); },

  drawPost(pc, pal) {
    const stg = pal.groups.stone;
    const sdg = pal.groups.stonedark;
    const hg = pal.groups.highlight;
    const gg = pal.groups.ground;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, cy = 46;
    const lx = -0.55, ly = -0.65, lz = 0.52;
    const rng = sf2_seededRNG(42);

    // Ground
    const groundY = 78;
    for (let y = groundY; y < 96; y++) {
      for (let x = 0; x < 96; x++) {
        pc.setPixel(x, y, tone(gg, Math.max(0.08, 0.38 - ((y - groundY) / 18) * 0.08)));
      }
    }

    // Water puddle around base
    for (let y = groundY - 2; y < groundY + 6; y++) {
      for (let x = cx - 38; x < cx + 38; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / 38, dy = (y - (groundY + 1)) / 4;
        const d = dx * dx + dy * dy;
        if (d < 1) {
          pc.setPixel(x, y, tone(sdg, Math.max(0.06, 0.2 * (0.6 + d * 0.4))));
        }
      }
    }

    // Stone — irregular rock shape from Phase 1 exercise 1.6
    const rockRX = 36, rockRY = 30;
    const bumps = [];
    for (let i = 0; i < 7; i++) {
      bumps.push({
        angle: rng() * Math.PI * 2,
        amplitude: 0.05 + rng() * 0.1,
        frequency: 2 + rng() * 3,
      });
    }

    for (let y = cy - rockRY - 3; y <= cy + rockRY + 3; y++) {
      for (let x = cx - rockRX - 3; x <= cx + rockRX + 3; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;

        const dx = (x - cx) / rockRX, dy = (y - cy) / rockRY;
        let radiusMod = 1;
        const angle = Math.atan2(dy, dx);
        for (const bump of bumps) {
          radiusMod += bump.amplitude * Math.cos((angle - bump.angle) * bump.frequency);
        }
        if (dy > 0) radiusMod += dy * 0.12;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radiusMod) continue;

        // Surface normal with bump perturbation
        let nx = dx / radiusMod;
        let ny = (dy / radiusMod) * 0.8;
        let nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));

        for (const bump of bumps) {
          nx += Math.cos(bump.angle) * Math.sin((angle - bump.angle) * bump.frequency) * bump.amplitude * 0.4;
          ny += Math.sin(bump.angle) * Math.sin((angle - bump.angle) * bump.frequency) * bump.amplitude * 0.4;
        }
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len; ny /= len; nz /= len;

        // WET STONE MATERIAL:
        // 1. Base is DARKER than dry stone (water absorbs light)
        // 2. Surface has SHARP SPECULAR (water layer acts like a mirror)
        // 3. Colour is more SATURATED when wet

        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);

        // Matte stone diffuse (broad, soft — like dry stone but darker base)
        const matteValue = 0.06 + diffuse * 0.45;

        // Wet specular — water layer creates sharp reflections on top of matte stone
        const rr = 2 * NdotL * nz - lz;
        const wetSpecular = Math.pow(Math.max(0, rr), 80) * 0.5;

        // Surface roughness — stone texture under the water
        const roughness = (rng() - 0.5) * 0.04;

        const bounce = Math.max(0, ny * 0.25) * 0.08;

        let value = matteValue + bounce + roughness;
        value = Math.max(0, Math.min(1, value));
        value = value * value * (3 - 2 * value);

        // Wet stone is darker overall (multiply by 0.7) but more saturated
        if (value > 0.35) {
          pc.setPixel(x, y, tone(stg, value * 0.75));
        } else {
          pc.setPixel(x, y, tone(sdg, Math.max(0.03, value * 1.2)));
        }
      }
    }

    // WET SPECULAR HIGHLIGHTS — sharp tiny dots scattered across the surface
    // This is what makes wet stone look wet — many small bright points
    for (let pass = 0; pass < 200; pass++) {
      const sx = cx + Math.round((rng() - 0.5) * rockRX * 1.6);
      const sy = cy + Math.round((rng() - 0.5) * rockRY * 1.4);
      if (sx < 0 || sx >= 96 || sy < 0 || sy >= 96) continue;
      if (!pc.isFilled(sx, sy)) continue;

      // Only place speculars on the lit side
      const snx = (sx - cx) / rockRX, sny = (sy - cy) / rockRY;
      const snz = Math.sqrt(Math.max(0, 1 - snx * snx * 0.5 - sny * sny * 0.5));
      const sdot = snx * lx + sny * ly + snz * lz;
      if (sdot < 0.2) continue; // only lit areas

      // Bright specular dot — water surface catching light
      if (rng() < 0.15) {
        pc.setPixel(sx, sy, tone(hg, 0.6 + rng() * 0.35));
        // Some are tiny clusters of 2-3 pixels
        if (rng() < 0.3 && sx + 1 < 96) pc.setPixel(sx + 1, sy, tone(hg, 0.5));
      }
    }

    // Large primary specular — same as metal but slightly softer
    const specX = cx - Math.round(rockRX * 0.25);
    const specY = cy - Math.round(rockRY * 0.3);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        const px = specX + dx, py = specY + dy;
        if (d <= 3 && px >= 0 && px < 96 && py >= 0 && py < 96 && pc.isFilled(px, py)) {
          if (d <= 1.5) pc.setPixel(px, py, tone(hg, 0.95));
          else pc.setPixel(px, py, tone(hg, 0.5 * (1 - (d - 1.5) / 1.5)));
        }
      }
    }

    // Contact shadow / water line at base
    for (let x = cx - rockRX; x <= cx + rockRX; x++) {
      if (x >= 0 && x < 96 && groundY - 1 >= 0 && groundY - 1 < 96) {
        pc.setPixel(x, groundY - 1, tone(sdg, 0.03));
      }
    }
  },
};
