// Rat enemy — 24x28
// Grey-brown, chunky body, big round ears, pink nose, long tail, beady eyes.
// Sitting upright holding a crumb. Smug expression.

module.exports = {
  width: 24,
  height: 28,
  colors: {
    fur: '#887766',      // grey-brown fur
    belly: '#ccbbaa',    // lighter underbelly
    ear: '#ddaa99',      // pink inner ear
    nose: '#ee8888',     // pink nose
    eye: '#ffffff',      // eye whites
    tail: '#bb9988',     // pink-grey tail
    crumb: '#ddcc66',    // cheese/crumb it's holding
  },

  draw(pc, pal) {
    const f = pal.groups.fur.startIdx;
    const be = pal.groups.belly.startIdx;
    const ea = pal.groups.ear.startIdx;
    const ta = pal.groups.tail.startIdx;
    const cr = pal.groups.crumb.startIdx;
    const cx = 12, cy = 14;

    // Tail — drawn first, behind body. Curves from bottom right
    pc.setPixel(cx + 7, cy + 8, ta + 2);
    pc.setPixel(cx + 8, cy + 7, ta + 2);
    pc.setPixel(cx + 9, cy + 6, ta + 2);
    pc.setPixel(cx + 10, cy + 5, ta + 2);
    pc.setPixel(cx + 10, cy + 4, ta + 1);
    pc.setPixel(cx + 9, cy + 3, ta + 1);
    pc.setPixel(cx + 8, cy + 3, ta + 2);

    // Body — plump oval, sitting upright
    pc.fillEllipse(cx, cy + 2, 7, 8, f + 2);

    // Belly — lighter front
    pc.fillEllipse(cx, cy + 4, 4, 5, be + 2);

    // Head — round, on top of body
    pc.fillCircle(cx, cy - 5, 6, f + 2);

    // Ears — big and round, distinctive rat feature
    // Left ear — outer
    pc.fillCircle(cx - 6, cy - 9, 3, f + 2);
    // Left ear — inner pink
    pc.fillCircle(cx - 6, cy - 9, 2, ea + 2);
    pc.setPixel(cx - 6, cy - 10, ea + 3);

    // Right ear
    pc.fillCircle(cx + 6, cy - 9, 3, f + 2);
    pc.fillCircle(cx + 6, cy - 9, 2, ea + 2);
    pc.setPixel(cx + 6, cy - 10, ea + 3);

    // Muzzle — lighter area around nose
    pc.fillEllipse(cx, cy - 3, 3, 2, be + 2);

    // Arms — small, holding a crumb
    pc.fillRect(cx - 5, cy, 2, 3, f + 2);
    pc.fillRect(cx + 4, cy, 2, 3, f + 2);
    // Paws
    pc.setPixel(cx - 5, cy + 3, be + 2);
    pc.setPixel(cx + 5, cy + 3, be + 2);

    // Crumb/cheese being held
    pc.fillRect(cx - 2, cy + 1, 4, 3, cr + 2);
    pc.setPixel(cx - 2, cy + 1, cr + 3);
    pc.setPixel(cx + 1, cy + 3, cr + 1);
    // Cheese holes
    pc.setPixel(cx, cy + 2, cr + 1);

    // Feet — poking out at bottom
    pc.fillRect(cx - 5, cy + 9, 3, 2, f + 1);
    pc.fillRect(cx + 3, cy + 9, 3, 2, f + 1);
    // Toes
    pc.setPixel(cx - 6, cy + 10, be + 1);
    pc.setPixel(cx + 6, cy + 10, be + 1);

    // Fur texture
    const rng = sf2_seededRNG(789);
    pc.scatterNoise(cx - 6, cy - 4, 12, 12, f + 1, 0.05, rng);
  },

  drawPost(pc, pal) {
    const e = pal.groups.eye.startIdx;
    const n = pal.groups.nose.startIdx;
    const f = pal.groups.fur.startIdx;
    const cx = 12, cy = 14;

    // Eyes — small, beady, slightly smug
    // Left eye
    pc.fillRect(cx - 4, cy - 6, 2, 2, e + 2);
    pc.setPixel(cx - 3, cy - 5, e);          // pupil (using darkest eye index)
    pc.setPixel(cx - 4, cy - 6, e + 3);      // specular

    // Right eye
    pc.fillRect(cx + 2, cy - 6, 2, 2, e + 2);
    pc.setPixel(cx + 3, cy - 5, e);
    pc.setPixel(cx + 2, cy - 6, e + 3);

    // Smug half-lowered eyelids
    pc.hline(cx - 4, cy - 7, 2, f + 1);
    pc.hline(cx + 2, cy - 7, 2, f + 1);

    // Nose — pink, prominent
    pc.fillRect(cx - 1, cy - 3, 2, 2, n + 2);
    pc.setPixel(cx - 1, cy - 3, n + 3);      // highlight

    // Whiskers
    pc.hline(cx - 7, cy - 3, 3, f + 3);
    pc.hline(cx - 6, cy - 2, 2, f + 3);
    pc.hline(cx + 5, cy - 3, 3, f + 3);
    pc.hline(cx + 5, cy - 2, 2, f + 3);

    // Smug grin
    pc.hline(cx - 2, cy - 1, 4, f);
    pc.setPixel(cx - 2, cy - 2, f);
    pc.setPixel(cx + 2, cy - 2, f);
    // Teeth showing
    pc.setPixel(cx - 1, cy - 1, e + 2);
    pc.setPixel(cx, cy - 1, e + 2);
  },
};
