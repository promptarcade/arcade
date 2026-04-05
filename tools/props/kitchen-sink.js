// Kitchen sink — 32x24 background prop
// Steel basin with tap, water running, soap bubbles.
module.exports = {
  width: 32, height: 24,
  colors: {
    basin: '#aab0b8',   // stainless steel
    tap: '#888890',     // chrome tap
    water: '#88bbdd',   // running water
    bubble: '#eef4ff',  // soap bubbles
    counter: '#d0ccc4', // counter edge around sink
  },

  draw(pc, pal) {
    const b = pal.groups.basin.startIdx;
    const t = pal.groups.tap.startIdx;
    const w = pal.groups.water.startIdx;
    const bu = pal.groups.bubble.startIdx;
    const c = pal.groups.counter.startIdx;

    // Counter surface with hole for sink
    pc.fillRect(0, 0, 32, 24, c + 2);
    pc.hline(0, 0, 32, c + 3);

    // Sink basin — recessed rectangle
    pc.fillRect(3, 4, 26, 16, b + 1);
    // Basin inner highlights
    pc.vline(3, 4, 16, b + 2);
    pc.hline(3, 4, 26, b + 2);
    // Basin shadow at bottom
    pc.hline(4, 19, 24, b);
    // Drain
    pc.fillRect(14, 17, 4, 3, b);
    pc.setPixel(15, 18, b + 1);

    // Tap — arching faucet
    pc.fillRect(14, 0, 4, 3, t + 2);  // base
    pc.fillRect(15, 0, 2, 1, t + 3);  // top highlight
    pc.fillRect(12, 2, 3, 2, t + 2);  // arm going left
    pc.fillRect(11, 3, 2, 3, t + 2);  // spout down
    pc.setPixel(11, 3, t + 3);
    // Tap handle
    pc.fillRect(17, 1, 3, 2, t + 1);
    pc.setPixel(17, 1, t + 2);

    // Running water stream
    pc.vline(12, 6, 8, w + 2);
    pc.vline(11, 7, 5, w + 3);
    // Splash at bottom
    pc.setPixel(10, 14, w + 3);
    pc.setPixel(13, 13, w + 3);
    pc.setPixel(14, 14, w + 2);

    // Soap bubbles floating
    pc.setPixel(8, 8, bu + 2);
    pc.setPixel(9, 7, bu + 3);
    pc.setPixel(20, 9, bu + 2);
    pc.setPixel(22, 7, bu + 3);
    pc.setPixel(18, 6, bu + 2);
    pc.fillRect(6, 12, 2, 2, bu + 2);
    pc.setPixel(6, 12, bu + 3);
    pc.fillRect(23, 10, 2, 2, bu + 2);
    pc.setPixel(23, 10, bu + 3);

    // Dirty water tint in basin
    pc.fillEllipse(16, 14, 8, 3, w + 1);
  },
  drawPost(pc, pal) {},
};
