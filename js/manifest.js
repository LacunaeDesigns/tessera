/* manifest.js — pure format helpers: canonicalisation, ID, dates-in-words,
   manifest building, README.txt rendering. Dual browser/Node (no DOM, no
   Date.now, no locale calls). Format rules: SPEC.md + docs/spec/. */
(function (root) {
  'use strict';

  var SPEC_VERSION = '0.1';

  /* ---- canonicalisation (SPEC §5) ---- */

  function canonLetterText(text) {
    return String(text || '').replace(/\r\n/g, '\n').replace(/\s+$/, '');
  }

  function tokenSeedString(f) {
    return 'tessera:' + SPEC_VERSION + '\n' +
      f.openOn + '\n' + f.written + '\n' + f.from + '\n' + f.to + '\n' +
      canonLetterText(f.letter);
  }

  function deriveId(seedHex) {
    var h = String(seedHex).toLowerCase();
    return 'TSR-' + h.slice(0, 4) + '-' + h.slice(4, 8);
  }

  /* ---- dates in words (English, v0.1) ---- */

  var ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
    'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty',
    'seventy', 'eighty', 'ninety'];
  var ORDINALS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth',
    'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth',
    'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth',
    'eighteenth', 'nineteenth', 'twentieth'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  function tensWords(n) { // 0..99 cardinal
    if (n < 20) return ONES[n];
    var t = TENS[Math.floor(n / 10)];
    return n % 10 ? t + '-' + ONES[n % 10] : t;
  }

  function dayOrdinal(d) { // 1..31
    if (d <= 20) return ORDINALS[d];
    if (d === 30) return 'thirtieth';
    var tens = Math.floor(d / 10) * 10;
    return TENS[Math.floor(d / 10)] + '-' + ORDINALS[d % 10];
  }

  function yearWords(y) {
    if (y < 2000 || y > 2999) return String(y); // outside the letterable range, digits are honest
    var rest = y - 2000;
    if (rest === 0) return 'two thousand';
    if (rest < 100) return 'two thousand and ' + tensWords(rest);
    var h = Math.floor(rest / 100), r = rest % 100;
    return 'two thousand ' + ONES[h] + ' hundred' + (r ? ' and ' + tensWords(r) : '');
  }

  function dateInWords(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
    if (!m) return String(iso);
    var y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return String(iso);
    return 'the ' + dayOrdinal(d) + ' of ' + MONTHS[mo - 1] + ', ' + yearWords(y);
  }

  /* ---- manifest (docs/spec/manifest-schema.md) ---- */

  function buildManifest(f) {
    var man = {
      tessera: SPEC_VERSION,
      id: f.id,
      written: f.written,
      openOn: f.openOn,
      from: f.from,
      to: f.to
    };
    /* co-written letters: `from` stays the single human string that feeds the
       token seed (SPEC §5), so IDs and existing fixtures are untouched;
       `writers` is an optional additive list of the individual authors.
       Absent for single-author letters (byte-identical to before). */
    if (f.writers && f.writers.length) man.writers = f.writers;
    if (f.occasion) man.occasion = f.occasion;
    if (f.language) man.language = f.language;
    if (f.custody && f.custody.length) man.custody = f.custody;
    man.checksumAlgo = 'SHA-256';
    man.tokenSeed = f.tokenSeed;
    if (f.encryption) man.encryption = f.encryption;
    man.writeback = f.writeback || null;
    if (f.media && f.media.length) man.media = f.media;
    return man;
  }

  function manifestJson(f) {
    return JSON.stringify(buildManifest(f), null, 2) + '\n';
  }

  /* ---- README.txt (docs/spec/readme-template.md) ---- */

  var RULE_EQ = '================================================================';
  var RULE_DASH = '----------------------------------------------------------------';

  function wrap(text, width) {
    width = width || 64;
    var out = [];
    var paras = String(text).split('\n');
    for (var p = 0; p < paras.length; p++) {
      var words = paras[p].split(/\s+/).filter(function (w) { return w.length; });
      if (!words.length) { out.push(''); continue; }
      var line = '';
      for (var i = 0; i < words.length; i++) {
        if (!line.length) { line = words[i]; }
        else if ((line + ' ' + words[i]).length <= width) { line += ' ' + words[i]; }
        else { out.push(line); line = words[i]; }
      }
      out.push(line);
    }
    return out.join('\n');
  }

  /* label lines wrap their value at 64 cols with a continuation indent, so
     arbitrary user text (a long "to") never breaks the template's measure */
  function labelLine(label, value) {
    var indent = '                '; // 16 spaces, matches the label column
    var words = String(value).split(/\s+/).filter(function (w) { return w.length; });
    var lines = [], line = label;
    for (var i = 0; i < words.length; i++) {
      var joined = (line === label) ? line + words[i] : line + ' ' + words[i];
      if (joined.length <= 64 || line === label || line === indent) line = joined;
      else { lines.push(line); line = indent + words[i]; }
    }
    lines.push(line);
    return lines.join('\n');
  }

  function custodyProse(custody) {
    var parts = [];
    for (var i = 0; i < custody.length; i++) {
      parts.push(custody[i].holder + ' (' + custody[i].instructions + ')');
    }
    return parts.join('; then ');
  }

  function renderReadme(f) {
    var wDate = dateInWords(f.written);
    var oDate = dateInWords(f.openOn);
    var year = String(f.written).slice(0, 4);
    var noDate = !!f.openWhenNeeded;
    var openLine = noDate
      ? 'when it is needed (its title says when)'
      : oDate + ' (' + f.openOn + ')';

    var s = [];
    s.push(RULE_EQ);
    s.push('THIS IS A LETTER MEANT FOR THE FUTURE.');
    s.push(RULE_EQ);
    s.push('');
    s.push(labelLine('Sealed on:      ', wDate + ' (' + f.written + ')'));
    s.push(labelLine('To be opened:   ', openLine));
    s.push(labelLine('From:           ', f.from));
    s.push(labelLine('For:            ', f.to));
    s.push('Letter ID:      ' + f.id);
    if (f.writeback && f.writeback.inReplyTo) {
      /* the manifest never carries what the README does not say in prose */
      s.push(labelLine('In answer to:   ',
        f.writeback.inReplyTo + '  (letter ' + f.writeback.generation + ' in its exchange)'));
    }
    s.push('');
    s.push(RULE_DASH);
    s.push('IF YOU ARE THE PERSON THIS IS FOR');
    s.push(RULE_DASH);
    s.push(wrap(noDate
      ? 'If the moment in this letter\'s title has come, this letter is yours. Find the file called "letter.txt" in this folder, or the printed letter if this came to you on paper. Read it somewhere quiet.'
      : 'If the open date has arrived (or long passed - letters are patient), this letter is yours. Find the file called "letter.txt" in this folder, or the printed letter if this came to you on paper. Read it somewhere quiet.'));
    s.push('');
    s.push(wrap(noDate
      ? 'If the moment has not come: it waits. Not out of curiosity, if you can bear it. It was sealed with that request.'
      : 'If the date has not yet come: it waits. Not before, if you can bear it. It was sealed with that request.'));
    s.push('');
    s.push(wrap('You may have been given half of a small patterned token, or one may be enclosed. The other half belongs to the person who wrote this. If the halves match along their broken edge, the letter is genuine. This works by eye; no machine is needed.'));
    s.push('');
    s.push(RULE_DASH);
    s.push('IF YOU FOUND THIS AND DON\'T KNOW WHAT IT IS');
    s.push(RULE_DASH);
    s.push(wrap('Someone wrote this letter in ' + year + ' to be read by "' + f.to + '" ' + (noDate ? 'when its moment came' : 'on or after ' + oDate) + '. It matters to someone, even if everyone involved is gone.'));
    s.push('');
    s.push('Please do one of these, in order of preference:');
    s.push('  1. Deliver it, unopened, to the person it is for.');
    s.push('  2. Keep it safely until its date, then open it gently -');
    s.push('     you are now its reader of last resort.');
    s.push('  3. Pass it, with this explanation, to someone who can do');
    s.push('     1 or 2.');
    s.push('Please do not destroy it unread.');
    if (f.custody && f.custody.length) {
      s.push('');
      s.push(wrap('The people who agreed to look after this letter: ' + custodyProse(f.custody) + '.'));
    }
    s.push('');
    s.push(RULE_DASH);
    s.push('WHAT THE OTHER FILES ARE');
    s.push(RULE_DASH);
    s.push('letter.txt      - the letter itself. Plain text. This is the');
    s.push('                  thing that matters.');
    s.push('manifest.json   - the same facts as this page, arranged for');
    s.push('                  computer programs.');
    s.push('checksums.txt   - fingerprints (SHA-256) of each file, so a');
    s.push('                  future reader can check nothing was damaged.');
    s.push('                  Any computer of your era can do this check;');
    s.push('                  none needs to.');
    s.push('token.svg       - the two-part token, as an image file.');
    if (f.media && f.media.length) {
      for (var i = 0; i < f.media.length; i++) {
        s.push(wrap('media: ' + f.media[i].file + ' - ' + f.media[i].note));
      }
    }
    s.push('');
    s.push(RULE_DASH);
    s.push('ABOUT THIS FORMAT');
    s.push(RULE_DASH);
    s.push(wrap('This letter is kept in the Tessera format: an open, public-domain way of folding a letter, its dates, and its keeping instructions into ordinary files that need no particular program to read. The format was first published in 2026. Web addresses die, so none is required - but if the words "Tessera letter format" still find anything in your era, you can learn more there.'));
    s.push('');
    s.push('Everything essential is already in your hands.');
    s.push(RULE_EQ);
    s.push('');
    return s.join('\n');
  }

  var api = {
    SPEC_VERSION: SPEC_VERSION,
    canonLetterText: canonLetterText,
    tokenSeedString: tokenSeedString,
    deriveId: deriveId,
    dateInWords: dateInWords,
    buildManifest: buildManifest,
    manifestJson: manifestJson,
    renderReadme: renderReadme,
    wrap: wrap
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraManifest = api;
})(typeof self !== 'undefined' ? self : this);
