// Phase 4, Exercise 4.3: Dithering at three densities
// Training target: dithering as a texture tool, not a crutch

module.exports = {
  width: 128,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    light: '#88aa44',
    dark: '#446622',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.light.startIdx); },

  drawPost(pc, pal) {
    const lg = pal.groups.light;
    const dg = pal.groups.dark;
    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    // Three rectangular patches showing the same two-tone gradient
    // but with different dithering patterns
    const patches = [
      { x: 4, y: 4, w: 36, h: 40, label: 'checkerboard' },
      { x: 46, y: 4, w: 36, h: 40, label: 'ordered' },
      { x: 88, y: 4, w: 36, h: 40, label: 'noise' },
    ];

    const rng = sf2_seededRNG(123);

    for (const p of patches) {
      for (let y = p.y; y < p.y + p.h; y++) {
        for (let x = p.x; x < p.x + p.w; x++) {
          if (x >= 128 || y >= 48) continue;

          // Gradient: left = light, right = dark
          const t = (x - p.x) / (p.w - 1); // 0 = light, 1 = dark

          let useDark;
          if (p.label === 'checkerboard') {
            // Classic checkerboard dither — density follows gradient
            // At t=0: all light. At t=0.5: alternating. At t=1: all dark.
            if (t < 0.25) {
              useDark = false;
            } else if (t < 0.5) {
              // Sparse dark: every 4th pixel in checkerboard
              useDark = (x + y) % 4 === 0;
            } else if (t < 0.75) {
              // Classic checkerboard
              useDark = (x + y) % 2 === 0;
            } else {
              // Sparse light: mostly dark
              useDark = (x + y) % 4 !== 0;
            }
          } else if (p.label === 'ordered') {
            // Ordered Bayer-like dithering — 4x4 threshold matrix
            const bayer4 = [
              [0, 8, 2, 10],
              [12, 4, 14, 6],
              [3, 11, 1, 9],
              [15, 7, 13, 5],
            ];
            const threshold = bayer4[y % 4][x % 4] / 16;
            useDark = t > threshold;
          } else {
            // Noise dithering — random threshold per pixel
            useDark = rng() < t;
          }

          if (useDark) {
            pc.setPixel(x, y, tone(dg, 0.5));
          } else {
            pc.setPixel(x, y, tone(lg, 0.5));
          }
        }
      }

      // Border around each patch for clarity
      for (let x = p.x - 1; x <= p.x + p.w; x++) {
        if (x >= 0 && x < 128) {
          if (p.y - 1 >= 0) pc.setPixel(x, p.y - 1, tone(dg, 0.1));
          if (p.y + p.h < 48) pc.setPixel(x, p.y + p.h, tone(dg, 0.1));
        }
      }
      for (let y = p.y; y < p.y + p.h; y++) {
        if (p.x - 1 >= 0 && y < 48) pc.setPixel(p.x - 1, y, tone(dg, 0.1));
        if (p.x + p.w < 128 && y < 48) pc.setPixel(p.x + p.w, y, tone(dg, 0.1));
      }
    }
  },
};
