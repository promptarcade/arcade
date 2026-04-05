// Peach — 40x44 whole fruit for Fruit Slash
// Soft round shape with vertical crease, pink-orange coloring,
// rosy blush area, small stem + leaf at top.

module.exports = {
  width: 40,
  height: 44,
  colors: {
    body: '#f0944c',      // warm peach-orange
    blush: '#e05a5a',     // rosy pink blush
    stem: '#6b4226',      // brown stem
    leaf: '#4a9e2f',      // green leaf
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const bl = pal.groups.blush.startIdx;
    const st = pal.groups.stem.startIdx;
    const lf = pal.groups.leaf.startIdx;
    const cx = 20, cy = 24;

    // Main peach body — round, slightly wider than tall
    for (let row = 0; row < 30; row++) {
      const t = row / 29;
      let halfW;
      if (t < 0.15) {
        halfW = Math.round(10 * Math.sin(t / 0.15 * Math.PI / 2));
      } else if (t < 0.5) {
        halfW = Math.round(10 + 4 * Math.sin((t - 0.15) / 0.35 * Math.PI / 2));
      } else {
        halfW = Math.round(14 * Math.cos((t - 0.5) / 0.5 * Math.PI / 2));
      }
      const y = cy - 14 + row;
      if (halfW > 0) {
        pc.hline(cx - halfW, y, halfW * 2 + 1, b + 2);
      }
    }

    // 3D shading — darker on right side
    for (let row = 3; row < 28; row++) {
      const t = row / 29;
      let halfW;
      if (t < 0.15) halfW = Math.round(8 * Math.sin(t / 0.15 * Math.PI / 2));
      else if (t < 0.5) halfW = Math.round(8 + 3 * Math.sin((t - 0.15) / 0.35 * Math.PI / 2));
      else halfW = Math.round(11 * Math.cos((t - 0.5) / 0.5 * Math.PI / 2));
      const y = cy - 14 + row;
      if (halfW > 3) {
        pc.hline(cx + halfW - 2, y, 3, b + 1);
      }
    }

    // Broad highlight upper-left
    pc.fillEllipse(cx - 5, cy - 6, 6, 5, b + 3);
    pc.fillEllipse(cx - 7, cy - 8, 3, 2, b + 3);

    // Rosy blush — soft scattered wash on the right-center cheek area
    // Use scatter noise for a natural, diffuse blush rather than solid ellipses
    const rng_bl1 = sf2_seededRNG(111);
    pc.scatterNoise(cx - 2, cy - 6, 14, 14, bl + 2, 0.18, rng_bl1);
    const rng_bl2 = sf2_seededRNG(222);
    pc.scatterNoise(cx, cy - 4, 10, 10, bl + 3, 0.10, rng_bl2);
    const rng_bl3 = sf2_seededRNG(333);
    pc.scatterNoise(cx - 4, cy - 8, 16, 16, bl + 1, 0.06, rng_bl3);

    // Vertical crease line — subtle, runs from top dimple partway down
    for (let row = 0; row < 24; row++) {
      const t = row / 23;
      const xOff = Math.round(2 - t * 2);
      const y = cy - 13 + row;
      pc.setPixel(cx + xOff, y, b + 0);
      // Soften with lighter adjacent pixel on alternating rows
      if (row % 2 === 0) {
        pc.setPixel(cx + xOff + 1, y, b + 1);
      }
    }

    // Subtle peach fuzz texture
    const rng = sf2_seededRNG(55);
    pc.scatterNoise(cx - 12, cy - 12, 24, 24, b + 3, 0.04, rng);
  },

  drawPost(pc, pal) {
    const st = pal.groups.stem.startIdx;
    const lf = pal.groups.leaf.startIdx;
    const b = pal.groups.body.startIdx;
    const cx = 20, cy = 24;

    // Stem at top
    pc.vline(cx + 1, cy - 17, 4, st + 2);
    pc.setPixel(cx + 1, cy - 18, st + 1);
    pc.setPixel(cx + 2, cy - 16, st + 3);
    pc.setPixel(cx, cy - 15, st + 1);

    // Small leaf attached to stem
    pc.fillEllipse(cx + 5, cy - 17, 4, 2, lf + 2);
    pc.fillEllipse(cx + 5, cy - 17, 3, 1, lf + 3);
    pc.hline(cx + 3, cy - 17, 5, lf + 1);
    pc.setPixel(cx + 9, cy - 17, lf + 1);

    // Specular highlight dots
    pc.setPixel(cx - 8, cy - 9, b + 3);
    pc.setPixel(cx - 7, cy - 10, b + 3);
  },
};
