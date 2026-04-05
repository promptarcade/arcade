// Phase 6C.3: Whole Roast Chicken — SILHOUETTE ONLY
// Complex organic compound form. Oval body, two drumsticks visible, browned skin.
// Side view of a cooked chicken on a plate.

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

    const cx = 64, cy = 45;

    // Body — large horizontal oval, wider than tall
    const bodyRX = 40, bodyRY = 26;
    for (let y = cy - bodyRY; y <= cy + bodyRY; y++) {
      for (let x = cx - bodyRX; x <= cx + bodyRX; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / bodyRX, dy = (y - cy) / bodyRY;
        // Slightly flattened bottom (sits on plate)
        let rMod = 1;
        if (dy > 0.5) rMod += (dy - 0.5) * 0.2;
        if (dx * dx + dy * dy <= rMod * rMod) pc.setPixel(x, y, FLAT);
      }
    }

    // Drumsticks — two tapered legs visible at front, angling outward
    for (const side of [-1, 1]) {
      const legBaseX = cx + side * 20;
      const legBaseY = cy + bodyRY - 8;
      const legTipX = cx + side * 38;
      const legTipY = cy + bodyRY + 12;

      for (let t = 0; t <= 1; t += 0.005) {
        const lx = legBaseX + (legTipX - legBaseX) * t;
        const ly = legBaseY + (legTipY - legBaseY) * t;
        // Drumstick: thick at body, narrows to bone tip
        const w = Math.round(8 * (1 - t * 0.6));
        for (let dw = -w; dw <= w; dw++) {
          // Perpendicular to leg direction
          const perpX = -(legTipY - legBaseY);
          const perpY = legTipX - legBaseX;
          const pLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
          const px = Math.round(lx + (perpX / pLen) * dw);
          const py = Math.round(ly + (perpY / pLen) * dw);
          if (px >= 0 && px < 128 && py >= 0 && py < 96) pc.setPixel(px, py, FLAT);
        }
      }

      // Bone tip — small white circle at end of drumstick
      const boneR = 3;
      for (let dy = -boneR; dy <= boneR; dy++) {
        for (let dx = -boneR; dx <= boneR; dx++) {
          if (dx * dx + dy * dy <= boneR * boneR) {
            const px = Math.round(legTipX) + dx, py = Math.round(legTipY) + dy;
            if (px >= 0 && px < 128 && py >= 0 && py < 96) pc.setPixel(px, py, FLAT);
          }
        }
      }
    }

    // Breast mound — slight bulge at top centre
    for (let y = cy - bodyRY - 4; y <= cy - bodyRY + 8; y++) {
      for (let x = cx - 15; x <= cx + 15; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / 15, dy = (y - (cy - bodyRY + 2)) / 6;
        if (dx * dx + dy * dy <= 1 && dy <= 0) pc.setPixel(x, y, FLAT);
      }
    }

    // Plate underneath — wide flat ellipse
    const plateRX = 52, plateRY = 8;
    const plateY = cy + bodyRY + 2;
    for (let y = plateY - plateRY; y <= plateY + plateRY; y++) {
      for (let x = cx - plateRX; x <= cx + plateRX; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / plateRX, dy = (y - plateY) / plateRY;
        if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
      }
    }
  },
};
