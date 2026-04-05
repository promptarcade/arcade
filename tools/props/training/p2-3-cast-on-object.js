// Phase 2, Exercise 2.3: Two objects, one casting shadow on the other
// Training target: cast shadow conforms to the RECEIVING surface shape

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

    // Scene: small sphere floating above a large sphere
    // The small sphere casts its shadow onto the curved surface of the large one

    const bigCX = 64, bigCY = 75, bigR = 48;
    const smallCX = 50, smallCY = 30, smallR = 16;

    // Ground
    const groundY = bigCY + bigR + 4;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        pc.setPixel(x, y, tone(Math.max(0.05, 0.24 - ((y - groundY) / (128 - groundY)) * 0.06)));
      }
    }

    // Big sphere — with shadow from small sphere projected onto it
    for (let y = bigCY - bigR; y <= bigCY + bigR; y++) {
      for (let x = bigCX - bigR; x <= bigCX + bigR; x++) {
        const dx = x - bigCX, dy = y - bigCY;
        if (dx * dx + dy * dy > bigR * bigR) continue;

        const nx = dx / bigR, ny = dy / bigR;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const rz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rz), 40) * 0.4;
        const ambient = 0.04;
        const reflected = Math.max(0, ny * 0.3) * 0.1;

        let core = 0;
        if (NdotL >= -0.03 && NdotL <= 0.16) {
          core = Math.max(0, 1 - Math.abs(NdotL - 0.05) / 0.11) * 0.06;
        }

        let v = ambient + diffuse * 0.68 + specular + reflected - core;

        // CAST SHADOW from small sphere onto big sphere surface
        // Project the small sphere's silhouette along the light direction
        // onto this point on the big sphere surface
        // The surface point in 3D: (bigCX + dx, bigCY + dy, nz * bigR)
        const surfX = bigCX + dx;
        const surfY = bigCY + dy;
        const surfZ = nz * bigR;

        // Trace back along light direction to see if it hits small sphere
        // Line: P = surf + t * lightDir, check if it intersects small sphere
        // Small sphere center in 3D: (smallCX, smallCY, smallR * 2) — hovering above
        const sCX = smallCX, sCY = smallCY, sCZ = smallR * 3.5;

        // Parametric: does the ray from surface toward light pass through small sphere?
        // Simplified: project small sphere center onto the light ray from this surface point
        const toSX = sCX - surfX, toSY = sCY - surfY, toSZ = sCZ - surfZ;
        // Distance from small sphere center to the light ray through this surface point
        // Cross product magnitude / light direction magnitude
        const crossX = toSY * lz - toSZ * ly;
        const crossY = toSZ * lx - toSX * lz;
        const crossZ = toSX * ly - toSY * lx;
        const crossLen = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);

        // t along light direction to closest approach
        const tClosest = toSX * lx + toSY * ly + toSZ * lz;

        if (crossLen < smallR * 1.1 && tClosest > 0) {
          // In shadow — darken proportional to how centered
          const shadowStrength = Math.max(0, 1 - crossLen / (smallR * 1.1));
          v *= (1 - shadowStrength * 0.6);
        }

        v = Math.max(0, Math.min(1, v));
        v = v * v * (3 - 2 * v);

        if (x >= 0 && x < 128 && y >= 0 && y < 128) {
          pc.setPixel(x, y, tone(Math.max(0.02, v)));
        }
      }
    }

    // Small sphere (in front/above)
    for (let y = smallCY - smallR; y <= smallCY + smallR; y++) {
      for (let x = smallCX - smallR; x <= smallCX + smallR; x++) {
        const dx = x - smallCX, dy = y - smallCY;
        if (dx * dx + dy * dy > smallR * smallR) continue;

        const nx = dx / smallR, ny = dy / smallR;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const rz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rz), 50) * 0.7;
        const ambient = 0.03;

        let core = 0;
        if (NdotL >= -0.03 && NdotL <= 0.16) {
          core = Math.max(0, 1 - Math.abs(NdotL - 0.05) / 0.11) * 0.07;
        }

        let v = ambient + diffuse * 0.72 + specular - core;
        v = Math.max(0, Math.min(1, v));
        v = v * v * (3 - 2 * v);

        if (x >= 0 && x < 128 && y >= 0 && y < 128) {
          pc.setPixel(x, y, tone(Math.max(0.02, v)));
        }
      }
    }

    // Big sphere cast shadow on ground
    for (let y = groundY; y < groundY + 8; y++) {
      for (let x = bigCX; x < bigCX + 45; x++) {
        if (x >= 128 || y >= 128) continue;
        const dx = (x - (bigCX + 20)) / 25, dy = (y - (groundY + 3)) / 5;
        const d = dx * dx + dy * dy;
        if (d < 1) pc.setPixel(x, y, tone(Math.max(0.03, 0.2 * (0.5 + d * 0.5))));
      }
    }
  },
};
