
// ============================================================
// DRAW DISPATCHER
// ============================================================
Game.prototype.draw=function(){
  var p=this.pipeline;p.begin();

  // Title state draws its own full screen
  if(StateStack.name()==='title'){
    p.setLayer('ui');
    StateStack.draw(p.getCtx());
    p.end();
    return;
  }

  var cx=this.player.x*CONFIG.TILE+CONFIG.TILE/2,cy=this.player.y*CONFIG.TILE+CONFIG.TILE/2;
  p.camera.x=cx;p.camera.y=cy;
  var isOverworld=this.player.mode==='overworld';

  // World layer
  p.setLayer('dungeon');var dc=p.getCtx();p.camera.applyTransform(dc);
  if(isOverworld||this.player.mode==='underground') this.drawOverworld(dc);
  else if(this.dungeon) this.drawDungeon(dc);
  GameEvents.fire('draw:world', this, dc);

  // Entities layer
  p.setLayer('entities');var ec=p.getCtx();p.camera.applyTransform(ec);
  this.drawEntities(ec);
  GameEvents.fire('draw:entities', this, ec);

  // Light source
  if(isOverworld||this.player.mode==='underground'){
    p.addLight(cx,cy,{color:'#ffeecc',radius:this.player.visionRadius*CONFIG.TILE*2.5,intensity:1.0,flicker:0,falloff:'quadratic'});
  } else if(this.dungeon) {
    p.addLight(cx,cy,{color:this.dungeon.biome.lightColor,radius:this.player.visionRadius*CONFIG.TILE*1.5,intensity:1.0,flicker:0.03,falloff:'quadratic'});
  }

  // FX layer
  p.setLayer('fx');var fc=p.getCtx();p.camera.applyTransform(fc);this.vfx.draw(fc);
  var fs=Math.max(11,Math.round(CONFIG.TILE*0.4));
  for(var i=0;i<this.floatingTexts.length;i++){var ft=this.floatingTexts[i];fc.globalAlpha=Math.max(0,ft.life);fc.font='bold '+fs+'px Segoe UI';fc.fillStyle=ft.color;fc.textAlign='center';fc.fillText(ft.text,ft.x,ft.y);fc.globalAlpha=1;}

  // UI layer
  p.setLayer('ui');var uc=p.getCtx();
  var _fullscreenOverlays = {inventory:1,crafting:1,help:1,wardrobe:1,shrine:1,dead:1,replace_ability:1};
  var hasFullOverlay = _fullscreenOverlays[StateStack.name()];
  // Skip HUD when a fullscreen overlay covers everything
  if (!hasFullOverlay) {
    this.drawHUD(uc);
    if(this.showMinimap) this.drawMinimap(uc);
  }
  // State stack draws overlays
  StateStack.draw(uc);
  // Skip system HUD during fullscreen overlays, but still draw debug
  if (!hasFullOverlay) {
    GameEvents.fire('draw:ui', this, uc);
  } else if (typeof DebugMode !== 'undefined' && DebugMode.active) {
    // Draw debug bar only — call it directly to avoid triggering all handlers
    var _dbgFs = Math.max(10, Math.round(CONFIG.WIDTH * 0.01));
    var _dbgY = 56;
    uc.fillStyle = 'rgba(40,0,40,0.7)';
    uc.font = 'bold ' + _dbgFs + 'px Segoe UI';
    var _dbgLabelW = uc.measureText('DEBUG ').width + 10;
    uc.font = Math.round(_dbgFs * 0.7) + 'px Segoe UI';
    var _dbgKeysText = 'F1:kit F2:+6h F3:heart F4:heal F5:info F6:N F7:E F8:S F9:W';
    var _dbgKeysW = uc.measureText(_dbgKeysText).width + 10;
    uc.fillRect(0, _dbgY, _dbgLabelW + _dbgKeysW + 10, _dbgFs * 1.4);
    uc.fillStyle = '#ff44ff';
    uc.font = 'bold ' + _dbgFs + 'px Segoe UI';
    uc.textAlign = 'left';
    uc.fillText('DEBUG', 10, _dbgY + _dbgFs * 1.0);
    uc.fillStyle = '#cc33cc';
    uc.font = Math.round(_dbgFs * 0.7) + 'px Segoe UI';
    uc.fillText(_dbgKeysText, 10 + _dbgLabelW, _dbgY + _dbgFs * 1.0);
  }
  p.end();
};
