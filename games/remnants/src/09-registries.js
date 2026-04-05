
// ============================================================
// REGISTRIES — Plugin architecture for extensible systems
// ============================================================

// Tile Registry — maps tile IDs to definitions
var TileRegistry = (function() {
  var nextId = 100; // custom tiles start at 100, below 100 reserved for core
  var tiles = {};   // id -> { name, solid, interact, draw, light, damage, ... }
  return {
    // Register a tile type, returns its numeric ID
    add: function(def) {
      var id = def.id || nextId++;
      tiles[id] = def;
      return id;
    },
    get: function(id) { return tiles[id] || null; },
    isSolid: function(id) { var t = tiles[id]; return t ? !!t.solid : false; },
    getDrawer: function(id) { var t = tiles[id]; return t ? t.draw : null; },
    getInteraction: function(id) { var t = tiles[id]; return t ? t.onInteract : null; },
    getLight: function(id) { var t = tiles[id]; return t ? t.light : null; },
    getDamage: function(id) { var t = tiles[id]; return t ? t.damage : null; },
    all: function() { return tiles; },
  };
})();

// Resource Registry — defines all resource types
var ResourceRegistry = (function() {
  var resources = {}; // id -> { name, icon, color, stackMax, category }
  return {
    add: function(def) { resources[def.id] = def; },
    get: function(id) { return resources[id] || null; },
    all: function() { return resources; },
    getByCategory: function(cat) {
      var result = [];
      for (var id in resources) if (resources[id].category === cat) result.push(resources[id]);
      return result;
    },
  };
})();

// Biome Registry — defines overworld biome types
var BiomeRegistry = (function() {
  var biomes = {}; // id -> { name, palette, groundTile, density, enemies, ... }
  return {
    add: function(def) { biomes[def.id] = def; },
    get: function(id) { return biomes[id] || null; },
    all: function() { return biomes; },
    list: function() { var r = []; for (var id in biomes) r.push(biomes[id]); return r; },
  };
})();

// Skill Registry — defines skill systems
var SkillRegistry = (function() {
  var skills = {}; // id -> { name, onInteract, populate, drawTile, recipes, ... }
  return {
    add: function(def) { skills[def.id] = def; },
    get: function(id) { return skills[id] || null; },
    all: function() { return skills; },
    list: function() { var r = []; for (var id in skills) r.push(skills[id]); return r; },
    // Find all skills that handle a given tile type
    getHandlersForTile: function(tileId) {
      var handlers = [];
      for (var id in skills) {
        var s = skills[id];
        if (s.tileIds && s.tileIds.indexOf(tileId) >= 0 && s.onInteract) {
          handlers.push({ skill: s, handler: s.onInteract });
        }
      }
      return handlers;
    },
  };
})();

// Recipe Registry — crafting recipes from all systems
var RecipeRegistry = (function() {
  var recipes = []; // { input: {id:count,...}, output: {id:count,...}, skill: id, level: n, name: '' }
  return {
    add: function(recipe) { recipes.push(recipe); },
    addAll: function(arr) { for (var i = 0; i < arr.length; i++) recipes.push(arr[i]); },
    getForSkill: function(skillId) {
      return recipes.filter(function(r) { return r.skill === skillId; });
    },
    getAvailable: function(bag, playerSkills) {
      return recipes.filter(function(r) {
        // Check skill level
        if (r.skill && r.level) {
          var sl = playerSkills[r.skill];
          if (!sl || sl.level < r.level) return false;
        }
        // Check resources
        for (var id in r.input) {
          if ((bag[id] || 0) < r.input[id]) return false;
        }
        return true;
      });
    },
    // Check if a recipe's prerequisites are met
    checkPrereqs: function(recipe, craftedSet) {
      if (!recipe.requires || recipe.requires.length === 0) return true;
      for (var i = 0; i < recipe.requires.length; i++) {
        if (!craftedSet[recipe.requires[i]]) return false;
      }
      return true;
    },
    all: function() { return recipes; },
  };
})();
