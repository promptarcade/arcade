// Sizzle Street — Ramen Bowl (3/4 top-down view with noodles and toppings)
module.exports = {
  width: 32, height: 32,
  colors: {
    bowl: '#e8ddd0',
    broth: '#d4a030',
    noodle: '#ffffaa',
    egg: '#f5e0a0',
    green: '#44aa44',
    rim: '#cc8844',
  },
  draw(pc, pal) {
    const b = pal.groups.bowl.startIdx;
    const br = pal.groups.broth.startIdx;
    const n = pal.groups.noodle.startIdx;
    const e = pal.groups.egg.startIdx;
    const g = pal.groups.green.startIdx;
    const r = pal.groups.rim.startIdx;

    // Bowl outer
    pc.fillEllipse(16, 18, 14, 11, b + 1);
    // Bowl inner
    pc.fillEllipse(16, 17, 12, 9, b + 2);
    // Decorative rim band
    pc.fillEllipse(16, 11, 12, 2, r + 2);
    pc.fillEllipse(16, 11, 10, 1, b + 3);

    // Broth — golden liquid
    pc.fillEllipse(16, 17, 10, 7, br + 2);
    pc.fillEllipse(16, 16, 8, 5, br + 3);

    // Noodle swirls — wavy lines
    for (let i = 0; i < 5; i++) {
      const y = 14 + i * 2;
      for (let x = 9; x < 24; x++) {
        const wave = Math.sin((x + i * 3) * 0.8) > 0.2;
        if (wave) pc.setPixel(x, y, n + 2 + (x % 2));
      }
    }

    // Half egg (sliced, showing yolk)
    pc.fillEllipse(20, 14, 3, 2, e + 2);
    pc.fillCircle(20, 14, 1, e + 3);

    // Green onion slices
    pc.fillCircle(11, 14, 1, g + 2);
    pc.fillCircle(13, 18, 1, g + 3);
    pc.fillCircle(18, 19, 1, g + 2);

    // Chopsticks — two diagonal lines
    for (let i = 0; i < 8; i++) {
      pc.setPixel(22 + i, 8 + i, b + 1);
      pc.setPixel(24 + i, 8 + i, b + 1);
    }
  },
  drawPost(pc, pal) {},
};
