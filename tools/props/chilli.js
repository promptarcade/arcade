// Chilli Pepper — 32x32 projectile
// Curved red-orange pepper shape. Green stem. Angry/fierce expression.
// Ability: ignites and burns through structures.

module.exports = {
  width: 32,
  height: 32,
  colors: {
    body: '#dd4411',    // hot red-orange
    stem: '#448833',    // green stem
    face: '#ffeecc',    // eye whites
    pupil: '#221100',   // dark
    flame: '#ffaa22',   // fiery orange for highlights
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const st = pal.groups.stem.startIdx;
    const fl = pal.groups.flame.startIdx;
    const cx = 16, cy = 16;

    // Chilli body — curved elongated shape, fat at top tapering to a point
    // Build with a curved profile, tilted slightly
    for (let row = 0; row < 22; row++) {
      const t = row / 21;
      // Teardrop: wide at top, narrowing to point at bottom
      let halfW;
      if (t < 0.35) {
        halfW = Math.round(7 * Math.sin(t / 0.35 * Math.PI / 2));
      } else {
        halfW = Math.round(7 * (1 - (t - 0.35) / 0.65));
      }
      // Curve the whole shape slightly to the right as it goes down
      const xOff = Math.round(t * 3);
      const y = cy - 10 + row;
      if (halfW > 0) {
        pc.hline(cx - halfW + xOff, y, halfW * 2 + 1, b + 2);
      }
    }

    // Pointed tip at bottom — a few extra pixels
    pc.setPixel(cx + 4, cy + 12, b + 2);
    pc.setPixel(cx + 5, cy + 13, b + 1);

    // Subtle wrinkle lines along the length (peppers have slight furrows)
    pc.setPixel(cx - 2, cy - 4, b + 1);
    pc.setPixel(cx - 2, cy, b + 1);
    pc.setPixel(cx - 1, cy + 4, b + 1);
    pc.setPixel(cx + 3, cy - 3, b + 3);
    pc.setPixel(cx + 3, cy + 1, b + 3);

    // Green stem at top
    pc.fillRect(cx - 2, cy - 11, 5, 3, st + 2);
    pc.fillRect(cx - 1, cy - 13, 3, 2, st + 2);
    pc.setPixel(cx, cy - 14, st + 3);
    // Stem curves slightly
    pc.setPixel(cx + 2, cy - 12, st + 2);
    pc.setPixel(cx + 3, cy - 11, st + 1);
    // Calyx ring where stem meets body
    pc.hline(cx - 3, cy - 8, 7, st + 1);

    // Glossy highlight — large, follows the curve
    pc.fillEllipse(cx - 2, cy - 4, 2, 4, b + 3);
    pc.setPixel(cx - 3, cy - 6, b + 3);
    pc.setPixel(cx - 1, cy - 2, b + 3);

    // Hot glow at the tip
    pc.setPixel(cx + 3, cy + 10, fl + 2);
    pc.setPixel(cx + 4, cy + 11, fl + 3);
  },

  drawPost(pc, pal) {
    const f = pal.groups.face.startIdx;
    const p = pal.groups.pupil.startIdx;
    const fl = pal.groups.flame.startIdx;
    const cx = 16, cy = 16;

    // Fierce angry eyes — narrow, intense
    // Left eye
    pc.hline(cx - 4, cy - 3, 3, f + 2);
    pc.hline(cx - 4, cy - 2, 3, f + 2);
    pc.setPixel(cx - 3, cy - 2, p + 2);      // pupil
    pc.setPixel(cx - 4, cy - 3, f + 3);       // specular

    // Right eye
    pc.hline(cx + 1, cy - 3, 3, f + 2);
    pc.hline(cx + 1, cy - 2, 3, f + 2);
    pc.setPixel(cx + 2, cy - 2, p + 2);
    pc.setPixel(cx + 1, cy - 3, f + 3);

    // Very angry eyebrows — steep V shape
    pc.line(cx - 6, cy - 5, cx - 2, cy - 4, p + 2);
    pc.line(cx + 2, cy - 4, cx + 6, cy - 5, p + 2);

    // Fierce grin — clean line with teeth
    pc.hline(cx - 2, cy + 2, 5, p + 1);
    // Teeth
    pc.setPixel(cx - 1, cy + 2, f + 2);
    pc.setPixel(cx + 1, cy + 2, f + 2);
  },
};
