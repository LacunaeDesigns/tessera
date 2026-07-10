/* registry.js — the writer's ledger (docs/features/registry.md): waiting
   letters ordered by open date (the ladder, in list form), drafts, and the
   printable register page. Metadata only; nothing leaves the device. */
(function (root) {
  'use strict';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function timeUntil(openOn) {
    var now = new Date();
    var target = new Date(openOn + 'T00:00:00');
    var days = Math.round((target - now) / 86400000);
    if (days <= 0) return 'ready to open';
    if (days < 60) return 'opens in ' + days + ' days';
    if (days < 700) return 'opens in ' + Math.round(days / 30) + ' months';
    return 'opens in ' + Math.round(days / 365) + ' years';
  }

  /* a registry entry as the pure ICS builder wants it. Open-when letters have
     no date to remember (their trigger is a life event), so they are never
     offered a calendar file — the caller guards on e.openWhenNeeded. */
  function icsLetter(e) {
    return {
      id: e.id,
      to: e.to || 'someone',
      written: e.written,
      openOn: e.openOn,
      coverText: 'A letter for ' + (e.to || 'someone') + ', sealed '
        + (e.written ? TesseraManifest.dateInWords(e.written) : 'long ago') + '.'
    };
  }

  function downloadIcs(letters, filename) {
    TesseraExport.downloadText(TesseraIcs.buildIcs(letters), filename, 'text/calendar');
  }

  function calendarButton(e) {
    var b = el('button', 'btn-quiet btn-small', 'Add to calendar');
    b.type = 'button';
    b.addEventListener('click', function () { downloadIcs([icsLetter(e)], 'tessera-' + e.id + '.ics'); });
    return b;
  }

  function rebuildSealed(e) {
    /* re-derive what we can for reprinting: without kept text the kit offers
       cover + instructions + token sheets (the README carries no letter text) */
    var fields = {
      id: e.id, written: e.written, openOn: e.openOn, from: e.from, to: e.to,
      occasion: e.occasion, language: 'en',
      custody: e.custodyHolder ? [{ holder: e.custodyHolder, instructions: e.custodyNote || 'Keep it safe; pass it on with its story.' }] : [],
      openWhenNeeded: !!e.openWhenNeeded
    };
    if (e.keptText) {
      /* full re-seal from kept text regenerates everything, token included */
      return TesseraExport.seal({
        to: e.to, from: e.from, written: e.written, openOn: e.openOn,
        occasion: e.occasion, language: 'en', custody: fields.custody,
        letter: e.keptText, openWhenNeeded: !!e.openWhenNeeded
      });
    }
    /* no kept text: token cannot be re-derived (it needs the letter); reprint
       the paper that doesn't need it */
    fields.tokenSeed = 'unavailable-without-letter-text';
    return Promise.resolve({
      fields: fields,
      letterText: '',
      readme: TesseraManifest.renderReadme(fields),
      token: null,
      zip: null
    });
  }

  function render() {
    var c = document.querySelector('#registry-root');
    if (!c) return;
    c.innerHTML = '';
    var all = TesseraState.getRegistry();
    var reg = all.filter(function (e) { return e.status === 'sealed'; });
    reg.sort(function (a, b) { return a.openOn < b.openOn ? -1 : a.openOn > b.openOn ? 1 : 0; });
    var kept = all.filter(function (e) { return e.role === 'custodian'; });
    kept.sort(function (a, b) { return a.openOn < b.openOn ? -1 : a.openOn > b.openOn ? 1 : 0; });

    var draft = TesseraState.getDraft('current');

    c.appendChild(el('h2', 'screen-title', 'Your letters'));

    if (!reg.length && !draft && !kept.length) {
      c.appendChild(el('p', 'hint', 'Nothing waits yet. The first letter is the hardest and the best one to have written.'));
      var start = el('a', 'btn-primary btn-link', 'Write a letter');
      start.href = '#write';
      c.appendChild(start);
      return;
    }

    if (reg.length) {
      c.appendChild(el('h3', 'compose-sub', 'Waiting'));
      var list = el('div', 'ledger');
      reg.forEach(function (e) {
        var row = el('div', 'ledger-row');
        var main = el('div', 'ledger-main');
        main.appendChild(el('p', 'ledger-to', e.to));
        main.appendChild(el('p', 'ledger-meta',
          (e.openWhenNeeded ? 'opens when needed' : TesseraManifest.dateInWords(e.openOn) + ' · ' + timeUntil(e.openOn))
          + ' · kept by ' + (e.custodyHolder || 'you')));
        main.appendChild(el('p', 'ledger-id', e.id));
        row.appendChild(main);

        var actions = el('div', 'ledger-actions');
        var pr = el('button', 'btn-quiet btn-small', e.keptText ? 'Print the kit' : 'Print cover & instructions');
        pr.type = 'button';
        pr.addEventListener('click', function () {
          rebuildSealed(e).then(function (sealed) { TesseraPrint.printKit(sealed); });
        });
        actions.appendChild(pr);
        if (!e.openWhenNeeded) actions.appendChild(calendarButton(e));
        var rm = el('button', 'btn-quiet btn-small', 'Remove from this device');
        rm.type = 'button';
        rm.addEventListener('click', function () {
          if (confirm('Remove this record from this device? The sealed letter itself (the folder, the paper) is not touched. Removing the record does not unseal anything.')) {
            TesseraState.removeRegistryEntry(e.id);
            render();
          }
        });
        actions.appendChild(rm);
        row.appendChild(actions);
        list.appendChild(row);
      });
      c.appendChild(list);

      var printRow = el('div', 'compose-nav');
      var reg2 = el('button', 'btn-primary', 'Print the register');
      reg2.type = 'button';
      reg2.addEventListener('click', function () { TesseraPrint.printRegister(reg); });
      printRow.appendChild(reg2);
      var datedReg = reg.filter(function (e) { return !e.openWhenNeeded; });
      if (datedReg.length) {
        var cal = el('button', 'btn-quiet', 'Calendar file (all dates)');
        cal.type = 'button';
        cal.addEventListener('click', function () {
          downloadIcs(datedReg.map(icsLetter), 'tessera-letters.ics');
        });
        printRow.appendChild(cal);
      }
      c.appendChild(printRow);
    }

    if (kept.length) {
      c.appendChild(el('h3', 'compose-sub', 'In your keeping'));
      var keptList = el('div', 'ledger');
      kept.forEach(function (e) {
        var row = el('div', 'ledger-row');
        var main = el('div', 'ledger-main');
        main.appendChild(el('p', 'ledger-to', 'For ' + (e.to || 'someone') + ', from ' + (e.from || 'someone')));
        main.appendChild(el('p', 'ledger-meta',
          (e.openWhenNeeded ? 'opens when needed' : TesseraManifest.dateInWords(e.openOn) + ' · ' + timeUntil(e.openOn))
          + ' · unopened, in your keeping'));
        main.appendChild(el('p', 'ledger-id', e.id));
        row.appendChild(main);
        var actions = el('div', 'ledger-actions');
        if (!e.openWhenNeeded) actions.appendChild(calendarButton(e));
        var rm = el('button', 'btn-quiet btn-small', 'Remove from this device');
        rm.type = 'button';
        rm.addEventListener('click', function () {
          if (confirm('Remove this record from this device? The letter itself (the folder, the paper) is not touched.')) {
            TesseraState.removeRegistryEntry(e.id);
            render();
          }
        });
        actions.appendChild(rm);
        row.appendChild(actions);
        keptList.appendChild(row);
      });
      c.appendChild(keptList);
    }

    if (draft) {
      c.appendChild(el('h3', 'compose-sub', 'Draft'));
      var dRow = el('div', 'ledger-row');
      var dMain = el('div', 'ledger-main');
      dMain.appendChild(el('p', 'ledger-to', draft.draft.to || 'Unaddressed'));
      dMain.appendChild(el('p', 'ledger-meta', 'unsealed'));
      dRow.appendChild(dMain);
      var dActions = el('div', 'ledger-actions');
      var cont = el('a', 'btn-quiet btn-small btn-link', 'Continue writing');
      cont.href = '#write';
      dActions.appendChild(cont);
      dRow.appendChild(dActions);
      c.appendChild(dRow);
    }
  }

  root.TesseraRegistry = { render: render };
})(typeof self !== 'undefined' ? self : this);
