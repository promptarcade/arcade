// Phase 6B.6: Tree — SHADED (silhouette verified: organic bumpy canopy + tapered trunk)

module.exports = {
  width: 96,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    leaf: '#448833',
    leaflit: '#66aa44',
    bark: '#664422',
    barkshd: '#442211',
    ground: '#556644',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.leaf.startIdx); },

  drawPost(pc, pal) {
    const lf = pal.groups.leaf;
    const ll = pal.groups.leaflit;
    const bk = pal.groups.bark;
    const bs = pal.groups.barkshd;
    const gr = pal.groups.ground;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(33);

    // Ground hint
    for (let y = 122; y < 128; y++) {
      for (let x = 0; x < 96; x++) {
        pc.setPixel(x, y, tone(gr, 0.15 - (y - 122) / 24));
      }
    }

    // TRUNK — tapered cylinder with bark texture
    const trunkTopY = 70, trunkBotY = 122;
    for (let y = trunkTopY; y <= trunkBotY; y++) {
      const t = (y - trunkTopY) / (trunkBotY - trunkTopY);
      const halfW = Math.round(4 + t * 6 + Math.sin(t * 2) * 1);
      const curveX = Math.round(Math.sin(t * 1.5) * 2);

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + curveX + dx;
        if (x < 0 || x >= 96 || y >= 128) continue;

        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);

        let v = 0.08 + dot * 0.5;
        // Bark texture — vertical streaks
        if (Math.abs(dx) > 1 && rng() < 0.15) v *= 0.7;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.25 ? bk : bs, Math.max(0.03, v)));
      }
    }

    // Root flare
    for (let y = trunkBotY - 4; y <= trunkBotY + 2; y++) {
      const t = (y - (trunkBotY - 4)) / 6;
      const halfW = Math.round(10 + t * 6);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 96 || y >= 128) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        let v = 0.06 + dot * 0.35;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.2 ? bk : bs, Math.max(0.03, v)));
      }
    }

    // Visible branches
    const branches = [{angle: -0.8, len: 18}, {angle: 0.6, len: 15}, {angle: -0.3, len: 12}];
    for (const branch of branches) {
      for (let along = 0; along < branch.len; along++) {
        const bx = Math.round(cx + Math.cos(branch.angle) * along * 1.5);
        const by = Math.round(trunkTopY + 5 - Math.sin(branch.angle) * along * 0.8);
        const bw = Math.max(1, 3 - Math.round(along / branch.len * 2));
        for (let w = -bw; w <= bw; w++) {
          if (bx >= 0 && bx < 96 && by + w >= 0 && by + w < 128) {
            pc.setPixel(bx, by + w, tone(bk, 0.15 + (1 - along / branch.len) * 0.15));
          }
        }
      }
    }

    // CANOPY — overlapping leaf blobs with individual sphere lighting
    const canopyCY = 44;
    const blobs = [
      { x: cx, y: canopyCY, rx: 35, ry: 30 },
      { x: cx - 18, y: canopyCY + 5, rx: 22, ry: 18 },
      { x: cx + 15, y: canopyCY - 3, rx: 24, ry: 20 },
      { x: cx - 8, y: canopyCY - 15, rx: 18, ry: 16 },
      { x: cx + 5, y: canopyCY - 18, rx: 15, ry: 14 },
      { x: cx + 22, y: canopyCY + 10, rx: 16, ry: 14 },
    ];

    // Draw canopy blobs — each is a Phase 1 sphere with leaf material
    for (const blob of blobs) {
      for (let y = blob.y - blob.ry; y <= blob.y + blob.ry; y++) {
        for (let x = blob.x - blob.rx; x <= blob.x + blob.rx; x++) {
          if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
          const dx = (x - blob.x) / blob.rx, dy = (y - blob.y) / blob.ry;
          if (dx * dx + dy * dy > 1) continue;

          const nx = dx * 0.7, ny = dy * 0.6;
          const nz = Math.sqrt(Math.max(0.01, 1 - nx * nx - ny * ny));
          const dot = Math.max(0, lx * nx + ly * ny + lz * nz);

          let v = 0.06 + dot * 0.6;
          // Leaf texture noise
          v += (rng() - 0.5) * 0.06;
          v = v * v * (3 - 2 * v);
          v = Math.max(0.03, Math.min(1, v));

          // Warm lit = bright yellow-green, cool shadow = deep green
          pc.setPixel(x, y, tone(v > 0.35 ? ll : lf, v));
        }
      }
    }

    // Edge bumps for organic feel
    for (let i = 0; i < 14; i++) {
      const angle = rng() * Math.PI * 2;
      const r = 28 + rng() * 10;
      const bx = Math.round(cx + Math.cos(angle) * r);
      const by = Math.round(canopyCY + Math.sin(angle) * r * 0.7);
      const br = 4 + Math.round(rng() * 4);
      for (let dy = -br; dy <= br; dy++) {
        for (let dx = -br; dx <= br; dx++) {
          if (dx * dx + dy * dy > br * br) continue;
          const px = bx + dx, py = by + dy;
          if (px < 0 || px >= 96 || py < 0 || py >= 128) continue;
          const bnx = dx / br * 0.5, bny = dy / br * 0.4;
          const bnz = Math.sqrt(Math.max(0.1, 1 - bnx * bnx - bny * bny));
          const bdot = Math.max(0, lx * bnx + ly * bny + lz * bnz);
          let bv = 0.08 + bdot * 0.55 + (rng() - 0.5) * 0.04;
          bv = bv * bv * (3 - 2 * bv);
          pc.setPixel(px, py, tone(bv > 0.35 ? ll : lf, Math.max(0.03, bv)));
        }
      }
    }

    // Trunk shadow on ground
    for (let dx = -8; dx <= 20; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < 96 && trunkBotY + 3 < 128) {
        pc.setPixel(x, trunkBotY + 3, tone(gr, 0.04));
      }
    }

    // Canopy shadow on trunk — dark area where canopy overhangs
    for (let y = trunkTopY; y < trunkTopY + 10; y++) {
      const halfW = Math.round(4 + ((y - trunkTopY) / 10) * 2);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x >= 0 && x < 96 && y < 128 && pc.isFilled(x, y)) {
          pc.setPixel(x, y, tone(bs, 0.06));
        }
      }
    }
  },
};
