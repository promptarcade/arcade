// Gemstone Resource — Illustrated tier (96x96)
// Hades II style: rich faceted gem using 6-tone palette for smooth gradients.
// Uses pal.groups.X.baseOffset for tone-agnostic color references.

module.exports = {
  width: 96,
  height: 96,
  style: 'illustrated',
  entityType: 'prop',
  colors: {
    body: '#6622cc',
    glow: '#aa55ff',
    highlight: '#ddbbff',
    shadow: '#220044',
    ground: '#443355',
  },

  draw(pc, pal) {
    const bg = pal.groups.body;
    const gg = pal.groups.glow;
    const hg = pal.groups.highlight;
    const sg = pal.groups.shadow;
    const grg = pal.groups.ground;

    // Helper: get tone at fractional position (0=darkest, 1=brightest)
    function tone(group, frac) {
      const idx = Math.round(frac * (group.toneCount - 1));
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1, idx));
    }

    const cx = 48, cy = 42;

    // === GROUND SHADOW ===
    pc.fillEllipse(cx, 82, 26, 5, tone(grg, 0.3));
    pc.fillEllipse(cx, 82, 20, 3, tone(grg, 0.1));

    // === GEM BODY — faceted diamond ===
    const topY = 8, botY = 76, midY = 38, halfW = 32;

    // Crown facets — left darker, right brighter
    pc.fillTriangle(cx, topY, cx - halfW, midY, cx, midY, tone(bg, 0.5));
    pc.fillTriangle(cx, topY, cx, midY, cx + halfW, midY, tone(bg, 0.8));

    // Pavilion facets
    pc.fillTriangle(cx, botY, cx - halfW, midY, cx, midY, tone(sg, 0.4));
    pc.fillTriangle(cx, botY, cx, midY, cx + halfW, midY, tone(bg, 0.2));

    // === SUB-FACETS ===
    const ulMidX = cx - Math.round(halfW * 0.55);
    const ulMidY = midY - Math.round((midY - topY) * 0.4);
    const urMidX = cx + Math.round(halfW * 0.55);
    const urMidY = midY - Math.round((midY - topY) * 0.4);

    // Upper-left sub-facets
    pc.fillTriangle(cx - 8, topY + 6, cx - 4, midY - 4, ulMidX + 4, ulMidY + 2, tone(bg, 0.55));
    pc.fillTriangle(cx, topY + 2, ulMidX, ulMidY, cx - 10, midY - 2, tone(gg, 0.3));

    // Upper-right sub-facets (brightest)
    pc.fillTriangle(cx + 8, topY + 6, cx + 4, midY - 4, urMidX - 4, urMidY + 2, tone(gg, 0.6));
    pc.fillTriangle(cx, topY + 2, urMidX, urMidY, cx + 10, midY - 2, tone(gg, 0.85));

    // === PAVILION INTERNAL REFLECTIONS ===
    pc.fillTriangle(cx - 6, midY + 8, cx - halfW + 10, midY + 4, cx - 10, botY - 16, tone(bg, 0.35));
    pc.fillTriangle(cx - 14, midY + 12, cx - halfW + 14, midY + 8, cx - 16, botY - 20, tone(gg, 0.15));
    pc.fillTriangle(cx + 4, midY + 10, cx + halfW - 12, midY + 6, cx + 8, botY - 14, tone(bg, 0.45));
    pc.fillTriangle(cx + 10, midY + 16, cx + halfW - 16, midY + 10, cx + 12, botY - 22, tone(gg, 0.25));

    // Deep center shadow in pavilion
    pc.line(cx, midY + 2, cx, botY - 4, tone(sg, 0.0));
    pc.line(cx - 1, midY + 4, cx - 1, botY - 6, tone(sg, 0.15));

    // === FACET EDGES — varied thickness ===
    // Girdle (thick)
    for (let dy = -1; dy <= 1; dy++) {
      pc.line(cx - halfW, midY + dy, cx + halfW, midY + dy, tone(sg, 0.2));
    }
    pc.line(cx - halfW + 1, midY - 2, cx + halfW - 1, midY - 2, tone(bg, 0.3));

    // Crown edges (medium)
    pc.line(cx, topY, cx - halfW, midY, tone(sg, 0.3));
    pc.line(cx + 1, topY + 1, cx - halfW + 1, midY, tone(sg, 0.4));
    pc.line(cx, topY, cx + halfW, midY, tone(bg, 0.15));

    // Pavilion edges (thin)
    pc.line(cx, botY, cx - halfW, midY, tone(sg, 0.1));
    pc.line(cx, botY, cx + halfW, midY, tone(sg, 0.2));

    // Sub-facet accent lines
    pc.line(cx, topY + 2, ulMidX, ulMidY, tone(sg, 0.35));
    pc.line(cx, topY + 2, urMidX, urMidY, tone(bg, 0.3));
    pc.line(ulMidX, ulMidY, cx - 4, midY - 2, tone(sg, 0.25));
    pc.line(urMidX, urMidY, cx + 4, midY - 2, tone(bg, 0.2));

    // === INNER GLOW ===
    pc.fillEllipse(cx + 8, topY + 18, 6, 8, tone(gg, 0.6));
    pc.fillEllipse(cx + 8, topY + 16, 4, 5, tone(gg, 0.8));
    pc.fillEllipse(cx - 10, topY + 22, 3, 4, tone(gg, 0.35));

    // === SPECULAR HIGHLIGHTS ===
    pc.fillEllipse(cx + 10, topY + 14, 3, 4, tone(hg, 0.7));
    pc.fillEllipse(cx + 10, topY + 12, 2, 2, tone(hg, 1.0));
    pc.fillEllipse(cx - 8, topY + 20, 2, 2, tone(hg, 0.6));

    // Sparkle dots
    pc.setPixel(cx + 16, midY - 1, tone(hg, 1.0));
    pc.setPixel(cx + 22, midY, tone(hg, 0.7));
    pc.setPixel(cx - 14, midY - 1, tone(hg, 0.6));
    pc.setPixel(cx + 28, midY + 1, tone(gg, 0.9));
    pc.setPixel(cx - 10, midY + 14, tone(gg, 0.85));
    pc.setPixel(cx + 14, midY + 18, tone(gg, 0.65));
    pc.setPixel(cx + 6, botY - 20, tone(gg, 0.6));

    // Crystal texture
    const rng = sf2_seededRNG(42);
    for (let y = topY + 4; y < botY - 4; y++) {
      for (let x = cx - halfW + 4; x < cx + halfW - 4; x++) {
        if (pc.isFilled(x, y) && rng() < 0.02) {
          pc.setPixel(x, y, tone(gg, 0.25));
        }
      }
    }
  },

  drawPost(pc, pal) {
    const hg = pal.groups.highlight;
    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1, Math.round(frac * (group.toneCount - 1))));
    }
    const cx = 48, topY = 8;

    // Restore sharp speculars
    pc.fillEllipse(cx + 10, topY + 12, 2, 2, tone(hg, 1.0));
    pc.setPixel(cx + 10, topY + 10, tone(hg, 1.0));
    // Starburst
    pc.setPixel(cx + 10, topY + 9, tone(hg, 1.0));
    pc.setPixel(cx + 8, topY + 11, tone(hg, 0.85));
    pc.setPixel(cx + 12, topY + 11, tone(hg, 0.85));
    pc.setPixel(cx + 10, topY + 13, tone(hg, 0.7));
    // Girdle sparkle
    pc.setPixel(cx + 16, 37, tone(hg, 1.0));
    pc.setPixel(cx + 22, 38, tone(hg, 0.7));
  },
};
