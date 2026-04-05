// Phase 1, Exercise 1.5: Sphere resting on cube + cast shadow
// Training target: occlusion shadow where forms meet, sphere casts shadow onto cube top

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { grey: '#888888' },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.grey.startIdx); },

  drawPost(pc, pal) {
    const g = pal.groups.grey;
    function tone(frac) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1,
        Math.round(frac * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const lx = -0.55, ly = -0.65, lz = 0.52;

    // CUBE — 3/4 view, lower portion of canvas
    const cubeLeft = 28, cubeRight = 100;
    const cubeTop = 62, cubeBot = 108;
    const cubeTopOY = -16, cubeTopOX = -10;

    // Ground
    const groundY = cubeBot + 6;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        pc.setPixel(x, y, tone(Math.max(0.05, 0.24 - ((y - groundY) / (128 - groundY)) * 0.06)));
      }
    }

    // Cube cast shadow on ground
    for (let y = groundY; y < groundY + 8; y++) {
      for (let x = cubeLeft + 15; x < cubeRight + 20; x++) {
        if (x >= 0 && x < 128 && y < 128) {
          const t = (y - groundY) / 8;
          pc.setPixel(x, y, tone(Math.max(0.03, 0.18 * (0.5 + t * 0.5))));
        }
      }
    }

    // Cube front face (facing viewer, medium bright)
    const frontDot = lz;
    const frontVal = 0.04 + Math.max(0, frontDot) * 0.5;
    for (let y = cubeTop; y <= cubeBot; y++) {
      for (let x = cubeLeft; x <= cubeRight; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 128) {
          const yFade = (y - cubeTop) / (cubeBot - cubeTop);
          pc.setPixel(x, y, tone(Math.max(0.03, frontVal - yFade * 0.04)));
        }
      }
    }

    // Cube top face (facing up, brightest)
    const topDot = -ly;
    const topVal = 0.04 + Math.max(0, topDot) * 0.6;
    for (let row = 0; row < Math.abs(cubeTopOY); row++) {
      const t = row / Math.abs(cubeTopOY);
      const rowY = cubeTop + cubeTopOY + row;
      const rowL = Math.round(cubeLeft + cubeTopOX * (1 - t));
      const rowR = Math.round(cubeRight + cubeTopOX * (1 - t));
      for (let x = rowL; x <= rowR; x++) {
        if (x >= 0 && x < 128 && rowY >= 0 && rowY < 128) {
          pc.setPixel(x, rowY, tone(Math.max(0.03, topVal)));
        }
      }
    }

    // SPHERE cast shadow onto cube top face
    const sphereCX = 64, sphereCY = 36, sphereR = 24;
    // Shadow falls onto the top face — offset toward lower-right
    const shOX = 10, shOY = 6;
    for (let row = 0; row < Math.abs(cubeTopOY); row++) {
      const t = row / Math.abs(cubeTopOY);
      const rowY = cubeTop + cubeTopOY + row;
      const rowL = Math.round(cubeLeft + cubeTopOX * (1 - t));
      const rowR = Math.round(cubeRight + cubeTopOX * (1 - t));
      for (let x = rowL; x <= rowR; x++) {
        if (x < 0 || x >= 128 || rowY < 0 || rowY >= 128) continue;
        // Distance from shadow center (projected sphere center + offset)
        const sdx = (x - (sphereCX + shOX)) / (sphereR * 1.1);
        const sdy = (rowY - (cubeTop + cubeTopOY / 2 + shOY)) / (sphereR * 0.5);
        const sd = sdx * sdx + sdy * sdy;
        if (sd < 1) {
          const shadowIntensity = Math.pow(1 - sd, 1.5) * 0.45;
          pc.setPixel(x, rowY, tone(Math.max(0.04, topVal * (1 - shadowIntensity))));
        }
      }
    }

    // Cube edges
    for (let x = cubeLeft; x <= cubeRight; x++) {
      if (x >= 0 && x < 128 && cubeTop >= 0 && cubeTop < 128) {
        pc.setPixel(x, cubeTop, tone(Math.min(0.9, topVal + 0.12)));
      }
    }
    for (let y = cubeTop; y <= cubeBot; y++) {
      if (cubeRight >= 0 && cubeRight < 128 && y >= 0 && y < 128) {
        pc.setPixel(cubeRight, y, tone(0.05));
      }
    }

    // SPHERE sitting on top of cube
    // Sphere center is above cube top face
    for (let y = sphereCY - sphereR - 1; y <= sphereCY + sphereR + 1; y++) {
      for (let x = sphereCX - sphereR - 1; x <= sphereCX + sphereR + 1; x++) {
        const dx = x - sphereCX, dy = y - sphereCY;
        if (dx * dx + dy * dy > sphereR * sphereR) continue;

        const nx = dx / sphereR;
        const ny = dy / sphereR;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);

        const r2x = 2 * NdotL * nx - lx;
        const r2z = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, r2z), 50) * 0.65;

        const ambient = 0.03;
        const reflected = Math.max(0, ny * 0.35) * 0.12;

        let core = 0;
        if (NdotL >= -0.03 && NdotL <= 0.18) {
          core = Math.max(0, (1 - Math.abs(NdotL - 0.06) / 0.12)) * 0.07;
        }

        let value = ambient + diffuse * 0.72 + specular + reflected - core;
        value = Math.max(0, Math.min(1, value));
        value = value * value * (3 - 2 * value);
        value = Math.max(0.02, value);

        if (x >= 0 && x < 128 && y >= 0 && y < 128) {
          pc.setPixel(x, y, tone(value));
        }
      }
    }

    // OCCLUSION SHADOW — where sphere meets cube top
    // Very dark, tight, at the contact point
    const contactY = sphereCY + sphereR;
    for (let x = sphereCX - 10; x <= sphereCX + 10; x++) {
      const dx = (x - sphereCX) / 10;
      const w = 1 - dx * dx;
      for (let dy = 0; dy < 3; dy++) {
        const py = contactY + dy;
        if (x >= 0 && x < 128 && py >= 0 && py < 128) {
          const intensity = w * (1 - dy / 3);
          pc.setPixel(x, py, tone(Math.max(0.01, 0.04 * (1 - intensity * 0.8))));
        }
      }
    }
  },
};
