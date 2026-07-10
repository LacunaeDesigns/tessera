/* test-state.js — storage shape and the migrate seam. Schema 2: registry
   entries carry sealKey (wax choice from the front door); old blobs backfill. */
'use strict';
var path = require('path');
var S = require(path.join(__dirname, '..', 'js', 'state.js'));

var fails = 0;
function ok(name, cond) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name);
  if (!cond) { fails++; process.exitCode = 1; }
}

var f = S.migrate(null);
ok('fresh shape schema 2', f.schema === 2);
ok('fresh shape parts', !!(f.drafts && f.registry && f.settings));

var v1 = S.migrate({ schema: 1, drafts: {}, registry: [{ id: 'TSR-aaaa-bbbb' }], settings: {} });
ok('v1 blob migrates to schema 2', v1.schema === 2);
ok('v1 registry entry gains sealKey ""', v1.registry[0].sealKey === '');

var kept = S.migrate({ schema: 1, registry: [{ id: 'TSR-cccc-dddd', sealKey: 'red' }] });
ok('existing sealKey survives migration', kept.registry[0].sealKey === 'red');

var v2 = S.migrate({ schema: 2, registry: [{ id: 'TSR-eeee-ffff' }] });
ok('v2 blob passes through untouched', v2.schema === 2 && v2.registry[0].sealKey === undefined);

var bare = S.migrate({});
ok('empty object gets full shape at schema 2', bare.schema === 2 && Array.isArray(bare.registry));

S.load(); /* no localStorage in node: must fall back to fresh, not throw */
S.addRegistryEntry({ id: 'TSR-1111-2222', sealKey: 'blue' });
ok('registry CRUD in-memory', S.getRegistry().length === 1 && S.getRegistry()[0].sealKey === 'blue');
ok('updateRegistryEntry', S.updateRegistryEntry('TSR-1111-2222', { sealKey: 'green' }) && S.getRegistry()[0].sealKey === 'green');
ok('removeRegistryEntry', S.removeRegistryEntry('TSR-1111-2222') && S.getRegistry().length === 0);

if (!fails) console.log('state: all green');
