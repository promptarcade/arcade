// Apple Slice — 40x44 cross-section
// Circle with slight apple-shape indent at top. Thin red skin ring,
// cream/white flesh interior, 5-pointed star seed pocket in center with brown seeds.

module.exports = {
  width: 40,
  height: 44,
  colors: {
    skin: '#cc2233',
    flesh: '#f5e8c8',
    pocket: '#c8a870',
    seed: '#553311',
  },

  draw(pc, pal) {
    const sk = pal.groups.skin.startIdx;
    const f = pal.groups.flesh.startIdx;
    const cx = 20, cy = 22;
    const outerR = 17;

    // Layer 1: Red skin — full circle with slight indent at top
    pc.fillCircle(cx, cy, outerR, sk + 2);

    // Apple indent at top — carve a small notch
    pc.fillCircle(cx, cy - outerR + 1, 3, sk + 0);
    // Stem hint at top
    pc.vline(cx, cy - outerR - 1, 3, sk + 0);
    pc.setPixel(cx, cy - outerR - 1, sk + 1);

    // Skin highlight — lighter red on upper right
    for (let row = -outerR; row < -outerR + 6; row++) {
      const y = cy + row;
      const halfW = Math.round(Math.sqrt(outerR * outerR - row * row));
      for (let col = 2; col < halfW - 1; col++) {
        pc.setPixel(cx + col, y, sk + 3);
      }
    }

    // Layer 2: Cream flesh — inner circle
    pc.fillCircle(cx, cy, outerR - 2, f + 2);

    // Flesh gradient — lighter center
    pc.fillCircle(cx, cy, outerR - 5, f + 3);

    // Subtle flesh grain texture
    const rng = sf2_seededRNG(55);
    pc.scatterNoise(cx - 14, cy - 14, 28, 28, f + 1, 0.03, rng);

    // Slight browning at very edge of flesh (oxidation effect)
    const rng2 = sf2_seededRNG(66);
    for (let a = 0; a < Math.PI * 2; a += 0.15) {
      const edgeR = outerR - 2;
      const ex = Math.round(cx + Math.cos(a) * edgeR);
      const ey = Math.round(cy + Math.sin(a) * edgeR);
      pc.setPixel(ex, ey, f + 0);
    }
  },

  drawPost(pc, pal) {
    const pk = pal.groups.pocket.startIdx;
    const s = pal.groups.seed.startIdx;
    const cx = 20, cy = 22;

    // 5-pointed star seed pocket
    // Draw 5 teardrop-shaped chambers radiating from center
    const numPoints = 5;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2; // start from top

      // Each chamber: elongated oval from center outward
      for (let d = 2; d <= 7; d++) {
        const px = Math.round(cx + Math.cos(angle) * d);
        const py = Math.round(cy + Math.sin(angle) * d);
        pc.setPixel(px, py, pk + 2);
        // Wider at the outer end
        if (d >= 4 && d <= 6) {
          const perpAngle = angle + Math.PI / 2;
          const px2 = Math.round(cx + Math.cos(angle) * d + Math.cos(perpAngle));
          const py2 = Math.round(cy + Math.sin(angle) * d + Math.sin(perpAngle));
          pc.setPixel(px2, py2, pk + 1);
          const px3 = Math.round(cx + Math.cos(angle) * d - Math.cos(perpAngle));
          const py3 = Math.round(cy + Math.sin(angle) * d - Math.sin(perpAngle));
          pc.setPixel(px3, py3, pk + 1);
        }
      }

      // Brown seed at the tip of each chamber (d ~ 5-6)
      const seedX = Math.round(cx + Math.cos(angle) * 5);
      const seedY = Math.round(cy + Math.sin(angle) * 5);
      pc.setPixel(seedX, seedY, s + 2);
      // Seed is a small teardrop — 2 pixels
      const seedX2 = Math.round(cx + Math.cos(angle) * 6);
      const seedY2 = Math.round(cy + Math.sin(angle) * 6);
      pc.setPixel(seedX2, seedY2, s + 1);
    }

    // Thin lines connecting the star points through center
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
      pc.setPixel(
        Math.round(cx + Math.cos(angle) * 1),
        Math.round(cy + Math.sin(angle) * 1),
        pk + 2
      );
    }

    // Center dot
    pc.setPixel(cx, cy, pk + 3);
  },
};
