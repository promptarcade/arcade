// Tomato — 32x32 projectile
// Iteration 2: rounder sphere, remove segment lines, better proportions.

module.exports = {
  width: 32,
  height: 32,
  colors: {
    body: '#dd3322',
    stem: '#448833',
    face: '#ffeecc',
    pupil: '#221100',
    shine: '#ff8877',
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const st = pal.groups.stem.startIdx;
    const cx = 16, cy = 17;

    // Main body — true circle, not ellipse
    pc.fillCircle(cx, cy, 10, b + 2);

    // Bottom navel — darker indent
    pc.setPixel(cx, cy + 9, b);
    pc.setPixel(cx - 1, cy + 9, b + 1);
    pc.setPixel(cx + 1, cy + 9, b + 1);

    // Green calyx — compact star shape at top
    // Stem nub
    pc.fillRect(cx - 1, cy - 12, 3, 2, st + 2);
    pc.setPixel(cx, cy - 13, st + 3);
    // Calyx leaves — short, radiating
    pc.hline(cx - 4, cy - 10, 9, st + 2);
    pc.hline(cx - 3, cy - 11, 7, st + 2);
    // Leaf tips
    pc.setPixel(cx - 5, cy - 9, st + 2);
    pc.setPixel(cx + 5, cy - 9, st + 2);
    pc.setPixel(cx - 4, cy - 11, st + 3);
    pc.setPixel(cx + 4, cy - 11, st + 3);
    // Fill gap between calyx and body top
    pc.hline(cx - 2, cy - 9, 5, b + 2);

    // Glossy highlight — round spot, upper left
    pc.fillCircle(cx - 3, cy - 4, 2, b + 3);
    pc.setPixel(cx - 5, cy - 5, b + 3);
    pc.setPixel(cx - 2, cy - 6, b + 3);
  },

  drawPost(pc, pal) {
    const f = pal.groups.face.startIdx;
    const p = pal.groups.pupil.startIdx;
    const cx = 16, cy = 17;

    // Eyes — simple, clear
    // Left eye
    pc.fillRect(cx - 6, cy - 2, 3, 3, f + 2);
    pc.setPixel(cx - 5, cy - 1, p + 2);      // pupil
    pc.setPixel(cx - 6, cy - 2, f + 3);       // specular

    // Right eye
    pc.fillRect(cx + 3, cy - 2, 3, 3, f + 2);
    pc.setPixel(cx + 4, cy - 1, p + 2);
    pc.setPixel(cx + 3, cy - 2, f + 3);

    // Angry eyebrows — thick, angled down to center
    pc.hline(cx - 7, cy - 4, 3, p + 2);
    pc.setPixel(cx - 4, cy - 3, p + 2);
    pc.hline(cx + 4, cy - 4, 3, p + 2);
    pc.setPixel(cx + 4, cy - 3, p + 2);

    // Determined mouth — slight frown
    pc.hline(cx - 2, cy + 4, 5, p + 1);
    pc.setPixel(cx - 3, cy + 3, p + 1);
    pc.setPixel(cx + 3, cy + 3, p + 1);
  },
};
