// Star — 16x16 UI element (gold, filled)
// Iteration 2: precise 5-pointed star using calculated vertices.
module.exports = {
  width: 16, height: 16,
  colors: { gold: '#ffcc22', shine: '#fff8dd' },
  draw(pc, pal) {
    const g = pal.groups.gold.startIdx;
    const cx = 8, cy = 8;

    // Draw a clean 5-pointed star by filling scanlines
    // Star vertices (outer and inner points, calculated for 16x16)
    // Outer points at radius 7, inner at radius 3
    var outerR = 7, innerR = 3;
    var pts = [];
    for (var i = 0; i < 5; i++) {
      var outerA = -Math.PI/2 + i * Math.PI * 2/5;
      var innerA = -Math.PI/2 + (i + 0.5) * Math.PI * 2/5;
      pts.push({ x: cx + Math.round(Math.cos(outerA) * outerR), y: cy + Math.round(Math.sin(outerA) * outerR) });
      pts.push({ x: cx + Math.round(Math.cos(innerA) * innerR), y: cy + Math.round(Math.sin(innerA) * innerR) });
    }

    // Fill the star polygon using triangle fan from center
    for (var i = 0; i < 10; i++) {
      var p1 = pts[i];
      var p2 = pts[(i + 1) % 10];
      pc.fillTriangle(cx, cy, p1.x, p1.y, p2.x, p2.y, g + 2);
    }

    // Bright highlight — upper area
    pc.setPixel(cx, 2, g + 3);
    pc.setPixel(cx - 1, 3, g + 3);
    pc.setPixel(cx, 3, g + 3);
    pc.setPixel(cx - 1, 4, g + 3);
    pc.fillRect(5, 5, 3, 2, g + 3);
    pc.setPixel(4, 7, g + 3);

    // Specular
    pc.setPixel(cx, 3, pal.groups.shine.startIdx + 2);
    pc.setPixel(cx - 1, 4, pal.groups.shine.startIdx + 2);

    // Shadow in lower right
    pc.setPixel(11, 6, g + 1);
    pc.setPixel(12, 7, g + 1);
    pc.setPixel(10, 10, g + 1);
    pc.setPixel(11, 11, g + 1);
  },
  drawPost(pc, pal) {},
};
