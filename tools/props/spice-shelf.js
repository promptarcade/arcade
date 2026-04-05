// Spice shelf — 48x24 background decoration
// Wooden shelf with brackets, 4 spice jars in different colours.
module.exports = {
  width: 48, height: 24,
  colors: {
    wood: '#886644',    // shelf wood
    jar: '#ddddcc',     // glass jar body
    lid: '#bbaa88',     // jar lid
    spice1: '#cc3333',  // red (paprika)
    spice2: '#44aa44',  // green (herbs)
    spice3: '#ddaa22',  // yellow (turmeric)
    spice4: '#884422',  // brown (cinnamon)
  },

  draw(pc, pal) {
    const w = pal.groups.wood.startIdx;
    const j = pal.groups.jar.startIdx;
    const ld = pal.groups.lid.startIdx;
    const s1 = pal.groups.spice1.startIdx;
    const s2 = pal.groups.spice2.startIdx;
    const s3 = pal.groups.spice3.startIdx;
    const s4 = pal.groups.spice4.startIdx;

    // Shelf board
    pc.fillRect(0, 14, 48, 3, w + 2);
    pc.hline(0, 14, 48, w + 3);  // top highlight
    pc.hline(0, 16, 48, w);      // bottom shadow

    // Brackets
    pc.fillRect(2, 14, 2, 8, w + 1);
    pc.fillRect(44, 14, 2, 8, w + 1);
    pc.setPixel(2, 14, w + 2);
    pc.setPixel(45, 14, w + 2);

    // 4 jars sitting on the shelf
    var spiceColors = [s1, s2, s3, s4];
    for (var i = 0; i < 4; i++) {
      var jx = 6 + i * 10;
      var jy = 3;
      var sp = spiceColors[i];

      // Jar body
      pc.fillRect(jx, jy, 7, 11, j + 2);
      pc.vline(jx, jy, 11, j + 3);       // left highlight
      pc.vline(jx + 6, jy, 11, j + 1);   // right shadow
      // Spice contents (lower 2/3 of jar)
      pc.fillRect(jx + 1, jy + 4, 5, 6, sp + 2);
      pc.fillRect(jx + 1, jy + 4, 2, 6, sp + 3); // highlight
      pc.fillRect(jx + 4, jy + 5, 2, 5, sp + 1); // shadow
      // Lid
      pc.fillRect(jx, jy - 1, 7, 2, ld + 2);
      pc.hline(jx, jy - 1, 7, ld + 3);
      // Label (tiny rectangle)
      pc.fillRect(jx + 2, jy + 1, 3, 2, j + 3);
    }
  },
  drawPost(pc, pal) {},
};
