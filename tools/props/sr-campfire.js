// Shattered Realm — Campfire (structure)
// 16x16 Pixel tier — stone ring, flames, warm glow

module.exports = {
  width: 16, height: 16, style: 'pixel', entityType: 'prop',
  colors: {
    stone: '#6a6a5a',
    flame: '#ff8822',
    wood: '#5a3a1a',
    glow: '#ffee44',
  },
  draw(pc, pal) {
    const s = pal.groups.stone.startIdx;
    const f = pal.groups.flame.startIdx;
    const w = pal.groups.wood.startIdx;
    const g = pal.groups.glow.startIdx;
    const cx = 8;

    // Stone ring
    for (let a = 0; a < 360; a += 30) {
      const rad = a * Math.PI / 180;
      const x = Math.round(cx + 5 * Math.cos(rad));
      const y = Math.round(8 + 3 * Math.sin(rad));
      pc.fillRect(x, y, 2, 2, s + (a % 60 === 0 ? 2 : 1));
    }

    // Wood logs
    pc.fillRect(5, 10, 6, 2, w+1);
    pc.fillRect(7, 9, 2, 4, w+2);

    // Flames
    pc.fillTriangle(6, 10, 10, 10, 8, 4, f+2);
    pc.fillTriangle(7, 9, 9, 9, 8, 5, g+2);
    // Flame tip
    pc.setPixel(8, 4, g+3);
    pc.setPixel(7, 5, f+3);
    pc.setPixel(9, 6, f+3);

    // Embers
    pc.setPixel(5, 8, f+2);
    pc.setPixel(11, 7, f+1);
    pc.setPixel(4, 6, g+1);
  },
};
