// Shattered Realm — Ranger
// 24x32 Pixel tier — green hooded cloak, brown leather, longbow, quiver

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    cloak: '#2a6a2a',
    leather: '#6a4a2a',
    skin: '#e8c090',
    bow: '#8a6a3a',
    quiver: '#5a3a1a',
  },
  draw(pc, pal) {
    const c = pal.groups.cloak.startIdx;
    const l = pal.groups.leather.startIdx;
    const sk = pal.groups.skin.startIdx;
    const bw = pal.groups.bow.startIdx;
    const q = pal.groups.quiver.startIdx;
    const cx = 12;

    // Shadow
    pc.fillEllipse(cx, 30, 8, 2, c+0);

    // Cloak (behind body)
    pc.fillTriangle(6, 10, 18, 10, 12, 28, c+1);
    pc.fillTriangle(7, 11, 17, 11, 12, 26, c+2);

    // Boots
    pc.fillRect(8, 26, 3, 3, l+0);
    pc.fillRect(13, 26, 3, 3, l+0);

    // Legs
    pc.fillRect(8, 22, 3, 5, l+1);
    pc.fillRect(13, 22, 3, 5, l+1);

    // Body — leather tunic
    pc.fillRect(7, 12, 10, 10, l+2);
    // Leather highlights
    pc.scatterNoise(7, 12, 10, 10, l+1, 0.1);

    // Belt
    pc.fillRect(7, 20, 10, 2, l+0);
    pc.fillRect(11, 20, 2, 2, l+3);

    // Quiver on back (right side)
    pc.fillRect(17, 8, 3, 12, q+1);
    // Arrow feathers poking out
    pc.setPixel(18, 7, q+3);
    pc.setPixel(19, 8, q+3);
    pc.setPixel(17, 8, q+3);

    // Bow (left side)
    pc.vline(3, 10, 14, bw+2);
    // Bowstring
    pc.vline(4, 11, 12, bw+3);
    // Bow curves
    pc.setPixel(4, 10, bw+2);
    pc.setPixel(4, 23, bw+2);

    // Left arm holding bow
    pc.fillRect(5, 14, 3, 5, c+1);

    // Right arm
    pc.fillRect(16, 14, 3, 5, c+1);

    // Hood/head
    pc.fillEllipse(cx, 7, 5, 5, c+1);
    // Hood shadow rim
    pc.hline(8, 10, 8, c+0);
    // Face in shadow of hood
    pc.fillRect(9, 7, 6, 4, sk+1);
    // Eyes
    pc.setPixel(10, 8, c+0);
    pc.setPixel(14, 8, c+0);
    // Hood point
    pc.setPixel(12, 2, c+2);
    pc.setPixel(11, 3, c+1);
    pc.setPixel(13, 3, c+1);
    // Hood highlight
    pc.setPixel(10, 4, c+3);
  },
};
