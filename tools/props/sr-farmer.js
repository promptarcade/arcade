// Shattered Realm — Farmer
// 24x32 Pixel tier — straw hat, green tunic, pitchfork

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    tunic: '#5a7a3a',
    hat: '#ccaa55',
    skin: '#e8c090',
    pants: '#6a5a3a',
    fork: '#8a7a5a',
  },
  draw(pc, pal) {
    const tu = pal.groups.tunic.startIdx;
    const h = pal.groups.hat.startIdx;
    const sk = pal.groups.skin.startIdx;
    const p = pal.groups.pants.startIdx;
    const f = pal.groups.fork.startIdx;
    const cx = 12;

    // Shadow
    pc.fillEllipse(cx, 30, 8, 2, tu+0);

    // Boots
    pc.fillRect(8, 26, 3, 3, p+0);
    pc.fillRect(13, 26, 3, 3, p+0);

    // Legs — brown pants
    pc.fillRect(8, 22, 3, 5, p+1);
    pc.fillRect(13, 22, 3, 5, p+1);

    // Body — green tunic
    pc.fillRect(7, 12, 10, 10, tu+2);
    // Tunic fold lines
    pc.vline(10, 14, 6, tu+1);
    pc.vline(14, 13, 7, tu+1);

    // Belt
    pc.fillRect(7, 20, 10, 2, p+0);

    // Arms
    pc.fillRect(5, 13, 3, 6, tu+1);
    pc.fillRect(16, 13, 3, 6, tu+1);
    // Hands
    pc.fillRect(5, 18, 2, 2, sk+2);
    pc.fillRect(17, 18, 2, 2, sk+2);

    // Pitchfork (right side)
    pc.vline(20, 2, 20, f+1);
    // Tines
    pc.vline(18, 2, 4, f+2);
    pc.vline(20, 1, 4, f+2);
    pc.vline(22, 2, 4, f+2);
    // Connect tines
    pc.hline(18, 5, 5, f+1);

    // Head
    pc.fillEllipse(cx, 8, 4, 4, sk+2);
    // Face
    pc.setPixel(10, 8, p+0);
    pc.setPixel(14, 8, p+0);
    pc.hline(11, 10, 2, sk+1); // smile

    // Straw hat
    pc.fillEllipse(cx, 4, 6, 2, h+2);
    pc.fillRect(9, 3, 6, 3, h+2);
    // Brim
    pc.fillRect(6, 5, 12, 2, h+1);
    // Hat band
    pc.hline(9, 5, 6, h+0);
    // Highlight
    pc.setPixel(10, 3, h+3);
  },
};
