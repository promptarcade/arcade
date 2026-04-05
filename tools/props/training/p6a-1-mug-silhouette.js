// Phase 6A, Exercise 1: Coffee Mug — SILHOUETTE ONLY
// Step 1: Get the SHAPE right before any shading.
// A mug is: cylindrical body (slightly wider at top), D-shaped handle on right,
// visible rim ellipse at top showing interior.
// Proportions: width:height roughly 1:1.1 (slightly taller than wide, not counting handle)

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    fill: '#444444',  // flat grey — silhouette only
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },

  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    function tone(frac) {
      return fg.startIdx + Math.max(0, Math.min(fg.toneCount - 1,
        Math.round(frac * (fg.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 40, bodyTop = 18, bodyBot = 80;
    const FLAT = tone(0.5); // single flat colour — NO SHADING

    // Mug proportions from reference:
    // - Body: cylinder, slightly wider at top (rim flares)
    // - Height ~62px, width ~50px at widest
    // - Rim is an ellipse viewed from slightly above
    // - Handle: D-shape on the right, attaches at upper-third and lower-third
    // - Base: flat, slightly narrower than body

    // BODY profile — the key skill being trained
    function mugProfile(t) { // t: 0=top (rim), 1=bottom (base)
      const rimWidth = 25;
      const bodyWidth = 23;
      const baseWidth = 21;

      if (t < 0.03) return rimWidth;                    // rim lip
      if (t < 0.08) return rimWidth - (t - 0.03) / 0.05 * 3; // rim to body transition
      if (t < 0.85) {
        // Main body — very slight belly: widest at ~40%, narrows slightly toward base
        const bellyT = (t - 0.08) / 0.77;
        const belly = Math.sin(bellyT * Math.PI) * 1.5;
        return bodyWidth + belly;
      }
      // Base taper
      const baseT = (t - 0.85) / 0.15;
      return bodyWidth - baseT * (bodyWidth - baseWidth);
    }

    // Draw body as flat fill
    for (let y = bodyTop; y <= bodyBot; y++) {
      const t = (y - bodyTop) / (bodyBot - bodyTop);
      const halfW = Math.round(mugProfile(t));
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 96 && y >= 0 && y < 96) {
          pc.setPixel(x, y, FLAT);
        }
      }
    }

    // Rim ellipse — visible top of the mug (viewed slightly from above)
    const rimRX = 25, rimRY = 7;
    for (let y = bodyTop - rimRY; y <= bodyTop + rimRY; y++) {
      for (let x = cx - rimRX - 1; x <= cx + rimRX + 1; x++) {
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;
        const dx = (x - cx) / rimRX, dy = (y - bodyTop) / rimRY;
        if (dx * dx + dy * dy <= 1) {
          pc.setPixel(x, y, FLAT);
        }
      }
    }

    // Base line — flat bottom, slightly visible
    for (let x = cx - 21; x <= cx + 21; x++) {
      if (x >= 0 && x < 96 && bodyBot + 1 < 96) {
        pc.setPixel(x, bodyBot + 1, FLAT);
      }
    }

    // HANDLE — D-shape on the right side
    // Handle attaches at ~25% and ~75% down the body
    // Extends outward ~18px from the body edge
    const handleTopY = bodyTop + Math.round((bodyBot - bodyTop) * 0.2);
    const handleBotY = bodyTop + Math.round((bodyBot - bodyTop) * 0.75);
    const handleAttachX = cx + Math.round(mugProfile(0.4)); // body edge at mid-height
    const handleExtend = 18; // how far handle sticks out
    const handleThickness = 5;

    for (let y = handleTopY; y <= handleBotY; y++) {
      const t = (y - handleTopY) / (handleBotY - handleTopY); // 0=top, 1=bottom
      // D-shape curve: furthest out at middle, connects to body at top and bottom
      const curve = Math.sin(t * Math.PI); // 0 at ends, 1 at middle
      const outerX = handleAttachX + Math.round(handleExtend * curve);
      const innerX = handleAttachX + Math.round((handleExtend - handleThickness) * curve);

      // Only draw the handle ring (outer minus inner)
      for (let x = innerX; x <= outerX; x++) {
        if (x >= 0 && x < 96 && y >= 0 && y < 96) {
          pc.setPixel(x, y, FLAT);
        }
      }

      // Top and bottom connecting bars (where handle meets body)
      if (t < 0.08 || t > 0.92) {
        for (let x = handleAttachX; x <= handleAttachX + 4; x++) {
          if (x >= 0 && x < 96 && y >= 0 && y < 96) {
            pc.setPixel(x, y, FLAT);
          }
        }
      }
    }
  },
};
