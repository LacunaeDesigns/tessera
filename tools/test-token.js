/* test-token.js — Gate 1 tests for js/token.js: determinism fixtures,
   structural validity, forbidden-source scan (docs/features/token.md).
   A fixture diff is a format event — never regenerate silently. */
'use strict';
const T = require('../js/token.js');
const M = require('../js/manifest.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let fails = 0;
function ok(name, cond, extra) {
  if (!cond) { fails++; console.error('FAIL ' + name + (extra ? ' — ' + extra : '')); }
  else console.log('ok   ' + name);
}

/* fixture seeds: SHA-256 of two reference letters */
const fix1 = crypto.createHash('sha256').update(M.tokenSeedString({
  openOn: '2044-06-21', written: '2026-07-10', from: 'Rika',
  to: 'My daughter, on her eighteenth birthday', letter: 'Dear one,\nBe brave.\n'
})).digest('hex');
const fix2 = crypto.createHash('sha256').update(M.tokenSeedString({
  openOn: '2126-12-21', written: '2026-07-10', from: 'Someone who was 31 in 2026',
  to: 'Whoever finds this', letter: 'Hello from the year the solstice letters began.\n'
})).digest('hex');

const t1 = T.renderTokenSvg(fix1, 'TSR-' + fix1.slice(0, 4) + '-' + fix1.slice(4, 8));
const t2 = T.renderTokenSvg(fix2, 'TSR-' + fix2.slice(0, 4) + '-' + fix2.slice(4, 8));

/* determinism: same seed twice ⇒ byte-identical */
const t1b = T.renderTokenSvg(fix1, 'TSR-' + fix1.slice(0, 4) + '-' + fix1.slice(4, 8));
ok('deterministic full', t1.full === t1b.full);
ok('deterministic sheet', t1.sheet === t1b.sheet);
/* different seeds ⇒ different art */
ok('seeds differ', t1.full !== t2.full);

/* structural validity */
for (const [name, t] of [['fix1', t1], ['fix2', t2]]) {
  ok(name + ' full is svg', t.full.startsWith('<svg') && t.full.endsWith('</svg>'));
  ok(name + ' halves non-empty clips', t.left.includes('clipPath') && t.right.includes('clipPath'));
  ok(name + ' halves contain tiles', (t.left.match(/<polygon/g) || []).length > 20 && (t.right.match(/<polygon/g) || []).length > 20);
  ok(name + ' sheet carries ID twice', (t.sheet.match(/TSR-/g) || []).length >= 2);
  const scanBody = t.sheet.split('xmlns="http://www.w3.org/2000/svg"').join(''); // the ns declaration is not a fetch
  ok(name + ' no external refs', !/https?:|url\(['"]?http|xlink:href=/.test(scanBody));
  ok(name + ' generic fonts only', !/font-family="(?!monospace|serif|sans-serif)/.test(t.sheet));
  ok(name + ' no scripts', !/<script/.test(t.sheet));
}

/* committed fixtures: byte-identical across releases */
const fixDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixDir)) fs.mkdirSync(fixDir);
for (const [file, svg] of [['token-fix1.svg', t1.sheet], ['token-fix2.svg', t2.sheet]]) {
  const p = path.join(fixDir, file);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, svg);
    console.log('wrote new fixture ' + file + ' (first run — commit it)');
  } else {
    ok('fixture ' + file + ' unchanged', fs.readFileSync(p, 'utf8') === svg,
      'TOKEN BYTES CHANGED — this is a format event (docs/features/token.md)');
  }
}

/* forbidden-source scan */
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'token.js'), 'utf8');
ok('no Math.random in token.js', !/Math\.random\s*\(/.test(src)); // calls, not the contract comment
ok('no Date in token.js', !/\bnew Date\b|\bDate\.now\b/.test(src));
ok('no toLocale in token.js', src.indexOf('toLocale') === -1);

process.exit(fails ? 1 : 0);
