// Shattered Realm — Storage Chest (structure)
// 16x12 Pixel tier — wooden, iron bands

module.exports = {
  width: 16, height: 12, style: 'pixel', entityType: 'prop',
  colors: {
    wood: '#7a5a2a',
    iron: '#6a6a7a',
    lock: '#ccaa44',
  },
  draw(pc, pal) {
    const w = pal.groups.wood.startIdx;
    const i = pal.groups.iron.startIdx;
    const l = pal.groups.lock.startIdx;

    // Chest body
    pc.fillRect(1, 3, 14, 8, w+2);
    // Top (lid)
    pc.fillRect(1, 3, 14, 3, w+1);
    // Iron bands
    pc.hline(1, 5, 14, i+1);
    pc.hline(1, 8, 14, i+1);
    // Vertical bands
    pc.vline(1, 3, 8, i+1);
    pc.vline(14, 3, 8, i+1);
    // Lock
    pc.fillRect(7, 5, 2, 3, l+2);
    pc.setPixel(8, 6, l+3);
    // Wood grain
    pc.setPixel(4, 7, w+1);
    pc.setPixel(10, 9, w+1);
    // Highlight on lid
    pc.hline(3, 3, 10, w+3);
    // Shadow bottom
    pc.hline(1, 10, 14, w+0);
  },
};
