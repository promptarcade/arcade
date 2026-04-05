// Phase 6C.5: Wedge of Cheese — SILHOUETTE ONLY
// Triangular cross-section viewed from the side. Wide at back, tapers to point at front.
// Visible holes on the cut face.

module.exports = {
  width: 96,
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

    // Cheese wedge: triangular profile
    // Back face (left): tall rectangle
    // Top face: slopes downward from back to front
    // Bottom: flat
    // Front point: where top meets bottom

    const backX = 12, frontX = 84;
    const topBackY = 16, botY = 64;
    const topFrontY = botY - 6; // front tip is just above the bottom

    // Main wedge body
    for (let x = backX; x <= frontX; x++) {
      const t = (x - backX) / (frontX - backX); // 0=back, 1=front
      // Top edge slopes from topBackY down to topFrontY
      const topY = Math.round(topBackY + (topFrontY - topBackY) * t);
      for (let y = topY; y <= botY; y++) {
        if (x >= 0 && x < 96 && y >= 0 && y < 80) pc.setPixel(x, y, FLAT);
      }
    }

    // Slight rounding on the rind (top surface) — gentle curve, not sharp edge
    for (let x = backX; x <= frontX; x++) {
      const t = (x - backX) / (frontX - backX);
      const topY = Math.round(topBackY + (topFrontY - topBackY) * t);
      // Add 1-2 pixel rounding above the straight line
      if (t > 0.1 && t < 0.9) {
        const curve = Math.sin(t * Math.PI) * 2;
        for (let dy = 0; dy < Math.round(curve); dy++) {
          if (x >= 0 && x < 96 && topY - dy - 1 >= 0 && topY - dy - 1 < 80) {
            pc.setPixel(x, topY - dy - 1, FLAT);
          }
        }
      }
    }

    // Cut face visible — the back (left) face is the exposed cut, slightly recessed
    // It's already included in the main body, just marking that it exists
  },
};
