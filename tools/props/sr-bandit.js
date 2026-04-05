// Shattered Realm — Bandit (enemy)
// 24x32 Pixel tier — ragged clothes, scar, crude sword, patchwork armour

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    rags: '#6a5a4a',
    armour: '#5a5a4a',
    skin: '#c8a070',
    blade: '#8a8a7a',
    blood: '#882222',
  },
  draw(pc, pal) {
    const rg = pal.groups.rags.startIdx;
    const ar = pal.groups.armour.startIdx;
    const sk = pal.groups.skin.startIdx;
    const bl = pal.groups.blade.startIdx;
    const bd = pal.groups.blood.startIdx;
    const cx = 12;

    pc.fillEllipse(cx, 30, 8, 2, rg+0);

    // Boots (mismatched)
    pc.fillRect(8, 26, 3, 3, rg+0);
    pc.fillRect(13, 26, 3, 3, ar+0);

    // Legs
    pc.fillRect(8, 22, 3, 5, rg+1);
    pc.fillRect(13, 22, 3, 5, rg+2);

    // Body — patchwork
    pc.fillRect(7, 12, 10, 10, rg+1);
    // Patches
    pc.fillRect(8, 13, 3, 3, ar+1);
    pc.fillRect(13, 16, 3, 3, ar+2);
    // Tattered edges
    pc.scatterNoise(7, 12, 10, 10, rg+0, 0.08);

    // Shoulder pad (left, crude)
    pc.fillRect(5, 11, 4, 3, ar+1);
    pc.hline(5, 11, 4, ar+2);

    // Belt w/ rope
    pc.fillRect(7, 20, 10, 2, rg+0);

    // Arms
    pc.fillRect(5, 13, 3, 6, sk+1);
    pc.fillRect(16, 13, 3, 6, sk+1);

    // Crude sword (right)
    pc.vline(19, 8, 10, bl+1);
    pc.vline(20, 8, 10, bl+2);
    pc.setPixel(19, 8, bl+3);
    pc.hline(17, 17, 6, rg+0); // crude guard
    pc.vline(19, 18, 3, rg+1); // handle

    // Head
    pc.fillEllipse(cx, 7, 4, 4, sk+2);
    // Angry eyes
    pc.setPixel(10, 7, rg+0);
    pc.setPixel(14, 7, rg+0);
    // Scar across face
    pc.setPixel(13, 6, bd+2);
    pc.setPixel(14, 7, bd+1);
    pc.setPixel(15, 8, bd+2);
    // Scruffy hair
    pc.fillRect(8, 3, 8, 3, rg+0);
    pc.setPixel(8, 4, rg+0);
    pc.setPixel(16, 3, rg+0);
    pc.setPixel(7, 5, rg+0);
  },
};
