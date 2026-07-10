/* state.js — localStorage under the single key `tessera_v1`, with a migrate
   seam (architecture.md). Registry stores metadata only unless the writer
   explicitly kept a copy (features/registry.md privacy stance). */
(function (root) {
  'use strict';

  var KEY = 'tessera_v1';
  var cache = null;

  function fresh() {
    return { schema: 3, drafts: {}, registry: [], settings: {} };
  }

  function migrate(data) {
    if (!data || typeof data !== 'object') return fresh();
    if (!data.schema) data.schema = 1;
    if (!data.drafts) data.drafts = {};
    if (!data.registry) data.registry = [];
    if (!data.settings) data.settings = {};
    if (data.schema < 2) {
      /* schema 2: registry entries may carry sealKey (the front door's wax
         choice); older entries default to '' and renderers fall back */
      for (var i = 0; i < data.registry.length; i++) {
        if (data.registry[i].sealKey === undefined) data.registry[i].sealKey = '';
      }
      data.schema = 2;
    }
    if (data.schema < 3) {
      /* schema 3: registry entries carry a role — "writer" (sealed here),
         "custodian" (kept for someone, never opened), "opened" (reserved);
         everything before schema 3 was sealed by the writer */
      for (var j = 0; j < data.registry.length; j++) {
        if (data.registry[j].role === undefined) data.registry[j].role = 'writer';
      }
      data.schema = 3;
    }
    return data;
  }

  function load() {
    if (cache) return cache;
    try {
      var raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(KEY) : null;
      cache = migrate(raw ? JSON.parse(raw) : null);
    } catch (e) {
      cache = fresh();
    }
    return cache;
  }

  function save() {
    if (!cache) return;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(cache));
    } catch (e) { /* storage full or blocked: the folder is the letter, not this cache */ }
  }

  function getDraft(slot) { return load().drafts[slot] || null; }
  function setDraft(slot, draft) { load().drafts[slot] = draft; save(); }
  function clearDraft(slot) { delete load().drafts[slot]; save(); }

  function addRegistryEntry(entry) { load().registry.push(entry); save(); }
  function getRegistry() { return load().registry.slice(); }
  function updateRegistryEntry(id, patch) {
    var reg = load().registry;
    for (var i = 0; i < reg.length; i++) {
      if (reg[i].id === id) {
        for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) reg[i][k] = patch[k];
        save();
        return true;
      }
    }
    return false;
  }
  function removeRegistryEntry(id) {
    var reg = load().registry;
    for (var i = 0; i < reg.length; i++) {
      if (reg[i].id === id) { reg.splice(i, 1); save(); return true; }
    }
    return false;
  }

  var api = {
    load: load, save: save, migrate: migrate,
    getDraft: getDraft, setDraft: setDraft, clearDraft: clearDraft,
    addRegistryEntry: addRegistryEntry, getRegistry: getRegistry,
    updateRegistryEntry: updateRegistryEntry, removeRegistryEntry: removeRegistryEntry
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraState = api;
})(typeof self !== 'undefined' ? self : this);
