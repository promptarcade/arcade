// Baby Wrangler — Toy box (24x18)
module.exports = {
  width: 24, height: 18,
  colors: { box: '#dd4444', lid: '#cc3333', toy1: '#44bb44', toy2: '#ffcc33', toy3: '#4488dd' },
  outlineMode: 'tinted',
  draw(pc, pal) {
    const b = pal.groups.box.startIdx + 2;
    const l = pal.groups.lid.startIdx + 2;
    const t1 = pal.groups.toy1.startIdx + 2;
    const t2 = pal.groups.toy2.startIdx + 2;
    const t3 = pal.groups.toy3.startIdx + 2;
    // Box body
    pc.fillRect(2, 6, 20, 12, b);
    pc.hline(2, 6, 20, b + 1); // top edge
    pc.hline(2, 17, 20, b - 1); // bottom shadow
    // Lid (open, tilted back)
    pc.fillRect(2, 3, 20, 4, l);
    pc.hline(2, 3, 20, l + 1);
    // Toys spilling out
    pc.fillCircle(6, 5, 2, t1); // green ball
    pc.fillRect(14, 2, 3, 5, t2); // yellow block
    pc.fillTriangle(18, 5, 21, 5, 20, 1, t3); // blue triangle
    // Star on box front
    pc.setPixel(11, 11, t2);
    pc.hline(10, 12, 3, t2);
    pc.setPixel(11, 13, t2);
  },
};
