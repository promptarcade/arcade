// Shattered Realm — Skeleton (enemy)
// 24x32 Pixel tier — bone-white, rusted sword, tattered cloth

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    bone: '#ddddcc',
    cloth: '#4a4a3a',
    rust: '#8a6a4a',
    eye: '#cc4444',
  },
  draw(pc, pal) {
    const b = pal.groups.bone.startIdx;
    const c = pal.groups.cloth.startIdx;
    const r = pal.groups.rust.startIdx;
    const e = pal.groups.eye.startIdx;
    const cx = 12;

    pc.fillEllipse(cx, 30, 7, 2, c+0);

    // Tattered cloth hanging from waist
    pc.fillTriangle(8, 18, 16, 18, 12, 27, c+1);
    pc.setPixel(9, 26, c+0);
    pc.setPixel(13, 25, c+0);
    pc.setPixel(15, 27, c+0);

    // Legs (thin bones)
    pc.vline(9, 20, 8, b+1);
    pc.vline(10, 20, 8, b+2);
    pc.vline(14, 20, 8, b+1);
    pc.vline(15, 20, 8, b+2);
    // Feet
    pc.hline(8, 28, 3, b+1);
    pc.hline(14, 28, 3, b+1);

    // Ribcage
    pc.fillRect(8, 12, 8, 7, b+1);
    // Rib lines (dark gaps)
    pc.hline(9, 13, 6, c+0);
    pc.hline(9, 15, 6, c+0);
    pc.hline(9, 17, 6, c+0);
    // Spine
    pc.vline(12, 12, 8, b+0);

    // Arms (thin bones)
    pc.vline(6, 13, 7, b+1);
    pc.vline(7, 13, 7, b+2);
    pc.vline(17, 13, 7, b+1);
    pc.vline(18, 13, 7, b+2);

    // Rusted sword (right hand)
    pc.vline(19, 7, 10, r+1);
    pc.vline(20, 7, 10, r+2);
    pc.setPixel(19, 7, r+3);
    pc.hline(18, 16, 4, r+0);
    pc.vline(19, 17, 3, c+1);

    // Skull
    pc.fillEllipse(cx, 7, 5, 5, b+2);
    // Eye sockets (dark, with red glow)
    pc.fillRect(9, 6, 2, 2, c+0);
    pc.fillRect(13, 6, 2, 2, c+0);
    pc.setPixel(10, 6, e+2);
    pc.setPixel(14, 6, e+2);
    // Nose hole
    pc.setPixel(12, 8, c+0);
    // Jaw
    pc.hline(9, 10, 6, b+1);
    pc.setPixel(10, 10, c+0); // teeth gap
    pc.setPixel(12, 10, c+0);
    pc.setPixel(14, 10, c+0);
    // Skull highlight
    pc.setPixel(10, 4, b+3);
    pc.setPixel(11, 3, b+3);
  },
};
