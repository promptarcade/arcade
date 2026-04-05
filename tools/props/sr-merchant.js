// Shattered Realm — Merchant (NPC)
// 24x32 Pixel tier — rotund, brown cloak, backpack overflowing

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    cloak: '#7a5a3a',
    pack: '#5a4a2a',
    skin: '#e8c090',
    goods: '#ddaa44',
    pants: '#4a4a3a',
  },
  draw(pc, pal) {
    const c = pal.groups.cloak.startIdx;
    const pk = pal.groups.pack.startIdx;
    const sk = pal.groups.skin.startIdx;
    const g = pal.groups.goods.startIdx;
    const pn = pal.groups.pants.startIdx;
    const cx = 12;

    pc.fillEllipse(cx, 30, 9, 2, c+0);

    // Backpack (behind, big)
    pc.fillRect(15, 8, 7, 14, pk+1);
    pc.hline(15, 8, 7, pk+2);
    pc.hline(15, 21, 7, pk+0);
    // Goods poking out
    pc.fillRect(17, 6, 3, 3, g+2);
    pc.setPixel(16, 7, g+3);
    pc.setPixel(20, 7, g+1);

    // Boots
    pc.fillRect(7, 26, 4, 3, pn+0);
    pc.fillRect(13, 26, 4, 3, pn+0);

    // Legs
    pc.fillRect(8, 22, 3, 5, pn+1);
    pc.fillRect(13, 22, 3, 5, pn+1);

    // Body (rotund)
    pc.fillEllipse(11, 16, 6, 7, c+2);
    // Belt
    pc.fillRect(6, 20, 11, 2, pk+0);
    pc.fillRect(10, 20, 3, 2, g+2); // gold buckle

    // Arms
    pc.fillRect(4, 13, 3, 6, c+1);
    pc.fillRect(16, 13, 3, 6, c+1);
    pc.fillRect(4, 18, 2, 2, sk+2);

    // Head
    pc.fillEllipse(11, 7, 4, 4, sk+2);
    pc.setPixel(9, 7, pn+0);
    pc.setPixel(13, 7, pn+0);
    pc.hline(10, 9, 2, sk+1); // smile

    // Hat (merchant's cap)
    pc.fillRect(7, 3, 8, 3, c+1);
    pc.fillRect(6, 5, 10, 1, c+0); // brim
    pc.setPixel(8, 3, c+3);

    // Coin pouch visible at belt
    pc.fillCircle(7, 21, 1, g+2);
  },
};
