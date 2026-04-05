// Phase 6, Exercise 6.1: Master copy — Stardew Valley style parsnip
// Training target: absorb professional technique by matching quality level exactly
// Stardew crops are ~16x16, 4-5 colours, tinted outlines, upper-left light, warm palette
// The key: at 16px every pixel is a conscious decision. No waste.

module.exports = {
  width: 16,
  height: 16,
  style: 'pixel',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    body: '#f0ddb0',      // creamy parsnip body
    leaf: '#55aa33',       // green top
    dirt: '#886644',       // soil/root
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.body.startIdx); },

  drawPost(pc, pal) {
    const bg = pal.groups.body;
    const lg = pal.groups.leaf;
    const dg = pal.groups.dirt;

    function t(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    // At 16x16, every pixel is hand-placed. No loops, no normals.
    // This is pure pixel art — placement by intention.

    // Leaf tops (rows 0-4)
    //   Row 0: single leaf tip
    pc.setPixel(8, 0, t(lg, 0.7));
    //   Row 1: leaf widens
    pc.setPixel(7, 1, t(lg, 0.6));
    pc.setPixel(8, 1, t(lg, 0.8));
    pc.setPixel(9, 1, t(lg, 0.5));
    //   Row 2: two leaves diverging
    pc.setPixel(6, 2, t(lg, 0.5));
    pc.setPixel(7, 2, t(lg, 0.7));
    pc.setPixel(8, 2, t(lg, 0.6));
    pc.setPixel(9, 2, t(lg, 0.7));
    pc.setPixel(10, 2, t(lg, 0.4));
    //   Row 3: leaves spread
    pc.setPixel(5, 3, t(lg, 0.35));
    pc.setPixel(6, 3, t(lg, 0.6));
    pc.setPixel(7, 3, t(lg, 0.8));
    pc.setPixel(8, 3, t(lg, 0.5));
    pc.setPixel(9, 3, t(lg, 0.75));
    pc.setPixel(10, 3, t(lg, 0.55));
    pc.setPixel(11, 3, t(lg, 0.3));
    //   Row 4: leaf base meets root
    pc.setPixel(6, 4, t(lg, 0.4));
    pc.setPixel(7, 4, t(lg, 0.65));
    pc.setPixel(8, 4, t(lg, 0.45));
    pc.setPixel(9, 4, t(lg, 0.55));
    pc.setPixel(10, 4, t(lg, 0.3));

    // Parsnip body — tapered root shape (rows 5-14)
    // Outline: darkest body tone. Fill: lit/shadow.
    // Shape: widest at row 6-7, tapers to point at row 14

    // Row 5: narrow top, just below leaves
    pc.setPixel(7, 5, t(bg, 0.15));  // outline
    pc.setPixel(8, 5, t(bg, 0.65));  // lit
    pc.setPixel(9, 5, t(bg, 0.15));  // outline

    // Row 6: wider
    pc.setPixel(6, 6, t(bg, 0.15));
    pc.setPixel(7, 6, t(bg, 0.8));   // highlight
    pc.setPixel(8, 6, t(bg, 0.7));
    pc.setPixel(9, 6, t(bg, 0.45));  // shadow side
    pc.setPixel(10, 6, t(bg, 0.15));

    // Row 7: widest
    pc.setPixel(5, 7, t(bg, 0.15));
    pc.setPixel(6, 7, t(bg, 0.75));
    pc.setPixel(7, 7, t(bg, 0.9));   // brightest — specular area
    pc.setPixel(8, 7, t(bg, 0.7));
    pc.setPixel(9, 7, t(bg, 0.5));
    pc.setPixel(10, 7, t(bg, 0.3));
    pc.setPixel(11, 7, t(bg, 0.15));

    // Row 8: still wide
    pc.setPixel(5, 8, t(bg, 0.15));
    pc.setPixel(6, 8, t(bg, 0.7));
    pc.setPixel(7, 8, t(bg, 0.85));
    pc.setPixel(8, 8, t(bg, 0.65));
    pc.setPixel(9, 8, t(bg, 0.45));
    pc.setPixel(10, 8, t(bg, 0.25));
    pc.setPixel(11, 8, t(bg, 0.15));

    // Row 9: starting to taper
    pc.setPixel(6, 9, t(bg, 0.15));
    pc.setPixel(7, 9, t(bg, 0.75));
    pc.setPixel(8, 9, t(bg, 0.6));
    pc.setPixel(9, 9, t(bg, 0.4));
    pc.setPixel(10, 9, t(bg, 0.15));

    // Row 10: narrower
    pc.setPixel(6, 10, t(bg, 0.15));
    pc.setPixel(7, 10, t(bg, 0.7));
    pc.setPixel(8, 10, t(bg, 0.55));
    pc.setPixel(9, 10, t(bg, 0.35));
    pc.setPixel(10, 10, t(bg, 0.15));

    // Row 11:
    pc.setPixel(7, 11, t(bg, 0.15));
    pc.setPixel(8, 11, t(bg, 0.6));
    pc.setPixel(9, 11, t(bg, 0.35));

    // Row 12:
    pc.setPixel(7, 12, t(bg, 0.15));
    pc.setPixel(8, 12, t(bg, 0.5));
    pc.setPixel(9, 12, t(bg, 0.15));

    // Row 13: thin tip
    pc.setPixel(8, 13, t(bg, 0.35));

    // Row 14: root tip — dirt colour
    pc.setPixel(8, 14, t(dg, 0.35));

    // Small root hair
    pc.setPixel(10, 10, t(dg, 0.3));
    pc.setPixel(11, 11, t(dg, 0.2));

    // Drop shadow — 2 pixels under the base
    pc.setPixel(7, 15, t(dg, 0.1));
    pc.setPixel(8, 15, t(dg, 0.12));
    pc.setPixel(9, 15, t(dg, 0.08));
  },
};
