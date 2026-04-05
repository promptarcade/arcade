// ============================================================
function Game(){
  this.canvas=document.getElementById('gameCanvas');
  this.pipeline=new RenderPipeline(this.canvas,{
    layers:[{name:'dungeon',worldSpace:true},{name:'entities',worldSpace:true},{name:'fx',worldSpace:true},{name:'ui',worldSpace:false}],
    lighting:{enabled:true,ambient:{color:'#020204',intensity:0.05},applyAfterLayer:'fx'},
    postfx:{
      bloom:{enabled:false},
      vignette:{enabled:true,radius:0.6,softness:0.5,color:'#000000',intensity:0.5},
      screenFlash:{enabled:true},
    },
  });
  this.pipeline.camera.x=CONFIG.WIDTH/2;
  this.pipeline.camera.y=CONFIG.HEIGHT/2;
  this.vfx=new VFXManager({canvas:this.canvas,maxParticles:1500});

  // State managed by StateStack, initialized in setupInput
  this.player=createPlayer();
  this.dungeon=null; this.enemies=[]; this.log=[]; this.floatingTexts=[];
  this.animTimer=0; this.turnReady=true; this.turnCooldown=0;
  this.meta=loadMeta(); this.abilityTargetMode=false; this.selectedAbility=-1;
  this.shrineChoices=null; this.showMinimap=true; this.showInventory=false;
  this.turnCount=0; this.autoSaveInterval=10;
  this._pendingAbility=null; this._replaceHandler=null;
  this.terrainSprites=null; this.itemSprites=null; this.playerSprite=null;

  // Character customization
  this.customization={
    bodyColorIdx:0, hairIdx:0, hairStyleIdx:0, skinIdx:0, eyeIdx:0,
    bodyIdx:0, heightIdx:0, frameIdx:0, startWpnIdx:0, cursor:0,
  };
  this.BODY_COLORS=['#2266cc','#cc2222','#22aa44','#aa6622','#8833aa','#cc8800','#226666','#aa2266'];
  this.HAIR_COLORS=['#443322','#221100','#ccaa44','#aa3311','#eeeeee','#222244','#44aa88','#cc44aa'];
  this.SKIN_COLORS=['#ffe0c0','#ffd4a8','#f5c08a','#dda870','#c68c50','#a06830','#784818','#4a2810','#f0c8b0','#d4a090'];
  this.EYE_COLORS=['#443322','#224488','#228844','#886622','#666666','#222222','#884422','#6644aa'];
  this.HAIR_STYLES=['short','long','spiky','bald','ponytail','mohawk'];
  this.BODIES=['broad','narrow'];
  this.HEIGHTS=['average','tall','short'];
  this.FRAMES=['average','stocky','slim'];
  this.START_WEAPONS=[
    {key:'sword', name:'Sword', desc:'Melee attack, reliable damage', color:'#ddaa44'},
    {key:'wand',  name:'Wand',  desc:'Ranged shot (2 tiles), slight cooldown', color:'#6688ff'},
    {key:'staff', name:'Healing Staff', desc:'Heal 25% HP (CD 5), no attack until you find one', color:'#44ff88'},
  ];

  GameUtils.init(this);
  StateStack.init(this);
  var self=this;
  // Auto-save every N turns
  GameEvents.on('turnEnd', function(game) {
    game.turnCount++;
    if (game.turnCount % game.autoSaveInterval === 0) SaveSystem.save();
  });
  this.setupInput();
  this.lastTime=performance.now();
  requestAnimationFrame(function loop(){
    var now=performance.now(),dt=Math.min((now-self.lastTime)/1000,0.05);self.lastTime=now;
    self.update(dt);self.vfx.update(dt);self.pipeline.update(dt);self.draw();
    requestAnimationFrame(loop);
  });
}

Game.prototype.resetPlayer=function(){
  this.player=createPlayer();
};

Game.prototype.setupInput=function(){
  var self=this;
  // All input routes through the state stack
  document.addEventListener('keydown',function(e){
    if(e.key==='Tab' || (e.key.length > 1 && e.key[0] === 'F' && !isNaN(e.key[1]))) e.preventDefault();
    StateStack.handleKey(e.key);
  });
  document.querySelectorAll('.tc[data-key]').forEach(function(btn){
    btn.addEventListener('touchstart',function(e){e.preventDefault();StateStack.handleKey(btn.dataset.key);});
    btn.addEventListener('touchend',function(e){e.preventDefault();});
  });
  this.canvas.addEventListener('click',function(ev){
    if(StateStack.name()==='dead') { StateStack.clear(); StateStack.push(TitleState); }
    if(StateStack.name()==='title') {
      var rect=self.canvas.getBoundingClientRect();
      var yFrac=(ev.clientY-rect.top)/rect.height;
      if(yFrac>0.85){
        if(TitleState._mode==='menu'){
          if(TitleState._menuCursor===0) self.continueGame();
          else { SaveSystem.deleteSave(); TitleState._mode='create'; }
        } else { self.startGame(); }
      }
    }
  });
  // Start on title
  StateStack.push(TitleState);
};

Game.prototype.startGame=function(){
  StateStack.clear();
  StateStack.push(PlayingState);
  this.resetPlayer();
  this.meta.totalRuns++; saveMeta(this.meta);
  this.log=[]; this.floatingTexts=[]; this.vfx.clear();
  _spriteCache={}; // clear sprite cache for fresh biome sprites
  this.playerSprite=getPlayerSprite();
  this.itemSprites=getItemSprites();

  // Apply customization
  var c=this.customization;
  this.player.bodyColor=this.BODY_COLORS[c.bodyColorIdx];
  this.player.hairColor=this.HAIR_COLORS[c.hairIdx];
  this.player.hairStyle=this.HAIR_STYLES[c.hairStyleIdx];
  this.player.skinColor=this.SKIN_COLORS[c.skinIdx];
  this.player.eyeColor=this.EYE_COLORS[c.eyeIdx];
  this.player.body=this.BODIES[c.bodyIdx];
  this.player.height=this.HEIGHTS[c.heightIdx];
  this.player.frame=this.FRAMES[c.frameIdx];

  // Starting weapon determines slot 1 ability
  var wpnChoice=this.START_WEAPONS[c.startWpnIdx];
  this.player.weaponType=wpnChoice.key;
  var wt=WEAPON_TYPES[wpnChoice.key];
  this.player.weapon={name:wt.name,range:wt.range,damage:wt.baseDmg,cd:wt.cd,type:'weapon',atk:wt.baseDmg,color:wpnChoice.color};
  if(wpnChoice.key==='sword'){
    this.player.abilities.push({verb:'strike',element:'physical',shape:'single',name:'Sword Strike',damage:wt.baseDmg,cooldown:0,currentCooldown:0,color:'#ddaa44',isWeapon:true});
  } else if(wpnChoice.key==='wand'){
    this.player.abilities.push({verb:'launch',element:'fire',shape:'line',name:'Wand Shot',damage:wt.baseDmg,cooldown:1,currentCooldown:0,color:'#6688ff',isWeapon:true,maxRange:2});
  } else if(wpnChoice.key==='staff'){
    this.player.abilities.push({verb:'shield',element:'physical',shape:'self',name:'Heal',damage:0,cooldown:5,currentCooldown:0,color:'#44ff88',isWeapon:true,isHeal:true});
  }
  if(this.meta.depthRecord>=10) this.player.abilities.push(generateAbility(1));

  // Initialize overworld
  this.player.bag=Bag.create();
  this.player.skills=PlayerSkills.create();
  this.player.mode='overworld';
  if(!this.meta.worldSeed){this.meta.worldSeed=Math.floor(Math.random()*999999);saveMeta(this.meta);}
  Overworld.init(this.meta.worldSeed);
  // Place cave entrances near spawn
  this.placeCaveEntrances();
  // Find a passable spawn point near 0,0
  var spawnX=0, spawnY=0, spawnFound=false;
  for(var sr=0;sr<20&&!spawnFound;sr++){
    for(var sdx=-sr;sdx<=sr&&!spawnFound;sdx++){
      for(var sdy=-sr;sdy<=sr&&!spawnFound;sdy++){
        if(Math.abs(sdx)+Math.abs(sdy)!==sr) continue;
        if(Overworld.isPassable(sdx,sdy)){spawnX=sdx;spawnY=sdy;spawnFound=true;}
      }
    }
  }
  this.player.x=spawnX; this.player.y=spawnY;
  // Bright overworld lighting
  this.pipeline._ambientColor='#0a1008';
  this.pipeline._ambientIntensity=0.08;
  this.addLog('The world stretches before you...','#aaccff');
  this.addLog('Press [H] for help','#ddaa44');
  // Fire modeChange so NPCs and other systems initialize
  GameEvents.fire('modeChange', this, 'overworld');
  // Immediate save so Continue works on refresh
  SaveSystem.save();
};

Game.prototype.continueGame=function(){
  if(!SaveSystem.hasSave()) return;
  StateStack.clear();
  StateStack.push(PlayingState);
  this.resetPlayer();
  this.log=[]; this.floatingTexts=[]; this.vfx.clear();
  _spriteCache={};
  this.playerSprite=getPlayerSprite();
  this.itemSprites=getItemSprites();
  // Restore world seed and init overworld before loading save
  this.meta=loadMeta();
  if(this.meta.worldSeed) Overworld.init(this.meta.worldSeed);
  this.placeCaveEntrances();
  // Load all saved state
  SaveSystem.load();
  // If saved mid-dungeon, regenerate the floor from seed
  if(this.player.mode==='dungeon'&&!this.dungeon&&this.dungeonSeed){
    this.dungeon=generateDungeon(this.player.floor, this.dungeonSeed);
    // Restore cached floor state if available (revealed tiles, loot changes)
    if(typeof _restoreDungeonFloor==='function') _restoreDungeonFloor(this);
    this.revealAround(this.player.x,this.player.y,this.player.visionRadius);
    // Respawn enemies for this floor
    this.enemies=[];
    var bIdx=getBiomeIndex(this.player.floor);
    for(var ri=0;ri<this.dungeon.rooms.length;ri++){
      var room=this.dungeon.rooms[ri];
      if(room.type==='spawn'||room.type==='shrine'||room.type==='rest')continue;
      if(room.type==='boss')continue; // Don't respawn bosses on reload
      var cnt=Math.max(1,Math.floor((2+Math.floor(Math.random()*(1+this.player.floor*0.3)))*0.3));
      for(var ej=0;ej<cnt;ej++){
        var ex=room.x+1+Math.floor(Math.random()*Math.max(1,room.w-2));
        var ey=room.y+1+Math.floor(Math.random()*Math.max(1,room.h-2));
        var tile=this.dungeon.map[ey]&&this.dungeon.map[ey][ex];
        if(tile===T.FLOOR||tile===T.WATER||tile===T.FUNGAL||tile===T.OIL){
          // Don't spawn on the player
          if(ex===this.player.x&&ey===this.player.y)continue;
          var arch,roll=Math.random();
          if(this.player.floor<3){arch=roll<0.4?'swarm':roll<0.7?'stalker':'shambler';}
          else if(this.player.floor<7){arch=roll<0.2?'swarm':roll<0.4?'stalker':roll<0.6?'shambler':roll<0.85?'caster':'brute';}
          else{arch=roll<0.15?'swarm':roll<0.3?'stalker':roll<0.5?'shambler':roll<0.7?'caster':roll<0.95?'brute':'dragon';}
          this.enemies.push(new Enemy(ex,ey,arch,this.player.floor,bIdx));
        }
      }
    }
  }
  // Restore lighting for current mode
  if(this.player.mode==='dungeon'&&this.dungeon){
    this.pipeline._ambientColor=this.dungeon.biome.ambientColor;
    this.pipeline._ambientIntensity=this.dungeon.biome.ambientIntensity;
  } else {
    this.pipeline._ambientColor='#0a1008';
    this.pipeline._ambientIntensity=0.08;
  }
  this.addLog('Welcome back.','#aaccff');
  GameEvents.fire('modeChange', this, this.player.mode);
};

Game.prototype.placeCaveEntrances=function(){
  // Seeded from worldSeed so same world = same dungeon locations across lives
  var rng = overworldRng(Overworld.seed * 7 + 9999);
  // Tiered placement: near(3), mid(3), far(2) = 8 dungeons total
  var tiers = [
    { count: 3, minDist: 8,  maxDist: 25 },  // near spawn — early game
    { count: 3, minDist: 30, maxDist: 55 },  // mid range — requires exploration
    { count: 2, minDist: 60, maxDist: 90 },  // far out — caravan distance
  ];
  for (var ti = 0; ti < tiers.length; ti++) {
    var tier = tiers[ti];
    var placed = 0, attempts = 0;
    while (placed < tier.count && attempts < 200) {
      attempts++;
      var range = tier.maxDist - tier.minDist;
      var cx = Math.floor(rng() * range * 2) - range + (rng() < 0.5 ? tier.minDist : -tier.minDist);
      var cy = Math.floor(rng() * range * 2) - range + (rng() < 0.5 ? tier.minDist : -tier.minDist);
      var dist = Math.abs(cx) + Math.abs(cy);
      if (dist < tier.minDist || dist > tier.maxDist) continue;
      if (!Overworld.isPassable(cx, cy)) continue;
      // Don't place too close to another entrance
      var tooClose = false;
      // (we'll check via tile scan — crude but works)
      for (var dd = -3; dd <= 3 && !tooClose; dd++) {
        for (var de = -3; de <= 3 && !tooClose; de++) {
          if (Overworld.getTile(cx + dd, cy + de).type === 120) tooClose = true;
        }
      }
      if (tooClose) continue;
      this._placeEntrance(cx, cy, rng);
      placed++;
    }
  }
};

Game.prototype._placeEntrance=function(cx, cy, rng){
  var tile=Overworld.getTile(cx,cy);
  tile.type=T_CAVE_ENTRANCE;
  for(var dy=-2;dy<=2;dy++){for(var dx=-2;dx<=2;dx++){
    if(dx===0&&dy===0) continue;
    var rx=cx+dx, ry=cy+dy;
    if(!Overworld.isPassable(rx,ry)) continue;
    var rt=Overworld.getTile(rx,ry);
    var rdist=Math.abs(dx)+Math.abs(dy);
    var rh=(((rx*4217+ry*8363)>>>0)%100);
    if(rdist<=1){
      rt.type=rh<40?T_RUIN_WALL:T_RUIN_FLOOR;
    } else if(rdist<=3){
      if(rh<30) rt.type=T_RUIN_RUBBLE;
      else if(rh<50) rt.type=T_RUIN_FLOOR;
    }
  }}
};

Game.prototype.generateFloor=function(){
  // Save current floor state before moving on
  _saveDungeonFloor(this);
  this.player.floor++;
  this.dungeon=generateDungeon(this.player.floor, this.dungeonSeed||0);
  // Restore floor state if we've been here before
  var _floorRevisited = _restoreDungeonFloor(this);
  this.player.x=this.dungeon.spawnX; this.player.y=this.dungeon.spawnY;
  this.enemies=[];
  // Place upward stairs at spawn point on every floor
  this.dungeon.map[this.dungeon.spawnY][this.dungeon.spawnX]=T.STAIRS_UP;
  this.terrainSprites=getTerrainSprites(this.dungeon.biome);

  var bIdx=getBiomeIndex(this.player.floor);
  var archList=Object.keys(ARCHETYPES);
  // _floorRevisited set by _restoreDungeonFloor above
  // Night dungeons are more active — 1.5x enemies at night, 0.7x during day
  var nightMult = 1.0;
  if (typeof GameTime !== 'undefined') {
    if (GameTime.isNight()) { nightMult = 1.5; this.addLog('The ruins stir with nightfall...', '#cc6644'); }
    else if (GameTime.isDaytime()) nightMult = 0.7;
  }
  for(var i=0;i<this.dungeon.rooms.length;i++){
    var room=this.dungeon.rooms[i];
    if(room.type==='spawn'||room.type==='shrine'||room.type==='rest') continue;
    if(room.type==='boss'){if(!_floorRevisited)this.enemies.push(createBoss(Math.floor(room.x+room.w/2),Math.floor(room.y+room.h/2),this.player.floor,bIdx));continue;}
    var count=Math.round((2+Math.floor(Math.random()*(1+this.player.floor*0.3))) * nightMult);
    if(_floorRevisited) count=Math.max(1,Math.floor(count*0.3));
    for(var j=0;j<count;j++){
      var ex=room.x+1+Math.floor(Math.random()*Math.max(1,room.w-2));
      var ey=room.y+1+Math.floor(Math.random()*Math.max(1,room.h-2));
      if(ex>=room.x&&ex<room.x+room.w&&ey>=room.y&&ey<room.y+room.h){
        var tile=this.dungeon.map[ey][ex];
        if(tile===T.FLOOR||tile===T.WATER||tile===T.FUNGAL||tile===T.OIL){
          var arch,roll=Math.random();
          if(this.player.floor<3){arch=roll<0.4?'swarm':roll<0.7?'stalker':'shambler';}
          else if(this.player.floor<7){arch=roll<0.2?'swarm':roll<0.4?'stalker':roll<0.6?'shambler':roll<0.85?'caster':'brute';}
          else if(this.player.floor<13){arch=roll<0.15?'swarm':roll<0.3?'stalker':roll<0.5?'shambler':roll<0.7?'caster':roll<0.95?'brute':'dragon';}
          else{arch=roll<0.1?'swarm':roll<0.25?'stalker':roll<0.4?'shambler':roll<0.6?'caster':roll<0.85?'brute':'dragon';}
          this.enemies.push(new Enemy(ex,ey,arch,this.player.floor,bIdx));
        }
      }
    }
  }
  for(var i=0;i<this.enemies.length;i++){var e=this.enemies[i];if(!this.meta.bestiary[e.name])this.meta.bestiary[e.name]={seen:true,archetype:e.archetype,color:e.color};}
  saveMeta(this.meta);
  this.revealAround(this.player.x,this.player.y,this.player.visionRadius);
  this.addLog('Floor '+this.player.floor+' \u2014 '+this.dungeon.biome.name,this.dungeon.biome.accent);
  if(this.dungeon.isBossFloor) this.addLog('A powerful presence lurks here...','#ff4444');
  this.pipeline._ambientColor=this.dungeon.biome.ambientColor;
  this.pipeline._ambientIntensity=this.dungeon.biome.ambientIntensity;
};

Game.prototype.isPassable=function(x,y){if(x<0||x>=CONFIG.MAP_W||y<0||y>=CONFIG.MAP_H)return false;if(!this.dungeon||!this.dungeon.map[y])return false;var t=this.dungeon.map[y][x];return t!==T.VOID&&t!==T.WALL;};

Game.prototype.revealAround=function(cx,cy,radius){
  for(var dy=-radius;dy<=radius;dy++)for(var dx=-radius;dx<=radius;dx++){
    if(dx*dx+dy*dy>radius*radius) continue;
    var nx=cx+dx,ny=cy+dy;
    if(nx<0||nx>=CONFIG.MAP_W||ny<0||ny>=CONFIG.MAP_H) continue;
    var blocked=false,steps=Math.max(Math.abs(dx),Math.abs(dy));
    if(steps>1){for(var s=1;s<steps;s++){var t=s/steps,mx=Math.round(cx+dx*t),my=Math.round(cy+dy*t);if(mx>=0&&mx<CONFIG.MAP_W&&my>=0&&my<CONFIG.MAP_H&&this.dungeon.map[my][mx]===T.WALL){blocked=true;break;}}}
    if(!blocked) this.dungeon.revealed[ny][nx]=true;
  }
};

Game.prototype.isVisible=function(tx,ty){
  var dx=tx-this.player.x,dy=ty-this.player.y;
  if(dx*dx+dy*dy>this.player.visionRadius*this.player.visionRadius) return false;
  var steps=Math.max(Math.abs(dx),Math.abs(dy));
  if(steps<=1) return true;
  for(var s=1;s<steps;s++){var t=s/steps,mx=Math.round(this.player.x+dx*t),my=Math.round(this.player.y+dy*t);if(mx>=0&&mx<CONFIG.MAP_W&&my>=0&&my<CONFIG.MAP_H&&this.dungeon.map[my][mx]===T.WALL)return false;}
  return true;
};

Game.prototype.doPlayerMove=function(dx,dy){
  var nx=this.player.x+dx,ny=this.player.y+dy;
  var enemy=null;for(var i=0;i<this.enemies.length;i++){if(this.enemies[i].alive&&this.enemies[i].x===nx&&this.enemies[i].y===ny){enemy=this.enemies[i];break;}}
  if(enemy){this.meleeAttack(enemy);this.endTurn();return;}
  if(!this.isPassable(nx,ny)) return;
  this.player.x=nx;this.player.y=ny;this.player.walkTimer=0.35;SFX.step();
  GameEvents.fire('playerMove',this,nx,ny);
  this.revealAround(nx,ny,this.player.visionRadius);
  var tile=this.dungeon.map[ny][nx];
  this.player.wet=tile===T.WATER;
  if(tile===T.LAVA){
    var lavaDmg=5+this.player.floor*2;
    this.player.hp-=lavaDmg;this.player.hitFlash=0.2;
    this.addLog('Burning in lava! -'+lavaDmg,'#ff4422');
    this.addFloating(this.player.x,this.player.y,'-'+lavaDmg,'#ff4422');
    this.pipeline.camera.shake(3,0.15);
    if(this.player.hp<=0){this.player.hp=0;this.die();return;}
  }
  if(tile===T.LOOT){
    var key=nx+','+ny;var loot=this.dungeon.loot[key];
    if(loot){
      // Resources and scrolls auto-collect always
      if(loot.type==='resource'||loot.type==='scroll'){
        SFX.shrine();
        delete this.dungeon.loot[key];
        this.dungeon.map[ny][nx]=T.FLOOR;
        this.equipLoot(loot,nx,ny);
      } else if(!this._seenLoot||!this._seenLoot[key]){
        // First time seeing this equipment — prompt
        SFX.shrine();
        this._pendingLoot=loot;this._pendingLootKey=key;this._pendingLootPos={x:nx,y:ny};
        StateStack.push(LootPromptState);
        return;
      }
      // Seen loot: walk over silently
    }
  }
  if(tile===T.STAIRS){SFX.stairs();this.generateFloor();return;}
  if(tile===T.STAIRS_UP){SFX.stairs();if(this.player.floor<=1){this.exitDungeon();}else{this.goUpFloor();}return;}
  if(tile===T.SHRINE){SFX.shrine();this.openShrine();return;}
  if(tile===T.REST){SFX.heal();var heal=Math.round(this.player.maxHp*0.3);this.player.hp=Math.min(this.player.hp+heal,this.player.maxHp);this.addLog('Resting... +'+heal+' HP','#44ff88');this.addFloating(this.player.x,this.player.y,'+'+heal,'#44ff88');this.vfx.heal(this.player.x*CONFIG.TILE+CONFIG.TILE/2,this.player.y*CONFIG.TILE+CONFIG.TILE/2,{color:'#44ff88'});this.dungeon.map[ny][nx]=T.FLOOR;}
  if(tile===T.FUNGAL){var dmg=1+Math.floor(this.player.floor*0.3);this.player.hp-=dmg;this.addFloating(this.player.x,this.player.y,'-'+dmg,'#44ff44');}
  var eff=this.dungeon.effects[ny][nx];
  if(eff&&eff.turnsLeft>0){
    if(eff.element==='fire'){var d=Math.round(eff.damage*0.5);this.player.hp-=d;this.addFloating(this.player.x,this.player.y,'-'+d,'#ff6622');}
    if(eff.element==='poison'){var d=Math.round(eff.damage*0.3);this.player.hp-=d;this.addFloating(this.player.x,this.player.y,'-'+d,'#44ff44');}
  }
  if(this.player.hp<=0){this.player.hp=0;this.die();return;}
  this.endTurn();
};

Game.prototype.meleeAttack=function(enemy){
  SFX.hit();
  // Unarmed if using healing staff (1 damage)
  var dmg=this.player.weaponType==='staff'?1:Math.max(1,this.player.atk);
  enemy.hp-=dmg;enemy.hitFlash=0.2;
  this.addLog('Hit '+enemy.name+' -'+dmg,'#ff8844');
  this.addFloating(enemy.x,enemy.y,'-'+dmg,'#ff8844');
  this.vfx.sparks(enemy.x*CONFIG.TILE+CONFIG.TILE/2,enemy.y*CONFIG.TILE+CONFIG.TILE/2,{color:['#ff8844','#ffcc00'],count:6,direction:Math.PI,spread:1});
  this.pipeline.camera.shake(3,0.1);
  if(enemy.hp<=0){enemy.hp=0;enemy.alive=false;this.onKill(enemy);}
};

Game.prototype.useAbility=function(idx,dx,dy){
  var ab=this.player.abilities[idx];if(!ab||ab.currentCooldown>0)return;
  if(dx===0&&dy===0){dx=this.player.lastDir.x;dy=this.player.lastDir.y;}
  if(dx===0&&dy===0)dy=1;
  var sfx=ELEMENT_SFX[ab.element];if(SFX[sfx])SFX[sfx]();
  var targets=getAbilityTargets(ab,this.player.x,this.player.y,dx,dy);

  if(ab.verb==='dash'){
    var lx=this.player.x,ly=this.player.y;
    for(var i=1;i<=3;i++){var nx=this.player.x+dx*i,ny=this.player.y+dy*i;if(!this.isPassable(nx,ny))break;var blocked=false;for(var j=0;j<this.enemies.length;j++)if(this.enemies[j].alive&&this.enemies[j].x===nx&&this.enemies[j].y===ny){blocked=true;break;}if(blocked)break;lx=nx;ly=ny;}
    if(lx!==this.player.x||ly!==this.player.y){this.player.x=lx;this.player.y=ly;this.player.walkTimer=0.35;this.revealAround(lx,ly,this.player.visionRadius);this.addLog('Dashed!',ab.color);
      for(var adx=-1;adx<=1;adx++)for(var ady=-1;ady<=1;ady++){if(adx===0&&ady===0)continue;for(var j=0;j<this.enemies.length;j++){var e=this.enemies[j];if(e.alive&&e.x===lx+adx&&e.y===ly+ady)this.applyAbilityDmg(e,ab,Math.round(ab.damage*0.5));}}
      // Check tile at landing position (dungeon only)
      if(this.dungeon){
      var landTile=this.dungeon.map[ly][lx];
      if(landTile===T.STAIRS){SFX.stairs();this.generateFloor();return;}
      if(landTile===T.SHRINE){SFX.shrine();this.openShrine();return;}
      if(landTile===T.LOOT){var lk2=lx+','+ly;var lt2=this.dungeon.loot[lk2];if(lt2&&(!this._seenLoot||!this._seenLoot[lk2])){SFX.shrine();if(lt2.type==='resource'||lt2.type==='scroll'){delete this.dungeon.loot[lk2];this.dungeon.map[ly][lx]=T.FLOOR;this.equipLoot(lt2,lx,ly);}else{this._pendingLoot=lt2;this._pendingLootKey=lk2;this._pendingLootPos={x:lx,y:ly};StateStack.push(LootPromptState);return;}}}
      if(landTile===T.REST){SFX.heal();var h2=Math.round(this.player.maxHp*0.3);this.player.hp=Math.min(this.player.hp+h2,this.player.maxHp);this.addLog('Resting... +'+h2+' HP','#44ff88');this.addFloating(lx,ly,'+'+h2,'#44ff88');this.dungeon.map[ly][lx]=T.FLOOR;}
      if(landTile===T.LAVA){var ld=5+this.player.floor*2;this.player.hp-=ld;this.player.hitFlash=0.2;this.addLog('Lava! -'+ld,'#ff4422');this.addFloating(lx,ly,'-'+ld,'#ff4422');if(this.player.hp<=0){this.player.hp=0;this.die();return;}}
      if(landTile===T.FUNGAL){var fd=1+Math.floor(this.player.floor*0.3);this.player.hp-=fd;this.addFloating(lx,ly,'-'+fd,'#44ff44');}
      }
    }
    this.vfx.trail(lx*CONFIG.TILE+CONFIG.TILE/2,ly*CONFIG.TILE+CONFIG.TILE/2,{color:[ab.color,'#ffffff'],count:8,speed:60});
  } else if(ab.isHeal){
    // Healing staff heal
    var heal=Math.round(this.player.maxHp*0.25);
    this.player.hp=Math.min(this.player.hp+heal,this.player.maxHp);
    this.addLog('Healed +'+heal+' HP','#44ff88');
    this.addFloating(this.player.x,this.player.y,'+'+heal,'#44ff88');
    this.vfx.heal(this.player.x*CONFIG.TILE+CONFIG.TILE/2,this.player.y*CONFIG.TILE+CONFIG.TILE/2,{color:'#44ff88'});
  } else if(ab.verb==='shield'){
    this.player.shieldTurns=3+Math.floor(ab.damage/5);this.player.shieldAmount=Math.round(ab.damage*0.5);
    this.addLog(ab.name+'! DEF+'+this.player.shieldAmount+' '+this.player.shieldTurns+'t',ab.color);
    this.vfx.heal(this.player.x*CONFIG.TILE+CONFIG.TILE/2,this.player.y*CONFIG.TILE+CONFIG.TILE/2,{color:ab.color});
  } else if(ab.verb==='drain'){
    for(var i=0;i<targets.length;i++){var t=targets[i];for(var j=0;j<this.enemies.length;j++){var e=this.enemies[j];if(e.alive&&e.x===t.x&&e.y===t.y){var dmg=this.applyAbilityDmg(e,ab,ab.damage);var heal=Math.round(dmg*0.5);this.player.hp=Math.min(this.player.hp+heal,this.player.maxHp);this.addFloating(this.player.x,this.player.y,'+'+heal,'#44ff88');}}}
  } else {
    for(var i=0;i<targets.length;i++){var t=targets[i];
      // Bounds check: dungeon uses fixed map, overworld is infinite
      if(this.dungeon){if(t.x<0||t.x>=CONFIG.MAP_W||t.y<0||t.y>=CONFIG.MAP_H)continue;if(ab.shape==='line'&&this.dungeon.map[t.y][t.x]===T.WALL)break;}
      // Hit dungeon enemies
      for(var j=0;j<this.enemies.length;j++){var e=this.enemies[j];if(e.alive&&e.x===t.x&&e.y===t.y)this.applyAbilityDmg(e,ab,ab.damage);}
      // Hit overworld animals (any non-tamed animal)
      if(this.player.mode==='overworld'&&typeof AnimalManager!=='undefined'){
        var animal=AnimalManager.getAt(t.x,t.y);
        if(animal&&animal.alive&&!animal.tamed){
          animal.hp-=ab.damage;animal.walkTimer=0.1;
          GameUtils.addFloating(t.x,t.y,'-'+ab.damage,ab.color);
          if(animal.hp<=0){animal.alive=false;SFX.kill();GameUtils.addLog('Defeated '+animal.name+'!','#ddaa44');this.player.kills++;
            if(animal.type==='wolf'||animal.type==='boar'||animal.type==='bear'){Bag.add(this.player.bag,'leather',1+Math.floor(Math.random()*2));GameUtils.addLog('+Leather','#aa8866');}
            if(animal.type==='rabbit'||animal.type==='deer'||animal.type==='boar'||animal.type==='bear'){var mc=animal.type==='rabbit'?1:animal.type==='deer'?2:3;Bag.add(this.player.bag,'raw_meat',mc);GameUtils.addLog('+Raw Meat x'+mc,'#cc5544');}
            if(animal.type==='deer'||animal.type==='fox'){Bag.add(this.player.bag,'hide',1);GameUtils.addLog('+Hide','#997755');}
            if((animal.type==='rabbit'||animal.type==='fox')&&Math.random()<0.3){Bag.add(this.player.bag,'feather',1);GameUtils.addLog('+Feather','#ddddcc');}
            GameEvents.fire('kill',this,animal);
          } else if(!animal.hostile){animal.fleeTimer=8;}
        }
      }
      // Hit overworld NPCs
      if(this.player.mode==='overworld'&&typeof NPCManager!=='undefined'){
        var npcHit=NPCManager.getAt(t.x,t.y);
        if(npcHit&&npcHit.alive){
          if(!npcHit.hp){npcHit.hp=15;npcHit.maxHp=15;}
          npcHit.hp-=ab.damage;
          GameUtils.addFloating(t.x,t.y,'-'+ab.damage,ab.color);
          GameUtils.addLog(ab.name+' hits '+npcHit.name+'!',ab.color);
          if(npcHit.hp<=0){npcHit.alive=false;SFX.kill();GameUtils.addLog(npcHit.name+' is dead.','#ff2222');
            this._npcKillConsequences(npcHit);GameEvents.fire('kill',this,npcHit);}
        }
      }
      if(this.dungeon){if(ab.verb==='place'||(ab.element!=='physical'&&Math.random()<0.4))this.placeEffect(t.x,t.y,ab);}
      this.vfx.sparks(t.x*CONFIG.TILE+CONFIG.TILE/2,t.y*CONFIG.TILE+CONFIG.TILE/2,{color:[ab.color,'#ffffff'],count:3,speed:50});
    }
  }
  ab.currentCooldown=ab.cooldown; this.endTurn();
};

Game.prototype.applyAbilityDmg=function(enemy,ab,damage){
  var d=damage;
  if(ab.element==='lightning'&&enemy.wet){d=Math.round(d*1.5);this.addLog('Conducts!','#ffff44');}
  if(ab.element==='fire'&&enemy.frozen>0){d=Math.round(d*1.3);enemy.frozen=0;}
  enemy.hp-=d;enemy.hitFlash=0.2;
  if(ab.element==='fire')enemy.burning=3;if(ab.element==='ice')enemy.frozen=2;if(ab.element==='poison')enemy.poisoned=4;
  if(ab.element==='lightning'&&this.dungeon&&this.dungeon.map[enemy.y]&&this.dungeon.map[enemy.y][enemy.x]===T.WATER){for(var i=0;i<this.enemies.length;i++){var o=this.enemies[i];if(o===enemy||!o.alive)continue;if(this.dungeon.map[o.y]&&this.dungeon.map[o.y][o.x]===T.WATER){var cd=Math.round(d*0.5);o.hp-=cd;o.hitFlash=0.2;this.addFloating(o.x,o.y,'-'+cd,'#ffff44');if(o.hp<=0){o.hp=0;o.alive=false;this.onKill(o);}}}}
  this.addLog(ab.name+' \u2192 '+enemy.name+' -'+d,ab.color);
  this.addFloating(enemy.x,enemy.y,'-'+d,ab.color);
  var epx=enemy.x*CONFIG.TILE+CONFIG.TILE/2, epy=enemy.y*CONFIG.TILE+CONFIG.TILE/2;
  // Element-specific VFX
  if(ab.element==='fire'){
    this.pipeline.camera.shake(3,0.12);
    this.vfx.explosion(epx,epy,{color:['#ff6622','#ff2200','#ffcc00'],count:12,speed:60});
    this.pipeline.flash('#ff220008',0.1);
  } else if(ab.element==='ice'){
    this.pipeline.camera.shake(2,0.08);
    this.vfx.sparks(epx,epy,{color:['#66ccff','#aaeeff','#ffffff'],count:10,speed:40});
  } else if(ab.element==='lightning'){
    this.pipeline.camera.shake(4,0.06);
    this.vfx.sparks(epx,epy,{color:['#ffff44','#ffffff','#ffff88'],count:15,speed:120});
    this.pipeline.flash('#ffff4410',0.05);
  } else if(ab.element==='poison'){
    this.pipeline.camera.shake(1,0.1);
    this.vfx.trail(epx,epy,{color:['#44ff44','#22aa22'],count:8,speed:30});
  } else if(ab.element==='void'){
    this.pipeline.camera.shake(3,0.15);
    this.vfx.explosion(epx,epy,{color:['#aa44ff','#6622cc','#000000'],count:10,speed:50});
  } else {
    this.pipeline.camera.shake(2,0.08);
    this.vfx.sparks(epx,epy,{color:[ab.color,'#ffffff'],count:8,speed:80});
  }
  if(enemy.hp<=0){enemy.hp=0;enemy.alive=false;this.onKill(enemy);}
  return d;
};

Game.prototype.placeEffect=function(x,y,ab){
  if(x<0||x>=CONFIG.MAP_W||y<0||y>=CONFIG.MAP_H)return;var tile=this.dungeon.map[y][x];if(tile===T.WALL||tile===T.VOID)return;
  if(ab.element==='fire'&&tile===T.WATER){this.dungeon.map[y][x]=T.FLOOR;return;}
  if(ab.element==='fire'&&tile===T.OIL){this.dungeon.map[y][x]=T.FLOOR;for(var i=0;i<this.enemies.length;i++){var e=this.enemies[i];if(!e.alive)continue;if(Math.abs(e.x-x)<=1&&Math.abs(e.y-y)<=1){var d=Math.round(ab.damage*1.5);e.hp-=d;e.hitFlash=0.3;e.burning=3;this.addFloating(e.x,e.y,'-'+d+' BOOM','#ff4422');if(e.hp<=0){e.hp=0;e.alive=false;this.onKill(e);}}}this.vfx.explosion(x*CONFIG.TILE+CONFIG.TILE/2,y*CONFIG.TILE+CONFIG.TILE/2,{color:['#ff6622','#ffcc00'],count:20,speed:120});this.pipeline.camera.shake(6,0.3);this.pipeline.flash('#ff4400',0.15);return;}
  if(ab.element==='ice'&&tile===T.WATER){this.dungeon.map[y][x]=T.ICE;return;}
  if(ab.element==='fire'&&tile===T.ICE){this.dungeon.map[y][x]=T.WATER;return;}
  this.dungeon.effects[y][x]={element:ab.element,damage:ab.damage,turnsLeft:ab.verb==='place'?5:2,color:ab.color};
};

Game.prototype.onKill=function(enemy){
  SFX.kill();this.player.kills++;this.meta.totalKills++;
  var heal=Math.round(enemy.maxHp*0.1);if(heal>0){this.player.hp=Math.min(this.player.hp+heal,this.player.maxHp);this.addFloating(this.player.x,this.player.y,'+'+heal,'#44ff88');}
  this.addLog(enemy.name+' defeated!','#ffcc44');
  this.vfx.explosion(enemy.x*CONFIG.TILE+CONFIG.TILE/2,enemy.y*CONFIG.TILE+CONFIG.TILE/2,{color:[enemy.color,'#ffffff'],count:15,speed:80});
  // Potion drop: 25% chance
  if(Math.random()<0.25){this.player.potions++;this.addLog('+1 Potion! ('+this.player.potions+')','#ff44aa');this.addFloating(enemy.x,enemy.y,'+Potion','#ff44aa');}
  // Loot drop chance
  var dropChance=enemy.isBoss?1.0:0.35;
  if(Math.random()<dropChance&&this.dungeon.map[enemy.y][enemy.x]!==T.WATER&&this.dungeon.map[enemy.y][enemy.x]!==T.LAVA){
    var loot=generateLoot(this.player.floor);
    this.dungeon.map[enemy.y][enemy.x]=T.LOOT;
    if(!this.dungeon.loot) this.dungeon.loot={};
    this.dungeon.loot[enemy.x+','+enemy.y]=loot;
    this.addLog('Something dropped!','#ffcc44');
  }
  if(enemy.isBoss){SFX.boss();this.addLog('BOSS DEFEATED!','#ff0');this.pipeline.flash('#ffcc00',0.3);this.pipeline.camera.shake(8,0.5);this.player.hp=this.player.maxHp;this.player.atk+=2;this.player.maxHp+=10;this.addLog('+2 ATK, +10 HP','#ffcc44');}
  if(this.player.kills%10===0){this.player.atk+=1;this.player.maxHp+=5;this.player.hp=Math.min(this.player.hp+5,this.player.maxHp);this.addLog('Stronger! +1 ATK +5 HP','#ffcc44');}
  saveMeta(this.meta);
  GameEvents.fire('kill', this, enemy);
};

Game.prototype.endTurn=function(){
  if(this.player.mode==='overworld'||this.player.mode==='underground'){this.endOverworldTurn();return;}
  this.turnReady=false;this.turnCooldown=0.07;
  for(var i=0;i<this.player.abilities.length;i++)if(this.player.abilities[i].currentCooldown>0)this.player.abilities[i].currentCooldown--;
  if(this.player.shieldTurns>0)this.player.shieldTurns--;
  this.doEnemyTurns();this.tickEffects();this.tickEnemyStatus();
  this.enemies=this.enemies.filter(function(e){return e.alive;});
  GameEvents.fire('turnEnd', this);
};

Game.prototype.doEnemyTurns=function(){
  for(var i=0;i<this.enemies.length;i++){
    var enemy=this.enemies[i];if(!enemy.alive)continue;if(enemy.frozen>0){enemy.frozen--;continue;}
    enemy.moveAccum+=enemy.speed;if(enemy.moveAccum<1)continue;enemy.moveAccum-=1;
    var dx=this.player.x-enemy.x,dy=this.player.y-enemy.y,dist=Math.abs(dx)+Math.abs(dy);
    if(dist>this.player.visionRadius+4)continue;
    if(enemy.behavior==='telegraph'){if(enemy.telegraphing){enemy.telegraphing=false;if(enemy.telegraphDir){var tx=enemy.x+enemy.telegraphDir.x,ty=enemy.y+enemy.telegraphDir.y;if(tx===this.player.x&&ty===this.player.y)this.enemyAttack(enemy,2.0);enemy.telegraphDir=null;}continue;}if(dist===1){enemy.telegraphing=true;enemy.telegraphDir={x:Math.sign(dx),y:Math.sign(dy)};this.addLog(enemy.name+' winds up!','#ff8844');continue;}}
    if(enemy.behavior==='ranged'&&dist<=(enemy.range||4)&&dist>1){var los=true,steps=Math.max(Math.abs(dx),Math.abs(dy));for(var s=1;s<steps;s++){var t=s/steps;if(this.dungeon.map[Math.round(enemy.y+dy*t)][Math.round(enemy.x+dx*t)]===T.WALL){los=false;break;}}if(los){this.enemyAttack(enemy,0.8);continue;}}
    if(dist===1){this.enemyAttack(enemy,1.0);continue;}
    var mx=dx!==0?Math.sign(dx):0,my=dy!==0?Math.sign(dy):0;
    var tries;
    if(enemy.behavior==='flank'&&dist>2){var tmpX=my,tmpY=-mx;if(Math.random()<0.5){tmpX=-tmpX;tmpY=-tmpY;}tries=[{x:tmpX,y:tmpY},{x:mx,y:0},{x:0,y:my}];}
    else{tries=Math.abs(dx)>=Math.abs(dy)?[{x:mx,y:0},{x:0,y:my}]:[{x:0,y:my},{x:mx,y:0}];if(enemy.behavior==='swarm')tries.push({x:mx,y:my});}
    for(var ti=0;ti<tries.length;ti++){var tr=tries[ti];if(tr.x===0&&tr.y===0)continue;var nx=enemy.x+tr.x,ny=enemy.y+tr.y;if(!this.isPassable(nx,ny)||nx===this.player.x&&ny===this.player.y)continue;var occ=false;for(var j=0;j<this.enemies.length;j++)if(this.enemies[j].alive&&this.enemies[j]!==enemy&&this.enemies[j].x===nx&&this.enemies[j].y===ny){occ=true;break;}if(!occ){enemy.x=nx;enemy.y=ny;break;}}
  }
};

Game.prototype.enemyAttack=function(enemy,mult){
  var def=this.player.shieldTurns>0?this.player.shieldAmount:0;
  var armorDef=this.player.armor?this.player.armor.defense:0;
  var dmg=Math.max(1,Math.round(enemy.atk*mult)-def-armorDef);
  this.player.hp-=dmg;this.player.hitFlash=0.15;SFX.hurt();
  this.addLog(enemy.name+' -'+dmg,'#ff4444');this.addFloating(this.player.x,this.player.y,'-'+dmg,'#ff4444');
  this.pipeline.camera.shake(2+(mult>1?3:0),0.1);
  if(this.player.hp<=0){this.player.hp=0;this.die();}
};

Game.prototype.tickEffects=function(){for(var y=0;y<CONFIG.MAP_H;y++)for(var x=0;x<CONFIG.MAP_W;x++){var eff=this.dungeon.effects[y][x];if(eff&&eff.turnsLeft>0){eff.turnsLeft--;for(var i=0;i<this.enemies.length;i++){var e=this.enemies[i];if(e.alive&&e.x===x&&e.y===y){var d=Math.round(eff.damage*0.3);e.hp-=d;e.hitFlash=0.1;if(e.hp<=0){e.hp=0;e.alive=false;this.onKill(e);}}}if(eff.turnsLeft<=0)this.dungeon.effects[y][x]=null;}}};

Game.prototype.tickEnemyStatus=function(){for(var i=0;i<this.enemies.length;i++){var e=this.enemies[i];if(!e.alive)continue;if(e.burning>0){var d=2+Math.floor(this.player.floor*0.3);e.hp-=d;e.burning--;this.addFloating(e.x,e.y,'-'+d,'#ff6622');if(e.hp<=0){e.hp=0;e.alive=false;this.onKill(e);}}if(e.poisoned>0){var d=1+Math.floor(this.player.floor*0.2);e.hp-=d;e.poisoned--;this.addFloating(e.x,e.y,'-'+d,'#44ff44');if(e.hp<=0){e.hp=0;e.alive=false;this.onKill(e);}}e.wet=this.dungeon.map[e.y][e.x]===T.WATER;}};

// equipLoot moved to systems/equipment.js

Game.prototype.openShrine=function(){this.shrineChoices=[generateAbility(this.player.floor),generateAbility(this.player.floor),generateAbility(this.player.floor)];StateStack.push(ShrineState);};

Game.prototype.die=function(){
  SFX.gameOver();StateStack.push(DeadState);
  if(this.player.floor>this.meta.depthRecord){this.meta.depthRecord=this.player.floor;this.addLog('NEW RECORD: Floor '+this.player.floor+'!','#ff0');}
  saveMeta(this.meta);
  this.pipeline.camera.shake(10,0.6);this.pipeline.flash('#ff0000',0.4);
  this.vfx.explosion(this.player.x*CONFIG.TILE+CONFIG.TILE/2,this.player.y*CONFIG.TILE+CONFIG.TILE/2,{color:['#ff4444','#ffcc00'],count:25,speed:120});
};

Game.prototype.addLog=function(t,c){this.log.push({text:t,color:c||'#ccc'});if(this.log.length>7)this.log.shift();};
Game.prototype.addFloating=function(tx,ty,t,c){this.floatingTexts.push({x:tx*CONFIG.TILE+CONFIG.TILE/2,y:ty*CONFIG.TILE,text:t,color:c,life:1.0});};

Game.prototype.update=function(dt){
  this.animTimer+=dt;
  if(this.turnCooldown>0){this.turnCooldown-=dt;if(this.turnCooldown<=0)this.turnReady=true;}
  for(var i=0;i<this.enemies.length;i++){if(this.enemies[i].hitFlash>0)this.enemies[i].hitFlash-=dt;this.enemies[i].animTimer+=dt;}
  if(this.player.hitFlash>0)this.player.hitFlash-=dt;
  if(this.player.walkTimer>0)this.player.walkTimer-=dt;
  this.player.animTimer+=dt;
  for(var i=this.floatingTexts.length-1;i>=0;i--){this.floatingTexts[i].y-=40*dt;this.floatingTexts[i].life-=dt;if(this.floatingTexts[i].life<=0)this.floatingTexts.splice(i,1);}
  GameEvents.fire('update', this, dt);
};

