// ============================================================
// DUNGEON GENERATOR
// ============================================================
function generateDungeon(floor, seed) {
  // Seeded RNG so same cave + floor = same layout
  var _ds = (seed || 12345) + floor * 99991;
  function dRng() { _ds = (_ds * 1103515245 + 12345) & 0x7fffffff; return (_ds >>> 0) / 0x7fffffff; }

  var w=CONFIG.MAP_W, h=CONFIG.MAP_H;
  var map=Array.from({length:h},function(){return new Array(w).fill(T.VOID);});
  var rooms=[], revealed=Array.from({length:h},function(){return new Array(w).fill(false);});
  var biome=getBiome(floor), isBossFloor=floor%5===0;
  var roomTarget=isBossFloor?8:(6+Math.min(6,Math.floor(floor*0.5)));

  for(var attempt=0;attempt<CONFIG.ROOM_ATTEMPTS+floor*3&&rooms.length<roomTarget;attempt++) {
    var rw=CONFIG.ROOM_MIN+Math.floor(dRng()*(CONFIG.ROOM_MAX-CONFIG.ROOM_MIN));
    var rh=CONFIG.ROOM_MIN+Math.floor(dRng()*(CONFIG.ROOM_MAX-CONFIG.ROOM_MIN));
    var rx=2+Math.floor(dRng()*(w-rw-4)), ry=2+Math.floor(dRng()*(h-rh-4));
    var overlap=false;
    for(var ri=0;ri<rooms.length;ri++){var r=rooms[ri];if(rx-1<r.x+r.w&&rx+rw+1>r.x&&ry-1<r.y+r.h&&ry+rh+1>r.y){overlap=true;break;}}
    if(overlap) continue;
    rooms.push({x:rx,y:ry,w:rw,h:rh,type:'combat'});
    for(var y=ry;y<ry+rh;y++) for(var x=rx;x<rx+rw;x++) map[y][x]=T.FLOOR;
    for(var y=ry-1;y<=ry+rh;y++) for(var x=rx-1;x<=rx+rw;x++) if(y>=0&&y<h&&x>=0&&x<w&&map[y][x]===T.VOID) map[y][x]=T.WALL;
  }
  while(rooms.length<3){var i=rooms.length,rx=5+i*15,ry=5+i*12;rooms.push({x:rx,y:ry,w:6,h:6,type:'combat'});for(var y=ry;y<ry+6;y++)for(var x=rx;x<rx+6;x++)map[y][x]=T.FLOOR;for(var y=ry-1;y<=ry+6;y++)for(var x=rx-1;x<=rx+6;x++)if(y>=0&&y<h&&x>=0&&x<w&&map[y][x]===T.VOID)map[y][x]=T.WALL;}

  function carve(ax,ay,bx,by){var cx=ax,cy=ay;while(cx!==bx){if(cy>=0&&cy<h&&cx>=0&&cx<w){if(map[cy][cx]===T.VOID||map[cy][cx]===T.WALL)map[cy][cx]=T.CORRIDOR;for(var d=-1;d<=1;d++){var ny=cy+d;if(ny>=0&&ny<h&&map[ny][cx]===T.VOID)map[ny][cx]=T.WALL;}}cx+=cx<bx?1:-1;}while(cy!==by){if(cy>=0&&cy<h&&cx>=0&&cx<w){if(map[cy][cx]===T.VOID||map[cy][cx]===T.WALL)map[cy][cx]=T.CORRIDOR;for(var d=-1;d<=1;d++){var nx=cx+d;if(nx>=0&&nx<w&&map[cy][nx]===T.VOID)map[cy][nx]=T.WALL;}}cy+=cy<by?1:-1;}}
  for(var i=1;i<rooms.length;i++){var a=rooms[i-1],b=rooms[i];carve(Math.floor(a.x+a.w/2),Math.floor(a.y+a.h/2),Math.floor(b.x+b.w/2),Math.floor(b.y+b.h/2));}
  if(rooms.length>3){var a=rooms[rooms.length-1],b=rooms[0];carve(Math.floor(a.x+a.w/2),Math.floor(a.y+a.h/2),Math.floor(b.x+b.w/2),Math.floor(b.y+b.h/2));}

  // Seal all gaps: any VOID tile adjacent (including diagonals) to a walkable tile becomes WALL
  for(var sy=1;sy<h-1;sy++){for(var sx=1;sx<w-1;sx++){
    if(map[sy][sx]!==T.VOID) continue;
    var needsWall=false;
    for(var ddy=-1;ddy<=1&&!needsWall;ddy++){for(var ddx=-1;ddx<=1&&!needsWall;ddx++){
      if(ddx===0&&ddy===0) continue;
      var nt=map[sy+ddy][sx+ddx];
      if(nt===T.FLOOR||nt===T.CORRIDOR||nt===T.DOOR) needsWall=true;
    }}
    if(needsWall) map[sy][sx]=T.WALL;
  }}

  rooms[0].type='spawn';
  var maxDist=0,stairRoom=rooms.length-1;
  for(var i=1;i<rooms.length;i++){var dx=rooms[i].x-rooms[0].x,dy=rooms[i].y-rooms[0].y;if(dx*dx+dy*dy>maxDist){maxDist=dx*dx+dy*dy;stairRoom=i;}}
  rooms[stairRoom].type='stairs';
  var mid=[];for(var i=1;i<rooms.length;i++)if(i!==stairRoom)mid.push(i);
  for(var i=mid.length-1;i>0;i--){var j=Math.floor(dRng()*(i+1)),tmp=mid[i];mid[i]=mid[j];mid[j]=tmp;}
  if(mid.length>0) rooms[mid[0]].type='shrine';
  if(mid.length>1) rooms[mid[1]].type='rest';
  if(isBossFloor&&mid.length>2) rooms[mid[2]].type='boss';

  var sr=rooms[stairRoom],sx=Math.floor(sr.x+sr.w/2),sy=Math.floor(sr.y+sr.h/2);
  map[sy][sx]=T.STAIRS;
  for(var i=0;i<rooms.length;i++){
    if(rooms[i].type==='shrine') map[Math.floor(rooms[i].y+rooms[i].h/2)][Math.floor(rooms[i].x+rooms[i].w/2)]=T.SHRINE;
    if(rooms[i].type==='rest') map[Math.floor(rooms[i].y+rooms[i].h/2)][Math.floor(rooms[i].x+rooms[i].w/2)]=T.REST;
  }

  if(biome.hazardTiles.length>0){for(var y=0;y<h;y++)for(var x=0;x<w;x++){
    if(map[y][x]===T.FLOOR&&dRng()<biome.hazardChance){
      var room=null;for(var ri=0;ri<rooms.length;ri++){var r=rooms[ri];if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h){room=r;break;}}
      if(room&&(room.type==='shrine'||room.type==='rest'||room.type==='spawn')) continue;
      map[y][x]=biome.hazardTiles[Math.floor(dRng()*biome.hazardTiles.length)];
    }
  }}

  for(var ri=0;ri<rooms.length;ri++){var room=rooms[ri];
    for(var x=room.x;x<room.x+room.w;x++){if(room.y>0&&map[room.y-1][x]===T.CORRIDOR)map[room.y][x]=T.DOOR;if(room.y+room.h<h&&map[room.y+room.h][x]===T.CORRIDOR)map[room.y+room.h-1][x]=T.DOOR;}
    for(var y=room.y;y<room.y+room.h;y++){if(room.x>0&&map[y][room.x-1]===T.CORRIDOR)map[y][room.x]=T.DOOR;if(room.x+room.w<w&&map[y][room.x+room.w]===T.CORRIDOR)map[y][room.x+room.w-1]=T.DOOR;}
  }

  // Place loot — more at deeper floors
  var lootMap={};
  var combatRooms=[];for(var i=0;i<rooms.length;i++)if(rooms[i].type==='combat')combatRooms.push(rooms[i]);
  // Guaranteed loot scales: 1 on floor 1, up to 4 by floor 12+
  var lootCount=Math.min(combatRooms.length, 1 + Math.floor(floor / 3));
  for(var li=0;li<lootCount&&li<combatRooms.length;li++){
    var lr=combatRooms[li];
    var lx=lr.x+1+Math.floor(dRng()*Math.max(1,lr.w-2));
    var ly=lr.y+1+Math.floor(dRng()*Math.max(1,lr.h-2));
    if(map[ly][lx]===T.FLOOR){map[ly][lx]=T.LOOT;lootMap[lx+','+ly]=generateLoot(floor);}
  }
  // Bonus loot in corridors on deeper floors (scattered finds from fallen explorers)
  if(floor >= 4){
    var bonusCount = Math.floor(floor / 4);
    var placed = 0;
    for(var by=1;by<h-1&&placed<bonusCount;by++){
      for(var bx=1;bx<w-1&&placed<bonusCount;bx++){
        if(map[by][bx]===T.CORRIDOR && dRng()<0.02){
          map[by][bx]=T.LOOT; lootMap[bx+','+by]=generateLoot(floor); placed++;
        }
      }
    }
  }

  var firstRoom=rooms[0];
  return{map:map,rooms:rooms,revealed:revealed,
    effects:Array.from({length:h},function(){return new Array(w).fill(null);}),
    spawnX:Math.floor(firstRoom.x+firstRoom.w/2),spawnY:Math.floor(firstRoom.y+firstRoom.h/2),
    stairsX:sx,stairsY:sy,biome:biome,isBossFloor:isBossFloor,loot:lootMap};
}

