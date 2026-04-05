// Shattered Realm — Ashen Raider (enemy)
// 24x32 Pixel tier — black/red armour, horned helmet, greatsword

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    armour: '#2a2a2a',
    accent: '#aa2222',
    skin: '#8a7a6a',
    blade: '#5a5a6a',
    horn: '#6a5a3a',
  },
  draw(pc, pal) {
    const a = pal.groups.armour.startIdx;
    const ac = pal.groups.accent.startIdx;
    const sk = pal.groups.skin.startIdx;
    const bl = pal.groups.blade.startIdx;
    const h = pal.groups.horn.startIdx;
    const cx = 12;

    pc.fillEllipse(cx, 30, 9, 2, a+0);

    // Boots (heavy)
    pc.fillRect(7, 26, 4, 3, a+1);
    pc.fillRect(13, 26, 4, 3, a+1);
    // Boot spikes
    pc.setPixel(7, 27, ac+2);
    pc.setPixel(16, 27, ac+2);

    // Legs (heavy armour)
    pc.fillRect(7, 22, 4, 5, a+1);
    pc.fillRect(13, 22, 4, 5, a+1);

    // Body (heavy plate)
    pc.fillRect(6, 11, 12, 11, a+2);
    // Red accents
    pc.vline(7, 12, 9, ac+2);
    pc.vline(17, 12, 9, ac+2);
    // Chest plate
    pc.fillRect(8, 12, 8, 4, a+1);
    pc.hline(8, 12, 8, ac+1);

    // Belt
    pc.fillRect(6, 20, 12, 2, ac+1);
    pc.fillRect(10, 20, 4, 2, ac+2); // buckle

    // Pauldrons
    pc.fillRect(3, 10, 5, 4, a+2);
    pc.fillRect(16, 10, 5, 4, a+2);
    pc.hline(3, 10, 5, ac+2);
    pc.hline(16, 10, 5, ac+2);
    // Spikes
    pc.setPixel(4, 9, ac+2);
    pc.setPixel(18, 9, ac+2);

    // Arms
    pc.fillRect(4, 13, 3, 7, a+1);
    pc.fillRect(17, 13, 3, 7, a+1);

    // Greatsword (held both hands, right side)
    pc.fillRect(20, 2, 3, 16, bl+2);
    pc.fillRect(20, 2, 3, 2, bl+3); // tip highlight
    pc.hline(18, 17, 7, h+1); // crossguard
    pc.fillRect(20, 18, 3, 4, h+0); // handle
    pc.setPixel(21, 22, ac+2); // pommel

    // Helmet
    pc.fillEllipse(cx, 7, 5, 5, a+2);
    pc.fillRect(8, 4, 8, 5, a+1);
    // Red eye slit
    pc.hline(9, 7, 6, ac+3);
    // Helmet crest
    pc.hline(9, 4, 6, ac+2);

    // Horns
    pc.vline(7, 2, 4, h+2);
    pc.setPixel(7, 1, h+3);
    pc.vline(16, 2, 4, h+2);
    pc.setPixel(16, 1, h+3);
    // Slight curve outward
    pc.setPixel(6, 2, h+1);
    pc.setPixel(17, 2, h+1);
  },
};
