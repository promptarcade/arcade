// A1: The Minimal Face — 6 expressions on 16x16 heads
// Goal: Each expression distinguishable at 1x without labels
// Layout: 6 heads in a row (96x16 total)
module.exports = {
  width: 108, // 6 heads × 16px + 5×2px gap + 2px padding each side
  height: 20, // 16 + 2px top/bottom padding
  style: 'pixel',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    skin: '#f0b878',
    skinShd: '#c08050',
    hair: '#553322',
    hairShd: '#331a0f',
    eye: '#222233',
    eyeWhite: '#eeeef4',
    mouth: '#884444',
    brow: '#443322',
    blush: '#e08888',
  },
  draw(pc, pal) { pc.setPixel(0, 0, 1); },
  drawPost(pc, pal) {
    pc.pixels[0] = 0;

    const g = pal.groups;
    const skin = g.skin, skinS = g.skinShd, hair = g.hair, hairS = g.hairShd;
    const eye = g.eye, ew = g.eyeWhite, mouth = g.mouth, brow = g.brow, blush = g.blush;

    function tone(group, f) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1, Math.round(f * (group.toneCount - 1))));
    }

    // Light direction
    const lx = -0.6, ly = -0.7;

    function drawHead(ox, oy, expression) {
      // Head: 12x12 oval centered in 16x16, top at y=1
      const cx = ox + 7, cy = oy + 8;
      const rx = 6, ry = 7;

      // Fill head with lit skin
      for (let y = oy; y < oy + 16; y++) {
        for (let x = ox; x < ox + 16; x++) {
          const nx = (x - cx) / rx, ny = (y - cy) / ry;
          const dist = nx * nx + ny * ny;
          if (dist <= 1.0) {
            const nz = Math.sqrt(Math.max(0, 1 - dist));
            const dot = nx * lx + ny * ly + nz * 0.5;
            const v = Math.max(0.15, Math.min(1, dot * 0.5 + 0.55));
            if (v > 0.4) {
              pc.setPixel(x, y, tone(skin, v));
            } else {
              pc.setPixel(x, y, tone(skinS, v + 0.3));
            }
          }
        }
      }

      // Hair — top dome covering upper 40% of head
      for (let y = oy; y < oy + 7; y++) {
        for (let x = ox; x < ox + 16; x++) {
          const nx = (x - cx) / (rx + 1), ny = (y - (cy - 2)) / 6;
          const dist = nx * nx + ny * ny;
          if (dist <= 1.0 && y < cy - 1) {
            const v = Math.max(0.2, Math.min(1, ((x - cx) * lx + (y - cy) * ly) * 0.04 + 0.6));
            pc.setPixel(x, y, tone(hair, v));
          }
        }
      }

      // Eyes — position at y = cy (vertical centre of head)
      const eyeY = cy - 1;
      const leftEyeX = cx - 3;
      const rightEyeX = cx + 1;

      if (expression === 'neutral' || expression === 'angry' || expression === 'happy') {
        // Normal open eyes: 2x2 each
        // Left eye
        pc.setPixel(leftEyeX, eyeY, tone(ew, 0.9));
        pc.setPixel(leftEyeX + 1, eyeY, tone(ew, 0.9));
        pc.setPixel(leftEyeX, eyeY + 1, tone(eye, 0.3));
        pc.setPixel(leftEyeX + 1, eyeY + 1, tone(eye, 0.3));
        // Right eye
        pc.setPixel(rightEyeX, eyeY, tone(ew, 0.9));
        pc.setPixel(rightEyeX + 1, eyeY, tone(ew, 0.9));
        pc.setPixel(rightEyeX, eyeY + 1, tone(eye, 0.3));
        pc.setPixel(rightEyeX + 1, eyeY + 1, tone(eye, 0.3));
        // Specular — upper left pixel of each eye
        pc.setPixel(leftEyeX, eyeY, tone(ew, 1.0));
        pc.setPixel(rightEyeX, eyeY, tone(ew, 1.0));
      }

      if (expression === 'sad') {
        // Half-closed eyes: lower lid raised 1px
        pc.setPixel(leftEyeX, eyeY, tone(skinS, 0.5)); // lid
        pc.setPixel(leftEyeX + 1, eyeY, tone(skinS, 0.5));
        pc.setPixel(leftEyeX, eyeY + 1, tone(eye, 0.3));
        pc.setPixel(leftEyeX + 1, eyeY + 1, tone(eye, 0.3));
        pc.setPixel(rightEyeX, eyeY, tone(skinS, 0.5));
        pc.setPixel(rightEyeX + 1, eyeY, tone(skinS, 0.5));
        pc.setPixel(rightEyeX, eyeY + 1, tone(eye, 0.3));
        pc.setPixel(rightEyeX + 1, eyeY + 1, tone(eye, 0.3));
      }

      if (expression === 'surprised') {
        // Enlarged eyes: 3x3
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = 0; dx <= 2; dx++) {
            // Left eye
            const isEdge = dy === -1 || dy === 1 || dx === 0 || dx === 2;
            pc.setPixel(leftEyeX - 1 + dx, eyeY + dy, isEdge ? tone(ew, 0.9) : tone(eye, 0.2));
            // Right eye
            pc.setPixel(rightEyeX + dx, eyeY + dy, isEdge ? tone(ew, 0.9) : tone(eye, 0.2));
          }
        }
        // Pupil centre
        pc.setPixel(leftEyeX, eyeY, tone(eye, 0.2));
        pc.setPixel(rightEyeX + 1, eyeY, tone(eye, 0.2));
        // Specular
        pc.setPixel(leftEyeX - 1, eyeY - 1, tone(ew, 1.0));
        pc.setPixel(rightEyeX, eyeY - 1, tone(ew, 1.0));
      }

      if (expression === 'wink') {
        // Left eye: closed (horizontal line)
        pc.setPixel(leftEyeX, eyeY + 1, tone(eye, 0.3));
        pc.setPixel(leftEyeX + 1, eyeY + 1, tone(eye, 0.3));
        // Right eye: normal open
        pc.setPixel(rightEyeX, eyeY, tone(ew, 0.9));
        pc.setPixel(rightEyeX + 1, eyeY, tone(ew, 1.0));
        pc.setPixel(rightEyeX, eyeY + 1, tone(eye, 0.3));
        pc.setPixel(rightEyeX + 1, eyeY + 1, tone(eye, 0.3));
      }

      // Eyebrows (expression-specific)
      if (expression === 'angry') {
        // Angled inward: \ / shape
        pc.setPixel(leftEyeX, eyeY - 2, tone(brow, 0.4));
        pc.setPixel(leftEyeX + 1, eyeY - 1, tone(brow, 0.4));
        pc.setPixel(rightEyeX + 1, eyeY - 2, tone(brow, 0.4));
        pc.setPixel(rightEyeX, eyeY - 1, tone(brow, 0.4));
      } else if (expression === 'sad') {
        // Angled outward: / \ shape (opposite of angry)
        pc.setPixel(leftEyeX + 1, eyeY - 2, tone(brow, 0.4));
        pc.setPixel(leftEyeX, eyeY - 1, tone(brow, 0.4));
        pc.setPixel(rightEyeX, eyeY - 2, tone(brow, 0.4));
        pc.setPixel(rightEyeX + 1, eyeY - 1, tone(brow, 0.4));
      } else if (expression === 'surprised') {
        // Raised high: horizontal lines above enlarged eyes
        pc.setPixel(leftEyeX - 1, eyeY - 3, tone(brow, 0.4));
        pc.setPixel(leftEyeX, eyeY - 3, tone(brow, 0.4));
        pc.setPixel(rightEyeX, eyeY - 3, tone(brow, 0.4));
        pc.setPixel(rightEyeX + 1, eyeY - 3, tone(brow, 0.4));
      }

      // Mouth
      const mouthY = cy + 3;
      if (expression === 'happy') {
        // Smile: curved up — v shape
        pc.setPixel(cx - 2, mouthY, tone(mouth, 0.5));
        pc.setPixel(cx - 1, mouthY + 1, tone(mouth, 0.5));
        pc.setPixel(cx, mouthY + 1, tone(mouth, 0.5));
        pc.setPixel(cx + 1, mouthY, tone(mouth, 0.5));
      } else if (expression === 'sad') {
        // Frown: curved down — ^ shape
        pc.setPixel(cx - 2, mouthY + 1, tone(mouth, 0.5));
        pc.setPixel(cx - 1, mouthY, tone(mouth, 0.5));
        pc.setPixel(cx, mouthY, tone(mouth, 0.5));
        pc.setPixel(cx + 1, mouthY + 1, tone(mouth, 0.5));
      } else if (expression === 'surprised') {
        // Open mouth: small circle
        pc.setPixel(cx - 1, mouthY, tone(mouth, 0.3));
        pc.setPixel(cx, mouthY, tone(mouth, 0.3));
        pc.setPixel(cx - 1, mouthY + 1, tone(mouth, 0.3));
        pc.setPixel(cx, mouthY + 1, tone(mouth, 0.3));
      } else if (expression === 'angry') {
        // Tight line
        pc.setPixel(cx - 1, mouthY, tone(mouth, 0.4));
        pc.setPixel(cx, mouthY, tone(mouth, 0.4));
      } else if (expression === 'wink') {
        // Playful smile — same as happy but shifted
        pc.setPixel(cx - 1, mouthY, tone(mouth, 0.5));
        pc.setPixel(cx, mouthY + 1, tone(mouth, 0.5));
        pc.setPixel(cx + 1, mouthY, tone(mouth, 0.5));
      } else {
        // Neutral: short horizontal line
        pc.setPixel(cx - 1, mouthY, tone(mouth, 0.4));
        pc.setPixel(cx, mouthY, tone(mouth, 0.4));
        pc.setPixel(cx + 1, mouthY, tone(mouth, 0.4));
      }
    }

    const expressions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'wink'];
    for (let i = 0; i < expressions.length; i++) {
      const ox = 2 + i * 18; // 16px head + 2px gap
      drawHead(ox, 2, expressions[i]);
    }
  },
};
