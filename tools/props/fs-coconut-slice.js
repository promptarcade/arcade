// Coconut Slice — 44x44 cross-section view
// Thick brown rough shell ring (5-6px), white coconut meat layer (4px),
// darker hollow center representing the water cavity.

module.exports = {
  width: 44,
  height: 44,
  colors: {
    shell: '#5C3317',     // dark brown rough outer shell
    meat: '#FFFDD0',      // cream-white coconut meat
    cavity: '#3A5F5F',    // dark teal-gray water cavity
  },

  draw(pc, pal) {
    const sh = pal.groups.shell.startIdx;
    const me = pal.groups.meat.startIdx;
    const ca = pal.groups.cavity.startIdx;
    const cx = 22, cy = 22;

    // Outer brown shell — full circle
    pc.fillCircle(cx, cy, 19, sh + 2);

    // Darker shading on lower-right of shell for depth
    pc.fillEllipse(cx + 3, cy + 3, 17, 17, sh + 0);
    // Restore mid shell in center-upper area
    pc.fillCircle(cx, cy, 18, sh + 2);
    // Light catch on upper-left shell edge
    pc.fillEllipse(cx - 5, cy - 5, 10, 10, sh + 3);
    // Restore layers inside the highlight
    pc.fillCircle(cx, cy, 17, sh + 2);

    // Rough shell texture
    const rng = sf2_seededRNG(33);
    // Apply noise to the shell ring only (will be covered by meat inside)
    pc.scatterNoise(cx - 19, cy - 19, 38, 38, sh + 0, 0.07, rng);
    pc.scatterNoise(cx - 19, cy - 19, 38, 38, sh + 3, 0.04, rng);

    // White coconut meat layer inside shell (shell is ~5-6px thick)
    pc.fillCircle(cx, cy, 13, me + 2);

    // Slight shading on meat — darker near shell edge
    pc.fillCircle(cx, cy, 13, me + 1);
    pc.fillCircle(cx, cy, 12, me + 2);
    pc.fillCircle(cx, cy, 11, me + 3);
    pc.fillCircle(cx, cy, 10, me + 2);

    // Hollow darker center — water cavity
    pc.fillCircle(cx, cy, 9, ca + 2);

    // Depth gradient in cavity — darker at center
    pc.fillCircle(cx, cy, 7, ca + 1);
    pc.fillCircle(cx, cy, 5, ca + 0);

    // Slight reflection/sheen on water surface
    pc.fillEllipse(cx - 2, cy - 3, 4, 2, ca + 3);
    pc.fillEllipse(cx + 1, cy - 2, 2, 1, ca + 3);
  },

  drawPost(pc, pal) {
    const sh = pal.groups.shell.startIdx;
    const me = pal.groups.meat.startIdx;
    const ca = pal.groups.cavity.startIdx;
    const cx = 22, cy = 22;

    // Shell fiber texture — small radial scratches
    const rng2 = sf2_seededRNG(44);
    for (let i = 0; i < 20; i++) {
      const angle = rng2() * Math.PI * 2;
      const r = 14 + rng2() * 4;
      const px = Math.round(cx + Math.cos(angle) * r);
      const py = Math.round(cy + Math.sin(angle) * r);
      // Only draw if inside the shell ring
      const dx = px - cx, dy = py - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= 13 && dist <= 18) {
        pc.setPixel(px, py, sh + 1);
        // Short radial line
        const px2 = Math.round(cx + Math.cos(angle) * (r + 1));
        const py2 = Math.round(cy + Math.sin(angle) * (r + 1));
        if (Math.sqrt((px2 - cx) ** 2 + (py2 - cy) ** 2) <= 18) {
          pc.setPixel(px2, py2, sh + 0);
        }
      }
    }

    // Bright edge highlight on meat ring (upper-left)
    for (let a = 2.5; a < 4.2; a += 0.15) {
      const px = Math.round(cx + Math.cos(a) * 12);
      const py = Math.round(cy + Math.sin(a) * 12);
      pc.setPixel(px, py, me + 3);
    }

    // Small water highlight dot
    pc.setPixel(cx - 1, cy - 4, ca + 3);
    pc.setPixel(cx, cy - 4, ca + 3);
  },
};
