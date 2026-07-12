/* demo-seed.js — OPT-IN example letters, for demos and screenshots only.
   Inert unless the URL carries ?demo. When triggered it seals a handful of
   example letters through the REAL seal pipeline (never faked registry rows),
   tags them demo:true, and shows a banner with one-click clear. A normal
   visitor never carries ?demo, so this never runs for them. Nothing here
   changes the shipped product's default behaviour. */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  if (!params.has('demo')) return;

  var S = window.TesseraState;
  var X = window.TesseraExport;
  if (!S || !X) return;

  function iso(y, m, d) {
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }
  function today() {
    var n = new Date();
    return iso(n.getFullYear(), n.getMonth() + 1, n.getDate());
  }
  function demoEntries() {
    return S.getRegistry().filter(function (e) { return e.demo; });
  }

  var EXAMPLES = [
    {
      to: 'Maya, at eighteen', from: 'Mum', occasion: 'milestone-18',
      openOn: iso(2044, 9, 1), sealKey: 'pale-pink', role: 'writer',
      letter:
        'Dear Maya,\n\n' +
        'If someone has handed you this, then you are eighteen, and I am eighteen years further along than the morning I wrote it — a Tuesday, rain on the window, you asleep down the hall.\n\n' +
        'I don’t know yet who you’ve become. I know who you were at six months: furious, funny, entirely yourself. Whatever the world has told you since, that was true first.\n\n' +
        'Be brave with your one life. Come home when you can.\n\n' +
        'All my love,\nMum'
    },
    {
      to: 'Myself at sixty', from: 'me, in 2026', occasion: 'future-self',
      openOn: iso(2054, 7, 12), sealKey: 'navy', role: 'writer',
      letter:
        'To the version of me reading this at sixty,\n\n' +
        'I’m thirty-two and I have no idea if any of it worked out. I’m writing anyway, because I want you to remember this year — the small flat, the long hours, the stubborn hope.\n\n' +
        'If you’re tired, I understand. If you’re proud, I’m glad. Either way: thank you for not stopping.\n\n' +
        '— me'
    },
    {
      to: 'Whoever opens this in 2126', from: 'a stranger in 2026', occasion: 'stranger-2126',
      openOn: iso(2126, 1, 1), sealKey: 'forest-green', role: 'writer',
      letter:
        'To whoever opens this in 2126,\n\n' +
        'You don’t know me and I will never know you, which is the strange gift of a letter like this one. I lived in the early part of the twenty-first century. We were frightened and inventive in roughly equal measure.\n\n' +
        'I hope the air is clean where you are. I hope you still write things down by hand sometimes. Someone in 2026 thought of you, and wished you well.\n\n' +
        '— a stranger'
    },
    {
      to: 'Emil, on his wedding day', from: 'Grandpa Sören', occasion: 'anniversary',
      openOn: iso(2038, 6, 20), sealKey: 'gold', role: 'custodian',
      letter:
        'For Emil, to be opened on the morning he marries.\n\n' +
        'Sealed by his grandfather, and kept by the family until that day.'
    }
  ];

  function seedAll() {
    var written = today();
    var chain = Promise.resolve();
    EXAMPLES.forEach(function (ex) {
      chain = chain.then(function () {
        var fields = {
          to: ex.to,
          from: ex.from,
          written: written,
          openOn: ex.openOn,
          occasion: ex.occasion,
          language: 'en',
          custody: [],
          letter: ex.letter,
          openWhenNeeded: false,
          writeback: null
        };
        return X.seal(fields).then(function (sealed) {
          S.addRegistryEntry({
            id: sealed.fields.id,
            to: sealed.fields.to,
            from: sealed.fields.from,
            written: sealed.fields.written,
            openOn: sealed.fields.openOn,
            openWhenNeeded: sealed.fields.openWhenNeeded,
            occasion: sealed.fields.occasion,
            custodyHolder: '',
            custodyNote: '',
            /* custodian letters are kept unopened, so no copy of the words */
            keptText: ex.role === 'custodian' ? null : ex.letter,
            status: 'sealed',
            sealKey: ex.sealKey || 'blue',
            role: ex.role || 'writer',
            inReplyTo: null,
            demo: true
          });
        });
      });
    });
    return chain;
  }

  function showBanner() {
    if (document.getElementById('demo-banner')) return;
    var css = document.createElement('style');
    css.textContent =
      '#demo-banner{position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);z-index:120;' +
      'display:flex;align-items:center;gap:.9rem;max-width:calc(100vw - 2rem);' +
      'padding:.55rem .55rem .55rem 1rem;border-radius:999px;' +
      'background:#211d16;color:#f7f3ea;font-size:.82rem;line-height:1.3;' +
      'box-shadow:0 6px 24px rgba(0,0,0,.28);font-family:ui-sans-serif,system-ui,sans-serif}' +
      '#demo-banner button{border:0;cursor:pointer;border-radius:999px;padding:.4rem .8rem;' +
      'font-size:.8rem;font-weight:600;background:#f7f3ea;color:#211d16}';
    document.head.appendChild(css);
    var bar = document.createElement('div');
    bar.id = 'demo-banner';
    var msg = document.createElement('span');
    msg.textContent = 'Showing example letters — for demos and screenshots.';
    var clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'Clear examples';
    clear.addEventListener('click', clearDemo);
    bar.appendChild(msg);
    bar.appendChild(clear);
    document.body.appendChild(bar);
  }

  function clearDemo() {
    demoEntries().forEach(function (e) { S.removeRegistryEntry(e.id); });
    params.delete('demo');
    var q = params.toString();
    location.replace(location.pathname + (q ? '?' + q : '') + location.hash);
  }

  if (demoEntries().length === 0) {
    /* first ?demo load: seal the examples, then reload so landing.js renders
       the now-populated shelf from a clean init */
    seedAll().then(function () { location.reload(); }).catch(function (err) {
      console.error('[tessera] demo seed failed:', err);
    });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
