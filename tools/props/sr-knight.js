// Shattered Realm — Knight (from Castle Run)
// 24x32 Pixel tier — steel armour, blue tabard, red plume, sword+shield

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    armour: '#7a8a9a',
    tabard: '#2255bb',
    skin: '#e8c090',
    belt: '#5a3a1a',
    plume: '#cc3333',
    shield: '#993322',
    blade: '#ccccdd',
  },
  draw(pc, pal) {
    const a = pal.groups.armour.startIdx;
    const t = pal.groups.tabard.startIdx;
    const sk = pal.groups.skin.startIdx;
    const bl = pal.groups.belt.startIdx;
    const pl = pal.groups.plume.startIdx;
    const sh = pal.groups.shield.startIdx;
    const sw = pal.groups.blade.startIdx;
    const cx = 12;

    // Shadow
    pc.fillEllipse(cx, 30, 8, 2, a+0);

    // Cape behind body
    pc.fillRect(7, 12, 10, 8, t+0);

    // Boots
    pc.fillRect(7, 25, 4, 4, a+0);
    pc.fillRect(13, 25, 4, 4, a+0);
    // Boot cuffs
    pc.fillRect(7, 25, 4, 1, a+1);
    pc.fillRect(13, 25, 4, 1, a+1);

    // Legs
    pc.fillRect(8, 21, 3, 5, a+1);
    pc.fillRect(13, 21, 3, 5, a+1);

    // Body — chainmail
    pc.fillRect(6, 12, 12, 10, a+1);
    // Chainmail texture
    pc.scatterNoise(6, 12, 12, 10, a+0, 0.15);

    // Blue tabard
    pc.fillRect(8, 13, 8, 8, t+2);
    // Tabard stripe
    pc.fillRect(11, 13, 2, 8, t+1);
    // Tabard border
    pc.hline(8, 13, 8, t+3);
    pc.hline(8, 20, 8, t+3);
    pc.vline(8, 13, 8, t+3);
    pc.vline(15, 13, 8, t+3);

    // Belt
    pc.fillRect(6, 20, 12, 2, bl+1);
    // Buckle
    pc.fillRect(11, 20, 2, 2, bl+3);

    // Shield (left side)
    pc.fillRect(2, 13, 5, 8, sh+1);
    pc.hline(2, 13, 5, sh+2);
    pc.hline(2, 20, 5, sh+2);
    pc.vline(2, 13, 8, sh+2);
    pc.vline(6, 13, 8, sh+2);
    // Shield boss
    pc.fillCircle(4, 17, 1, sh+3);

    // Sword (right side)
    pc.fillRect(19, 5, 2, 12, sw+2);
    pc.fillRect(19, 5, 2, 1, sw+3); // tip highlight
    pc.fillRect(17, 16, 6, 2, bl+3); // crossguard
    pc.fillRect(19, 18, 2, 3, bl+1); // handle

    // Right arm
    pc.fillRect(17, 14, 3, 6, a+1);

    // Head / helmet
    pc.fillEllipse(cx, 8, 5, 5, a+2);
    // Visor plate
    pc.fillRect(8, 5, 8, 5, a+1);
    // T-visor slit
    pc.hline(9, 7, 6, a+0);
    pc.vline(12, 7, 3, a+0);
    // Helmet highlight
    pc.setPixel(9, 5, a+3);
    pc.setPixel(10, 4, a+3);

    // Red plume
    pc.fillTriangle(11, 2, 13, 2, 12, 0, pl+2);
    pc.fillRect(11, 2, 3, 2, pl+2);
    pc.setPixel(12, 0, pl+3);
  },
};
