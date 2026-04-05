// Shattered Realm — Miner
// 24x32 Pixel tier — brown cap, grey smock, pickaxe, lantern at belt

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    smock: '#7a7a6a',
    cap: '#6a4a2a',
    skin: '#e8c090',
    pick: '#8a8a9a',
    lantern: '#ddaa33',
  },
  draw(pc, pal) {
    const s = pal.groups.smock.startIdx;
    const cp = pal.groups.cap.startIdx;
    const sk = pal.groups.skin.startIdx;
    const pk = pal.groups.pick.startIdx;
    const ln = pal.groups.lantern.startIdx;
    const cx = 12;

    // Shadow
    pc.fillEllipse(cx, 30, 8, 2, s+0);

    // Boots
    pc.fillRect(8, 26, 3, 3, cp+0);
    pc.fillRect(13, 26, 3, 3, cp+0);

    // Legs
    pc.fillRect(8, 22, 3, 5, cp+1);
    pc.fillRect(13, 22, 3, 5, cp+1);

    // Body — grey smock
    pc.fillRect(7, 12, 10, 10, s+1);
    // Smock patches
    pc.fillRect(8, 16, 3, 3, s+2);
    pc.fillRect(14, 14, 2, 2, s+0);

    // Belt
    pc.fillRect(7, 20, 10, 2, cp+0);
    // Lantern at belt
    pc.fillRect(17, 19, 3, 4, ln+1);
    pc.fillRect(18, 18, 1, 1, ln+0);
    pc.setPixel(18, 19, ln+3); // glow

    // Arms
    pc.fillRect(5, 13, 3, 6, sk+1);
    pc.fillRect(16, 13, 3, 6, sk+1);

    // Pickaxe over shoulder
    // Handle
    pc.vline(3, 4, 16, cp+1);
    // Pick head
    pc.fillRect(1, 3, 6, 2, pk+2);
    pc.setPixel(0, 4, pk+2);
    pc.setPixel(6, 3, pk+3);
    // Pick point
    pc.setPixel(0, 3, pk+3);

    // Head
    pc.fillEllipse(cx, 7, 4, 4, sk+2);
    // Face features
    pc.setPixel(10, 7, cp+0); // left eye
    pc.setPixel(14, 7, cp+0); // right eye
    pc.hline(11, 9, 2, sk+1); // mouth

    // Brown cap
    pc.fillRect(8, 3, 8, 3, cp+2);
    pc.fillRect(7, 5, 10, 1, cp+1); // brim
    pc.setPixel(9, 3, cp+3); // highlight
  },
};
