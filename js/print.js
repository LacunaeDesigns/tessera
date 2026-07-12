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

  /* a compact date for the ledger surfaces (register table, wallet card):
     2036-07-12 -> "12 Jul 2036". One line, and locale-unambiguous (the month
     is named) so it still reads plainly a century on. The cover, envelope
     flap and opening ceremony keep the full spelled-out words. */
  var MON_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function shortDate(iso) {
    var p = String(iso || '').split('-');
    if (p.length < 3) return '';
    return Number(p[2]) + ' ' + (MON_ABBR[Number(p[1]) - 1] || p[1]) + ' ' + p[0];
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

  function svgInner(svgStr) { return String(svgStr).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''); }

  /* co-written token sheet (features/occasions.md; decided Option B, 2026-07-12):
     two IDENTICAL keeper halves — one for each writer — and one traveller half.
     The token pattern-matches by eye (SPEC §5), so identical keeper prints both
     meet the traveller along the same seeded edge. Print-kit only: no token-art
     or fixture change, the seed and disk are untouched. */
  function xmlEsc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function cowrittenTokenHolder(s, writers) {
    var keep = svgInner(s.token.left), travel = svgInner(s.token.right);
    var A = xmlEsc(writers[0]), B = xmlEsc(writers[1]); /* writer names are user text */
    function label(x, t) {
      return '<text x="' + x + '" y="440" text-anchor="middle" font-family="monospace" font-size="15" fill="#211d16">' + t + '</text>';
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1320 500" width="1320" height="500">' +
      '<g transform="translate(10,20) scale(0.95)">' + keep + '</g>' +
      '<g transform="translate(450,20) scale(0.95)">' + keep + '</g>' +
      '<g transform="translate(890,20) scale(0.95)">' + travel + '</g>' +
      '<line x1="440" y1="10" x2="440" y2="420" stroke="#211d16" stroke-width="1" stroke-dasharray="6,6"/>' +
      '<line x1="880" y1="10" x2="880" y2="420" stroke="#211d16" stroke-width="1" stroke-dasharray="6,6"/>' +
      label(210, A + ' keeps this half') +
      label(650, B + ' keeps this half') +
      label(1090, 'travels with the letter') +
      '<text x="660" y="475" text-anchor="middle" font-family="serif" font-size="14" fill="#211d16">' +
      'Cut the three apart. The two keeper halves are identical; each meets the travelling half along its patterned edge.</text>' +
      '</svg>';
    var holder = el('div', 'token-holder token-holder--trio');
    holder.innerHTML = svg; /* halves generated by token.js from the seed — no user HTML */
    return holder;
  }

  function tokenSheet(s) {
    var f = s.fields;
    var co = f.writers && f.writers.length >= 2 && s.token.left && s.token.right;
    var sheet = el('section', 'sheet sheet-token');
    sheet.appendChild(el('h2', 'sheet-heading', 'The token'));
    sheet.appendChild(el('p', 'sheet-note', co
      ? ('Print this page on the stiffest paper you have. You wrote this together, so there are two matching keeper halves, one for each of you, and one that travels sealed with the letter. ' +
        'Decades from now, the patterned edge is the signature: a keeper half and the travelling half must meet.')
      : ('Print this page on the stiffest paper you have. Cut along the dashed line. ' +
        'One half stays with the writer; the other travels sealed with the letter. ' +
        'Decades from now, the broken edge is the signature: the halves must meet.')));
    if (co) {
      sheet.appendChild(cowrittenTokenHolder(s, f.writers));
    } else {
      var holder = el('div', 'token-holder');
      holder.innerHTML = s.token.sheet; /* generated by token.js from the seed — no user HTML */
      sheet.appendChild(holder);
    }
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

  /* ---------- the letter ladder (print variant): same waiting-letters
     timeline as the landing page's hairline SVG, static (no hover). ---------- */
  var MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;
  function ladderYearsWords(n) {
    if (n === 100) return 'a hundred years';
    var ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    var TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    var w;
    if (n < 10) w = ONES[n] || 'no';
    else if (n < 20) w = TEENS[n - 10];
    else if (n < 100) w = TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    else w = String(n);
    return w + (n === 1 ? ' year' : ' years');
  }
  function svgEl(tag, attrs) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    return n;
  }
  function ladderSheet(entries) {
    var today = new Date();
    var todayIso = today.getFullYear() + '-' + (today.getMonth() + 1 < 10 ? '0' : '') + (today.getMonth() + 1) +
      '-' + (today.getDate() < 10 ? '0' : '') + today.getDate();
    var todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    var waiting = [];
    entries.forEach(function (e) {
      if (e.openWhenNeeded || !e.openOn || e.openOn <= todayIso) return;
      waiting.push(e);
    });
    if (!waiting.length) return null;

    var occ = root.TesseraOccasions;
    var W = 640, H = 100, leftPad = 40, rightPad = 60, axisY = 48, axisWidth = W - leftPad - rightPad;
    var years = [], maxYears = 0, i;
    for (i = 0; i < waiting.length; i++) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(waiting[i].openOn);
      var y = (Date.UTC(+m[1], +m[2] - 1, +m[3]) - todayMs) / MS_PER_YEAR;
      years.push(y);
      if (y > maxYears) maxYears = y;
    }
    if (maxYears <= 0) maxYears = 1 / 365.25;
    function xFor(y) { return leftPad + (Math.sqrt(Math.max(y, 0)) / Math.sqrt(maxYears)) * axisWidth; }

    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ladder-svg', role: 'img', 'aria-label': 'A timeline of letters waiting to be opened.' });
    svg.appendChild(svgEl('line', { class: 'ladder-axis', x1: leftPad, y1: axisY, x2: W - rightPad, y2: axisY }));
    svg.appendChild(svgEl('text', { class: 'ladder-now', x: leftPad, y: axisY - 12, 'text-anchor': 'middle' })).textContent = 'now';

    var STANDARD = [10, 25, 50, 100], ticks = [];
    for (var s = 0; s < STANDARD.length; s++) if (STANDARD[s] <= maxYears) ticks.push(STANDARD[s]);
    var nearFinal = false;
    for (var tchk = 0; tchk < ticks.length; tchk++) {
      if (Math.abs(ticks[tchk] - maxYears) <= Math.max(1, maxYears * 0.06)) nearFinal = true;
    }
    if (!nearFinal) ticks.push(maxYears);
    for (var ti = 0; ti < ticks.length; ti++) {
      var tYears = ticks[ti], tx = xFor(tYears), isMinor = (tYears === 25);
      svg.appendChild(svgEl('line', { class: 'ladder-tick', x1: tx, y1: axisY - 6, x2: tx, y2: axisY + 6 }));
      var tanchor = tx > W - 56 ? 'end' : (tx < 56 ? 'start' : 'middle');
      var label = svgEl('text', { class: 'ladder-tick-label' + (isMinor ? ' ladder-tick-label--minor' : ''), x: tx, y: axisY + 22, 'text-anchor': tanchor });
      label.textContent = ladderYearsWords(Math.round(tYears));
      svg.appendChild(label);
    }

    var lastX = null, stagger = 1;
    for (var wi = 0; wi < waiting.length; wi++) {
      var lt = waiting[wi], mx = xFor(years[wi]), dy = 0;
      if (lastX !== null && Math.abs(mx - lastX) < 8) { dy = stagger * 7; stagger = -stagger; }
      else stagger = 1;
      lastX = mx;
      var g = (occ && occ.bySlug(lt.occasion || 'custom').group) || 'custom';
      var mark = svgEl('circle', { class: 'ladder-mark ladder-mark--' + g, cx: mx, cy: axisY + dy, r: 5 });
      svg.appendChild(mark);
    }
    var holder = el('div', 'ladder-holder');
    holder.appendChild(svg);
    return holder;
  }

  function registerSheet(entries) {
    var M = root.TesseraManifest;
    var sheet = el('section', 'sheet sheet-register');
    sheet.appendChild(el('h2', 'sheet-heading', 'Letters in this house, waiting.'));
    var ladder = ladderSheet(entries);
    if (ladder) sheet.appendChild(ladder);
    var table = el('table', 'register-table');
    var head = el('tr', '');
    ['Letter', 'For', 'Sealed', 'Opens', 'Kept by'].forEach(function (h) { head.appendChild(el('th', '', h)); });
    table.appendChild(head);
    entries.forEach(function (e) {
      var tr = el('tr', '');
      tr.appendChild(el('td', 'mono', e.id));
      tr.appendChild(el('td', '', e.to));
      tr.appendChild(el('td', '', shortDate(e.written)));
      tr.appendChild(el('td', '', e.openWhenNeeded ? 'when needed' : shortDate(e.openOn)));
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
        e.openWhenNeeded ? 'when needed' : shortDate(e.openOn)));
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

  /* ---------- booklet print engine (docs/features/booklet.md, v0.3 Task 3) ----------
     A4-landscape sheets holding two A5 leaves side by side. Sequential mode:
     logical reading order, two leaves per sheet, single-sided, meant to be
     cut down the centre and spiral-bound or stapled. Signature (imposed,
     duplex) mode uses the same leaves, reordered by TesseraBooklet.impose()
     and printed two-sided, folded and sewn instead of cut. `duplex` (bool)
     is threaded through every leaf builder — including the pagination
     probe — so both modes always measure and render against the identical
     box geometry; a mode-only CSS override would let the two drift apart
     and risk overflow. */
  function bkFooter(id, label) {
    var f = el('div', 'bk-footer');
    f.appendChild(el('span', 'mono', id));
    f.appendChild(el('span', '', label));
    return f;
  }
  function bkLeaf(kind, duplex) {
    return el('div', 'bk-leaf bk-leaf--' + kind + (duplex ? ' bk-leaf--duplex' : ''));
  }

  function bkTitleLeaf(model, duplex) {
    var leaf = bkLeaf('title', duplex);
    leaf.appendChild(el('p', 'bk-title-kicker', 'A Tessera booklet'));
    leaf.appendChild(el('h2', 'bk-title-heading', model.title));
    leaf.appendChild(el('p', 'bk-title-sub', model.count + ' letter' + (model.count === 1 ? '' : 's') + ', bound together.'));
    return leaf;
  }

  function bkFactsLeaf(row, duplex) {
    var M = root.TesseraManifest;
    var leaf = bkLeaf('facts', duplex);
    leaf.appendChild(el('p', 'bk-facts-to', 'For ' + row.to));
    leaf.appendChild(el('p', 'bk-facts-line', 'From ' + (row.from || 'someone who loves them')));
    leaf.appendChild(el('p', 'bk-facts-line', 'Sealed ' + M.dateInWords(row.written) + '.'));
    leaf.appendChild(el('p', 'bk-facts-line', row.openWhenNeeded
      ? 'Opened when it was needed.'
      : 'To be opened ' + M.dateInWords(row.openOn) + '.'));
    leaf.appendChild(bkFooter(row.id, 'facts'));
    return leaf;
  }

  function bkLetterLeafShell(row, duplex) {
    var leaf = bkLeaf('letter', duplex);
    leaf.appendChild(el('div', 'bk-letter-body'));
    leaf.appendChild(bkFooter(row.id, 'the letter'));
    return leaf;
  }

  /* the one place this print job measures the DOM (features/booklet.md Task 2
     note): fills a hidden probe leaf paragraph by paragraph, and word by word
     if a single paragraph alone would overflow, splitting into as many A5
     leaves as the letter needs. */
  function paginateLetter(row, duplex) {
    var paras = String(row.text || '').trim().split(/\n\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
    var probe = bkLetterLeafShell(row, duplex);
    probe.style.position = 'fixed';
    probe.style.left = '-9999px';
    probe.style.top = '0';
    probe.style.visibility = 'hidden';
    /* pinned to the safe printed leaf size: standalone, the probe sits
       outside the .booklet-sheet flex box that normally gives .bk-leaf its
       dimensions, so without an explicit size it collapses to its empty
       content size and every word "overflows" a near-zero budget. The
       numbers are the tighter of A4-landscape and US-Letter-landscape,
       @page-margin already subtracted (matching print.css's .booklet-sheet
       rule, which must stay in sync with these): width = half of
       min(297,279.4)mm content width minus 2x10mm margin ≈ 129mm; height =
       min(210,215.9)mm minus 2x10mm margin = 190mm. Content sized for the
       narrower/shorter budget always fits the roomier paper too. */
    probe.style.width = '129mm';
    probe.style.height = '190mm';
    document.body.appendChild(probe);
    var body = probe.querySelector('.bk-letter-body');
    var cs = getComputedStyle(probe);
    var maxH = probe.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var pages = [];
    var current = [];
    function fits() { return body.scrollHeight <= maxH; }
    function commit() { pages.push(current.join('\n\n')); current = []; body.innerHTML = ''; }
    for (var i = 0; i < paras.length; i++) {
      var p = document.createElement('p');
      p.textContent = paras[i];
      body.appendChild(p);
      if (fits()) { current.push(paras[i]); continue; }
      body.removeChild(p);
      if (current.length) commit();
      /* the paragraph alone still doesn't fit an empty leaf: split by words */
      var words = paras[i].split(/\s+/);
      var chunk = [];
      for (var w = 0; w < words.length; w++) {
        chunk.push(words[w]);
        var t = document.createElement('p');
        t.textContent = chunk.join(' ');
        body.appendChild(t);
        if (!fits() && chunk.length > 1) {
          chunk.pop();
          body.removeChild(t);
          current.push(chunk.join(' '));
          commit();
          chunk = [words[w]];
          t = document.createElement('p');
          t.textContent = chunk.join(' ');
          body.appendChild(t);
        }
        body.removeChild(t);
      }
      current.push(chunk.join(' '));
    }
    if (current.length) commit();
    document.body.removeChild(probe);
    if (!pages.length) pages = [''];
    return pages.map(function (text, idx) {
      var leaf = bkLetterLeafShell(row, duplex);
      var b = leaf.querySelector('.bk-letter-body');
      text.split(/\n\n+/).forEach(function (para) { if (para.trim()) b.appendChild(el('p', '', para.trim())); });
      leaf.querySelector('.bk-footer').lastChild.textContent = pages.length > 1
        ? 'the letter · ' + (idx + 1) + '/' + pages.length : 'the letter';
      return leaf;
    });
  }

  function bkPlatesLeaf(rows, tokens, duplex) {
    var leaf = bkLeaf('plates', duplex);
    leaf.appendChild(el('h3', 'bk-plates-heading', 'The tokens, gathered.'));
    var grid = el('div', 'bk-plates-grid');
    rows.forEach(function (r, i) {
      var cell = el('div', 'bk-plate-cell');
      var art = el('div', 'bk-plate-art');
      if (tokens[i] && tokens[i].full) art.innerHTML = tokens[i].full; /* seed-generated SVG */
      cell.appendChild(art);
      cell.appendChild(el('span', 'bk-plate-id mono', r.id));
      grid.appendChild(cell);
    });
    leaf.appendChild(grid);
    return leaf;
  }

  function bkColophonLeaf(rows, duplex) {
    var leaf = bkLeaf('colophon', duplex);
    leaf.appendChild(el('h3', 'bk-colophon-heading', 'A note on the format.'));
    leaf.appendChild(el('p', 'bk-colophon-note',
      'Each letter in this booklet was written, sealed and kept with Tessera — a way of writing letters across time. ' +
      'The original sealed files travel separately from this bound copy.'));
    leaf.appendChild(el('p', 'bk-colophon-label', 'Letters in this booklet:'));
    var ul = el('ul', 'bk-colophon-list');
    rows.forEach(function (r) { ul.appendChild(el('li', 'mono', r.id)); });
    leaf.appendChild(ul);
    return leaf;
  }

  function bkBindArtSequential() {
    var A = 'fill="none" stroke="#211d16" stroke-linecap="round" stroke-linejoin="round"';
    var svg = '<svg viewBox="0 0 120 90" ' + A + '>' +
      '<rect x="20" y="8" width="70" height="74" rx="1.5" stroke-width="1"/>' +
      '<line x1="20" y1="8" x2="20" y2="82" stroke-width="1.6"/>' +
      '<circle cx="20" cy="24" r="2.4" stroke-width="1"/>' +
      '<circle cx="20" cy="66" r="2.4" stroke-width="1"/>' +
      '</svg>';
    var box = el('div', 'bk-bind-art');
    box.innerHTML = svg; /* self-generated hairline SVG, no user content */
    return box;
  }

  function bkBindLeafSequential() {
    var leaf = bkLeaf('bind');
    leaf.appendChild(el('h3', 'bk-bind-heading', 'Binding this booklet.'));
    leaf.appendChild(bkBindArtSequential());
    var ol = el('ol', 'bk-bind-steps');
    ['Print every sheet of this job single-sided, in order.',
      'Cut each sheet in half along the dashed centre line.',
      'Stack the halves in page order, title page on top.',
      'Staple twice along the left edge, or punch holes and spiral-bind.'
    ].forEach(function (t) { ol.appendChild(el('li', '', t)); });
    leaf.appendChild(ol);
    return leaf;
  }

  /* the pamphlet-stitch diagram: a folded sheet seen from the spine, three
     holes pierced through every nested layer, one thread in and out of them */
  function bkBindArtSignature() {
    var A = 'fill="none" stroke="#211d16" stroke-linecap="round" stroke-linejoin="round"';
    var svg = '<svg viewBox="0 0 120 90" ' + A + '>' +
      '<rect x="14" y="4" width="46" height="82" rx="1.5" stroke-width="1"/>' +
      '<rect x="60" y="4" width="46" height="82" rx="1.5" stroke-width="1"/>' +
      '<line x1="60" y1="6" x2="60" y2="84" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<path d="M60 20 L48 32 L60 45 L72 58 L60 70" stroke-width="0.9"/>' +
      '<circle cx="60" cy="20" r="2" stroke-width="1"/>' +
      '<circle cx="60" cy="45" r="2" stroke-width="1"/>' +
      '<circle cx="60" cy="70" r="2" stroke-width="1"/>' +
      '</svg>';
    var box = el('div', 'bk-bind-art');
    box.innerHTML = svg; /* self-generated hairline SVG, no user content */
    return box;
  }

  function bkBindLeafSignature(nSheets) {
    var leaf = bkLeaf('bind', true);
    leaf.appendChild(el('h3', 'bk-bind-heading', 'Binding this booklet.'));
    leaf.appendChild(bkBindArtSignature());
    var ol = el('ol', 'bk-bind-steps');
    ['Print every sheet of this job duplex, flipped on the short edge, in order.',
      'Nest the sheets inside one another, in the order they printed.',
      'Fold the whole nested stack in half along the centre.',
      'Along the fold, mark three to five evenly spaced points and pierce a hole through every layer at each.',
      'Sew pamphlet-style: from outside the centre hole, back out through one end hole, across and in through the other end hole, then back through the centre — tie off there, inside the fold.'
    ].forEach(function (t) { ol.appendChild(el('li', '', t)); });
    leaf.appendChild(ol);
    var note = 'This booklet needs ' + nSheets + ' sheet' + (nSheets === 1 ? '' : 's') + ' to fold into one signature.';
    note += nSheets > 5
      ? ' That is more than five — hand-sewing gets difficult past this point. Consider splitting into two volumes, or asking a print shop to finish the binding.'
      : ' More than five sheets in one signature gets hard to fold and sew by hand; a print shop can help beyond that.';
    leaf.appendChild(el('p', 'bk-bind-note', note));
    leaf.appendChild(el('p', 'bk-bind-note',
      'More pages than one signature can hold? Nest a second signature and sew it through the same holes — a kettle stitch links the two — a bookbinding reference can walk you through it.'));
    return leaf;
  }

  function bkAllTokens(rows) {
    var M = root.TesseraManifest, X = root.TesseraExport, T = root.TesseraToken;
    return Promise.all(rows.map(function (r) {
      var f = { openOn: r.openOn, written: r.written, from: r.from, to: r.to, letter: r.text };
      return X.sha256Hex(M.tokenSeedString(f)).then(function (seedHex) {
        return T.renderTokenSvg(seedHex, r.id);
      });
    }));
  }

  function buildBookletLeaves(model, rows, duplex) {
    return bkAllTokens(rows).then(function (tokens) {
      var leaves = [bkTitleLeaf(model, duplex)];
      rows.forEach(function (r) {
        leaves.push(bkFactsLeaf(r, duplex));
        leaves = leaves.concat(paginateLetter(r, duplex));
      });
      leaves.push(bkPlatesLeaf(rows, tokens, duplex));
      leaves.push(bkColophonLeaf(rows, duplex));
      return leaves;
    });
  }

  function sequentialSheets(leaves) {
    var items = leaves.slice();
    if (items.length % 2) items.push(null);
    var sheets = [];
    for (var i = 0; i < items.length; i += 2) {
      var sheet = el('div', 'booklet-sheet');
      sheet.appendChild(items[i] || bkLeaf('blank'));
      sheet.appendChild(el('div', 'bk-cut'));
      sheet.appendChild(items[i + 1] || bkLeaf('blank'));
      sheets.push(sheet);
    }
    return sheets;
  }

  /* signature mode: TesseraBooklet.impose() (pure, fixture-tested) gives each
     duplex sheet's front/back page numbers (1-indexed, null = blank). Every
     impose() sheet becomes two consecutive .booklet-sheet print pages — front
     then back — so a printer's duplex pass lands them on the same physical
     sheet; the dashed centre divider is a fold, not a cut. */
  function signatureSheets(leaves) {
    var imposed = root.TesseraBooklet.impose(leaves.length);
    function leafAt(pageNum) { return pageNum === null ? bkLeaf('blank', true) : leaves[pageNum - 1]; }
    var sheets = [];
    imposed.forEach(function (s) {
      var front = el('div', 'booklet-sheet');
      front.appendChild(leafAt(s.front[0]));
      front.appendChild(el('div', 'bk-cut bk-cut--fold'));
      front.appendChild(leafAt(s.front[1]));
      sheets.push(front);
      var back = el('div', 'booklet-sheet');
      back.appendChild(leafAt(s.back[0]));
      back.appendChild(el('div', 'bk-cut bk-cut--fold'));
      back.appendChild(leafAt(s.back[1]));
      sheets.push(back);
    });
    return sheets;
  }

  /* a running "N of TOTAL" in the top-right corner of every leaf, including
     title/plates/colophon/bind (which carry no letter id of their own) —
     the whole point is reassembling a bound signature that comes apart, so
     it has to cover every leaf, not just the ones with an id to show. Runs
     once the final leaf array (bind leaf included) is known. */
  function bkNumberPages(leaves) {
    var total = leaves.length;
    leaves.forEach(function (leaf, i) {
      leaf.appendChild(el('span', 'bk-pageno mono', (i + 1) + ' of ' + total));
    });
  }

  function printBooklet(model, rows, opts) {
    var mode = (opts && opts.mode) || 'sequential';
    var duplex = mode === 'signature';
    return buildBookletLeaves(model, rows, duplex).then(function (leaves) {
      var sheets;
      if (duplex) {
        var nSheets = Math.ceil((leaves.length + 1) / 4); /* +1 for the bind leaf about to join them */
        leaves.push(bkBindLeafSignature(nSheets));
      } else {
        leaves.push(bkBindLeafSequential());
      }
      bkNumberPages(leaves);
      sheets = duplex ? signatureSheets(leaves) : sequentialSheets(leaves);
      show(sheets, { booklet: true });
      return mode;
    });
  }

  /* show sheets in the print preview overlay; printing prints only #print-root.
     Booklet jobs hide the envelope/theme controls (neither applies — themes
     only ever styled the single-letter kit's cover/envelope/token sheets)
     and relabel the print button, since the overlay and its toolbar are
     shared across every print job. */
  function show(sheets, opts) {
    var overlay = document.getElementById('print-overlay');
    var rootEl = document.getElementById('print-root');
    rootEl.innerHTML = '';
    for (var i = 0; i < sheets.length; i++) rootEl.appendChild(sheets[i]);
    overlay.classList.toggle('print-overlay--booklet', !!(opts && opts.booklet));
    var goBtn = document.getElementById('print-go');
    if (goBtn) goBtn.textContent = (opts && opts.booklet) ? 'Print the booklet' : 'Print the kit';
    overlay.hidden = false;
    document.body.classList.add('printing-preview');
  }

  function hide() {
    var overlay = document.getElementById('print-overlay');
    overlay.hidden = true;
    document.body.classList.remove('printing-preview');
  }

  function printKit(sealed, opts) { show(kitSheets(sealed, opts)); }
  /* a milestone series prints as one job: each letter's own kit, concatenated
     in date order. Same per-letter kitSheets, so every cover/footer still
     self-identifies (features/occasions.md: "N print kits batched into one
     print job"). Presentation only — the folders are unchanged. */
  function printKits(sealedList, opts) {
    var list = sealedList.slice().sort(function (a, b) {
      var ao = (a.fields && a.fields.openOn) || '', bo = (b.fields && b.fields.openOn) || '';
      return ao < bo ? -1 : ao > bo ? 1 : 0;
    });
    var sheets = [];
    for (var i = 0; i < list.length; i++) sheets = sheets.concat(kitSheets(list[i], opts));
    show(sheets);
  }
  function printRegister(entries) { show([registerSheet(entries)]); }
  function printCard(entries) { show([cardSheet(entries)]); }
  function printEscrowCard(o) { show([escrowSheet(o)]); }

  var api = { printKit: printKit, printKits: printKits, printRegister: printRegister, printCard: printCard, printEscrowCard: printEscrowCard, printBooklet: printBooklet, hide: hide, kitSheets: kitSheets };
  root.TesseraPrint = api;
})(typeof self !== 'undefined' ? self : this);
