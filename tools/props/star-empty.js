// Star (empty) — 16x16 UI element (grey outline)
// Iteration 2: same clean star shape as filled version.
module.exports = {
  width: 16, height: 16,
  colors: { outline: '#667788', fill: '#2a2a3a' },
  draw(pc, pal) {
    const o = pal.groups.outline.startIdx;
    const f = pal.groups.fill.startIdx;
    const cx = 8, cy = 8;

    var outerR = 7, innerR = 3;
    var pts = [];
    for (var i = 0; i < 5; i++) {
      var outerA = -Math.PI/2 + i * Math.PI * 2/5;
      var innerA = -Math.PI/2 + (i + 0.5) * Math.PI * 2/5;
      pts.push({ x: cx + Math.round(Math.cos(outerA) * outerR), y: cy + Math.round(Math.sin(outerA) * outerR) });
      pts.push({ x: cx + Math.round(Math.cos(innerA) * innerR), y: cy + Math.round(Math.sin(innerA) * innerR) });
    }

    for (var i = 0; i < 10; i++) {
      var p1 = pts[i];
      var p2 = pts[(i + 1) % 10];
      pc.fillTriangle(cx, cy, p1.x, p1.y, p2.x, p2.y, f + 2);
    }
    // Subtle inner highlight to give some depth
    pc.setPixel(cx, 4, f + 3);
    pc.setPixel(cx - 1, 5, f + 3);
  },
  drawPost(pc, pal) {},
};
