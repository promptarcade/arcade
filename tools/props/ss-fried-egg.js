// Sizzle Street — Fried Egg on plate (sunny side up, 3/4 top-down view)
module.exports = {
  width: 32, height: 32,
  colors: {
    white: '#f5f0e8',
    yolk: '#ffd700',
    plate: '#e8e4dc',
    rim: '#c0b8a8',
  },
  draw(pc, pal) {
    const pl = pal.groups.plate.startIdx;
    const r = pal.groups.rim.startIdx;
    const w = pal.groups.white.startIdx;
    const y = pal.groups.yolk.startIdx;

    // Plate — large ellipse
    pc.fillEllipse(16, 18, 14, 10, pl + 2);
    // Plate rim highlight
    pc.fillEllipse(16, 18, 14, 10, r + 2);
    pc.fillEllipse(16, 18, 12, 8, pl + 2);
    // Plate inner highlight
    pc.fillEllipse(16, 17, 11, 7, pl + 3);

    // Egg white — irregular blobby shape
    pc.fillEllipse(16, 16, 9, 7, w + 2);
    pc.fillEllipse(13, 14, 4, 3, w + 2);
    pc.fillEllipse(20, 15, 3, 4, w + 2);
    pc.fillEllipse(14, 19, 3, 2, w + 2);
    // White highlight
    pc.fillEllipse(14, 14, 3, 2, w + 3);

    // Yolk — centered golden circle
    pc.fillCircle(16, 16, 4, y + 2);
    // Yolk highlight
    pc.fillCircle(15, 15, 2, y + 3);
    pc.setPixel(14, 14, y + 3);
  },
  drawPost(pc, pal) {},
};
