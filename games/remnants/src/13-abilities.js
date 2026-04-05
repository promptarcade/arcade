// ============================================================
// SPRITE GENERATION
// ============================================================
var _spriteCache = {};

function getPlayerSprite() {
  if (_spriteCache.player) return _spriteCache.player;
  _spriteCache.player = SpriteForge.character({
    style:'humanoid', size:CONFIG.TILE,
    colors:{ body:'#3388dd', hair:'#2266aa', outfit:'#2255aa', outfitSecondary:'#44aaff' },
    head:{ shape:'round', size:'normal', hair:'short' },
    eyes:{ style:'dot', color:'#ffffff' },
    outfit:{ torso:'tunic', legs:'pants' },
    equipment:{ weapon:'sword' },
    animations:{ idle:{frames:2,speed:0.3}, walk:{frames:4,speed:0.12}, attack:{frames:3,speed:0.08}, hurt:{frames:1,speed:0.1} },
  });
  return _spriteCache.player;
}

function getEnemySprite(archetype, color) {
  var key = 'enemy_' + archetype + '_' + color;
  if (_spriteCache[key]) return _spriteCache[key];
  var style = 'creature', bodyBuild = 'medium';
  var head = { shape:'round', size:'normal' };
  var outfit = { torso:'none', legs:'none' };
  var equip = { weapon:'none' };
  if (archetype === 'shambler') { style='creature'; bodyBuild='large'; }
  else if (archetype === 'stalker') { style='creature'; bodyBuild='slim'; }
  else if (archetype === 'caster') { style='humanoid'; outfit={torso:'robe',legs:'none'}; equip={weapon:'staff'}; }
  else if (archetype === 'swarm') { style='creature'; head={shape:'round',size:'chibi'}; }
  else if (archetype === 'brute') { style='creature'; bodyBuild='large'; }
  else if (archetype === 'dragon') { style='creature'; bodyBuild='large'; }
  _spriteCache[key] = SpriteForge.character({
    style:style, size:CONFIG.TILE,
    colors:{ body:color, hair:color, outfit:color, outfitSecondary:color },
    body:{ build:bodyBuild },
    head:head, outfit:outfit, equipment:equip,
    animations:{ idle:{frames:2,speed:0.25}, walk:{frames:4,speed:0.1}, attack:{frames:2,speed:0.08}, hurt:{frames:1,speed:0.1} },
  });
  return _spriteCache[key];
}

function getTerrainSprites(biome) {
  var key = 'terrain_' + biome.name;
  if (_spriteCache[key]) return _spriteCache[key];
  _spriteCache[key] = {
    floor: SpriteForge.terrain({ type:biome.floorType, tileSize:CONFIG.TILE, variation:3, palette:biome.floorPal }),
    corridor: SpriteForge.terrain({ type:'dirt', tileSize:CONFIG.TILE, variation:3, palette:biome.floorPal }),
    water: SpriteForge.terrain({ type:'water', tileSize:CONFIG.TILE, variation:3 }),
    lava: SpriteForge.terrain({ type:'lava', tileSize:CONFIG.TILE, variation:3 }),
    snow: SpriteForge.terrain({ type:'snow', tileSize:CONFIG.TILE, variation:3 }),
  };
  return _spriteCache[key];
}

function getItemSprites() {
  if (_spriteCache.items) return _spriteCache.items;
  _spriteCache.items = {
    stairs: SpriteForge.prop({ name:'stairs', size:CONFIG.TILE, palette:{ primary:'#ffcc44', secondary:'#aa8822' } }),
    shrine: SpriteForge.prop({ name:'crystal', size:CONFIG.TILE, palette:{ primary:'#aa44ff', secondary:'#6622cc' } }),
    rest: SpriteForge.prop({ name:'campfire', size:CONFIG.TILE, palette:{ primary:'#44ff88', secondary:'#22aa44' }, animated:true, animFrames:4, animSpeed:0.2 }),
  };
  return _spriteCache.items;
}

function drawSpriteFrame(ctx, spriteData, frameIdx, x, y, w, h) {
  var frame = spriteData.sheet.getFrame(frameIdx % spriteData.sheet.frameCount);
  ctx.drawImage(frame.canvas, frame.x, frame.y, frame.w, frame.h, x, y, w, h);
}

