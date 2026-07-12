/* test-booklet.js — Gate 1 unit tests for js/booklet.js: pure saddle-stitch
   imposition (engineering/testing.md). Same assert idiom as test-manifest.js. */
'use strict';
const B = require('../js/booklet.js');

let fails = 0;
function eq(name, got, want) {
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    fails++; console.error('FAIL ' + name + '\n  got:  ' + JSON.stringify(got) + '\n  want: ' + JSON.stringify(want));
  } else console.log('ok   ' + name);
}
function ok(name, cond, extra) {
  if (!cond) { fails++; console.error('FAIL ' + name + (extra ? ' — ' + extra : '')); }
  else console.log('ok   ' + name);
}

/* saddle-stitch: N pages padded to a multiple of 4 onto N/4 duplex sheets.
   sheet i: front [n-2i, 1+2i], back [2+2i, n-1-2i]. */
eq('impose(8)', B.impose(8), [
  { front: [8, 1], back: [2, 7] },
  { front: [6, 3], back: [4, 5] }
]);
eq('impose(16) first sheet', B.impose(16)[0], { front: [16, 1], back: [2, 15] });
eq('impose(16) innermost sheet', B.impose(16)[3], { front: [10, 7], back: [8, 9] });
ok('impose(16) has 4 sheets', B.impose(16).length === 4);

/* padding: 6 content pages -> 8 slots; slots 7,8 are null (print blank) */
eq('impose(6) pads to a multiple of 4 with nulls', B.impose(6), [
  { front: [null, 1], back: [2, null] },
  { front: [6, 3], back: [4, 5] }
]);
ok('impose(6) is two sheets', B.impose(6).length === 2);

/* multiple-of-4 input needs no padding */
eq('impose(4)', B.impose(4), [{ front: [4, 1], back: [2, 3] }]);

/* sequential mode is identity 1..n */
eq('sequential(3)', B.sequential(3), [1, 2, 3]);
eq('sequential(1)', B.sequential(1), [1]);

process.exit(fails ? 1 : 0);
