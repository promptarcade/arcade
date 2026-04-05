// Fridge — 24x40 prop sprite
// Iteration 3: work WITH directional shading, simplify for 1x readability,
// fix feet, strengthen panel contrast.

module.exports = {
  width: 24,
  height: 40,
  colors: {
    body: '#c8d0d8',    // cool steel
    door: '#d4dce4',    // door panels slightly brighter than body
    handle: '#505860',  // dark handles — maximum contrast
    gap: '#484850',     // very dark door gap — must read at 1x
    magnet: '#dd3333',  // red
    photo: '#f0e8b0',   // warm note
    accent: '#3388dd',  // blue
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const d = pal.groups.door.startIdx;
    const h = pal.groups.handle.startIdx;
    const g = pal.groups.gap.startIdx;
    const m = pal.groups.magnet.startIdx;
    const ph = pal.groups.photo.startIdx;
    const ac = pal.groups.accent.startIdx;

    // === SHELL ===
    // Outer body — the frame around the doors
    pc.fillRect(1, 0, 22, 38, b + 2);
    // Round top corners
    pc.setPixel(1, 0, 0); pc.setPixel(22, 0, 0);

    // === FREEZER DOOR PANEL ===
    pc.fillRect(3, 2, 16, 10, d + 2);

    // === DOOR GAP — the strongest visual line ===
    pc.hline(1, 13, 22, g + 1);
    pc.hline(1, 14, 22, g);

    // === FRIDGE DOOR PANEL ===
    pc.fillRect(3, 16, 16, 20, d + 2);

    // === HANDLES ===
    // These are the darkest elements — they anchor the "this is a fridge" read
    // Freezer handle
    pc.fillRect(18, 5, 2, 5, h + 2);
    pc.vline(18, 5, 5, h + 3);   // left highlight
    pc.setPixel(19, 5, h + 1);
    pc.setPixel(19, 9, h);

    // Fridge handle
    pc.fillRect(18, 19, 2, 8, h + 2);
    pc.vline(18, 19, 8, h + 3);
    pc.setPixel(19, 19, h + 1);
    pc.setPixel(19, 26, h);

    // Handle mounting shadow — dark pixel where handle meets door
    pc.setPixel(17, 6, b + 1);
    pc.setPixel(17, 8, b + 1);
    pc.setPixel(17, 20, b + 1);
    pc.setPixel(17, 25, b + 1);

    // === PHOTO / NOTE ===
    // Biggest detail element — warm against cool, draws the eye
    pc.fillRect(5, 20, 7, 6, ph + 2);
    // Lighting on the note
    pc.hline(5, 20, 7, ph + 3);
    pc.vline(5, 20, 6, ph + 3);
    pc.hline(5, 25, 7, ph + 1);
    pc.vline(11, 21, 4, ph + 1);
    // Handwriting
    pc.hline(6, 22, 4, ph);
    pc.hline(6, 23, 3, ph);
    pc.hline(7, 24, 2, ph);

    // Red magnet on top of photo
    pc.fillRect(7, 19, 3, 2, m + 2);
    pc.setPixel(7, 19, m + 3);
    pc.setPixel(9, 20, m + 1);

    // Blue magnet — lower on door, standalone
    pc.fillRect(13, 30, 2, 2, ac + 2);
    pc.setPixel(13, 30, ac + 3);

    // Small red dot magnet
    pc.setPixel(6, 32, m + 2);

    // === FREEZER DETAILS ===
    // Vent slots at top of freezer
    pc.hline(5, 4, 3, b + 1);
    pc.hline(5, 6, 3, b + 1);
    pc.hline(5, 8, 3, b + 1);

    // Ice/frost hint in freezer — tiny bright spots
    pc.setPixel(8, 5, d + 3);
    pc.setPixel(10, 7, d + 3);
    pc.setPixel(12, 4, d + 3);

    // Brand badge — embossed, centered on freezer
    pc.hline(9, 9, 4, d + 3);
    pc.hline(9, 10, 4, b + 1);

    // === DISPENSER (on freezer door — water/ice) ===
    pc.fillRect(10, 5, 4, 3, b + 1);
    pc.fillRect(11, 6, 2, 1, b);
    pc.setPixel(10, 5, b + 2); // top highlight

    // === BOTTOM ===
    // Plinth / kick plate
    pc.fillRect(1, 36, 22, 3, b + 1);
    pc.hline(1, 36, 22, b);
    // Small feet
    pc.setPixel(3, 39, h + 1);
    pc.setPixel(4, 39, h + 1);
    pc.setPixel(19, 39, h + 1);
    pc.setPixel(20, 39, h + 1);
    // Floor shadow
    pc.hline(1, 39, 22, g);

    // === SURFACE TEXTURE ===
    const rng = sf2_seededRNG(555);
    pc.scatterNoise(3, 16, 14, 18, d + 1, 0.03, rng);
  },

  drawPost(pc, pal) {
    // Nothing post-shading
  },
};
