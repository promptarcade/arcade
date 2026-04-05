
// ============================================================
// STATE: Inventory overlay with stash browser & wardrobe
// ============================================================
var InventoryState = {
  name: 'inventory',
  drawBelow: true,
  _cursor: 0,       // 0=weapon, 1=armor, 2=wardrobe
  _stashIdx: 0,     // index into filtered stash for current slot
  _message: '',
  _messageTimer: 0,

  onEnter: function(game) {
    this._cursor = 0;
    this._stashIdx = 0;
    this._message = '';
    this._messageTimer = 0;
    _invTab = 0;
    _invScroll = 0;
  },

  _getStashForSlot: function(player, slotType) {
    if (!player.stash || player.stash.length === 0) return [];
    return player.stash.filter(function(item) {
      if (slotType === 'weapon') return item.type === 'weapon' || item.type === 'sword' || item.type === 'wand' || item.type === 'staff';
      if (slotType === 'armor') return item.type === 'armor';
      return false;
    });
  },

  onKey: function(game, key) {
    var lk = key.toLowerCase();
    if (lk === 'i' || lk === 'escape') {
      StateStack.pop();
      return true;
    }
    // Tab switching
    if (key === 'Tab' || lk === 'q') {
      _invTab = (_invTab + 1) % INV_TABS.length;
      this._cursor = 0;
      this._stashIdx = 0;
      return true;
    }
    // Bag/Skills tabs: up/down scrolls content
    if (_invTab !== 0) {
      if (key === 'ArrowUp' || lk === 'w') { _invScroll = Math.max(0, _invScroll - 1); return true; }
      if (key === 'ArrowDown' || lk === 's') { _invScroll++; return true; }
      return true;
    }

    if (key === 'ArrowUp' || lk === 'w') {
      this._cursor = (this._cursor - 1 + 3) % 3;
      this._stashIdx = 0;
      return true;
    }
    if (key === 'ArrowDown' || lk === 's') {
      this._cursor = (this._cursor + 1) % 3;
      this._stashIdx = 0;
      return true;
    }

    var p = game.player;

    // Left/Right to browse stash when slot is empty
    if ((key === 'ArrowLeft' || lk === 'a' || key === 'ArrowRight' || lk === 'd') && this._cursor < 2) {
      var slotType = this._cursor === 0 ? 'weapon' : 'armor';
      var equipped = this._cursor === 0 ? p.weapon : p.armor;
      if (!equipped) {
        var stashItems = this._getStashForSlot(p, slotType);
        if (stashItems.length > 1) {
          if (key === 'ArrowRight' || lk === 'd') this._stashIdx = (this._stashIdx + 1) % stashItems.length;
          else this._stashIdx = (this._stashIdx - 1 + stashItems.length) % stashItems.length;
        }
      }
      return true;
    }

    // [D] Drop stashed item (destroy permanently)
    if (lk === 'd' && this._cursor < 2) {
      var slotType = this._cursor === 0 ? 'weapon' : 'armor';
      var equipped = this._cursor === 0 ? p.weapon : p.armor;
      if (!equipped) {
        var items = this._getStashForSlot(p, slotType);
        if (items.length > 0) {
          var idx = this._stashIdx % items.length;
          var item = items[idx];
          var realIdx = p.stash.indexOf(item);
          if (realIdx >= 0) p.stash.splice(realIdx, 1);
          this._message = 'Dropped ' + item.name;
          this._messageTimer = 2.0;
          this._stashIdx = 0;
          SFX.step();
        }
      }
      return true;
    }

    // [X] Salvage stashed item (reclaim materials, needs skill)
    if (lk === 'x' && this._cursor < 2) {
      var slotType = this._cursor === 0 ? 'weapon' : 'armor';
      var equipped = this._cursor === 0 ? p.weapon : p.armor;
      if (!equipped) {
        var items = this._getStashForSlot(p, slotType);
        if (items.length > 0) {
          var idx = this._stashIdx % items.length;
          var item = items[idx];
          // Skill requirement depends on item type
          var isWeaponItem = (item.type === 'weapon' || item.type === 'sword' || item.type === 'wand' || item.type === 'staff');
          var reqSkill, reqLevel, reqName;
          if (isWeaponItem) {
            // Metal weapons need mining (blacksmithing) to break down
            reqSkill = 'mining'; reqLevel = 2; reqName = 'Mining Lv.2 (blacksmith)';
          } else {
            // Armor needs gathering (leatherwork/tailoring) to break down
            reqSkill = 'gathering'; reqLevel = 2; reqName = 'Gathering Lv.2';
          }
          var skillLvl = PlayerSkills.getLevel(p.skills, reqSkill);
          if (skillLvl < reqLevel) {
            this._message = 'Need ' + reqName + ' to salvage';
            this._messageTimer = 2.0;
            return true;
          }
          var realIdx = p.stash.indexOf(item);
          if (realIdx >= 0) p.stash.splice(realIdx, 1);
          // Yield materials based on item power
          var power = (item.atk || 0) + (item.defense || 0);
          var yields = [];
          if (item.type === 'weapon' || item.type === 'sword' || item.type === 'wand' || item.type === 'staff') {
            Bag.add(p.bag, 'iron_ore', 1 + Math.floor(power / 4));
            yields.push((1 + Math.floor(power / 4)) + ' Iron Ore');
            if (power >= 5) { Bag.add(p.bag, 'branch', 2); yields.push('2 Branch'); }
          } else if (item.type === 'armor') {
            Bag.add(p.bag, 'leather', 1 + Math.floor(power / 3));
            yields.push((1 + Math.floor(power / 3)) + ' Leather');
            if (power >= 4) { Bag.add(p.bag, 'stone', 2); yields.push('2 Stone'); }
          }
          this._message = 'Salvaged ' + item.name + ': ' + yields.join(', ');
          this._messageTimer = 3.0;
          this._stashIdx = 0;
          SFX.shrine();
          PlayerSkills.addXp(p.skills, reqSkill, 3);
        }
      }
      return true;
    }

    if (lk === 'enter' || lk === ' ' || lk === 'e') {
      if (this._cursor === 0) {
        if (p.weapon) {
          // Stash current weapon
          if (!p.stash) p.stash = [];
          p.stash.push(p.weapon);
          this._message = p.weapon.name + ' \u2192 stash';
          this._messageTimer = 2.0;
          p.atk = Math.max(1, p.atk - (p.weapon.atk || 0));
          for (var ai = p.abilities.length - 1; ai >= 0; ai--) {
            if (p.abilities[ai].isWeapon) { p.abilities.splice(ai, 1); break; }
          }
          p.weapon = null;
          p.weaponType = 'fist';
          this._stashIdx = 0;
          SFX.step();
        } else {
          // Equip from stash at selected index
          var weapons = this._getStashForSlot(p, 'weapon');
          if (weapons.length > 0) {
            var idx = this._stashIdx % weapons.length;
            var w = weapons[idx];
            // Remove from stash
            var realIdx = p.stash.indexOf(w);
            if (realIdx >= 0) p.stash.splice(realIdx, 1);
            p.weapon = w;
            p.weaponType = (w.range && w.range > 1) ? 'wand' : 'sword';
            p.atk += w.atk || 0;
            var isRanged = w.range && w.range > 1;
            var abilityName = isRanged ? (w.name.indexOf('Wand') >= 0 ? 'Wand Shot' : 'Ranged Shot') : (w.name.indexOf('Sword') >= 0 ? 'Sword Strike' : 'Melee Strike');
            var wpnAbility = {
              verb: isRanged ? 'launch' : 'strike',
              element: 'physical',
              shape: isRanged ? 'line' : 'single',
              name: abilityName, damage: w.damage, cooldown: w.cd || 0,
              currentCooldown: 0, color: w.color, isWeapon: true,
            };
            if (w.range && w.range > 1) wpnAbility.maxRange = w.range;
            p.abilities.unshift(wpnAbility);
            this._message = 'Equipped ' + w.name;
            this._messageTimer = 2.0;
            this._stashIdx = 0;
            SFX.step();
          } else {
            this._message = 'Stash empty';
            this._messageTimer = 1.0;
          }
        }
      } else if (this._cursor === 1) {
        if (p.armor) {
          // Stash current armor
          if (!p.stash) p.stash = [];
          p.stash.push(p.armor);
          this._message = p.armor.name + ' \u2192 stash';
          this._messageTimer = 2.0;
          p.maxHp = Math.max(10, p.maxHp - (p.armor.hp || 0));
          p.hp = Math.min(p.hp, p.maxHp);
          p.armor = null;
          this._stashIdx = 0;
          SFX.step();
        } else {
          // Equip from stash at selected index
          var armors = this._getStashForSlot(p, 'armor');
          if (armors.length > 0) {
            var idx = this._stashIdx % armors.length;
            var a = armors[idx];
            var realIdx = p.stash.indexOf(a);
            if (realIdx >= 0) p.stash.splice(realIdx, 1);
            p.armor = a;
            p.maxHp += a.hp || 0;
            this._message = 'Equipped ' + a.name;
            this._messageTimer = 2.0;
            this._stashIdx = 0;
            SFX.step();
          } else {
            this._message = 'Stash empty';
            this._messageTimer = 1.0;
          }
        }
      } else if (this._cursor === 2) {
        StateStack.push(WardrobeState);
      }
      return true;
    }
    return true;
  },

  onDraw: function(game, ctx) {
    game.drawInventory(ctx, this._cursor, this._message, this._messageTimer, this._stashIdx, this._getStashForSlot);
    if (this._messageTimer > 0) this._messageTimer -= 1/60;
  },
};
