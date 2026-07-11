/* print.js — the print kit (docs/features/print-kit.md): cover sheet, letter
   sheet, instructions page, token sheet, register page. Print CSS is the
   engine; each .sheet is page-break-isolated and self-identifying. */
(function (root) {
  'use strict';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function footer(id, openLine) {
    var f = el('div', 'sheet-footer');
    f.appendChild(el('span', '', id));
    f.appendChild(el('span', '', openLine));
    return f;
  }

  /* a terse date stamp for the telegram theme's cover header: 2026-07-11 ->
     "2026 JUL 11". Deterministic, no locale or Date; themes are presentation. */
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function stamp(iso) {
    var p = String(iso).split('-');
    if (p.length < 3) return String(iso).toUpperCase();
    return p[0] + ' ' + (MONTHS[Number(p[1]) - 1] || p[1]) + ' ' + p[2];
  }

  function coverSheet(s) {
    var M = root.TesseraManifest;
    var f = s.fields;
    var sheet = el('section', 'sheet sheet-cover');
    sheet.appendChild(el('div', 'cover-rule'));
    /* theme-support line, shown only under .theme-telegram (hidden otherwise) */
    sheet.appendChild(el('p', 'cover-stamp', 'SEALED ' + stamp(f.written) +
      '  ·  OPENS ' + (f.openWhenNeeded ? 'WHEN NEEDED' : stamp(f.openOn)) +
      '  ·  ' + f.id));
    sheet.appendChild(el('p', 'cover-kicker', 'A letter, sealed ' + M.dateInWords(f.written) + '.'));
    var title = f.openWhenNeeded && s.coverLine ? s.coverLine
      : 'To be opened by ' + f.to + ' on ' + M.dateInWords(f.openOn) + '.';
    sheet.appendChild(el('h2', 'cover-title', title));
    sheet.appendChild(el('p', 'cover-plea', f.openWhenNeeded
      ? 'Not out of curiosity, if you can bear it.'
      : 'Not before, if you can bear it.'));
    var promises = el('div', 'cover-promises');
    promises.appendChild(el('h3', '', 'If you are keeping this for someone'));
    var ul = el('ul', '');
    ['Keep it dry, and keep it with this page.',
      'Don’t open it. It isn’t yours to open.',
      'Never destroy it unread; passing it on is always the alternative.',
      'If you pass it on, pass its story with it.'].forEach(function (t) {
        ul.appendChild(el('li', '', t));
      });
    promises.appendChild(ul);
    sheet.appendChild(promises);
    sheet.appendChild(el('p', 'sheet-note', 'This page goes on the outside. Fold it around the sealed envelope, or paste it to the front.'));
    /* theme-support ornament, shown only under .theme-wax-seal: a dashed
       placement circle around the letter's own token, inviting real wax */
    var mark = el('div', 'cover-seal-mark');
    var ring = el('div', 'cover-seal-ring');
    /* the dashed circle is the placement mark; the token disk is an ornament
       inside it when a full disk is available (the opening path passes only a
       re-drawn half-sheet, no .full, so the ring stays an empty circle) */
    if (s.token && s.token.full) ring.innerHTML = s.token.full; /* seed-generated SVG */
    mark.appendChild(ring);
    mark.appendChild(el('p', 'cover-seal-note', 'seal here, if you have wax'));
    sheet.appendChild(mark);
    sheet.appendChild(footer(f.id, f.openWhenNeeded ? 'opens when needed' : 'opens ' + f.openOn));
    return sheet;
  }

  /* a fold line carries a label so it reads as a fold, not a cut, and an
     arrow for which way the panel turns (▽ down, △ up) */
  function foldLine(cls, arrow) {
    var fl = el('div', 'fold-line ' + cls);
    fl.appendChild(el('span', 'fold-label', 'fold ' + arrow));
    return fl;
  }

  /* a step-by-step fold diagram in hairline SVG (self-generated, no assets):
     dashed = the fold to make this step, solid = folds already done. Pictures
     outlive the language: a reader who can't read the words can still follow. */
  function envelopeGuide() {
    var A = 'fill="none" stroke="#211d16" stroke-linecap="round" stroke-linejoin="round"';
    var sheet = '<rect x="12" y="4" width="40" height="40" rx="1.5" stroke-width="1"/>';
    var foldT = '<line x1="12" y1="17" x2="52" y2="17" stroke-width="0.9"';
    var foldB = '<line x1="12" y1="31" x2="52" y2="31" stroke-width="0.9"';
    var dash = ' stroke-dasharray="2.2 2.2"/>';
    var svg = function (inner) {
      return '<svg viewBox="0 0 64 52" ' + A + '>' + sheet + inner + '</svg>';
    };
    var steps = [
      { n: '1', cap: 'Fold the top third down over the middle.', svg: svg(
        foldT + dash + foldB + ' opacity="0.35"' + dash +
        '<path d="M32 6 L32 13.5" stroke-width="1"/><path d="M28.5 10 L32 13.8 L35.5 10" stroke-width="1"/>') },
      { n: '2', cap: 'Fold the bottom third up; the flap sits on top.', svg: svg(
        foldT + '/>' + foldB + dash +
        '<path d="M32 42 L32 34.5" stroke-width="1"/><path d="M28.5 38 L32 34.2 L35.5 38" stroke-width="1"/>') },
      { n: '3', cap: 'Glue or tape the two open sides shut.', svg: svg(
        foldT + '/>' + foldB + '/>' +
        '<line x1="12" y1="13" x2="12" y2="35" stroke-width="1.7"/>' +
        '<line x1="52" y1="13" x2="52" y2="35" stroke-width="1.7"/>' +
        '<path d="M22 24 L14 24" stroke-width="0.9"/><path d="M16.5 22 L13.5 24 L16.5 26" stroke-width="0.9"/>' +
        '<path d="M42 24 L50 24" stroke-width="0.9"/><path d="M47.5 22 L50.5 24 L47.5 26" stroke-width="0.9"/>') },
      { n: '4', cap: 'Sealed. Trim the dotted line if you like a clean edge.', svg:
        '<svg viewBox="0 0 64 52" ' + A + '>' +
        '<rect x="12" y="9" width="40" height="30" rx="1.5" stroke-width="1"/>' +
        '<path d="M12 9 L32 25 L52 9" stroke-width="0.9"/>' +
        '<circle cx="32" cy="22" r="2.6" stroke-width="0.9"/></svg>' }
    ];
    var guide = el('div', 'envelope-guide');
    steps.forEach(function (st) {
      var cell = el('div', 'envelope-guide-step');
      var art = el('div', 'envelope-guide-art');
      art.innerHTML = st.svg; /* self-generated hairline SVG, no user content */
      cell.appendChild(art);
      cell.appendChild(el('span', 'envelope-guide-cap', st.n + '. ' + st.cap));
      guide.appendChild(cell);
    });
    return guide;
  }

  /* one exploded diagram of how the kit nests: the letter (and the writer's
     token half) go inside the sealed envelope, and the cover wraps the
     outside. Hairline SVG, self-generated. */
  function assemblyGuide() {
    var A = 'fill="none" stroke="#211d16" stroke-linecap="round" stroke-linejoin="round"';
    var svg = '<svg viewBox="0 0 300 56" ' + A + '>' +
      '<rect x="60" y="3" width="150" height="50" rx="4" stroke-width="0.9" stroke-dasharray="3 3"/>' +
      '<text x="64" y="11" font-size="6.5" stroke="none" fill="#211d16" font-family="monospace" opacity="0.65">cover</text>' +
      '<rect x="80" y="12" width="112" height="36" rx="2" stroke-width="1"/>' +
      '<path d="M80 12 L136 31 L192 12" stroke-width="0.9"/>' +
      '<circle cx="136" cy="27" r="3.4" stroke-width="0.9"/>' +
      '<rect x="6" y="17" width="50" height="26" rx="1.5" stroke-width="0.9"/>' +
      '<line x1="12" y1="25" x2="50" y2="25" stroke-width="0.6"/>' +
      '<line x1="12" y1="30" x2="50" y2="30" stroke-width="0.6"/>' +
      '<line x1="12" y1="35" x2="40" y2="35" stroke-width="0.6"/>' +
      '<line x1="22.7" y1="17" x2="22.7" y2="43" stroke-width="0.6" stroke-dasharray="2 2"/>' +
      '<line x1="39.3" y1="17" x2="39.3" y2="43" stroke-width="0.6" stroke-dasharray="2 2"/>' +
      '<path d="M60 30 L78 30" stroke-width="1"/><path d="M74 27 L78.5 30 L74 33" stroke-width="1"/>' +
      '<rect x="214" y="21" width="16" height="16" rx="1" stroke-width="0.9"/>' +
      '<text x="222" y="33" font-size="10" text-anchor="middle" stroke="none" fill="#211d16" font-family="serif">½</text>' +
      '<path d="M212 29 L196 29" stroke-width="1"/><path d="M200 26 L195.5 29 L200 32" stroke-width="1"/>' +
      '</svg>';
    var box = el('div', 'envelope-assembly');
    box.appendChild(el('p', 'sheet-note', 'Once it is folded: the letter, folded in thirds, and your token half go inside, and the cover sheet wraps the outside.'));
    var art = el('div', 'envelope-assembly-art');
    art.innerHTML = svg; /* self-generated hairline SVG, no user content */
    box.appendChild(art);
    return box;
  }

  function envelopeSheet(s) {
    var M = root.TesseraManifest;
    var f = s.fields;
    var sheet = el('section', 'sheet sheet-envelope');
    sheet.appendChild(el('h2', 'sheet-heading', 'The envelope'));
    sheet.appendChild(el('p', 'sheet-note', 'Fold this sheet into an envelope for the letter inside. No cutting required.'));

    var template = el('div', 'envelope-template');
    /* the optional trim guide: a finer dotted rectangle, labelled so it is
       clearly not a fold */
    var trim = el('div', 'envelope-trim');
    trim.appendChild(el('span', 'envelope-trim-label', 'trim, optional'));
    template.appendChild(trim);
    template.appendChild(foldLine('fold-line-upper', '▽')); /* top third folds down */
    template.appendChild(foldLine('fold-line-lower', '△')); /* bottom third folds up */
    /* the two open sides: no separate tabs to cut. Once the thirds are folded
       the layers overlap here, so glue runs down each side edge */
    ['glue-edge-left', 'glue-edge-right'].forEach(function (side) {
      var edge = el('div', 'glue-edge ' + side);
      edge.appendChild(el('span', 'glue-edge-label', 'glue this side'));
      template.appendChild(edge);
    });
    var flap = el('div', 'envelope-flap');
    flap.appendChild(el('p', 'envelope-flap-line', 'A letter, sealed ' + M.dateInWords(f.written) + '.'));
    flap.appendChild(el('p', 'envelope-flap-line', 'For ' + f.to + '.'));
    flap.appendChild(el('p', 'envelope-flap-line', 'Opens ' +
      (f.openWhenNeeded ? 'when the title says so' : M.dateInWords(f.openOn)) + '.'));
    template.appendChild(flap);
    sheet.appendChild(template);
    sheet.appendChild(envelopeGuide());
    sheet.appendChild(assemblyGuide());

    sheet.appendChild(footer(f.id, f.openWhenNeeded ? 'opens when needed' : 'opens ' + f.openOn));
    return sheet;
  }

  function letterSheet(s) {
    var f = s.fields;
    var sheet = el('section', 'sheet sheet-letter');
    var body = el('div', 'letter-body');
    var paras = s.letterText.split(/\n\n+/);
    for (var i = 0; i < paras.length; i++) {
      if (paras[i].trim().length) body.appendChild(el('p', '', paras[i].trim()));
    }
    sheet.appendChild(body);
    sheet.appendChild(footer(f.id, f.openWhenNeeded ? 'opens when needed' : 'opens ' + f.openOn));
    return sheet;
  }

  function instructionsSheet(s) {
    var f = s.fields;
    var sheet = el('section', 'sheet sheet-instructions');
    var pre = el('pre', 'readme-pre', s.readme);
    sheet.appendChild(pre);
    sheet.appendChild(footer(f.id, 'instructions'));
    return sheet;
  }

  function tokenSheet(s) {
    var f = s.fields;
    var sheet = el('section', 'sheet sheet-token');
    sheet.appendChild(el('h2', 'sheet-heading', 'The token'));
    sheet.appendChild(el('p', 'sheet-note',
      'Print this page on the stiffest paper you have. Cut along the dashed line. ' +
      'One half stays with the writer; the other travels sealed with the letter. ' +
      'Decades from now, the broken edge is the signature: the halves must meet.'));
    var holder = el('div', 'token-holder');
    holder.innerHTML = s.token.sheet; /* generated by token.js from the seed — no user HTML */
    sheet.appendChild(holder);
    sheet.appendChild(footer(f.id, 'token'));
    return sheet;
  }

  function kitSheets(sealed, opts) {
    var occ = root.TesseraOccasions.bySlug(sealed.fields.occasion || 'custom');
    sealed.coverLine = occ.coverLine ? 'To be opened ' + occ.title.replace(/^Open /, '') + '.' : '';
    if (occ.group === 'open-when') sealed.coverLine = occ.title + '.';
    var withEnvelope = opts && typeof opts.envelope === 'boolean' ? opts.envelope : !sealed.fields.openWhenNeeded;
    var sheets = [coverSheet(sealed)];
    if (withEnvelope) sheets.push(envelopeSheet(sealed));
    if (sealed.letterText) sheets.push(letterSheet(sealed));
    sheets.push(instructionsSheet(sealed));
    if (sealed.token) sheets.push(tokenSheet(sealed));
    return sheets;
  }

  function registerSheet(entries) {
    var M = root.TesseraManifest;
    var sheet = el('section', 'sheet sheet-register');
    sheet.appendChild(el('h2', 'sheet-heading', 'Letters in this house, waiting.'));
    var table = el('table', 'register-table');
    var head = el('tr', '');
    ['Letter', 'For', 'Sealed', 'Opens', 'Kept by'].forEach(function (h) { head.appendChild(el('th', '', h)); });
    table.appendChild(head);
    entries.forEach(function (e) {
      var tr = el('tr', '');
      tr.appendChild(el('td', 'mono', e.id));
      tr.appendChild(el('td', '', e.to));
      tr.appendChild(el('td', '', e.written));
      tr.appendChild(el('td', '', e.openWhenNeeded ? 'when needed' : M.dateInWords(e.openOn)));
      tr.appendChild(el('td', '', e.custodyHolder || 'the writer'));
      table.appendChild(tr);
    });
    sheet.appendChild(table);
    sheet.appendChild(el('p', 'sheet-note', 'Keep this page with the family papers, and reprint it when it changes.'));
    return sheet;
  }

  /* the open-dates card: one A4 sheet holding the same card twice, split by a
     dashed cut line — one for a wallet, one for a drawer (features/reminders.md) */
  function oneCard(entries) {
    var M = root.TesseraManifest;
    var card = el('section', 'wallet-card');
    card.appendChild(el('h3', 'card-heading', 'Letters, waiting.'));
    var list = el('div', 'card-rows');
    entries.forEach(function (e) {
      var row = el('p', 'card-row');
      row.appendChild(el('span', 'mono card-id', e.id));
      row.appendChild(el('span', 'card-when',
        e.openWhenNeeded ? 'when needed' : M.dateInWords(e.openOn)));
      row.appendChild(el('span', 'card-for', 'for ' + (e.to || 'someone')));
      list.appendChild(row);
    });
    card.appendChild(list);
    card.appendChild(el('p', 'card-mark', 'Tessera · a letter keeps its own date. Keep this where you look.'));
    return card;
  }

  function cardSheet(entries) {
    var sheet = el('section', 'sheet sheet-card');
    sheet.appendChild(oneCard(entries));
    sheet.appendChild(el('div', 'card-cut'));
    sheet.appendChild(oneCard(entries));
    return sheet;
  }

  /* the key-escrow card (features/encryption.md): printed at seal time from
     live passphrase/hint values passed in by the caller, never stored in
     the letter folder or manifest. */
  function escrowSheet(o) {
    var sheet = el('section', 'sheet sheet-escrow');
    sheet.appendChild(el('h2', 'sheet-heading', 'A Tessera key card.'));
    if (o.passphrase) {
      sheet.appendChild(el('p', 'escrow-label', 'Passphrase'));
      sheet.appendChild(el('p', 'escrow-value mono', o.passphrase));
    }
    if (o.hint) {
      sheet.appendChild(el('p', 'escrow-label', 'Hint'));
      sheet.appendChild(el('p', 'escrow-value', o.hint));
    }
    sheet.appendChild(el('p', 'sheet-note', 'Give this card to someone who is not the custodian.'));
    sheet.appendChild(el('p', 'sheet-note', 'This unlocks the letter file. A lost passphrase is a lost letter.'));
    sheet.appendChild(footer(o.id, 'key card'));
    return sheet;
  }

  /* show sheets in the print preview overlay; printing prints only #print-root */
  function show(sheets) {
    var overlay = document.getElementById('print-overlay');
    var rootEl = document.getElementById('print-root');
    rootEl.innerHTML = '';
    for (var i = 0; i < sheets.length; i++) rootEl.appendChild(sheets[i]);
    overlay.hidden = false;
    document.body.classList.add('printing-preview');
  }

  function hide() {
    var overlay = document.getElementById('print-overlay');
    overlay.hidden = true;
    document.body.classList.remove('printing-preview');
  }

  function printKit(sealed, opts) { show(kitSheets(sealed, opts)); }
  function printRegister(entries) { show([registerSheet(entries)]); }
  function printCard(entries) { show([cardSheet(entries)]); }
  function printEscrowCard(o) { show([escrowSheet(o)]); }

  var api = { printKit: printKit, printRegister: printRegister, printCard: printCard, printEscrowCard: printEscrowCard, hide: hide, kitSheets: kitSheets };
  root.TesseraPrint = api;
})(typeof self !== 'undefined' ? self : this);
