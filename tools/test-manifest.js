/* test-manifest.js — Gate 1 unit tests for js/manifest.js (engineering/testing.md) */
'use strict';
const M = require('../js/manifest.js');

let fails = 0;
function eq(name, got, want) {
  if (got !== want) { fails++; console.error('FAIL ' + name + '\n  got:  ' + JSON.stringify(got) + '\n  want: ' + JSON.stringify(want)); }
  else console.log('ok   ' + name);
}
function ok(name, cond, extra) {
  if (!cond) { fails++; console.error('FAIL ' + name + (extra ? ' — ' + extra : '')); }
  else console.log('ok   ' + name);
}

/* canonicalisation */
eq('canon CRLF→LF', M.canonLetterText('a\r\nb\r\n'), 'a\nb');
eq('canon trailing ws', M.canonLetterText('hello  \n\n  '), 'hello');
eq('canon empty', M.canonLetterText(''), '');

/* seed string exact shape (SPEC §5) */
const f = {
  openOn: '2044-06-21', written: '2026-07-10', from: 'Rika',
  to: 'My daughter, on her eighteenth birthday', letter: 'Dear one,\r\nBe brave.\n'
};
eq('seed string', M.tokenSeedString(f),
  'tessera:0.1\n2044-06-21\n2026-07-10\nRika\nMy daughter, on her eighteenth birthday\nDear one,\nBe brave.');

/* ID derivation (SPEC §4) */
eq('deriveId', M.deriveId('9C1185A5c5e9fc54612808977ee8f548'), 'TSR-9c11-85a5');

/* dates in words */
eq('date words 21 Jun 2044', M.dateInWords('2044-06-21'), 'the twenty-first of June, two thousand and forty-four');
eq('date words 1 Jan 2100', M.dateInWords('2100-01-01'), 'the first of January, two thousand one hundred');
eq('date words 30 Nov 2030', M.dateInWords('2030-11-30'), 'the thirtieth of November, two thousand and thirty');
eq('date words 3 Mar 2126', M.dateInWords('2126-03-03'), 'the third of March, two thousand one hundred and twenty-six');
eq('date words 12 Dec 2000', M.dateInWords('2000-12-12'), 'the twelfth of December, two thousand');
eq('date words bad input passthrough', M.dateInWords('not-a-date'), 'not-a-date');

/* manifest shape (schema doc) */
const man = M.buildManifest({
  id: 'TSR-9c11-85a5', written: '2026-07-10', openOn: '2044-06-21',
  from: 'Rika', to: 'My daughter', occasion: 'milestone-18', language: 'en',
  custody: [{ holder: 'Gustav', instructions: 'Keep with the family papers.' }],
  tokenSeed: 'abc123'
});
eq('manifest version', man.tessera, '0.1');
eq('manifest algo', man.checksumAlgo, 'SHA-256');
eq('manifest writeback null', man.writeback, null);
ok('manifest key order starts tessera,id', JSON.stringify(Object.keys(man).slice(0, 2)) === '["tessera","id"]');
ok('manifest json ends with newline', M.manifestJson({ id: 'x', written: 'w', openOn: 'o', from: 'f', to: 't', tokenSeed: 's' }).endsWith('\n'));
ok('manifest omits empty optionals', !('occasion' in M.buildManifest({ id: 'x', written: 'w', openOn: 'o', from: 'f', to: 't', tokenSeed: 's' })));

/* README rendering (template doc) */
const readme = M.renderReadme({
  id: 'TSR-9c11-85a5', written: '2026-07-10', openOn: '2044-06-21',
  from: 'Rika', to: 'My daughter, on her eighteenth birthday',
  custody: [{ holder: 'Gustav', instructions: 'Keep with the family papers.' }]
});
ok('readme headline', readme.indexOf('THIS IS A LETTER MEANT FOR THE FUTURE.') !== -1);
const flat = readme.replace(/\n {16}/g, ' '); // unfold label continuations for substring checks
ok('readme has ISO beside words', flat.indexOf('the twenty-first of June, two thousand and forty-four (2044-06-21)') !== -1);
ok('readme four sections', ['IF YOU ARE THE PERSON THIS IS FOR', 'IF YOU FOUND THIS AND DON\'T KNOW WHAT IT IS', 'WHAT THE OTHER FILES ARE', 'ABOUT THIS FORMAT']
  .every(h => readme.indexOf(h) !== -1));
ok('readme load-bearing sentence', readme.indexOf('Please do not destroy it unread.') !== -1);
ok('readme custody prose', readme.replace(/\s+/g, ' ').indexOf('Gustav (Keep with the family papers.)') !== -1);
ok('readme no box-drawing chars', !/[─-╿]/.test(readme));
ok('readme wrapped ≤ 66 cols', readme.split('\n').every(l => l.length <= 66),
  'long lines: ' + JSON.stringify(readme.split('\n').filter(l => l.length > 66)));

/* writeback: reply lineage (v0.2 opening) */
const reply = M.buildManifest({
  id: 'TSR-1111-2222', written: '2026-07-10', openOn: '2036-07-10',
  from: 'A', to: 'B', tokenSeed: 's',
  writeback: { inReplyTo: 'TSR-9c11-85a5', generation: 2 }
});
ok('manifest carries writeback', reply.writeback && reply.writeback.inReplyTo === 'TSR-9c11-85a5' && reply.writeback.generation === 2);
const rwb = M.renderReadme({
  id: 'TSR-1111-2222', written: '2026-07-10', openOn: '2036-07-10',
  from: 'A', to: 'B',
  writeback: { inReplyTo: 'TSR-9c11-85a5', generation: 2 }
});
ok('readme speaks the lineage (manifest-in-prose rule)',
  rwb.indexOf('In answer to:   TSR-9c11-85a5 (letter 2 in its exchange)') !== -1);
ok('readme lineage wrapped ≤ 66 cols', rwb.split('\n').every(l => l.length <= 66));
ok('originating readme has no lineage line', readme.indexOf('In answer to') === -1);

/* encryption: optional field, present only when the letter file is locked (v0.2) */
const encMan = M.buildManifest({
  id: 'TSR-3333-4444', written: '2026-07-10', openOn: '2046-07-10',
  from: 'A', to: 'B', tokenSeed: 's',
  encryption: { algo: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iterations: 600000, salt: 'c2FsdA==', iv: 'aXY=', hint: 'our first city' }
});
ok('manifest carries encryption when set', encMan.encryption && encMan.encryption.algo === 'AES-256-GCM' && encMan.encryption.kdf === 'PBKDF2-SHA256');
ok('manifest encryption keeps the hint', encMan.encryption.hint === 'our first city');
ok('manifest stays version 0.1 with encryption (additive field)', encMan.tessera === '0.1');
ok('manifest omits encryption when absent', !('encryption' in M.buildManifest({ id: 'x', written: 'w', openOn: 'o', from: 'f', to: 't', tokenSeed: 's' })));

/* open-when: no-date variant */
const rn = M.renderReadme({
  id: 'TSR-aaaa-bbbb', written: '2026-07-10', openOn: '2026-07-10',
  from: 'R', to: 'You, on a hard night', openWhenNeeded: true
});
ok('open-when replaces date line', rn.indexOf('when it is needed (its title says when)') !== -1);
ok('open-when finder text', rn.indexOf('when its moment came') !== -1);

process.exit(fails ? 1 : 0);
