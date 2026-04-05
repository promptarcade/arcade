// Phase 6B.6: Tree — SILHOUETTE ONLY
// Trunk (tapered, slightly curved) + canopy (organic dome, NOT a circle)
// Natural proportions — canopy is 2-3x wider than trunk

module.exports = {
  width: 96,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;
    const cx = 48;
    const rng = sf2_seededRNG(33);

    // Tree proportions:
    // Trunk: bottom 40% of height, tapers from wide base to narrow top
    // Canopy: top 65% of height (overlaps trunk), organic irregular dome
    // Canopy is NOT a perfect circle — bumpy, asymmetric

    const trunkBotY = 122, trunkTopY = 70;
    const canopyTopY = 8, canopyBotY = 80;

    // TRUNK — tapered, slight curve
    for (let y = trunkTopY; y <= trunkBotY; y++) {
      const t = (y - trunkTopY) / (trunkBotY - trunkTopY); // 0=top, 1=base
      const halfW = Math.round(4 + t * 6 + Math.sin(t * 2) * 1);
      const curveX = Math.round(Math.sin(t * 1.5) * 2);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + curveX + dx;
        if (x >= 0 && x < 96 && y >= 0 && y < 128) pc.setPixel(x, y, FLAT);
      }
    }

    // Root flare at base
    for (let y = trunkBotY - 4; y <= trunkBotY + 2; y++) {
      const t = (y - (trunkBotY - 4)) / 6;
      const halfW = Math.round(10 + t * 6);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x >= 0 && x < 96 && y >= 0 && y < 128) pc.setPixel(x, y, FLAT);
      }
    }

    // Major branches visible at canopy base
    for (const branch of [{angle: -0.8, len: 18}, {angle: 0.6, len: 15}, {angle: -0.3, len: 12}]) {
      for (let along = 0; along < branch.len; along++) {
        const bx = Math.round(cx + Math.cos(branch.angle) * along * 1.5);
        const by = Math.round(trunkTopY + 5 - Math.sin(branch.angle) * along * 0.8);
        for (let w = -3 + Math.round(along / branch.len * 2); w <= 3 - Math.round(along / branch.len * 2); w++) {
          if (bx >= 0 && bx < 96 && by + w >= 0 && by + w < 128) pc.setPixel(bx, by + w, FLAT);
        }
      }
    }

    // CANOPY — organic bumpy dome, NOT a perfect ellipse
    // Build from overlapping circles of varying sizes
    const canopyCY = 44;
    const blobs = [
      { x: cx, y: canopyCY, rx: 35, ry: 30 },         // main mass
      { x: cx - 18, y: canopyCY + 5, rx: 22, ry: 18 },  // left bulge
      { x: cx + 15, y: canopyCY - 3, rx: 24, ry: 20 },  // right upper
      { x: cx - 8, y: canopyCY - 15, rx: 18, ry: 16 },  // top left
      { x: cx + 5, y: canopyCY - 18, rx: 15, ry: 14 },  // top right
      { x: cx + 22, y: canopyCY + 10, rx: 16, ry: 14 },  // right lower
    ];

    for (const blob of blobs) {
      for (let y = blob.y - blob.ry; y <= blob.y + blob.ry; y++) {
        for (let x = blob.x - blob.rx; x <= blob.x + blob.rx; x++) {
          if (x < 0 || x >= 96 || y < 0 || y >= 128) continue;
          const dx = (x - blob.x) / blob.rx, dy = (y - blob.y) / blob.ry;
          if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
        }
      }
    }

    // Small bumps on canopy edge for organic feel
    for (let i = 0; i < 12; i++) {
      const angle = rng() * Math.PI * 2;
      const r = 28 + rng() * 10;
      const bx = Math.round(cx + Math.cos(angle) * r);
      const by = Math.round(canopyCY + Math.sin(angle) * r * 0.7);
      const br = 4 + Math.round(rng() * 4);
      for (let dy = -br; dy <= br; dy++) {
        for (let dx = -br; dx <= br; dx++) {
          if (dx * dx + dy * dy <= br * br) {
            const px = bx + dx, py = by + dy;
            if (px >= 0 && px < 96 && py >= 0 && py < 128) pc.setPixel(px, py, FLAT);
          }
        }
      }
    }
  },
};
