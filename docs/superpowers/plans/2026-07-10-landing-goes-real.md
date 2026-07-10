# Landing Goes Real Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the approved spec `docs/superpowers/specs/2026-07-10-landing-goes-real-design.md`: the landing's ceremony ends in `TesseraExport.seal()`, the shelf reads `tessera_v1`, the print engine is shared via `print.css`, and the landing becomes the front door (`index.html`) with the app kept as `app.html`.

**Architecture:** Four independent seams land in order: (1) `state.js` schema 2 with a real `migrate()` step and its first test suite; (2) the print engine CSS moves out of `style.css` into a self-sufficient shared `print.css`; (3) `landing/landing.js` replaces its souvenir `sealNow()` with the compose-parity seal sequence and wires the real print/download; (4) the shelf swaps demo data for the registry; then (5) the two-file rename swaps the front door and reworks the SW precache, and fonts consolidate to the single app-owned `fonts/` set.

**Tech Stack:** Vanilla ES5, no build; localStorage via `state.js` only; service worker precache; node test scripts.

**Not changing (hard rails):** `js/manifest.js`, `js/zip.js`, `js/token.js`, `js/export.js`, `js/compose.js`, `js/print.js`, `js/registry.js`, `js/main.js`, fixtures, `version.json` / `LOCAL_VERSION` / `CACHE_VERSION` (the triple moves via `/release`). The landing's typewriter mechanics, audio, backgrounds, wizard UX stay untouched. `specimen.html` untouched (separate author task).

---

### Task 1: `state.js` schema 2 — sealKey backfill via the migrate seam (TDD)

**Files:**
- Test: `tools/test-state.js` (new — state.js's first suite)
- Modify: `js/state.js` (`fresh()`, `migrate()`, export `migrate` for the test)
- Modify: `docs/engineering/testing.md` + `CLAUDE.md` (Gate 1 lists gain the new suite) — done in Task 7 with the other doc edits

- [ ] **Step 1: Write the failing test**

`tools/test-state.js`:

```js
/* test-state.js — storage shape and the migrate seam. Schema 2: registry
   entries carry sealKey (wax choice from the front door); old blobs backfill. */
'use strict';
var path = require('path');
var S = require(path.join(__dirname, '..', 'js', 'state.js'));

var fails = 0;
function ok(name, cond) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name);
  if (!cond) { fails++; process.exitCode = 1; }
}

var f = S.migrate(null);
ok('fresh shape schema 2', f.schema === 2);
ok('fresh shape parts', !!(f.drafts && f.registry && f.settings));

var v1 = S.migrate({ schema: 1, drafts: {}, registry: [{ id: 'TSR-aaaa-bbbb' }], settings: {} });
ok('v1 blob migrates to schema 2', v1.schema === 2);
ok('v1 registry entry gains sealKey ""', v1.registry[0].sealKey === '');

var kept = S.migrate({ schema: 1, registry: [{ id: 'TSR-cccc-dddd', sealKey: 'red' }] });
ok('existing sealKey survives migration', kept.registry[0].sealKey === 'red');

var v2 = S.migrate({ schema: 2, registry: [{ id: 'TSR-eeee-ffff' }] });
ok('v2 blob passes through untouched', v2.schema === 2 && v2.registry[0].sealKey === undefined);

var bare = S.migrate({});
ok('empty object gets full shape at schema 2', bare.schema === 2 && Array.isArray(bare.registry));

S.load(); /* no localStorage in node: must fall back to fresh, not throw */
S.addRegistryEntry({ id: 'TSR-1111-2222', sealKey: 'blue' });
ok('registry CRUD in-memory', S.getRegistry().length === 1 && S.getRegistry()[0].sealKey === 'blue');
ok('updateRegistryEntry', S.updateRegistryEntry('TSR-1111-2222', { sealKey: 'green' }) && S.getRegistry()[0].sealKey === 'green');
ok('removeRegistryEntry', S.removeRegistryEntry('TSR-1111-2222') && S.getRegistry().length === 0);

if (!fails) console.log('state: all green');
```

- [ ] **Step 2: Run it — must fail**

Run: `node tools/test-state.js`
Expected: crash (`S.migrate is not a function`) — `migrate` is not exported yet, and schema is still 1.

- [ ] **Step 3: Implement schema 2 in `js/state.js`**

Replace `fresh()` and `migrate()` (state.js:10–21):

```js
  function fresh() {
    return { schema: 2, drafts: {}, registry: [], settings: {} };
  }

  function migrate(data) {
    if (!data || typeof data !== 'object') return fresh();
    if (!data.schema) data.schema = 1;
    if (!data.drafts) data.drafts = {};
    if (!data.registry) data.registry = [];
    if (!data.settings) data.settings = {};
    if (data.schema < 2) {
      /* schema 2: registry entries may carry sealKey (the front door's wax
         choice); older entries default to '' and renderers fall back */
      for (var i = 0; i < data.registry.length; i++) {
        if (data.registry[i].sealKey === undefined) data.registry[i].sealKey = '';
      }
      data.schema = 2;
    }
    return data;
  }
```

And add `migrate: migrate,` to the exported `api` object (state.js:66–71).

- [ ] **Step 4: Run to green**

Run: `node tools/test-state.js` → all `ok`, exit 0. Then `node --check js/state.js`.

- [ ] **Step 5: Commit**

```powershell
git add tools/test-state.js js/state.js
git commit -m "feat(state): schema 2 — registry entries carry the wax-seal choice; first state suite"
```

---

### Task 2: `print.css` — one engine, shared by every door

**Files:**
- Create: `print.css` (repo root)
- Modify: `style.css` (remove the moved blocks), `index.html` (link), `sw.js` (CORE + print.css)

- [ ] **Step 1: Create `print.css`**

Move, verbatim, everything from `/* ---- print overlay ... ---- */` to the end of `style.css` (the overlay, `.mono`, every `.sheet*`/`.cover*`/`.readme-pre`/`.letter-body`/`.token-holder`/`.register-table` rule, `@page`, and the `@media print` block), with exactly three deltas so the file is self-sufficient on a page that doesn't load `style.css`:

1. Header comment + scoped face variables at the top:

```css
/* print.css — the print kit's engine, shared by every door. Self-sufficient:
   faces and fallbacks are declared here; @font-face lives with each page's
   own stylesheet (style.css and landing/landing.css both name the same
   families). Moved from style.css 2026-07-10, rules unchanged. */
#print-overlay {
  --display: 'Young Serif', Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Times New Roman', serif;
  --typewriter: 'Courier Prime', ui-monospace, monospace;
}
```

2. The `#print-overlay` rule gains a fallback + a z-index that clears the landing nav: `background: var(--paper, #f7f3ea); … z-index: 90;` (was `var(--paper)` / `10`).
3. `.mono` moves here (print.js's register table uses it; the app still gets it because every door loads print.css).

- [ ] **Step 2: Trim `style.css` and link both files**

Delete the moved blocks from `style.css` (keep `--display`/`--typewriter` in `:root` — app-wide tokens). In `index.html` add after the style.css link:

```html
<link rel="stylesheet" href="print.css">
```

In `sw.js` CORE, after `'style.css'`, add `'print.css'`.

- [ ] **Step 3: Verify the app's preview is unchanged**

`node --check sw.js`; browser: app print preview still renders all faces correctly (same checks as the print-base-look Gate 3, spot level).

- [ ] **Step 4: Commit**

```powershell
git add print.css style.css index.html sw.js
git commit -m "refactor(print): print engine moves to shared print.css, behavior-neutral"
```

---

### Task 3: The ceremony seals for real

**Files:**
- Modify: `landing.html` (head link, sealed block, print overlay, scripts, footer)
- Modify: `landing/landing.js` (constants, state, `sealNow`, `renderSealSection`, `writeAnother`, refs, handlers, init)

- [ ] **Step 1: landing.html — head + scripts + overlay + copy**

Head (after the landing.css link): `<link rel="stylesheet" href="print.css">`.

Scripts (landing.html:375–377) become:

```html
<script src="data/occasions.js"></script>
<script src="js/manifest.js"></script>
<script src="js/token.js"></script>
<script src="js/zip.js"></script>
<script src="js/state.js"></script>
<script src="js/export.js"></script>
<script src="js/print.js"></script>
<script src="landing/landing.js"></script>
```

Before the scripts, the shared overlay (landing button classes):

```html
<div id="print-overlay" hidden>
  <div class="print-toolbar">
    <button id="print-close" class="btn-quiet">Back</button>
    <button id="print-go" class="btn-cta">Print the kit</button>
  </div>
  <div id="print-root"></div>
</div>
```

The sealed block (landing.html:241–253) becomes (real copy, inert machinery gone):

```html
    <div class="sealed-wrap" id="seal-done" hidden>
      <h3 class="sealed-title">Sealed.</h3>
      <div class="sealed-token" id="sealed-token"></div>
      <p class="sealed-id" id="sealed-id"></p>
      <p class="sealed-summary">For <span id="sealed-to"></span> · opens <span id="sealed-opens"></span>. The folder has downloaded: the letter, its manifest, a README for whoever finds it, and this token to cut in two.</p>
      <div class="sealed-actions">
        <button class="btn-quiet" id="sealed-print">Print the kit</button>
        <button class="btn-quiet" id="sealed-download">Download it again</button>
        <button class="btn-cta" id="write-another">Write another</button>
      </div>
    </div>
```

Footer (landing.html:370): drop `· This page is a design study`, leaving `Code MIT · Format CC0, public domain forever<br>A Lacunae project`.

- [ ] **Step 2: landing.js — retire the souvenir path**

Delete `INERT_NOTE` (landing.js:54). In `state` (landing.js:60): replace `sealed: null, sealedList: [],` … `inertMsg: ''` so the line set reads `sealed: null, freshId: '', sealing: false,` (drop `sealedList` and `inertMsg`). Delete `refs.inertMsg = $('inert-msg');` (landing.js:915). In `writeAnother` (landing.js:482) delete `state.inertMsg = '';`.

- [ ] **Step 3: landing.js — `sealNow()` becomes the real sequence**

Replace the whole function (landing.js:453–476):

```js
  function sealNow() {
    var d = state;
    var validDate = /^\d{4}-\d{2}-\d{2}$/.test(d.openOn);
    if (d.sealing || !d.value.trim() || !d.fromWho.trim() || !(d.openWhenNeeded || validDate)) return;
    d.sealing = true;
    renderSealSection();
    var fields = {
      to: d.to.trim(),
      from: d.fromWho.trim(),
      written: todayIso(),
      openOn: d.openWhenNeeded ? todayIso() : d.openOn,
      occasion: d.occasion || 'custom',
      language: 'en',
      custody: d.custodyHolder.trim()
        ? [{ holder: d.custodyHolder.trim(), instructions: (d.custodyNote.trim() || 'Keep it safe; pass it on with its story.') }]
        : [],
      letter: d.value,
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
        custodyHolder: d.custodyHolder.trim(),
        custodyNote: d.custodyNote.trim(),
        keptText: d.keepCopy ? d.value : null,
        status: 'sealed',
        sealKey: d.sealChoice || 'blue'
      });
      state.sealed = sealed;
      state.freshId = sealed.fields.id;
      state.sealing = false;
      lastShelfKey = '';
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
```

- [ ] **Step 4: landing.js — `renderSealSection` presents the real object**

In the `letter && !state.sealed` branch (landing.js:643–646), the seal-button block becomes:

```js
      var canSeal = !state.sealing && state.value.trim().length > 0 && state.fromWho.trim().length > 0 && (state.openWhenNeeded || validDate);
      refs.sealLetterBtn.disabled = !canSeal;
      refs.sealLetterBtn.style.opacity = canSeal ? 1 : 0.45;
      refs.sealLetterBtn.textContent = state.sealing ? 'Sealing…' : 'Seal the letter';
      refs.sealHint.textContent = (canSeal || state.sealing) ? '' : 'A date (or “when it’s needed”) and a sender make it sealable.';
```

The sealed branch (landing.js:649–654) becomes (and the `refs.inertMsg.textContent` line 655 is deleted):

```js
    if (state.sealed) {
      refs.sealedToken.innerHTML = state.sealed.token.full; /* SVG from js/token.js */
      refs.sealedId.textContent = state.sealed.fields.id;
      refs.sealedTo.textContent = state.sealed.fields.to;
      refs.sealedOpens.textContent = state.sealed.fields.openWhenNeeded ? 'when it’s needed' : dateInWords(state.sealed.fields.openOn);
    }
```

- [ ] **Step 5: landing.js — handlers + SW registration**

Replace the two inert handlers (landing.js:992–993) with:

```js
    $('sealed-print').addEventListener('click', function () {
      if (state.sealed) TesseraPrint.printKit(state.sealed);
    });
    $('sealed-download').addEventListener('click', function () {
      if (state.sealed) TesseraExport.download(state.sealed);
    });
    $('print-close').addEventListener('click', TesseraPrint.hide);
    $('print-go').addEventListener('click', function () { window.print(); });
```

At the end of `init()` (before `startDemo();`, landing.js:1072):

```js
    /* service worker: only over http(s) — file:// stays a first-class home */
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline shell is a convenience, not a promise */ });
    }
```

- [ ] **Step 6: Sweep for orphans, syntax gate, commit**

`Select-String -Path landing\landing.js -Pattern 'sealedList|inertMsg|INERT_NOTE|inert-'` → zero matches. `node --check landing/landing.js`.

```powershell
git add landing.html landing/landing.js
git commit -m "feat(landing): the ceremony seals for real — one seal path, real download and print"
```

---

### Task 4: The shelf reads `tessera_v1`

**Files:**
- Modify: `landing/landing.js` (delete `DEMO`, rewrite `shelfLetters`, key + empty state in `renderShelf`, one ref)
- Modify: `landing.html` (empty-state element), `landing/landing.css` (its style)

- [ ] **Step 1: Delete the demo fixtures**

Delete the `DEMO` array and its comment (landing.js:42–49). `SHELF_ROTS`, `DEMO_TEXT`, `STORY_SEED` stay (the auto-typing intro and story token remain demos of *typing*, not of letters kept).

- [ ] **Step 2: `shelfLetters()` reads the registry**

Replace (landing.js:719–738):

```js
  function shelfLetters() {
    var all = window.TesseraState ? TesseraState.getRegistry().slice().reverse() : [];
    var out = [];
    for (var i = 0; i < all.length; i++) {
      var l = all[i];
      var g = bySlug(l.occasion || 'custom').group || 'custom';
      var sealKey = l.sealKey || SEAL_LIB[i % SEAL_LIB.length].key;
      out.push({
        to: l.to,
        opens: l.openWhenNeeded ? 'opens when needed' : 'opens ' + shortDate(l.openOn),
        id: l.id,
        rot: SHELF_ROTS[i % SHELF_ROTS.length],
        tint: GROUP_TINT[g] || GROUP_TINT.custom,
        tintDeep: GROUP_DEEP[g] || GROUP_DEEP.custom,
        sealSrc: sealMeta(sealKey).src,
        title: 'For ' + l.to + ' · ' + (l.openWhenNeeded ? 'opens when it’s needed' : 'opens ' + dateInWords(l.openOn)) + ' · ' + l.id + (l.id === state.freshId ? ' · sealed today' : '')
      });
    }
    return out;
  }
```

(Old entries migrated with `sealKey: ''` hit the same rotation fallback as before.)

- [ ] **Step 3: `renderShelf()` — cache key + empty state**

The key (landing.js:769) becomes:

```js
    var key = style + '|' + letters.length + '|' + (state.freshId || '') + '|' + (rail ? 'rail' : 'rows');
```

After the three `hidden` toggles (landing.js:776–778) add:

```js
    refs.shelfEmpty.hidden = letters.length !== 0;
```

In `cacheRefs()` (after landing.js:920): `refs.shelfEmpty = $('shelf-empty');`

In landing.html after the letters lede (line 351):

```html
    <p class="shelf-empty" id="shelf-empty" hidden>Nothing is waiting yet. The desk above writes the first one; sealed letters take their place here.</p>
```

In landing.css (with the letters-section styles):

```css
.shelf-empty { font-family: var(--ui); font-size: 15px; color: rgba(57,46,31,0.6); text-align: center; margin: 26px 0 6px; }
```

- [ ] **Step 4: Gates + commit**

`node --check landing/landing.js`; `node tools/prose-check.js` (new letter-facing copy).

```powershell
git add landing.html landing/landing.js landing/landing.css
git commit -m "feat(landing): the shelf reads the real registry; demo letters retire"
```

---

### Task 5: The front-door swap + one font source + SW precache

**Files:**
- Rename: `index.html` → `app.html`, then `landing.html` → `index.html`
- Modify: the new `index.html` (nav link), `landing/landing.css` (@font-face srcs), `sw.js` (CORE)
- Delete: `landing/fonts/` (fonts consolidate to the app-owned `fonts/`, per the seam Spec 1 left open)

- [ ] **Step 1: The renames**

```powershell
git mv index.html app.html
git mv landing.html index.html
```

- [ ] **Step 2: Nav link to the plain door (decision C proposal)**

In the new `index.html` nav (`.ld-navlinks`, after the About link):

```html
    <a class="ld-navlink" href="app.html">Plain paper</a>
```

- [ ] **Step 3: One font source**

In `landing/landing.css`, the four `@font-face` `src` URLs change from `url('fonts/…')` to `url('../fonts/…')` (same filenames). Then:

```powershell
git rm -r landing/fonts
```

- [ ] **Step 4: `sw.js` CORE — the front door works offline**

```js
var CORE = [
  './',
  'index.html',
  'app.html',
  'style.css',
  'print.css',
  'landing/landing.css',
  'landing/landing.js',
  'version.json',
  'js/main.js',
  'js/state.js',
  'js/manifest.js',
  'js/zip.js',
  'js/token.js',
  'js/export.js',
  'js/compose.js',
  'js/print.js',
  'js/registry.js',
  'data/occasions.js',
  'fonts/YoungSerif-Regular.ttf',
  'fonts/CourierPrime-Regular.ttf',
  'fonts/CourierPrime-Bold.ttf',
  'fonts/CourierPrime-Italic.ttf'
];
```

(22 entries. `landing/assets/` stays runtime-cached — compose→seal→print must not depend on the art.)

- [ ] **Step 5: Syntax gate + commit**

`node --check sw.js`

```powershell
git add -A
git commit -m "feat(shell): the landing becomes the front door; app keeps the quiet path at app.html"
```

---

### Task 6: Gates

- [ ] **Step 1: Gate 1** — `node --check` on `js/state.js`, `landing/landing.js`, `sw.js`; `node tools/test-state.js`, `test-manifest.js`, `test-zip.js`, `test-token.js` — all green, fixtures byte-identical.
- [ ] **Step 2: Gate 2** — `node tools/prose-check.js` clean.
- [ ] **Step 3: Gate 3, 375px first** — fresh SW; front door `/`: wizard → type → seal for real → registry entry in `tessera_v1` (schema 2, sealKey set) → shelf card with wax seal → "Print the kit" overlay with correct faces → `app.html#letters` shows the same entry → reload persists → console clean, no horizontal overflow at 375px, no external requests. App door: compose flow + print preview unchanged.
- [ ] **Step 4: Format + century** — `/spec-sync` clean; century spot-checks (same-origin only, precache complete, file:// unaffected by design — SW registration stays http(s)-guarded on both doors).

---

### Task 7: Docs, same day

**Files:** `docs/engineering/architecture.md` (file map: app.html, print.css, front door), `docs/engineering/testing.md` + `CLAUDE.md` (Gate 1 gains `test-state.js`), `README.md:32` (writing room → `app.html`), `docs/PROGRESS.md` (table rows + log), `docs/decisions.md` (swap entry: front door, schema 2, demo retirement with the ID-collision rationale, font consolidation), `docs/plans/v0.2-*.md` (4 files: `index.html` refs → `app.html`).

- [ ] Apply the edits, re-run `node tools/prose-check.js`, commit:

```powershell
git commit -m "docs: the front door is real — architecture, testing gate, decision, progress"
```

---

## Execution notes

- Order: 1 → 2 → 3 → 4 → 5 → 6 → 7. Tasks 3–4 both touch `landing/landing.js`; do sequentially.
- Stop conditions: any fixture diff (format event — stop, report); `TesseraExport.seal` rejecting in the browser flow (diagnose, don't improvise a fallback seal); anything requiring a `CACHE_VERSION` bump (that is `/release`'s job, not this plan's).
- After this lands, nothing ships until `/release` (Netlify deploys `main` only).
