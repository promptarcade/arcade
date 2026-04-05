// Baby Wrangler — TV stand with TV (48x20, top-down/front)
module.exports = {
  width: 48, height: 20,
  colors: { wood: '#554433', tv: '#222233', screen: '#334455' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const w = pal.groups.wood.startIdx + 2;
    const tv = pal.groups.tv.startIdx + 2;
    const sc = pal.groups.screen.startIdx + 2;
    // Cabinet
    pc.fillRect(0, 10, 48, 10, w);
    pc.hline(0, 10, 48, w + 1); // top edge highlight
    pc.hline(0, 19, 48, w - 1); // bottom shadow
    // Cabinet doors
    pc.vline(16, 12, 6, w - 1);
    pc.vline(32, 12, 6, w - 1);
    // Door knobs
    pc.setPixel(14, 15, w + 1);
    pc.setPixel(18, 15, w + 1);
    pc.setPixel(30, 15, w + 1);
    pc.setPixel(34, 15, w + 1);
    // TV
    pc.fillRect(8, 0, 32, 10, tv);
    // Screen
    pc.fillRect(10, 1, 28, 7, sc);
    // Screen reflection
    pc.fillRect(11, 2, 8, 3, sc + 1);
    // TV stand/base
    pc.fillRect(18, 9, 12, 2, tv);
    // Power LED
    pc.setPixel(38, 8, sc + 1);
  },
};
