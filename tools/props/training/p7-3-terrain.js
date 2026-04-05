// Phase 7.3: Terrain Tile Set — 4 seamlessly tiling 64×64 tiles
// Grass, Dirt, Water, Stone — Illustrated tier
// Each tile is 64×64, rendered as a 2×2 grid (128×128 canvas) to verify seamless tiling
// Training targets: consistent style, proper edge wrapping, cluster readability

module.exports = {
  width: 128, height: 128, style: 'illustrated', entityType: 'prop', outlineMode: 'none',
  colors: {
    grass: '#44883a', grassshd: '#2a5525',
    grasshi: '#66aa44',
    dirt: '#8b6b42', dirtshd: '#5a4428',
    dirthi: '#aa8855',
    water: '#2255aa', watershd: '#113366',
    waterhi: '#5599dd',
    stone: '#778888', stoneshd: '#445555',
    stonehi: '#99aabb',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.grass.startIdx); },
  drawPost(pc, pal) {
    const grG = pal.groups.grass, grS = pal.groups.grassshd, grH = pal.groups.grasshi;
    const dtG = pal.groups.dirt, dtS = pal.groups.dirtshd, dtH = pal.groups.dirthi;
    const wtG = pal.groups.water, wtS = pal.groups.watershd, wtH = pal.groups.waterhi;
    const stG = pal.groups.stone, stS = pal.groups.stoneshd, stH = pal.groups.stonehi;
    function tone(g, f) { return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1)))); }
    pc.pixels[0] = 0;
    const rng = sf2_seededRNG(73);

    const TILE = 64;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // Helper: wrap coordinates for seamless tiling
    function wrap(v) { return ((v % TILE) + TILE) % TILE; }

    // ==========================================
    // TOP-LEFT: GRASS (0,0)
    // ==========================================
    function drawGrass(ox, oy) {
      // Base green fill
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          // Gentle undulation for base — seamless via modulo
          const wx = wrap(x), wy = wrap(y);
          const undulate = Math.sin(wx * 0.12) * Math.cos(wy * 0.1) * 0.08;
          let v = 0.42 + undulate;
          pc.setPixel(ox + x, oy + y, tone(grG, v));
        }
      }

      // Grass tufts — clusters of vertical strokes
      // Pre-generate tuft positions that tile seamlessly
      const tufts = [];
      for (let i = 0; i < 40; i++) {
        tufts.push({
          x: Math.floor(rng() * TILE),
          y: Math.floor(rng() * TILE),
          h: 3 + Math.floor(rng() * 5), // height 3-7px
          w: 1 + Math.floor(rng() * 2), // width 1-2px
          bright: 0.3 + rng() * 0.35,
        });
      }

      for (const t of tufts) {
        for (let dy = 0; dy < t.h; dy++) {
          for (let dx = -t.w; dx <= t.w; dx++) {
            const px = ox + wrap(t.x + dx);
            const py = oy + wrap(t.y - dy); // tufts grow upward
            if (px >= ox && px < ox + TILE && py >= oy && py < oy + TILE) {
              // Tip is brightest (highlight), base is shadow
              const tipFrac = dy / t.h;
              let gv = t.bright + tipFrac * 0.25;
              // Light direction: upper-left tufts are brighter
              gv += (dx < 0 ? 0.04 : -0.02);
              if (tipFrac > 0.7) {
                pc.setPixel(px, py, tone(grH, Math.min(0.85, gv)));
              } else {
                pc.setPixel(px, py, tone(gv > 0.4 ? grG : grS, Math.max(0.1, gv)));
              }
            }
          }
        }
        // Shadow at base of tuft
        const sx = ox + wrap(t.x), sy = oy + wrap(t.y + 1);
        if (sx >= ox && sx < ox + TILE && sy >= oy && sy < oy + TILE) {
          pc.setPixel(sx, sy, tone(grS, 0.15));
        }
      }
    }

    // ==========================================
    // TOP-RIGHT: DIRT (64,0)
    // ==========================================
    function drawDirt(ox, oy) {
      // Base warm brown
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          const wx = wrap(x), wy = wrap(y);
          const noise = Math.sin(wx * 0.2 + wy * 0.15) * 0.04 + Math.sin(wx * 0.07 - wy * 0.09) * 0.03;
          let v = 0.38 + noise;
          pc.setPixel(ox + x, oy + y, tone(dtG, v));
        }
      }

      // Scattered pebble clusters (1-3px round shapes)
      const pebbles = [];
      for (let i = 0; i < 25; i++) {
        pebbles.push({
          x: Math.floor(rng() * TILE),
          y: Math.floor(rng() * TILE),
          r: 1 + Math.floor(rng() * 2),
          bright: 0.2 + rng() * 0.3,
        });
      }
      for (const p of pebbles) {
        for (let dy = -p.r; dy <= p.r; dy++) {
          for (let dx = -p.r; dx <= p.r; dx++) {
            if (dx * dx + dy * dy > p.r * p.r) continue;
            const px = ox + wrap(p.x + dx);
            const py = oy + wrap(p.y + dy);
            if (px >= ox && px < ox + TILE && py >= oy && py < oy + TILE) {
              // Tiny per-pebble lighting
              const pnx = dx / (p.r + 0.5);
              const pnz = Math.sqrt(Math.max(0.1, 1 - pnx * pnx));
              const pdot = Math.max(0, lx * pnx + lz * pnz);
              let pv = p.bright + pdot * 0.2;
              pc.setPixel(px, py, tone(pv > 0.35 ? dtH : dtS, Math.max(0.08, pv)));
            }
          }
        }
      }

      // Crack lines — irregular paths across the surface
      for (let c = 0; c < 5; c++) {
        let cx = Math.floor(rng() * TILE);
        let cy = Math.floor(rng() * TILE);
        const len = 8 + Math.floor(rng() * 12);
        for (let s = 0; s < len; s++) {
          const px = ox + wrap(cx);
          const py = oy + wrap(cy);
          if (px >= ox && px < ox + TILE && py >= oy && py < oy + TILE) {
            pc.setPixel(px, py, tone(dtS, 0.1));
          }
          cx += Math.floor(rng() * 3) - 1;
          cy += 1;
        }
      }
    }

    // ==========================================
    // BOTTOM-LEFT: WATER (0,64)
    // ==========================================
    function drawWater(ox, oy) {
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          const wx = wrap(x), wy = wrap(y);
          // Interconnected blob lines — multiple frequency waves
          const wave1 = Math.sin(wx * 0.15 + wy * 0.08) * 0.15;
          const wave2 = Math.sin(wx * 0.06 - wy * 0.12) * 0.1;
          const wave3 = Math.sin(wx * 0.22 + wy * 0.18) * 0.05;
          const combined = wave1 + wave2 + wave3;

          // Bright wave crests, dark troughs
          let v = 0.35 + combined;

          // Specular glint on wave peaks
          if (combined > 0.18) {
            const spec = Math.pow((combined - 0.18) / 0.12, 2) * 0.4;
            v += spec;
            if (v > 0.7) {
              pc.setPixel(ox + x, oy + y, tone(wtH, Math.min(0.95, v)));
              continue;
            }
          }

          pc.setPixel(ox + x, oy + y, tone(v > 0.35 ? wtG : wtS, Math.max(0.06, v)));
        }
      }

      // Bright horizontal ripple lines — characteristic water pattern
      for (let r = 0; r < 8; r++) {
        const ry = Math.floor(rng() * TILE);
        const startX = Math.floor(rng() * TILE);
        const len = 6 + Math.floor(rng() * 14);
        for (let i = 0; i < len; i++) {
          const px = ox + wrap(startX + i);
          const py = oy + wrap(ry + Math.round(Math.sin(i * 0.5) * 1));
          if (px >= ox && px < ox + TILE && py >= oy && py < oy + TILE) {
            pc.setPixel(px, py, tone(wtH, 0.55 + (1 - i / len) * 0.2));
          }
        }
      }
    }

    // ==========================================
    // BOTTOM-RIGHT: STONE (64,64)
    // ==========================================
    function drawStone(ox, oy) {
      // Base grey fill
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          let v = 0.35 + Math.sin(wrap(x) * 0.08 + wrap(y) * 0.06) * 0.03;
          pc.setPixel(ox + x, oy + y, tone(stG, v));
        }
      }

      // Irregular stone blocks with mortar lines
      // Generate a Voronoi-like pattern via seed points
      const stones = [];
      for (let i = 0; i < 14; i++) {
        stones.push({
          x: Math.floor(rng() * TILE),
          y: Math.floor(rng() * TILE),
          bright: 0.25 + rng() * 0.25,
        });
      }

      // For each pixel, find nearest stone centre — pixel belongs to that stone
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          let minDist = 999, minIdx = 0, secondDist = 999;
          for (let i = 0; i < stones.length; i++) {
            // Wrap distance for seamless tiling
            let ddx = Math.abs(x - stones[i].x);
            if (ddx > TILE / 2) ddx = TILE - ddx;
            let ddy = Math.abs(y - stones[i].y);
            if (ddy > TILE / 2) ddy = TILE - ddy;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist < minDist) {
              secondDist = minDist;
              minDist = dist;
              minIdx = i;
            } else if (dist < secondDist) {
              secondDist = dist;
            }
          }

          const stone = stones[minIdx];
          // Mortar line: where closest and second-closest are nearly equal
          const edgeDist = secondDist - minDist;
          if (edgeDist < 2.5) {
            // Mortar — dark line
            pc.setPixel(ox + x, oy + y, tone(stS, 0.08 + edgeDist * 0.03));
          } else {
            // Stone surface — per-stone lighting
            let ddx2 = x - stone.x;
            if (ddx2 > TILE / 2) ddx2 -= TILE;
            if (ddx2 < -TILE / 2) ddx2 += TILE;
            let ddy2 = y - stone.y;
            if (ddy2 > TILE / 2) ddy2 -= TILE;
            if (ddy2 < -TILE / 2) ddy2 += TILE;

            const maxD = Math.max(8, secondDist * 0.8);
            const nx = ddx2 / maxD * 0.3;
            const ny = ddy2 / maxD * 0.3;
            const nz = Math.sqrt(Math.max(0.2, 1 - nx * nx - ny * ny));
            const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
            let sv = stone.bright + dot * 0.3;
            // Slight texture noise
            sv += (Math.sin(x * 1.3 + y * 0.7) * 0.02);
            sv = sv * sv * (3 - 2 * sv);
            pc.setPixel(ox + x, oy + y, tone(sv > 0.38 ? stG : stS, Math.max(0.06, sv)));
            // Highlight ridge near mortar edge
            if (edgeDist < 5 && edgeDist > 2.5) {
              pc.setPixel(ox + x, oy + y, tone(stH, Math.min(0.6, sv + 0.1)));
            }
          }
        }
      }
    }

    // Render each tile in its quadrant
    drawGrass(0, 0);
    drawDirt(64, 0);
    drawWater(0, 64);
    drawStone(64, 64);

    // Border lines between tiles (1px separator for clarity)
    for (let i = 0; i < 128; i++) {
      pc.setPixel(63, i, 0); // vertical separator
      pc.setPixel(i, 63, 0); // horizontal separator
    }
  },
};
