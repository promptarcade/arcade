// Watermelon — 48x48 whole fruit for Fruit Slash
// Oblong oval, dark green with lighter green lengthwise stripes, small stem nub.

module.exports = {
  width: 48,
  height: 48,
  colors: {
    body: '#2d6e2d',      // dark green rind
    stripe: '#88cc44',    // lighter green stripes
    stem: '#665533',      // brown stem nub
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const s = pal.groups.stripe.startIdx;
    const st = pal.groups.stem.startIdx;
    const cx = 24, cy = 24;

    // Oblong oval body — wider than tall (rx=20, ry=14)
    pc.fillEllipse(cx, cy, 20, 14, b + 2);

    // Darker shading along bottom edge
    pc.fillEllipse(cx, cy + 4, 18, 10, b + 1);
    // Restore mid-tone in center
    pc.fillEllipse(cx, cy, 18, 12, b + 2);

    // Lengthwise stripes — curved bands running left to right
    // Stripe pattern: 5 stripes at different Y offsets
    const stripeYs = [-7, -3, 1, 5, 9];
    for (const sy of stripeYs) {
      for (let dx = -17; dx <= 17; dx++) {
        const t = dx / 17;
        // Curve stripes to follow the oval surface
        const curvature = Math.round(2 * Math.sin(t * Math.PI));
        const py = cy + sy - curvature;
        const px = cx + dx;
        // Check we're inside the oval
        const nx = (px - cx) / 20;
        const ny = (py - cy) / 14;
        if (nx * nx + ny * ny < 0.92) {
          pc.hline(px, py, 1, s + 2);
          // Make stripes 2px wide
          if (nx * nx + ((py + 1 - cy) / 14) * ((py + 1 - cy) / 14) < 0.92) {
            pc.setPixel(px, py + 1, s + 1);
          }
        }
      }
    }

    // Highlight — upper-left specular
    pc.fillEllipse(cx - 6, cy - 6, 6, 4, b + 3);

    // Stem nub on right end
    pc.fillRect(cx + 19, cy - 2, 3, 3, st + 2);
    pc.setPixel(cx + 21, cy - 2, st + 3);
    pc.setPixel(cx + 22, cy - 1, st + 1);

    // Subtle rind texture
    const rng = sf2_seededRNG(42);
    pc.scatterNoise(cx - 16, cy - 10, 32, 20, b + 1, 0.04, rng);
  },

  drawPost(pc, pal) {
    const b = pal.groups.body.startIdx;
    const s = pal.groups.stripe.startIdx;
    const cx = 24, cy = 24;

    // Extra bright stripe highlights on top surface
    for (const sy of [-7, -3, 1]) {
      for (let dx = -10; dx <= 6; dx += 3) {
        const px = cx + dx;
        const py = cy + sy - Math.round(2 * Math.sin((dx / 17) * Math.PI));
        const nx = (px - cx) / 20;
        const ny = (py - cy) / 14;
        if (nx * nx + ny * ny < 0.75) {
          pc.setPixel(px, py, s + 3);
        }
      }
    }

    // Bright specular dot
    pc.setPixel(cx - 8, cy - 8, b + 3);
    pc.setPixel(cx - 7, cy - 9, b + 3);
  },
};
