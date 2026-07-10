# Unify the Front End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the landing (`index.html`) the only front end — writing at the typewriter desk, opening a received letter with ceremony, answering forward, keeping for someone, and calendar/card reminders — all in the landing's visual language. Retire `app.html`.

**Architecture:** Reuse the pure, tested engine (`verifyLetter` in `open.js`, `ics.js`, `print.js`, `export.js`, `state.js`, `token.js`, `manifest.js`, `zip.js`). Prune `open.js` to its DOM-free core. Delete the plain renderers (`compose.js`, `registry.js`, `main.js`) and `app.html`. Add `landing/opening.js` (opening overlay), `landing/reminders.js` (calendar/card helpers), and `js/version.js` (relocated versioning-triple leg + SW registration + version display).

**Tech Stack:** Vanilla ES5-style JS (no build, no framework, no deps), dual-env module guards, `file://`-safe. Spec: [../specs/2026-07-11-unify-front-end-design.md](../specs/2026-07-11-unify-front-end-design.md).

**Invariants that must not break:** one seal path (`export.js`), one storage key `tessera_v1` (`state.js`, schema 3), one print engine, one token derivation; no external requests at compose/open/export/print; works from `file://`; no format change (`tessera` stays `0.1`, fixtures byte-identical).

---

## Phase 0 — Prune & relocate (make the landing self-sufficient, delete the plain app)

### Task 0.1: Relocate the versioning triple leg into `js/version.js`

**Files:**
- Create: `js/version.js`
- Modify: `index.html` (script tags), `sw.js` (CORE), `CLAUDE.md`, `docs/engineering/architecture.md`

- [ ] **Step 1:** Create `js/version.js` with the SW registration + version display lifted from `main.js` (no router):

```js
/* version.js — versioning triple partner: version.json + LOCAL_VERSION here
   + CACHE_VERSION in sw.js (bump via /release). Also registers the offline
   shell (http(s) only; file:// stays a first-class home) and fills the
   version note. Loaded by index.html. */
(function () {
  'use strict';
  var LOCAL_VERSION = '0.2.0';
  function init() {
    var v = document.getElementById('version-note');
    if (v) v.textContent = 'v' + LOCAL_VERSION;
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
```

- [ ] **Step 2:** Confirm `index.html` has a `#version-note` element (grep). If absent, add `<span id="version-note"></span>` into the footer/about area (the landing already shows an about section). Add `<script src="js/version.js"></script>` to `index.html` (after the engine scripts, before `landing/landing.js`).
- [ ] **Step 3:** Update the versioning-triple definition in `CLAUDE.md` (the "Versioning triple" bullet) and `docs/engineering/architecture.md`: `LOCAL_VERSION` now lives in `js/version.js`, not `js/main.js`.
- [ ] **Step 4:** `node --check js/version.js`. Expected: silent.
- [ ] **Step 5:** Commit: `chore(version): relocate LOCAL_VERSION into js/version.js (main.js retiring)`.

### Task 0.2: Prune `open.js` to its pure verification core

**Files:**
- Modify: `js/open.js`
- Test: `tools/test-open.js` (unchanged — must stay green)

- [ ] **Step 1:** Run `node tools/test-open.js` first, confirm green (baseline).
- [ ] **Step 2:** In `js/open.js`, delete the browser-only screen wiring and its helpers: the `/* screen wiring */` section onward — `view`, `askedThisSession`, `$`, `el`, `todayIso`, `start`, `renderIntake`, `intake`, `factRow`, `renderVerify`, `dateGate`, `renderWait`, `reveal`, `readOnPaper`, `reducedMotion`, `ceremony`, `renderLetter`, and the trailing `hashchange` listener. **Keep** everything `verifyLetter`/`readmeFacts`/`parseChecksums` depend on (`toHex`, `sha256HexBytes`, `asBytes`, `asText`, the verify core). Do NOT touch `verifyLetter`/`readmeFacts`/`parseChecksums` themselves.
- [ ] **Step 3:** Narrow the api to `var api = { verifyLetter: verifyLetter, readmeFacts: readmeFacts, parseChecksums: parseChecksums };`.
- [ ] **Step 4:** Update the file header comment: this is now a pure verification module; the opening UI lives in `landing/opening.js`.
- [ ] **Step 5:** `node --check js/open.js && node tools/test-open.js`. Expected: all green, unchanged.
- [ ] **Step 6:** Commit: `refactor(open): prune open.js to its pure verification core`.

### Task 0.3: Delete the plain app and redirect `app.html`

**Files:**
- Delete: `js/compose.js`, `js/registry.js`, `js/main.js`
- Replace: `app.html` (full content → redirect)
- Modify: `sw.js` (CORE)

- [ ] **Step 1:** Confirm nothing the landing loads references `TesseraCompose`, `TesseraRegistry`, or `main.js`: `grep -rn "TesseraCompose\|TesseraRegistry\|js/main.js" index.html landing/ js/version.js`. Expected: no hits (the write-back call in the new `opening.js` will use a landing entry point, not `TesseraCompose` — see Phase 2).
- [ ] **Step 2:** `git rm js/compose.js js/registry.js js/main.js`.
- [ ] **Step 3:** Replace `app.html` entirely with a redirect to `/`:

```html
<!doctype html>
<meta charset="utf-8">
<title>Tessera</title>
<meta http-equiv="refresh" content="0; url=./">
<link rel="canonical" href="./">
<p>Tessera has one door now. <a href="./">Continue to Tessera</a>.</p>
```

- [ ] **Step 4:** Edit `sw.js` CORE: remove `'js/compose.js'`, `'js/registry.js'`, `'js/main.js'`; keep `'app.html'` (still served, now a redirect); ensure `'js/open.js'`, `'js/ics.js'` present; add `'js/version.js'`. Do NOT add `landing/opening.js` or `landing/reminders.js` yet — they don't exist until Phases 1 and 3; each is added to CORE in the task that creates it, so CORE never lists a missing file (a missing entry would fail `addAll` at install). Do NOT bump `CACHE_VERSION` by hand (that is `/release`'s job at Phase 4).
- [ ] **Step 5:** `node --check sw.js`. Grep `sw.js` to confirm CORE no longer lists deleted files.
- [ ] **Step 6:** Browser smoke: open `http://localhost:<port>/app.html` → lands on `/`; open `/` → landing renders, no console errors (the landing never used the deleted files). (Unregister SW + clear caches first; the dev SW serves stale files.)
- [ ] **Step 7:** Commit: `refactor: retire app.html and the plain renderers (landing is the app)`.

---

## Phase 1 — The opening overlay (`landing/opening.js`)

**Files:**
- Create: `landing/opening.js`
- Modify: `index.html` (nav item, hero door, overlay mount, script tag), `landing/landing.css` (overlay, verify, ceremony)

Contract with the engine: `TesseraZip.readZip(bytes)` → entries; `TesseraOpen.verifyLetter(entries)` → `{ facts:{id,to,from,written,openOn,openWhenNeeded,occasion,writeback,source}, checks:[{file,ok}], warnings:[str], tokenOk, token:{enclosed,redrawnSheet,redrawnFull}, letterText, readmeText }`.

### Task 1.1: Overlay scaffold + intake

- [ ] **Step 1:** Add to `index.html`: a nav link `<a class="ld-navlink" id="nav-open" href="#open">Open a letter</a>` (near `nav-write`); an opening overlay mount `<div class="open-overlay" id="open-overlay" hidden></div>` (sibling of the setup overlay); and `<script src="js/open.js"></script>`, `<script src="js/ics.js"></script>`, `<script src="landing/opening.js"></script>` (open.js + ics.js before opening.js; opening.js after landing.js so it can call a landing entry point — see Phase 2). Also a hero door/button "Open a letter" that calls the same opener.
- [ ] **Step 2:** Create `landing/opening.js` with the module guard and an `openOverlay()` that: unhides `#open-overlay`, adds `role="dialog" aria-modal="true"`, dims the page (`body.classList.add('open-mode')`), renders the intake screen (drop zone + file input, heading "Open a letter", hint "Choose the letter's zip file, or drop it here. Nothing you open leaves this device."), and wires Escape/backdrop/close to `closeOverlay()`. `closeOverlay()` hides the overlay, removes `open-mode`, clears any ceremony timers, restores focus.
- [ ] **Step 3:** Wire intake: on file, `file.arrayBuffer()` → `TesseraZip.readZip(new Uint8Array(buf))` (try/catch → gentle re-drop message), then `TesseraOpen.verifyLetter(entries).then(renderVerify)`. Store the result on a module `view = { result }`.
- [ ] **Step 4:** Wire `#nav-open` click and the hero door to `openOverlay()` (preventDefault). Optionally honor `#open` in the URL on load to auto-open (nice-to-have; keep if trivial).
- [ ] **Step 5:** `node --check landing/opening.js`. Add `'landing/opening.js'` to the `sw.js` CORE array (now that the file exists).
- [ ] **Step 6:** Browser: click "Open a letter" → overlay opens over dimmed page; drop a QA zip → reaches a verify render (even if unstyled). Escape closes. No console errors.
- [ ] **Step 7:** Commit: `feat(open): opening overlay scaffold + intake in the landing`.

### Task 1.2: Verify screen (facts, checks, token compare, custody entry point)

- [ ] **Step 1:** `renderVerify()` builds, in landing markup/classes: heading "A letter, as it arrived."; a facts list (From / For / Sealed [dateInWords] / Opens [dateInWords or "when it is needed"] / Letter ID); the checks list (✓ "matches its fingerprint" / "does not match" with a warn class); each `warnings[]` as a gentle line; the token compare — enclosed token as `<img>` from `URL.createObjectURL(new Blob([token.enclosed], {type:'image/svg+xml'}))` (NEVER innerHTML), the re-drawn token via `holder.innerHTML = token.redrawnSheet` (our own SVG), a "show the break line large" toggle using `token.redrawnFull`; buttons: "Not now" (close), "Open it" (→ date gate), quiet "I am keeping this for someone" (→ custody, Phase 2). "Open it" disabled only if `letterText === null`.
- [ ] **Step 2:** `dateGate()`: if `facts.openOn` is a future ISO date (compare to a local `todayIso()` helper) and not `openWhenNeeded` and not asked this session for `facts.id` → render the interstitial "It asked to wait until {dateInWords}. Open anyway?" with "Not yet" (close) / "Open it" (→ ceremony); else straight to ceremony. Track `askedThisSession[id]`.
- [ ] **Step 3:** Reuse `TesseraManifest.dateInWords` for all date rendering.
- [ ] **Step 4:** Browser: drop a clean QA zip → 4 ✓ rows, facts correct, token compare shows two figures, "They match."; drop a tampered zip → letter.txt "does not match", warnings, "Open it" still enabled; drop a future-dated zip → interstitial with exact copy, "Not yet" closes, re-open → asked once.
- [ ] **Step 5:** Commit: `feat(open): verify screen — facts, checksums, token compare`.

### Task 1.3: Ceremony + reveal

- [ ] **Step 1:** `ceremony()`: offer "Read it on paper instead" (→ `TesseraPrint.printKit` with fields from `facts` + `letterText` + `readmeText` + `token:{sheet: token.redrawnSheet}` — the re-drawn token, never the enclosed) and "Read it". A `reducedMotion()` helper (`matchMedia('(prefers-reduced-motion: reduce)').matches`).
- [ ] **Step 2:** On "Read it": if reduced motion → `renderLetter()` immediately. Else render an intro (`.ceremony-intro`) with From + Sealed facts, hold ~2000ms, fade (`.ceremony-fading`, ~1000ms), then `renderLetter()`. Guard both timers: if the overlay has closed (a module `open` flag), abort — do not render over a closed overlay.
- [ ] **Step 3:** `renderLetter()`: the letter body (`textContent`, `.letter-body`), a "Done" button (close overlay), and — when `facts.id` — "Answer it forward." (Phase 2 wires the handler; for now it can close + no-op, replaced in 2.1).
- [ ] **Step 4:** `landing.css`: `.open-overlay` (full-screen takeover, dim backdrop, scroll), `body.open-mode` (optionally hide/quiet the page chrome), `.ceremony-intro`/`.ceremony-veil`/`.ceremony-fading`/`.ceremony-in` fade keyframes with `@media (prefers-reduced-motion: reduce)` disabling them, `.letter-body` (pre-wrap, readable measure), verify/checks/token-compare styling — all in the landing's tokens (Young Serif display, Courier Prime mono, `--ink`).
- [ ] **Step 5:** Browser 375px + desktop: full clean-letter path drop → verify → Open it → ceremony (facts hold, fade, letter) → Done closes; reduced-motion emulated → letter appears immediately, no intro; close mid-ceremony → no leak. Zero console errors, no horizontal overflow.
- [ ] **Step 6:** Commit: `feat(open): ceremony + reveal in the landing's skin`.

---

## Phase 2 — Write-back & custody

### Task 2.1: "Answer it forward" hands lineage to the desk

**Files:** Modify `landing.js` (writing entry point + `state` + `sealNow`), `landing/opening.js` (the button handler).

- [ ] **Step 1:** In `landing.js`, add a `writeback` field to the compose `state` (default `null`) and expose an entry point on the landing's public object (whatever `landing.js` exports/attaches; if it exposes nothing, add `window.TesseraLanding = { answerForward: answerForward }`). `answerForward(ctx)` sets `state.writeback = ctx`, closes any open overlay, and starts the writing flow (the same path `startWriting`/`nav-write` uses), so the desk opens carrying the lineage.
- [ ] **Step 2:** In `sealNow()`, include `writeback: state.writeback || null` in the `fields` object passed to `TesseraExport.seal(fields)` (export.js already routes it to the manifest + README lineage — verified by test-manifest.js). Reset `state.writeback = null` after a successful seal.
- [ ] **Step 3:** In `landing/opening.js` `renderLetter()`, wire "Answer it forward." to call `window.TesseraLanding.answerForward({ inReplyTo: facts.id, generation: (facts.writeback && facts.writeback.generation ? facts.writeback.generation : 0) + 1 })` then `closeOverlay()`.
- [ ] **Step 4:** Optional nicety: in the seal receipt, if `state.writeback`, show a small "In answer to {inReplyTo}" note.
- [ ] **Step 5:** Browser: open a clean letter → "Answer it forward." → desk opens → write + seal → the sealed reply's manifest carries `writeback` and the README shows the "In answer to:" line (read the sealed zip back via `TesseraZip.readZip` + `TesseraOpen.verifyLetter` in the console, assert `facts.writeback.inReplyTo` and generation). Re-open the reply → lineage intact.
- [ ] **Step 6:** Commit: `feat(open): answer it forward — lineage into the desk`.

### Task 2.2: Custody intake + shelf "in your keeping"

**Files:** Modify `landing/opening.js` (keep handler), `landing.js` (shelf renders custodian entries).

- [ ] **Step 1:** In `opening.js`, `keepForSomeone()`: dedupe by id against `TesseraState.getRegistry()`, else `TesseraState.addRegistryEntry({ id, to, from, written, openOn, openWhenNeeded, occasion, custodyHolder:'', custodyNote:'', keptText:null, status:'kept', sealKey:'', role:'custodian' })` from `facts`; then render a confirmation ("It is in your keeping." / "It is already in your keeping.") with a button to the shelf (close overlay, scroll to `#letters`).
- [ ] **Step 2:** In `landing.js` shelf rendering (`renderShelf`/`shelfLetters`), include custodian/kept entries. Give them a distinct treatment/label ("In your keeping — unopened") vs written letters. Ensure the existing card renderer (`envCard`) does not break on a facts-only entry (no `keptText`, `role:"custodian"`).
- [ ] **Step 2b:** If the current shelf filters to `status==='sealed'` only, widen it to also show `role==='custodian'` (status `'kept'`), grouped separately.
- [ ] **Step 3:** Browser: open a letter → "I am keeping this for someone" → confirmation → shelf shows it under "in your keeping"; reload → persists; open same letter again → "already in your keeping" (deduped).
- [ ] **Step 4:** Commit: `feat(open): keep a letter for someone — custody in the landing shelf`.

---

## Phase 3 — Reminders in the landing

### Task 3.1: `landing/reminders.js` helper

**Files:** Create `landing/reminders.js`; modify `index.html` (script tag).

- [ ] **Step 1:** Create `landing/reminders.js` (module guard, attaches `window.TesseraReminders`):

```js
/* reminders.js — calendar/card affordances for the landing shelf and the
   sealed receipt. Pure glue over the shared engine; open-when letters carry
   no date and are never offered a calendar file. */
(function (root) {
  'use strict';
  var M = root.TesseraManifest, I = root.TesseraIcs, E = root.TesseraExport, P = root.TesseraPrint;
  function icsFor(e) {
    return {
      id: e.id, to: e.to || 'someone', written: e.written, openOn: e.openOn,
      coverText: 'A letter for ' + (e.to || 'someone') + ', sealed '
        + (e.written ? M.dateInWords(e.written) : 'long ago') + '.'
    };
  }
  function downloadOne(e) { E.downloadText(I.buildIcs([icsFor(e)]), 'tessera-' + e.id + '.ics', 'text/calendar'); }
  function downloadAll(entries) {
    var dated = entries.filter(function (x) { return !x.openWhenNeeded; });
    if (dated.length) E.downloadText(I.buildIcs(dated.map(icsFor)), 'tessera-letters.ics', 'text/calendar');
  }
  function printCard(entries) { P.printCard(entries); }
  root.TesseraReminders = { icsFor: icsFor, downloadOne: downloadOne, downloadAll: downloadAll, printCard: printCard };
})(typeof self !== 'undefined' ? self : this);
```

- [ ] **Step 2:** Add `<script src="landing/reminders.js"></script>` to `index.html` (after `js/ics.js` and `js/print.js`, before `landing/landing.js`).
- [ ] **Step 3:** `node --check landing/reminders.js`. Add `'landing/reminders.js'` to the `sw.js` CORE array (now that the file exists).
- [ ] **Step 4:** Commit: `feat(reminders): landing calendar/card helper`.

### Task 3.2: Wire reminders into shelf + sealed receipt

**Files:** Modify `landing.js` (shelf cards, shelf footer, seal receipt), `landing/landing.css` (button styling).

- [ ] **Step 1:** On each dated shelf card (`!openWhenNeeded`), add an "Add to calendar" affordance → `TesseraReminders.downloadOne(e)`. Open-when cards omit it.
- [ ] **Step 2:** At the shelf level, add "Calendar file (all dates)" → `TesseraReminders.downloadAll(shelfEntries)` (only if any dated) and "Print a wallet card" → `TesseraReminders.printCard(shelfEntries)`.
- [ ] **Step 3:** On the sealed receipt (after `sealNow`), if `!openWhenNeeded`, add "Add to calendar" → `TesseraReminders.downloadOne(sealed.fields)`.
- [ ] **Step 4:** Style the buttons in `landing.css` to match the landing's quiet button treatment.
- [ ] **Step 5:** Browser: shelf shows calendar on dated cards (not open-when); "Calendar file (all dates)" and "Print a wallet card" work (verify ICS bytes via console `TesseraIcs`; wallet card = two cards + dashed cut, ink-light); sealed receipt offers calendar for a dated letter. No external requests.
- [ ] **Step 6:** Commit: `feat(reminders): calendar + wallet card in the landing`.

---

## Phase 4 — QA, docs, release

### Task 4.1: Full gates + docs

- [ ] **Step 1:** Gate 1: `node --check` every touched JS; run all six suites (`test-manifest`, `test-zip`, `test-token`, `test-state`, `test-open`, `test-ics`) — all green, fixtures byte-identical (`git status --porcelain tools/fixtures/` empty).
- [ ] **Step 2:** Gate 2: `node tools/prose-check.js` over new letter-facing copy (nav label, overlay headings/buttons, custody confirmation). Read every WARN; justify code-comment em-dashes.
- [ ] **Step 3:** Gate 3 browser walkthrough, 375px first then desktop, SW unregistered/caches cleared first: write at the desk → seal → shelf → add-to-calendar + wallet card; open a received letter (drop → verify → ceremony → reveal) → answer forward → seal reply → re-open reply, lineage intact; tamper + early-open paths; custody → "in your keeping"; reduced motion; both palettes; `app.html` → `/`; zero console errors; network log shows no external origins.
- [ ] **Step 4:** Update docs: `docs/features/opening.md` (opening is a landing overlay, not app.html `#open`); `docs/engineering/architecture.md` (single front end; triple leg in `version.js`); `docs/decisions.md` (unification, app.html retirement, LOCAL_VERSION relocation, century-test "works cold = paper, not a plain web view" rationale); `docs/PROGRESS.md`.
- [ ] **Step 5:** `/century-audit` — format unchanged; letter rows carry from v0.2; record the retire-app.html rationale. `/spec-sync` — expect clean (no format change).
- [ ] **Step 6:** Commit docs: `docs: front end unified — opening + reminders live in the landing`.

### Task 4.2: Release v0.3.0

- [ ] **Step 1:** `/release` — refuses without green gates (Task 4.1). Bump the triple together: `version.json` → `0.3.0`, `LOCAL_VERSION` in `js/version.js` → `'0.3.0'`, `CACHE_VERSION` in `sw.js` → `'tessera-v0.3.0'`.
- [ ] **Step 2:** Release note + century-audit table in `docs/PROGRESS.md`; commit on `dev`.
- [ ] **Step 3:** Ship: fast-forward `main` from `dev`, push both; verify the live site serves `0.3.0` and both the desk and the opening overlay work.
- [ ] **Step 4:** Update the Ariadne vault status line.

---

## Notes for the executor
- Match the landing's existing DOM idiom and class names (inspect `landing.js`/`landing.css` first); reuse the setup-overlay pattern for the opening overlay (`role="dialog"`, `aria-modal`, focus handling, Escape/backdrop close).
- Never inject a foreign SVG via `innerHTML`; the enclosed token is shown only as a `blob:` `<img>`. The re-drawn token (our own SVG) may use `innerHTML`.
- Avoid `Date.now`/locale in anything that touches the pure modules; the overlay's own `todayIso()` is browser-side and fine.
- Do not bump `CACHE_VERSION` outside `/release`.
- Commit after each task; keep `dev` the working branch.
