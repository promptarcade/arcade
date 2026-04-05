// Shattered Realm — Bog Crawler (enemy)
// 24x32 Pixel tier — green-brown amphibian humanoid, webbed claws

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'creature',
  colors: {
    body: '#4a6a3a',
    belly: '#6a8a4a',
    eye: '#dddd44',
    claw: '#3a3a2a',
  },
  draw(pc, pal) {
    const bo = pal.groups.body.startIdx;
    const be = pal.groups.belly.startIdx;
    const ey = pal.groups.eye.startIdx;
    const cl = pal.groups.claw.startIdx;
    const cx = 12;

    pc.fillEllipse(cx, 30, 8, 2, bo+0);

    // Feet (wide, webbed)
    pc.fillRect(6, 27, 5, 2, bo+1);
    pc.fillRect(13, 27, 5, 2, bo+1);
    // Webbing
    pc.setPixel(5, 28, bo+2);
    pc.setPixel(11, 28, bo+2);
    pc.setPixel(12, 28, bo+2);
    pc.setPixel(18, 28, bo+2);

    // Legs (thick, digitigrade)
    pc.fillRect(7, 22, 4, 6, bo+1);
    pc.fillRect(13, 22, 4, 6, bo+1);

    // Body (hunched, broad)
    pc.fillEllipse(cx, 16, 7, 7, bo+2);
    // Belly
    pc.fillEllipse(cx, 17, 4, 4, be+2);
    // Warts/texture
    pc.scatterNoise(6, 10, 12, 12, bo+1, 0.12);

    // Arms (long, reaching down)
    pc.fillRect(3, 14, 4, 8, bo+1);
    pc.fillRect(17, 14, 4, 8, bo+1);

    // Claws
    pc.setPixel(2, 22, cl+1);
    pc.setPixel(3, 22, cl+1);
    pc.setPixel(4, 22, cl+1);
    pc.setPixel(19, 22, cl+1);
    pc.setPixel(20, 22, cl+1);
    pc.setPixel(21, 22, cl+1);

    // Head (wide, frog-like)
    pc.fillEllipse(cx, 8, 6, 4, bo+2);
    // Lower jaw
    pc.fillRect(8, 10, 8, 2, bo+1);

    // Bulging eyes (on top of head)
    pc.fillCircle(9, 5, 2, ey+2);
    pc.fillCircle(15, 5, 2, ey+2);
    pc.setPixel(9, 5, ey+0); // pupil
    pc.setPixel(15, 5, ey+0);

    // Mouth
    pc.hline(9, 11, 6, cl+0);
    // Teeth
    pc.setPixel(10, 10, be+3);
    pc.setPixel(14, 10, be+3);

    // Dorsal ridge
    pc.setPixel(12, 10, bo+0);
    pc.setPixel(12, 12, bo+0);
    pc.setPixel(12, 14, bo+0);
  },
};
