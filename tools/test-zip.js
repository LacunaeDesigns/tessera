/* test-zip.js — Gate 1 unit tests for js/zip.js: CRC vectors, structure,
   determinism, and a bsdtar listing when available (engineering/testing.md) */
'use strict';
const Z = require('../js/zip.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

let fails = 0;
function ok(name, cond, extra) {
  if (!cond) { fails++; console.error('FAIL ' + name + (extra ? ' — ' + extra : '')); }
  else console.log('ok   ' + name);
}

/* CRC-32 known vectors */
ok('crc32("")', Z.crc32(new Uint8Array(0)) === 0x00000000);
ok('crc32("123456789")', Z.crc32(Z.utf8('123456789')) === 0xCBF43926, 'got 0x' + Z.crc32(Z.utf8('123456789')).toString(16));
ok('crc32("The quick brown fox jumps over the lazy dog")',
  Z.crc32(Z.utf8('The quick brown fox jumps over the lazy dog')) === 0x414FA339);

/* structure */
const stamp = { y: 2026, m: 7, d: 10 };
const entries = [
  { name: 'tessera-TSR-9c11-85a5/README.txt', data: 'THIS IS A LETTER MEANT FOR THE FUTURE.\n' },
  { name: 'tessera-TSR-9c11-85a5/letter.txt', data: 'Dear one,\nBe brave.\n' },
  { name: 'tessera-TSR-9c11-85a5/manifest.json', data: '{\n  "tessera": "0.1"\n}\n' }
];
const zip = Z.buildZip(entries, stamp);

ok('zip starts with local header sig', zip[0] === 0x50 && zip[1] === 0x4B && zip[2] === 0x03 && zip[3] === 0x04);
const tail = zip.slice(zip.length - 22);
ok('zip ends with EOCD sig', tail[0] === 0x50 && tail[1] === 0x4B && tail[2] === 0x05 && tail[3] === 0x06);
ok('EOCD entry count', tail[10] === 3 && tail[11] === 0);
/* store method ⇒ raw bytes visible */
const raw = Buffer.from(zip).toString('utf8');
ok('store method keeps bytes readable', raw.indexOf('Be brave.') !== -1);
/* determinism */
const zip2 = Z.buildZip(entries, stamp);
ok('deterministic bytes', Buffer.compare(Buffer.from(zip), Buffer.from(zip2)) === 0);

/* external listing via bsdtar (ships with Windows 10+ / macOS); skip gracefully */
const tmp = path.join(os.tmpdir(), 'tessera-test-' + process.pid + '.zip');
fs.writeFileSync(tmp, Buffer.from(zip));
const tarBin = process.platform === 'win32' ? 'C:\\Windows\\System32\\tar.exe' : 'tar'; // bsdtar reads zip; Git Bash's GNU tar does not
const tar = spawnSync(tarBin, ['-tf', tmp], { encoding: 'utf8' });
if (tar.error || tar.status !== 0) {
  console.log('skip bsdtar listing (tar unavailable: ' + (tar.error ? tar.error.code : 'exit ' + tar.status) + ')');
} else {
  ok('bsdtar lists all entries', entries.every(e => tar.stdout.indexOf(e.name) !== -1), tar.stdout);
}
fs.unlinkSync(tmp);

process.exit(fails ? 1 : 0);
