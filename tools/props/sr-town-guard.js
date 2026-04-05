// Shattered Realm — Town Guard (NPC)
// 24x32 Pixel tier — iron helm, spear, shield with crest

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    armour: '#7a7a6a',
    tunic: '#3355aa',
    skin: '#e8c090',
    spear: '#8a8a7a',
    shield: '#4466bb',
  },
  draw(pc, pal) {
    const a = pal.groups.armour.startIdx;
    const t = pal.groups.tunic.startIdx;
    const sk = pal.groups.skin.startIdx;
    const sp = pal.groups.spear.startIdx;
    const sh = pal.groups.shield.startIdx;
    const cx = 12;

    pc.fillEllipse(cx, 30, 8, 2, a+0);

    // Boots
    pc.fillRect(8, 26, 3, 3, a+0);
    pc.fillRect(13, 26, 3, 3, a+0);

    // Legs
    pc.fillRect(8, 22, 3, 5, t+1);
    pc.fillRect(13, 22, 3, 5, t+1);

    // Body — tunic over chainmail
    pc.fillRect(7, 12, 10, 10, a+1);
    pc.fillRect(8, 13, 8, 8, t+2);
    // Iron Order crest on chest (simple cross)
    pc.vline(12, 14, 4, t+3);
    pc.hline(10, 16, 5, t+3);

    // Belt
    pc.fillRect(7, 20, 10, 2, a+0);

    // Shield (left arm)
    pc.fillRect(2, 12, 6, 9, sh+2);
    pc.hline(2, 12, 6, sh+3);
    pc.hline(2, 20, 6, sh+0);
    pc.vline(2, 12, 9, sh+1);
    pc.vline(7, 12, 9, sh+1);
    // Crest on shield
    pc.vline(5, 14, 4, t+3);
    pc.hline(3, 16, 5, t+3);

    // Spear (right side, tall)
    pc.vline(20, 0, 24, sp+1);
    // Spear head
    pc.fillTriangle(19, 2, 22, 2, 20, 0, sp+3);

    // Right arm
    pc.fillRect(16, 13, 3, 6, a+1);

    // Helmet
    pc.fillEllipse(cx, 7, 5, 5, a+2);
    pc.fillRect(8, 4, 8, 5, a+1);
    // Face opening
    pc.fillRect(9, 6, 6, 4, sk+2);
    // Eyes
    pc.setPixel(10, 7, a+0);
    pc.setPixel(14, 7, a+0);
    // Nose guard
    pc.vline(12, 5, 4, a+2);
    // Helmet highlight
    pc.setPixel(10, 4, a+3);
  },
};
