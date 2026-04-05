// Shattered Realm — Wolf (enemy)
// 20x16 Pixel tier — grey fur, yellow eyes, snarling

module.exports = {
  width: 20, height: 16, style: 'pixel', entityType: 'creature',
  colors: {
    fur: '#7a7a7a',
    belly: '#aaaaaa',
    eye: '#ddaa22',
    mouth: '#882222',
  },
  draw(pc, pal) {
    const f = pal.groups.fur.startIdx;
    const b = pal.groups.belly.startIdx;
    const e = pal.groups.eye.startIdx;
    const m = pal.groups.mouth.startIdx;

    // Shadow
    pc.fillEllipse(10, 14, 8, 2, f+0);

    // Tail
    pc.setPixel(1, 6, f+2);
    pc.setPixel(0, 5, f+2);
    pc.setPixel(0, 4, f+1);

    // Back legs
    pc.fillRect(3, 11, 2, 3, f+1);
    pc.fillRect(5, 11, 2, 3, f+1);

    // Front legs
    pc.fillRect(13, 11, 2, 3, f+1);
    pc.fillRect(15, 11, 2, 3, f+1);

    // Body (long, low)
    pc.fillEllipse(10, 8, 8, 4, f+2);
    // Belly lighter
    pc.fillEllipse(10, 9, 6, 2, b+1);
    // Fur texture
    pc.scatterNoise(3, 5, 14, 6, f+1, 0.12);

    // Back ridge (darker)
    pc.hline(4, 5, 10, f+0);

    // Head
    pc.fillEllipse(16, 6, 3, 3, f+2);
    // Snout
    pc.fillRect(18, 6, 2, 2, f+1);
    // Nose
    pc.setPixel(19, 6, f+0);
    // Open mouth (snarling)
    pc.hline(18, 8, 2, m+2);
    pc.setPixel(19, 7, m+1); // fang
    // Eye
    pc.setPixel(16, 5, e+3);
    // Ear
    pc.setPixel(15, 3, f+1);
    pc.setPixel(14, 4, f+2);

    // Highlight on back
    pc.setPixel(8, 5, f+3);
    pc.setPixel(10, 5, f+3);
  },
};
