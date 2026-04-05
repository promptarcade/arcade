
// ============================================================
// RESOURCES — Bag/inventory system
// ============================================================

// Bag: simple resource stack storage
// bag is a plain object: { resource_id: count, ... }
// Separate from equipment (weapons/armor which have unique stats)

var Bag = {
  create: function() { return {}; },

  add: function(bag, resourceId, count) {
    count = count || 1;
    var def = ResourceRegistry.get(resourceId);
    var max = (def && def.stackMax) || 999;
    bag[resourceId] = Math.min((bag[resourceId] || 0) + count, max);
  },

  remove: function(bag, resourceId, count) {
    count = count || 1;
    if ((bag[resourceId] || 0) < count) return false;
    bag[resourceId] -= count;
    if (bag[resourceId] <= 0) delete bag[resourceId];
    return true;
  },

  has: function(bag, resourceId, count) {
    count = count || 1;
    return (bag[resourceId] || 0) >= count;
  },

  // Check if bag has all resources in a requirements object {id: count, ...}
  hasAll: function(bag, requirements) {
    for (var id in requirements) {
      if ((bag[id] || 0) < requirements[id]) return false;
    }
    return true;
  },

  // Remove all resources in a requirements object, returns false if insufficient
  removeAll: function(bag, requirements) {
    if (!Bag.hasAll(bag, requirements)) return false;
    for (var id in requirements) {
      bag[id] -= requirements[id];
      if (bag[id] <= 0) delete bag[id];
    }
    return true;
  },

  // Add all resources in an object {id: count, ...}
  addAll: function(bag, resources) {
    for (var id in resources) Bag.add(bag, id, resources[id]);
  },

  // Get non-empty entries as sorted array [{id, count, def}, ...]
  contents: function(bag) {
    var result = [];
    for (var id in bag) {
      if (bag[id] > 0) result.push({ id: id, count: bag[id], def: ResourceRegistry.get(id) });
    }
    result.sort(function(a, b) {
      var ca = a.def ? a.def.category || '' : '';
      var cb = b.def ? b.def.category || '' : '';
      return ca < cb ? -1 : ca > cb ? 1 : a.id < b.id ? -1 : 1;
    });
    return result;
  },

  count: function(bag) {
    var n = 0;
    for (var id in bag) n += bag[id];
    return n;
  },

  types: function(bag) {
    var n = 0;
    for (var id in bag) if (bag[id] > 0) n++;
    return n;
  },
};
