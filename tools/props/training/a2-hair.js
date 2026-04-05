// A2: Hair as Identity — 5 hairstyles on the SAME base head
// Goal: Fill all 5 solid black → each silhouette is distinguishable
// Layout: 5 heads in a row, 16x16 each
module.exports = {
  width: 96,  // 5 × 16 + 4×4 gap
  height: 22, // 16 + extra for long hair
  style: 'pixel',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    skin: '#f0b878',
    skinShd: '#c08050',
    eye: '#222233',
    eyeWhite: '#eeeef4',
    mouth: '#884444',
    // 5 different hair colours to help differentiation
    hair1: '#cc4444',   // red - spiky
    hair1s: '#882222',
    hair2: '#332211',   // dark brown - long straight
    hair2s: '#1a0f08',
    hair3: '#ddaa33',   // blonde - ponytail
    hair3s: '#997722',
    hair4: '#222222',   // black - curly/afro
    hair4s: '#111111',
    hair5: '#8844aa',   // purple - bangs+bun
    hair5s: '#552266',
  },
  draw(pc, pal) { pc.setPixel(0, 0, 1); },
  drawPost(pc, pal) {
    pc.pixels[0] = 0;
    const g = pal.groups;
    function tone(group, f) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1, Math.round(f * (group.toneCount - 1))));
    }
    const lx = -0.6, ly = -0.7;

    function drawBaseHead(ox, oy) {
      // Consistent 12x13 oval head
      const cx = ox + 7, cy = oy + 8;
      const rx = 6, ry = 6.5;
      for (let y = oy; y < oy + 18; y++) {
        for (let x = ox; x < ox + 16; x++) {
          const nx = (x - cx) / rx, ny = (y - cy) / ry;
          const dist = nx * nx + ny * ny;
          if (dist <= 1.0) {
            const nz = Math.sqrt(Math.max(0, 1 - dist));
            const dot = nx * lx + ny * ly + nz * 0.5;
            const v = Math.max(0.2, Math.min(1, dot * 0.4 + 0.55));
            pc.setPixel(x, y, v > 0.4 ? tone(g.skin, v) : tone(g.skinShd, v + 0.3));
          }
        }
      }
      // Eyes — consistent across all
      const eyeY = cy - 1;
      const lx_ = cx - 3, rx_ = cx + 1;
      pc.setPixel(lx_, eyeY, tone(g.eyeWhite, 1.0));
      pc.setPixel(lx_ + 1, eyeY, tone(g.eyeWhite, 0.8));
      pc.setPixel(lx_, eyeY + 1, tone(g.eye, 0.3));
      pc.setPixel(lx_ + 1, eyeY + 1, tone(g.eye, 0.3));
      pc.setPixel(rx_, eyeY, tone(g.eyeWhite, 1.0));
      pc.setPixel(rx_ + 1, eyeY, tone(g.eyeWhite, 0.8));
      pc.setPixel(rx_, eyeY + 1, tone(g.eye, 0.3));
      pc.setPixel(rx_ + 1, eyeY + 1, tone(g.eye, 0.3));
      // Mouth — neutral
      pc.setPixel(cx - 1, cy + 3, tone(g.mouth, 0.4));
      pc.setPixel(cx, cy + 3, tone(g.mouth, 0.4));
    }

    function fillEllipse(cx, cy, rx, ry, colIdx) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const nx = (x - cx) / rx, ny = (y - cy) / ry;
          if (nx * nx + ny * ny <= 1.0) {
            pc.setPixel(x, y, colIdx);
          }
        }
      }
    }

    // === STYLE 1: Short spiky (red) ===
    {
      const ox = 2, oy = 3;
      const cx = ox + 7, cy = oy + 8;
      const h = g.hair1, hs = g.hair1s;
      // Hair base dome
      for (let y = oy - 1; y < oy + 7; y++) {
        for (let x = ox; x < ox + 16; x++) {
          const nx = (x - cx) / 7, ny = (y - (cy - 3)) / 5;
          if (nx * nx + ny * ny <= 1.0 && y < cy - 1) {
            const v = ((x - cx) * lx + (y - cy) * ly) * 0.04 + 0.6;
            pc.setPixel(x, y, tone(h, Math.max(0.2, Math.min(1, v))));
          }
        }
      }
      // Spikes: 4 spikes protruding upward
      const spikes = [
        { x: cx - 3, tipY: oy - 3 },
        { x: cx - 1, tipY: oy - 4 },
        { x: cx + 1, tipY: oy - 3 },
        { x: cx + 3, tipY: oy - 2 },
      ];
      for (const sp of spikes) {
        for (let sy = sp.tipY; sy < oy + 2; sy++) {
          const t = (sy - sp.tipY) / (oy + 2 - sp.tipY);
          const hw = Math.round(t * 1.5);
          for (let dx = -hw; dx <= hw; dx++) {
            pc.setPixel(sp.x + dx, sy, tone(sy === sp.tipY ? h : hs, 0.7));
          }
        }
      }
      drawBaseHead(ox, oy);
    }

    // === STYLE 2: Long straight (dark brown) ===
    {
      const ox = 22, oy = 3;
      const cx = ox + 7, cy = oy + 8;
      const h = g.hair2, hs = g.hair2s;
      // Hair dome on top
      for (let y = oy - 1; y < oy + 6; y++) {
        for (let x = ox; x < ox + 16; x++) {
          const nx = (x - cx) / 7, ny = (y - (cy - 3)) / 5;
          if (nx * nx + ny * ny <= 1.0 && y < cy) {
            pc.setPixel(x, y, tone(h, 0.5 + (cx - x) * 0.03));
          }
        }
      }
      // Long straight strands falling past chin on both sides
      for (let y = oy + 3; y < oy + 18; y++) {
        const t = (y - oy - 3) / 15;
        // Left strand
        pc.setPixel(ox + 1, y, tone(hs, 0.4));
        pc.setPixel(ox + 2, y, tone(h, 0.5 + t * 0.2));
        // Right strand
        pc.setPixel(ox + 13, y, tone(h, 0.5 + t * 0.1));
        pc.setPixel(ox + 14, y, tone(hs, 0.4));
      }
      // Highlight streak down middle of hair dome
      for (let y = oy; y < oy + 5; y++) {
        pc.setPixel(cx - 1, y, tone(h, 0.9));
      }
      drawBaseHead(ox, oy);
    }

    // === STYLE 3: Ponytail (blonde) ===
    {
      const ox = 42, oy = 3;
      const cx = ox + 7, cy = oy + 8;
      const h = g.hair3, hs = g.hair3s;
      // Hair dome
      for (let y = oy - 1; y < oy + 7; y++) {
        for (let x = ox; x < ox + 16; x++) {
          const nx = (x - cx) / 7, ny = (y - (cy - 3)) / 5;
          if (nx * nx + ny * ny <= 1.0 && y < cy - 1) {
            pc.setPixel(x, y, tone(h, 0.5 + (cx - x) * 0.02));
          }
        }
      }
      // Ponytail: extends from right side of head, going down-right
      const tailStartX = ox + 13, tailStartY = oy + 5;
      for (let i = 0; i < 12; i++) {
        const tx = tailStartX + Math.round(i * 0.3);
        const ty = tailStartY + i;
        pc.setPixel(tx, ty, tone(h, 0.6));
        pc.setPixel(tx + 1, ty, tone(hs, 0.5));
        if (i < 3) pc.setPixel(tx - 1, ty, tone(h, 0.7)); // thicker at top
      }
      // Hair tie
      pc.setPixel(tailStartX, tailStartY, tone(hs, 0.3));
      pc.setPixel(tailStartX + 1, tailStartY, tone(hs, 0.3));
      // Highlight
      pc.setPixel(cx, oy, tone(h, 1.0));
      pc.setPixel(cx, oy + 1, tone(h, 0.9));
      drawBaseHead(ox, oy);
    }

    // === STYLE 4: Curly/Afro (black) ===
    {
      const ox = 62, oy = 3;
      const cx = ox + 7, cy = oy + 8;
      const h = g.hair4, hs = g.hair4s;
      // Big round volume extending well beyond head
      const afroRx = 9, afroRy = 8;
      const afroCy = cy - 2;
      for (let y = oy - 5; y < oy + 10; y++) {
        for (let x = ox - 2; x < ox + 18; x++) {
          const nx = (x - cx) / afroRx, ny = (y - afroCy) / afroRy;
          const dist = nx * nx + ny * ny;
          if (dist <= 1.0 && y < cy) {
            // Curly texture: use noise-like variation
            const noise = Math.sin(x * 3.7 + y * 2.3) * 0.15;
            const v = 0.3 + noise + (1 - dist) * 0.3;
            pc.setPixel(x, y, tone(h, Math.max(0.1, Math.min(0.8, v))));
          }
        }
      }
      // Side volume going below ears
      for (let y = cy - 1; y < cy + 4; y++) {
        pc.setPixel(ox, y, tone(h, 0.3));
        pc.setPixel(ox + 1, y, tone(h, 0.4));
        pc.setPixel(ox + 14, y, tone(h, 0.4));
        pc.setPixel(ox + 15, y, tone(h, 0.3));
      }
      drawBaseHead(ox, oy);
    }

    // === STYLE 5: Bangs + Bun (purple) ===
    {
      const ox = 82, oy = 3;
      const cx = ox + 7, cy = oy + 8;
      const h = g.hair5, hs = g.hair5s;
      // Hair dome
      for (let y = oy - 1; y < oy + 6; y++) {
        for (let x = ox + 1; x < ox + 15; x++) {
          const nx = (x - cx) / 7, ny = (y - (cy - 3)) / 5;
          if (nx * nx + ny * ny <= 1.0 && y < cy - 1) {
            pc.setPixel(x, y, tone(h, 0.5 + (cx - x) * 0.02));
          }
        }
      }
      // Bangs: fringe above eyes, horizontal band
      const bangY = cy - 2;
      for (let x = ox + 3; x < ox + 13; x++) {
        pc.setPixel(x, bangY, tone(hs, 0.4));
        pc.setPixel(x, bangY - 1, tone(h, 0.6));
      }
      // Bun on top: small circle above head
      const bunCx = cx, bunCy = oy - 3;
      fillEllipse(bunCx, bunCy, 3, 3, tone(h, 0.5));
      // Bun highlight
      pc.setPixel(bunCx - 1, bunCy - 1, tone(h, 0.8));
      // Bun shadow base
      pc.setPixel(bunCx - 1, bunCy + 2, tone(hs, 0.3));
      pc.setPixel(bunCx, bunCy + 2, tone(hs, 0.3));
      pc.setPixel(bunCx + 1, bunCy + 2, tone(hs, 0.3));
      drawBaseHead(ox, oy);
    }
  },
};
