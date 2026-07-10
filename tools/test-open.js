/* test-open.js — Gate 1 tests for js/open.js verification core: clean pass,
   tamper detection (warn, never block), manifest-damage fallback to README,
   and a zip round-trip with folder prefixes (engineering/testing.md) */
'use strict';
const M = require('../js/manifest.js');
const T = require('../js/token.js');
const Z = require('../js/zip.js');
const O = require('../js/open.js');
const crypto = require('crypto');

let fails = 0;
function ok(name, cond, extra) {
  if (!cond) { fails++; console.error('FAIL ' + name + (extra ? ' — ' + extra : '')); }
  else console.log('ok   ' + name);
}

function sha(strOrBytes) {
  return crypto.createHash('sha256').update(typeof strOrBytes === 'string' ? Buffer.from(strOrBytes, 'utf8') : Buffer.from(strOrBytes)).digest('hex');
}

/* build a letter folder with the real format helpers (the seal path in miniature) */
function buildFolder(overrides) {
  const fields = Object.assign({
    to: 'Whoever tests the opening',
    from: 'The v0.2 suite',
    written: '2026-07-10',
    openOn: '2031-07-10',
    occasion: 'future-self',
    language: 'en',
    custody: [{ holder: 'The test bench', instructions: 'Keep it green.' }],
    letter: 'Dear opener,\n\nIf you can verify this, the door works.\n'
  }, overrides || {});
  const letterText = M.canonLetterText(fields.letter) + '\n';
  const seedHex = sha(M.tokenSeedString(fields));
  const id = M.deriveId(seedHex);
  const f = {
    id: id, written: fields.written, openOn: fields.openOn,
    from: fields.from, to: fields.to, occasion: fields.occasion,
    language: fields.language, custody: fields.custody, tokenSeed: seedHex,
    writeback: fields.writeback || null
  };
  const files = [
    { name: 'README.txt', data: M.renderReadme(f) },
    { name: 'letter.txt', data: letterText },
    { name: 'manifest.json', data: M.manifestJson(f) },
    { name: 'token.svg', data: T.renderTokenSvg(seedHex, id).sheet + '\n' }
  ];
  let checks = '';
  for (const file of files) checks += sha(file.data) + '  ' + file.name + '\n';
  files.push({ name: 'checksums.txt', data: checks });
  return { files: files.map(fl => ({ name: fl.name, data: Z.utf8(fl.data) })), id: id, seedHex: seedHex };
}

(async function () {
  /* 1. a clean folder verifies clean */
  const clean = buildFolder();
  const v1 = await O.verifyLetter(clean.files);
  ok('clean: facts from manifest', v1.facts && v1.facts.source === 'manifest' && v1.facts.id === clean.id);
  ok('clean: every checksum ok', v1.checks.length === 4 && v1.checks.every(c => c.ok));
  ok('clean: token matches re-derivation', v1.tokenOk === true);
  ok('clean: no warnings', v1.warnings.length === 0, JSON.stringify(v1.warnings));
  ok('clean: letter text returned', /the door works/.test(v1.letterText));

  /* 2. a tampered letter warns and never blocks */
  const tampered = buildFolder();
  const idx = tampered.files.findIndex(f => f.name === 'letter.txt');
  tampered.files[idx] = { name: 'letter.txt', data: Z.utf8('Dear opener,\n\nIf you can verify this, the door works.\n\nP.S. someone edited this.\n') };
  const v2 = await O.verifyLetter(tampered.files);
  const letterCheck = v2.checks.find(c => c.file === 'letter.txt');
  ok('tamper: letter checksum fails', letterCheck && letterCheck.ok === false);
  ok('tamper: other checksums still ok', v2.checks.filter(c => c.file !== 'letter.txt').every(c => c.ok));
  ok('tamper: token no longer matches', v2.tokenOk === false);
  ok('tamper: warned about it', v2.warnings.length > 0);
  ok('tamper: reading still allowed', /someone edited this/.test(v2.letterText));

  /* 3. a damaged manifest falls back to README (the letter outranks its metadata) */
  const damaged = buildFolder();
  const mIdx = damaged.files.findIndex(f => f.name === 'manifest.json');
  damaged.files[mIdx] = { name: 'manifest.json', data: Z.utf8('{ this is not json') };
  const v3 = await O.verifyLetter(damaged.files);
  ok('fallback: facts read from README', v3.facts && v3.facts.source === 'readme');
  ok('fallback: id survives', v3.facts.id === damaged.id);
  ok('fallback: dates survive', v3.facts.written === '2026-07-10' && v3.facts.openOn === '2031-07-10');
  ok('fallback: parties survive', v3.facts.from === 'The v0.2 suite' && v3.facts.to === 'Whoever tests the opening');
  ok('fallback: warned about the manifest', v3.warnings.some(w => /manifest/i.test(w)));

  /* 3b. a reply letter: writeback rides the manifest into the facts */
  const replyF = buildFolder({ writeback: { inReplyTo: 'TSR-9c11-85a5', generation: 3 } });
  const v3b = await O.verifyLetter(replyF.files);
  ok('writeback: facts carry the lineage', v3b.facts.writeback && v3b.facts.writeback.inReplyTo === 'TSR-9c11-85a5' && v3b.facts.writeback.generation === 3);
  ok('writeback: reply folder still verifies clean', v3b.checks.every(c => c.ok) && v3b.warnings.length === 0);
  const orig = await O.verifyLetter(buildFolder().files);
  ok('writeback: originating letter reads null', orig.facts.writeback === null);

  /* 4. zip round-trip with folder prefixes, as a real intake would see it */
  const rt = buildFolder();
  const folder = 'tessera-' + rt.id;
  const zip = Z.buildZip(rt.files.map(f => ({ name: folder + '/' + f.name, data: f.data })), { y: 2026, m: 7, d: 10 });
  const v4 = await O.verifyLetter(Z.readZip(zip));
  ok('zip round-trip: verifies clean through readZip', v4.checks.every(c => c.ok) && v4.tokenOk === true && v4.warnings.length === 0);

  console.log(fails ? 'open: FAILURES' : 'open: all green');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
