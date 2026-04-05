// Shattered Realm — Hollow Wraith (enemy)
// 24x32 Pixel tier — translucent blue-white, floating, reaching hands

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'creature',
  colors: {
    body: '#6688aa',
    glow: '#aaccee',
    eye: '#cc4444',
    wisp: '#88aacc',
  },
  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const g = pal.groups.glow.startIdx;
    const e = pal.groups.eye.startIdx;
    const w = pal.groups.wisp.startIdx;
    const cx = 12;

    // No shadow (floating)

    // Wispy trail below (no legs)
    pc.fillTriangle(8, 20, 16, 20, 12, 30, w+1);
    // Tattered wisps
    pc.setPixel(9, 28, w+2);
    pc.setPixel(12, 29, w+2);
    pc.setPixel(15, 28, w+2);
    pc.setPixel(7, 26, w+0);
    pc.setPixel(17, 26, w+0);

    // Body (ethereal mass)
    pc.fillEllipse(cx, 16, 6, 7, b+2);
    // Inner glow
    pc.fillEllipse(cx, 15, 3, 4, g+2);
    // Wisps at edges
    pc.scatterNoise(6, 10, 12, 12, w+1, 0.15);

    // Arms (reaching outward, elongated)
    pc.fillRect(2, 12, 4, 2, b+1);
    pc.fillRect(0, 10, 3, 2, b+2);
    pc.fillRect(18, 12, 4, 2, b+1);
    pc.fillRect(21, 10, 3, 2, b+2);
    // Clawed fingers
    pc.setPixel(0, 10, g+3);
    pc.setPixel(0, 11, g+3);
    pc.setPixel(23, 10, g+3);
    pc.setPixel(23, 11, g+3);

    // Head (skull-like, glowing)
    pc.fillEllipse(cx, 7, 5, 5, b+2);
    pc.fillEllipse(cx, 7, 3, 3, g+2);

    // Eye sockets
    pc.fillRect(9, 5, 2, 2, e+0);
    pc.fillRect(13, 5, 2, 2, e+0);
    // Glowing pupils
    pc.setPixel(10, 6, e+3);
    pc.setPixel(14, 6, e+3);

    // Mouth (wailing)
    pc.fillEllipse(cx, 10, 2, 1, b+0);

    // Crown-like protrusions
    pc.setPixel(9, 2, g+3);
    pc.setPixel(12, 1, g+3);
    pc.setPixel(15, 2, g+3);
    pc.setPixel(10, 3, g+2);
    pc.setPixel(14, 3, g+2);
  },
};
