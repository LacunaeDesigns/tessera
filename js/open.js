/* open.js — the opening door (v0.2): intake, verification, ceremony,
   write-back. This file's verification core is DOM-free and Node-testable
   (tools/test-open.js); the screen wiring joins it in the browser only.
   Spec: docs/features/opening.md. Rule of the house: verification failures
   warn gently and never block reading; a damaged letter is still a letter. */
(function (root) {
  'use strict';

  var M = root.TesseraManifest || (typeof require === 'function' ? require('./manifest.js') : null);
  var T = root.TesseraToken || (typeof require === 'function' ? require('./token.js') : null);
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

    var letterEntry = get('letter.txt');
    var letterText = letterEntry ? asText(letterEntry.data) : null;
    if (!letterEntry) warnings.push('letter.txt is missing from the folder.');

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
      warnings.push('the token could not be re-drawn for comparison; some of the facts it depends on are unreadable.');
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
        var t = T.renderTokenSvg(seedHex, safeId);
        var enclosed = asText(tokenEntry.data);
        var same = (t.sheet + '\n') === enclosed;
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
        warnings: warnings
      };
    });
  }

  /* ---- screen wiring (browser only; nothing below runs under Node) ---- */

  var view = null;         // { result }
  var askedThisSession = {}; // date interstitial: asked once per letter

  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function todayIso() {
    var d = new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function start() {
    view = null;
    renderIntake();
  }

  function renderIntake(problem) {
    var c = $('#open-root');
    if (!c) return;
    c.innerHTML = '';
    c.appendChild(el('h2', 'compose-q', 'Open a letter.'));
    c.appendChild(el('p', 'hint', 'Choose the letter’s zip file, or drop it here. Nothing you open leaves this device.'));
    if (problem) c.appendChild(el('p', 'verify-warn', problem));

    var drop = el('div', 'open-drop');
    drop.appendChild(el('p', '', 'Drop the letter here'));
    var input = el('input', '');
    input.type = 'file';
    input.accept = '.zip,application/zip';
    input.setAttribute('aria-label', 'Choose the letter’s zip file');
    drop.appendChild(input);
    c.appendChild(drop);

    input.addEventListener('change', function () {
      if (input.files && input.files[0]) intake(input.files[0]);
    });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('open-drop-armed'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('open-drop-armed'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.classList.remove('open-drop-armed');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) intake(e.dataTransfer.files[0]);
    });
  }

  function intake(file) {
    var c = $('#open-root');
    c.innerHTML = '';
    c.appendChild(el('h2', 'compose-q', 'Reading…'));
    file.arrayBuffer().then(function (buf) {
      var entries;
      try { entries = Z.readZip(new Uint8Array(buf)); }
      catch (e) {
        renderIntake('That file could not be read as a letter. (' + e.message + ')');
        return;
      }
      return verifyLetter(entries).then(function (result) {
        view = { result: result };
        renderVerify();
      });
    }).catch(function (e) {
      renderIntake('That file could not be read. (' + e.message + ')');
    });
  }

  function factRow(dl, k, v) {
    dl.appendChild(el('dt', '', k));
    dl.appendChild(el('dd', '', v));
  }

  function renderVerify() {
    var c = $('#open-root');
    var r = view.result;
    c.innerHTML = '';
    c.appendChild(el('h2', 'compose-q', 'A letter, as it arrived.'));

    var facts = el('dl', 'seal-facts');
    factRow(facts, 'From', r.facts.from || 'not readable');
    factRow(facts, 'For', r.facts.to || 'not readable');
    factRow(facts, 'Sealed', r.facts.written ? M.dateInWords(r.facts.written) : 'not readable');
    factRow(facts, 'Opens', r.facts.openWhenNeeded ? 'when it is needed'
      : (r.facts.openOn ? M.dateInWords(r.facts.openOn) : 'not readable'));
    if (r.facts.id) factRow(facts, 'Letter ID', r.facts.id);
    c.appendChild(facts);

    if (r.checks.length) {
      var list = el('ul', 'verify-checks');
      r.checks.forEach(function (ch) {
        var li = el('li', ch.ok ? 'verify-ok' : 'verify-bad');
        li.appendChild(el('span', '', ch.ok ? '✓' : '!'));
        li.appendChild(el('span', '', ch.file + (ch.ok ? ' · matches its fingerprint' : ' · does not match')));
        list.appendChild(li);
      });
      c.appendChild(list);
    }
    r.warnings.forEach(function (w) {
      c.appendChild(el('p', 'verify-warn', w));
    });

    if (r.token) {
      var cmp = el('div', 'token-compare');
      var fig1 = el('figure', '');
      var img = el('img', '');
      img.alt = 'The token as enclosed in the folder';
      img.src = URL.createObjectURL(new Blob([r.token.enclosed], { type: 'image/svg+xml' }));
      fig1.appendChild(img);
      fig1.appendChild(el('figcaption', '', 'As enclosed'));
      cmp.appendChild(fig1);
      var fig2 = el('figure', '');
      var holder = el('div', '');
      holder.innerHTML = r.token.redrawnSheet; /* our own deterministic SVG from the hex seed */
      fig2.appendChild(holder);
      fig2.appendChild(el('figcaption', '', 'Re-drawn from this letter'));
      cmp.appendChild(fig2);
      c.appendChild(cmp);
      if (r.tokenOk === true) c.appendChild(el('p', 'hint', 'They match.'));

      var largeWrap = el('div', 'token-large');
      largeWrap.hidden = true;
      largeWrap.innerHTML = r.token.redrawnFull; /* same deterministic SVG, larger */
      var largeBtn = el('button', 'btn-quiet btn-small', 'Show the break line large');
      largeBtn.type = 'button';
      largeBtn.addEventListener('click', function () {
        largeWrap.hidden = !largeWrap.hidden;
        largeBtn.textContent = largeWrap.hidden ? 'Show the break line large' : 'Hide the large view';
      });
      c.appendChild(el('p', 'hint', 'If you hold a printed half, the broken edge is the signature. Compare it by eye.'));
      c.appendChild(largeBtn);
      c.appendChild(largeWrap);
    }

    var navRow = el('div', 'compose-nav');
    var back = el('button', 'btn-quiet', 'Not now');
    back.type = 'button';
    back.addEventListener('click', function () { location.hash = '#home'; });
    navRow.appendChild(back);
    var openBtn = el('button', 'btn-primary', 'Open it');
    openBtn.type = 'button';
    openBtn.disabled = r.letterText === null;
    openBtn.addEventListener('click', dateGate);
    navRow.appendChild(openBtn);
    c.appendChild(navRow);

    if (r.facts.id) {
      var keepRow = el('div', 'compose-nav');
      var keep = el('button', 'btn-quiet btn-small', 'I am keeping this for someone');
      keep.type = 'button';
      keep.addEventListener('click', keepForSomeone);
      keepRow.appendChild(keep);
      c.appendChild(keepRow);
    }
  }

  /* custody intake: record the letter on this device without opening it */
  function keepForSomeone() {
    var r = view.result;
    var already = root.TesseraState.getRegistry().some(function (e) { return e.id === r.facts.id; });
    if (!already) {
      root.TesseraState.addRegistryEntry({
        id: r.facts.id,
        to: r.facts.to || '',
        from: r.facts.from || '',
        written: r.facts.written || '',
        openOn: r.facts.openOn || '',
        openWhenNeeded: !!r.facts.openWhenNeeded,
        occasion: r.facts.occasion || 'custom',
        custodyHolder: '',
        custodyNote: '',
        keptText: null,
        status: 'kept',
        sealKey: '',
        role: 'custodian'
      });
    }
    var c = $('#open-root');
    c.innerHTML = '';
    c.appendChild(el('h2', 'compose-q', already ? 'It is already in your keeping.' : 'It is in your keeping.'));
    c.appendChild(el('p', 'hint', 'This device now remembers the letter and its date, unopened. You will find it under Your letters.'));
    var navRow = el('div', 'compose-nav');
    var done = el('button', 'btn-primary', 'Done');
    done.type = 'button';
    done.addEventListener('click', function () { location.hash = '#letters'; });
    navRow.appendChild(done);
    c.appendChild(navRow);
  }

  function dateGate() {
    var r = view.result;
    var id = r.facts.id || 'unknown';
    var waiting = r.facts.openOn && !r.facts.openWhenNeeded && r.facts.openOn > todayIso();
    if (waiting && !askedThisSession[id]) {
      askedThisSession[id] = true;
      renderWait();
    } else {
      reveal();
    }
  }

  function renderWait() {
    var c = $('#open-root');
    var r = view.result;
    c.innerHTML = '';
    c.appendChild(el('h2', 'compose-q', 'It asked to wait until ' + M.dateInWords(r.facts.openOn) + '. Open anyway?'));
    var navRow = el('div', 'compose-nav');
    var no = el('button', 'btn-quiet', 'Not yet');
    no.type = 'button';
    no.addEventListener('click', function () { location.hash = '#home'; });
    navRow.appendChild(no);
    var yes = el('button', 'btn-primary', 'Open it');
    yes.type = 'button';
    yes.addEventListener('click', reveal);
    navRow.appendChild(yes);
    c.appendChild(navRow);
  }

  /* ---- the ceremony: facts, a breath, then the letter ---- */

  function reducedMotion() {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function reveal() {
    var c = $('#open-root');
    var r = view.result;
    c.innerHTML = '';
    c.appendChild(el('h2', 'compose-q', 'It is yours to read.'));
    c.appendChild(el('p', 'hint', 'Paper is the reference copy. You can print the letter and read it in your hands, or read it here.'));
    var navRow = el('div', 'compose-nav');
    var paper = el('button', 'btn-quiet', 'Read it on paper instead');
    paper.type = 'button';
    paper.addEventListener('click', readOnPaper);
    navRow.appendChild(paper);
    var here = el('button', 'btn-primary', 'Read it');
    here.type = 'button';
    here.addEventListener('click', ceremony);
    navRow.appendChild(here);
    c.appendChild(navRow);
  }

  function readOnPaper() {
    var r = view.result;
    root.TesseraPrint.printKit({
      fields: {
        id: r.facts.id || '',
        to: r.facts.to || '',
        from: r.facts.from || '',
        written: r.facts.written || '',
        openOn: r.facts.openOn || '',
        openWhenNeeded: !!r.facts.openWhenNeeded,
        occasion: r.facts.occasion || 'custom'
      },
      letterText: r.letterText || '',
      readme: r.readmeText || '',
      /* always the re-drawn token: foreign SVG never reaches innerHTML */
      token: view.result.token ? { sheet: view.result.token.redrawnSheet } : null
    });
  }

  function ceremony() {
    var c = $('#open-root');
    var r = view.result;
    document.body.classList.add('ceremony-quiet');
    c.innerHTML = '';

    if (reducedMotion()) { renderLetter(); return; }

    var intro = el('div', 'ceremony-intro ceremony-veil ceremony-in');
    var facts = el('dl', 'seal-facts');
    factRow(facts, 'From', r.facts.from || 'unknown');
    factRow(facts, 'Sealed', r.facts.written ? M.dateInWords(r.facts.written) : 'long ago');
    intro.appendChild(facts);
    c.appendChild(intro);

    setTimeout(function () {
      if (location.hash !== '#open') return;
      intro.classList.add('ceremony-fading');
      setTimeout(function () {
        if (location.hash !== '#open') return;
        renderLetter();
      }, 1000);
    }, 2000);
  }

  function renderLetter() {
    var c = $('#open-root');
    var r = view.result;
    c.innerHTML = '';
    var wrap = el('div', 'opened-letter' + (reducedMotion() ? '' : ' ceremony-in'));
    var body = el('div', 'letter-body');
    body.textContent = r.letterText;
    wrap.appendChild(body);
    var navRow = el('div', 'compose-nav');
    var done = el('button', 'btn-quiet', 'Done');
    done.type = 'button';
    done.addEventListener('click', function () {
      document.body.classList.remove('ceremony-quiet');
      location.hash = '#home';
    });
    navRow.appendChild(done);
    if (r.facts.id && root.TesseraCompose) {
      var answer = el('button', 'btn-primary', 'Answer it forward.');
      answer.type = 'button';
      answer.addEventListener('click', function () {
        root.TesseraCompose.answerForward({
          inReplyTo: r.facts.id,
          generation: (r.facts.writeback && r.facts.writeback.generation ? r.facts.writeback.generation : 0) + 1
        });
        document.body.classList.remove('ceremony-quiet');
        location.hash = '#write';
      });
      navRow.appendChild(answer);
    }
    wrap.appendChild(navRow);
    c.appendChild(wrap);
  }

  /* leaving the screen by any road restores the chrome */
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.addEventListener('hashchange', function () {
      document.body.classList.remove('ceremony-quiet');
    });
  }

  var api = {
    verifyLetter: verifyLetter,
    readmeFacts: readmeFacts,
    parseChecksums: parseChecksums,
    start: start
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraOpen = api;
})(typeof self !== 'undefined' ? self : this);
