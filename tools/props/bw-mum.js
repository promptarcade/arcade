// Baby Wrangler — Mother sprite (32x48)
module.exports = {
  width: 32, height: 48,
  colors: {
    skin: '#f5d0a9', hair: '#7a4422', dress: '#dd5577',
    apron: '#f5f0e0', shoes: '#884433', eyes: '#448855', lips: '#dd7788',
  },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const s = pal.groups.skin.startIdx + 2;
    const h = pal.groups.hair.startIdx + 2;
    const dr = pal.groups.dress.startIdx + 2;
    const ap = pal.groups.apron.startIdx + 2;
    const sh = pal.groups.shoes.startIdx + 2;
    const lip = pal.groups.lips.startIdx + 2;
    const cx = 16;
    for (let y = 6; y < 28; y++) { const t = (y-6)/22; pc.hline(cx - Math.round(7 - t*2), y, Math.round(7 - t*2)*2+1, h); }
    pc.fillEllipse(cx, 10, 6, 7, s);
    pc.fillRect(cx - 2, 16, 5, 3, s);
    pc.fillEllipse(cx, 5, 7, 3, h);
    pc.fillRect(cx - 7, 6, 2, 7, h); pc.fillRect(cx + 6, 6, 2, 7, h);
    pc.hline(cx - 5, 5, 11, h); pc.hline(cx - 4, 6, 9, h); pc.setPixel(cx, 5, h + 1);
    for (let y = 19; y < 26; y++) pc.hline(cx - 6, y, 13, dr);
    for (let y = 26; y < 40; y++) { const t = (y-26)/14; pc.hline(cx - Math.round(6+t*5), y, Math.round(6+t*5)*2+1, dr); }
    for (let y = 22; y < 37; y++) { const t = (y-22)/15; pc.hline(cx - Math.round(3+t*2), y, Math.round(3+t*2)*2+1, ap); }
    pc.line(cx - 3, 24, cx - 6, 26, ap); pc.line(cx + 3, 24, cx + 6, 26, ap);
    pc.fillRect(cx - 9, 20, 3, 10, s); pc.fillRect(cx + 7, 20, 3, 10, s);
    pc.fillEllipse(cx - 7, 20, 3, 2, dr); pc.fillEllipse(cx + 8, 20, 3, 2, dr);
    pc.fillCircle(cx - 9, 30, 1, s); pc.fillCircle(cx + 8, 30, 1, s);
    pc.fillRect(cx - 4, 40, 3, 5, s); pc.fillRect(cx + 2, 40, 3, 5, s);
    pc.fillRect(cx - 5, 44, 4, 3, sh); pc.fillRect(cx + 2, 44, 4, 3, sh);
    pc.setPixel(cx - 6, 11, pal.groups.apron.startIdx + 3);
    pc.setPixel(cx + 6, 11, pal.groups.apron.startIdx + 3);
    for (let x = cx - 10; x <= cx + 10; x += 3) pc.setPixel(x, 39, dr + 1);
    pc.hline(cx - 2, 30, 4, ap - 1); pc.vline(cx - 2, 30, 3, ap - 1); pc.vline(cx + 1, 30, 3, ap - 1);
  },
  drawPost(pc, pal) {
    const s = pal.groups.skin.startIdx + 2;
    const e = pal.groups.eyes.startIdx;
    const lip = pal.groups.lips.startIdx + 2;
    const cx = 16;
    pc.hline(cx - 4, 9, 3, e + 2); pc.hline(cx - 4, 10, 3, e + 2);
    pc.setPixel(cx - 3, 10, e + 1); pc.setPixel(cx - 3, 9, e); pc.setPixel(cx - 4, 9, e + 3);
    pc.hline(cx + 2, 9, 3, e + 2); pc.hline(cx + 2, 10, 3, e + 2);
    pc.setPixel(cx + 3, 10, e + 1); pc.setPixel(cx + 3, 9, e); pc.setPixel(cx + 2, 9, e + 3);
    pc.setPixel(cx - 5, 9, e); pc.setPixel(cx + 5, 9, e);
    pc.setPixel(cx, 12, s - 1);
    pc.hline(cx - 2, 14, 4, lip); pc.setPixel(cx - 2, 13, lip); pc.setPixel(cx + 2, 13, lip);
    pc.setPixel(cx - 5, 12, lip + 1); pc.setPixel(cx + 5, 12, lip + 1);
  },
};
