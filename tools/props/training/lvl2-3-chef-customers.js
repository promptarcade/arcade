// Level 2.3: Chef + Three Customers — FLAT BLACK FILL ONLY
// Test: can you identify chef vs customers from silhouette alone?
// Characters: chef (toque + apron), business person (broad + briefcase),
//             kid (small + backpack), elderly (hunched + cane)
// Layout: 4 characters side by side (136 × 50)
module.exports = {
  width: 136,
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
    const TW = 136, TH = 50;

    // Shared helper: standard chibi body (same as lvl2-1)
    function drawBody(cx, opts = {}) {
      const scale = opts.scale || 1.0;
      const headRx = Math.round(10 * scale), headRy = Math.round(10 * scale);
      const headCy = opts.headCy || 12;
      const hunchDx = opts.hunchDx || 0; // horizontal shift for hunched posture

      // Head ellipse
      for (let y = headCy - headRy; y <= headCy + headRy; y++)
        for (let x = cx + hunchDx - headRx; x <= cx + hunchDx + headRx; x++)
          if (x >= 0 && x < TW && ((x - cx - hunchDx) / headRx) ** 2 + ((y - headCy) / headRy) ** 2 <= 1)
            pc.setPixel(x, y, F);

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            const lx = cx + hunchDx - headRx + dx, rx = cx + hunchDx + headRx + dx;
            if (lx >= 0 && lx < TW) pc.setPixel(lx, headCy + 1 + dy, F);
            if (rx >= 0 && rx < TW) pc.setPixel(rx, headCy + 1 + dy, F);
          }

      // Neck
      const neckTop = headCy + headRy + 1;
      for (let y = neckTop; y <= neckTop + 1; y++)
        for (let x = cx - 2; x <= cx + 2; x++)
          if (x >= 0 && x < TW) pc.setPixel(x, y, F);

      // Torso
      const torsoW = Math.round(14 * scale), torsoH = Math.round(8 * scale);
      const torsoLeft = cx - Math.floor(torsoW / 2);
      const torsoTop = neckTop + 2;
      for (let y = torsoTop; y < torsoTop + torsoH; y++)
        for (let x = torsoLeft; x < torsoLeft + torsoW; x++)
          if (x >= 0 && x < TW) pc.setPixel(x, y, F);
      // Round shoulders
      if (torsoLeft >= 0) pc.setPixel(torsoLeft, torsoTop, 0);
      if (torsoLeft + torsoW - 1 < TW) pc.setPixel(torsoLeft + torsoW - 1, torsoTop, 0);

      // Arms
      const armTop = torsoTop + 1;
      const armH = Math.round(7 * scale);
      for (let y = armTop; y < armTop + armH; y++) {
        for (let dx = 0; dx < 3; dx++) {
          if (torsoLeft - 3 + dx >= 0) pc.setPixel(torsoLeft - 3 + dx, y, F);
          if (torsoLeft + torsoW + dx < TW) pc.setPixel(torsoLeft + torsoW + dx, y, F);
        }
      }
      // Hands
      for (let y = armTop + armH; y < armTop + armH + 2; y++) {
        for (let dx = 0; dx < 3; dx++) {
          if (torsoLeft - 3 + dx >= 0) pc.setPixel(torsoLeft - 3 + dx, y, F);
          if (torsoLeft + torsoW + dx < TW) pc.setPixel(torsoLeft + torsoW + dx, y, F);
        }
      }

      // Legs
      const legY = torsoTop + torsoH;
      const legW = Math.round(4 * scale), legH = Math.round(7 * scale);
      for (let y = legY; y < legY + legH; y++) {
        for (let dx = 0; dx < legW; dx++) {
          pc.setPixel(cx - 1 - legW + dx, y, F);
          pc.setPixel(cx + 1 + dx, y, F);
        }
      }

      // Shoes
      for (let y = legY + legH; y < legY + legH + 2; y++) {
        for (let dx = -1; dx < legW; dx++) pc.setPixel(cx - 1 - legW + dx, y, F);
        for (let dx = 0; dx <= legW; dx++) pc.setPixel(cx + 1 + dx, y, F);
      }

      return { torsoLeft, torsoW, torsoTop, torsoH, armTop, armH, legY, legH, legW, neckTop, headCy, headRx, headRy };
    }

    // ========================================
    // 1. CHEF — tall toque hat + apron
    // ========================================
    {
      const cx = 17;
      // Tall toque (chef hat) — wide cylinder rising above head
      // Toque base band
      for (let x = cx - 8; x <= cx + 8; x++)
        if (x >= 0 && x < TW) pc.setPixel(x, 2, F);
      // Toque puff — wide rounded top
      for (let y = -4; y <= 1; y++) {
        const t = (y + 4) / 5;
        const hw = Math.round(5 + Math.sin(t * Math.PI) * 3);
        for (let x = cx - hw; x <= cx + hw; x++)
          if (x >= 0 && x < TW && y >= 0) pc.setPixel(x, y, F);
      }
      // Toque body — tall rectangle
      for (let y = 0; y <= 2; y++)
        for (let x = cx - 6; x <= cx + 6; x++)
          if (x >= 0 && x < TW) pc.setPixel(x, y, F);

      const parts = drawBody(cx);

      // Apron — wider than torso, extends below
      const apronLeft = parts.torsoLeft - 1;
      const apronRight = parts.torsoLeft + parts.torsoW;
      const apronTop = parts.torsoTop + 2;
      const apronBottom = parts.legY + 4;
      for (let y = apronTop; y <= apronBottom; y++) {
        // Taper at bottom
        const taper = y > parts.legY ? Math.floor((y - parts.legY) * 0.3) : 0;
        for (let x = apronLeft + taper; x <= apronRight - taper; x++)
          if (x >= 0 && x < TW) pc.setPixel(x, y, F);
      }
      // Apron straps (neck to torso)
      for (let y = parts.neckTop; y <= apronTop; y++) {
        if (cx - 4 >= 0) pc.setPixel(cx - 4, y, F);
        if (cx + 4 < TW) pc.setPixel(cx + 4, y, F);
      }
    }

    // ========================================
    // 2. BUSINESS PERSON — broad shoulders, briefcase
    // ========================================
    {
      const cx = 51;
      // Slightly bigger hair dome on top
      for (let y = 1; y <= 6; y++) {
        const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y - 12) / 10) ** 2)) * 10);
        for (let x = cx - headHW; x <= cx + headHW; x++)
          if (x >= 0 && x < TW) pc.setPixel(x, y, F);
      }

      const parts = drawBody(cx);

      // Wider shoulders — extend torso sides
      for (let y = parts.torsoTop; y <= parts.torsoTop + 2; y++) {
        for (let dx = 0; dx < 2; dx++) {
          if (parts.torsoLeft - 4 + dx >= 0) pc.setPixel(parts.torsoLeft - 4 + dx, y, F);
          if (parts.torsoLeft + parts.torsoW + 1 + dx < TW) pc.setPixel(parts.torsoLeft + parts.torsoW + 1 + dx, y, F);
        }
      }

      // Briefcase — rectangle hanging from right hand
      const bcLeft = parts.torsoLeft + parts.torsoW + 3;
      const bcTop = parts.armTop + parts.armH;
      const bcW = 6, bcH = 5;
      for (let y = bcTop; y < bcTop + bcH; y++)
        for (let x = bcLeft; x < bcLeft + bcW; x++)
          if (x >= 0 && x < TW && y < TH) pc.setPixel(x, y, F);
      // Handle
      if (bcLeft + 2 >= 0 && bcLeft + 3 < TW && bcTop - 1 >= 0) {
        pc.setPixel(bcLeft + 2, bcTop - 1, F);
        pc.setPixel(bcLeft + 3, bcTop - 1, F);
      }
    }

    // ========================================
    // 3. KID — smaller scale, backpack
    // ========================================
    {
      const cx = 85;
      // Smaller body — scale 0.75
      const headCy = 16; // lower on canvas (shorter character)
      const headRx = 8, headRy = 8;

      // Head
      for (let y = headCy - headRy; y <= headCy + headRy; y++)
        for (let x = cx - headRx; x <= cx + headRx; x++)
          if (x >= 0 && x < TW && ((x - cx) / headRx) ** 2 + ((y - headCy) / headRy) ** 2 <= 1)
            pc.setPixel(x, y, F);

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            if (cx - headRx + dx >= 0) pc.setPixel(cx - headRx + dx, headCy + 1 + dy, F);
            if (cx + headRx + dx < TW) pc.setPixel(cx + headRx + dx, headCy + 1 + dy, F);
          }

      // Spiky kid hair
      const spikes = [
        { x: cx - 4, w: 3, top: headCy - headRy - 3 },
        { x: cx - 1, w: 3, top: headCy - headRy - 4 },
        { x: cx + 2, w: 3, top: headCy - headRy - 2 },
      ];
      for (const sp of spikes) {
        for (let y = Math.max(0, sp.top); y <= headCy - headRy; y++) {
          const t = (y - sp.top) / (headCy - headRy - sp.top + 1);
          const w = Math.max(1, Math.round(sp.w * t));
          const startX = sp.x + Math.floor((sp.w - w) / 2);
          for (let dx = 0; dx < w; dx++)
            if (startX + dx >= 0 && startX + dx < TW) pc.setPixel(startX + dx, y, F);
        }
      }

      // Neck
      const neckTop = headCy + headRy + 1;
      for (let y = neckTop; y <= neckTop + 1; y++)
        for (let x = cx - 2; x <= cx + 2; x++)
          if (x >= 0 && x < TW) pc.setPixel(x, y, F);

      // Small torso
      const torsoW = 10, torsoH = 6;
      const torsoLeft = cx - Math.floor(torsoW / 2);
      const torsoTop = neckTop + 2;
      for (let y = torsoTop; y < torsoTop + torsoH; y++)
        for (let x = torsoLeft; x < torsoLeft + torsoW; x++)
          if (x >= 0 && x < TW) pc.setPixel(x, y, F);
      pc.setPixel(torsoLeft, torsoTop, 0);
      pc.setPixel(torsoLeft + torsoW - 1, torsoTop, 0);

      // Arms
      for (let y = torsoTop + 1; y < torsoTop + 6; y++) {
        for (let dx = 0; dx < 2; dx++) {
          if (torsoLeft - 2 + dx >= 0) pc.setPixel(torsoLeft - 2 + dx, y, F);
          if (torsoLeft + torsoW + dx < TW) pc.setPixel(torsoLeft + torsoW + dx, y, F);
        }
      }
      // Hands
      for (let y = torsoTop + 6; y < torsoTop + 8; y++) {
        for (let dx = 0; dx < 2; dx++) {
          if (torsoLeft - 2 + dx >= 0) pc.setPixel(torsoLeft - 2 + dx, y, F);
          if (torsoLeft + torsoW + dx < TW) pc.setPixel(torsoLeft + torsoW + dx, y, F);
        }
      }

      // Legs
      const legY = torsoTop + torsoH;
      for (let y = legY; y < legY + 5; y++) {
        for (let dx = 0; dx < 3; dx++) {
          pc.setPixel(cx - 1 - 3 + dx, y, F);
          pc.setPixel(cx + 1 + dx, y, F);
        }
      }
      // Shoes
      for (let y = legY + 5; y < legY + 7; y++) {
        for (let dx = -1; dx < 3; dx++) pc.setPixel(cx - 1 - 3 + dx, y, F);
        for (let dx = 0; dx <= 3; dx++) pc.setPixel(cx + 1 + dx, y, F);
      }

      // Backpack — rounded rectangle on back (right side = behind character)
      const bpLeft = cx + headRx - 2;
      const bpTop = neckTop;
      const bpW = 7, bpH = 10;
      for (let y = bpTop; y < bpTop + bpH; y++)
        for (let x = bpLeft; x < bpLeft + bpW; x++)
          if (x >= 0 && x < TW) pc.setPixel(x, y, F);
      // Round corners
      pc.setPixel(bpLeft, bpTop, 0);
      pc.setPixel(bpLeft + bpW - 1, bpTop, 0);
      pc.setPixel(bpLeft, bpTop + bpH - 1, 0);
      pc.setPixel(bpLeft + bpW - 1, bpTop + bpH - 1, 0);
    }

    // ========================================
    // 4. ELDERLY PERSON — hunched, cane
    // ========================================
    {
      const cx = 119;
      // Slightly hunched forward — head shifted left
      const hunchDx = -3;
      const headCy = 14, headRx = 9, headRy = 9;

      // Head (shifted forward)
      for (let y = headCy - headRy; y <= headCy + headRy; y++)
        for (let x = cx + hunchDx - headRx; x <= cx + hunchDx + headRx; x++)
          if (x >= 0 && x < TW && ((x - cx - hunchDx) / headRx) ** 2 + ((y - headCy) / headRy) ** 2 <= 1)
            pc.setPixel(x, y, F);

      // Ears
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dy * dy <= 1) {
            const lx = cx + hunchDx - headRx + dx, rx = cx + hunchDx + headRx + dx;
            if (lx >= 0 && lx < TW) pc.setPixel(lx, headCy + 1 + dy, F);
            if (rx >= 0 && rx < TW) pc.setPixel(rx, headCy + 1 + dy, F);
          }

      // Bun/hat on top
      for (let y = headCy - headRy - 2; y <= headCy - headRy + 1; y++) {
        const r = 4 - Math.abs(y - (headCy - headRy));
        for (let x = cx + hunchDx - r; x <= cx + hunchDx + r; x++)
          if (x >= 0 && x < TW && y >= 0) pc.setPixel(x, y, F);
      }

      // Neck (angled — connecting hunched head to upright body)
      const neckTop = headCy + headRy + 1;
      for (let y = neckTop; y <= neckTop + 1; y++) {
        const shift = Math.round(hunchDx * (1 - (y - neckTop) / 2));
        for (let x = cx + shift - 2; x <= cx + shift + 2; x++)
          if (x >= 0 && x < TW) pc.setPixel(x, y, F);
      }

      // Torso (upright position at cx)
      const torsoW = 12, torsoH = 7;
      const torsoLeft = cx - Math.floor(torsoW / 2);
      const torsoTop = neckTop + 2;
      for (let y = torsoTop; y < torsoTop + torsoH; y++)
        for (let x = torsoLeft; x < torsoLeft + torsoW; x++)
          if (x >= 0 && x < TW) pc.setPixel(x, y, F);
      pc.setPixel(torsoLeft, torsoTop, 0);
      pc.setPixel(torsoLeft + torsoW - 1, torsoTop, 0);

      // Arms (shorter)
      for (let y = torsoTop + 1; y < torsoTop + 6; y++) {
        for (let dx = 0; dx < 3; dx++) {
          if (torsoLeft - 3 + dx >= 0) pc.setPixel(torsoLeft - 3 + dx, y, F);
          if (torsoLeft + torsoW + dx < TW) pc.setPixel(torsoLeft + torsoW + dx, y, F);
        }
      }
      // Hands
      for (let y = torsoTop + 6; y < torsoTop + 8; y++) {
        for (let dx = 0; dx < 3; dx++) {
          if (torsoLeft - 3 + dx >= 0) pc.setPixel(torsoLeft - 3 + dx, y, F);
        }
      }

      // Legs (slightly shorter)
      const legY = torsoTop + torsoH;
      for (let y = legY; y < legY + 6; y++) {
        for (let dx = 0; dx < 3; dx++) {
          pc.setPixel(cx - 1 - 3 + dx, y, F);
          pc.setPixel(cx + 1 + dx, y, F);
        }
      }
      // Shoes
      for (let y = legY + 6; y < legY + 8; y++) {
        for (let dx = -1; dx < 3; dx++) pc.setPixel(cx - 1 - 3 + dx, y, F);
        for (let dx = 0; dx <= 3; dx++) pc.setPixel(cx + 1 + dx, y, F);
      }

      // Walking cane — thin vertical line with curved handle
      const caneX = torsoLeft + torsoW + 3;
      const caneTop = torsoTop + 4;
      const caneBottom = legY + 7;
      // Vertical shaft
      for (let y = caneTop; y <= caneBottom; y++)
        if (caneX >= 0 && caneX < TW && y < TH) pc.setPixel(caneX, y, F);
      // Curved handle at top
      if (caneX - 1 >= 0) pc.setPixel(caneX - 1, caneTop, F);
      if (caneX - 2 >= 0) pc.setPixel(caneX - 2, caneTop, F);
      if (caneX - 2 >= 0) pc.setPixel(caneX - 2, caneTop + 1, F);
    }
  },
};
