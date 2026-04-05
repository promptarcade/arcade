// Apple — 40x44 whole fruit for Fruit Slash
// Distinctive apple silhouette: deep top dimple, two shoulder bumps, tapered bottom.
// Taller than wide. Red with yellow-green patch. Brown stem + green leaf.

module.exports = {
  width: 40,
  height: 44,
  colors: {
    body: '#cc2222',      // bold red
    green: '#88aa22',     // yellow-green gradient area
    stem: '#664422',      // brown stem
    leaf: '#44aa33',      // green leaf
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const g = pal.groups.green.startIdx;
    const st = pal.groups.stem.startIdx;
    const lf = pal.groups.leaf.startIdx;
    const cx = 20, cy = 24;

    // Apple body — 32 rows, distinctive apple profile
    // Key: deep dimple at top, two shoulder lobes, widest at mid-height, tapers to narrow bottom
    for (let row = 0; row < 32; row++) {
      const t = row / 31;
      let halfW;
      if (t < 0.06) {
        // Top dimple opening — very narrow
        halfW = Math.round(3 + 4 * (t / 0.06));
      } else if (t < 0.12) {
        // Dimple widens — still concave feel
        const u = (t - 0.06) / 0.06;
        halfW = Math.round(7 + 3 * u);
      } else if (t < 0.3) {
        // Shoulder bulge — swells out quickly
        const u = (t - 0.12) / 0.18;
        halfW = Math.round(10 + 5 * Math.sin(u * Math.PI / 2));
      } else if (t < 0.55) {
        // Widest belly — full 15px
        halfW = 15;
      } else if (t < 0.75) {
        // Start tapering — gradual
        const u = (t - 0.55) / 0.2;
        halfW = Math.round(15 - 3 * u);
      } else {
        // Bottom taper — rounds to a point
        const u = (t - 0.75) / 0.25;
        halfW = Math.round(12 * Math.cos(u * Math.PI / 2));
      }
      const y = cy - 16 + row;
      if (halfW > 0) {
        pc.hline(cx - halfW, y, halfW * 2 + 1, b + 2);
      }
    }

    // Deepen top dimple — dark crease
    pc.hline(cx - 2, cy - 16, 5, b + 0);
    pc.hline(cx - 1, cy - 15, 3, b + 0);
    pc.setPixel(cx, cy - 14, b + 1);

    // Vertical crease hint running down from dimple
    for (let row = 3; row < 10; row++) {
      const y = cy - 16 + row;
      pc.setPixel(cx, y, b + 1);
    }

    // 3D shading — darker right edge, follows body contour
    for (let row = 8; row < 30; row++) {
      const t = row / 31;
      let halfW;
      if (t < 0.3) { const u = (t - 0.12) / 0.18; halfW = Math.round(10 + 5 * Math.sin(Math.max(0, u) * Math.PI / 2)); }
      else if (t < 0.55) halfW = 15;
      else if (t < 0.75) { const u = (t - 0.55) / 0.2; halfW = Math.round(15 - 3 * u); }
      else { const u = (t - 0.75) / 0.25; halfW = Math.round(12 * Math.cos(u * Math.PI / 2)); }
      if (halfW < 5) continue;
      const y = cy - 16 + row;
      pc.setPixel(cx + halfW - 1, y, b + 0);
      pc.setPixel(cx + halfW - 2, y, b + 0);
      if (halfW > 8) pc.setPixel(cx + halfW - 3, y, b + 1);
    }

    // Bottom shading — darker underside
    for (let row = 26; row < 31; row++) {
      const t = row / 31;
      let halfW;
      if (t < 0.75) { const u = (t - 0.55) / 0.2; halfW = Math.round(15 - 3 * u); }
      else { const u = (t - 0.75) / 0.25; halfW = Math.round(12 * Math.cos(u * Math.PI / 2)); }
      if (halfW < 2) continue;
      const y = cy - 16 + row;
      pc.hline(cx - halfW + 1, y, halfW * 2 - 1, b + 1);
    }

    // Large specular highlight — upper left
    pc.fillEllipse(cx - 5, cy - 5, 3, 5, b + 3);
    pc.setPixel(cx - 6, cy - 8, b + 3);
    pc.setPixel(cx - 4, cy - 9, b + 3);

    // Secondary softer highlight — upper right shoulder
    pc.fillEllipse(cx + 4, cy - 6, 2, 3, b + 3);

    // Brown stem — taller, slightly angled
    pc.fillRect(cx - 1, cy - 20, 2, 6, st + 2);
    pc.setPixel(cx, cy - 20, st + 3);
    pc.setPixel(cx - 1, cy - 20, st + 1);
    pc.setPixel(cx, cy - 15, st + 1);

    // Green leaf — angled, attached to stem
    pc.fillTriangle(cx + 1, cy - 18, cx + 9, cy - 22, cx + 6, cy - 16, lf + 2);
    // Leaf vein
    pc.setPixel(cx + 3, cy - 18, lf + 3);
    pc.setPixel(cx + 5, cy - 19, lf + 3);
    pc.setPixel(cx + 7, cy - 21, lf + 3);
    // Leaf shading
    pc.setPixel(cx + 7, cy - 21, lf + 1);
    pc.setPixel(cx + 8, cy - 22, lf + 1);

    // Subtle skin texture
    const rng = sf2_seededRNG(55);
    pc.scatterNoise(cx - 12, cy - 8, 24, 22, b + 1, 0.03, rng);
  },

  drawPost(pc, pal) {
    const b = pal.groups.body.startIdx;
    const cx = 20, cy = 24;

    // Sharp specular dots
    pc.setPixel(cx - 6, cy - 8, b + 3);
    pc.setPixel(cx - 5, cy - 9, b + 3);
  },
};
