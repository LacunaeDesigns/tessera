/* opening.js — the opening door, as a focused overlay over the landing.
   Drop a letter's folder, verify it's intact, open it with a paced ceremony,
   then answer it forward or keep it for someone. All format work is done by
   the pure engine (TesseraZip.readZip + TesseraOpen.verifyLetter); this file
   is presentation only. Rule of the house: verification warns, never blocks.
   Spec: docs/features/opening.md. */
(function (root) {
  'use strict';

  function $(id) { return document.getElementById(id); }
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
  function reducedMotion() {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var M = root.TesseraManifest;
  var Z = root.TesseraZip;
  var O = root.TesseraOpen;

  var overlay = null;   // the #open-overlay element
  var body = null;      // the .open-card panel we render screens into
  var view = null;      // { result }
  var open = false;     // is the overlay showing?
  var timers = [];      // ceremony timeouts, cleared on close
  var asked = {};       // date interstitial: once per letter per session

  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }

  function ensureShell() {
    overlay = $('open-overlay');
    if (!overlay) return false;
    overlay.innerHTML = '';
    var card = el('div', 'open-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', 'Open a letter');
    var x = el('button', 'open-x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', closeOverlay);
    card.appendChild(x);
    body = el('div', 'open-body');
    card.appendChild(body);
    overlay.appendChild(card);
    /* backdrop click closes; clicks inside the card do not */
    overlay.onclick = function (e) { if (e.target === overlay) closeOverlay(); };
    return true;
  }

  function openOverlay() {
    if (!ensureShell()) return;
    view = null;
    open = true;
    overlay.hidden = false;
    document.body.classList.add('open-mode');
    document.addEventListener('keydown', onKey);
    renderIntake();
  }

  function closeOverlay() {
    clearTimers();
    open = false;
    if (overlay) overlay.hidden = true;
    document.body.classList.remove('open-mode');
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) { if (e.key === 'Escape') closeOverlay(); }

  function renderIntake(problem) {
    body.innerHTML = '';
    body.appendChild(el('h2', 'open-q', 'Open a letter.'));
    body.appendChild(el('p', 'open-hint', 'Choose the letter’s zip file, or drop it here. Nothing you open leaves this device.'));
    if (problem) body.appendChild(el('p', 'open-warn', problem));

    var drop = el('div', 'open-drop');
    drop.appendChild(el('p', null, 'Drop the letter here'));
    var input = el('input');
    input.type = 'file';
    input.accept = '.zip,application/zip';
    input.setAttribute('aria-label', 'Choose the letter’s zip file');
    drop.appendChild(input);
    body.appendChild(drop);

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
    body.innerHTML = '';
    body.appendChild(el('h2', 'open-q', 'Reading…'));
    file.arrayBuffer().then(function (buf) {
      var entries;
      try { entries = Z.readZip(new Uint8Array(buf)); }
      catch (e) { renderIntake('That file could not be read as a letter. (' + e.message + ')'); return; }
      return O.verifyLetter(entries).then(function (result) {
        if (!open) return;
        view = { result: result };
        renderVerify();
      });
    }).catch(function (e) { renderIntake('That file could not be read. (' + e.message + ')'); });
  }

  function factRow(dl, k, v) {
    dl.appendChild(el('dt', null, k));
    dl.appendChild(el('dd', null, v));
  }

  function renderVerify() {
    var r = view.result;
    body.innerHTML = '';
    body.appendChild(el('h2', 'open-q', 'A letter, as it arrived.'));

    var facts = el('dl', 'seal-facts');
    factRow(facts, 'From', r.facts.from || 'not readable');
    factRow(facts, 'For', r.facts.to || 'not readable');
    factRow(facts, 'Sealed', r.facts.written ? M.dateInWords(r.facts.written) : 'not readable');
    factRow(facts, 'Opens', r.facts.openWhenNeeded ? 'when it is needed'
      : (r.facts.openOn ? M.dateInWords(r.facts.openOn) : 'not readable'));
    if (r.facts.id) factRow(facts, 'Letter ID', r.facts.id);
    body.appendChild(facts);

    if (r.checks.length) {
      var list = el('ul', 'verify-checks');
      r.checks.forEach(function (ch) {
        var li = el('li', ch.ok ? 'verify-ok' : 'verify-bad');
        li.appendChild(el('span', null, ch.ok ? '✓' : '!'));
        li.appendChild(el('span', null, ch.file + (ch.ok ? ' · matches its fingerprint' : ' · does not match')));
        list.appendChild(li);
      });
      body.appendChild(list);
    }
    r.warnings.forEach(function (w) { body.appendChild(el('p', 'open-warn', w)); });

    if (r.token) {
      var cmp = el('div', 'token-compare');
      var fig1 = el('figure');
      var img = el('img');
      img.alt = 'The token as enclosed in the folder';
      img.src = URL.createObjectURL(new Blob([r.token.enclosed], { type: 'image/svg+xml' }));
      fig1.appendChild(img);
      fig1.appendChild(el('figcaption', null, 'As enclosed'));
      cmp.appendChild(fig1);
      var fig2 = el('figure');
      var holder = el('div');
      holder.innerHTML = r.token.redrawnSheet; /* our own deterministic SVG from the hex seed */
      fig2.appendChild(holder);
      fig2.appendChild(el('figcaption', null, 'Re-drawn from this letter'));
      cmp.appendChild(fig2);
      body.appendChild(cmp);
      if (r.tokenOk === true) body.appendChild(el('p', 'open-hint', 'They match.'));

      var largeWrap = el('div', 'token-large');
      largeWrap.hidden = true;
      largeWrap.innerHTML = r.token.redrawnFull;
      var largeBtn = el('button', 'btn-quiet btn-small', 'Show the break line large');
      largeBtn.type = 'button';
      largeBtn.addEventListener('click', function () {
        largeWrap.hidden = !largeWrap.hidden;
        largeBtn.textContent = largeWrap.hidden ? 'Show the break line large' : 'Hide the large view';
      });
      body.appendChild(el('p', 'open-hint', 'If you hold a printed half, the broken edge is the signature. Compare it by eye.'));
      body.appendChild(largeBtn);
      body.appendChild(largeWrap);
    }

    var nav = el('div', 'open-nav');
    var back = el('button', 'btn-quiet', 'Not now');
    back.type = 'button';
    back.addEventListener('click', closeOverlay);
    nav.appendChild(back);
    var openBtn = el('button', 'btn-cta', 'Open it');
    openBtn.type = 'button';
    openBtn.disabled = r.letterText === null;
    openBtn.addEventListener('click', dateGate);
    nav.appendChild(openBtn);
    body.appendChild(nav);

    if (r.facts.id) {
      var keepRow = el('div', 'open-nav');
      var keep = el('button', 'btn-quiet btn-small', 'I am keeping this for someone');
      keep.type = 'button';
      keep.addEventListener('click', keepForSomeone);
      keepRow.appendChild(keep);
      body.appendChild(keepRow);
    }
  }

  function dateGate() {
    var r = view.result;
    var id = r.facts.id || 'unknown';
    var waiting = r.facts.openOn && !r.facts.openWhenNeeded && r.facts.openOn > todayIso();
    if (waiting && !asked[id]) { asked[id] = true; renderWait(); }
    else ceremony();
  }

  function renderWait() {
    var r = view.result;
    body.innerHTML = '';
    body.appendChild(el('h2', 'open-q', 'It asked to wait until ' + M.dateInWords(r.facts.openOn) + '. Open anyway?'));
    var nav = el('div', 'open-nav');
    var no = el('button', 'btn-quiet', 'Not yet');
    no.type = 'button';
    no.addEventListener('click', closeOverlay);
    nav.appendChild(no);
    var yes = el('button', 'btn-cta', 'Open it');
    yes.type = 'button';
    yes.addEventListener('click', ceremony);
    nav.appendChild(yes);
    body.appendChild(nav);
  }

  function ceremony() {
    body.innerHTML = '';
    body.appendChild(el('h2', 'open-q', 'It is yours to read.'));
    body.appendChild(el('p', 'open-hint', 'Paper is the reference copy. You can print the letter and read it in your hands, or read it here.'));
    var nav = el('div', 'open-nav');
    var paper = el('button', 'btn-quiet', 'Read it on paper instead');
    paper.type = 'button';
    paper.addEventListener('click', readOnPaper);
    nav.appendChild(paper);
    var here = el('button', 'btn-cta', 'Read it');
    here.type = 'button';
    here.addEventListener('click', beginReveal);
    nav.appendChild(here);
    body.appendChild(nav);
  }

  function readOnPaper() {
    var r = view.result;
    root.TesseraPrint.printKit({
      fields: {
        id: r.facts.id || '', to: r.facts.to || '', from: r.facts.from || '',
        written: r.facts.written || '', openOn: r.facts.openOn || '',
        openWhenNeeded: !!r.facts.openWhenNeeded, occasion: r.facts.occasion || 'custom'
      },
      letterText: r.letterText || '',
      readme: r.readmeText || '',
      /* always the re-drawn token: foreign SVG never reaches innerHTML */
      token: r.token ? { sheet: r.token.redrawnSheet } : null
    });
  }

  function beginReveal() {
    var r = view.result;
    if (reducedMotion()) { renderLetter(); return; }
    body.innerHTML = '';
    var intro = el('div', 'ceremony-intro ceremony-veil ceremony-in');
    var facts = el('dl', 'seal-facts');
    factRow(facts, 'From', r.facts.from || 'unknown');
    factRow(facts, 'Sealed', r.facts.written ? M.dateInWords(r.facts.written) : 'long ago');
    intro.appendChild(facts);
    body.appendChild(intro);
    timers.push(setTimeout(function () {
      if (!open) return;
      intro.classList.add('ceremony-fading');
      timers.push(setTimeout(function () { if (open) renderLetter(); }, 1000));
    }, 2000));
  }

  function renderLetter() {
    var r = view.result;
    body.innerHTML = '';
    var wrap = el('div', 'opened-letter' + (reducedMotion() ? '' : ' ceremony-in'));
    var letter = el('div', 'letter-body');
    letter.textContent = r.letterText;
    wrap.appendChild(letter);
    var nav = el('div', 'open-nav');
    var done = el('button', 'btn-quiet', 'Done');
    done.type = 'button';
    done.addEventListener('click', closeOverlay);
    nav.appendChild(done);
    if (r.facts.id && root.TesseraLanding && root.TesseraLanding.answerForward) {
      var answer = el('button', 'btn-cta', 'Answer it forward.');
      answer.type = 'button';
      answer.addEventListener('click', function () {
        root.TesseraLanding.answerForward({
          inReplyTo: r.facts.id,
          generation: (r.facts.writeback && r.facts.writeback.generation ? r.facts.writeback.generation : 0) + 1
        });
        closeOverlay();
      });
      nav.appendChild(answer);
    }
    wrap.appendChild(nav);
    body.appendChild(wrap);
  }

  function keepForSomeone() {
    var r = view.result;
    var already = root.TesseraState.getRegistry().some(function (e) { return e.id === r.facts.id; });
    if (!already) {
      root.TesseraState.addRegistryEntry({
        id: r.facts.id, to: r.facts.to || '', from: r.facts.from || '',
        written: r.facts.written || '', openOn: r.facts.openOn || '',
        openWhenNeeded: !!r.facts.openWhenNeeded, occasion: r.facts.occasion || 'custom',
        custodyHolder: '', custodyNote: '', keptText: null,
        status: 'kept', sealKey: '', role: 'custodian'
      });
      if (root.TesseraLanding && root.TesseraLanding.refreshShelf) root.TesseraLanding.refreshShelf();
    }
    body.innerHTML = '';
    body.appendChild(el('h2', 'open-q', already ? 'It is already in your keeping.' : 'It is in your keeping.'));
    body.appendChild(el('p', 'open-hint', 'This device now remembers the letter and its date, unopened. You will find it under Your letters.'));
    var nav = el('div', 'open-nav');
    var done = el('button', 'btn-cta', 'Done');
    done.type = 'button';
    done.addEventListener('click', function () {
      closeOverlay();
      var letters = document.getElementById('letters');
      if (letters && letters.scrollIntoView) letters.scrollIntoView({ behavior: 'smooth' });
    });
    nav.appendChild(done);
    body.appendChild(nav);
  }

  function wire() {
    var nav = $('nav-open');
    if (nav) nav.addEventListener('click', function (e) { if (e.preventDefault) e.preventDefault(); openOverlay(); });
    var hero = $('hero-open');
    if (hero) hero.addEventListener('click', function (e) { if (e.preventDefault) e.preventDefault(); openOverlay(); });
    /* a shared link like /#open opens the door on arrival */
    if (location.hash === '#open') openOverlay();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  root.TesseraOpening = { open: openOverlay };
})(typeof self !== 'undefined' ? self : this);
