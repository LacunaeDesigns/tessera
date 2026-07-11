/* test-token.js — Gate 1 tests for the token renderers: generation 2
   (js/token.js, watercolor mosaic) and the frozen generation 1
   (js/token-legacy.js, mosaic ring). Determinism fixtures, structural
   validity, forbidden-source scan (docs/features/token.md).
   A fixture diff is a format event — never regenerate silently. */
'use strict';
const T = require('../js/token.js');
const TL = require('../js/token-legacy.js');
const M = require('../js/manifest.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let fails = 0;
function ok(name, cond, extra) {
  if (!cond) { fails++; console.error('FAIL ' + name + (extra ? ' — ' + extra : '')); }
  else console.log('ok   ' + name);
}

/* fixture seeds: SHA-256 of two reference letters (unchanged since gen 1) */
const fix1 = crypto.createHash('sha256').update(M.tokenSeedString({
  openOn: '2044-06-21', written: '2026-07-10', from: 'Rika',
  to: 'My daughter, on her eighteenth birthday', letter: 'Dear one,\nBe brave.\n'
})).digest('hex');
const fix2 = crypto.createHash('sha256').update(M.tokenSeedString({
  openOn: '2126-12-21', written: '2026-07-10', from: 'Someone who was 31 in 2026',
  to: 'Whoever finds this', letter: 'Hello from the year the solstice letters began.\n'
})).digest('hex');
const id1 = 'TSR-' + fix1.slice(0, 4) + '-' + fix1.slice(4, 8);
const id2 = 'TSR-' + fix2.slice(0, 4) + '-' + fix2.slice(4, 8);

const fixDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixDir)) fs.mkdirSync(fixDir);

/* both generations walk the same checks */
for (const [gen, R, fixNames] of [
  ['gen2', T, ['token-fix1.svg', 'token-fix2.svg']],
  ['legacy', TL, ['token-legacy-fix1.svg', 'token-legacy-fix2.svg']]
]) {
  const t1 = R.renderTokenSvg(fix1, id1);
  const t2 = R.renderTokenSvg(fix2, id2);
  const t1b = R.renderTokenSvg(fix1, id1);

  ok(gen + ' deterministic full', t1.full === t1b.full);
  ok(gen + ' deterministic sheet', t1.sheet === t1b.sheet);
  ok(gen + ' seeds differ', t1.full !== t2.full);

  for (const [name, t] of [[gen + ' fix1', t1], [gen + ' fix2', t2]]) {
    ok(name + ' full is svg', t.full.startsWith('<svg') && t.full.endsWith('</svg>'));
    ok(name + ' halves non-empty clips', t.left.includes('clipPath') && t.right.includes('clipPath'));
    ok(name + ' halves contain tiles', (t.left.match(/<polygon/g) || []).length > 20 && (t.right.match(/<polygon/g) || []).length > 20);
    ok(name + ' sheet carries ID twice', (t.sheet.match(/TSR-/g) || []).length >= 2);
    const scanBody = t.sheet.split('xmlns="http://www.w3.org/2000/svg"').join('');
    ok(name + ' no external refs', !/https?:|url\(['"]?http|xlink:href=/.test(scanBody));
    ok(name + ' generic fonts only', !/font-family="(?!monospace|serif|sans-serif)/.test(t.sheet));
    ok(name + ' no scripts', !/<script/.test(t.sheet));
    ok(name + ' no filters', !/<filter|feGaussian/i.test(t.sheet));
  }

  /* committed fixtures: byte-identical across releases */
  for (const [file, svg] of [[fixNames[0], t1.sheet], [fixNames[1], t2.sheet]]) {
    const p = path.join(fixDir, file);
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, svg);
      console.log('wrote new fixture ' + file + ' (first run — commit it)');
    } else {
      ok('fixture ' + file + ' unchanged', fs.readFileSync(p, 'utf8') === svg,
        'TOKEN BYTES CHANGED — this is a format event (docs/features/token.md)');
    }
  }
}

/* the two generations must differ (otherwise the fallback is meaningless) */
ok('generations differ', T.renderTokenSvg(fix1, id1).full !== TL.renderTokenSvg(fix1, id1).full);

/* gen 2 look: washes present beneath a finer field */
const g2 = T.renderTokenSvg(fix1, id1);
ok('gen2 has fill-opacity washes', /fill-opacity="0\.[3-7]/.test(g2.full));
ok('gen2 field is finer than gen1', (g2.full.match(/<polygon/g) || []).length > (TL.renderTokenSvg(fix1, id1).full.match(/<polygon/g) || []).length);

/* forbidden-source scan, both files */
for (const f of ['token.js', 'token-legacy.js']) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  ok('no Math.random in ' + f, !/Math\.random\s*\(/.test(src));
  ok('no Date in ' + f, !/\bnew Date\b|\bDate\.now\b/.test(src));
  ok('no toLocale in ' + f, src.indexOf('toLocale') === -1);
}

process.exit(fails ? 1 : 0);
