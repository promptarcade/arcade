// Baby Wrangler — Baby crawling (32x20)
module.exports = {
  width: 32, height: 20,
  colors: { skin: '#ffe0cc', onesie: '#88ccff', hair: '#ddaa66', eyes: '#445533' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const s = pal.groups.skin.startIdx + 2;
    const o = pal.groups.onesie.startIdx + 2;
    const hr = pal.groups.hair.startIdx + 2;
    pc.fillEllipse(14, 10, 9, 4, o); // body
    pc.fillEllipse(7, 7, 4, 3, o); // bum
    pc.fillEllipse(7, 6, 3, 2, o + 1); // bum highlight
    pc.fillCircle(24, 7, 5, s); // head
    // Hair wisps
    pc.setPixel(22, 2, hr); pc.setPixel(23, 1, hr); pc.setPixel(24, 1, hr);
    pc.setPixel(25, 2, hr); pc.setPixel(24, 2, hr); pc.setPixel(23, 2, hr); pc.setPixel(22, 3, hr);
    // Arms
    pc.fillRect(20, 13, 3, 4, s);
    pc.fillRect(16, 14, 3, 3, s);
    pc.fillCircle(21, 17, 1, s);
    pc.fillCircle(17, 17, 1, s);
    // Knees
    pc.fillEllipse(8, 14, 2, 2, o);
    pc.fillEllipse(4, 14, 2, 2, o);
    pc.setPixel(9, 16, s);
    pc.setPixel(5, 16, s);
    // Cheeks
    pc.setPixel(26, 8, s + 1); pc.setPixel(27, 8, s + 1);
    // Mouth
    pc.setPixel(26, 9, s - 2); pc.setPixel(27, 9, s - 2);
  },
  drawPost(pc, pal) {
    const e = pal.groups.eyes.startIdx;
    pc.fillCircle(26, 6, 2, e + 2);
    pc.setPixel(27, 6, e); pc.setPixel(26, 5, e + 3);
    pc.fillCircle(23, 6, 2, e + 2);
    pc.setPixel(24, 6, e); pc.setPixel(23, 5, e + 3);
  },
};
