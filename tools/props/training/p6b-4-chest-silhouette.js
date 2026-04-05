// Phase 6B.4: Treasure Chest — SILHOUETTE ONLY
// Box body + curved lid + metal bands + clasp. Front view.
// The HD chest from earlier had bad proportions. Redo with construction method.

module.exports = {
  width: 128,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;
    const cx = 64;

    // Chest proportions:
    // Wider than tall (roughly 1.5:1)
    // Lower box: rectangular, ~55% of total height
    // Upper lid: barrel-vault curve, ~35% of total height
    // Seam visible between lid and box
    // Clasp in centre front

    const chestLeft = 16, chestRight = 112;
    const lidTopY = 12, seamY = 42, boxBotY = 82;
    const chestW = (chestRight - chestLeft) / 2;

    // LID — barrel vault (elliptical arc)
    for (let y = lidTopY; y <= seamY; y++) {
      const t = (seamY - y) / (seamY - lidTopY); // 1 at top, 0 at seam
      // Elliptical: width narrows toward top following an arc
      const halfW = Math.round(chestW * Math.sqrt(1 - t * t * 0.7));
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }
    }

    // BOX — straight-sided rectangle
    for (let y = seamY; y <= boxBotY; y++) {
      for (let x = chestLeft; x <= chestRight; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }
    }

    // Base trim — slightly wider
    for (let y = boxBotY; y <= boxBotY + 3; y++) {
      for (let x = chestLeft - 2; x <= chestRight + 2; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }
    }

    // Clasp — small rectangle in centre at the seam
    for (let y = seamY - 8; y <= seamY + 12; y++) {
      for (let x = cx - 8; x <= cx + 8; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }
    }
  },
};
