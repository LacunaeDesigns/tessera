/* compose.js — the writing room (docs/features/writing-room.md): a quiet
   sequence of questions ending in a sealed letter. One task per screen. */
(function (root) {
  'use strict';

  var STEPS = ['occasion', 'date', 'from', 'letter', 'custody', 'seal'];
  var current = null; // { step, draft }

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

  function plusYears(iso, n) {
    var p = iso.split('-');
    return (parseInt(p[0], 10) + n) + '-' + p[1] + '-' + p[2];
  }

  function newDraft() {
    return {
      occasion: null, to: '', from: '', openOn: '', openWhenNeeded: false,
      letter: '', custodyHolder: '', custodyNote: '', keepCopy: false
    };
  }

  function saveDraft() {
    if (current) TesseraState.setDraft('current', { step: current.step, draft: current.draft });
  }

  var saveTimer = null;
  function autosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 500);
  }

  function start() {
    var stored = TesseraState.getDraft('current');
    current = stored ? { step: stored.step, draft: stored.draft } : { step: 0, draft: newDraft() };
    render();
  }

  function go(step) {
    current.step = Math.max(0, Math.min(STEPS.length - 1, step));
    saveDraft();
    render();
    window.scrollTo(0, 0);
  }

  function nav(container, canNext, nextLabel) {
    var nav = el('div', 'compose-nav');
    if (current.step > 0) {
      var back = el('button', 'btn-quiet', 'Back');
      back.type = 'button';
      back.addEventListener('click', function () { go(current.step - 1); });
      nav.appendChild(back);
    }
    var next = el('button', 'btn-primary', nextLabel || 'Continue');
    next.type = 'button';
    next.disabled = !canNext();
    next.addEventListener('click', function () { if (canNext()) go(current.step + 1); });
    nav.appendChild(next);
    container.appendChild(nav);
    return next;
  }

  /* ---- steps ---- */

  function stepOccasion(c) {
    var d = current.draft;
    c.appendChild(el('h2', 'compose-q', 'Who is this letter for?'));
    var input = el('input', 'field');
    input.type = 'text';
    input.placeholder = 'My daughter, on her eighteenth birthday';
    input.value = d.to;
    c.appendChild(input);
    c.appendChild(el('p', 'hint', 'Address them the way the envelope should. A role can outlive a name.'));

    c.appendChild(el('h3', 'compose-sub', 'Is there an occasion?'));
    var groups = [
      ['For a hard day', 'open-when'],
      ['For a milestone', 'milestone'],
      ['For the far future', 'far'],
      ['', 'custom']
    ];
    var chipWrap = el('div', 'chips');
    groups.forEach(function (g) {
      TesseraOccasions.OCCASIONS.filter(function (o) { return o.group === g[1]; }).forEach(function (o) {
        var chip = el('button', 'chip' + (d.occasion === o.slug ? ' chip-on' : ''), o.title);
        chip.type = 'button';
        chip.addEventListener('click', function () {
          d.occasion = (d.occasion === o.slug) ? null : o.slug;
          autosave();
          rerenderStep();
        });
        chipWrap.appendChild(chip);
      });
    });
    c.appendChild(chipWrap);

    var next = nav(c, function () { return input.value.trim().length > 0; });
    input.addEventListener('input', function () {
      d.to = input.value;
      next.disabled = !(input.value.trim().length > 0);
      autosave();
    });
  }

  function stepDate(c) {
    var d = current.draft;
    var occ = TesseraOccasions.bySlug(d.occasion || 'custom');
    c.appendChild(el('h2', 'compose-q', 'When should it open?'));

    var input = el('input', 'field');
    input.type = 'date';
    input.value = d.openOn && !d.openWhenNeeded ? d.openOn : '';
    var words = el('p', 'date-words', '');

    function refreshWords() {
      if (d.openWhenNeeded) { words.textContent = 'It opens when it’s needed. The title on the envelope decides.'; return; }
      words.textContent = d.openOn ? TesseraManifest.dateInWords(d.openOn) : '';
    }

    var quick = el('div', 'chips');
    [['in one year', 1], ['in five years', 5], ['in ten years', 10], ['in twenty-five years', 25]].forEach(function (q) {
      var chip = el('button', 'chip', q[0]);
      chip.type = 'button';
      chip.addEventListener('click', function () {
        d.openWhenNeeded = false;
        d.openOn = plusYears(todayIso(), q[1]);
        input.value = d.openOn;
        refreshWords(); autosave(); syncNext();
      });
      quick.appendChild(chip);
    });
    var solsticeChip = el('button', 'chip', 'on the winter solstice');
    solsticeChip.type = 'button';
    solsticeChip.addEventListener('click', function () {
      d.openWhenNeeded = false;
      var y = parseInt(todayIso().slice(0, 4), 10);
      var thisSolstice = y + '-12-21';
      d.openOn = (todayIso() < thisSolstice) ? thisSolstice : (y + 1) + '-12-21';
      input.value = d.openOn;
      refreshWords(); autosave(); syncNext();
    });
    quick.appendChild(solsticeChip);
    c.appendChild(quick);
    c.appendChild(input);

    if (occ.canBeUndated) {
      var undatedWrap = el('label', 'check-row');
      var cb = el('input', '');
      cb.type = 'checkbox';
      cb.checked = d.openWhenNeeded;
      cb.addEventListener('change', function () {
        d.openWhenNeeded = cb.checked;
        if (cb.checked) { d.openOn = todayIso(); input.value = ''; }
        refreshWords(); autosave(); syncNext();
      });
      undatedWrap.appendChild(cb);
      undatedWrap.appendChild(el('span', '', 'No date. It opens when it’s needed.'));
      c.appendChild(undatedWrap);
    }

    c.appendChild(words);
    refreshWords();

    function canNext() { return d.openWhenNeeded || /^\d{4}-\d{2}-\d{2}$/.test(d.openOn || ''); }
    var next = nav(c, canNext);
    function syncNext() { next.disabled = !canNext(); }
    input.addEventListener('input', function () {
      d.openWhenNeeded = false;
      d.openOn = input.value;
      refreshWords(); autosave(); syncNext();
    });
  }

  function stepFrom(c) {
    var d = current.draft;
    c.appendChild(el('h2', 'compose-q', 'Who is it from?'));
    var input = el('input', 'field');
    input.type = 'text';
    input.placeholder = 'Your mother';
    input.value = d.from;
    c.appendChild(input);
    c.appendChild(el('p', 'hint', '“Your mother” or “someone who was 31 in 2026” can outlive a name. Sign it the way you want to be met.'));
    var next = nav(c, function () { return input.value.trim().length > 0; });
    input.addEventListener('input', function () {
      d.from = input.value;
      next.disabled = !(input.value.trim().length > 0);
      autosave();
    });
  }

  function stepLetter(c) {
    var d = current.draft;
    var occ = TesseraOccasions.bySlug(d.occasion || 'custom');
    c.appendChild(el('h2', 'compose-q', 'The letter.'));

    if (occ.prompts.length) {
      var aside = el('aside', 'prompts');
      occ.prompts.forEach(function (p) { aside.appendChild(el('p', 'prompt', p)); });
      var dismiss = el('button', 'btn-quiet btn-small', 'Hide these');
      dismiss.type = 'button';
      dismiss.addEventListener('click', function () { aside.remove(); });
      aside.appendChild(dismiss);
      c.appendChild(aside);
    }

    var ta = el('textarea', 'letter-input');
    ta.rows = 14;
    ta.placeholder = 'Dear…';
    ta.value = d.letter;
    ta.addEventListener('input', function () { d.letter = ta.value; autosaveWithCount(); });
    c.appendChild(ta);

    var count = el('p', 'hint hint-count', '');
    c.appendChild(count);
    function refreshCount() {
      var words = d.letter.trim().length ? d.letter.trim().split(/\s+/).length : 0;
      count.textContent = words ? words + ' words, taking their time.' : '';
    }
    function autosaveWithCount() { autosave(); refreshCount(); nextBtn.disabled = !(d.letter.trim().length > 0); }
    refreshCount();

    var nextBtn = nav(c, function () { return d.letter.trim().length > 0; });
  }

  function stepCustody(c) {
    var d = current.draft;
    c.appendChild(el('h2', 'compose-q', 'Who will keep it?'));
    c.appendChild(el('p', 'hint', 'A custodian keeps the sealed letter safe and passes it on with its story. Prefer places to people, and roles to names. You can also simply keep it yourself.'));
    var holder = el('input', 'field');
    holder.type = 'text';
    holder.placeholder = 'Gustav · the family papers · whoever keeps the photo albums';
    holder.value = d.custodyHolder;
    c.appendChild(holder);
    var note = el('input', 'field');
    note.type = 'text';
    note.placeholder = 'Keep with the family papers.';
    note.value = d.custodyNote;
    c.appendChild(note);
    holder.addEventListener('input', function () { d.custodyHolder = holder.value; autosave(); });
    note.addEventListener('input', function () { d.custodyNote = note.value; autosave(); });
    nav(c, function () { return true; }, d.custodyHolder ? 'Continue' : 'I’ll keep it myself');
  }

  function stepSeal(c) {
    var d = current.draft;
    c.appendChild(el('h2', 'compose-q', 'Read it back, then seal it.'));

    var facts = el('dl', 'seal-facts');
    function fact(k, v) {
      facts.appendChild(el('dt', '', k));
      facts.appendChild(el('dd', '', v));
    }
    fact('For', d.to);
    fact('From', d.from);
    fact('Opens', d.openWhenNeeded ? 'when it’s needed' : TesseraManifest.dateInWords(d.openOn));
    if (d.custodyHolder) fact('Kept by', d.custodyHolder);
    c.appendChild(facts);

    var preview = el('div', 'letter-preview');
    d.letter.split(/\n\n+/).forEach(function (p) {
      if (p.trim().length) preview.appendChild(el('p', '', p.trim()));
    });
    c.appendChild(preview);

    var keepRow = el('label', 'check-row');
    var cb = el('input', '');
    cb.type = 'checkbox';
    cb.checked = d.keepCopy;
    cb.addEventListener('change', function () { d.keepCopy = cb.checked; autosave(); });
    keepRow.appendChild(cb);
    keepRow.appendChild(el('span', '', 'Keep a copy of the letter’s text in this browser. (The folder is the letter; a browser is not an archive.)'));
    c.appendChild(keepRow);

    var navRow = el('div', 'compose-nav');
    var back = el('button', 'btn-quiet', 'Back');
    back.type = 'button';
    back.addEventListener('click', function () { go(current.step - 1); });
    navRow.appendChild(back);
    var sealBtn = el('button', 'btn-primary', 'Seal the letter');
    sealBtn.type = 'button';
    sealBtn.addEventListener('click', function () { doSeal(sealBtn); });
    navRow.appendChild(sealBtn);
    c.appendChild(navRow);
  }

  function doSeal(btn) {
    btn.disabled = true;
    btn.textContent = 'Sealing…';
    var d = current.draft;
    var fields = {
      to: d.to.trim(),
      from: d.from.trim(),
      written: todayIso(),
      openOn: d.openWhenNeeded ? todayIso() : d.openOn,
      occasion: d.occasion || 'custom',
      language: 'en',
      custody: d.custodyHolder ? [{ holder: d.custodyHolder.trim(), instructions: (d.custodyNote || 'Keep it safe; pass it on with its story.').trim() }] : [],
      letter: d.letter,
      openWhenNeeded: d.openWhenNeeded
    };
    TesseraExport.seal(fields).then(function (sealed) {
      TesseraState.addRegistryEntry({
        id: sealed.fields.id,
        to: sealed.fields.to,
        from: sealed.fields.from,
        written: sealed.fields.written,
        openOn: sealed.fields.openOn,
        openWhenNeeded: sealed.fields.openWhenNeeded,
        occasion: sealed.fields.occasion,
        custodyHolder: d.custodyHolder || '',
        custodyNote: d.custodyNote || '',
        keptText: d.keepCopy ? d.letter : null,
        status: 'sealed'
      });
      /* the letter is sealed: cancel any pending autosave and drop the live
         draft, or a debounced save can resurrect it after the clear */
      clearTimeout(saveTimer);
      current = null;
      TesseraState.clearDraft('current');
      showSealed(sealed);
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = 'Seal the letter';
      alert('Sealing failed: ' + err.message);
    });
  }

  function showSealed(sealed) {
    var c = $('#compose-root');
    c.innerHTML = '';
    var wrap = el('div', 'sealed-wrap');
    wrap.appendChild(el('h2', 'compose-q', 'Sealed.'));
    var tokenHolder = el('div', 'sealed-token');
    tokenHolder.innerHTML = sealed.token.full; /* machine-generated SVG from hex seed — no user content */
    wrap.appendChild(tokenHolder);
    wrap.appendChild(el('p', 'sealed-id', sealed.fields.id));
    wrap.appendChild(el('p', 'hint',
      'The folder just downloaded: that is the letter. Keep it where you keep things that matter. Now print the kit, cut the token, and let paper do the rest.'));

    var row = el('div', 'compose-nav');
    var dl = el('button', 'btn-quiet', 'Download the folder again');
    dl.type = 'button';
    dl.addEventListener('click', function () { TesseraExport.download(sealed); });
    row.appendChild(dl);
    var pr = el('button', 'btn-primary', 'Print the kit');
    pr.type = 'button';
    pr.addEventListener('click', function () { TesseraPrint.printKit(sealed); });
    row.appendChild(pr);
    wrap.appendChild(row);

    var again = el('div', 'compose-nav');
    var occ = TesseraOccasions.bySlug(sealed.fields.occasion);
    if (occ.group === 'open-when') {
      var more = el('button', 'btn-quiet', 'Write another for the same person');
      more.type = 'button';
      more.addEventListener('click', function () {
        current = { step: 0, draft: newDraft() };
        current.draft.to = sealed.fields.to;
        current.draft.from = sealed.fields.from;
        saveDraft(); render();
      });
      again.appendChild(more);
    }
    var done = el('button', 'btn-quiet', 'To your letters');
    done.type = 'button';
    done.addEventListener('click', function () { location.hash = '#letters'; });
    again.appendChild(done);
    wrap.appendChild(again);

    c.appendChild(wrap);
    TesseraExport.download(sealed);
  }

  /* ---- render ---- */

  var RENDERERS = [stepOccasion, stepDate, stepFrom, stepLetter, stepCustody, stepSeal];

  function rerenderStep() { render(); }

  function render() {
    var c = $('#compose-root');
    if (!c || !current) return;
    c.innerHTML = '';
    var progress = el('p', 'compose-progress', (current.step + 1) + ' of ' + STEPS.length);
    c.appendChild(progress);
    RENDERERS[current.step](c);
  }

  root.TesseraCompose = { start: start };
})(typeof self !== 'undefined' ? self : this);
