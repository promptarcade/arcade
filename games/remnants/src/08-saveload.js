
// ============================================================
// SAVE / LOAD — Event-driven persistence
// ============================================================
// Systems register save/load handlers. On save, each handler
// returns its data. On load, each handler receives its data back.
//
// Usage:
//   SaveSystem.register('woodcutting', {
//     save: function() { return { stumps: [...] }; },
//     load: function(data) { /* restore stumps */ },
//   });

var SaveSystem = (function() {
  var handlers = {};     // id -> { save: fn, load: fn }
  var STORAGE_KEY = 'wanderlust_save';

  return {
    register: function(id, handler) {
      handlers[id] = handler;
    },

    // Collect data from all handlers and write to localStorage
    save: function() {
      var data = { _version: 1, _timestamp: Date.now() };
      for (var id in handlers) {
        if (handlers[id].save) {
          try { data[id] = handlers[id].save(); }
          catch (e) { console.warn('Save failed for ' + id, e); }
        }
      }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
      catch (e) { console.warn('Save to localStorage failed', e); }
      GameEvents.fire('saved', data);
    },

    // Read from localStorage and distribute to handlers
    load: function() {
      var raw;
      try { raw = localStorage.getItem(STORAGE_KEY); }
      catch (e) { return false; }
      if (!raw) return false;
      var data;
      try { data = JSON.parse(raw); } catch (e) { return false; }
      for (var id in handlers) {
        if (handlers[id].load && data[id] !== undefined) {
          try { handlers[id].load(data[id]); }
          catch (e) { console.warn('Load failed for ' + id, e); }
        }
      }
      GameEvents.fire('loaded', data);
      return true;
    },

    // Check if a save exists
    hasSave: function() {
      try { return !!localStorage.getItem(STORAGE_KEY); }
      catch (e) { return false; }
    },

    // Delete save
    deleteSave: function() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    },

    // Get raw save data (for export)
    exportSave: function() {
      try { return localStorage.getItem(STORAGE_KEY); }
      catch (e) { return null; }
    },

    // Import raw save data
    importSave: function(jsonStr) {
      try {
        JSON.parse(jsonStr); // validate
        localStorage.setItem(STORAGE_KEY, jsonStr);
        return true;
      } catch (e) { return false; }
    },
  };
})();
