// Palette diagnostic for the 2-group (cool/warm) palette
module.exports = {
  width: 64,
  height: 64,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    cool: '#206f20',
    warm: '#90df90',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.cool.startIdx); },

  drawPost(pc, pal) {
    const cg = pal.groups.cool;
    const wg = pal.groups.warm;

    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }

    pc.pixels[0] = 0;
    const W = 64, H = 64;

    // Print all palette entries
    console.log('=== PALETTE ENTRIES ===');
    for (let i = cg.startIdx; i < cg.startIdx + cg.toneCount; i++) {
      console.log('cool[' + (i - cg.startIdx) + '] idx=' + i);
    }
    for (let i = wg.startIdx; i < wg.startIdx + wg.toneCount; i++) {
      console.log('warm[' + (i - wg.startIdx) + '] idx=' + i);
    }

    // Draw bands: cool tones (rows 0-31), warm tones (rows 32-63)
    for (let ti = 0; ti < cg.toneCount; ti++) {
      const yStart = ti * 4;
      for (let y = yStart; y < yStart + 4 && y < 32; y++) {
        for (let x = 0; x < W; x++) pc.setPixel(x, y, cg.startIdx + ti);
      }
    }
    for (let ti = 0; ti < wg.toneCount; ti++) {
      const yStart = 32 + ti * 4;
      for (let y = yStart; y < yStart + 4 && y < 64; y++) {
        for (let x = 0; x < W; x++) pc.setPixel(x, y, wg.startIdx + ti);
      }
    }

    // Right strip: combined mapV gradient
    for (let y = 0; y < H; y++) {
      const v = 1 - y / (H - 1);
      let colIdx;
      if (v < 0.40) colIdx = tone(cg, v / 0.40);
      else colIdx = tone(wg, (v - 0.40) / 0.60);
      for (let x = 50; x < W; x++) pc.setPixel(x, y, colIdx);
    }
  },
};
