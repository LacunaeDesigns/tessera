/* ics.js — PURE RFC 5545 builder (architecture.md: dual-env, no DOM, no
   Date.now, no locale). buildIcs(letters) -> string.
   letters: [{ id, to, written, openOn, coverText, alarm? }].
   The DTSTAMP is the letter's `written` date, passed by the caller — the
   event was authored when the letter was, so the stamp is deterministic
   and honest (determinism note, plans/v0.2-reminders.md). */
(function (root) {
  'use strict';

  /* RFC 5545 §3.3.11: escape backslash first, then ; , and newline. */
  function esc(s) {
    return String(s)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  function dateBasic(iso) { return String(iso).replace(/-/g, ''); }

  /* octets a single code point occupies as UTF-8 */
  function octets(cp) {
    var c = cp.codePointAt(0);
    if (c < 0x80) return 1;
    if (c < 0x800) return 2;
    if (c < 0x10000) return 3;
    return 4;
  }

  /* RFC 5545 §3.1: fold at 75 octets; continuation lines begin with one
     space. Iterate by code point (Array.from) so a multi-octet character
     is never split across the fold. */
  function fold(line) {
    var out = [], cur = '', bytes = 0;
    var chars = Array.from(line);
    for (var i = 0; i < chars.length; i++) {
      var w = octets(chars[i]);
      if (bytes + w > (out.length ? 74 : 75)) { out.push(cur); cur = ' '; bytes = 1; }
      cur += chars[i];
      bytes += w;
    }
    out.push(cur);
    return out.join('\r\n');
  }

  function vevent(l) {
    var lines = [
      'BEGIN:VEVENT',
      'UID:' + l.id + '@tessera',
      'DTSTAMP:' + dateBasic(l.written) + 'T000000Z',
      'DTSTART;VALUE=DATE:' + dateBasic(l.openOn),
      'SUMMARY:' + esc('A letter is ready: ' + l.to + ' (' + l.id + ')'),
      'DESCRIPTION:' + esc(l.coverText || '')
    ];
    if (l.alarm) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY',
        'DESCRIPTION:' + esc('A letter opens today.'),
        'TRIGGER:PT9H', 'END:VALARM');
    }
    lines.push('END:VEVENT');
    return lines;
  }

  function buildIcs(letters) {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tessera//letters//EN', 'CALSCALE:GREGORIAN'];
    (letters || []).forEach(function (l) { lines = lines.concat(vevent(l)); });
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  var api = { buildIcs: buildIcs };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraIcs = api;
})(typeof self !== 'undefined' ? self : this);
