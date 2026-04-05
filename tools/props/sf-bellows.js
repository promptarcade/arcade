// Snip & Feed — Bellows / air puffer 32x32
module.exports = {
  width: 32, height: 32,
  colors: { wood: '#8D6E63', metal: '#9E9E9E', air: '#B3E5FC' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const w = pal.groups.wood.startIdx;
    const m = pal.groups.metal.startIdx;
    const a = pal.groups.air.startIdx;

    // Wooden body / housing — main box
    pc.fillRect(2, 6, 18, 20, w + 1);
    // Wood grain highlight
    pc.fillRect(3, 7, 16, 2, w + 2);
    pc.fillRect(3, 12, 16, 1, w + 2);
    pc.fillRect(3, 17, 16, 1, w + 2);
    pc.fillRect(3, 22, 16, 2, w + 2);
    // Wood shadow edges
    pc.vline(2, 6, 20, w);
    pc.vline(19, 6, 20, w);
    pc.hline(2, 6, 18, w + 3);
    pc.hline(2, 25, 18, w);

    // Metal nozzle — protruding right
    pc.fillRect(20, 12, 8, 8, m + 1);
    pc.fillRect(20, 13, 8, 6, m + 2);
    // Nozzle opening
    pc.fillRect(27, 14, 3, 4, m);
    // Nozzle rim
    pc.vline(28, 13, 6, m + 3);
    // Nozzle highlight
    pc.hline(20, 13, 8, m + 3);

    // Metal grill/vent on front
    pc.fillRect(6, 10, 10, 12, m + 1);
    pc.hline(7, 11, 8, m);
    pc.hline(7, 13, 8, m);
    pc.hline(7, 15, 8, m);
    pc.hline(7, 17, 8, m);
    pc.hline(7, 19, 8, m);
    // Grill highlights between slats
    pc.hline(7, 12, 8, m + 2);
    pc.hline(7, 14, 8, m + 2);
    pc.hline(7, 16, 8, m + 2);
    pc.hline(7, 18, 8, m + 2);
    pc.hline(7, 20, 8, m + 2);

    // Air gusts coming from nozzle
    pc.hline(30, 15, 2, a + 3);
    pc.hline(30, 17, 2, a + 3);
    pc.setPixel(31, 14, a + 2);
    pc.setPixel(31, 18, a + 2);

    // Mounting bracket — top and bottom
    pc.fillRect(0, 4, 4, 3, m + 1);
    pc.fillRect(0, 25, 4, 3, m + 1);
    pc.setPixel(1, 5, m); // screw
    pc.setPixel(1, 26, m); // screw
  },
  drawPost(pc, pal) {},
};
