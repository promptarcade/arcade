// Baby Wrangler — Baby sitting (16x20)
module.exports = {
  width: 16, height: 20,
  colors: { skin: '#ffe0cc', hair: '#ddaa66', onesie: '#88ccff', eyes: '#445533' },
  outlineMode: 'black',
  draw(pc, pal) {
    const s = pal.groups.skin.startIdx + 2;
    const o = pal.groups.onesie.startIdx + 2;
    const hr = pal.groups.hair.startIdx + 2;
    const cx = 8;
    pc.fillEllipse(cx, 12, 5, 5, o); // body
    pc.fillCircle(cx, 6, 5, s); // head
    pc.fillTriangle(cx - 1, 1, cx + 2, 1, cx, -1, hr); // hair tuft
    pc.fillEllipse(cx, 2, 4, 2, hr);
    pc.hline(cx - 1, 8, 2, s - 1); // smile
    pc.fillRect(cx - 6, 10, 2, 3, s); // arms
    pc.fillRect(cx + 5, 10, 2, 3, s);
    pc.fillRect(cx - 4, 16, 3, 2, o); // feet
    pc.fillRect(cx + 2, 16, 3, 2, o);
  },
  drawPost(pc, pal) {
    const e = pal.groups.eyes.startIdx;
    pc.setPixel(6, 6, e); pc.setPixel(10, 6, e); // pupil dots
  },
};
