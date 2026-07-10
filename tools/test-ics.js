/* test-ics.js — Gate 1 unit tests for js/ics.js (engineering/testing.md).
   ICS is a pure, deterministic, fixture-tested RFC 5545 builder. */
'use strict';
const I = require('../js/ics.js');
const fs = require('fs');
const path = require('path');

let fails = 0;
function ok(name, cond, extra) {
  if (!cond) { fails++; console.error('FAIL ' + name + (extra ? ' — ' + extra : '')); }
  else console.log('ok   ' + name);
}

const letter = { id: 'TSR-2026-KQ3F7', to: 'My daughter', written: '2026-07-10', openOn: '2044-06-21',
                 coverText: 'A letter, sealed the tenth of July, two thousand and twenty-six.' };
const ics = I.buildIcs([letter]);

ok('CRLF line endings', ics.indexOf('\r\n') !== -1 && ics.indexOf('\n') === ics.indexOf('\r\n') + 1);
ok('calendar envelope', /BEGIN:VCALENDAR\r\n/.test(ics));
ok('calendar closes', /END:VCALENDAR\r\n$/.test(ics));
ok('UID is the letter ID', /UID:TSR-2026-KQ3F7@tessera\r\n/.test(ics));
ok('all-day date, no UTC', /DTSTART;VALUE=DATE:20440621\r\n/.test(ics));
ok('stamp from written date, not Date.now', /DTSTAMP:20260710T000000Z\r\n/.test(ics));
ok('summary names the recipient and id', /SUMMARY:A letter is ready: My daughter \(TSR-2026-KQ3F7\)\r\n/.test(ics));
ok('folded at 75 octets', ics.split('\r\n').every(l => Buffer.byteLength(l, 'utf8') <= 75 || l === ''),
  'long lines: ' + JSON.stringify(ics.split('\r\n').filter(l => Buffer.byteLength(l, 'utf8') > 75)));
ok('deterministic (byte-identical across runs)', I.buildIcs([letter]) === ics);

/* escaping: RFC 5545 §3.3.11 — commas, semicolons, backslashes, newlines */
const tricky = I.buildIcs([{ id: 'TSR-0001-aaaa', to: 'A; B, and C\\D', written: '2026-01-01', openOn: '2030-01-01',
  coverText: 'Line one.\nLine two; with, punctuation.' }]);
ok('escapes semicolons/commas/backslash in text', /SUMMARY:A letter is ready: A\\; B\\, and C\\\\D \(TSR-0001-aaaa\)\r\n/.test(tricky));
ok('escapes newline as \\n in description', /DESCRIPTION:Line one\.\\nLine two\\; with\\, punctuation\.\r\n/.test(tricky));

/* multiple letters -> multiple VEVENTs in one calendar */
const many = I.buildIcs([letter, { id: 'TSR-0002-bbbb', to: 'A friend', written: '2026-02-02', openOn: '2031-02-02', coverText: 'Hello.' }]);
ok('one VCALENDAR envelope for many letters', (many.match(/BEGIN:VCALENDAR/g) || []).length === 1);
ok('one VEVENT per letter', (many.match(/BEGIN:VEVENT/g) || []).length === 2 && (many.match(/END:VEVENT/g) || []).length === 2);

/* optional alarm */
const alarmed = I.buildIcs([Object.assign({ alarm: true }, letter)]);
ok('alarm adds a VALARM block when asked', /BEGIN:VALARM\r\n/.test(alarmed) && /END:VALARM\r\n/.test(alarmed));
ok('no alarm by default', !/VALARM/.test(ics));

/* fixture (birthed after first verified run) */
const fixPath = path.join(__dirname, 'fixtures', 'reminder-fix1.ics');
if (fs.existsSync(fixPath)) {
  ok('fixture match (byte-identical)', ics === fs.readFileSync(fixPath, 'latin1'),
    'a diff here is a format event — see /spec-sync and decisions.md, never regenerate silently');
} else {
  console.log('note  fixture reminder-fix1.ics not yet born — run Step 4');
}

if (fails) { console.log('ics: FAILURES'); process.exit(1); }
console.log('ics: all green');
