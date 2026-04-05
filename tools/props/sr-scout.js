// Shattered Realm — Scout
// 24x32 Pixel tier — dark cloak, hood up, dual daggers, slim build

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    cloak: '#3a3a4a',
    leather: '#4a3a2a',
    skin: '#d4a070',
    dagger: '#aaaabc',
    wrap: '#2a2a3a',
  },
  draw(pc, pal) {
    const c = pal.groups.cloak.startIdx;
    const l = pal.groups.leather.startIdx;
    const sk = pal.groups.skin.startIdx;
    const d = pal.groups.dagger.startIdx;
    const w = pal.groups.wrap.startIdx;
    const cx = 12;

    // Shadow
    pc.fillEllipse(cx, 30, 7, 2, c+0);

    // Cloak drape (behind, slim)
    pc.fillTriangle(7, 10, 17, 10, 12, 28, c+1);

    // Boots (slim)
    pc.fillRect(9, 26, 2, 3, l+0);
    pc.fillRect(13, 26, 2, 3, l+0);

    // Legs (slim)
    pc.fillRect(9, 22, 2, 5, c+1);
    pc.fillRect(13, 22, 2, 5, c+1);

    // Body — dark leather, narrow
    pc.fillRect(8, 12, 8, 10, l+1);
    // Cross-strap
    pc.setPixel(9, 13, l+3);
    pc.setPixel(10, 14, l+3);
    pc.setPixel(11, 15, l+3);
    pc.setPixel(12, 16, l+3);
    pc.setPixel(13, 17, l+3);
    pc.setPixel(14, 18, l+3);

    // Belt with pouches
    pc.fillRect(8, 20, 8, 2, w+1);
    pc.fillRect(14, 19, 2, 2, l+2); // pouch

    // Arms (slim)
    pc.fillRect(5, 13, 3, 6, c+1);
    pc.fillRect(16, 13, 3, 6, c+1);

    // Daggers — dual wield
    // Left dagger
    pc.vline(4, 17, 5, d+2);
    pc.setPixel(4, 17, d+3);
    pc.hline(3, 21, 3, l+1); // guard
    // Right dagger
    pc.vline(19, 17, 5, d+2);
    pc.setPixel(19, 17, d+3);
    pc.hline(18, 21, 3, l+1); // guard

    // Hood
    pc.fillEllipse(cx, 7, 5, 5, c+2);
    pc.fillRect(8, 4, 8, 4, c+2);
    // Hood shadow
    pc.hline(9, 10, 6, c+0);
    // Face in deep shadow
    pc.fillRect(9, 7, 6, 3, w+1);
    // Eyes only (glinting)
    pc.setPixel(10, 8, d+3);
    pc.setPixel(14, 8, d+3);
    // Hood peak
    pc.setPixel(12, 2, c+2);
    pc.setPixel(11, 3, c+1);
    pc.setPixel(13, 3, c+1);
  },
};
