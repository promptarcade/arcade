// ============================================================
// ABILITY SYSTEM
// ============================================================
var ELEMENTS = ['fire','ice','lightning','poison','void','physical'];
var VERBS = ['strike','launch','place','dash','shield','drain'];
var ELEMENT_COLORS = { fire:'#ff6622', ice:'#66ccff', lightning:'#ffff44', poison:'#44ff44', void:'#aa44ff', physical:'#cccccc' };
var ELEMENT_SFX = { fire:'abilityFire', ice:'abilityIce', lightning:'abilityLightning', poison:'abilityPoison', void:'abilityVoid', physical:'hit' };

function abilityName(v,e,s) {
  var n={
    'strike_fire_single':'Flame Strike','strike_ice_single':'Frost Blade','strike_lightning_single':'Shock Touch',
    'strike_poison_single':'Venom Stab','strike_void_single':'Void Slash','strike_physical_single':'Heavy Blow',
    'launch_fire_line':'Fireball','launch_ice_line':'Ice Shard','launch_lightning_line':'Lightning Bolt',
    'launch_poison_line':'Toxic Dart','launch_void_line':'Void Ray','launch_physical_line':'Stone Shot',
    'launch_fire_cone':'Fire Breath','launch_ice_cone':'Frost Spray','launch_lightning_cone':'Arc Flash',
    'place_fire_area':'Inferno','place_ice_area':'Frost Field','place_poison_area':'Toxic Cloud',
    'place_lightning_area':'Storm Field','place_void_area':'Void Zone',
    'dash_fire_self':'Flame Dash','dash_ice_self':'Frost Step','dash_lightning_self':'Blink',
    'dash_void_self':'Phase Shift','dash_physical_self':'Charge','dash_poison_self':'Plague Step',
    'shield_physical_self':'Stone Skin','shield_ice_self':'Ice Armor','shield_fire_self':'Flame Shield',
    'shield_void_self':'Void Barrier','shield_lightning_self':'Static Field','shield_poison_self':'Toxic Shell',
    'drain_void_single':'Soul Siphon','drain_fire_single':'Life Burn','drain_ice_single':'Frost Drain',
    'drain_poison_single':'Leech','drain_lightning_single':'Arc Drain','drain_physical_single':'Sap',
    'strike_fire_ring':'Fire Nova','strike_ice_ring':'Frost Nova','strike_lightning_ring':'Thunder Clap',
    'strike_poison_ring':'Plague Burst','strike_void_ring':'Void Pulse','strike_physical_ring':'Shockwave',
    'strike_fire_cone':'Flame Sweep','strike_ice_cone':'Ice Wave','strike_physical_cone':'Cleave',
    'launch_fire_area':'Meteor','launch_ice_area':'Blizzard','launch_lightning_area':'Thunderstorm',
    'place_fire_line':'Fire Wall','place_ice_line':'Ice Wall','place_poison_line':'Poison Trail',
    'place_fire_ring':'Ring of Fire','place_ice_ring':'Frost Ring',
  };
  var k=v+'_'+e+'_'+s;
  return n[k]||(e.charAt(0).toUpperCase()+e.slice(1)+' '+v.charAt(0).toUpperCase()+v.slice(1));
}

function generateAbility(floor) {
  var verb=VERBS[Math.floor(Math.random()*VERBS.length)];
  var element=ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)];
  var shape;
  if(verb==='strike') shape=['single','ring','cone'][Math.floor(Math.random()*3)];
  else if(verb==='launch') shape=['line','cone','area'][Math.floor(Math.random()*3)];
  else if(verb==='place') shape=['area','line','ring'][Math.floor(Math.random()*3)];
  else if(verb==='dash') shape='self';
  else if(verb==='shield') shape='self';
  else shape='single';
  var baseDmg=5+Math.floor(floor*1.5);
  var cd=1;
  if(verb==='launch'&&shape==='area') cd=4;
  else if(verb==='place') cd=3;
  else if(verb==='shield') cd=4;
  else if(verb==='drain') cd=3;
  else if(verb==='dash') cd=3;
  else if(shape==='ring') cd=3;
  else if(shape==='cone') cd=2;
  return { verb:verb, element:element, shape:shape, name:abilityName(verb,element,shape),
    damage:baseDmg+Math.floor(Math.random()*4)-1, cooldown:cd, currentCooldown:0, color:ELEMENT_COLORS[element] };
}

function getAbilityTargets(ab, px, py, dx, dy) {
  var t=[];
  if(ab.shape==='single') { t.push({x:px+dx,y:py+dy}); }
  else if(ab.shape==='line') { var maxR=ab.maxRange||5; for(var i=1;i<=maxR;i++) t.push({x:px+dx*i,y:py+dy*i}); }
  else if(ab.shape==='cone') {
    for(var i=1;i<=3;i++) { t.push({x:px+dx*i,y:py+dy*i});
      if(dx===0){t.push({x:px-1,y:py+dy*i});t.push({x:px+1,y:py+dy*i});}
      else{t.push({x:px+dx*i,y:py-1});t.push({x:px+dx*i,y:py+1});}
    }
  } else if(ab.shape==='ring') {
    for(var ddx=-2;ddx<=2;ddx++) for(var ddy=-2;ddy<=2;ddy++) {
      if(ddx===0&&ddy===0) continue;
      if(Math.abs(ddx)+Math.abs(ddy)<=2) t.push({x:px+ddx,y:py+ddy});
    }
  } else if(ab.shape==='area') {
    var cx=px+dx*3,cy=py+dy*3;
    for(var ddx=-1;ddx<=1;ddx++) for(var ddy=-1;ddy<=1;ddy++) t.push({x:cx+ddx,y:cy+ddy});
  } else if(ab.shape==='self') { t.push({x:px,y:py}); }
  return t;
}

