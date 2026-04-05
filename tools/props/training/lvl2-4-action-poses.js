// Level 2.4: Action Poses — FLAT BLACK FILL ONLY
// Test: can you identify standing vs walking vs stirring from silhouette?
// Same character (chef) in 3 poses side by side
// Layout: 3 characters (102 × 50)
module.exports = {
  width: 102,
  height: 50,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#222222' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const F = fg.startIdx + Math.floor(fg.toneCount / 2);
    pc.pixels[0] = 0;
    const TW = 102, TH = 50;

    function ellipse(cx, cy, rx, ry) {
      for (let y = cy - ry; y <= cy + ry; y++)
        for (let x = cx - rx; x <= cx + rx; x++)
          if (x >= 0 && x < TW && y >= 0 && y < TH &&
              ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1)
            pc.setPixel(x, y, F);
    }

    function rect(x0, y0, w, h) {
      for (let y = y0; y < y0 + h; y++)
        for (let x = x0; x < x0 + w; x++)
          if (x >= 0 && x < TW && y >= 0 && y < TH)
            pc.setPixel(x, y, F);
    }

    function pixel(x, y) {
      if (x >= 0 && x < TW && y >= 0 && y < TH) pc.setPixel(x, y, F);
    }

    function clear(x, y) {
      if (x >= 0 && x < TW && y >= 0 && y < TH) pc.setPixel(x, y, 0);
    }

    // Chef toque helper
    function drawToque(cx, topY) {
      // Band
      for (let x = cx - 8; x <= cx + 8; x++) pixel(x, topY + 6);
      // Puff top
      for (let y = topY; y <= topY + 5; y++) {
        const t = (y - topY) / 5;
        const hw = Math.round(4 + Math.sin(t * Math.PI) * 4);
        for (let x = cx - hw; x <= cx + hw; x++) pixel(x, y);
      }
    }

    // ========================================
    // 1. STANDING — neutral idle pose
    // ========================================
    {
      const cx = 17;
      const headCy = 12, headRx = 10, headRy = 10;

      drawToque(cx, 0);
      ellipse(cx, headCy, headRx, headRy);

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            pixel(cx - headRx + dx, headCy + 1 + dy);
            pixel(cx + headRx + dx, headCy + 1 + dy);
          }

      // Neck
      rect(cx - 2, 23, 5, 2);

      // Torso
      const tL = cx - 7;
      rect(tL, 25, 14, 8);
      clear(tL, 25); clear(tL + 13, 25);

      // Arms straight down
      rect(tL - 3, 26, 3, 8);
      rect(tL + 14, 26, 3, 8);
      // Hands
      rect(tL - 3, 34, 3, 2);
      rect(tL + 14, 34, 3, 2);

      // Apron
      for (let y = 27; y <= 36; y++) {
        const taper = y > 33 ? Math.floor((y - 33) * 0.5) : 0;
        for (let x = tL - 1 + taper; x <= tL + 14 - taper; x++) pixel(x, y);
      }

      // Legs
      for (let y = 33; y < 40; y++) {
        for (let dx = 0; dx < 4; dx++) { pixel(cx - 5 + dx, y); pixel(cx + 1 + dx, y); }
      }
      // Shoes
      for (let y = 40; y < 42; y++) {
        for (let dx = -1; dx < 4; dx++) pixel(cx - 5 + dx, y);
        for (let dx = 0; dx <= 4; dx++) pixel(cx + 1 + dx, y);
      }
    }

    // ========================================
    // 2. WALKING — mid-stride, legs split, arms swinging
    // ========================================
    {
      const cx = 51;
      const headCy = 11, headRx = 10, headRy = 10; // 1px higher (bob)

      drawToque(cx, 0);
      ellipse(cx, headCy, headRx, headRy);

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            pixel(cx - headRx + dx, headCy + 1 + dy);
            pixel(cx + headRx + dx, headCy + 1 + dy);
          }

      // Neck
      rect(cx - 2, 22, 5, 2);

      // Torso
      const tL = cx - 7;
      rect(tL, 24, 14, 8);
      clear(tL, 24); clear(tL + 13, 24);

      // Left arm forward (angled down-right)
      for (let i = 0; i < 8; i++) {
        const ax = tL - 3 + Math.round(i * 0.4);
        const ay = 25 + i;
        for (let dx = 0; dx < 3; dx++) pixel(ax + dx, ay);
      }

      // Right arm back (angled down-left)
      for (let i = 0; i < 8; i++) {
        const ax = tL + 14 - Math.round(i * 0.4);
        const ay = 25 + i;
        for (let dx = 0; dx < 3; dx++) pixel(ax + dx, ay);
      }

      // Apron
      for (let y = 26; y <= 35; y++) {
        const taper = y > 32 ? Math.floor((y - 32) * 0.5) : 0;
        for (let x = tL - 1 + taper; x <= tL + 14 - taper; x++) pixel(x, y);
      }

      // Left leg forward (extended ahead)
      for (let y = 32; y < 39; y++) {
        const stride = Math.round(3 * ((y - 32) / 7)); // progressive forward
        for (let dx = 0; dx < 4; dx++) pixel(cx - 5 + dx - stride, y);
      }
      // Right leg back (extended behind)
      for (let y = 32; y < 39; y++) {
        const stride = Math.round(3 * ((y - 32) / 7));
        for (let dx = 0; dx < 4; dx++) pixel(cx + 1 + dx + stride, y);
      }

      // Shoes — offset with legs
      for (let y = 39; y < 41; y++) {
        for (let dx = -1; dx < 4; dx++) pixel(cx - 5 + dx - 3, y);
        for (let dx = 0; dx <= 4; dx++) pixel(cx + 1 + dx + 3, y);
      }
    }

    // ========================================
    // 3. STIRRING — one arm extended holding spoon over pot
    // ========================================
    {
      const cx = 85;
      const headCy = 12, headRx = 10, headRy = 10;

      drawToque(cx, 0);
      ellipse(cx, headCy, headRx, headRy);

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            pixel(cx - headRx + dx, headCy + 1 + dy);
            pixel(cx + headRx + dx, headCy + 1 + dy);
          }

      // Neck
      rect(cx - 2, 23, 5, 2);

      // Torso — slightly turned (left shoulder forward)
      const tL = cx - 7;
      rect(tL, 25, 14, 8);
      clear(tL, 25); clear(tL + 13, 25);

      // Left arm — at side
      rect(tL - 3, 26, 3, 8);
      rect(tL - 3, 34, 3, 2);

      // Right arm — extended forward and angled down toward pot
      // Upper arm angled forward
      for (let i = 0; i < 5; i++) {
        const ax = tL + 14 + Math.round(i * 0.8);
        const ay = 26 + i;
        for (let dx = 0; dx < 3; dx++) pixel(ax + dx, ay);
      }
      // Forearm angled down into pot
      for (let i = 0; i < 4; i++) {
        const ax = tL + 18 + Math.round(i * 0.3);
        const ay = 31 + i;
        for (let dx = 0; dx < 3; dx++) pixel(ax + dx, ay);
      }

      // Spoon — long handle from hand into pot
      const spoonX = tL + 19;
      for (let y = 30; y <= 40; y++) pixel(spoonX, y);
      // Spoon bowl
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) pixel(spoonX + dx, 41 + dy);

      // Pot — wide cylinder below the stirring arm
      const potCx = spoonX, potTop = 38, potW = 8, potH = 6;
      for (let y = potTop; y < potTop + potH; y++) {
        const bulge = y > potTop + 1 ? 1 : 0;
        for (let x = potCx - potW / 2 - bulge; x <= potCx + potW / 2 + bulge; x++)
          pixel(x, y);
      }
      // Pot rim
      for (let x = potCx - potW / 2 - 1; x <= potCx + potW / 2 + 1; x++)
        pixel(x, potTop);
      // Pot handles
      pixel(potCx - potW / 2 - 2, potTop + 1);
      pixel(potCx - potW / 2 - 2, potTop + 2);
      pixel(potCx + potW / 2 + 2, potTop + 1);
      pixel(potCx + potW / 2 + 2, potTop + 2);

      // Apron
      for (let y = 27; y <= 36; y++) {
        const taper = y > 33 ? Math.floor((y - 33) * 0.5) : 0;
        for (let x = tL - 1 + taper; x <= tL + 14 - taper; x++) pixel(x, y);
      }

      // Legs — standing
      for (let y = 33; y < 40; y++) {
        for (let dx = 0; dx < 4; dx++) { pixel(cx - 5 + dx, y); pixel(cx + 1 + dx, y); }
      }
      // Shoes
      for (let y = 40; y < 42; y++) {
        for (let dx = -1; dx < 4; dx++) pixel(cx - 5 + dx, y);
        for (let dx = 0; dx <= 4; dx++) pixel(cx + 1 + dx, y);
      }
    }
  },
};
