/* landing.js — the landing page's working desk. A faithful vanilla port of
   the "Tessera landing implementation" Claude Design prototype (handoff
   README lives in that project; docs/decisions.md records the deviations).
   Sealing here is ceremonial: the one real seal path stays in js/export.js. */
(function () {
  'use strict';

  /* Tweakable knobs, carried over from the design's props panel. */
  var CONFIG = {
    machineColor: '#BFD3DE',       /* one of MACHINE_COLORS */
    heroLayout: 'centered',        /* 'centered' | 'desk at right' */
    shelfStyle: 'shelves',         /* 'shelves' | 'pigeonholes' | 'card catalogue' */
    soundOn: true
  };
  var MACHINE_COLORS = ['#C7DFCE', '#F1C4B2', '#EBD592', '#BFD3DE', '#D8C8E8', '#F0C6CE', '#B9DDD3', '#E4D3B4'];

  /* Sheet metrics. Phones zoom the scene (fitScene) and set larger type on
     the paper, so the wrap width, bell point, and char width follow suit;
     the CSS mobile block sets the matching 20px/30px paper type. */
  function cols() { return isMobile() ? 38 : 52; }
  function bellAt() { return isMobile() ? 32 : 45; }
  function charw() { return isMobile() ? 13.2 : 9.6; }

  var GROUP_TINT = { 'open-when': '#DFEDE3', 'milestone': '#F3E9D0', 'far': '#F5E0D5', 'custom': '#E4E9EA' };
  var GROUP_DEEP = { 'open-when': '#9DBBA6', 'milestone': '#CDB878', 'far': '#D9A088', 'custom': '#A8B4B8' };

  var SEAL_LIB = [
    { key: 'blue', label: 'Pale Blue', src: 'landing/assets/wax-seal.webp' },
    { key: 'red', label: 'Red', src: 'landing/assets/seal-red.webp' },
    { key: 'gold', label: 'Gold', src: 'landing/assets/seal-gold.webp' },
    { key: 'silver', label: 'Silver', src: 'landing/assets/seal-silver.webp' },
    { key: 'black', label: 'Black', src: 'landing/assets/seal-black.webp' },
    { key: 'ivory', label: 'Ivory', src: 'landing/assets/seal-ivory.webp' },
    { key: 'navy', label: 'Navy', src: 'landing/assets/seal-navy.webp' },
    { key: 'forest', label: 'Forest Green', src: 'landing/assets/seal-forest-green.webp' },
    { key: 'sage', label: 'Sage Green', src: 'landing/assets/seal-sage-green.webp' },
    { key: 'pink', label: 'Pale Pink', src: 'landing/assets/seal-pale-pink.webp' },
    { key: 'bronze', label: 'Bronze', src: 'landing/assets/seal-bronze.webp' },
    { key: 'rosegold', label: 'Rose Gold', src: 'landing/assets/seal-rose-gold.webp' }
  ];

  var SHELF_ROTS = [-1.6, 0.8, 1.9, -0.9, 1.2, -1.8, 0.5];

  var DEMO_TEXT = 'Dear reader,\n\nSome letters are meant\nto wait years to be read.\n\nThis desk writes them.';
  var STORY_SEED = '7c1e99065d24fc8fb2c14e07a31b74fc8d24cee906d31bf471a1e9e906d47a2b';

  var state = {
    phase: 'idle', value: '', lines: [''], col: 0, focused: false, autotyping: false, demoActive: true,
    to: '', occasion: null, customOccasion: '', showPrompts: true, setupStep: null, machineColorU: null,
    openOn: '', openWhenNeeded: false, fromWho: '', custodyHolder: '', custodyNote: '', keepCopy: false,
    coWrite: false, secondWriter: '',
    passphrase: '', passConfirm: '', passHint: '',
    sealed: null, freshId: '', sealing: false, soundOnU: null, shelfStyleU: null,
    sealChoice: 'blue', sealPickerOpen: false, writeback: null,
    deckAnswers: null, stitchedText: '', ivIndex: 0, ivStitch: false, keepInterview: false,
    series: null, /* the active milestone-series wizard draft, or null */
    booklet: null /* the active booklet-composer session, or null */
  };

  /* ---------- draft autosave (localStorage, single "desk" slot) ----------
     Persists the in-progress letter and its fields so a reload does not lose
     work. The passphrase is NEVER persisted (encryption.md: it never touches
     storage). The snapshot below deliberately omits passphrase/passConfirm/
     passHint. Saving is suppressed once a letter is sealed, so a late debounce
     cannot resurrect a just-sealed draft (the v0.1 writing-room bug). */
  var DRAFT_SLOT = 'desk';
  var saveTimer = null;
  var resumedDraft = false;
  function draftSnapshot() {
    return {
      to: state.to, fromWho: state.fromWho, occasion: state.occasion, customOccasion: state.customOccasion,
      openOn: state.openOn, openWhenNeeded: state.openWhenNeeded,
      custodyHolder: state.custodyHolder, custodyNote: state.custodyNote, keepCopy: state.keepCopy,
      coWrite: state.coWrite, secondWriter: state.secondWriter,
      sealChoice: state.sealChoice, writeback: state.writeback,
      value: state.value
      /* deck answers stay in-memory only (deck mode's decision); the stitched
         text is already captured in `value` once put into the letter */
    };
  }
  function canSaveDraft() {
    return !!window.TesseraState && state.phase === 'writing' && !state.sealing && !state.sealed && !state.demoActive;
  }
  function scheduleSave() {
    if (!canSaveDraft()) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveTimer = null;
      if (canSaveDraft()) TesseraState.setDraft(DRAFT_SLOT, draftSnapshot());
    }, 600);
  }
  function clearSavedDraft() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (window.TesseraState) TesseraState.clearDraft(DRAFT_SLOT);
  }
  function hasResumableDraft() {
    if (!window.TesseraState) return false;
    var d = TesseraState.getDraft(DRAFT_SLOT);
    return !!(d && d.value && d.value.trim());
  }
  /* bring the desk back to a saved in-progress letter on load, so a reload
     resumes instead of starting blank */
  function restoreDraft() {
    if (!hasResumableDraft()) return false;
    var d = TesseraState.getDraft(DRAFT_SLOT);
    state.to = d.to || '';
    state.fromWho = d.fromWho || '';
    state.occasion = d.occasion || null;
    state.customOccasion = d.customOccasion || '';
    state.openOn = d.openOn || '';
    state.openWhenNeeded = !!d.openWhenNeeded;
    state.custodyHolder = d.custodyHolder || '';
    state.custodyNote = d.custodyNote || '';
    state.keepCopy = !!d.keepCopy;
    state.coWrite = !!d.coWrite;
    state.secondWriter = d.secondWriter || '';
    state.sealChoice = d.sealChoice || 'blue';
    state.writeback = d.writeback || null;
    state.demoActive = false;
    state.autotyping = false;
    state.phase = 'writing';
    introDone = true;
    setSetupStep(null);
    if (refs.setupOcc) refs.setupOcc.value = state.occasion || '';
    refs.ta.value = d.value;
    handleValue(d.value, null, true);
    renderHero();
    return true;
  }

  var refs = {};
  var introDone = false, belled = false, lastKeydown = 0;
  var typerI = null, autoT = null, waitData = null;
  var keyEls = {};
  var lastShelfKey = '';
  var storyPainted = false;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  var mobileQ = window.matchMedia ? window.matchMedia('(max-width: 700px)') : null;
  function isMobile() { return mobileQ ? mobileQ.matches : window.innerWidth <= 700; }
  function soundOn() { return state.soundOnU !== null ? state.soundOnU : CONFIG.soundOn; }
  function shelfStyle() { return state.shelfStyleU || CONFIG.shelfStyle; }
  function machineColor() { return state.machineColorU || CONFIG.machineColor; }

  function occs() {
    return (window.TesseraOccasions && TesseraOccasions.OCCASIONS) ? TesseraOccasions.OCCASIONS : [];
  }
  function bySlug(slug) {
    var list = occs();
    for (var i = 0; i < list.length; i++) if (list[i].slug === slug) return list[i];
    return { title: 'Something else', prompts: [], group: 'custom', canBeUndated: false };
  }
  function currentOcc() { return state.occasion ? bySlug(state.occasion) : null; }
  /* co-written letters: `from` stays the single string that feeds the token
     seed; both names are also carried as writers[]. Both apply only when the
     writer opted in and named a second person. */
  function bothWriters() { return state.coWrite && !!state.fromWho.trim() && !!state.secondWriter.trim(); }
  function effectiveFrom() { return bothWriters() ? (state.fromWho.trim() + ' and ' + state.secondWriter.trim()) : state.fromWho.trim(); }
  function writersList() { return bothWriters() ? [state.fromWho.trim(), state.secondWriter.trim()] : null; }
  function sealMeta(key) {
    for (var i = 0; i < SEAL_LIB.length; i++) if (SEAL_LIB[i].key === key) return SEAL_LIB[i];
    return SEAL_LIB[0];
  }

  /* ---------- dates ---------- */
  function todayIso() {
    var d = new Date(), mo = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (mo < 10 ? '0' : '') + mo + '-' + (day < 10 ? '0' : '') + day;
  }
  function plusYears(iso, n) {
    var p = iso.split('-');
    return (parseInt(p[0], 10) + n) + '-' + p[1] + '-' + p[2];
  }
  function shortDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return '';
    var MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return parseInt(m[3], 10) + ' ' + MO[parseInt(m[2], 10) - 1] + ' ' + m[1];
  }
  function dateInWords(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return '';
    var ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    var TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    var ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
      'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth',
      'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth',
      'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth', 'thirty-first'];
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    function tens(n) {
      return n < 10 ? ONES[n] : n < 20 ? TEENS[n - 10] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    }
    var y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
    var rest = y - 2000, yw;
    if (rest === 0) yw = 'two thousand';
    else if (rest > 0 && rest < 100) yw = 'two thousand and ' + tens(rest);
    else if (rest >= 100) yw = 'two thousand ' + ONES[Math.floor(rest / 100)] + ' hundred' + (rest % 100 ? ' and ' + tens(rest % 100) : '');
    else yw = m[1];
    return 'the ' + ORD[d] + ' of ' + MONTHS[mo - 1] + ', ' + yw;
  }

  /* ---------- sound (Web Audio, synthesized; no audio files) ---------- */
  var ctx = null, master = null, noise = null;
  function ensureCtx() {
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      var len = ctx.sampleRate * 0.5;
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noise.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { /* no audio */ }
    return ctx;
  }
  function burst(freq, q, dur, gain, when) {
    if (!ctx || !soundOn()) return;
    var t = ctx.currentTime + (when || 0);
    var src = ctx.createBufferSource(); src.buffer = noise;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
  }
  function tone(freq, dur, gain, type, when) {
    if (!ctx || !soundOn()) return;
    var t = ctx.currentTime + (when || 0);
    var o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function sClack() { burst(2300 + Math.random() * 700, 1.1, 0.055, 0.85); burst(420, 2.5, 0.05, 0.5, 0.004); }
  function sSpace() { burst(300, 1.6, 0.09, 0.7); }
  function sBack() { burst(1500, 1.4, 0.05, 0.45); }
  function sDing() { tone(2093, 0.9, 0.32, 'sine'); tone(2637, 0.55, 0.14, 'sine'); }
  function sZip() {
    if (!ctx || !soundOn()) return;
    for (var i = 0; i < 7; i++) burst(900 + i * 160, 3.5, 0.028, 0.28, i * 0.022);
    burst(240, 1.8, 0.1, 0.8, 0.18);
  }
  function sFeed() { for (var i = 0; i < 5; i++) burst(1100, 4, 0.03, 0.4, i * 0.05); }

  /* ---------- layout ---------- */
  function fitScene() {
    var wrap = refs.sceneWrap, scene = refs.scene;
    if (!wrap || !scene) return;
    var w = wrap.clientWidth || 960;
    /* phones zoom into the machine: the sheet nearly fills the width and
       the shell crops at the edges; the print point stays center-screen */
    var s = Math.min(1, w / (isMobile() ? 585 : 985));
    scene.style.transform = 'scale(' + s + ')';
    /* overlay chrome sits outside the scaled scene so it stays readable;
       on phones the CSS turns the wizard into a fixed dialog and puts the
       sound pill in flow above the machine, so the inline offsets (and the
       pill's height) must be accounted for differently there */
    if (isMobile()) {
      refs.setupOverlay.style.paddingTop = '';
      refs.interviewOverlay.style.paddingTop = '';
      refs.soundToggle.style.right = '';
      wrap.style.height = Math.round(700 * s + refs.soundToggle.offsetHeight + 8) + 'px';
    } else {
      refs.setupOverlay.style.paddingTop = Math.round(300 * s) + 'px';
      refs.interviewOverlay.style.paddingTop = Math.round(300 * s) + 'px';
      refs.soundToggle.style.right = Math.max(0, Math.round((w - 960 * s) / 2)) + 'px';
      wrap.style.height = Math.round(700 * s) + 'px';
    }
  }
  function applyMachineColor() {
    var c = machineColor();
    var shells = document.querySelectorAll('[data-mc="shell"]');
    for (var i = 0; i < shells.length; i++) {
      shells[i].style.background = 'linear-gradient(180deg, color-mix(in oklab, ' + c + ', white 22%), ' + c + ' 42%, color-mix(in oklab, ' + c + ', #4A3A28 20%))';
    }
    var decks = document.querySelectorAll('[data-mc="deck"]');
    for (var j = 0; j < decks.length; j++) {
      decks[j].style.background = 'color-mix(in oklab, ' + c + ', #33281B 24%)';
    }
  }
  function applyHeroLayout() {
    refs.heroWrap.classList.toggle('hero-wrap--side', CONFIG.heroLayout === 'desk at right');
  }
  function scrollToEl(node, offset) {
    if (!node) return;
    var top = node.getBoundingClientRect().top + window.scrollY - (offset || 70);
    window.scrollTo({ top: top, behavior: reduced() ? 'auto' : 'smooth' });
  }

  /* ---------- text engine ---------- */
  function wrapText(v) {
    var out = [];
    var paras = String(v).split('\n');
    for (var i = 0; i < paras.length; i++) {
      var p = paras[i];
      if (p === '') { out.push(''); continue; }
      var words = p.split(' ');
      var cur = '';
      var C = cols();
      for (var j = 0; j < words.length; j++) {
        var w = words[j];
        var cand = cur ? cur + ' ' + w : w;
        if (cand.length <= C) { cur = cand; continue; }
        if (cur) out.push(cur);
        while (w.length > C) { out.push(w.slice(0, C)); w = w.slice(C); }
        cur = w;
      }
      out.push(cur);
    }
    return out.length ? out : [''];
  }

  function handleValue(v, insertedChar, silent) {
    var lines = wrapText(v);
    var col = lines[lines.length - 1].length;
    var added = v.length - state.value.length;
    var lineJump = lines.length !== state.lines.length;
    if (!silent) {
      ensureCtx();
      if (added > 0) {
        var ch = insertedChar != null ? insertedChar : v[v.length - 1];
        if (lineJump) doReturnFx();
        if (ch === ' ') sSpace(); else if (ch !== '\n') sClack();
        if (ch && ch !== '\n' && Date.now() - lastKeydown > 80) animateKey(ch);
        if (ch && ch !== '\n') strikeBar();
        if (col >= bellAt() && state.col < bellAt() && !belled) { sDing(); belled = true; }
        if (lineJump) belled = false;
      } else if (added < 0) {
        sBack();
        if (lineJump) belled = false;
      }
    }
    state.value = v; state.lines = lines; state.col = col;
    scheduleSave();
    renderPaper();
    updateCarriage(lineJump);
    scrollPaperToBottom();
    renderWriting();
    renderSealSection();
  }

  function renderPaper() {
    var holder = refs.paperLines;
    while (holder.firstChild) holder.removeChild(holder.firstChild);
    for (var i = 0; i < state.lines.length; i++) holder.appendChild(el('div', null, state.lines[i]));
  }
  function scrollPaperToBottom() {
    refs.paperScroll.scrollTop = refs.paperScroll.scrollHeight;
  }
  function updateCarriage(smooth) {
    var x = Math.round(480 - 228.8 - state.col * charw());
    refs.carriage.style.transition = reduced() ? 'none' : (smooth ? 'transform 0.26s cubic-bezier(0.22, 0.9, 0.3, 1)' : 'transform 0.05s linear');
    refs.carriage.style.transform = 'translateX(' + x + 'px)';
  }
  function doReturnFx() {
    sZip();
    doLeverVisual();
  }
  function doLeverVisual() {
    var lv = refs.lever;
    if (lv && !reduced()) {
      lv.style.animation = 'none';
      void lv.offsetWidth;
      lv.style.animation = 'tw-lever 0.42s ease-in-out';
    }
  }
  function strikeBar() {
    var tb = refs.typebar;
    if (!tb || reduced()) return;
    tb.style.animation = 'none';
    void tb.offsetWidth;
    tb.style.animation = 'tw-strike 0.15s ease-out';
  }
  function animateKey(ch) {
    if (reduced()) return;
    var key = String(ch).toLowerCase();
    if (!/^[a-z0-9 .,\-'"!?]$/.test(key)) return;
    var CHAR_TOKEN = { "'": 'apos', '"': 'quote' };
    var token = CHAR_TOKEN[key] || key;
    var sel = token === ' ' ? '[data-tkey=" "]' : '[data-tkey="' + token + '"]';
    var node = keyEls[token] || refs.scene.querySelector(sel);
    if (!node) return;
    keyEls[token] = node;
    node.style.transform = 'translateY(4px)';
    node.style.boxShadow = '0 1px 0 #241C10, 0 2px 3px rgba(40,30,15,0.3)';
    clearTimeout(node._t);
    node._t = setTimeout(function () { node.style.transform = ''; node.style.boxShadow = ''; }, 95);
  }
  function autoType(text, onDone) {
    clearInterval(typerI);
    state.autotyping = true;
    renderCaret();
    var i = 0;
    function step() {
      if (i >= text.length) {
        clearInterval(typerI);
        state.autotyping = false;
        renderCaret();
        if (onDone) onDone();
        return;
      }
      var ch = text[i++];
      var nv = state.value + ch;
      refs.ta.value = nv;
      handleValue(nv, ch);
      if (ch === '\n') {
        clearInterval(typerI);
        /* the pause must not resurrect a run the writer already interrupted */
        setTimeout(function () { if (state.autotyping) typerI = setInterval(step, 46 + Math.random() * 40); }, 300);
      }
    }
    typerI = setInterval(step, 46 + Math.random() * 40);
  }

  /* ---------- input plumbing ---------- */
  function onTaInput(e) {
    if (state.demoActive) state.demoActive = false;
    /* hardware keys land here mid-greeting; it's the writer's turn now,
       same as the on-screen key path in typeChar */
    if (state.autotyping) {
      clearInterval(typerI);
      state.autotyping = false;
      renderCaret();
    }
    handleValue(e.target.value, e.data != null ? e.data : null);
  }
  function onTaKeyDown(e) {
    lastKeydown = Date.now();
    ensureCtx();
    if (e.key && e.key.length === 1) animateKey(e.key);
    if (e.key === 'Enter') doLeverVisual();
  }
  function focusTa() {
    if (state.phase === 'writing' || state.phase === 'idle') refs.ta.focus({ preventScroll: true });
  }
  function typeChar(ch) {
    clearInterval(typerI);
    if (state.autotyping || state.demoActive) {
      state.autotyping = false;
      state.demoActive = false;
      renderCaret();
    }
    var nv = state.value + ch;
    refs.ta.value = nv;
    handleValue(nv, ch);
    focusTa();
  }

  /* ---------- flow ---------- */
  function startWriting(e) {
    if (e && e.preventDefault) e.preventDefault();
    introDone = true;
    setSetupStep(1);
    setTimeout(function () { scrollToEl(refs.heroWrap, 90); }, 30);
  }
  /* "Answer it forward." — the opening overlay hands lineage to the desk;
     sealNow carries it into the manifest + the README's "In answer to" line */
  function answerForward(ctx) {
    state.writeback = ctx || null;
    startWriting();
  }
  function setSetupStep(step) {
    state.setupStep = step;
    renderSetup();
    renderHero();
    if (step === 1) {
      setTimeout(function () { refs.setupTo.focus({ preventScroll: true }); }, 50);
    }
  }
  function skipSetup() {
    introDone = true;
    setSetupStep(null);
  }
  function confirmSetup() {
    if (!state.to.trim()) { setSetupStep(1); return; }
    setSetupStep(null);
    clearInterval(typerI);
    var keepText = !state.demoActive && state.value.trim().length > 0;
    var sheet = refs.sheet;
    ensureCtx(); sFeed();
    if (keepText) {
      state.phase = 'writing'; state.autotyping = false;
      renderHero(); renderSealSection(); renderCaret();
      if (sheet && !reduced()) {
        sheet.style.transition = 'none'; sheet.style.transform = 'translateY(40px)';
        void sheet.offsetWidth;
        sheet.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.3, 1)';
        sheet.style.transform = 'translateY(0)';
      }
      setTimeout(function () {
        scrollToEl(refs.sceneWrap, -20);
        /* phones: focus from a timer moves focus but iOS will not raise the
           keypad, leaving a dead caret; the tap hint invites the tap instead */
        if (!isMobile()) focusTa();
      }, 260);
      return;
    }
    state.phase = 'writing'; state.value = ''; state.lines = ['']; state.col = 0;
    state.autotyping = false; state.demoActive = false;
    refs.ta.value = '';
    belled = false;
    renderPaper(); renderHero(); renderSealSection(); renderCaret();
    if (sheet && !reduced()) {
      sheet.style.transition = 'none'; sheet.style.transform = 'translateY(150px)';
      void sheet.offsetWidth;
      sheet.style.transition = 'transform 0.55s cubic-bezier(0.2, 0.8, 0.3, 1)';
      sheet.style.transform = 'translateY(0)';
    }
    updateCarriage(true);
    setTimeout(function () {
      scrollToEl(refs.sceneWrap, -20);
      var greeting = shortDate(todayIso()) + '\n\nFor ' + state.to.trim() + ',\n\n';
      if (reduced()) {
        refs.ta.value = greeting;
        handleValue(greeting, null, true);
      } else {
        autoType(greeting);
      }
      /* same phone caveat as above: only desktops get the delayed focus */
      if (!isMobile()) setTimeout(focusTa, reduced() ? 100 : greeting.length * 60 + 900);
    }, 600);
  }
  function goSeal() {
    scrollToEl(document.getElementById('seal'), 30);
  }
  function sealNow() {
    var d = state;
    var validDate = /^\d{4}-\d{2}-\d{2}$/.test(d.openOn);
    var passMismatch = d.passphrase.length > 0 && d.passphrase !== d.passConfirm;
    if (d.sealing || !d.value.trim() || !d.fromWho.trim() || !(d.openWhenNeeded || validDate) || passMismatch) return;
    d.sealing = true;
    renderSealSection();
    var fields = {
      to: d.to.trim(),
      from: effectiveFrom(),
      writers: writersList(),
      written: todayIso(),
      openOn: d.openWhenNeeded ? todayIso() : d.openOn,
      occasion: d.occasion || 'custom',
      language: 'en',
      custody: d.custodyHolder.trim()
        ? [{ holder: d.custodyHolder.trim(), instructions: (d.custodyNote.trim() || 'Keep it safe; pass it on with its story.') }]
        : [],
      letter: d.value,
      openWhenNeeded: d.openWhenNeeded,
      writeback: d.writeback || null,
      passphrase: d.passphrase || '',
      hint: d.passHint.trim() || '',
      media: keepInterviewMedia()
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
        custodyHolder: d.custodyHolder.trim(),
        custodyNote: d.custodyNote.trim(),
        keptText: d.keepCopy ? d.value : null,
        status: 'sealed',
        sealKey: d.sealChoice || 'blue',
        role: 'writer'
      });
      state.sealed = sealed;
      state.freshId = sealed.fields.id;
      state.writeback = null;
      state.sealing = false;
      lastShelfKey = '';
      /* the letter is sealed: drop the saved draft and cancel any pending
         save so a late debounce cannot resurrect it (state.sealed also makes
         canSaveDraft() false from here on) */
      clearSavedDraft();
      TesseraExport.download(sealed);
      ensureCtx(); sDing(); tone(1568, 1.1, 0.18, 'sine', 0.12);
      renderSealSection();
      renderShelf();
      setTimeout(function () {
        scrollToEl(document.getElementById('seal'), 40);
      }, 80);
    }).catch(function (err) {
      state.sealing = false;
      renderSealSection();
      alert('Sealing failed: ' + err.message);
    });
  }
  function writeAnother() {
    clearSavedDraft();
    refs.ta.value = '';
    state.phase = 'idle'; state.value = ''; state.lines = ['']; state.col = 0;
    state.sealed = null; state.openOn = ''; state.openWhenNeeded = false;
    state.custodyHolder = ''; state.custodyNote = ''; state.keepCopy = false;
    state.coWrite = false; state.secondWriter = '';
    state.passphrase = ''; state.passConfirm = ''; state.passHint = '';
    state.deckAnswers = null; state.stitchedText = ''; state.ivIndex = 0; state.ivStitch = false; state.keepInterview = false;
    renderPaper(); renderCaret(); renderSealSection(); renderHero();
    setSetupStep(1);
    updateCarriage(false);
    setTimeout(function () { scrollToEl(refs.heroWrap, 90); }, 60);
  }

  /* ---------- the deck interview (in-memory writing aid; never persisted,
     never touches the sealed folder) ---------- */
  function currentDeck() {
    var occ = currentOcc();
    return (occ && occ.deck && occ.deck.length) ? occ.deck : null;
  }
  function openInterview() {
    var deck = currentDeck();
    if (!deck) return;
    if (!state.deckAnswers || state.deckAnswers.length !== deck.length) {
      var seeded = [];
      for (var i = 0; i < deck.length; i++) seeded.push(state.deckAnswers && state.deckAnswers[i] ? state.deckAnswers[i] : '');
      state.deckAnswers = seeded;
    }
    state.ivIndex = 0;
    state.ivStitch = false;
    if (refs.ivKeep) refs.ivKeep.checked = state.keepInterview;
    renderInterview();
  }
  function closeInterview() {
    state.ivStitch = false;
    refs.interviewOverlay.hidden = true;
  }
  function renderInterview() {
    var deck = currentDeck();
    if (!deck) { closeInterview(); return; }
    refs.interviewOverlay.hidden = false;
    refs.ivAsk.hidden = state.ivStitch;
    refs.ivStitch.hidden = !state.ivStitch;
    if (state.ivStitch) { refs.ivPut.focus({ preventScroll: true }); return; }
    var i = state.ivIndex;
    refs.ivProgress.textContent = (i + 1) + ' of ' + deck.length;
    refs.ivQ.textContent = deck[i].q;
    refs.ivAnswer.value = state.deckAnswers[i] || '';
    refs.ivBack.style.visibility = i === 0 ? 'hidden' : 'visible';
    refs.ivNext.textContent = (i === deck.length - 1) ? 'Last one →' : 'Next →';
    refs.ivAnswer.focus({ preventScroll: true });
  }
  function ivGoNext() {
    var deck = currentDeck();
    if (!deck) return;
    if (state.ivIndex < deck.length - 1) { state.ivIndex++; renderInterview(); }
    else { state.ivStitch = true; renderInterview(); }
  }
  function ivGoBack() {
    var deck = currentDeck();
    if (!deck) return;
    if (state.ivStitch) { state.ivStitch = false; renderInterview(); }
    else if (state.ivIndex > 0) { state.ivIndex--; renderInterview(); }
  }
  function stitchIntoLetter() {
    var answers = state.deckAnswers || [];
    var kept = [];
    for (var i = 0; i < answers.length; i++) if (answers[i] && answers[i].trim()) kept.push(answers[i].trim());
    var stitched = kept.join('\n\n');
    state.stitchedText = stitched;
    /* mirror the greeting-set path in confirmSetup: assign the textarea, then
       route through handleValue so caret, wrap, and draft state stay in sync */
    refs.ta.value = stitched;
    handleValue(stitched, null, true);
    closeInterview();
    focusTa();
    scrollToEl(refs.sceneWrap, -20);
  }
  /* the raw interview as a keepsake file (opt-in, media/interview.txt): each
     answered question and its answer, so a finder sees the questions the
     letter grew from. In-memory answers only, built at seal time. */
  function interviewText() {
    var deck = currentDeck() || [];
    var out = [];
    for (var i = 0; i < deck.length; i++) {
      var a = (state.deckAnswers && state.deckAnswers[i] || '').trim();
      if (a) out.push(deck[i].q + '\n' + a);
    }
    return out.join('\n\n') + '\n';
  }
  function keepInterviewMedia() {
    if (!state.keepInterview || !state.deckAnswers) return null;
    var any = false;
    for (var i = 0; i < state.deckAnswers.length; i++) if (state.deckAnswers[i] && state.deckAnswers[i].trim()) { any = true; break; }
    if (!any) return null;
    return [{ name: 'media/interview.txt', data: interviewText(), note: 'the interview answers, before they were made into the letter' }];
  }

  /* ---------- the milestone series wizard ----------
     A whole ladder of letters in one sitting: shared to/from/custody, one
     anchor date, N per-rung letters. Each rung seals through the ONE seal
     path (TesseraExport.seal) and downloads as its own self-contained zip —
     there is no batch seal. Progress persists to its own draft slot; the
     passphrase is never involved (a series is not encrypted here). */
  var SERIES_SLOT = 'series';
  var seriesTimer = null;

  function seriesRungsFrom(occ) {
    return occ.series.rungs.map(function (r) {
      return {
        years: r.years, title: r.title,
        prompts: (r.prompts && r.prompts.length) ? r.prompts : (occ.prompts || []),
        openOn: '', text: ''
      };
    });
  }
  function seriesSnapshot() {
    var s = state.series;
    return {
      occ: s.occ, to: s.to, from: s.from,
      custodyHolder: s.custodyHolder, custodyNote: s.custodyNote,
      anchor: s.anchor, phase: s.phase, index: s.index,
      rungs: s.rungs.map(function (r) {
        return { years: r.years, title: r.title, openOn: r.openOn, text: r.text };
      })
    };
  }
  function canSaveSeries() {
    return !!window.TesseraState && !!state.series && state.series.phase !== 'done' && !state.series.sealing;
  }
  function saveSeriesNow() { if (canSaveSeries()) TesseraState.setDraft(SERIES_SLOT, seriesSnapshot()); }
  function scheduleSeriesSave() {
    if (!canSaveSeries()) return;
    if (seriesTimer) clearTimeout(seriesTimer);
    seriesTimer = setTimeout(function () { seriesTimer = null; saveSeriesNow(); }, 600);
  }
  function clearSeriesDraft() {
    if (seriesTimer) { clearTimeout(seriesTimer); seriesTimer = null; }
    if (window.TesseraState) TesseraState.clearDraft(SERIES_SLOT);
  }
  function hasResumableSeries() {
    if (!window.TesseraState) return false;
    var d = TesseraState.getDraft(SERIES_SLOT);
    if (!d || !d.occ) return false;
    var occ = bySlug(d.occ);
    if (!occ || !occ.series) return false;
    for (var i = 0; d.rungs && i < d.rungs.length; i++) if (d.rungs[i].text && d.rungs[i].text.trim()) return true;
    return !!(d.anchor || d.from);
  }

  function openSeriesWizard() {
    var occ = currentOcc();
    if (!occ || !occ.series || !state.to.trim()) return;
    setSetupStep(null);
    state.series = {
      occ: occ.slug, to: state.to.trim(), from: state.fromWho || '',
      custodyHolder: '', custodyNote: '',
      anchorQ: occ.series.anchor || 'From what date?', anchor: '',
      rungs: seriesRungsFrom(occ),
      phase: 'setup', index: 0, sealing: false, done: []
    };
    renderSeries();
  }
  function closeSeriesWizard() {
    var s = state.series;
    if (s) {
      if (s.phase === 'done') clearSeriesDraft();
      else saveSeriesNow();
    }
    state.series = null;
    refs.seriesOverlay.hidden = true;
    renderShelf();
  }
  function restoreSeriesWizard() {
    if (!hasResumableSeries()) return false;
    var d = TesseraState.getDraft(SERIES_SLOT);
    var occ = bySlug(d.occ);
    var rungs = seriesRungsFrom(occ); /* fresh prompts from data */
    for (var i = 0; i < rungs.length && d.rungs && i < d.rungs.length; i++) {
      rungs[i].openOn = d.rungs[i].openOn || '';
      rungs[i].text = d.rungs[i].text || '';
    }
    state.series = {
      occ: d.occ, to: d.to || state.to || '', from: d.from || '',
      custodyHolder: d.custodyHolder || '', custodyNote: d.custodyNote || '',
      anchorQ: occ.series.anchor || 'From what date?', anchor: d.anchor || '',
      rungs: rungs, phase: (d.phase && d.phase !== 'done') ? d.phase : 'setup',
      index: d.index || 0, sealing: false, done: []
    };
    if (state.series.index >= rungs.length) state.series.index = 0;
    renderSeries();
    return true;
  }

  function recomputeRungDates() {
    var s = state.series;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.anchor)) return;
    for (var i = 0; i < s.rungs.length; i++) s.rungs[i].openOn = plusYears(s.anchor, s.rungs[i].years);
  }
  function seriesSortRungs() {
    state.series.rungs.sort(function (a, b) { return a.openOn < b.openOn ? -1 : a.openOn > b.openOn ? 1 : 0; });
  }
  function seriesDatesReady() {
    var s = state.series;
    if (!s.rungs.length) return false;
    for (var i = 0; i < s.rungs.length; i++) if (!/^\d{4}-\d{2}-\d{2}$/.test(s.rungs[i].openOn)) return false;
    return true;
  }
  function seriesReady() { return !!state.series.from.trim() && seriesDatesReady(); }
  function seriesRefreshReady() {
    var ready = seriesReady();
    refs.swBegin.disabled = !ready;
    refs.swBegin.style.opacity = ready ? 1 : 0.45;
    refs.swSetupHint.textContent = ready
      ? 'Set the date once; each letter’s open date fills in from it, and you can nudge any of them.'
      : 'Add the date each letter should open, and who they are from.';
  }

  function renderSeries() {
    var s = state.series;
    refs.seriesOverlay.hidden = !s;
    if (!s) return;
    refs.swSetup.hidden = s.phase !== 'setup';
    refs.swWrite.hidden = s.phase !== 'write';
    refs.swSeal.hidden = s.phase !== 'seal';
    refs.swDone.hidden = s.phase !== 'done';
    if (s.phase === 'setup') renderSeriesSetup();
    else if (s.phase === 'write') renderSeriesWrite();
    else if (s.phase === 'seal') renderSeriesSeal();
    else if (s.phase === 'done') renderSeriesDone();
  }
  function renderSeriesSetup() {
    var s = state.series, occ = bySlug(s.occ);
    refs.swSetupTitle.textContent = occ.title;
    refs.swSetupCopy.textContent = 'A letter for ' + (s.to || 'them') + ' at each step, all in one sitting.';
    refs.swAnchorQ.textContent = s.anchorQ;
    if (refs.swAnchor.value !== s.anchor) refs.swAnchor.value = s.anchor;
    if (refs.swFrom.value !== s.from) refs.swFrom.value = s.from;
    var holder = refs.swRungs, today = todayIso();
    while (holder.firstChild) holder.removeChild(holder.firstChild);
    for (var i = 0; i < s.rungs.length; i++) {
      (function (idx) {
        var r = s.rungs[idx];
        var row = el('div', 'sw-rung' + (r.openOn && r.openOn <= today ? ' sw-rung--past' : ''));
        row.appendChild(el('span', 'sw-rung-name', r.title));
        var date = el('input', 'setup-input sw-date');
        date.type = 'date'; date.value = r.openOn || '';
        date.addEventListener('input', function (e) {
          s.rungs[idx].openOn = e.target.value;
          row.classList.toggle('sw-rung--past', !!e.target.value && e.target.value <= todayIso());
          scheduleSeriesSave();
          seriesRefreshReady();
        });
        row.appendChild(date);
        if (s.rungs.length > 1) {
          var drop = el('button', 'sw-rung-drop', '×');
          drop.title = 'Remove this letter';
          drop.addEventListener('click', function () {
            s.rungs.splice(idx, 1);
            if (s.index >= s.rungs.length) s.index = s.rungs.length - 1;
            scheduleSeriesSave();
            renderSeriesSetup();
          });
          row.appendChild(drop);
        }
        holder.appendChild(row);
      })(i);
    }
    seriesRefreshReady();
  }
  function renderSeriesWrite() {
    var s = state.series, r = s.rungs[s.index];
    if (!r) { s.phase = 'seal'; renderSeries(); return; }
    var lad = refs.swLadder;
    while (lad.firstChild) lad.removeChild(lad.firstChild);
    for (var i = 0; i < s.rungs.length; i++) {
      var written = s.rungs[i].text && s.rungs[i].text.trim();
      var cls = 'sw-rung-item' + (i === s.index ? ' sw-rung-item--current' : (written ? ' sw-rung-item--done' : ''));
      var item = el('div', cls);
      item.appendChild(document.createTextNode(s.rungs[i].title));
      item.appendChild(el('small', null, shortDate(s.rungs[i].openOn) || '—'));
      lad.appendChild(item);
    }
    refs.swWriteProgress.textContent = 'Letter ' + (s.index + 1) + ' of ' + s.rungs.length;
    refs.swRungTitle.textContent = s.to + ', ' + r.title;
    refs.swRungWhen.textContent = r.openOn ? 'Opens ' + dateInWords(r.openOn) + '.' : '';
    var pr = refs.swPrompts;
    while (pr.firstChild) pr.removeChild(pr.firstChild);
    for (var p = 0; p < r.prompts.length; p++) pr.appendChild(el('p', null, r.prompts[p]));
    if (refs.swText.value !== (r.text || '')) refs.swText.value = r.text || '';
    refs.swPrev.textContent = s.index === 0 ? '← Set-up' : '← Previous';
    refs.swNext.textContent = (s.index === s.rungs.length - 1) ? 'Review & seal →' : 'Next letter →';
    if (!isMobile()) setTimeout(function () { refs.swText.focus({ preventScroll: true }); }, 30);
  }
  function swGoNext() {
    var s = state.series;
    if (s.index < s.rungs.length - 1) s.index++;
    else s.phase = 'seal';
    scheduleSeriesSave();
    renderSeries();
  }
  function swGoPrev() {
    var s = state.series;
    if (s.index > 0) s.index--;
    else s.phase = 'setup';
    scheduleSeriesSave();
    renderSeries();
  }
  function renderSeriesSeal() {
    var s = state.series;
    if (refs.swCustody.value !== s.custodyHolder) refs.swCustody.value = s.custodyHolder;
    var holder = refs.swSummary, written = 0;
    while (holder.firstChild) holder.removeChild(holder.firstChild);
    for (var i = 0; i < s.rungs.length; i++) {
      var r = s.rungs[i];
      var row = el('div', 'sw-summary-row');
      row.appendChild(el('span', null, s.to + ', ' + r.title));
      row.appendChild(el('span', 'sw-sum-when', shortDate(r.openOn)));
      holder.appendChild(row);
      if (r.text && r.text.trim()) written++;
    }
    var ready = !s.sealing && written === s.rungs.length && seriesReady();
    refs.swSealGo.disabled = !ready;
    refs.swSealGo.style.opacity = ready ? 1 : 0.45;
    refs.swSealGo.textContent = s.sealing ? 'Sealing…' : ('Seal all ' + s.rungs.length + ' of them →');
    refs.swSealHint.textContent = s.sealing ? 'One folder downloads for each letter.'
      : (written < s.rungs.length ? ((s.rungs.length - written) + ' of the letters are still empty. Fill or remove them first.') : '');
  }
  function sealSeries() {
    var s = state.series;
    if (s.sealing) return;
    var written = 0, i;
    for (i = 0; i < s.rungs.length; i++) if (s.rungs[i].text && s.rungs[i].text.trim()) written++;
    if (written !== s.rungs.length || !seriesReady()) return;
    s.sealing = true;
    renderSeriesSeal();
    var custody = s.custodyHolder.trim()
      ? [{ holder: s.custodyHolder.trim(), instructions: 'Keep it safe; pass it on with its story.' }]
      : [];
    /* chronological order, one at a time (each download fires after its seal;
       a small gap keeps browsers from collapsing rapid multi-file downloads) */
    var order = s.rungs.slice().sort(function (a, b) { return a.openOn < b.openOn ? -1 : a.openOn > b.openOn ? 1 : 0; });
    var sealedList = [];
    var chain = Promise.resolve();
    order.forEach(function (r, k) {
      chain = chain.then(function () {
        var fields = {
          to: s.to, from: s.from.trim(), written: todayIso(),
          openOn: r.openOn, occasion: s.occ, language: 'en',
          custody: custody, letter: r.text, openWhenNeeded: false,
          writeback: null, passphrase: '', hint: '', media: null
        };
        return TesseraExport.seal(fields).then(function (sealed) {
          TesseraState.addRegistryEntry({
            id: sealed.fields.id, to: sealed.fields.to, from: sealed.fields.from,
            written: sealed.fields.written, openOn: sealed.fields.openOn,
            openWhenNeeded: false, occasion: sealed.fields.occasion,
            custodyHolder: s.custodyHolder.trim(), custodyNote: '',
            keptText: null, status: 'sealed', sealKey: 'blue', role: 'writer'
          });
          TesseraExport.download(sealed);
          sealedList.push(sealed);
          if (k < order.length - 1) return new Promise(function (res) { setTimeout(res, 350); });
        });
      });
    });
    chain.then(function () {
      s.sealing = false;
      s.done = sealedList;
      s.phase = 'done';
      clearSeriesDraft();
      lastShelfKey = '';
      renderShelf();
      renderSeries();
      ensureCtx(); sDing();
    }).catch(function (err) {
      s.sealing = false;
      renderSeriesSeal();
      alert('Sealing the ladder failed: ' + err.message);
    });
  }
  function renderSeriesDone() {
    var s = state.series;
    refs.swDoneTitle.textContent = s.done.length + (s.done.length === 1 ? ' letter, sealed.' : ' letters, sealed.');
    var holder = refs.swDoneList;
    while (holder.firstChild) holder.removeChild(holder.firstChild);
    for (var i = 0; i < s.done.length; i++) {
      var f = s.done[i].fields;
      var row = el('div', 'sw-summary-row');
      row.appendChild(el('span', null, f.to));
      row.appendChild(el('span', 'mono', f.id));
      row.appendChild(el('span', 'sw-sum-when', 'opens ' + shortDate(f.openOn)));
      holder.appendChild(row);
    }
  }

  /* drop a labelled turn ("Maria:") at the end of the letter, then re-sync
     caret/wrap/draft exactly like the stitch path */
  function insertTurn(name) {
    var cur = state.value;
    var sep = !cur ? '' : (/\n\n$/.test(cur) ? '' : (/\n$/.test(cur) ? '\n' : '\n\n'));
    var next = cur + sep + name + ':\n';
    refs.ta.value = next;
    handleValue(next, null, true);
    focusTa();
  }

  /* ---------- render: hero + writing bar ---------- */
  function hasLetter() { return state.phase === 'writing' && state.value.trim().length > 0; }

  function renderHero() {
    var writing = state.phase === 'writing';
    refs.heroIdle.hidden = writing;
    refs.heroWriting.hidden = !writing;
    refs.reopenRow.hidden = !(state.phase === 'idle' && state.setupStep === null);
    renderWriting();
  }
  function renderWriting() {
    var occ = currentOcc();
    var customLabel = (state.customOccasion || '').trim();
    var letter = hasLetter();
    refs.finishRow.hidden = !letter;
    if (state.phase !== 'writing') return;
    refs.hwTo.textContent = state.to;
    var hasOcc = !!occ && (occ.group !== 'custom' || !!customLabel);
    refs.hwOccasion.hidden = !hasOcc;
    if (hasOcc) {
      refs.hwOccasion.textContent = (occ.group === 'custom') ? (customLabel || occ.title) : occ.title;
      refs.hwOccasion.style.background = GROUP_TINT[occ.group] || '#E4E9EA';
    }
    var words = state.value.trim() ? state.value.trim().split(/\s+/).length : 0;
    refs.hwWordline.textContent = words
      ? words + (words === 1 ? ' word' : ' words') + ', taking their time'
      : 'the page is listening';
    var prompts = occ ? occ.prompts : [];
    refs.hwPromptsToggle.hidden = !(occ && prompts.length);
    refs.hwDeck.hidden = !currentDeck();
    /* co-written: quiet buttons to drop a labelled turn into the letter
       (the "alternating" mode; merged is just writing normally) */
    var co = bothWriters();
    refs.hwTurns.hidden = !co;
    if (co) {
      while (refs.hwTurns.firstChild) refs.hwTurns.removeChild(refs.hwTurns.firstChild);
      [state.fromWho.trim(), state.secondWriter.trim()].forEach(function (nm) {
        var b = el('button', null, nm + '’s turn');
        b.addEventListener('click', function () { insertTurn(nm); });
        refs.hwTurns.appendChild(b);
      });
    }
    if (occ && prompts.length) refs.hwPromptsToggle.textContent = state.showPrompts ? 'hide prompts' : 'show prompts';
    var showPrompts = state.showPrompts && !!occ && prompts.length > 0;
    refs.hwPrompts.hidden = !showPrompts;
    if (showPrompts) {
      while (refs.hwPrompts.firstChild) refs.hwPrompts.removeChild(refs.hwPrompts.firstChild);
      for (var i = 0; i < prompts.length; i++) refs.hwPrompts.appendChild(el('p', null, prompts[i]));
    }
    refs.hwSeal.disabled = !letter;
    refs.hwSeal.style.opacity = letter ? 1 : 0.45;
  }
  function renderCaret() {
    refs.caret.hidden = !(state.focused || state.autotyping);
    refs.tapHint.hidden = !(isMobile() && state.phase === 'writing' && !state.focused && !state.autotyping);
  }
  function renderSound() {
    refs.soundToggle.textContent = soundOn() ? 'Bell & keys: on' : 'Bell & keys: off';
    refs.soundToggle.setAttribute('aria-pressed', String(soundOn()));
  }

  /* ---------- quiet reveals (skipped entirely under reduced motion) ---------- */
  function armReveals() {
    if (reduced() || !window.IntersectionObserver) return;
    var els = document.querySelectorAll('.how-card, .about-card, .token-inner > div');
    var io = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) {
          entries[k].target.classList.add('is-in');
          io.unobserve(entries[k].target);
        }
      }
    }, { threshold: 0.15 });
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('reveal');
      if (els[i].classList.contains('how-card')) els[i].style.transitionDelay = (i % 3) * 70 + 'ms';
      io.observe(els[i]);
    }
  }
  function renderSwatches() {
    var holder = refs.mcSwatches;
    while (holder.firstChild) holder.removeChild(holder.firstChild);
    for (var i = 0; i < MACHINE_COLORS.length; i++) {
      (function (hex) {
        var b = el('button', 'mc-dot' + (machineColor() === hex ? ' mc-dot--active' : ''));
        b.title = hex;
        b.style.background = hex;
        if (machineColor() === hex) b.appendChild(el('span', null, '✓'));
        b.addEventListener('click', function () {
          state.machineColorU = hex;
          applyMachineColor();
          renderSwatches();
        });
        holder.appendChild(b);
      })(MACHINE_COLORS[i]);
    }
  }

  /* ---------- render: setup wizard ---------- */
  function renderSetup() {
    var step = state.setupStep;
    refs.setupOverlay.hidden = step === null;
    refs.setup0.hidden = step !== 0;
    refs.setup1.hidden = step !== 1;
    refs.setup2.hidden = step !== 2;
    if (refs.setupTo.value !== state.to) refs.setupTo.value = state.to;
    refs.setupNext.disabled = !state.to.trim();
    refs.setupNext.style.opacity = state.to.trim() ? 1 : 0.45;
    refs.setupOcc.value = state.occasion || '';
    refs.setupCustom.hidden = state.occasion !== 'custom';
    if (refs.setupCustom.value !== state.customOccasion) refs.setupCustom.value = state.customOccasion;
    var occ = currentOcc();
    refs.setupSeries.hidden = !(step === 2 && occ && occ.series);
  }
  function buildOccasionSelect() {
    var groupsDef = [['For a hard day', 'open-when'], ['For a milestone', 'milestone'], ['For the far future', 'far'], ['Or something else', 'custom']];
    var list = occs();
    for (var g = 0; g < groupsDef.length; g++) {
      var items = [];
      for (var i = 0; i < list.length; i++) if (list[i].group === groupsDef[g][1]) items.push(list[i]);
      if (!items.length) continue;
      var og = document.createElement('optgroup');
      og.label = groupsDef[g][0];
      for (var j = 0; j < items.length; j++) {
        var opt = document.createElement('option');
        opt.value = items[j].slug;
        opt.textContent = items[j].title || 'Something else';
        og.appendChild(opt);
      }
      refs.setupOcc.appendChild(og);
    }
  }

  /* ---------- render: seal section ---------- */
  function renderSealSection() {
    var letter = hasLetter();
    refs.sealEmpty.hidden = !(!letter && !state.sealed);
    refs.sealSteps.hidden = !(letter && !state.sealed);
    refs.sealDone.hidden = !state.sealed;

    if (letter && !state.sealed) {
      if (refs.openDate.value !== state.openOn) refs.openDate.value = state.openOn;
      var occ = currentOcc();
      refs.undatedRow.hidden = !(occ && occ.canBeUndated);
      refs.undated.checked = state.openWhenNeeded;
      var validDate = /^\d{4}-\d{2}-\d{2}$/.test(state.openOn);
      refs.dateWords.textContent = state.openWhenNeeded
        ? 'It opens when it’s needed. The title on the envelope decides.'
        : (validDate ? 'It opens ' + dateInWords(state.openOn) + '.' : '');
      if (refs.fromWho.value !== state.fromWho) refs.fromWho.value = state.fromWho;
      refs.cowriteToggle.checked = state.coWrite;
      refs.cowriteSecond.hidden = !state.coWrite;
      refs.cowriteHelper.hidden = !state.coWrite;
      if (refs.cowriteSecond.value !== state.secondWriter) refs.cowriteSecond.value = state.secondWriter;
      if (refs.custodyHolder.value !== state.custodyHolder) refs.custodyHolder.value = state.custodyHolder;
      if (refs.custodyNote.value !== state.custodyNote) refs.custodyNote.value = state.custodyNote;
      if (refs.passPhrase.value !== state.passphrase) refs.passPhrase.value = state.passphrase;
      if (refs.passConfirm.value !== state.passConfirm) refs.passConfirm.value = state.passConfirm;
      if (refs.passHint.value !== state.passHint) refs.passHint.value = state.passHint;

      var meta = sealMeta(state.sealChoice);
      refs.sealPickImg.src = meta.src;
      refs.sealPickLabel.textContent = meta.label;
      refs.sealPickCaret.textContent = state.sealPickerOpen ? '▴' : '▾';
      refs.sealGridSwatches.hidden = !state.sealPickerOpen;
      var swatches = refs.sealGridSwatches.children;
      for (var i = 0; i < swatches.length; i++) {
        swatches[i].classList.toggle('seal-swatch--active', swatches[i].getAttribute('data-seal') === state.sealChoice);
      }

      refs.pvTo.textContent = state.to;
      refs.pvFrom.textContent = effectiveFrom() || '—';
      refs.pvOpens.textContent = state.openWhenNeeded ? 'when it’s needed' : (validDate ? dateInWords(state.openOn) : '—');
      refs.pvKept.textContent = state.custodyHolder.trim() || 'you';
      refs.pvText.textContent = state.value;
      /* advisory only: the stitched answers are still the questions' words
         until the writer edits them. Never blocks sealing. */
      refs.deckNote.hidden = !(state.stitchedText && state.value === state.stitchedText);
      refs.keepCopy.checked = state.keepCopy;
      /* a passphrase must be confirmed before it can lock a letter. A mistyped
         passphrase is a lost letter, so we never seal on an unconfirmed one */
      var passMismatch = state.passphrase.length > 0 && state.passphrase !== state.passConfirm;
      var canSeal = !state.sealing && state.value.trim().length > 0 && state.fromWho.trim().length > 0 && (state.openWhenNeeded || validDate) && !passMismatch;
      refs.sealLetterBtn.disabled = !canSeal;
      refs.sealLetterBtn.style.opacity = canSeal ? 1 : 0.45;
      refs.sealLetterBtn.textContent = state.sealing ? 'Sealing…' : 'Seal the letter';
      refs.sealHint.textContent = (canSeal || state.sealing) ? ''
        : passMismatch ? 'The two passphrases do not match yet.'
        : 'A date (or “when it’s needed”) and a sender make it sealable.';
    }

    if (state.sealed) {
      refs.sealedToken.innerHTML = state.sealed.token.full; /* SVG from js/token.js */
      refs.sealedId.textContent = state.sealed.fields.id;
      refs.sealedTo.textContent = state.sealed.fields.to;
      refs.sealedOpens.textContent = state.sealed.fields.openWhenNeeded ? 'when it’s needed' : dateInWords(state.sealed.fields.openOn);
      var cal = document.getElementById('sealed-calendar');
      if (cal) cal.hidden = !!state.sealed.fields.openWhenNeeded; /* no date, no calendar */
      if (refs.sealedKeycard) refs.sealedKeycard.hidden = !state.sealed.encrypted;
    }
  }
  function buildDateChips() {
    var quick = [
      { label: 'in one year', y: 1 }, { label: 'in five years', y: 5 },
      { label: 'in ten years', y: 10 }, { label: 'in twenty-five years', y: 25 }
    ];
    for (var i = 0; i < quick.length; i++) {
      (function (q) {
        var b = el('button', 'date-chip', q.label);
        b.addEventListener('click', function () {
          state.openWhenNeeded = false;
          state.openOn = plusYears(todayIso(), q.y);
          renderSealSection();
        });
        refs.dateChips.appendChild(b);
      })(quick[i]);
    }
    var sol = el('button', 'date-chip', 'on the winter solstice');
    sol.addEventListener('click', function () {
      var t = todayIso(), y = parseInt(t.slice(0, 4), 10);
      var d = y + '-12-21';
      state.openWhenNeeded = false;
      state.openOn = t < d ? d : (y + 1) + '-12-21';
      renderSealSection();
    });
    refs.dateChips.appendChild(sol);
  }
  function buildSealSwatches() {
    for (var i = 0; i < SEAL_LIB.length; i++) {
      (function (opt) {
        var b = el('button', 'seal-swatch');
        b.title = opt.label;
        b.setAttribute('data-seal', opt.key);
        var img = document.createElement('img');
        img.src = opt.src;
        img.alt = opt.label;
        b.appendChild(img);
        b.addEventListener('click', function () {
          state.sealChoice = opt.key;
          state.sealPickerOpen = false;
          renderSealSection();
        });
        refs.sealGridSwatches.appendChild(b);
      })(SEAL_LIB[i]);
    }
  }

  /* ---------- render: token story ---------- */
  function paintStoryToken() {
    if (storyPainted || !window.TesseraToken) return;
    storyPainted = true;
    var t = TesseraToken.renderTokenSvg(STORY_SEED, 'TSR-7c1e-9906');
    var left = el('div', 'token-half token-half--l');
    left.innerHTML = t.left;
    var cut = el('div', 'token-cut');
    var right = el('div', 'token-half token-half--r');
    right.innerHTML = t.right;
    refs.storyToken.appendChild(left);
    refs.storyToken.appendChild(cut);
    refs.storyToken.appendChild(right);
  }

  /* ---------- render: the shelf ---------- */
  function shelfLetters() {
    var all = window.TesseraState ? TesseraState.getRegistry().slice().reverse() : [];
    var out = [];
    for (var i = 0; i < all.length; i++) {
      var l = all[i];
      var g = bySlug(l.occasion || 'custom').group || 'custom';
      var sealKey = l.sealKey || SEAL_LIB[i % SEAL_LIB.length].key;
      var kept = l.role === 'custodian';
      var opensText = l.openWhenNeeded ? 'opens when needed' : 'opens ' + shortDate(l.openOn);
      out.push({
        to: l.to,
        opens: kept ? 'in your keeping · ' + opensText : opensText,
        id: l.id,
        kept: kept,
        rot: SHELF_ROTS[i % SHELF_ROTS.length],
        tint: GROUP_TINT[g] || GROUP_TINT.custom,
        tintDeep: GROUP_DEEP[g] || GROUP_DEEP.custom,
        sealSrc: sealMeta(sealKey).src,
        title: (kept ? 'In your keeping (unopened) · for ' : 'For ') + l.to + ' · ' + (l.openWhenNeeded ? 'opens when it’s needed' : 'opens ' + dateInWords(l.openOn)) + ' · ' + l.id + (l.id === state.freshId ? ' · sealed today' : '')
      });
    }
    return out;
  }
  function envCard(lt, compact) {
    var card = el('div', compact ? 'pigeon-card' : 'env-card');
    if (lt.kept) card.className += ' env-card--kept';
    card.title = lt.title;
    card.setAttribute('data-letter-id', lt.id);
    if (!compact) card.style.transform = 'rotate(' + lt.rot + 'deg)';
    var flap = el('div', 'env-flap');
    flap.style.background = lt.tint;
    card.appendChild(flap);
    var seal = document.createElement('img');
    seal.className = 'env-seal';
    seal.src = lt.sealSrc;
    seal.alt = '';
    card.appendChild(seal);
    if (!compact) {
      var stamp = el('div', 'env-stamp');
      var dot = el('span');
      dot.style.background = lt.tintDeep;
      stamp.appendChild(dot);
      card.appendChild(stamp);
    }
    card.appendChild(el('div', 'env-to', lt.to));
    var foot = el('div', 'env-foot');
    foot.appendChild(el('span', null, lt.opens));
    foot.appendChild(el('span', 'env-id', lt.id));
    card.appendChild(foot);
    return card;
  }
  /* ---------- render: the letter ladder ---------- */
  var MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;
  function isoToMs(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return NaN;
    return Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  }
  function yearsWords(n) {
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
  /* waiting = dated entries opening strictly after today; undated (open-when-
     needed) letters have no date to place and are excluded from the axis. */
  function waitingLetters() {
    var all = window.TesseraState ? TesseraState.getRegistry() : [];
    var today = todayIso(), out = [], undatedCount = 0;
    for (var i = 0; i < all.length; i++) {
      var l = all[i];
      if (l.openWhenNeeded) { undatedCount++; continue; }
      if (!l.openOn || l.openOn <= today) continue;
      out.push(l);
    }
    return { waiting: out, undatedCount: undatedCount, today: today };
  }
  function renderLadder() {
    var data = waitingLetters();
    var waiting = data.waiting;
    while (refs.letterLadder.firstChild) refs.letterLadder.removeChild(refs.letterLadder.firstChild);
    if (!waiting.length) { refs.letterLadder.hidden = true; return; }
    refs.letterLadder.hidden = false;

    var todayMs = isoToMs(data.today);
    var W = 640, H = 100, leftPad = 40, rightPad = 60, axisY = 48, axisWidth = W - leftPad - rightPad;
    var years = [], maxYears = 0;
    for (var i = 0; i < waiting.length; i++) {
      var y = (isoToMs(waiting[i].openOn) - todayMs) / MS_PER_YEAR;
      years.push(y);
      if (y > maxYears) maxYears = y;
    }
    if (maxYears <= 0) maxYears = 1 / 365.25; /* guard: never divide by zero */
    function xFor(y) { return leftPad + (Math.sqrt(Math.max(y, 0)) / Math.sqrt(maxYears)) * axisWidth; }

    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ladder-svg', role: 'img', 'aria-label': 'A timeline of letters waiting to be opened.' });
    svg.appendChild(svgEl('line', { class: 'ladder-axis', x1: leftPad, y1: axisY, x2: W - rightPad, y2: axisY }));
    svg.appendChild(svgEl('text', { class: 'ladder-now', x: leftPad, y: axisY - 12, 'text-anchor': 'middle' })).textContent = 'now';

    /* decade ticks at 10/25/50/100 years, plus the furthest letter's own
       year if it doesn't already sit near one of those */
    var STANDARD = [10, 25, 50, 100];
    var ticks = [];
    for (var s = 0; s < STANDARD.length; s++) if (STANDARD[s] <= maxYears) ticks.push(STANDARD[s]);
    var nearFinal = false;
    for (var tchk = 0; tchk < ticks.length; tchk++) {
      if (Math.abs(ticks[tchk] - maxYears) <= Math.max(1, maxYears * 0.06)) nearFinal = true;
    }
    if (!nearFinal) ticks.push(maxYears);
    for (var ti = 0; ti < ticks.length; ti++) {
      var tYears = ticks[ti];
      var tx = xFor(tYears);
      var isMinor = (tYears === 25);
      svg.appendChild(svgEl('line', { class: 'ladder-tick', x1: tx, y1: axisY - 6, x2: tx, y2: axisY + 6 }));
      var tanchor = tx > W - 56 ? 'end' : (tx < 56 ? 'start' : 'middle');
      var label = svgEl('text', { class: 'ladder-tick-label' + (isMinor ? ' ladder-tick-label--minor' : ''), x: tx, y: axisY + 22, 'text-anchor': tanchor });
      label.textContent = yearsWords(Math.round(tYears));
      svg.appendChild(label);
    }

    /* marks: one hairline ring per waiting letter, tinted by occasion group,
       staggered a little if two land close together */
    var lastX = null, stagger = 1;
    for (var wi = 0; wi < waiting.length; wi++) {
      var lt = waiting[wi];
      var mx = xFor(years[wi]);
      var dy = 0;
      if (lastX !== null && Math.abs(mx - lastX) < 8) { dy = stagger * 7; stagger = -stagger; }
      else stagger = 1;
      lastX = mx;
      var g = bySlug(lt.occasion || 'custom').group || 'custom';
      var mark = svgEl('circle', {
        class: 'ladder-mark', cx: mx, cy: axisY + dy, r: 5,
        stroke: GROUP_TINT[g] || GROUP_TINT.custom,
        'data-letter-id': lt.id
      });
      var title = svgEl('title', {});
      title.textContent = 'for ' + lt.to + ' · opens ' + dateInWords(lt.openOn) + ' · ' + lt.id;
      mark.appendChild(title);
      mark.addEventListener('mouseenter', function (id) {
        return function () {
          var cards = document.querySelectorAll('[data-letter-id="' + id + '"]');
          for (var c = 0; c < cards.length; c++) cards[c].classList.add('ladder-hi');
        };
      }(lt.id));
      mark.addEventListener('mouseleave', function (id) {
        return function () {
          var cards = document.querySelectorAll('[data-letter-id="' + id + '"]');
          for (var c = 0; c < cards.length; c++) cards[c].classList.remove('ladder-hi');
        };
      }(lt.id));
      svg.appendChild(mark);
    }
    refs.letterLadder.appendChild(svg);
    if (data.undatedCount > 0) {
      var note = el('p', 'ladder-note', 'and ' + data.undatedCount + (data.undatedCount === 1 ? ' kept for when it’s needed' : ' kept for when they’re needed'));
      refs.letterLadder.appendChild(note);
    }
  }
  /* ---------- the booklet composer ----------
     Bind kept letters into a home-bindable booklet. Only letters whose text
     was kept (keptText) can be bound; the rest are listed but disabled. This
     chunk composes the logical page model + preview; the imposed printable
     render is the next chunk. */
  function bkDateKey(r) { return (r.openWhenNeeded ? r.written : r.openOn) || r.written || ''; }
  function openBooklet() {
    if (!window.TesseraState) return;
    var reg = TesseraState.getRegistry();
    var cands = reg.map(function (l) {
      var text = (l.keptText && String(l.keptText).trim()) ? String(l.keptText) : '';
      return {
        id: l.id, to: l.to, from: l.from, written: l.written, openOn: l.openOn,
        openWhenNeeded: !!l.openWhenNeeded, text: text, hasText: !!text
      };
    });
    cands.sort(function (a, b) { var ka = bkDateKey(a), kb = bkDateKey(b); return ka < kb ? -1 : ka > kb ? 1 : 0; });
    var sel = cands.filter(function (c) { return c.hasText; }).map(function (c) { return c.id; });
    state.booklet = { phase: 'select', cands: cands, sel: sel, model: null };
    renderBooklet();
  }
  function closeBooklet() { state.booklet = null; refs.bkOverlay.hidden = true; }
  function bkCand(id) {
    var c = state.booklet.cands;
    for (var i = 0; i < c.length; i++) if (c[i].id === id) return c[i];
    return null;
  }
  function renderBooklet() {
    var b = state.booklet;
    refs.bkOverlay.hidden = !b;
    if (!b) return;
    refs.bkSelect.hidden = b.phase !== 'select';
    refs.bkPreview.hidden = b.phase !== 'preview';
    if (b.phase === 'select') renderBkSelect();
    else renderBkPreview();
  }
  function renderBkSelect() {
    var b = state.booklet, holder = refs.bkList;
    while (holder.firstChild) holder.removeChild(holder.firstChild);
    /* display order: selected (in chosen order), then unselected with text, then textless */
    var selSet = {}; b.sel.forEach(function (id) { selSet[id] = true; });
    var order = b.sel.map(bkCand)
      .concat(b.cands.filter(function (c) { return !selSet[c.id] && c.hasText; }))
      .concat(b.cands.filter(function (c) { return !c.hasText; }));
    order.forEach(function (c) {
      var selIdx = b.sel.indexOf(c.id);
      var row = el('div', 'bk-row' + (c.hasText ? '' : ' bk-row--disabled'));
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = selIdx >= 0; cb.disabled = !c.hasText;
      cb.addEventListener('change', function () { bkToggle(c.id); });
      row.appendChild(cb);
      var main = el('div', 'bk-row-main');
      main.appendChild(el('span', 'bk-row-to', c.to));
      var meta = c.hasText
        ? 'from ' + (c.from || '—') + ' · opens ' + (c.openWhenNeeded ? 'when needed' : shortDate(c.openOn)) + ' · ' + c.id
        : 'no kept copy — its text wasn’t saved · ' + c.id;
      main.appendChild(el('span', 'bk-row-meta', meta));
      row.appendChild(main);
      if (selIdx >= 0) {
        row.appendChild(el('span', 'bk-row-ord', String(selIdx + 1)));
        var mv = el('div', 'bk-move');
        var up = el('button', null, '↑'); up.title = 'Move up'; up.disabled = selIdx === 0;
        up.addEventListener('click', function () { bkMove(c.id, -1); });
        var dn = el('button', null, '↓'); dn.title = 'Move down'; dn.disabled = selIdx === b.sel.length - 1;
        dn.addEventListener('click', function () { bkMove(c.id, 1); });
        mv.appendChild(up); mv.appendChild(dn);
        row.appendChild(mv);
      }
      holder.appendChild(row);
    });
    var textCount = b.cands.filter(function (c) { return c.hasText; }).length;
    refs.bkSelectHint.textContent = textCount === 0
      ? 'None of your letters kept a copy of their text, so there is nothing to bind yet. Keep a copy at sealing time to bind it later.'
      : b.sel.length + ' of ' + textCount + ' selected, in reading order.';
    refs.bkCompose.disabled = b.sel.length === 0;
    refs.bkCompose.style.opacity = b.sel.length === 0 ? 0.45 : 1;
  }
  function bkToggle(id) {
    var b = state.booklet, i = b.sel.indexOf(id);
    if (i >= 0) b.sel.splice(i, 1); else b.sel.push(id);
    renderBkSelect();
  }
  function bkMove(id, dir) {
    var b = state.booklet, i = b.sel.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= b.sel.length) return;
    var t = b.sel[i]; b.sel[i] = b.sel[j]; b.sel[j] = t;
    renderBkSelect();
  }
  function composeBooklet() {
    var b = state.booklet;
    if (!b.sel.length) return;
    var rows = b.sel.map(bkCand);
    var tos = [];
    rows.forEach(function (r) { if (tos.indexOf(r.to) < 0) tos.push(r.to); });
    var to = tos.length === 1 ? tos[0] : null;
    var years = rows.map(function (r) { return String(bkDateKey(r)).slice(0, 4); }).filter(Boolean).sort();
    var span = years.length ? years[0] + (years[years.length - 1] !== years[0] ? '–' + years[years.length - 1] : '') : '';
    var title = (to ? 'Letters to ' + to : 'Letters') + (span ? ', ' + span : '');
    var pages = [{ kind: 'title', desc: title }];
    rows.forEach(function (r) {
      pages.push({ kind: 'facts', desc: 'For ' + r.to + ' · from ' + (r.from || '—') + ' · opens ' + (r.openWhenNeeded ? 'when needed' : shortDate(r.openOn)) + ' · ' + r.id });
      var words = r.text.trim() ? r.text.trim().split(/\s+/).length : 0;
      pages.push({ kind: 'letter', desc: 'The letter, ' + words + ' word' + (words === 1 ? '' : 's') + ' · ' + r.id });
    });
    pages.push({ kind: 'plates', desc: rows.length + ' token' + (rows.length === 1 ? '' : 's') + ', gathered on one leaf' });
    pages.push({ kind: 'colophon', desc: 'The Tessera format note and the list of letter IDs' });
    b.model = { title: title, count: rows.length, pages: pages };
    b.phase = 'preview';
    renderBooklet();
  }
  function renderBkPreview() {
    var m = state.booklet.model;
    refs.bkPreviewTitle.textContent = m.title;
    refs.bkPreviewSub.textContent = m.count + ' letter' + (m.count === 1 ? '' : 's') + ' · ' + m.pages.length + ' sections, laid out in reading order';
    var holder = refs.bkPages;
    while (holder.firstChild) holder.removeChild(holder.firstChild);
    m.pages.forEach(function (p) {
      var row = el('div', 'bk-page');
      row.appendChild(el('span', 'bk-page-kind', p.kind));
      row.appendChild(el('span', 'bk-page-desc', p.desc));
      holder.appendChild(row);
    });
    refs.bkPrint.disabled = false;
  }
  function printBooklet() {
    var b = state.booklet;
    if (!b || !b.model) return;
    var rows = b.sel.map(bkCand);
    refs.bkPrint.disabled = true;
    TesseraPrint.printBooklet(b.model, rows, { mode: 'sequential' }).then(function () {
      refs.bkPrint.disabled = false;
      closeBooklet();
    });
  }

  function renderShelf() {
    renderLadder();
    var style = shelfStyle();
    var letters = shelfLetters();
    var rail = isMobile(); /* one swipeable shelf row on phones, rows of 3 above */
    var key = style + '|' + letters.length + '|' + (state.freshId || '') + '|' + (rail ? 'rail' : 'rows');
    var tabs = refs.shelfTabs.children;
    for (var t = 0; t < tabs.length; t++) {
      var active = tabs[t].getAttribute('data-style') === style;
      tabs[t].classList.toggle('active', active);
      tabs[t].setAttribute('aria-pressed', String(active));
    }
    refs.shelfShelves.hidden = style !== 'shelves';
    refs.shelfPigeon.hidden = style !== 'pigeonholes';
    refs.shelfCatalog.hidden = style !== 'card catalogue';
    refs.shelfEmpty.hidden = letters.length !== 0;
    var la = document.getElementById('letters-actions');
    if (la) la.hidden = letters.length === 0;
    if (key === lastShelfKey) return;
    lastShelfKey = key;

    var i;
    var chunk = rail ? Math.max(letters.length, 1) : 3;
    while (refs.shelfShelves.firstChild) refs.shelfShelves.removeChild(refs.shelfShelves.firstChild);
    for (i = 0; i < letters.length; i += chunk) {
      var row = el('div', 'shelf-row');
      var cards = el('div', 'shelf-row-cards');
      for (var j = i; j < Math.min(i + chunk, letters.length); j++) cards.appendChild(envCard(letters[j], false));
      row.appendChild(cards);
      row.appendChild(el('div', 'shelf-lip'));
      refs.shelfShelves.appendChild(row);
    }

    while (refs.shelfPigeon.firstChild) refs.shelfPigeon.removeChild(refs.shelfPigeon.firstChild);
    for (i = 0; i < letters.length; i++) {
      var slot = el('div', 'pigeon-slot');
      slot.appendChild(envCard(letters[i], true));
      refs.shelfPigeon.appendChild(slot);
    }

    while (refs.shelfCatalog.firstChild) refs.shelfCatalog.removeChild(refs.shelfCatalog.firstChild);
    for (i = 0; i < letters.length; i++) {
      var lt = letters[i];
      var cr = el('div', 'catalog-row');
      cr.title = lt.title;
      var plate = el('div', 'catalog-plate');
      plate.appendChild(el('span', 'catalog-to', lt.to));
      plate.appendChild(el('span', 'catalog-opens', lt.opens));
      cr.appendChild(plate);
      cr.appendChild(el('div', 'catalog-pull'));
      var hole = el('div', 'catalog-hole');
      hole.style.background = lt.tintDeep;
      cr.appendChild(hole);
      refs.shelfCatalog.appendChild(cr);
    }
  }

  /* ---------- keyboard ---------- */
  function buildKeyboard() {
    var CHAR_TOKEN = { "'": 'apos', '"': 'quote' };
    function key(ch, label, wide) {
      var b = el('button', 'tw-key' + (wide ? ' tw-key--wide' : ''), label);
      b.setAttribute('data-tkey', CHAR_TOKEN[ch] || ch);
      b.tabIndex = -1;
      b.addEventListener('click', function () { typeChar(ch === 'shift' ? '' : ch); });
      return b;
    }
    var rows = [];
    var r1 = [], r2 = [], r3 = [], r4 = [];
    var i, s;
    s = '1234567890'; for (i = 0; i < s.length; i++) r1.push(key(s[i], s[i]));
    s = 'qwertyuiop'; for (i = 0; i < s.length; i++) r2.push(key(s[i], s[i].toUpperCase()));
    s = 'asdfghjkl'; for (i = 0; i < s.length; i++) r3.push(key(s[i], s[i].toUpperCase()));
    r3.push(key('-', '-')); r3.push(key("'", "'")); r3.push(key('"', '"'));
    r4.push(key('shift', 'SHIFT', true));
    s = 'zxcvbnm'; for (i = 0; i < s.length; i++) r4.push(key(s[i], s[i].toUpperCase()));
    r4.push(key(',', ',')); r4.push(key('.', '.')); r4.push(key('?', '?')); r4.push(key('!', '!'));
    rows.push(r1, r2, r3, r4);
    for (i = 0; i < rows.length; i++) {
      var holder = el('div', 'tw-krow');
      for (var j = 0; j < rows[i].length; j++) holder.appendChild(rows[i][j]);
      refs.keyboard.appendChild(holder);
    }
    var space = el('button', 'tw-space', 'SPACE');
    space.setAttribute('data-tkey', ' ');
    space.setAttribute('aria-label', 'space');
    space.tabIndex = -1;
    space.addEventListener('click', function () { typeChar(' '); });
    refs.keyboard.appendChild(space);
  }

  /* ---------- init ---------- */
  function cacheRefs() {
    refs.heroWrap = $('hero-wrap');
    refs.heroIdle = $('hero-idle');
    refs.heroWriting = $('hero-writing');
    refs.hwTo = $('hw-to');
    refs.hwOccasion = $('hw-occasion');
    refs.hwWordline = $('hw-wordline');
    refs.hwPromptsToggle = $('hw-prompts-toggle');
    refs.hwDeck = $('hw-deck');
    refs.hwPrompts = $('hw-prompts');
    refs.hwSeal = $('hw-seal');
    refs.sceneWrap = $('scene-wrap');
    refs.scene = $('scene');
    refs.carriage = $('carriage');
    refs.sheet = $('sheet');
    refs.paperScroll = $('paper-scroll');
    refs.paperLines = $('paper-lines');
    refs.lever = $('lever');
    refs.typebar = $('typebar');
    refs.caret = $('caret');
    refs.keyboard = $('keyboard');
    refs.ta = $('ta');
    refs.soundToggle = $('sound-toggle');
    refs.tapHint = $('tap-hint');
    refs.setupOverlay = $('setup-overlay');
    refs.setup0 = $('setup-0');
    refs.setup1 = $('setup-1');
    refs.setup2 = $('setup-2');
    refs.setupTo = $('setup-to');
    refs.setupOcc = $('setup-occ');
    refs.setupCustom = $('setup-custom');
    refs.setupNext = $('setup-next');
    refs.setupSeries = $('setup-series');
    refs.seriesOverlay = $('series-overlay');
    refs.swSetup = $('sw-setup');
    refs.swWrite = $('sw-write');
    refs.swSeal = $('sw-seal');
    refs.swDone = $('sw-done');
    refs.swSetupTitle = $('sw-setup-title');
    refs.swSetupCopy = $('sw-setup-copy');
    refs.swSetupHint = $('sw-setup-hint');
    refs.swAnchorQ = $('sw-anchor-q');
    refs.swAnchor = $('sw-anchor');
    refs.swFrom = $('sw-from');
    refs.swRungs = $('sw-rungs');
    refs.swBegin = $('sw-begin');
    refs.swLadder = $('sw-ladder');
    refs.swWriteProgress = $('sw-write-progress');
    refs.swRungTitle = $('sw-rung-title');
    refs.swRungWhen = $('sw-rung-when');
    refs.swPrompts = $('sw-prompts');
    refs.swText = $('sw-text');
    refs.swPrev = $('sw-prev');
    refs.swNext = $('sw-next');
    refs.swSummary = $('sw-summary');
    refs.swCustody = $('sw-custody');
    refs.swSealHint = $('sw-seal-hint');
    refs.swSealGo = $('sw-seal-go');
    refs.swDoneTitle = $('sw-done-title');
    refs.swDoneList = $('sw-done-list');
    refs.bkOverlay = $('booklet-overlay');
    refs.bkSelect = $('bk-select');
    refs.bkPreview = $('bk-preview');
    refs.bkList = $('bk-list');
    refs.bkSelectHint = $('bk-select-hint');
    refs.bkCompose = $('bk-compose');
    refs.bkPages = $('bk-pages');
    refs.bkPreviewTitle = $('bk-preview-title');
    refs.bkPreviewSub = $('bk-preview-sub');
    refs.bkPrint = $('bk-print');
    refs.interviewOverlay = $('interview-overlay');
    refs.ivAsk = $('iv-ask');
    refs.ivStitch = $('iv-stitch');
    refs.ivProgress = $('iv-progress');
    refs.ivQ = $('iv-q');
    refs.ivAnswer = $('iv-answer');
    refs.ivBack = $('iv-back');
    refs.ivNext = $('iv-next');
    refs.ivPut = $('iv-put');
    refs.ivKeep = $('iv-keep');
    refs.deckNote = $('deck-note');
    refs.reopenRow = $('reopen-row');
    refs.finishRow = $('finish-row');
    refs.mcSwatches = $('mc-swatches');
    refs.sealEmpty = $('seal-empty');
    refs.sealSteps = $('seal-steps');
    refs.sealDone = $('seal-done');
    refs.dateChips = $('date-chips');
    refs.openDate = $('open-date');
    refs.undatedRow = $('undated-row');
    refs.undated = $('undated');
    refs.dateWords = $('date-words');
    refs.fromWho = $('from-who');
    refs.cowriteToggle = $('cowrite-toggle');
    refs.cowriteSecond = $('cowrite-second');
    refs.cowriteHelper = $('cowrite-helper');
    refs.hwTurns = $('hw-turns');
    refs.custodyHolder = $('custody-holder');
    refs.custodyNote = $('custody-note');
    refs.passPhrase = $('pass-phrase');
    refs.passConfirm = $('pass-confirm');
    refs.passHint = $('pass-hint');
    refs.sealPickBtn = $('seal-pick-btn');
    refs.sealPickImg = $('seal-pick-img');
    refs.sealPickLabel = $('seal-pick-label');
    refs.sealPickCaret = $('seal-pick-caret');
    refs.sealGridSwatches = $('seal-grid-swatches');
    refs.pvTo = $('pv-to');
    refs.pvFrom = $('pv-from');
    refs.pvOpens = $('pv-opens');
    refs.pvKept = $('pv-kept');
    refs.pvText = $('pv-text');
    refs.keepCopy = $('keep-copy');
    refs.sealLetterBtn = $('seal-letter-btn');
    refs.sealHint = $('seal-hint');
    refs.sealedToken = $('sealed-token');
    refs.sealedId = $('sealed-id');
    refs.sealedTo = $('sealed-to');
    refs.sealedOpens = $('sealed-opens');
    refs.sealedKeycard = $('sealed-keycard');
    refs.storyToken = $('story-token');
    refs.shelfTabs = $('shelf-tabs');
    refs.letterLadder = $('letter-ladder');
    refs.shelfEmpty = $('shelf-empty');
    refs.shelfShelves = $('shelf-shelves');
    refs.shelfPigeon = $('shelf-pigeon');
    refs.shelfCatalog = $('shelf-catalog');
  }

  function wireEvents() {
    $('nav-write').addEventListener('click', startWriting);
    $('reopen-btn').addEventListener('click', startWriting);
    $('finish-btn').addEventListener('click', goSeal);
    refs.hwSeal.addEventListener('click', goSeal);
    $('hw-change').addEventListener('click', function () { setSetupStep(1); });
    refs.hwPromptsToggle.addEventListener('click', function () {
      state.showPrompts = !state.showPrompts;
      renderWriting();
    });
    refs.hwDeck.addEventListener('click', openInterview);
    $('iv-x').addEventListener('click', closeInterview);
    refs.ivBack.addEventListener('click', ivGoBack);
    refs.ivNext.addEventListener('click', ivGoNext);
    $('iv-stitch-back').addEventListener('click', ivGoBack);
    refs.ivPut.addEventListener('click', stitchIntoLetter);
    refs.ivKeep.addEventListener('change', function (e) { state.keepInterview = e.target.checked; });
    refs.ivAnswer.addEventListener('input', function (e) {
      if (state.deckAnswers) state.deckAnswers[state.ivIndex] = e.target.value;
    });

    /* the milestone series wizard */
    refs.setupSeries.addEventListener('click', openSeriesWizard);
    $('sw-x').addEventListener('click', closeSeriesWizard);
    $('sw-setup-cancel').addEventListener('click', closeSeriesWizard);
    refs.swAnchor.addEventListener('input', function (e) {
      state.series.anchor = e.target.value;
      recomputeRungDates();
      scheduleSeriesSave();
      renderSeriesSetup();
    });
    refs.swFrom.addEventListener('input', function (e) {
      state.series.from = e.target.value;
      scheduleSeriesSave();
      seriesRefreshReady();
    });
    refs.swBegin.addEventListener('click', function () {
      if (!seriesReady()) return;
      seriesSortRungs();
      state.series.phase = 'write';
      state.series.index = 0;
      scheduleSeriesSave();
      renderSeries();
    });
    refs.swPrev.addEventListener('click', swGoPrev);
    refs.swNext.addEventListener('click', swGoNext);
    refs.swText.addEventListener('input', function (e) {
      var s = state.series;
      if (s && s.rungs[s.index]) { s.rungs[s.index].text = e.target.value; scheduleSeriesSave(); }
    });
    $('sw-seal-back').addEventListener('click', function () {
      var s = state.series;
      s.phase = 'write';
      s.index = s.rungs.length - 1;
      renderSeries();
    });
    refs.swCustody.addEventListener('input', function (e) {
      state.series.custodyHolder = e.target.value;
      scheduleSeriesSave();
    });
    refs.swSealGo.addEventListener('click', sealSeries);
    $('sw-done-close').addEventListener('click', closeSeriesWizard);
    $('sw-print-all').addEventListener('click', function () {
      if (state.series && state.series.done.length) TesseraPrint.printKits(state.series.done);
    });

    refs.sceneWrap.addEventListener('click', function (e) {
      /* the setup dialog lives inside scene-wrap, so its own button clicks
         (which can flip setupStep to null before this bubbles up) must not
         fall through to a focus grab */
      if (state.setupStep !== null || refs.setupOverlay.contains(e.target)) return;
      /* the deck interview is also an in-scene overlay; its clicks must not
         fall through to the focus grab either */
      if (!refs.interviewOverlay.hidden || refs.interviewOverlay.contains(e.target)) return;
      /* the series wizard is likewise an in-scene overlay */
      if (!refs.seriesOverlay.hidden || refs.seriesOverlay.contains(e.target)) return;
      /* phones: if focus lingers from a non-gesture path the keypad may be
         down even though the field is focused; a blur inside this real tap
         lets the re-focus summon it again */
      if (isMobile() && document.activeElement === refs.ta) refs.ta.blur();
      focusTa();
    });
    refs.lever.addEventListener('click', function () { doLeverVisual(); typeChar('\n'); });
    refs.ta.addEventListener('input', onTaInput);
    refs.ta.addEventListener('keydown', onTaKeyDown);
    refs.ta.addEventListener('focus', function () { state.focused = true; renderCaret(); });
    refs.ta.addEventListener('blur', function () { state.focused = false; renderCaret(); });
    refs.soundToggle.addEventListener('click', function () {
      ensureCtx();
      state.soundOnU = !soundOn();
      renderSound();
    });

    $('setup-x').addEventListener('click', skipSetup);
    $('setup-explore').addEventListener('click', skipSetup);
    $('setup-skip').addEventListener('click', skipSetup);
    $('setup-begin').addEventListener('click', function () { introDone = true; setSetupStep(1); });
    $('setup-next').addEventListener('click', function () { if (state.to.trim()) setSetupStep(2); });
    $('setup-back').addEventListener('click', function () { setSetupStep(1); });
    $('setup-done').addEventListener('click', confirmSetup);
    refs.setupTo.addEventListener('input', function (e) {
      state.to = e.target.value;
      refs.setupNext.disabled = !state.to.trim();
      refs.setupNext.style.opacity = state.to.trim() ? 1 : 0.45;
    });
    refs.setupOcc.addEventListener('change', function (e) {
      state.occasion = e.target.value || null;
      /* answers are indexed to a specific deck; a new occasion starts fresh */
      state.deckAnswers = null; state.ivIndex = 0; state.ivStitch = false; state.keepInterview = false;
      renderSetup();
      scheduleSave();
    });
    refs.setupCustom.addEventListener('input', function (e) { state.customOccasion = e.target.value; scheduleSave(); });

    refs.openDate.addEventListener('input', function (e) {
      state.openOn = e.target.value;
      state.openWhenNeeded = false;
      renderSealSection();
      scheduleSave();
    });
    refs.undated.addEventListener('change', function (e) {
      state.openWhenNeeded = e.target.checked;
      renderSealSection();
      scheduleSave();
    });
    refs.fromWho.addEventListener('input', function (e) { state.fromWho = e.target.value; renderSealSection(); renderWriting(); scheduleSave(); });
    refs.cowriteToggle.addEventListener('change', function (e) { state.coWrite = e.target.checked; renderSealSection(); renderWriting(); scheduleSave(); });
    refs.cowriteSecond.addEventListener('input', function (e) { state.secondWriter = e.target.value; renderSealSection(); renderWriting(); scheduleSave(); });
    refs.custodyHolder.addEventListener('input', function (e) { state.custodyHolder = e.target.value; renderSealSection(); scheduleSave(); });
    refs.custodyNote.addEventListener('input', function (e) { state.custodyNote = e.target.value; renderSealSection(); scheduleSave(); });
    refs.passPhrase.addEventListener('input', function (e) { state.passphrase = e.target.value; renderSealSection(); });
    refs.passConfirm.addEventListener('input', function (e) { state.passConfirm = e.target.value; renderSealSection(); });
    refs.passHint.addEventListener('input', function (e) { state.passHint = e.target.value; });
    refs.sealPickBtn.addEventListener('click', function () {
      state.sealPickerOpen = !state.sealPickerOpen;
      renderSealSection();
    });
    refs.keepCopy.addEventListener('change', function (e) { state.keepCopy = e.target.checked; scheduleSave(); });
    refs.sealLetterBtn.addEventListener('click', sealNow);
    $('sealed-print').addEventListener('click', function () {
      if (!state.sealed) return;
      var envelopeDefault = !state.sealed.fields.openWhenNeeded;
      $('print-envelope').checked = envelopeDefault;
      TesseraPrint.printKit(state.sealed, { envelope: envelopeDefault });
    });
    refs.sealedKeycard.addEventListener('click', function () {
      if (state.sealed && state.sealed.encrypted) {
        TesseraPrint.printEscrowCard({ id: state.sealed.fields.id, passphrase: state.passphrase, hint: state.passHint.trim() });
      }
    });
    $('sealed-download').addEventListener('click', function () {
      if (state.sealed) TesseraExport.download(state.sealed);
    });
    $('sealed-calendar').addEventListener('click', function () {
      if (state.sealed) TesseraReminders.downloadOne(state.sealed.fields);
    });
    $('cal-all').addEventListener('click', function () {
      TesseraReminders.downloadAll(TesseraState.getRegistry());
    });
    $('wallet-card').addEventListener('click', function () {
      TesseraReminders.printCard(TesseraState.getRegistry());
    });
    $('booklet-open').addEventListener('click', openBooklet);
    $('bk-x').addEventListener('click', closeBooklet);
    $('bk-cancel').addEventListener('click', closeBooklet);
    refs.bkCompose.addEventListener('click', composeBooklet);
    $('bk-back').addEventListener('click', function () { state.booklet.phase = 'select'; renderBooklet(); });
    refs.bkPrint.addEventListener('click', printBooklet);
    $('print-close').addEventListener('click', TesseraPrint.hide);
    $('print-go').addEventListener('click', function () { window.print(); });
    $('print-envelope').addEventListener('change', function (e) {
      if (state.sealed) TesseraPrint.printKit(state.sealed, { envelope: e.target.checked });
    });
    var savedTheme = TesseraState.getSetting('printTheme') || 'letterpress';
    $('print-theme').value = savedTheme;
    $('print-root').classList.add('theme-' + savedTheme);
    $('print-theme').addEventListener('change', function (e) {
      var pr = $('print-root');
      pr.className = pr.className.replace(/\btheme-[\w-]+/g, '').trim();
      pr.classList.add('theme-' + e.target.value);
      TesseraState.setSetting('printTheme', e.target.value);
    });
    $('write-another').addEventListener('click', writeAnother);

    var tabs = refs.shelfTabs.children;
    for (var t = 0; t < tabs.length; t++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          state.shelfStyleU = btn.getAttribute('data-style');
          renderShelf();
        });
      })(tabs[t]);
    }

    window.addEventListener('pointerdown', ensureCtx);
    window.addEventListener('keydown', ensureCtx);
  }

  function startDemo() {
    if (hasResumableDraft()) return; /* a saved letter resumes instead of the demo */
    if (!reduced()) {
      autoT = setTimeout(function () {
        if (state.phase === 'idle' && !state.value) {
          autoType(DEMO_TEXT, function () {
            if (!introDone && state.phase === 'idle' && state.setupStep === null) setSetupStep(0);
          });
        }
      }, 900);
    } else {
      handleValue(DEMO_TEXT, null, true);
      setSetupStep(0);
    }
  }

  function init() {
    cacheRefs();
    buildKeyboard();
    buildDateChips();
    buildSealSwatches();
    wireEvents();

    function whenData() {
      buildOccasionSelect();
      paintStoryToken();
      renderShelf();
      resumedDraft = restoreDraft();
      /* a ladder left in progress reopens over the desk */
      restoreSeriesWizard();
    }
    if (window.TesseraOccasions && window.TesseraToken) whenData();
    else {
      waitData = setInterval(function () {
        if (window.TesseraOccasions && window.TesseraToken) {
          clearInterval(waitData);
          whenData();
        }
      }, 60);
    }

    applyMachineColor();
    applyHeroLayout();
    renderHero();
    renderPaper();
    renderCaret();
    renderSound();
    renderSwatches();
    renderSetup();
    renderSealSection();
    updateCarriage(false);
    fitScene();
    if (window.ResizeObserver) new ResizeObserver(fitScene).observe(refs.sceneWrap);
    else window.addEventListener('resize', fitScene);
    if (mobileQ) {
      var onMq = function () {
        fitScene();
        handleValue(state.value, null, true); /* re-wrap at the new column width */
        renderShelf();
        renderCaret();
      };
      if (mobileQ.addEventListener) mobileQ.addEventListener('change', onMq);
      else if (mobileQ.addListener) mobileQ.addListener(onMq);
    }
    armReveals();

    /* service worker: only over http(s) — file:// stays a first-class home */
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline shell is a convenience, not a promise */ });
    }

    startDemo();
  }

  window.TesseraLanding = { answerForward: answerForward, refreshShelf: renderShelf };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
