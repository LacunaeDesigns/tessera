/* test-crypt.js — Gate 1 tests for js/crypt.js: the AES-256-GCM passphrase
   wrapper (docs/features/encryption.md). Round-trip fixtures, wrong-passphrase
   failure mode (clear message, no crash), salt uniqueness, determinism under
   injected salt/iv, and the forbidden-source scan (randomness only via
   crypto.getRandomValues — crypt.js is the one module exempt from the
   no-randomness rule, security requires it). */
'use strict';
if (typeof globalThis.crypto === 'undefined') globalThis.crypto = require('crypto').webcrypto;
const C = require('../js/crypt.js');
const fs = require('fs');
const path = require('path');

let fails = 0;
function ok(name, cond, extra) {
  if (!cond) { fails++; console.error('FAIL ' + name + (extra ? ' — ' + extra : '')); }
  else console.log('ok   ' + name);
}

/* fixed salt/iv/iterations so encryption is byte-exact in the fixture path */
const FIX = {
  salt: Uint8Array.from({ length: 16 }, (_, i) => i + 1),
  iv: Uint8Array.from({ length: 12 }, (_, i) => i + 101),
  iterations: 600000
};
const PLAIN = 'dear future, hold fast\n';
const PASS = 'correct horse battery staple';

(async () => {
  const enc = await C.encryptLetter(PLAIN, PASS, FIX);

  ok('wrapper is plain-text with header', enc.wrapper.startsWith('# Tessera encrypted letter'));
  ok('wrapper header names the algorithm', /AES-256-GCM/.test(enc.wrapper) && /PBKDF2/.test(enc.wrapper));
  ok('wrapper carries salt/iv/iterations for self-description',
    /salt=\S+ iv=\S+ iterations=\d+/.test(enc.wrapper));
  ok('manifest field shape', enc.manifestField.algo === 'AES-256-GCM'
    && enc.manifestField.kdf === 'PBKDF2-SHA256'
    && enc.manifestField.iterations === 600000
    && typeof enc.manifestField.salt === 'string'
    && typeof enc.manifestField.iv === 'string');

  const dec = await C.decryptLetter(enc.wrapper, PASS);
  ok('round trip returns the exact plaintext', dec === PLAIN, JSON.stringify(dec));

  let msg = null;
  try { await C.decryptLetter(enc.wrapper, 'wrong'); } catch (e) { msg = e.message; }
  ok('wrong passphrase: clear message, no crash', !!msg && /passphrase/.test(msg), msg);

  let hdrMsg = null;
  try { await C.decryptLetter('not an encrypted file at all', PASS); } catch (e) { hdrMsg = e.message; }
  ok('missing header rejected with a clear message', !!hdrMsg && /header/.test(hdrMsg), hdrMsg);

  /* injected salt/iv must make the wrapper byte-identical across runs */
  const encA = await C.encryptLetter(PLAIN, PASS, FIX);
  ok('deterministic under injected salt/iv', encA.wrapper === enc.wrapper);

  /* real seals draw fresh randomness: salt (and iv) unique per seal */
  const enc2 = await C.encryptLetter('x', 'p');
  const enc3 = await C.encryptLetter('x', 'p');
  ok('salt unique per seal (fresh randomness)', enc2.manifestField.salt !== enc3.manifestField.salt);
  ok('iv unique per seal (fresh randomness)', enc2.manifestField.iv !== enc3.manifestField.iv);

  /* empty passphrase is still a decisionable key — round-trips, but the seal
     path is what forbids empty; crypt.js just must not crash on it */
  const encEmpty = await C.encryptLetter(PLAIN, '', FIX);
  ok('empty passphrase does not crash', await C.decryptLetter(encEmpty.wrapper, '') === PLAIN);

  /* forbidden-source scan: no Math.random, no Date; randomness only via getRandomValues */
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'crypt.js'), 'utf8');
  ok('no Math.random in crypt.js', !/Math\.random/.test(src));
  ok('no Date in crypt.js', !/\bDate\b/.test(src));
  ok('randomness via crypto.getRandomValues only', /crypto\.getRandomValues/.test(src));

  if (fails) { console.error('\ncrypt: ' + fails + ' FAILED'); process.exit(1); }
  console.log('crypt: all green');
})().catch(function (e) { console.error('crypt: threw', e); process.exit(1); });
