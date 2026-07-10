/* state.js — localStorage under the single key `tessera_v1`, with a migrate
   seam (architecture.md). Registry stores metadata only unless the writer
   explicitly kept a copy (features/registry.md privacy stance). */
(function (root) {
  'use strict';

  var KEY = 'tessera_v1';
  var cache = null;

  function fresh() {
    return { schema: 1, drafts: {}, registry: [], settings: {} };
  }

  function migrate(data) {
    if (!data || typeof data !== 'object') return fresh();
    if (!data.schema) data.schema = 1;
    if (!data.drafts) data.drafts = {};
    if (!data.registry) data.registry = [];
    if (!data.settings) data.settings = {};
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
    load: load, save: save,
    getDraft: getDraft, setDraft: setDraft, clearDraft: clearDraft,
    addRegistryEntry: addRegistryEntry, getRegistry: getRegistry,
    updateRegistryEntry: updateRegistryEntry, removeRegistryEntry: removeRegistryEntry
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraState = api;
})(typeof self !== 'undefined' ? self : this);
