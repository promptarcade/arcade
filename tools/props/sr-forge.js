// Shattered Realm — Forge (structure)
// 24x24 Pixel tier — stone base, anvil, glowing coals

module.exports = {
  width: 24, height: 24, style: 'pixel', entityType: 'prop',
  colors: {
    stone: '#5a5a5a',
    coal: '#ff6622',
    anvil: '#4a4a5a',
    glow: '#ffaa44',
  },
  draw(pc, pal) {
    const s = pal.groups.stone.startIdx;
    const c = pal.groups.coal.startIdx;
    const a = pal.groups.anvil.startIdx;
    const g = pal.groups.glow.startIdx;

    // Stone base/hearth
    pc.fillRect(2, 12, 14, 10, s+1);
    pc.fillRect(2, 12, 14, 2, s+2);
    // Stone texture
    pc.scatterNoise(2, 12, 14, 10, s+0, 0.1);
    // Chimney/back wall
    pc.fillRect(4, 4, 10, 10, s+1);
    pc.fillRect(6, 2, 6, 4, s+2);
    // Opening
    pc.fillRect(5, 10, 8, 4, s+0);
    // Coals inside
    pc.fillRect(6, 11, 6, 2, c+1);
    pc.scatterNoise(6, 11, 6, 2, c+2, 0.3);
    pc.setPixel(8, 11, g+3);
    pc.setPixel(10, 11, g+2);

    // Anvil (to the right)
    pc.fillRect(16, 14, 7, 2, a+2);
    pc.fillRect(17, 16, 5, 4, a+1);
    pc.fillRect(18, 20, 3, 2, a+1);
    // Anvil horn
    pc.fillRect(15, 14, 2, 1, a+2);
    // Highlight
    pc.hline(16, 14, 7, a+3);

    // Bellows hint
    pc.fillRect(0, 14, 3, 4, s+2);
    pc.setPixel(0, 15, c+1);
  },
};
