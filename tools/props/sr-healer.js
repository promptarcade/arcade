// Shattered Realm — Healer
// 24x32 Pixel tier — white robe, red cross, crystal staff

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    robe: '#ccccdd',
    cross: '#cc2222',
    skin: '#e8c090',
    staff: '#8a7a5a',
    crystal: '#66aadd',
  },
  draw(pc, pal) {
    const r = pal.groups.robe.startIdx;
    const cr = pal.groups.cross.startIdx;
    const sk = pal.groups.skin.startIdx;
    const st = pal.groups.staff.startIdx;
    const cy_c = pal.groups.crystal.startIdx;
    const cx = 12;

    // Shadow
    pc.fillEllipse(cx, 30, 8, 2, r+0);

    // Robe bottom (wide, covers feet)
    pc.fillTriangle(5, 18, 19, 18, 12, 29, r+1);
    pc.fillRect(6, 18, 12, 10, r+2);
    // Robe hem
    pc.hline(6, 28, 12, r+1);

    // Body — white robe top
    pc.fillRect(7, 10, 10, 10, r+2);
    // Robe fold
    pc.vline(12, 12, 8, r+1);

    // Red cross on chest
    pc.vline(12, 13, 5, cr+2);
    pc.hline(10, 15, 5, cr+2);

    // Sash/belt
    pc.fillRect(7, 19, 10, 1, cr+1);

    // Arms (robe sleeves)
    pc.fillRect(4, 12, 4, 6, r+1);
    pc.fillRect(16, 12, 4, 6, r+1);
    // Hands
    pc.fillRect(4, 17, 3, 2, sk+2);
    pc.fillRect(17, 17, 3, 2, sk+2);

    // Crystal staff (left side)
    pc.vline(3, 3, 18, st+1);
    // Crystal at top
    pc.fillTriangle(1, 5, 5, 5, 3, 1, cy_c+2);
    pc.setPixel(3, 2, cy_c+3); // crystal glow
    pc.setPixel(2, 3, cy_c+3);
    pc.setPixel(4, 3, cy_c+3);

    // Head
    pc.fillEllipse(cx, 7, 4, 4, sk+2);
    // Face
    pc.setPixel(10, 7, st+0);
    pc.setPixel(14, 7, st+0);
    pc.hline(11, 9, 2, sk+1);

    // Hair (short white/grey)
    pc.fillRect(8, 3, 8, 3, r+1);
    pc.setPixel(8, 5, r+1);
    pc.setPixel(15, 5, r+1);
    // Highlight
    pc.setPixel(10, 3, r+3);
    pc.setPixel(11, 3, r+3);
  },
};
