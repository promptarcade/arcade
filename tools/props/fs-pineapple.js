// Pineapple — 40x56 whole fruit for Fruit Slash
// Oval body with diamond cross-hatch pattern. Green spiky crown of leaves at top.

module.exports = {
  width: 40,
  height: 56,
  colors: {
    body: '#cc8822',      // golden-brown
    hatch: '#886611',     // darker cross-hatch lines
    crown: '#33aa33',     // bright green leaves
    pip: '#aa6611',       // diamond center pips
  },

  draw(pc, pal) {
    const b = pal.groups.body.startIdx;
    const h = pal.groups.hatch.startIdx;
    const cr = pal.groups.crown.startIdx;
    const pp = pal.groups.pip.startIdx;
    const cx = 20, cy = 33;

    // Oval body — taller than wide (rx=14, ry=18)
    pc.fillEllipse(cx, cy, 14, 18, b + 2);

    // 3D shading — darker on right and bottom
    pc.fillEllipse(cx + 3, cy + 4, 12, 16, b + 1);
    // Restore left/upper area
    pc.fillEllipse(cx - 1, cy - 2, 13, 16, b + 2);

    // Highlight on upper left
    pc.fillEllipse(cx - 4, cy - 7, 5, 6, b + 3);

    // Diamond cross-hatch pattern
    // Diagonal lines going down-right
    for (let d = -30; d <= 30; d += 5) {
      for (let i = -20; i <= 20; i++) {
        const px = cx + i;
        const py = cy + i + d;
        // Check inside oval
        const nx = (px - cx) / 14;
        const ny = (py - cy) / 18;
        if (nx * nx + ny * ny < 0.88) {
          pc.setPixel(px, py, h + 1);
        }
      }
    }
    // Diagonal lines going down-left
    for (let d = -30; d <= 30; d += 5) {
      for (let i = -20; i <= 20; i++) {
        const px = cx + i;
        const py = cy - i + d;
        const nx = (px - cx) / 14;
        const ny = (py - cy) / 18;
        if (nx * nx + ny * ny < 0.88) {
          pc.setPixel(px, py, h + 1);
        }
      }
    }

    // Diamond center pips — small dots at diamond centers
    for (let dy = -16; dy <= 16; dy += 5) {
      for (let dx = -12; dx <= 12; dx += 5) {
        const px = cx + dx;
        const py = cy + dy;
        const nx = (px - cx) / 14;
        const ny = (py - cy) / 18;
        if (nx * nx + ny * ny < 0.75) {
          pc.setPixel(px, py, pp + 2);
          pc.setPixel(px, py - 1, pp + 3);
        }
      }
    }

    // Subtle texture
    const rng = sf2_seededRNG(33);
    pc.scatterNoise(cx - 10, cy - 12, 20, 28, b + 1, 0.03, rng);

    // === Crown of leaves at top ===
    // Base where leaves meet the body
    pc.fillEllipse(cx, cy - 17, 8, 3, cr + 1);

    // Center tall leaf
    pc.fillTriangle(cx - 2, cy - 18, cx + 2, cy - 18, cx, cy - 35, cr + 2);
    // Left-center leaf
    pc.fillTriangle(cx - 3, cy - 17, cx - 1, cy - 18, cx - 5, cy - 31, cr + 2);
    // Right-center leaf
    pc.fillTriangle(cx + 1, cy - 18, cx + 3, cy - 17, cx + 5, cy - 31, cr + 2);
    // Far-left leaf — angled outward
    pc.fillTriangle(cx - 5, cy - 16, cx - 3, cy - 17, cx - 9, cy - 27, cr + 2);
    // Far-right leaf — angled outward
    pc.fillTriangle(cx + 3, cy - 17, cx + 5, cy - 16, cx + 9, cy - 27, cr + 2);
    // Extra outer leaves — shorter, more spread
    pc.fillTriangle(cx - 7, cy - 15, cx - 5, cy - 16, cx - 11, cy - 23, cr + 1);
    pc.fillTriangle(cx + 5, cy - 16, cx + 7, cy - 15, cx + 11, cy - 23, cr + 1);

    // Leaf highlights — bright edges on center leaves
    pc.setPixel(cx - 1, cy - 28, cr + 3);
    pc.setPixel(cx, cy - 30, cr + 3);
    pc.setPixel(cx + 1, cy - 28, cr + 3);
    pc.setPixel(cx - 4, cy - 26, cr + 3);
    pc.setPixel(cx + 4, cy - 26, cr + 3);

    // Leaf dark veins
    pc.setPixel(cx, cy - 24, cr + 0);
    pc.setPixel(cx, cy - 26, cr + 0);
    pc.setPixel(cx - 4, cy - 23, cr + 0);
    pc.setPixel(cx + 4, cy - 23, cr + 0);
  },

  drawPost(pc, pal) {
    const b = pal.groups.body.startIdx;
    const cr = pal.groups.crown.startIdx;
    const cx = 20, cy = 33;

    // Extra bright specular on body
    pc.setPixel(cx - 6, cy - 10, b + 3);
    pc.setPixel(cx - 5, cy - 11, b + 3);
    pc.setPixel(cx - 7, cy - 9, b + 3);

    // Leaf tip highlights after shading
    pc.setPixel(cx, cy - 34, cr + 3);
    pc.setPixel(cx - 5, cy - 30, cr + 3);
    pc.setPixel(cx + 5, cy - 30, cr + 3);
    pc.setPixel(cx - 9, cy - 26, cr + 3);
    pc.setPixel(cx + 9, cy - 26, cr + 3);
  },
};
