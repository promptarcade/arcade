// A5: Chef Character — applying ALL Phase 1-7 techniques
// Proper sphere lighting on head, cylinder lighting on torso/arms/legs
// Dual palette (warm lit / cool shadow), S-curve contrast, bounce light
// Specular highlights, edge-defined forms, full tonal range per part
module.exports = {
  width: 32,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    // DUAL PALETTE SKIN — warm lit, cool shadow
    skinW: '#f5c088', skinC: '#a07060',
    // DUAL PALETTE HAT — warm white, cool grey
    hatW: '#fffff0', hatC: '#aaa8b0',
    hatBand: '#cc3333', hatBandShd: '#882244',
    // DUAL PALETTE SHIRT — warm blue, cool navy
    shirtW: '#6699dd', shirtC: '#2a3d6a',
    // DUAL PALETTE APRON — warm cream, cool tan
    apronW: '#f5e8d0', apronC: '#998870',
    // DUAL PALETTE PANTS — warm grey, cool blue-grey
    pantsW: '#666670', pantsC: '#333344',
    // Shoes
    shoesW: '#553322', shoesC: '#221118',
    // Hair
    hairW: '#664433', hairC: '#2a1818',
    // Eyes
    iris: '#447755', pupil: '#112211', specW: '#ffffff',
    // Mouth
    mouthW: '#aa5555', mouthC: '#663344',
    // Outline (tinted dark)
    outln: '#221122',
  },
  draw(pc, pal) { pc.setPixel(0, 0, 1); },
  drawPost(pc, pal) {
    pc.pixels[0] = 0;
    const g = pal.groups;
    const W = 32, H = 48;
    function tone(gr, f) {
      return gr.startIdx + Math.max(0, Math.min(gr.toneCount - 1, Math.round(f * (gr.toneCount - 1))));
    }

    // Standard light direction (Phase 1)
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // DUAL PALETTE HELPER — warm above threshold, cool below (Phase 3)
    function dualTone(warmG, coolG, v) {
      if (v > 0.38) return tone(warmG, v);
      return tone(coolG, Math.max(0.04, v * 1.3));
    }

    // FULL LIGHTING MODEL — diffuse + specular + bounce + S-curve (Phase 1)
    function litValue(nx, ny, nz, specExp, specStr) {
      const NdotL = nx * lx + ny * ly + nz * lz;
      const diffuse = Math.max(0, NdotL);
      const reflect = 2 * NdotL * nz - lz;
      const specular = Math.pow(Math.max(0, reflect), specExp || 25) * (specStr || 0.15);
      const bounce = Math.max(0, ny * 0.3) * 0.12;
      let v = 0.04 + diffuse * 0.68 + specular + bounce;
      v = v * v * (3 - 2 * v); // S-CURVE
      return Math.max(0, Math.min(1, v));
    }

    // SPHERE (head, hat top)
    function fillSphere(cx, cy, rx, ry, warmG, coolG, specExp, specStr, yMin, yMax) {
      for (let y = Math.max(0, cy - ry); y <= Math.min(H - 1, cy + ry); y++) {
        if (yMin !== undefined && y < yMin) continue;
        if (yMax !== undefined && y > yMax) continue;
        for (let x = 0; x < W; x++) {
          const nx = (x - cx) / rx, ny = (y - cy) / ry;
          const d = nx * nx + ny * ny;
          if (d <= 1.0) {
            const nz = Math.sqrt(Math.max(0, 1 - d));
            const v = litValue(nx, ny, nz, specExp, specStr);
            pc.setPixel(x, y, dualTone(warmG, coolG, v));
          }
        }
      }
    }

    // CYLINDER (torso, arms, legs)
    function fillCylinder(cx, top, bot, halfWFunc, warmG, coolG, specExp, specStr) {
      for (let y = top; y <= bot; y++) {
        const hw = typeof halfWFunc === 'function' ? halfWFunc(y) : halfWFunc;
        for (let x = cx - hw; x <= cx + hw; x++) {
          const nx = (x - cx) / (hw + 1);
          const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
          const v = litValue(nx, 0, nz, specExp || 20, specStr || 0.1);
          pc.setPixel(x, y, dualTone(warmG, coolG, v));
        }
      }
    }

    const cx = 15;

    // ================================================================
    // CHEF TOQUE — single continuous profile, construction method
    // Profile: band at bottom (hw=7), straight sides going up (hw=8),
    // gently rounds at top. Taller than wide. One shape, not segments.
    // ================================================================
    function toqueProfile(t) { // t: 0=top, 1=band
      if (t < 0.15) return 5 + t * 20;   // rounded top (5→8)
      if (t < 0.85) return 8;             // straight sides — full width
      return 8 - (t - 0.85) * 10;         // taper into band (8→6.5)
    }
    const hatTop = 0, hatBot = 9;
    // Fill with cylinder lighting + vertical normal at top for rounding
    for (let y = hatTop; y <= hatBot; y++) {
      const t = (y - hatTop) / (hatBot - hatTop);
      const hw = Math.round(toqueProfile(t));
      for (let x = cx - hw; x <= cx + hw; x++) {
        const nx = (x - cx) / (hw + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const ny = t < 0.2 ? (0.2 - t) * 3 : 0; // top curves away = gets lit from above
        const v = litValue(nx, -Math.abs(ny), nz, 15, 0.08);
        pc.setPixel(x, y, dualTone(g.hatW, g.hatC, v));
      }
    }
    // Pleat lines — 2 subtle vertical shadows
    for (let y = 1; y <= 8; y++) {
      if (pc.pixels[y*W+(cx-2)]) pc.setPixel(cx - 2, y, tone(g.hatC, 0.28));
      if (pc.pixels[y*W+(cx+3)]) pc.setPixel(cx + 3, y, tone(g.hatC, 0.25));
    }
    // Highlight streak on lit side
    for (let y = 0; y <= 8; y++) {
      if (pc.pixels[y*W+(cx-5)]) pc.setPixel(cx - 5, y, tone(g.hatW, 0.98));
      if (pc.pixels[y*W+(cx-4)]) pc.setPixel(cx - 4, y, tone(g.hatW, 0.95));
    }
    // HEADBAND (red, y=10..11)
    fillCylinder(cx, 10, 11, 7, g.hatBand, g.hatBandShd, 35, 0.2);

    // ================================================================
    // HEAD — sphere-lit but with HIGH AMBIENT so face stays readable
    // At 32px, full sphere shadow obscures features. Keep face bright,
    // shadow only at extreme edges (last 2-3px). Features need a
    // clear, light canvas.
    // ================================================================
    const headCy = 16;
    for (let y = 12; y <= 22; y++) {
      for (let x = 0; x < W; x++) {
        const nx = (x-cx)/7, ny = (y-headCy)/6, d = nx*nx+ny*ny;
        if (d <= 1.0) {
          const nz = Math.sqrt(Math.max(0, 1-d));
          const NdL = nx*lx + ny*ly + nz*lz;
          const diff = Math.max(0, NdL);
          const spec = Math.pow(Math.max(0, 2*NdL*nz-lz), 30) * 0.1;
          const bounce = Math.max(0, ny*0.3) * 0.08;
          // HIGH AMBIENT (0.25) keeps face mostly bright
          // Shadow only kicks in at extreme edges where d > 0.7
          let v = 0.25 + diff * 0.50 + spec + bounce;
          v = Math.max(0, Math.min(1, v*v*(3-2*v)));
          pc.setPixel(x, y, dualTone(g.skinW, g.skinC, v));
        }
      }
    }

    // Hair peeking under hat — dark forms at sides
    for (let y = 12; y <= 15; y++) {
      pc.setPixel(cx - 8, y, tone(g.hairC, 0.15));
      pc.setPixel(cx - 7, y, tone(g.hairW, 0.35));
      pc.setPixel(cx + 7, y, tone(g.hairW, 0.3));
      pc.setPixel(cx + 8, y, tone(g.hairC, 0.1));
    }

    // ================================================================
    // EYES — iris-dominant 3x3, proper specular
    // ================================================================
    const eyeY = 16; // vertical centre of head (headCy=16)
    const lEx = cx - 5, rEx = cx + 2;
    // Left eye
    pc.setPixel(lEx,     eyeY,     tone(g.specW, 1.0));   // specular
    pc.setPixel(lEx + 1, eyeY,     tone(g.iris, 0.8));
    pc.setPixel(lEx + 2, eyeY,     tone(g.iris, 0.55));
    pc.setPixel(lEx,     eyeY + 1, tone(g.iris, 0.65));
    pc.setPixel(lEx + 1, eyeY + 1, tone(g.pupil, 0.05));  // pupil
    pc.setPixel(lEx + 2, eyeY + 1, tone(g.iris, 0.4));
    pc.setPixel(lEx,     eyeY + 2, tone(g.iris, 0.35));
    pc.setPixel(lEx + 1, eyeY + 2, tone(g.iris, 0.25));
    pc.setPixel(lEx + 2, eyeY + 2, tone(g.iris, 0.3));
    // Right eye
    pc.setPixel(rEx,     eyeY,     tone(g.iris, 0.55));
    pc.setPixel(rEx + 1, eyeY,     tone(g.iris, 0.8));
    pc.setPixel(rEx + 2, eyeY,     tone(g.specW, 1.0));
    pc.setPixel(rEx,     eyeY + 1, tone(g.iris, 0.4));
    pc.setPixel(rEx + 1, eyeY + 1, tone(g.pupil, 0.05));
    pc.setPixel(rEx + 2, eyeY + 1, tone(g.iris, 0.65));
    pc.setPixel(rEx,     eyeY + 2, tone(g.iris, 0.3));
    pc.setPixel(rEx + 1, eyeY + 2, tone(g.iris, 0.25));
    pc.setPixel(rEx + 2, eyeY + 2, tone(g.iris, 0.35));

    // Nose — shadow + highlight
    pc.setPixel(cx, 19, tone(g.skinC, 0.25));
    pc.setPixel(cx, 18, tone(g.skinW, 0.72));

    // Mouth — friendly smile
    pc.setPixel(cx - 2, 20, tone(g.mouthW, 0.55));
    pc.setPixel(cx - 1, 21, tone(g.mouthW, 0.5));
    pc.setPixel(cx,     21, tone(g.mouthC, 0.25));
    pc.setPixel(cx + 1, 21, tone(g.mouthW, 0.5));
    pc.setPixel(cx + 2, 20, tone(g.mouthW, 0.55));

    // ================================================================
    // NECK — cylinder in shadow (head casts shadow on it)
    // ================================================================
    for (let y = 23; y <= 24; y++) {
      for (let x = cx - 2; x <= cx + 1; x++) {
        pc.setPixel(x, y, tone(g.skinC, 0.2)); // deep shadow — occlusion
      }
    }

    // ================================================================
    // TORSO — cylinder-lit, shaped profile
    // Shirt on sides, apron centre
    // ================================================================
    const torsoTop = 25, torsoBot = 35;
    function torsoHW(y) {
      const row = y - torsoTop;
      if (row <= 2) return 5 + row;    // shoulder ramp
      if (row <= 7) return 7;           // full chest
      return 7 - Math.round((row - 7) * 0.4); // waist taper
    }
    // Fill with shirt lighting first
    fillCylinder(cx, torsoTop, torsoBot, torsoHW, g.shirtW, g.shirtC, 20, 0.1);
    // Overwrite centre with apron (different material — slightly shinier)
    for (let y = torsoTop; y <= torsoBot; y++) {
      for (let x = cx - 3; x <= cx + 3; x++) {
        const hw = torsoHW(y);
        const nx = (x - cx) / (hw + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const v = litValue(nx, 0, nz, 25, 0.12);
        pc.setPixel(x, y, dualTone(g.apronW, g.apronC, v));
      }
    }
    // Collar — skin visible, occlusion shadow at shirt edge
    pc.setPixel(cx - 1, torsoTop, tone(g.skinC, 0.25));
    pc.setPixel(cx, torsoTop, tone(g.skinC, 0.3));
    pc.setPixel(cx + 1, torsoTop, tone(g.skinC, 0.25));
    // Apron edge contrast — bright ridge at apron boundary
    for (let y = torsoTop + 2; y <= torsoBot; y++) {
      pc.setPixel(cx - 4, y, tone(g.apronC, 0.2));  // dark edge
      pc.setPixel(cx + 4, y, tone(g.apronC, 0.15));
    }

    // ================================================================
    // ARMS — cylinders, 3px wide, properly lit
    // ================================================================
    // Left arm (lit side)
    for (let y = 26; y <= 34; y++) {
      for (let dx = 0; dx < 3; dx++) {
        const x = cx - 10 + dx;
        const nx = (dx - 1) / 2; // -0.5 to 0.5
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const v = litValue(nx, 0, nz, 20, 0.1);
        pc.setPixel(x, y, dualTone(g.shirtW, g.shirtC, v));
      }
    }
    // Left hand
    for (let y = 35; y <= 37; y++) {
      for (let dx = 0; dx < 4; dx++) {
        const x = cx - 11 + dx;
        const nx = (dx - 1.5) / 2.5;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const v = litValue(nx, 0, nz, 25, 0.1);
        pc.setPixel(x, y, dualTone(g.skinW, g.skinC, v));
      }
    }
    // Right arm (shadow side)
    for (let y = 26; y <= 34; y++) {
      for (let dx = 0; dx < 3; dx++) {
        const x = cx + 8 + dx;
        const nx = (dx - 1) / 2;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const v = litValue(nx, 0, nz, 20, 0.1);
        pc.setPixel(x, y, dualTone(g.shirtW, g.shirtC, v));
      }
    }
    // Right hand
    for (let y = 35; y <= 37; y++) {
      for (let dx = 0; dx < 4; dx++) {
        const x = cx + 7 + dx;
        const nx = (dx - 1.5) / 2.5;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const v = litValue(nx, 0, nz, 25, 0.1);
        pc.setPixel(x, y, dualTone(g.skinW, g.skinC, v));
      }
    }

    // ================================================================
    // LEGS — cylinders, dual palette
    // ================================================================
    for (let y = 36; y <= 42; y++) {
      // Left leg
      for (let x = cx - 5; x <= cx - 1; x++) {
        const nx = (x - (cx - 3)) / 3;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const v = litValue(nx, 0, nz, 15, 0.05);
        pc.setPixel(x, y, dualTone(g.pantsW, g.pantsC, v));
      }
      // Right leg
      for (let x = cx + 1; x <= cx + 5; x++) {
        const nx = (x - (cx + 3)) / 3;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const v = litValue(nx, 0, nz, 15, 0.05);
        pc.setPixel(x, y, dualTone(g.pantsW, g.pantsC, v));
      }
    }
    // Crotch occlusion shadow
    pc.setPixel(cx, 36, tone(g.pantsC, 0.02));
    pc.setPixel(cx, 37, tone(g.pantsC, 0.05));

    // ================================================================
    // SHOES — matte leather
    // ================================================================
    for (let y = 43; y <= 46; y++) {
      for (let x = cx - 6; x <= cx - 1; x++) {
        const nx = (x - (cx - 3.5)) / 4;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const v = litValue(nx, 0, nz, 20, 0.08);
        pc.setPixel(x, y, dualTone(g.shoesW, g.shoesC, v));
      }
      for (let x = cx + 1; x <= cx + 6; x++) {
        const nx = (x - (cx + 3.5)) / 4;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const v = litValue(nx, 0, nz, 20, 0.08);
        pc.setPixel(x, y, dualTone(g.shoesW, g.shoesC, v));
      }
    }

    // ================================================================
    // TINTED OUTLINE — darkest shade of nearest neighbour
    // ================================================================
    const pts = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (pc.pixels[y * W + x] === 0) {
          for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H && pc.pixels[ny * W + nx] !== 0) {
              pts.push([x, y]); break;
            }
          }
        }
      }
    }
    for (const [x, y] of pts) pc.setPixel(x, y, tone(g.outln, 0.08));
  },
};
