// Level 2.1: Standing Person Silhouette — FLAT BLACK FILL ONLY
// Same method as p6a-1-mug-silhouette.js: profile function → flat fill → verify shape
// No shading, no colour, no features. Just the outline filled solid.
// Chibi proportions from SpriteForge template: head rx=10 on 32px canvas
//
// A human character is composed of:
// - Head: large ellipse (chibi = 62% of canvas width)
// - Neck: narrow connector
// - Torso: rectangle with rounded shoulders
// - Arms: narrow rectangles flush with torso, hands slightly wider
// - Legs: two separate rectangles with gap
// - Shoes: slightly wider than legs

module.exports = {
  width: 32,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    fill: '#222222',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },

  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.floor(fg.toneCount / 2);
    pc.pixels[0] = 0;

    const W = 32, H = 48, cx = 15;

    // ==============================================
    // HEAD — ellipse, chibi proportions
    // rx=10, ry=10, cy=12 (from template)
    // ==============================================
    const headCy = 12, headRx = 10, headRy = 10;
    for (let y = headCy - headRy; y <= headCy + headRy; y++) {
      for (let x = 0; x < W; x++) {
        const nx = (x - cx) / headRx, ny = (y - headCy) / headRy;
        if (nx * nx + ny * ny <= 1.0) {
          pc.setPixel(x, y, FLAT);
        }
      }
    }

    // Ears
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx * dx + dy * dy <= 1) {
          pc.setPixel(cx - headRx + dx, headCy + 1 + dy, FLAT);
          pc.setPixel(cx + headRx + dx, headCy + 1 + dy, FLAT);
        }
      }
    }

    // ==============================================
    // NECK
    // ==============================================
    const neckTop = headCy + headRy + 1; // y=23
    for (let y = neckTop; y <= neckTop + 1; y++) {
      for (let x = cx - 2; x <= cx + 2; x++) {
        pc.setPixel(x, y, FLAT);
      }
    }

    // ==============================================
    // TORSO — rectangle, w=14, h=8, cy=25
    // ==============================================
    const torsoCy = 27, torsoW = 14, torsoH = 8;
    const torsoLeft = cx - Math.floor(torsoW / 2);
    const torsoTop = torsoCy - Math.floor(torsoH / 2);
    for (let y = torsoTop; y < torsoTop + torsoH; y++) {
      for (let x = torsoLeft; x < torsoLeft + torsoW; x++) {
        pc.setPixel(x, y, FLAT);
      }
    }
    // Round top corners
    pc.setPixel(torsoLeft, torsoTop, 0);
    pc.setPixel(torsoLeft + torsoW - 1, torsoTop, 0);

    // ==============================================
    // ARMS — w=3, h=7, flush with torso sides
    // ==============================================
    const armTop = torsoTop + 1; // shoulderOff=1
    const armH = 7;
    // Left arm
    for (let y = armTop; y < armTop + armH; y++) {
      for (let dx = 0; dx < 3; dx++) {
        pc.setPixel(torsoLeft - 3 + dx, y, FLAT);
      }
    }
    // Right arm
    for (let y = armTop; y < armTop + armH; y++) {
      for (let dx = 0; dx < 3; dx++) {
        pc.setPixel(torsoLeft + torsoW + dx, y, FLAT);
      }
    }
    // Hands (w=3, h=2)
    for (let y = armTop + armH; y < armTop + armH + 2; y++) {
      for (let dx = 0; dx < 3; dx++) {
        pc.setPixel(torsoLeft - 3 + dx, y, FLAT);
        pc.setPixel(torsoLeft + torsoW + dx, y, FLAT);
      }
    }

    // ==============================================
    // BELT
    // ==============================================
    const legBase = torsoCy + Math.floor(torsoH / 2);
    for (let x = torsoLeft + 1; x < torsoLeft + torsoW - 1; x++) {
      pc.setPixel(x, legBase - 1, FLAT);
    }

    // ==============================================
    // LEGS — w=4, h=7, gap=2
    // ==============================================
    const legY = legBase;
    const legW = 4, legH = 7, legGap = 2;
    const leftLegX = cx - Math.floor(legGap / 2) - legW;
    const rightLegX = cx + Math.floor(legGap / 2);
    for (let y = legY; y < legY + legH; y++) {
      for (let dx = 0; dx < legW; dx++) {
        pc.setPixel(leftLegX + dx, y, FLAT);
        pc.setPixel(rightLegX + dx, y, FLAT);
      }
    }

    // ==============================================
    // SHOES — w=legW+1, h=2, offset -1 on left
    // ==============================================
    const shoeY = legY + legH;
    for (let y = shoeY; y < shoeY + 2; y++) {
      for (let dx = -1; dx < legW; dx++) {
        pc.setPixel(leftLegX + dx, y, FLAT);
      }
      for (let dx = 0; dx <= legW; dx++) {
        pc.setPixel(rightLegX + dx, y, FLAT);
      }
    }
  },
};
