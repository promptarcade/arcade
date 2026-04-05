
// ============================================================
// SYSTEM: Equipment — equip, stash, salvage, loot handling
// ============================================================

// Equip loot — handles weapon, armor, resource, scroll types
// Old equipment auto-stashes. Called from loot prompt and legacy markers.
Game.prototype.equipLoot = function(loot, lootX, lootY) {
  var old = null;
  if (loot.type === 'weapon') {
    old = this.player.weapon;
    this.player.weapon = loot;
    this.player.weaponType = loot.range > 1 ? 'wand' : 'sword';
    if (this.player.abilities.length > 0 && this.player.abilities[0].isWeapon) {
      var a = this.player.abilities[0];
      a.damage = loot.damage; a.cooldown = loot.cd || 0; a.color = loot.color;
      if (loot.range > 1) { a.verb = 'launch'; a.shape = 'line'; a.maxRange = loot.range; a.name = loot.name.indexOf('Wand') >= 0 ? 'Wand Shot' : 'Ranged Shot'; }
      else { a.verb = 'strike'; a.shape = 'single'; delete a.maxRange; a.name = loot.name.indexOf('Sword') >= 0 ? 'Sword Strike' : 'Melee Strike'; }
      a.isHeal = false;
    }
    this.addLog('Equipped ' + loot.name, '#ddaa44');
  } else if (loot.type === 'armor') {
    old = this.player.armor;
    this.player.armor = loot;
    this.addLog('Equipped ' + loot.name, '#88aacc');
  } else if (loot.type === 'resource') {
    Bag.add(this.player.bag, loot.id, loot.count || 1);
    this.addLog('Found ' + loot.name, '#ddaa44');
  } else if (loot.type === 'scroll') {
    if (this.player.abilities.length < 4) {
      this.player.abilities.push(loot.ability);
      this.addLog('Learned ' + loot.ability.name + '!', '#cc66ff');
    } else {
      this._pendingAbility = loot.ability;
      StateStack.push(ReplaceAbilityState);
      return;
    }
  }
  // Old equipment auto-stashes
  if (old && old.name) {
    if (!this.player.stash) this.player.stash = [];
    this.player.stash.push(old);
    this.addLog(old.name + ' \u2192 stash', '#888');
  }
};
