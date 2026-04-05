// Sizzle Street — Grilled Cheese (diagonal-cut sandwich, side view, on small plate)
module.exports = {
  width: 32, height: 32,
  outlineMode: 'none',
  colors: {
    bread: '#d4a030',
    crust: '#8b6914',
    cheese: '#ffcc00',
    plate: '#e0dcd4',
    rim: '#b8b0a0',
  },
  draw(pc, pal) {
    const pl = pal.groups.plate.startIdx;
    const r = pal.groups.rim.startIdx;
    const b = pal.groups.bread.startIdx;
    const cr = pal.groups.crust.startIdx;
    const ch = pal.groups.cheese.startIdx;

    // Small plate — subtle, doesn't dominate
    pc.fillEllipse(16, 26, 12, 4, r + 2);
    pc.fillEllipse(16, 26, 11, 3, pl + 2);
    pc.hline(5, 25, 22, pl + 3);

    // === Front sandwich half (triangle, cut face toward viewer) ===
    // Triangle shape: wide at bottom, pointed at top-right
    // Bottom bread slice
    for (let row = 0; row < 12; row++) {
      const w = Math.round(12 - row * 0.9);
      if (w > 0) {
        const y = 24 - row;
        const x = 8;
        // Bread body
        pc.hline(x, y, w, b + 2);
      }
    }
    // Top bread slice — same triangle but shifted up by 2
    for (let row = 0; row < 12; row++) {
      const w = Math.round(12 - row * 0.9);
      if (w > 0) {
        const y = 22 - row;
        const x = 8;
        pc.hline(x, y, w, b + 3);
      }
    }

    // Cheese layer — visible between the two bread layers at the cut face
    for (let row = 0; row < 12; row++) {
      const w = Math.round(12 - row * 0.9);
      if (w > 0) {
        const y = 23 - row;
        const x = 8;
        pc.hline(x, y, w, ch + 2);
      }
    }

    // Outer crust — darken left edge and top edge
    for (let row = 0; row < 12; row++) {
      const y = 24 - row;
      pc.setPixel(8, y, cr + 2);          // left edge crust
      pc.setPixel(7, 22 - row, cr + 1);   // top slice left edge
    }
    // Top diagonal crust edge
    for (let row = 0; row < 12; row++) {
      const w = Math.round(12 - row * 0.9);
      pc.setPixel(8 + w, 22 - row, cr + 2);
    }

    // Toast marks — horizontal darker lines on front face
    pc.hline(9, 15, 5, cr + 2);
    pc.hline(9, 18, 7, cr + 2);
    pc.hline(9, 21, 9, cr + 2);

    // Highlight on bread — lighter streak
    pc.hline(10, 14, 3, b + 3);
    pc.hline(10, 17, 4, b + 3);

    // === Back sandwich half (peeking behind, darker) ===
    for (let row = 0; row < 10; row++) {
      const w = Math.round(10 - row * 0.9);
      if (w > 0) {
        const y = 24 - row;
        const x = 17;
        pc.hline(x, y, w, b + 1);
      }
    }
    // Cheese ooze on back half
    for (let row = 0; row < 10; row++) {
      const w = Math.round(10 - row * 0.9);
      if (w > 0) {
        const y = 23 - row;
        const x = 17;
        pc.hline(x, y, Math.min(w, 2), ch + 2);
      }
    }
    // Crust on back half
    for (let row = 0; row < 10; row++) {
      const w = Math.round(10 - row * 0.9);
      pc.setPixel(17 + w, 24 - row, cr + 1);
    }

    // Cheese drip hanging from front half
    pc.setPixel(9, 25, ch + 3);
    pc.setPixel(10, 25, ch + 2);
    pc.setPixel(10, 26, ch + 3);
  },
  drawPost(pc, pal) {},
};
