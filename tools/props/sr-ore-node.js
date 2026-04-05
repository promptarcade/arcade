// Shattered Realm — Ore Node (resource)
// 16x16 Pixel tier — grey rock with metal veins

module.exports = {
  width: 16, height: 16, style: 'pixel', entityType: 'prop',
  colors: {
    rock: '#6a6a5a',
    ore: '#8a7a5a',
    glint: '#ccbb88',
  },
  draw(pc, pal) {
    const r = pal.groups.rock.startIdx;
    const o = pal.groups.ore.startIdx;
    const g = pal.groups.glint.startIdx;

    // Shadow
    pc.fillEllipse(8, 14, 6, 2, r+0);

    // Main rock shape
    pc.fillEllipse(8, 8, 6, 6, r+1);
    pc.fillEllipse(8, 7, 5, 5, r+2);
    // Craggy top
    pc.fillRect(4, 4, 3, 3, r+2);
    pc.fillRect(9, 3, 4, 3, r+1);

    // Ore veins
    pc.setPixel(5, 6, o+2);
    pc.setPixel(6, 7, o+2);
    pc.setPixel(7, 7, o+3);
    pc.setPixel(10, 5, o+2);
    pc.setPixel(11, 6, o+3);
    pc.setPixel(9, 9, o+2);
    pc.setPixel(10, 10, o+2);

    // Glinting highlights
    pc.setPixel(7, 7, g+3);
    pc.setPixel(11, 6, g+3);
    pc.setPixel(6, 5, g+2);

    // Rock texture
    pc.scatterNoise(3, 3, 10, 10, r+0, 0.08);
    // Highlight top
    pc.setPixel(6, 3, r+3);
    pc.setPixel(7, 3, r+3);
  },
};
