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
ok('fresh shape schema 3', f.schema === 3);
ok('fresh shape parts', !!(f.drafts && f.registry && f.settings));

var v1 = S.migrate({ schema: 1, drafts: {}, registry: [{ id: 'TSR-aaaa-bbbb' }], settings: {} });
ok('v1 blob migrates all the way to schema 3', v1.schema === 3);
ok('v1 registry entry gains sealKey ""', v1.registry[0].sealKey === '');

var kept = S.migrate({ schema: 1, registry: [{ id: 'TSR-cccc-dddd', sealKey: 'red' }] });
ok('existing sealKey survives migration', kept.registry[0].sealKey === 'red');

var v2 = S.migrate({ schema: 2, registry: [{ id: 'TSR-eeee-ffff' }] });
ok('v2 blob migrates to schema 3', v2.schema === 3);
ok('v2 entry gains role "writer"', v2.registry[0].role === 'writer');
ok('v2 entry sealKey left alone by the 1-to-2 block', v2.registry[0].sealKey === undefined);

var cust = S.migrate({ schema: 2, registry: [{ id: 'TSR-gggg-hhhh', role: 'custodian' }] });
ok('existing role survives migration', cust.registry[0].role === 'custodian');

var v1r = S.migrate({ schema: 1, registry: [{ id: 'TSR-iiii-jjjj' }] });
ok('v1 blob walks both blocks to schema 3', v1r.schema === 3 && v1r.registry[0].sealKey === '' && v1r.registry[0].role === 'writer');

var bare = S.migrate({});
ok('empty object gets full shape at schema 3', bare.schema === 3 && Array.isArray(bare.registry));

S.load(); /* no localStorage in node: must fall back to fresh, not throw */
S.addRegistryEntry({ id: 'TSR-1111-2222', sealKey: 'blue' });
ok('registry CRUD in-memory', S.getRegistry().length === 1 && S.getRegistry()[0].sealKey === 'blue');
ok('updateRegistryEntry', S.updateRegistryEntry('TSR-1111-2222', { sealKey: 'green' }) && S.getRegistry()[0].sealKey === 'green');
ok('removeRegistryEntry', S.removeRegistryEntry('TSR-1111-2222') && S.getRegistry().length === 0);

if (!fails) console.log('state: all green');
