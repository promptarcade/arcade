// Baby Wrangler — Father sprite (32x48)
module.exports = {
  width: 32, height: 48,
  colors: {
    skin: '#f0c898', hair: '#5a3820', shirt: '#558855',
    shorts: '#aa9966', shoes: '#665533', eyes: '#446644',
  },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const s = pal.groups.skin.startIdx + 2;
    const h = pal.groups.hair.startIdx + 2;
    const sh = pal.groups.shirt.startIdx + 2;
    const sr = pal.groups.shorts.startIdx + 2;
    const sho = pal.groups.shoes.startIdx + 2;
    const cx = 16;

    // Head
    pc.fillEllipse(cx, 10, 6, 7, s);
    // Neck
    pc.fillRect(cx - 2, 16, 5, 3, s);

    // Hair — short, neat
    pc.fillEllipse(cx, 5, 6, 3, h);
    pc.hline(cx - 5, 5, 11, h);
    pc.hline(cx - 5, 6, 11, h);
    pc.fillRect(cx - 6, 7, 2, 4, h);
    pc.fillRect(cx + 5, 7, 2, 4, h);

    // Polo shirt — broad shoulders
    for (let y = 19; y < 30; y++) {
      const t = (y - 19) / 11;
      const halfW = Math.round(7 - t * 1);
      pc.hline(cx - halfW, y, halfW * 2 + 1, sh);
    }
    // Collar + V
    pc.hline(cx - 3, 19, 7, sh + 1);
    pc.vline(cx, 19, 3, sh + 1);
    // Pocket
    pc.fillRect(cx + 2, 22, 3, 3, sh - 1);

    // Arms + short sleeves
    pc.fillRect(cx - 10, 20, 3, 10, s);
    pc.fillRect(cx + 8, 20, 3, 10, s);
    pc.fillRect(cx - 10, 19, 4, 4, sh);
    pc.fillRect(cx + 7, 19, 4, 4, sh);
    pc.fillCircle(cx - 9, 30, 1, s);
    pc.fillCircle(cx + 9, 30, 1, s);

    // Shorts
    pc.fillRect(cx - 6, 30, 5, 6, sr);
    pc.fillRect(cx + 2, 30, 5, 6, sr);
    pc.hline(cx - 6, 30, 13, sr - 1); // belt

    // Legs
    pc.fillRect(cx - 5, 36, 3, 5, s);
    pc.fillRect(cx + 3, 36, 3, 5, s);

    // Sneakers
    pc.fillRect(cx - 6, 41, 5, 3, sho);
    pc.fillRect(cx + 2, 41, 5, 3, sho);
    pc.hline(cx - 6, 43, 5, sho + 1);
    pc.hline(cx + 2, 43, 5, sho + 1);
    pc.setPixel(cx - 4, 41, sho + 1);
    pc.setPixel(cx + 4, 41, sho + 1);
  },
  drawPost(pc, pal) {
    const s = pal.groups.skin.startIdx + 2;
    const e = pal.groups.eyes.startIdx;
    const cx = 16;
    // Eyes
    pc.hline(cx - 4, 9, 3, e + 2); pc.hline(cx - 4, 10, 3, e + 2);
    pc.setPixel(cx - 3, 10, e + 1); pc.setPixel(cx - 3, 9, e);
    pc.hline(cx + 2, 9, 3, e + 2); pc.hline(cx + 2, 10, 3, e + 2);
    pc.setPixel(cx + 3, 10, e + 1); pc.setPixel(cx + 3, 9, e);
    // Nose
    pc.setPixel(cx, 12, s - 1);
    // Smile
    pc.hline(cx - 2, 14, 4, s - 2);
    pc.setPixel(cx - 2, 13, s - 2); pc.setPixel(cx + 2, 13, s - 2);
    // Stubble shadow
    pc.setPixel(cx - 3, 14, s - 1); pc.setPixel(cx + 3, 14, s - 1);
  },
};
