var T = { VOID:0, WALL:1, FLOOR:2, CORRIDOR:3, DOOR:4, STAIRS:5, SHRINE:6, REST:7, WATER:10, LAVA:11, ICE:12, OIL:13, FUNGAL:14, LOOT:15, STAIRS_UP:16, BEACH:17, SHALLOWS:18 };

// ============================================================
// EQUIPMENT / LOOT
// ============================================================
var WEAPON_TYPES = {
  sword:  { name:'Sword',  type:'weapon', slot:'weapon', range:1, baseDmg:5, cd:0, desc:'Melee attack' },
  wand:   { name:'Wand',   type:'weapon', slot:'weapon', range:2, baseDmg:4, cd:1, desc:'Ranged shot (2 tiles)' },
  staff:  { name:'Healing Staff', type:'weapon', slot:'weapon', range:0, baseDmg:0, cd:5, desc:'Heals 25% HP, no attack' },
};
var ARMOR_DEFS=[
  { name:'Leather Vest', color:'#8a6a3a' },
  { name:'Chain Mail',   color:'#888899' },
  { name:'Iron Plate',   color:'#7788aa' },
  { name:'Shadow Cloak', color:'#443366' },
  { name:'Crystal Ward', color:'#66aacc' },
  { name:'Bone Armor',   color:'#aaa088' },
];

// Loot tables — deeper floors unlock rarer tiers
// Each entry: { weight, minFloor, generate(floor) -> loot object }
var LOOT_TABLE = [
  // --- COMMON (floor 1+) ---
  { weight: 20, minFloor: 1, generate: function(f) {
    var types = ['sword','wand'];
    var base = WEAPON_TYPES[types[Math.floor(Math.random()*types.length)]];
    var bonus = Math.floor(f*0.8) + Math.floor(Math.random()*3);
    // Weapon colour shifts with power level
    var wpnColors = base.range > 1
      ? ['#6688ff','#5588dd','#7799ff','#4477cc','#88aaff']
      : ['#ddaa44','#cc9933','#eecc55','#bb8822','#ffdd66'];
    var wc = wpnColors[Math.min(bonus, wpnColors.length - 1)];
    return { type:'weapon', slot:'weapon', name:base.name+' +'+bonus, range:base.range,
      damage:base.baseDmg+bonus, cd:base.cd, desc:base.desc, atk:bonus,
      color:wc };
  }},
  { weight: 20, minFloor: 1, generate: function(f) {
    var def = 1 + Math.floor(f*0.5) + Math.floor(Math.random()*2);
    var armorDef = ARMOR_DEFS[Math.floor(Math.random()*ARMOR_DEFS.length)];
    var name = armorDef.name + ' +' + def;
    return { type:'armor', slot:'armor', name:name, defense:def, hp:def*3,
      color:armorDef.color, desc:'DEF +'+def };
  }},
  // --- RESOURCES (floor 1+) ---
  { weight: 15, minFloor: 1, generate: function(f) {
    var count = 1 + Math.floor(Math.random() * f);
    return { type:'resource', id:'healing_salve', count:count, name:'Healing Salve x'+count, color:'#44dd88', desc:'Restores HP' };
  }},
  { weight: 10, minFloor: 2, generate: function(f) {
    return { type:'resource', id:'health_potion', count:1, name:'Health Potion', color:'#ff4488', desc:'Restores 50% HP' };
  }},
  // --- UNCOMMON (floor 3+) ---
  { weight: 8, minFloor: 3, generate: function(f) {
    var count = 1 + Math.floor(Math.random() * Math.min(3, f / 2));
    return { type:'resource', id:'copper_ore', count:count, name:'Copper Ore x'+count, color:'#cc7744', desc:'Smelting material' };
  }},
  { weight: 6, minFloor: 3, generate: function(f) {
    return { type:'resource', id:'iron_ore', count:1+Math.floor(Math.random()*2), name:'Iron Ore', color:'#8888aa', desc:'Valuable ore' };
  }},
  { weight: 5, minFloor: 3, generate: function(f) {
    // Fallen explorer's weapon — named, stronger
    var names = ['Rusted Blade','Broken Halberd','Tarnished Rapier','Cracked Mace','Bent Falchion'];
    var name = names[Math.floor(Math.random()*names.length)];
    var bonus = Math.floor(f*1.2) + 2;
    return { type:'weapon', slot:'weapon', name:name, range:1,
      damage:5+bonus, cd:0, desc:'Found on a fallen explorer', atk:bonus,
      color:'#aa8866' };
  }},
  // --- RARE (floor 5+) ---
  { weight: 6, minFloor: 5, generate: function(f) {
    var crystals = [
      { name:'Fire Crystal', color:'#ff6622', element:'fire', desc:'Burns with inner flame' },
      { name:'Ice Crystal', color:'#66ccff', element:'ice', desc:'Cold to the touch' },
      { name:'Storm Crystal', color:'#ffff44', element:'lightning', desc:'Crackles with energy' },
      { name:'Shadow Crystal', color:'#aa44ff', element:'void', desc:'Absorbs light' },
    ];
    var c = crystals[Math.floor(Math.random()*crystals.length)];
    return { type:'resource', id:'crystal_'+c.element, count:1, name:c.name, color:c.color, desc:c.desc };
  }},
  { weight: 5, minFloor: 5, generate: function(f) {
    var count = 1 + Math.floor(f / 4);
    return { type:'resource', id:'gem', count:count, name:'Gem x'+count, color:'#44ddff', desc:'Precious gemstone' };
  }},
  { weight: 3, minFloor: 5, generate: function(f) {
    // Explorer's armor — stronger than normal
    var names = ['Warden\'s Chestplate','Ranger\'s Leathers','Mage\'s Robes','Knight\'s Mail'];
    var name = names[Math.floor(Math.random()*names.length)];
    var def = 3 + Math.floor(f * 0.7);
    return { type:'armor', slot:'armor', name:name, defense:def, hp:def*4,
      color:'#ccaa44', desc:'Worn by a lost adventurer' };
  }},
  // --- EPIC (floor 8+) ---
  { weight: 2, minFloor: 8, generate: function(f) {
    var scrolls = [
      { name:'Scroll of Fireball', ability:{ verb:'launch',element:'fire',shape:'area',name:'Fireball',damage:15+f*2,cooldown:4,currentCooldown:0,color:'#ff6622' }},
      { name:'Scroll of Blizzard', ability:{ verb:'place',element:'ice',shape:'area',name:'Blizzard',damage:12+f*2,cooldown:4,currentCooldown:0,color:'#66ccff' }},
      { name:'Scroll of Thunder', ability:{ verb:'launch',element:'lightning',shape:'line',name:'Thunder Bolt',damage:20+f*2,cooldown:3,currentCooldown:0,color:'#ffff44' }},
      { name:'Scroll of Void', ability:{ verb:'drain',element:'void',shape:'single',name:'Void Drain',damage:18+f*2,cooldown:3,currentCooldown:0,color:'#aa44ff' }},
    ];
    var s = scrolls[Math.floor(Math.random()*scrolls.length)];
    return { type:'scroll', name:s.name, ability:s.ability, color:s.ability.color, desc:'Teaches a powerful ability' };
  }},
  { weight: 2, minFloor: 8, generate: function(f) {
    return { type:'resource', id:'gold_bar', count:1+Math.floor(f/4), name:'Gold Bar', color:'#ffcc22', desc:'Pure gold ingot' };
  }},
  // --- LEGENDARY (floor 12+) ---
  { weight: 1, minFloor: 12, generate: function(f) {
    var legendaries = [
      { name:'Soulreaver', damage:25+f*2, color:'#ff22ff', desc:'Drains life on hit', range:1 },
      { name:'Starfall Wand', damage:20+f*2, color:'#ffff88', desc:'Fires piercing bolts', range:3 },
      { name:'Void Edge', damage:30+f*2, color:'#8844ff', desc:'Cuts through reality', range:1 },
    ];
    var l = legendaries[Math.floor(Math.random()*legendaries.length)];
    return { type:'weapon', slot:'weapon', name:l.name, range:l.range,
      damage:l.damage, cd:l.range>1?1:0, desc:l.desc, atk:l.damage-5,
      color:l.color };
  }},
  { weight: 1, minFloor: 12, generate: function(f) {
    return { type:'resource', id:'gem', count:3+Math.floor(f/3), name:'Gem Cache', color:'#44ddff', desc:'A trove of precious gems' };
  }},
];

// Register crystal resources
ResourceRegistry.add({ id: 'crystal_fire', name: 'Fire Crystal', color: '#ff6622', category: 'crystal', stackMax: 10 });
ResourceRegistry.add({ id: 'crystal_ice', name: 'Ice Crystal', color: '#66ccff', category: 'crystal', stackMax: 10 });
ResourceRegistry.add({ id: 'crystal_lightning', name: 'Storm Crystal', color: '#ffff44', category: 'crystal', stackMax: 10 });
ResourceRegistry.add({ id: 'crystal_void', name: 'Shadow Crystal', color: '#aa44ff', category: 'crystal', stackMax: 10 });

function generateLoot(floor) {
  // Filter table by floor, then weighted random pick
  var available = [];
  var totalWeight = 0;
  for (var i = 0; i < LOOT_TABLE.length; i++) {
    if (floor >= LOOT_TABLE[i].minFloor) {
      available.push(LOOT_TABLE[i]);
      totalWeight += LOOT_TABLE[i].weight;
    }
  }
  if (available.length === 0) return null;
  var roll = Math.random() * totalWeight;
  var cumulative = 0;
  for (var i = 0; i < available.length; i++) {
    cumulative += available[i].weight;
    if (roll < cumulative) return available[i].generate(floor);
  }
  return available[available.length - 1].generate(floor);
}

// ============================================================
// BIOMES
// ============================================================
var BIOMES = [
  { name:'Upper Crypts', floorType:'stone', wallColor:'#3a3530', accent:'#554433', ambientColor:'#020204', ambientIntensity:0.05, lightColor:'#ff9944', hazardTiles:[], hazardChance:0,
    floorPal:{base:'#3a3530',dark:'#2a2520',light:'#4a4540',detail:'#353025'} },
  { name:'Flooded Depths', floorType:'stone', wallColor:'#1a2535', accent:'#2244aa', ambientColor:'#010208', ambientIntensity:0.05, lightColor:'#6688cc', hazardTiles:[T.WATER], hazardChance:0.15,
    floorPal:{base:'#1a2530',dark:'#101a25',light:'#253040',detail:'#182028'} },
  { name:'Fungal Hive', floorType:'dirt', wallColor:'#1a2a18', accent:'#44aa66', ambientColor:'#010401', ambientIntensity:0.05, lightColor:'#66ff88', hazardTiles:[T.FUNGAL], hazardChance:0.12,
    floorPal:{base:'#2a3518',dark:'#1a2510',light:'#354520',detail:'#253015'} },
  { name:'Infernal Pit', floorType:'stone', wallColor:'#30180e', accent:'#ff4422', ambientColor:'#040101', ambientIntensity:0.05, lightColor:'#ff6622', hazardTiles:[T.LAVA,T.OIL], hazardChance:0.12,
    floorPal:{base:'#2a1510',dark:'#1a0a08',light:'#3a2018',detail:'#251210'} },
  { name:'Void Abyss', floorType:'stone', wallColor:'#1a1025', accent:'#8844ff', ambientColor:'#020104', ambientIntensity:0.05, lightColor:'#aa66ff', hazardTiles:[T.WATER,T.LAVA,T.FUNGAL], hazardChance:0.1,
    floorPal:{base:'#15101a',dark:'#0a0810',light:'#201520',detail:'#120e18'} },
  { name:'Dragon\'s Maw', floorType:'stone', wallColor:'#2a1008', accent:'#dd2200', ambientColor:'#040100', ambientIntensity:0.04, lightColor:'#ff4400', hazardTiles:[T.LAVA], hazardChance:0.18,
    floorPal:{base:'#201008',dark:'#100804',light:'#2a1810',detail:'#180c06'} },
];
// Each biome spans 2 floors; deepest biome repeats
function getBiome(floor) { return BIOMES[Math.min(BIOMES.length - 1, Math.floor((floor - 1) / 2))]; }

