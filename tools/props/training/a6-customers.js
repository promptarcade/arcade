// A6: Three Soup Shop Customers (REDO with v2 techniques)
// Each: iris-dominant eyes, shaped torso, distinct silhouette
// Customer 1: Woman, red bob, yellow top, medium build
// Customer 2: Older man, grey hair, green polo, wider build, darker skin
// Customer 3: Kid, blue spiky hair, orange hoodie, shorter, lighter skin
module.exports = {
  width: 104,
  height: 52,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    // Skin tones (3 distinct)
    skin1: '#f0b878', skin1Shd: '#c08050',
    skin2: '#c48858', skin2Shd: '#8e5e38',
    skin3: '#f5d0a0', skin3Shd: '#c8a070',
    // Eyes — each character gets different iris colour
    iris1: '#557744', pupil1: '#223311',  // green
    iris2: '#665544', pupil2: '#332211',  // brown
    iris3: '#4466aa', pupil3: '#112244',  // blue
    eyeWhite: '#eeeef4', specular: '#ffffff',
    mouth: '#884444', mouthShd: '#663333',
    outln: '#332222',
    // C1: Woman — red bob, yellow top
    c1hair: '#cc3322', c1hairShd: '#881a11', c1hairHi: '#ee5544',
    c1shirt: '#ddaa33', c1shirtShd: '#aa8822',
    c1pants: '#556677', c1pantsShd: '#334455',
    c1shoes: '#664433', c1shoesShd: '#442211',
    // C2: Older man — grey hair, green polo, wider
    c2hair: '#999999', c2hairShd: '#666666', c2hairHi: '#bbbbbb',
    c2shirt: '#448855', c2shirtShd: '#336644',
    c2pants: '#665544', c2pantsShd: '#443322',
    c2shoes: '#443333', c2shoesShd: '#221111',
    // C3: Kid — blue spiky, orange hoodie
    c3hair: '#3366bb', c3hairShd: '#224488', c3hairHi: '#5588dd',
    c3shirt: '#dd6633', c3shirtShd: '#bb4422',
    c3pants: '#555566', c3pantsShd: '#333344',
    c3shoes: '#cc3344', c3shoesShd: '#992233',
  },
  draw(pc, pal) { pc.setPixel(0, 0, 1); },
  drawPost(pc, pal) {
    pc.pixels[0] = 0;
    const g = pal.groups;
    const TW = 104;
    function t(gr, f) {
      return gr.startIdx + Math.max(0, Math.min(gr.toneCount - 1, Math.round(f * (gr.toneCount - 1))));
    }

    function drawSphere(cx, cy, rx, ry, skinG, skinSG) {
      for (let y = cy - ry; y <= cy + ry; y++) {
        for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
          const nx = (x - cx) / rx, ny = (y - cy) / ry;
          const d = nx * nx + ny * ny;
          if (d <= 1.0) {
            const nz = Math.sqrt(Math.max(0, 1 - d));
            let v = nx * -0.5 + ny * -0.6 + nz * 0.6;
            v = Math.max(0.1, Math.min(1, v * 0.4 + 0.5));
            v = v * v * (3 - 2 * v);
            pc.setPixel(x, y, v > 0.35 ? t(skinG, v) : t(skinSG, Math.min(1, v + 0.3)));
          }
        }
      }
    }

    function drawEyes3x3(cx, eyeY, irisG, pupilG) {
      const lEx = cx - 5, rEx = cx + 2;
      // Left eye
      pc.setPixel(lEx,     eyeY,     t(g.specular, 1.0));
      pc.setPixel(lEx + 1, eyeY,     t(irisG, 0.7));
      pc.setPixel(lEx + 2, eyeY,     t(irisG, 0.5));
      pc.setPixel(lEx,     eyeY + 1, t(irisG, 0.6));
      pc.setPixel(lEx + 1, eyeY + 1, t(pupilG, 0.1));
      pc.setPixel(lEx + 2, eyeY + 1, t(irisG, 0.4));
      pc.setPixel(lEx,     eyeY + 2, t(irisG, 0.4));
      pc.setPixel(lEx + 1, eyeY + 2, t(irisG, 0.3));
      pc.setPixel(lEx + 2, eyeY + 2, t(irisG, 0.35));
      // Right eye
      pc.setPixel(rEx,     eyeY,     t(irisG, 0.5));
      pc.setPixel(rEx + 1, eyeY,     t(irisG, 0.7));
      pc.setPixel(rEx + 2, eyeY,     t(g.specular, 1.0));
      pc.setPixel(rEx,     eyeY + 1, t(irisG, 0.4));
      pc.setPixel(rEx + 1, eyeY + 1, t(pupilG, 0.1));
      pc.setPixel(rEx + 2, eyeY + 1, t(irisG, 0.6));
      pc.setPixel(rEx,     eyeY + 2, t(irisG, 0.35));
      pc.setPixel(rEx + 1, eyeY + 2, t(irisG, 0.3));
      pc.setPixel(rEx + 2, eyeY + 2, t(irisG, 0.4));
    }

    function drawTorsoShaped(cx, top, bot, maxHW, shG, shSG) {
      for (let y = top; y <= bot; y++) {
        const row = y - top;
        const len = bot - top;
        let hw;
        if (row <= 2) hw = maxHW - 2 + row; // shoulder ramp
        else if (row <= len - 3) hw = maxHW; // full width
        else hw = maxHW - Math.round((row - (len - 3)) * 0.5); // waist taper
        for (let x = cx - hw; x <= cx + hw; x++) {
          const nx = (x - cx) / (hw + 1);
          const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx * 0.7));
          let v = nx * -0.5 + nz * 0.55;
          v = Math.max(0.15, Math.min(1, v * 0.35 + 0.5));
          pc.setPixel(x, y, v > 0.35 ? t(shG, v) : t(shSG, v + 0.25));
        }
      }
    }

    function drawArms3px(cx, top, len, bodyHW, shG, shSG, skinG, skinSG) {
      for (let y = top; y < top + len; y++) {
        const isHand = y >= top + len - 3;
        const lg = isHand ? skinG : shG;
        const lsg = isHand ? skinSG : shSG;
        // Left arm
        pc.setPixel(cx - bodyHW - 1, y, t(lg, 0.55));
        pc.setPixel(cx - bodyHW - 2, y, t(lg, 0.5));
        pc.setPixel(cx - bodyHW - 3, y, t(lg, 0.45));
        // Right arm
        pc.setPixel(cx + bodyHW, y, t(lsg, 0.4));
        pc.setPixel(cx + bodyHW + 1, y, t(lsg, 0.35));
        pc.setPixel(cx + bodyHW + 2, y, t(lsg, 0.3));
      }
    }

    function drawLegs(cx, top, bot, pantsG, pantsSG) {
      for (let y = top; y <= bot; y++) {
        for (let x = cx - 5; x <= cx - 1; x++) {
          const v = Math.max(0.2, (x - (cx - 3)) / 3 * 0.4 + 0.5);
          pc.setPixel(x, y, v > 0.4 ? t(pantsG, v) : t(pantsSG, v + 0.2));
        }
        for (let x = cx + 1; x <= cx + 5; x++) {
          const v = Math.max(0.2, (x - (cx + 3)) / 3 * 0.4 + 0.45);
          pc.setPixel(x, y, v > 0.4 ? t(pantsG, v) : t(pantsSG, v + 0.2));
        }
      }
      pc.setPixel(cx, top, t(pantsSG, 0.15));
    }

    function drawShoes(cx, top, bot, shoeG) {
      for (let y = top; y <= bot; y++) {
        for (let x = cx - 6; x <= cx - 1; x++) pc.setPixel(x, y, t(shoeG, y === top ? 0.55 : 0.4));
        for (let x = cx + 1; x <= cx + 6; x++) pc.setPixel(x, y, t(shoeG, y === top ? 0.45 : 0.35));
      }
    }

    function addOutline(ox, w) {
      const pts = [];
      for (let y = 0; y < 52; y++) {
        for (let x = ox; x < ox + w; x++) {
          if (x >= 0 && x < TW && pc.pixels[y * TW + x] === 0) {
            for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
              const nx = x + dx, ny = y + dy;
              if (nx >= ox && nx < ox + w && ny >= 0 && ny < 52 && pc.pixels[ny * TW + nx] !== 0) {
                pts.push([x, y]); break;
              }
            }
          }
        }
      }
      for (const [x, y] of pts) pc.setPixel(x, y, t(g.outln, 0.15));
    }

    // =============================================================
    // CUSTOMER 1: Woman — red bob, yellow top, green eyes
    // Silhouette feature: bob hair frames face, curving inward at chin
    // =============================================================
    {
      const cx = 16, by = 3;
      const headCy = by + 7, headRx = 7, headRy = 6;

      // Hair dome (covers top 60% of head + extends above)
      for (let y = by - 2; y <= by + 6; y++) {
        for (let x = cx - 9; x <= cx + 9; x++) {
          const nx = (x - cx) / 9, ny = (y - (by + 2)) / 6;
          if (nx * nx + ny * ny <= 1.0) {
            let v = nx * -0.5 + ny * -0.6 + Math.sqrt(Math.max(0, 1 - nx*nx - ny*ny)) * 0.5;
            v = Math.max(0.15, Math.min(1, v * 0.35 + 0.5));
            pc.setPixel(x, y, v > 0.4 ? t(g.c1hair, v) : t(g.c1hairShd, v + 0.2));
          }
        }
      }
      // Bob sides — curves INWARD at chin level (distinctive shape)
      for (let y = by + 5; y <= by + 14; y++) {
        const yT = (y - by - 5) / 9;
        const hw = Math.round(8 - yT * yT * 5); // curves inward
        if (hw > 0) {
          pc.setPixel(cx - hw, y, t(g.c1hair, 0.45));
          pc.setPixel(cx - hw - 1, y, t(g.c1hairShd, 0.3));
          pc.setPixel(cx + hw, y, t(g.c1hair, 0.4));
          pc.setPixel(cx + hw + 1, y, t(g.c1hairShd, 0.25));
        }
      }
      // Hair highlight
      pc.setPixel(cx - 3, by - 1, t(g.c1hairHi, 0.9));
      pc.setPixel(cx - 2, by - 1, t(g.c1hairHi, 0.85));

      drawSphere(cx, headCy, headRx, headRy, g.skin1, g.skin1Shd);
      drawEyes3x3(cx, headCy, g.iris1, g.pupil1);
      // Nose
      pc.setPixel(cx, headCy + 3, t(g.skin1Shd, 0.4));
      // Smile
      pc.setPixel(cx - 1, headCy + 4, t(g.mouth, 0.5));
      pc.setPixel(cx, headCy + 4, t(g.mouthShd, 0.3));
      pc.setPixel(cx + 1, headCy + 4, t(g.mouth, 0.5));

      // Neck
      for (let y = by + 14; y <= by + 15; y++)
        for (let x = cx - 2; x <= cx + 1; x++)
          pc.setPixel(x, y, t(g.skin1Shd, 0.45));

      drawTorsoShaped(cx, by + 16, by + 27, 7, g.c1shirt, g.c1shirtShd);
      // V-neck collar
      pc.setPixel(cx, by + 16, t(g.skin1Shd, 0.5));
      pc.setPixel(cx - 1, by + 17, t(g.skin1Shd, 0.45));
      pc.setPixel(cx + 1, by + 17, t(g.skin1Shd, 0.45));
      drawArms3px(cx, by + 17, 9, 7, g.c1shirt, g.c1shirtShd, g.skin1, g.skin1Shd);
      drawLegs(cx, by + 28, by + 39, g.c1pants, g.c1pantsShd);
      drawShoes(cx, by + 40, by + 43, g.c1shoes);
      addOutline(0, 34);
    }

    // =============================================================
    // CUSTOMER 2: Older man — grey short hair, green polo, broader
    // Silhouette feature: wider shoulders, slightly stockier
    // =============================================================
    {
      const cx = 52, by = 3;
      const headCy = by + 7, headRx = 7, headRy = 6;

      // Short grey hair — tight dome, no extensions
      for (let y = by - 1; y <= by + 4; y++) {
        for (let x = cx - 8; x <= cx + 8; x++) {
          const nx = (x - cx) / 8, ny = (y - (by + 1)) / 4;
          if (nx * nx + ny * ny <= 1.0) {
            let v = nx * -0.4 + ny * -0.5 + 0.5;
            v = Math.max(0.2, Math.min(0.8, v));
            pc.setPixel(x, y, t(g.c2hair, v));
          }
        }
      }
      // Receding at temples — remove hair at sides of forehead
      pc.setPixel(cx - 7, by + 3, t(g.skin2, 0.5));
      pc.setPixel(cx + 7, by + 3, t(g.skin2, 0.5));

      drawSphere(cx, headCy, headRx, headRy, g.skin2, g.skin2Shd);
      drawEyes3x3(cx, headCy, g.iris2, g.pupil2);
      // Nose (slightly larger — older character)
      pc.setPixel(cx, headCy + 3, t(g.skin2Shd, 0.4));
      pc.setPixel(cx + 1, headCy + 3, t(g.skin2Shd, 0.35));
      // Neutral/content mouth
      pc.setPixel(cx - 1, headCy + 4, t(g.mouth, 0.4));
      pc.setPixel(cx, headCy + 4, t(g.mouth, 0.4));
      pc.setPixel(cx + 1, headCy + 4, t(g.mouth, 0.4));

      // Neck (wider)
      for (let y = by + 14; y <= by + 15; y++)
        for (let x = cx - 3; x <= cx + 2; x++)
          pc.setPixel(x, y, t(g.skin2Shd, 0.45));

      // Wider torso
      drawTorsoShaped(cx, by + 16, by + 28, 8, g.c2shirt, g.c2shirtShd);
      // Polo collar
      pc.setPixel(cx - 1, by + 16, t(g.c2shirtShd, 0.3));
      pc.setPixel(cx, by + 16, t(g.skin2Shd, 0.5));
      pc.setPixel(cx + 1, by + 16, t(g.c2shirtShd, 0.3));
      // Polo buttons
      pc.setPixel(cx, by + 18, t(g.c2shirtShd, 0.25));
      pc.setPixel(cx, by + 20, t(g.c2shirtShd, 0.25));

      drawArms3px(cx, by + 17, 10, 8, g.c2shirt, g.c2shirtShd, g.skin2, g.skin2Shd);
      drawLegs(cx, by + 29, by + 40, g.c2pants, g.c2pantsShd);
      drawShoes(cx, by + 41, by + 44, g.c2shoes);
      addOutline(34, 36);
    }

    // =============================================================
    // CUSTOMER 3: Kid — blue spiky hair, orange hoodie, shorter
    // Silhouette feature: spikes above head, shorter overall
    // =============================================================
    {
      const cx = 88, by = 8; // starts lower — shorter character
      const headCy = by + 7, headRx = 7, headRy = 6;

      // Hair dome
      for (let y = by - 1; y <= by + 5; y++) {
        for (let x = cx - 9; x <= cx + 9; x++) {
          const nx = (x - cx) / 9, ny = (y - (by + 2)) / 5;
          if (nx * nx + ny * ny <= 1.0) {
            let v = nx * -0.5 + ny * -0.6 + Math.sqrt(Math.max(0, 1 - nx*nx - ny*ny)) * 0.5;
            v = Math.max(0.15, Math.min(1, v * 0.35 + 0.5));
            pc.setPixel(x, y, v > 0.4 ? t(g.c3hair, v) : t(g.c3hairShd, v + 0.2));
          }
        }
      }
      // Spikes — tall, energetic
      const spikes = [
        { x: cx - 5, ty: by - 5 },
        { x: cx - 2, ty: by - 7 },
        { x: cx + 1, ty: by - 6 },
        { x: cx + 4, ty: by - 4 },
        { x: cx + 6, ty: by - 3 },
      ];
      for (const sp of spikes) {
        for (let sy = sp.ty; sy < by; sy++) {
          const tFrac = (sy - sp.ty) / (by - sp.ty);
          const hw = Math.round(tFrac * 1.2);
          for (let dx = -hw; dx <= hw; dx++) {
            const px = sp.x + dx;
            if (px >= 70 && px < 104) {
              const v = 0.5 + (1 - tFrac) * 0.4;
              pc.setPixel(px, sy, t(g.c3hair, v));
            }
          }
        }
      }
      pc.setPixel(cx - 2, by - 6, t(g.c3hairHi, 0.9));

      drawSphere(cx, headCy, headRx, headRy, g.skin3, g.skin3Shd);
      drawEyes3x3(cx, headCy, g.iris3, g.pupil3);
      // Nose
      pc.setPixel(cx, headCy + 3, t(g.skin3Shd, 0.4));
      // Big kid grin
      pc.setPixel(cx - 2, headCy + 4, t(g.mouth, 0.5));
      pc.setPixel(cx - 1, headCy + 5, t(g.mouth, 0.5));
      pc.setPixel(cx,     headCy + 5, t(g.mouthShd, 0.3));
      pc.setPixel(cx + 1, headCy + 5, t(g.mouth, 0.5));
      pc.setPixel(cx + 2, headCy + 4, t(g.mouth, 0.5));

      // Neck
      for (let y = by + 14; y <= by + 15; y++)
        for (let x = cx - 2; x <= cx + 1; x++)
          pc.setPixel(x, y, t(g.skin3Shd, 0.45));

      // Hoodie torso
      drawTorsoShaped(cx, by + 16, by + 26, 7, g.c3shirt, g.c3shirtShd);
      // Hood outline at collar
      pc.setPixel(cx - 6, by + 16, t(g.c3shirt, 0.55));
      pc.setPixel(cx + 6, by + 16, t(g.c3shirt, 0.5));
      pc.setPixel(cx, by + 16, t(g.c3shirtShd, 0.3));
      // Hoodie pocket
      for (let x = cx - 3; x <= cx + 3; x++)
        pc.setPixel(x, by + 24, t(g.c3shirtShd, 0.3));
      // Hoodie drawstrings
      pc.setPixel(cx - 1, by + 17, t(g.c3shirtShd, 0.3));
      pc.setPixel(cx - 1, by + 18, t(g.c3shirtShd, 0.3));
      pc.setPixel(cx + 1, by + 17, t(g.c3shirtShd, 0.3));
      pc.setPixel(cx + 1, by + 18, t(g.c3shirtShd, 0.3));

      drawArms3px(cx, by + 17, 8, 7, g.c3shirt, g.c3shirtShd, g.skin3, g.skin3Shd);
      // Shorter legs (kid)
      drawLegs(cx, by + 27, by + 35, g.c3pants, g.c3pantsShd);
      // Colourful shoes
      drawShoes(cx, by + 36, by + 39, g.c3shoes);
      addOutline(70, 34);
    }
  },
};
