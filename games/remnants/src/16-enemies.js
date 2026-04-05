// ============================================================
// ENEMIES — dungeon monsters, increasingly hellish with depth
// ============================================================
var ARCHETYPES={
  shambler:{hp:20,atk:4,speed:0.35,behavior:'slow'},
  stalker:{hp:8,atk:6,speed:1.5,behavior:'flank'},
  caster:{hp:10,atk:5,speed:0.8,behavior:'ranged',range:4},
  swarm:{hp:4,atk:2,speed:1,behavior:'swarm'},
  brute:{hp:40,atk:10,speed:0.7,behavior:'telegraph'},
  dragon:{hp:80,atk:15,speed:0.6,behavior:'telegraph',range:3},
};

// Biome 0: Upper Crypts (floors 1-2) — undead, vermin
// Biome 1: Flooded Depths (floors 3-4) — drowned horrors
// Biome 2: Fungal Hive (floors 5-6) — corrupted nature
// Biome 3: Infernal Pit (floors 7-9) — demons, fire
// Biome 4: Void Abyss (floors 10-12) — eldritch, madness
// Biome 5: Dragon's Maw (floors 13+) — draconic, legendary
var BIOME_NAMES=[
  {shambler:'Zombie',     stalker:'Giant Spider', caster:'Necromancer', swarm:'Bat Swarm',    brute:'Flesh Golem',  dragon:'Bone Wyrm'},
  {shambler:'Drowned One',stalker:'Cave Crawler', caster:'Sea Witch',  swarm:'Leech Swarm',  brute:'Bloated Horror',dragon:'Hydra'},
  {shambler:'Corpse Vine',stalker:'Phase Spider', caster:'Spore Shaman',swarm:'Plague Flies', brute:'Troll',        dragon:'Basilisk'},
  {shambler:'Hell Knight',stalker:'Imp',          caster:'Warlock',    swarm:'Soul Wisps',   brute:'Pit Fiend',    dragon:'Infernal Drake'},
  {shambler:'Wraith',     stalker:'Shadow Stalker',caster:'Lich',      swarm:'Void Motes',   brute:'Abomination',  dragon:'Elder Wyrm'},
  {shambler:'Death Knight',stalker:'Hellhound',   caster:'Arch-Lich',  swarm:'Doom Swarm',   brute:'Balor',        dragon:'Ancient Dragon'},
];
var BIOME_COLORS=[
  {shambler:'#88aa77',stalker:'#554422',caster:'#7744aa',swarm:'#665544',brute:'#888866',dragon:'#ccbb88'},
  {shambler:'#447788',stalker:'#336655',caster:'#5588aa',swarm:'#445566',brute:'#556677',dragon:'#4488aa'},
  {shambler:'#558833',stalker:'#664488',caster:'#448855',swarm:'#778833',brute:'#557733',dragon:'#668844'},
  {shambler:'#cc4422',stalker:'#ff6644',caster:'#aa2244',swarm:'#ff8844',brute:'#882211',dragon:'#ff4400'},
  {shambler:'#6644aa',stalker:'#8855cc',caster:'#5533aa',swarm:'#7744bb',brute:'#443388',dragon:'#9955ff'},
  {shambler:'#aa3333',stalker:'#cc5522',caster:'#882266',swarm:'#cc4444',brute:'#661111',dragon:'#dd2200'},
];
var BOSS_NAMES=['The Warden','Leviathan','Sporewyrm','Inferno Lord','Void Harbinger','The Ancient One'];

function getBiomeIndex(floor) { return Math.min(BIOME_NAMES.length - 1, Math.floor((floor - 1) / 2)); }

function Enemy(x,y,arch,floor,bIdx){
  var base=ARCHETYPES[arch]; this.x=x;this.y=y;this.archetype=arch;
  this.name=BIOME_NAMES[bIdx][arch]; this.color=BIOME_COLORS[bIdx][arch];
  this.behavior=base.behavior; this.range=base.range||1;
  this.maxHp=Math.round(base.hp*Math.pow(1.15,floor)); this.hp=this.maxHp;
  this.atk=Math.round(base.atk*Math.pow(1.12,floor)); this.alive=true;
  this.hitFlash=0; this.speed=base.speed; this.moveAccum=0;
  this.telegraphing=false; this.telegraphDir=null;
  this.frozen=0; this.poisoned=0; this.burning=0; this.wet=false; this.isBoss=false;
  this.sprite=getEnemySprite(arch,this.color);
  this.animFrame=0; this.animTimer=Math.random()*10;
}

function createBoss(x,y,floor,bIdx){
  // Deep floors get dragon bosses
  var arch = (floor >= 10 && Math.random() < 0.5) ? 'dragon' : 'brute';
  var e=new Enemy(x,y,arch,floor,bIdx);
  e.isBoss=true; e.name=BOSS_NAMES[bIdx]||'Ancient Horror';
  e.maxHp=Math.round(e.maxHp*2.5); e.hp=e.maxHp;
  e.atk=Math.round(e.atk*1.5); e.color='#ff2222';
  e.sprite=getEnemySprite(arch,'#ff2222');
  return e;
}
