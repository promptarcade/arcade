// Snip & Feed — Nom-Nom (hungry green blob creature) 48x48
module.exports = {
  width: 48, height: 48,
  colors: { body: '#4CAF50', mouth: '#E91E63', eyes: '#ffffff', pupil: '#222222' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const m = pal.groups.mouth.startIdx;

    // Body — big round blob
    pc.fillEllipse(24, 30, 18, 16, b + 2);
    // Belly highlight
    pc.fillEllipse(24, 32, 12, 10, b + 3);

    // Mouth — wide open, dark interior
    pc.fillEllipse(24, 34, 10, 7, m);
    // Inner mouth darker
    pc.fillEllipse(24, 35, 8, 5, m - 1);
    // Tongue
    pc.fillEllipse(24, 37, 5, 3, m + 1);

    // Stubby arms — left
    pc.fillEllipse(7, 30, 4, 3, b + 2);
    pc.fillEllipse(5, 29, 3, 2, b + 3);
    // Stubby arms — right
    pc.fillEllipse(41, 30, 4, 3, b + 2);
    pc.fillEllipse(43, 29, 3, 2, b + 3);

    // Feet bumps
    pc.fillEllipse(16, 44, 5, 3, b + 1);
    pc.fillEllipse(32, 44, 5, 3, b + 1);

    // Cheek blush
    pc.fillEllipse(12, 28, 3, 2, m + 2);
    pc.fillEllipse(36, 28, 3, 2, m + 2);

    // Head bump / top of body highlight
    pc.fillEllipse(24, 16, 14, 6, b + 3);
    pc.fillEllipse(24, 14, 10, 4, b + 3);
  },
  drawPost(pc, pal) {
    const e = pal.groups.eyes.startIdx;
    const p = pal.groups.pupil.startIdx;

    // Left eye — big white circle
    pc.fillCircle(17, 22, 6, e + 2);
    pc.fillCircle(17, 22, 5, e + 3);
    // Left pupil
    pc.fillCircle(18, 23, 3, p);
    // Left eye highlight
    pc.fillCircle(16, 20, 2, e + 3);
    pc.setPixel(15, 19, e + 3);

    // Right eye — big white circle
    pc.fillCircle(31, 22, 6, e + 2);
    pc.fillCircle(31, 22, 5, e + 3);
    // Right pupil
    pc.fillCircle(32, 23, 3, p);
    // Right eye highlight
    pc.fillCircle(30, 20, 2, e + 3);
    pc.setPixel(29, 19, e + 3);
  },
};
