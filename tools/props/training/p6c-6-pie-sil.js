// Phase 6C.6: Apple Pie — SILHOUETTE ONLY
// Compound: pie dish (wide shallow) + domed pastry top with lattice
// Viewed slightly from above — see the top surface

module.exports = {
  width: 128,
  height: 80,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;

    const cx = 64, cy = 42;

    // Pie dish — wide ellipse with short sides (like the bowl but even shallower)
    const dishRX = 52, dishRY = 28;

    // Dish body with slight depth visible
    for (let y = cy - dishRY; y <= cy + dishRY + 6; y++) {
      for (let x = cx - dishRX - 1; x <= cx + dishRX + 1; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 80) continue;

        if (y <= cy + dishRY) {
          // Top ellipse area (pie visible from above)
          const dx = (x - cx) / dishRX, dy = (y - cy) / dishRY;
          if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
        } else {
          // Short side visible below the rim
          const sideT = (y - cy - dishRY) / 6;
          const sideW = Math.round(dishRX * (1 - sideT * 0.05));
          const dx = Math.abs(x - cx);
          if (dx <= sideW) pc.setPixel(x, y, FLAT);
        }
      }
    }

    // Pie crust dome — slight rise above the dish rim
    // The pastry top is a gentle dome that sits within the dish rim
    const crustRX = dishRX - 4, crustRY = dishRY - 4;
    for (let y = cy - crustRY - 3; y <= cy + crustRY; y++) {
      for (let x = cx - crustRX; x <= cx + crustRX; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 80) continue;
        const dx = (x - cx) / crustRX, dy = (y - (cy - 1)) / crustRY;
        if (dx * dx + dy * dy <= 1 && dy < 0.3) {
          pc.setPixel(x, y, FLAT);
        }
      }
    }

    // Crimped edge — wavy ring around the dish rim
    for (let a = 0; a < 360; a += 2) {
      const rad = a * Math.PI / 180;
      const crimpR = dishRX + 2 + Math.sin(a * 0.15) * 2;
      const px = Math.round(cx + Math.cos(rad) * crimpR);
      const py = Math.round(cy + Math.sin(rad) * (dishRY + 1));
      if (px >= 0 && px < 128 && py >= 0 && py < 80) {
        pc.setPixel(px, py, FLAT);
        if (px + 1 < 128) pc.setPixel(px + 1, py, FLAT);
        if (py + 1 < 80) pc.setPixel(px, py + 1, FLAT);
      }
    }
  },
};
