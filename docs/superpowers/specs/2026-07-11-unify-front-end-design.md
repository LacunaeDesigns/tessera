# Unify the front end — the landing becomes the whole app (design)

**Date:** 2026-07-11 · **Status:** approved (brainstorm), ready for plan
**Spec version:** no format change (the Tessera format is untouched; `tessera` stays `0.1`)

## Problem

Tessera has two front ends. `index.html` (the redesigned landing) is what visitors
see; it can write and seal a letter but nothing more. `app.html` (the plain original
shell) holds everything built since — the opening door (verify → ceremony →
write-back), custody intake, and the reminders (calendar export + wallet card) — but
looks like the old design and is reachable only through a quiet "Plain paper" link.
The two also duplicate the compose UI and the letters shelf. Result: the beautiful
front door can write but cannot receive, and the new features are invisible to anyone
who never clicks "Plain paper".

## Goal

One front end. What a visitor sees on the landing *is* the whole app: write at the
typewriter desk, seal, open a received letter with ceremony, answer it forward, keep
one for someone, and carry the dates out to a calendar or a printed card — all in the
landing's visual language. `app.html` retires.

## Decisions (from the brainstorm)

1. **Retire `app.html`.** The landing is the only front end. `app.html` becomes a
   redirect to `/` so any saved link still lands home.
2. **The typewriter desk is the writing experience.** The plain 6-step wizard
   (`compose.js`) retires with `app.html`.
3. **Opening lives in a focused overlay**, not a scroll section and not a new router —
   the same full-screen-takeover pattern the setup wizard already uses, so the ceremony
   gets its quiet. Entered from an "Open a letter" nav item (and hero door).
4. **Reuse the tested logic; render fresh in the landing's skin (Approach 1).** All
   format-critical work stays in the pure, tested modules; only presentation is new.

## Architecture

### Kept (the shared engine — pure, dual-env, fixture/unit-tested)
`manifest.js`, `token.js`, `zip.js`, `export.js`, `state.js`, `ics.js`, `print.js` +
`print.css`. Unchanged except `export.js` already threads `writeback` (done in v0.2).

### `open.js` → pruned to a pure verification module
Keep the DOM-free core that `tools/test-open.js` exercises in Node: `verifyLetter`,
`readmeFacts`, and the small `asText`/parse helpers they need. Delete the browser
rendering that was app.html-only (`start`, `renderIntake`, `intake`, `renderVerify`,
`dateGate`, `renderWait`, `reveal`, `readOnPaper`, `ceremony`, `renderLetter`,
`keepForSomeone`, the `hashchange` chrome-restore listener). The exported api narrows
to `{ verifyLetter, readmeFacts }`. `test-open.js` must stay green unchanged.

### Deleted (dead once `app.html` retires)
`app.html` (→ redirect), `js/compose.js`, `js/registry.js`, `js/main.js`. None carry
unit tests. The behaviours still needed (write-back lineage into compose, calendar
wiring, custody, verification-driven ceremony) move into the landing, reusing the pure
modules.

### Born
- **`landing/opening.js`** — the opening overlay UI in the landing's language. Owns the
  overlay DOM and the flow; calls `TesseraZip.readZip` + `TesseraOpen.verifyLetter` for
  all format work. Self-contained unit (keeps `landing.js` from swelling further).
- **`landing/reminders.js`** — small helpers: `icsFor(entry)` (registry entry → the ICS
  letter shape with a calm coverText), `downloadOne(entry)`, `downloadAll(entries)`,
  `attach(button, entry)`. Called by the shelf and the sealed receipt in `landing.js`.
- **`js/version.js`** — new home for `LOCAL_VERSION` (relocated from the deleted
  `main.js`). Does the `file://`-guarded service-worker registration and fills the
  version display. Loaded by `index.html`. **The versioning triple's second leg moves
  from `js/main.js` to `js/version.js`** — a companion edit to `CLAUDE.md`,
  `docs/engineering/architecture.md`, and the `/release` skill's triple definition, done
  in the same change (never silently).

### Edited
- **`index.html`** — script tags (drop `main.js`; the landing already loads the engine;
  add `js/open.js`, `js/ics.js`, `js/version.js`, `landing/reminders.js`,
  `landing/opening.js`); nav gains "Open a letter"; a hero door for opening; the opening
  overlay's mount point.
- **`landing.js`** — (a) `sealNow()` includes `writeback` in the seal fields; (b) an
  entry point the opening overlay calls to start a reply at the desk carrying lineage;
  (c) the shelf renders custodian (`role:"custodian"`, `status:"kept"`) entries under an
  "in your keeping" treatment; (d) shelf cards + shelf footer + sealed receipt gain the
  reminder affordances via `landing/reminders.js`.
- **`landing.css`** — opening overlay, verify panel, ceremony (fade + reduced-motion),
  reminder buttons, custodian card treatment — all in the existing token system
  (`--ink`, Young Serif display, Courier Prime typewriter).
- **`sw.js` CORE** — drop `app.html`, `compose.js`, `registry.js`, `main.js`; add
  `js/open.js`, `js/ics.js`, `js/version.js`, `landing/reminders.js`,
  `landing/opening.js`. Release-gated (CACHE_VERSION bump via `/release`).

## The opening overlay (`landing/opening.js`) — states

A full-screen takeover over a dimmed page (reusing the setup overlay's `role="dialog"`,
`aria-modal`, focus handling, Escape/backdrop/Done to close).

1. **Intake** — heading "Open a letter", a drop zone + file picker. Copy from the app's
   `renderIntake`. On file: `readZip` → `verifyLetter`. Unreadable file → gentle message,
   re-drop (mirrors `renderIntake(problem)`).
2. **Verify** — facts (From / For / Sealed / Opens, dates in words), the ✓/warn checksum
   rows, and the token compare: the **enclosed** SVG shown only via a `blob:` `<img>`
   (never injected as innerHTML), the **re-drawn** token from the re-derived seed shown
   beside it, plus the "show the break line large" toggle. A tampered letter shows its
   warnings and is **never blocked** from reading. Buttons: "Not now" (close), "Open it",
   and quiet "I am keeping this for someone".
3. **Date gate** — if `openOn` is future and not yet asked this session for this id:
   "It asked to wait until {date-in-words}. Open anyway?" — "Not yet" (close) / "Open it".
   Asked once per letter per session.
4. **Ceremony** — offer "Read it on paper instead" (→ `TesseraPrint.printKit` with the
   **re-drawn** token, never the enclosed SVG) and "Read it". Reading here dims the page,
   holds the sealed facts ~2s, then fades in the letter. `prefers-reduced-motion`
   collapses to a single quiet appearance. Timers stand down if the overlay closes
   mid-breath.
5. **Reveal** — the letter body. Buttons: "Done" (close overlay) and, when the id is
   readable, "Answer it forward." (→ write-back).

All facts come from `TesseraOpen.verifyLetter`'s result (`facts`, `checks`, `warnings`,
`token`, `letterText`, `readmeText`, `facts.writeback`).

## Write-back, custody, reminders

- **Write-back.** "Answer it forward." closes the overlay and starts the landing's
  writing flow carrying `writeback: { inReplyTo: facts.id, generation:
  (facts.writeback?.generation || 0) + 1 }`. `landing.js` holds it on its `state` and
  `sealNow()` passes it in the seal fields; `export.js` already routes it into the
  manifest + the README lineage line (tested in v0.2). A small "In answer to {id}" note
  appears in the seal receipt.
- **Custody.** "I am keeping this for someone" records a facts-only entry via
  `TesseraState.addRegistryEntry({ …facts, keptText:null, status:"kept",
  role:"custodian" })`, deduped by id, then a confirmation and a path to the shelf. The
  shelf shows custodian entries under an "In your keeping" treatment (unopened, no letter
  text).
- **Reminders.** Dated letters (not open-when) offer "Add to calendar" on each shelf card
  and on the sealed receipt; the shelf offers "Calendar file (all dates)" and "Print a
  wallet card". All via `landing/reminders.js` → `TesseraIcs` / `TesseraExport.downloadText`
  (`text/calendar`) / `TesseraPrint.printCard`. Open-when letters are never offered a
  calendar file (no date to remember).

## Data flow (unchanged invariants)

One seal path (`export.js`), one storage key (`tessera_v1` via `state.js`, schema 3 with
`role`), one print engine (`print.js`/`print.css`), one token derivation (`token.js`).
The opening overlay reads dropped bytes locally; nothing leaves the device. `file://`
still works (SW registration stays guarded, now in `version.js`).

## Error handling
Unreadable/foreign zip → clear message, re-drop, no throw. Tampered letter → warnings
shown, reading allowed. Missing manifest → README fallback (already in `verifyLetter`).
Storage blocked → seal/paper unaffected (state.js already swallows). Foreign SVG never
reaches `innerHTML` (enclosed token shown only as a `blob:` image).

## Testing & QA
- **Unit (Gate 1):** all six suites stay green; `test-open.js` must pass **unchanged**
  after the prune (proves the verification core is intact). No new pure module needs a
  suite (overlay/reminders are presentation), but if `icsFor` grows real logic it gets a
  couple of asserts in `test-ics.js`.
- **Prose (Gate 2):** new letter-facing copy (nav label, overlay headings, buttons,
  custody confirmation) runs through `prose-check.js`.
- **Browser (Gate 3), 375px first then desktop:** full loop in the landing — write at the
  desk → seal → shelf → add-to-calendar + wallet card; open a received letter (drop →
  verify → ceremony → reveal) → answer forward → seal the reply → re-open the reply and
  confirm the lineage; tamper and early-open paths; custody intake → shelf "in your
  keeping"; reduced motion; both palettes; zero console errors; **no external requests**;
  `app.html` redirects to `/`.
- **Century audit:** the format is unchanged, so the letter-level rows carry from v0.2.
  Retiring the plain web view does **not** weaken the century test — "works cold" is
  satisfied by the printed kit + README, not by a plain HTML page. Record this in
  `decisions.md`.

## Release
This ships the reminders feature (unreleased) **and** the unified front end together.
Minor bump (**v0.3.0**) via `/release`: versioning triple moved together (`version.json`,
`LOCAL_VERSION` now in `js/version.js`, `CACHE_VERSION`), SW CORE updated, notes + audit
table, `dev` → `main` fast-forward. The triple-relocation edits to `CLAUDE.md` /
`architecture.md` / the `/release` skill land in this change.

## Docs to update
`decisions.md` (unification + `app.html` retirement + `LOCAL_VERSION` relocation +
century-test rationale), `docs/features/opening.md` (opening now a landing overlay, not
app.html `#open`), `docs/engineering/architecture.md` (single front end; triple leg
moved), `docs/PROGRESS.md`. `SPEC.md`/spec docs unchanged (no format change).

## Out of scope
No format change. No new occasions/prompt copy. Encryption and envelope-themes remain
their own later plans. The landing's typewriter/sound engine and marketing sections are
untouched except for the new nav item and hero door.
