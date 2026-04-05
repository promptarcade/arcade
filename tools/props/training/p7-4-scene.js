// Phase 7.4: Full Scene — Tavern Interior (IMPROVED)
// Cloaked figure seated at wooden table, candle light + moonlight through window
// Larger canvas for more detail. More props (bottle, plate, shelf).
// Tests: composition, dual lighting, value hierarchy, multiple materials
// Canvas: 256×192, Illustrated tier

module.exports = {
  width: 256, height: 192, style: 'illustrated', entityType: 'prop', outlineMode: 'none',
  colors: {
    wood: '#8b6b42', woodshd: '#4a3820',
    stone: '#667766', stoneshd: '#334433',
    skin: '#d4a574', skinshd: '#8b5e3c',
    cloak: '#334455', cloakshd: '#1a2233',
    candle: '#ffdd88', candleshd: '#cc9944',
    flame: '#ffaa33', flameshd: '#ff6611',
    moon: '#aabbdd', moonshd: '#556688',
    mug: '#886644', mugshd: '#553322',
    bottle: '#336644', bottleshd: '#1a3322',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.wood.startIdx); },
  drawPost(pc, pal) {
    const wd = pal.groups.wood, ws = pal.groups.woodshd;
    const st = pal.groups.stone, ss = pal.groups.stoneshd;
    const sk = pal.groups.skin, sks = pal.groups.skinshd;
    const cl = pal.groups.cloak, cls = pal.groups.cloakshd;
    const cn = pal.groups.candle, cns = pal.groups.candleshd;
    const fl = pal.groups.flame, fls = pal.groups.flameshd;
    const mn = pal.groups.moon, mns = pal.groups.moonshd;
    const mg = pal.groups.mug, mgs = pal.groups.mugshd;
    const bt = pal.groups.bottle, bts = pal.groups.bottleshd;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;
    const rng = sf2_seededRNG(74);

    const W = 256, H = 192;
    const candleX = 138, candleY = 82;
    const windowX = 200, windowY = 15, windowW = 30, windowH = 45;

    function candleLight(x, y) {
      const dx = x - candleX, dy = y - candleY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return Math.max(0, 1 - dist / 110) * 0.75;
    }

    function moonLight(x, y) {
      const dx = x - (windowX + windowW / 2), dy = y - (windowY + windowH);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const inBeam = angle > 1.2 && angle < 2.8; // downward-left cone
      if (!inBeam) return Math.max(0, 0.06 - dist * 0.0005);
      return Math.max(0, 0.5 - dist / 130);
    }

    const lx = -0.5, ly = -0.6, lz = 0.63;

    // ========== STONE WALL ==========
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const brickW = 24, brickH = 12;
        const row = Math.floor(y / brickH);
        const offset = (row % 2) * 12;
        const bx = (x + offset) % brickW;
        const by = y % brickH;
        const isMortar = bx < 1 || by < 1;

        const cL = candleLight(x, y) * 0.4;
        const mL = moonLight(x, y) * 0.6;

        if (isMortar) {
          pc.setPixel(x, y, tone(ss, Math.max(0.03, 0.05 + cL * 0.15 + mL * 0.1)));
        } else {
          const brickSeed = (row * 17 + Math.floor((x + offset) / brickW) * 31) % 100;
          const brickVar = (brickSeed % 10) / 120;
          let v = 0.12 + brickVar + cL * 0.22 + mL * 0.18;
          v += Math.sin(x * 0.4 + y * 0.3) * 0.015;

          if (mL > cL && mL > 0.1) {
            pc.setPixel(x, y, tone(mn, Math.max(0.06, v * 0.65)));
          } else if (cL > 0.08) {
            pc.setPixel(x, y, tone(st, Math.max(0.05, v)));
          } else {
            pc.setPixel(x, y, tone(ss, Math.max(0.04, v * 0.7)));
          }
        }
      }
    }

    // ========== WINDOW ==========
    // Frame
    for (let y = windowY - 3; y <= windowY + windowH + 3; y++) {
      for (let x = windowX - 3; x <= windowX + windowW + 3; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const inFrame = x < windowX || x > windowX + windowW || y < windowY || y > windowY + windowH;
        if (inFrame) {
          const frameNX = (x - (windowX + windowW / 2)) / (windowW + 6) * 0.3;
          const frameNZ = Math.sqrt(Math.max(0.1, 1 - frameNX * frameNX));
          let fv = 0.08 + Math.max(0, lx * frameNX + lz * frameNZ) * 0.15;
          pc.setPixel(x, y, tone(ws, Math.max(0.04, fv)));
        }
      }
    }
    // Cross-bars in window
    for (let y = windowY; y <= windowY + windowH; y++) {
      const midX = windowX + Math.round(windowW / 2);
      if (midX >= 0 && midX < W) pc.setPixel(midX, y, tone(ws, 0.12));
    }
    for (let x = windowX; x <= windowX + windowW; x++) {
      const midY = windowY + Math.round(windowH / 2);
      if (x < W && midY < H) pc.setPixel(x, midY, tone(ws, 0.12));
    }
    // Sky through window
    for (let y = windowY; y <= windowY + windowH; y++) {
      for (let x = windowX; x <= windowX + windowW; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const midX = windowX + Math.round(windowW / 2);
        const midY = windowY + Math.round(windowH / 2);
        if (x === midX || y === midY) continue; // skip cross-bars
        const skyV = 0.18 + (1 - (y - windowY) / windowH) * 0.3;
        pc.setPixel(x, y, tone(mn, skyV));
      }
    }
    // Moon
    const moonCX = windowX + 22, moonCY = windowY + 10;
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        if (dx * dx + dy * dy > 25) continue;
        const mpx = moonCX + dx, mpy = moonCY + dy;
        if (mpx > windowX && mpx < windowX + windowW && mpy > windowY && mpy < windowY + windowH) {
          pc.setPixel(mpx, mpy, tone(mn, 0.7 + (1 - Math.sqrt(dx * dx + dy * dy) / 5) * 0.25));
        }
      }
    }

    // Moonbeam shaft
    for (let y = windowY + windowH + 1; y < H; y++) {
      const beamT = (y - windowY - windowH) / (H - windowY - windowH);
      const beamW = windowW * (1 + beamT * 1.2);
      const beamCX = windowX + windowW / 2 - beamT * 40;
      for (let x = Math.round(beamCX - beamW / 2); x <= Math.round(beamCX + beamW / 2); x++) {
        if (x < 0 || x >= W || y >= H) continue;
        const bxN = (x - beamCX) / (beamW / 2);
        const intensity = Math.max(0, (1 - bxN * bxN) * (1 - beamT * 0.6) * 0.06);
        if (intensity > 0.005 && pc.pixels[y * W + x] !== 0) {
          pc.setPixel(x, y, tone(mn, Math.min(0.4, intensity + 0.12)));
        }
      }
    }

    // ========== WOODEN FLOOR ==========
    const floorY = 140;
    for (let y = floorY; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const plankW = 32;
        const plankIdx = Math.floor(x / plankW);
        const px2 = x % plankW;
        const isGap = px2 < 1;
        const cL = candleLight(x, y);
        const mL = moonLight(x, y);

        if (isGap) {
          pc.setPixel(x, y, tone(ws, 0.03));
        } else {
          // Wood grain — individual streaks
          const grain1 = Math.sin(x * 0.04 + plankIdx * 5) * 0.03;
          const grain2 = Math.sin(x * 0.12 + y * 0.2 + plankIdx * 3) * 0.015;
          const knot = Math.sin(x * 0.03 + plankIdx * 11) > 0.95 ? -0.03 : 0;
          let v = 0.1 + grain1 + grain2 + knot + cL * 0.32 + mL * 0.18;
          v = v * v * (3 - 2 * v);
          if (cL > mL) {
            pc.setPixel(x, y, tone(v > 0.22 ? wd : ws, Math.max(0.04, v)));
          } else {
            pc.setPixel(x, y, tone(v > 0.18 ? mns : ws, Math.max(0.03, v * 0.75)));
          }
        }
      }
    }

    // ========== SHELF ON WALL (left side) ==========
    const shelfY = 50, shelfLeft = 10, shelfRight = 70;
    // Shelf bracket
    for (const bx of [shelfLeft + 5, shelfRight - 5]) {
      for (let y = shelfY; y <= shelfY + 12; y++) {
        for (let dx = -1; dx <= 1; dx++) {
          const sx = bx + dx;
          if (sx >= 0 && sx < W && y < H) {
            pc.setPixel(sx, y, tone(ws, 0.1 + candleLight(sx, y) * 0.12));
          }
        }
      }
    }
    // Shelf surface
    for (let x = shelfLeft; x <= shelfRight; x++) {
      for (let dy = 0; dy < 4; dy++) {
        const sy = shelfY + dy;
        if (x >= 0 && x < W && sy < H) {
          const cL = candleLight(x, sy);
          let sv = 0.08 + cL * 0.2 + Math.sin(x * 0.06) * 0.02;
          sv = sv * sv * (3 - 2 * sv);
          pc.setPixel(x, sy, tone(sv > 0.15 ? wd : ws, Math.max(0.04, sv)));
        }
      }
    }
    // Bottles on shelf
    for (const bx of [20, 35, 52]) {
      const botTop = shelfY - 18, botBot = shelfY - 1;
      function bottleProfile(t) {
        if (t < 0.15) return 2; // neck
        if (t < 0.3) return 2 + (t - 0.15) / 0.15 * 3; // shoulder
        if (t < 0.9) return 5; // body
        return 4; // base
      }
      for (let y = botTop; y <= botBot; y++) {
        const bt2 = (y - botTop) / (botBot - botTop);
        const hw = Math.round(bottleProfile(bt2));
        for (let dx = -hw; dx <= hw; dx++) {
          const bpx = bx + dx;
          if (bpx < 0 || bpx >= W || y < 0 || y >= H) continue;
          const nx = dx / (hw + 1);
          const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
          const cL = candleLight(bpx, y);
          // Glass-like: Fresnel
          const fresnel = Math.pow(1 - nz, 2) * 0.3 + 0.08;
          const thickness = Math.abs(nx);
          let bv;
          if (thickness < 0.4) {
            bv = fresnel * 0.3 + cL * 0.2;
          } else {
            bv = fresnel + Math.max(0, lx * nx + lz * nz) * 0.15 + cL * 0.2;
          }
          bv = bv * bv * (3 - 2 * bv);
          pc.setPixel(bpx, y, tone(bv > 0.2 ? bt : bts, Math.max(0.03, bv)));
        }
      }
    }

    // ========== TABLE ==========
    const tableLeft = 80, tableRight = 195;
    const tableTop = 100, tableFront = 112;
    // Table top
    for (let y = tableTop; y <= tableFront; y++) {
      for (let x = tableLeft; x <= tableRight; x++) {
        if (x >= W || y >= H) continue;
        const cL = candleLight(x, y);
        const grain = Math.sin(x * 0.05 + 2) * 0.025 + Math.sin(x * 0.15) * 0.015;
        let v = 0.15 + grain + cL * 0.38;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.28 ? wd : ws, Math.max(0.05, v)));
      }
    }
    // Table front
    for (let y = tableFront + 1; y <= tableFront + 14; y++) {
      for (let x = tableLeft; x <= tableRight; x++) {
        if (x >= W || y >= H) continue;
        const cL = candleLight(x, y);
        const ny = (y - tableFront) / 14 * 0.4;
        let v = 0.06 + cL * 0.15 + Math.sin(x * 0.04) * 0.01;
        v -= ny * 0.03;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(ws, Math.max(0.03, v)));
      }
    }
    // Table legs
    for (const legX of [tableLeft + 6, tableRight - 6]) {
      for (let y = tableFront + 14; y < floorY; y++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x = legX + dx;
          if (x >= 0 && x < W && y < H) {
            const cL = candleLight(x, y);
            pc.setPixel(x, y, tone(ws, Math.max(0.03, 0.06 + cL * 0.1)));
          }
        }
      }
    }

    // ========== CANDLE on table ==========
    // Wax body
    for (let y = candleY + 2; y <= tableFront; y++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = candleX + dx;
        if (x < 0 || x >= W || y >= H) continue;
        const nx = dx / 4;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        let v = 0.3 + Math.max(0, lx * nx + lz * nz) * 0.45;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.4 ? cn : cns, Math.max(0.1, v)));
      }
    }
    // Candle holder (small dish)
    for (let dx = -7; dx <= 7; dx++) {
      const x = candleX + dx;
      if (x >= 0 && x < W && tableFront < H) {
        pc.setPixel(x, tableFront, tone(cns, 0.2 + (1 - Math.abs(dx) / 7) * 0.15));
      }
    }
    // Flame
    for (let dy = -12; dy <= 0; dy++) {
      const ft = 1 - (-dy / 12);
      const fw = Math.round(2 + ft * 2.5);
      for (let dx = -fw; dx <= fw; dx++) {
        const x = candleX + dx + Math.round(Math.sin(dy * 0.4) * 0.8);
        const y = candleY + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const d = Math.sqrt(dx * dx + dy * dy * 0.5) / 7;
        if (d > 1) continue;
        if (d < 0.35) {
          pc.setPixel(x, y, tone(cn, 0.92 + (1 - d) * 0.08));
        } else {
          let fv = 0.4 + (1 - d) * 0.5;
          pc.setPixel(x, y, tone(fv > 0.55 ? fl : fls, Math.max(0.2, fv)));
        }
      }
    }

    // ========== MUG on table ==========
    const mugCX = 110, mugTop = 90, mugBot = 107;
    function mugProfile(t) {
      if (t < 0.1) return 8;
      if (t < 0.9) return 7 + Math.sin(((t - 0.1) / 0.8) * Math.PI) * 1.5;
      return 6;
    }
    for (let y = mugTop; y <= mugBot; y++) {
      const t = (y - mugTop) / (mugBot - mugTop);
      const halfW = Math.round(mugProfile(t));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = mugCX + dx;
        if (x < 0 || x >= W || y >= H) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const cL = candleLight(x, y);
        let v = 0.06 + Math.max(0, lx * nx + lz * nz) * 0.25 + cL * 0.35;
        v = v * v * (3 - 2 * v);
        pc.setPixel(x, y, tone(v > 0.28 ? mg : mgs, Math.max(0.04, v)));
      }
    }
    // Handle
    for (let dy = -5; dy <= 5; dy++) {
      const hx = mugCX + Math.round(mugProfile(0.5)) + 2 + Math.round(Math.sqrt(Math.max(0, 25 - dy * dy)));
      const hy = mugTop + Math.round((mugBot - mugTop) * 0.5) + dy;
      if (hx >= 0 && hx < W && hy >= 0 && hy < H) {
        pc.setPixel(hx, hy, tone(mg, 0.2 + candleLight(hx, hy) * 0.3));
        if (hx - 1 >= 0) pc.setPixel(hx - 1, hy, tone(mg, 0.15 + candleLight(hx - 1, hy) * 0.25));
      }
    }
    // Rim ellipse
    for (let dx = -8; dx <= 8; dx++) {
      const x = mugCX + dx;
      for (let dy = -2; dy <= 1; dy++) {
        const ey = mugTop + dy;
        const d = Math.sqrt((dx / 8) ** 2 + (dy / 2) ** 2);
        if (d > 1) continue;
        if (x >= 0 && x < W && ey >= 0 && ey < H) {
          pc.setPixel(x, ey, tone(mg, 0.3 + candleLight(x, ey) * 0.3 + (1 - d) * 0.1));
        }
      }
    }

    // ========== PLATE with food on table ==========
    const plateCX = 165, plateCY = 104;
    // Plate ellipse
    for (let dy = -6; dy <= 6; dy++) {
      const pw = Math.round(12 * Math.sqrt(Math.max(0, 1 - (dy / 6) * (dy / 6))));
      for (let dx = -pw; dx <= pw; dx++) {
        const ppx = plateCX + dx, ppy = plateCY + dy;
        if (ppx < 0 || ppx >= W || ppy < 0 || ppy >= H) continue;
        const cL = candleLight(ppx, ppy);
        const d = Math.sqrt((dx / 12) ** 2 + (dy / 6) ** 2);
        let pv = 0.15 + cL * 0.35 + (1 - d) * 0.08;
        pv = pv * pv * (3 - 2 * pv);
        pc.setPixel(ppx, ppy, tone(pv > 0.3 ? cn : cns, Math.max(0.06, pv)));
      }
    }
    // Bread/food lump on plate
    for (let dy = -4; dy <= 2; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const d = Math.sqrt((dx / 5) ** 2 + ((dy + 1) / 4) ** 2);
        if (d > 1) continue;
        const fpx = plateCX + dx, fpy = plateCY + dy - 3;
        if (fpx < 0 || fpx >= W || fpy < 0 || fpy >= H) continue;
        const cL = candleLight(fpx, fpy);
        const fnx = dx / 6, fny = (dy + 1) / 5 * 0.5;
        const fnz = Math.sqrt(Math.max(0.1, 1 - fnx * fnx - fny * fny));
        let fv = 0.08 + Math.max(0, lx * fnx + ly * fny + lz * fnz) * 0.3 + cL * 0.3;
        fv = fv * fv * (3 - 2 * fv);
        pc.setPixel(fpx, fpy, tone(fv > 0.25 ? wd : ws, Math.max(0.04, fv)));
      }
    }

    // ========== CLOAKED FIGURE ==========
    const figCX = 155, figHeadY = 55;
    const headR = 12;
    const shoulderY = figHeadY + headR + 3;

    // Cloak body — from shoulders down to table
    for (let y = shoulderY; y <= tableFront + 5; y++) {
      const bt2 = (y - shoulderY) / (tableFront + 5 - shoulderY);
      const halfW = Math.round(16 + bt2 * 14);
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = figCX + dx;
        if (x < 0 || x >= W || y >= H) continue;
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const cL = candleLight(x, y);
        const mL = moonLight(x, y);
        // Multiple cloth folds — varying frequency
        const fold1 = Math.sin(dx * 0.18 + y * 0.08) * 0.05;
        const fold2 = Math.sin(dx * 0.3 - y * 0.12) * 0.03;
        let v = 0.04 + Math.max(0, lx * nx + lz * nz) * 0.15 + cL * 0.28 + mL * 0.12 + fold1 + fold2;
        v = v * v * (3 - 2 * v);

        if (mL > cL * 0.8 && mL > 0.08) {
          pc.setPixel(x, y, tone(v > 0.12 ? mns : cls, Math.max(0.02, v * 0.7)));
        } else {
          pc.setPixel(x, y, tone(v > 0.18 ? cl : cls, Math.max(0.02, v)));
        }
      }
    }

    // Hood
    const hoodR = headR + 6;
    for (let dy = -hoodR; dy <= Math.round(hoodR * 0.55); dy++) {
      const halfW = Math.round(Math.sqrt(Math.max(0, hoodR * hoodR - dy * dy)));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = figCX + dx, y = figHeadY + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const nx = dx / (hoodR + 1), ny = dy / (hoodR + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        const cL = candleLight(x, y);
        const mL = moonLight(x, y);
        let v = 0.03 + Math.max(0, lx * nx + ly * ny + lz * nz) * 0.12 + cL * 0.22 + mL * 0.15;
        // Hood rim — brighter at bottom edge
        if (dy > hoodR * 0.35) v += 0.06;
        v = v * v * (3 - 2 * v);

        if (mL > cL) {
          pc.setPixel(x, y, tone(v > 0.1 ? mns : cls, Math.max(0.02, v * 0.65)));
        } else {
          pc.setPixel(x, y, tone(v > 0.12 ? cl : cls, Math.max(0.02, v)));
        }
      }
    }

    // Face — more visible, with nose and chin
    for (let dy = -headR + 3; dy <= headR - 2; dy++) {
      const halfW = Math.round(Math.sqrt(Math.max(0, (headR - 2) * (headR - 2) - dy * dy)));
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = figCX + dx, y = figHeadY + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const cL = candleLight(x, y);
        // Face lit by candle on the left side
        if (dx < 3) {
          const fnx = dx / (halfW + 1);
          const fny = dy / (headR - 2) * 0.4;
          const fnz = Math.sqrt(Math.max(0.1, 1 - fnx * fnx - fny * fny));
          let v = 0.04 + Math.max(0, lx * fnx + ly * fny + lz * fnz) * 0.25 + cL * 0.45;
          v = v * v * (3 - 2 * v);
          pc.setPixel(x, y, tone(v > 0.15 ? sk : sks, Math.max(0.04, v)));
        }
      }
    }

    // Nose ridge highlight
    for (let dy = -3; dy <= 3; dy++) {
      const nx2 = figCX - 2, ny2 = figHeadY + dy + 1;
      if (nx2 >= 0 && nx2 < W && ny2 >= 0 && ny2 < H) {
        pc.setPixel(nx2, ny2, tone(sk, 0.35 + candleLight(nx2, ny2) * 0.3));
      }
    }

    // Eyes — glinting in hood shadow
    const eyeY2 = figHeadY - 2;
    for (const ex of [figCX - 4, figCX + 3]) {
      if (ex >= 0 && ex + 1 < W && eyeY2 >= 0 && eyeY2 < H) {
        pc.setPixel(ex, eyeY2, tone(cn, 0.6));
        pc.setPixel(ex + 1, eyeY2, tone(cn, 0.4));
        // Tiny iris dot
        pc.setPixel(ex, eyeY2 + 1, tone(cls, 0.08));
      }
    }

    // Arm reaching toward mug
    for (let i = 0; i < 25; i++) {
      const t = i / 24;
      const armX = Math.round(figCX - 16 - t * 22);
      const armY = Math.round(shoulderY + 8 + t * 12 + Math.sin(t * 3) * 2);
      if (armX < 0 || armX >= W || armY < 0 || armY >= H) continue;
      const cL = candleLight(armX, armY);
      for (let w = -4; w <= 4; w++) {
        const aw = armX + Math.round(w * 0.7), ay2 = armY + Math.round(w * 0.3);
        if (aw >= 0 && aw < W && ay2 >= 0 && ay2 < H) {
          let av = 0.04 + cL * 0.2 + Math.max(0, -w / 5) * 0.05;
          av = av * av * (3 - 2 * av);
          pc.setPixel(aw, ay2, tone(av > 0.12 ? cl : cls, Math.max(0.02, av)));
        }
      }
    }

    // Hand near mug
    for (let dy = -4; dy <= 3; dy++) {
      for (let dx = -5; dx <= 0; dx++) {
        const hx = mugCX + Math.round(mugProfile(0.4)) + dx + 1;
        const hy = mugTop + Math.round((mugBot - mugTop) * 0.35) + dy;
        if (hx >= 0 && hx < W && hy >= 0 && hy < H) {
          const cL = candleLight(hx, hy);
          let hv = 0.08 + cL * 0.42;
          hv = hv * hv * (3 - 2 * hv);
          pc.setPixel(hx, hy, tone(hv > 0.18 ? sk : sks, Math.max(0.04, hv)));
        }
      }
    }

    // ========== STOOL under figure (partially visible) ==========
    for (let y = tableFront + 5; y < floorY; y++) {
      for (let dx = -8; dx <= 8; dx++) {
        const sx = figCX + dx;
        if (sx < 0 || sx >= W || y >= H) continue;
        const cL = candleLight(sx, y);
        let sv = 0.04 + cL * 0.08;
        pc.setPixel(sx, y, tone(ws, Math.max(0.03, sv)));
      }
    }
  },
};
