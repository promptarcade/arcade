// Shattered Realm — Elder (NPC)
// 24x32 Pixel tier — long white beard, brown robes, walking stick

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    robe: '#6a5a4a',
    beard: '#ccccbb',
    skin: '#d4a080',
    staff: '#5a4a2a',
    accent: '#8a7a5a',
  },
  draw(pc, pal) {
    const r = pal.groups.robe.startIdx;
    const b = pal.groups.beard.startIdx;
    const sk = pal.groups.skin.startIdx;
    const st = pal.groups.staff.startIdx;
    const ac = pal.groups.accent.startIdx;
    const cx = 12;

    pc.fillEllipse(cx, 30, 8, 2, r+0);

    // Robe (long, covers feet)
    pc.fillTriangle(6, 16, 18, 16, 12, 29, r+1);
    pc.fillRect(7, 16, 10, 12, r+2);
    // Robe folds
    pc.vline(10, 18, 10, r+1);
    pc.vline(14, 17, 11, r+1);
    // Hem
    pc.hline(7, 28, 10, r+0);

    // Body
    pc.fillRect(7, 10, 10, 8, r+2);
    // Robe trim
    pc.vline(12, 10, 8, ac+2);

    // Sash
    pc.fillRect(7, 17, 10, 1, ac+1);

    // Arms (robe sleeves)
    pc.fillRect(4, 12, 4, 6, r+1);
    pc.fillRect(16, 12, 4, 6, r+1);
    // Hands
    pc.fillRect(4, 17, 3, 2, sk+1);

    // Walking stick (left)
    pc.vline(3, 4, 20, st+1);
    pc.setPixel(3, 3, st+2);
    // Stick knob
    pc.setPixel(2, 4, st+2);
    pc.setPixel(4, 4, st+2);

    // Head
    pc.fillEllipse(cx, 7, 4, 4, sk+2);
    // Eyes (kind)
    pc.setPixel(10, 7, st+0);
    pc.setPixel(14, 7, st+0);

    // Long white beard
    pc.fillTriangle(9, 9, 15, 9, 12, 18, b+2);
    pc.fillRect(9, 9, 6, 4, b+2);
    // Beard texture
    pc.setPixel(11, 12, b+1);
    pc.setPixel(13, 14, b+1);
    pc.setPixel(12, 16, b+1);
    // Beard highlight
    pc.setPixel(10, 10, b+3);

    // Bald head with wisps
    pc.fillRect(8, 3, 8, 3, sk+2);
    pc.setPixel(8, 5, b+1);
    pc.setPixel(15, 5, b+1);
    pc.setPixel(7, 6, b+1);
    pc.setPixel(16, 6, b+1);
    // Head highlight
    pc.setPixel(11, 3, sk+3);
  },
};
