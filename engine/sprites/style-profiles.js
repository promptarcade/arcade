// ============================================================
// Style Profiles — resolution and quality constraints per art tier
// ============================================================
//
// These are CONSTRAINTS, not templates. They define the quality floor
// for a given art tier. Draw code is still custom per-game — the
// profile just ensures consistency.
//
// Usage:
//   const profile = StyleProfiles.get('illustrated');
//   // profile.resolution.character -> { minW: 96, minH: 128, recommended: { w: 128, h: 192 } }
//   // profile.outline -> { weight: 2, mode: 'tinted' }
//   // profile.shading -> { tones: 4, hueShift: true }
//   // profile.rendering -> { smoothing: true, supersample: 1 }
//
// Profiles can be overridden per-game:
//   const custom = StyleProfiles.extend('illustrated', { outline: { weight: 3 } });

'use strict';

const StyleProfiles = {
  profiles: {
    pixel: {
      name: 'Pixel',
      description: 'Classic retro pixel art. Crispy edges, minimal detail, nostalgic.',
      resolution: {
        character: { minW: 16, minH: 24, recommended: { w: 24, h: 32 } },
        creature:  { minW: 16, minH: 16, recommended: { w: 24, h: 24 } },
        prop:      { minW: 16, minH: 16, recommended: { w: 24, h: 24 } },
        terrain:   { tileSize: 16 },
      },
      palette: {
        tonesPerColor: 4,
        maxColorGroups: 6,
        hueShift: false,
      },
      outline: {
        weight: 1,
        mode: 'black',
      },
      shading: {
        tones: 3,
        hueShift: false,
        lightDir: { x: -0.7, y: -0.7 },
      },
      rendering: {
        smoothing: false,
        supersample: 1,
      },
      features: {
        ears: false,
        hands: false,
        detailedEyes: false,
        mouth: false,
        texture: false,
      },
      referenceGames: ['Celeste', 'Undertale', 'Shovel Knight'],
    },

    chibi: {
      name: 'Chibi',
      description: 'Proportioned pixel art with personality. Tinted outlines, 4-tone shading, readable features.',
      resolution: {
        character: { minW: 32, minH: 40, recommended: { w: 32, h: 48 } },
        creature:  { minW: 24, minH: 24, recommended: { w: 32, h: 32 } },
        prop:      { minW: 24, minH: 24, recommended: { w: 32, h: 32 } },
        terrain:   { tileSize: 32 },
      },
      palette: {
        tonesPerColor: 4,
        maxColorGroups: 8,
        hueShift: true,
      },
      outline: {
        weight: 1,
        mode: 'tinted',
      },
      shading: {
        tones: 4,
        hueShift: true,
        lightDir: { x: -0.7, y: -0.7 },
      },
      rendering: {
        smoothing: false,
        supersample: 1,
      },
      features: {
        ears: true,
        hands: true,
        detailedEyes: true,
        mouth: true,
        texture: true,
      },
      referenceGames: ['Stardew Valley', 'Moonlighter', 'Eastward'],
    },

    illustrated: {
      name: 'Illustrated',
      description: 'High-detail sprites with smooth curves. Enough resolution for armour detail, facial expression, environmental storytelling.',
      resolution: {
        character: { minW: 96, minH: 128, recommended: { w: 128, h: 192 } },
        creature:  { minW: 64, minH: 64, recommended: { w: 96, h: 96 } },
        prop:      { minW: 48, minH: 48, recommended: { w: 64, h: 64 } },
        terrain:   { tileSize: 64 },
      },
      palette: {
        tonesPerColor: 6,
        maxColorGroups: 12,
        hueShift: true,
      },
      outline: {
        weight: 2,
        mode: 'tinted',
      },
      shading: {
        tones: 4,
        hueShift: true,
        lightDir: { x: -0.7, y: -0.7 },
      },
      rendering: {
        smoothing: true,
        supersample: 1,
      },
      features: {
        ears: true,
        hands: true,
        detailedEyes: true,
        mouth: true,
        texture: true,
        equipmentSlots: true,
        facialExpression: true,
      },
      referenceGames: ['Moonlighter (HD)', 'Hyper Light Drifter', 'Diablo'],
    },

    hd: {
      name: 'HD',
      description: 'Maximum detail. Painterly sprites at 256px+. Full anti-aliasing, gradient shading, fine detail.',
      resolution: {
        character: { minW: 192, minH: 256, recommended: { w: 256, h: 384 } },
        creature:  { minW: 128, minH: 128, recommended: { w: 192, h: 192 } },
        prop:      { minW: 96, minH: 96, recommended: { w: 128, h: 128 } },
        terrain:   { tileSize: 128 },
      },
      palette: {
        tonesPerColor: 8,
        maxColorGroups: 16,
        hueShift: true,
      },
      outline: {
        weight: 3,
        mode: 'tinted',
      },
      shading: {
        tones: 4,
        hueShift: true,
        lightDir: { x: -0.7, y: -0.7 },
      },
      rendering: {
        smoothing: true,
        supersample: 2,
      },
      features: {
        ears: true,
        hands: true,
        detailedEyes: true,
        mouth: true,
        texture: true,
        equipmentSlots: true,
        facialExpression: true,
        subPixelDetail: true,
      },
      referenceGames: ['Recettear', 'Sneaky Sasquatch', 'Octopath Traveler'],
    },
  },

  get(name) {
    const profile = this.profiles[name];
    if (!profile) throw new Error('Unknown style profile: ' + name + '. Available: ' + Object.keys(this.profiles).join(', '));
    return JSON.parse(JSON.stringify(profile));
  },

  extend(baseName, overrides) {
    const base = this.get(baseName);
    return deepMerge(base, overrides);
  },

  list() {
    return Object.entries(this.profiles).map(([key, p]) => ({
      key,
      name: p.name,
      description: p.description,
      characterSize: p.resolution.character.recommended,
      referenceGames: p.referenceGames,
    }));
  },

  getRecommendedSize(profileName, entityType) {
    const profile = this.get(profileName);
    const res = profile.resolution[entityType];
    if (!res) return profile.resolution.prop.recommended;
    return res.recommended || { w: res.tileSize, h: res.tileSize };
  },

  validate(profileName, entityType, width, height) {
    const profile = this.get(profileName);
    const res = profile.resolution[entityType];
    if (!res) return { valid: true };

    const issues = [];
    if (res.minW && width < res.minW) {
      issues.push('Width ' + width + ' below minimum ' + res.minW + ' for ' + profileName + ' ' + entityType);
    }
    if (res.minH && height < res.minH) {
      issues.push('Height ' + height + ' below minimum ' + res.minH + ' for ' + profileName + ' ' + entityType);
    }
    return { valid: issues.length === 0, issues };
  },
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StyleProfiles;
}
if (typeof window !== 'undefined') {
  window.StyleProfiles = StyleProfiles;
}
