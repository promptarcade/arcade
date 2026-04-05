// Shattered Realm — Witch
// 24x32 Pixel tier — purple robes, pointed hat, gnarled staff, glowing eyes

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    robe: '#5a3a7a',
    hat: '#3a2a5a',
    skin: '#c8b090',
    staff: '#5a4a2a',
    glow: '#44dd88',
  },
  draw(pc, pal) {
    const r = pal.groups.robe.startIdx;
    const h = pal.groups.hat.startIdx;
    const sk = pal.groups.skin.startIdx;
    const st = pal.groups.staff.startIdx;
    const g = pal.groups.glow.startIdx;
    const cx = 12;

    // Shadow
    pc.fillEllipse(cx, 30, 8, 2, r+0);

    // Robe bottom (wide, flowing)
    pc.fillTriangle(4, 18, 20, 18, 12, 29, r+1);
    pc.fillRect(5, 18, 14, 10, r+2);
    // Robe hem with magic glow
    pc.hline(5, 28, 14, g+1);
    // Robe tattered edges
    pc.setPixel(6, 29, r+1);
    pc.setPixel(10, 29, r+1);
    pc.setPixel(14, 29, r+1);
    pc.setPixel(18, 29, r+1);

    // Body — purple robe top
    pc.fillRect(7, 10, 10, 10, r+2);
    // Robe folds
    pc.vline(10, 12, 8, r+1);
    pc.vline(14, 11, 9, r+1);

    // Mystic symbols on robe
    pc.setPixel(12, 14, g+2);
    pc.setPixel(11, 16, g+1);
    pc.setPixel(13, 16, g+1);
    pc.setPixel(12, 18, g+2);

    // Sash
    pc.fillRect(7, 19, 10, 1, h+1);

    // Arms (robe sleeves)
    pc.fillRect(4, 12, 4, 7, r+1);
    pc.fillRect(16, 12, 4, 7, r+1);
    // Bony hands
    pc.fillRect(4, 18, 3, 2, sk+1);
    pc.fillRect(17, 18, 3, 2, sk+1);

    // Gnarled staff (left side)
    pc.vline(3, 2, 20, st+1);
    // Staff knob/gnarl
    pc.setPixel(2, 4, st+2);
    pc.setPixel(4, 3, st+2);
    pc.setPixel(2, 6, st+1);
    // Glowing orb at top
    pc.fillCircle(3, 2, 2, g+2);
    pc.setPixel(3, 1, g+3);
    pc.setPixel(2, 2, g+3);

    // Head
    pc.fillEllipse(cx, 9, 4, 4, sk+1);
    // Glowing eyes
    pc.setPixel(10, 9, g+3);
    pc.setPixel(14, 9, g+3);
    // Thin mouth
    pc.hline(11, 11, 2, sk+0);

    // Pointed hat
    pc.fillRect(7, 6, 10, 3, h+1);
    pc.fillTriangle(8, 6, 16, 6, 12, 0, h+2);
    // Hat brim
    pc.fillRect(6, 8, 12, 2, h+1);
    // Hat band
    pc.hline(8, 8, 8, g+1);
    // Hat highlight
    pc.setPixel(11, 2, h+3);
    pc.setPixel(12, 1, h+3);
  },
};
