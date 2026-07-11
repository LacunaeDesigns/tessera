/* open.js — the opening door's verification core (v0.2): read a letter
   folder, check its fingerprints, re-derive its token, fall back to README
   prose when the manifest is damaged. Pure and DOM-free (Node-testable,
   tools/test-open.js); the opening UI lives in landing/opening.js and calls
   verifyLetter. Spec: docs/features/opening.md. Rule of the house:
   verification failures warn gently and never block reading; a damaged
   letter is still a letter. */
(function (root) {
  'use strict';

  var M = root.TesseraManifest || (typeof require === 'function' ? require('./manifest.js') : null);
  var T = root.TesseraToken || (typeof require === 'function' ? require('./token.js') : null);
  var TL = root.TesseraTokenLegacy || (typeof require === 'function' ? require('./token-legacy.js') : null);
  var Z = root.TesseraZip || (typeof require === 'function' ? require('./zip.js') : null);

  function toHex(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }

  /* hash the bytes as they sit in the folder; byte-exact or not at all */
  function sha256HexBytes(bytes) {
    return crypto.subtle.digest('SHA-256', bytes).then(toHex);
  }

  function asBytes(data) {
    return typeof data === 'string' ? Z.utf8(data) : data;
  }

  function asText(data) {
    return typeof data === 'string' ? data : Z.utf8dec(data);
  }

  /* strip any folder prefix and skip directory entries: intake sees
     "tessera-TSR-xxxx-yyyy/letter.txt", the format speaks in bare names */
  function normalize(files) {
    var out = [];
    for (var i = 0; i < files.length; i++) {
      var name = String(files[i].name);
      if (name.slice(-1) === '/') continue;
      out.push({ name: name.split('/').pop(), data: files[i].data });
    }
    return out;
  }

  /* checksums.txt: "<64 hex>  <name>" per line */
  function parseChecksums(text) {
    var out = [];
    var lines = String(text).split('\n');
    for (var i = 0; i < lines.length; i++) {
      var m = /^([0-9a-f]{64})\s+(\S.*)$/.exec(lines[i].trim());
      if (m) out.push({ file: m[2], expected: m[1] });
    }
    return out;
  }

  /* facts from README.txt prose, for when manifest.json is damaged
     (priority rule, SPEC §1: prose outranks structure) */
  function readmeFacts(text) {
    var lines = String(text).split('\n');
    var folded = [];
    for (var i = 0; i < lines.length; i++) {
      if (/^ {16}\S/.test(lines[i]) && folded.length) folded[folded.length - 1] += ' ' + lines[i].trim();
      else folded.push(lines[i]);
    }
    function value(label) {
      for (var j = 0; j < folded.length; j++) {
        if (folded[j].indexOf(label) === 0) return folded[j].slice(label.length).trim();
      }
      return '';
    }
    function iso(s) {
      var m = /\((\d{4}-\d{2}-\d{2})\)/.exec(s);
      return m ? m[1] : null;
    }
    var sealed = value('Sealed on:');
    var opens = value('To be opened:');
    return {
      id: value('Letter ID:') || null,
      written: iso(sealed),
      openOn: iso(opens),
      from: value('From:') || null,
      to: value('For:') || null,
      openWhenNeeded: /when it is needed/.test(opens),
      source: 'readme'
    };
  }

  /* verifyLetter(files: [{name, data}]) -> Promise of
     { facts, checks, tokenOk, letterText, warnings }
     Never throws for damage; damage becomes warnings. */
  function verifyLetter(files) {
    var warnings = [];
    var entries = normalize(files);
    function get(name) {
      for (var i = 0; i < entries.length; i++) if (entries[i].name === name) return entries[i];
      return null;
    }

    /* an encrypted letter carries letter.txt.enc in place of letter.txt; the
       door cannot read the plaintext (that needs the passphrase, handled by
       the UI), so it exposes the wrapper and defers the token check */
    var encEntry = get('letter.txt.enc');
    var encrypted = !!encEntry;
    var encryptedWrapper = encEntry ? asText(encEntry.data) : null;
    var letterEntry = get('letter.txt');
    var letterText = letterEntry ? asText(letterEntry.data) : null;
    if (!letterEntry && !encEntry) warnings.push('letter.txt is missing from the folder.');

    var facts = null;
    var manifestEntry = get('manifest.json');
    if (manifestEntry) {
      try {
        var man = JSON.parse(asText(manifestEntry.data));
        facts = {
          id: man.id || null,
          written: man.written || null,
          openOn: man.openOn || null,
          from: man.from || null,
          to: man.to || null,
          occasion: man.occasion || null,
          language: man.language || null,
          custody: man.custody || [],
          tokenSeed: man.tokenSeed || null,
          encryption: man.encryption || null,
          writeback: man.writeback || null,
          source: 'manifest'
        };
      } catch (e) { facts = null; }
    }
    var readmeEntry = get('README.txt');
    if (!facts && readmeEntry) {
      facts = readmeFacts(asText(readmeEntry.data));
      warnings.push('manifest.json is missing or damaged; the facts shown were read from README.txt instead.');
    }
    if (!facts) {
      facts = { id: null, written: null, openOn: null, from: null, to: null, source: 'none' };
      warnings.push('Neither manifest.json nor README.txt could be read; the letter stands alone.');
    }

    /* checksum pass */
    var checksEntry = get('checksums.txt');
    var declared = checksEntry ? parseChecksums(asText(checksEntry.data)) : [];
    if (!checksEntry) warnings.push('checksums.txt is missing; nothing could be fingerprint-checked.');

    var checkJobs = declared.map(function (d) {
      var entry = get(d.file);
      if (!entry) {
        warnings.push(d.file + ' is listed in checksums.txt but missing from the folder.');
        return Promise.resolve({ file: d.file, expected: d.expected, actual: null, ok: false });
      }
      return sha256HexBytes(asBytes(entry.data)).then(function (actual) {
        var ok = actual === d.expected;
        if (!ok) warnings.push(d.file + ' does not match its recorded fingerprint; it may have changed since sealing. It is still readable.');
        return { file: d.file, expected: d.expected, actual: actual, ok: ok };
      });
    });

    /* token re-derivation */
    var tokenEntry = get('token.svg');
    var canDerive = tokenEntry && letterText !== null &&
      facts.written && facts.openOn && facts.from !== null && facts.to !== null;
    var tokenJob;
    if (!tokenEntry) {
      tokenJob = Promise.resolve(null); /* a letter without a token is still valid (SPEC §1) */
    } else if (!canDerive) {
      /* an encrypted letter defers its token check to after unlocking, not a fault */
      if (!encrypted) warnings.push('the token could not be re-drawn for comparison; some of the facts it depends on are unreadable.');
      tokenJob = Promise.resolve(null);
    } else {
      var seedString = M.tokenSeedString({
        openOn: facts.openOn, written: facts.written,
        from: facts.from, to: facts.to, letter: letterText
      });
      tokenJob = sha256HexBytes(Z.utf8(seedString)).then(function (seedHex) {
        if (facts.tokenSeed && facts.tokenSeed !== seedHex) {
          warnings.push('the token seed in manifest.json does not match one re-derived from the letter and its facts.');
        }
        var derivedId = M.deriveId(seedHex);
        if (facts.id && facts.id !== derivedId) {
          warnings.push('the letter ID does not match one re-derived from the letter and its facts.');
        }
        /* the id is drawn into the SVG that the screen injects, and this
           manifest is foreign: only a well-formed id may pass; anything
           else falls back to the hex-derived one (XSS guard) */
        var safeId = (facts.id && /^TSR-[0-9a-f]{4}-[0-9a-f]{4}$/.test(facts.id)) ? facts.id : derivedId;
        var enclosed = asText(tokenEntry.data);
        /* try the current art generation first, then the frozen legacy one:
           letters sealed before generation 2 must never become "wrong" */
        var t = T.renderTokenSvg(seedHex, safeId);
        var same = (t.sheet + '\n') === enclosed;
        if (!same && TL) {
          var tl = TL.renderTokenSvg(seedHex, safeId);
          if ((tl.sheet + '\n') === enclosed) { t = tl; same = true; }
        }
        if (!same) warnings.push('the enclosed token does not match one re-drawn from this letter; if you hold a printed half, trust the paper and compare the broken edge by eye.');
        return { ok: same, redrawnFull: t.full, redrawnSheet: t.sheet, enclosed: enclosed };
      });
    }

    return Promise.all([Promise.all(checkJobs), tokenJob]).then(function (results) {
      return {
        facts: facts,
        checks: results[0],
        tokenOk: results[1] ? results[1].ok : results[1],
        token: results[1] ? { redrawnFull: results[1].redrawnFull, redrawnSheet: results[1].redrawnSheet, enclosed: results[1].enclosed } : null,
        letterText: letterText,
        readmeText: readmeEntry ? asText(readmeEntry.data) : null,
        encrypted: encrypted,
        encryptedWrapper: encryptedWrapper,
        warnings: warnings
      };
    });
  }

  var api = {
    verifyLetter: verifyLetter,
    readmeFacts: readmeFacts,
    parseChecksums: parseChecksums
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraOpen = api;
})(typeof self !== 'undefined' ? self : this);
