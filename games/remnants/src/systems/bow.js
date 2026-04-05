
// ============================================================
// SYSTEM: Bow & Arrows — ranged hunting and combat
// ============================================================
// Bows are equippable weapons. Arrows are consumable ammo.
// Shooting uses arrows from the bag. No arrows = can't shoot.
// Enables hunting passive animals at range.

// Register resources
ResourceRegistry.add({ id: 'bow', name: 'Bow', color: '#886633', category: 'tool', stackMax: 3 });
ResourceRegistry.add({ id: 'reinforced_bow', name: 'Reinforced Bow', color: '#aa7744', category: 'tool', stackMax: 3 });
ResourceRegistry.add({ id: 'arrow', name: 'Arrow', color: '#998866', category: 'ammo', stackMax: 99 });
ResourceRegistry.add({ id: 'raw_meat', name: 'Raw Meat', color: '#cc5544', category: 'food', stackMax: 50 });
ResourceRegistry.add({ id: 'hide', name: 'Hide', color: '#997755', category: 'material', stackMax: 50 });
ResourceRegistry.add({ id: 'feather', name: 'Feather', color: '#ddddcc', category: 'material', stackMax: 50 });

// Bow weapon definitions
var BOW_WEAPONS = {
  bow:            { name: 'Bow',            atk: 5,  range: 5, color: '#886633', desc: 'Ranged — uses arrows' },
  reinforced_bow: { name: 'Reinforced Bow', atk: 9,  range: 6, color: '#aa7744', desc: 'Stronger bow — uses arrows' },
};

// Recipes
RecipeRegistry.addAll([
  { skill: 'gathering', level: 1, name: 'Bow',            input: { branch: 5, worm: 3 },                 output: { bow: 1 } },
  { skill: 'gathering', level: 1, name: 'Arrow x5',       input: { branch: 2, flint: 1 },                output: { arrow: 5 } },
  { skill: 'gathering', level: 2, name: 'Arrow x5 (feathered)', input: { branch: 2, flint: 1, feather: 1 }, output: { arrow: 5 } },
  { skill: 'gathering', level: 3, name: 'Reinforced Bow',  input: { branch: 3, leather: 3, iron_bar: 1 }, output: { reinforced_bow: 1 }, requires: ['Bow', 'Iron Bar'] },
]);

// Cooking: raw meat -> roast meat (already exists as a recipe input, just need the raw version)
RecipeRegistry.addAll([
  { skill: 'cooking', level: 0, name: 'Roast Meat (from raw)', input: { raw_meat: 2 }, output: { roast_meat: 1 } },
]);

// When player crafts a bow, auto-add weapon to stash
var _bowCraftPatched = false;
GameEvents.on('turnEnd', function(game) {
  if (_bowCraftPatched) return;
  var cs = window['Crafting' + 'State'];
  if (!cs || !cs._craft) return;
  _bowCraftPatched = true;
  var _origCraft = cs._craft;
  cs._craft = function(game) {
    var prevBag = {};
    for (var id in game.player.bag) prevBag[id] = game.player.bag[id];
    _origCraft.call(this, game);
    var bows = ['bow', 'reinforced_bow'];
    for (var i = 0; i < bows.length; i++) {
      var bid = bows[i];
      if ((game.player.bag[bid] || 0) > (prevBag[bid] || 0)) {
        var bw = BOW_WEAPONS[bid];
        if (!game.player.stash) game.player.stash = [];
        game.player.stash.push({
          type: 'weapon', name: bw.name, range: bw.range, damage: bw.atk + 2,
          cd: 0, atk: bw.atk, color: bw.color, desc: bw.desc, isBow: true
        });
        GameUtils.addLog(bw.name + ' added to equipment stash.', bw.color);
      }
    }
  };
});

// Bow ability — "Shoot Arrow" replaces the weapon's default ability when a bow is equipped
// This hooks into the ability system: when weapon has isBow, the weapon ability consumes arrows
GameEvents.on('turnEnd', function(game) {
  if (!game.player || !game.player.weapon) return;
  // Ensure bow weapon has the shoot ability
  if (game.player.weapon.isBow && game.player.abilities.length > 0) {
    var ab = game.player.abilities[0];
    if (!ab._isBowShot) {
      // Replace slot 0 with Shoot Arrow
      game.player.abilities[0] = {
        verb: 'launch', element: 'physical', shape: 'line',
        name: 'Shoot Arrow', damage: game.player.weapon.atk || 5,
        cooldown: 0, currentCooldown: 0, color: '#ccaa66',
        maxRange: game.player.weapon.range || 5,
        _isBowShot: true, _consumesArrow: true,
      };
    }
  }
});

// Hook into useAbility to consume arrows
var _bowAbilityPatched = false;
GameEvents.on('modeChange', function() {
  if (_bowAbilityPatched) return;
  var g = globalThis.game;
  if (!g || !g.useAbility) return;
  _bowAbilityPatched = true;
  var _origUseAbility = g.useAbility.bind(g);
  g.useAbility = function(idx, dx, dy) {
    var ab = this.player.abilities[idx];
    if (ab && ab._consumesArrow) {
      if (!Bag.has(this.player.bag, 'arrow')) {
        GameUtils.addLog('No arrows!', '#cc6644');
        return;
      }
      Bag.remove(this.player.bag, 'arrow', 1);
      var remaining = this.player.bag.arrow || 0;
      GameUtils.addLog('Arrow! (' + remaining + ' left)', '#ccaa66');
    }
    _origUseAbility(idx, dx, dy);
  };
});
