# Print Base Look Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vendor Young Serif + Courier Prime into an app-owned `fonts/` folder and make them the print kit's base typography, per the approved spec `docs/superpowers/specs/2026-07-10-print-base-look-design.md`.

**Architecture:** Pure CSS change riding existing class hooks — `js/print.js` already names every surface (`.cover-kicker`, `.cover-title`, `.cover-plea`, `.sheet-heading`, `.readme-pre`, `.sheet-footer`), so the face mapping lands entirely in `style.css` via two new custom properties (`--display`, `--typewriter`) with the current system stacks kept as fallbacks. `sw.js` precaches the font files (CACHE_VERSION untouched — the triple moves only via `/release`). A temporary `specimen.html` (never precached, never linked) lets the author decide the letter-body face on paper; the letter body itself does not change in this plan.

**Tech Stack:** Vanilla CSS `@font-face` with relative file URLs (no network fetch — century check A), service-worker precache, no build step.

**Not changing (hard rails):** `js/manifest.js`, `js/zip.js`, `js/token.js`, `js/export.js`, `js/print.js`, fixtures, `index.html`, the landing surface, `version.json` / `LOCAL_VERSION` / `CACHE_VERSION`. Token SVG keeps generic fonts only (`tools/test-token.js` enforces). `.letter-body` font-family is NOT set in this plan — that is the author's paper decision (Task 7).

---

### Task 1: Vendor the fonts into `fonts/`

**Files:**
- Create: `fonts/YoungSerif-Regular.ttf`, `fonts/CourierPrime-Regular.ttf`, `fonts/CourierPrime-Bold.ttf`, `fonts/CourierPrime-Italic.ttf`, `fonts/OFL-YoungSerif.txt`, `fonts/OFL-CourierPrime.txt` (copies — the landing keeps its own set; it stays a separable surface)

- [ ] **Step 1: Copy the six files from the landing**

Run (PowerShell, repo root):
```powershell
New-Item -ItemType Directory -Force fonts | Out-Null
Copy-Item landing\fonts\* fonts\
Get-ChildItem fonts | Select-Object Name, Length
```
Expected: 6 files — 4 `.ttf` (YoungSerif-Regular 106608, CourierPrime-Regular 71188, CourierPrime-Bold 72856, CourierPrime-Italic 79980 bytes) + 2 `OFL-*.txt`.

- [ ] **Step 2: Verify the copies are byte-identical**

Run:
```powershell
Get-FileHash landing\fonts\*.ttf, fonts\*.ttf -Algorithm SHA256 | Sort-Object Hash | Format-Table Hash, Path -AutoSize
```
Expected: 8 rows in 4 adjacent identical-hash pairs (each landing TTF hash equals its `fonts/` twin).

- [ ] **Step 3: Commit**

```powershell
git add fonts
git commit -m "feat(fonts): vendor Young Serif + Courier Prime as app-owned faces (OFL)"
```

---

### Task 2: `@font-face` + kit face mapping in `style.css`

**Files:**
- Modify: `style.css` (font-face block before `:root`; two vars in `:root` at lines 2–7; six selector edits in the print-overlay section, lines 82–102)

No JS is touched; the screen print preview and the print engine share these classes, so §4 of the spec (preview parity) is automatic.

- [ ] **Step 1: Add the `@font-face` rules**

Insert directly after the header comment on line 1 of `style.css`:

```css
/* App-owned faces (fonts/, OFL). Local relative URLs only — never a network
   fetch (century check A). System stacks remain as fallbacks: a copy with
   fonts/ stripped still prints sanely (century check C). */
@font-face {
  font-family: 'Young Serif';
  src: url('fonts/YoungSerif-Regular.ttf') format('truetype');
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Courier Prime';
  src: url('fonts/CourierPrime-Regular.ttf') format('truetype');
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Courier Prime';
  src: url('fonts/CourierPrime-Bold.ttf') format('truetype');
  font-weight: 700; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Courier Prime';
  src: url('fonts/CourierPrime-Italic.ttf') format('truetype');
  font-weight: 400; font-style: italic; font-display: swap;
}
```

- [ ] **Step 2: Add the two face variables to `:root`**

In the `:root` block, after the `--ui` line (`--ui: system-ui, sans-serif;`), add:

```css
  --display: 'Young Serif', Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Times New Roman', serif;
  --typewriter: 'Courier Prime', ui-monospace, monospace;
```

(Do not touch `--serif` — the letter body keeps it until the specimen decision.)

- [ ] **Step 3: Map the kit surfaces**

Six edits in the print-overlay section of `style.css`:

`.sheet-footer` — replace `font-family: system-ui, sans-serif;` so the block reads:
```css
.sheet-footer { margin-top: 1.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(33,29,22,0.25);
                font-family: var(--typewriter); font-size: 8.5pt; color: rgba(33,29,22,0.6);
                display: flex; justify-content: space-between; }
```

`.cover-kicker` — replace `font-family: system-ui, sans-serif;`:
```css
.cover-kicker { font-family: var(--display); font-size: 9pt; letter-spacing: 0.14em; text-transform: uppercase; }
```

`.cover-title` — add the family:
```css
.cover-title { font-family: var(--display); font-weight: normal; font-size: 1.6rem; }
```

`.cover-plea` — add the family (Young Serif has no italic; the browser obliques it — acceptance is a Gate 3 eyeball, fallback is dropping the italic there if it prints badly):
```css
.cover-plea { font-family: var(--display); font-style: italic; }
```

`.readme-pre` — replace `font-family: ui-monospace, monospace;`:
```css
.readme-pre { white-space: pre-wrap; font-family: var(--typewriter); font-size: 9.5pt; line-height: 1.5; }
```

`.sheet-heading` — add the family (covers both "The token" and the register heading, per `js/print.js:74` and `js/print.js:100`):
```css
.sheet-heading { font-family: var(--display); font-weight: normal; }
```

- [ ] **Step 4: Sanity-check no other surface moved**

Run:
```powershell
git diff --stat
```
Expected: exactly one file, `style.css`. Also confirm by search that `.letter-body` and `.token-holder` blocks are unchanged in the diff (`git diff style.css` shows no hunk touching them).

- [ ] **Step 5: Commit**

```powershell
git add style.css
git commit -m "feat(print): landing typography becomes the kit's base look"
```

---

### Task 3: Precache the fonts in `sw.js`

**Files:**
- Modify: `sw.js:7-22` (the `CORE` array only — `CACHE_VERSION` stays `'tessera-v0.1.0'`)

- [ ] **Step 1: Add the six font entries to `CORE`**

After the `'data/occasions.js'` entry, extend the array:

```js
var CORE = [
  './',
  'index.html',
  'style.css',
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

(The two OFL text files ship in the repo and any export, but are not needed offline at print time — leave them out of the precache. `specimen.html` must NOT be added.)

- [ ] **Step 2: Syntax gate on the touched JS**

Run:
```powershell
node --check sw.js
```
Expected: silent exit, code 0.

- [ ] **Step 3: Commit**

```powershell
git add sw.js
git commit -m "feat(sw): precache the vendored fonts so offline printing keeps its faces"
```

Note for the executor: the byte-changed `sw.js` re-runs `install` on next load and `addAll`s the fonts into the existing `tessera-v0.1.0` cache. During dev you still need the usual SW unregister/hard-reload after shell edits (known friction, PROGRESS.md log 2026-07-10 evening).

---

### Task 4: The specimen sheet (temporary, author decides on paper)

**Files:**
- Create: `specimen.html` (repo root — served by the dev server, NOT in `sw.js` CORE, NOT linked from any nav; deleted in Task 7 after the decision)

- [ ] **Step 1: Write `specimen.html`**

Full contents:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Letter-body specimen — print once, choose, then delete this file</title>
<style>
  @font-face {
    font-family: 'Young Serif';
    src: url('fonts/YoungSerif-Regular.ttf') format('truetype');
    font-weight: 400; font-style: normal; font-display: swap;
  }
  body { margin: 2rem auto; max-width: 46rem; padding: 0 2rem;
         background: #fdfbf5; color: #211d16; }
  .how { font: 0.9rem/1.5 system-ui, sans-serif; color: rgba(33,29,22,0.6);
         border-bottom: 1px solid rgba(33,29,22,0.25); padding-bottom: 1rem; }
  h2 { font: 10pt/1.4 system-ui, sans-serif; letter-spacing: 0.06em;
       color: rgba(33,29,22,0.6); margin: 2.2rem 0 0.8rem; }
  .sample { max-width: 65ch; font-size: 11.5pt; line-height: 1.55; }
  .sample p { margin: 0 0 0.9em; }
  .face-a { font-family: 'Young Serif', serif; }
  .face-b { font-family: Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Times New Roman', serif; }
  @page { margin: 15mm; }
  @media print { .how { display: none; } body { margin: 0; max-width: none; } }
</style>
</head>
<body>
<p class="how">Print this page once on the letter paper you actually use. Read both
settings at arm's length in daylight. A is Young Serif, B is the current system
serif stack. Record the winner in docs/decisions.md, apply it, then delete this
file. If neither survives paper, EB Garamond is the recorded fallback: vendor it,
re-run this page once. (This file is scratch: not precached, not linked, not part
of the kit.)</p>

<h2>A — Young Serif, 11.5pt</h2>
<div class="sample face-a">
<p>By the time you read this, the house will have settled another inch and the
garden will have made its own decisions. I am writing at the kitchen table on an
ordinary evening, with the radio on low, because ordinary evenings are the ones
I most want you to have proof of.</p>
<p>Whatever has changed between my now and yours, one thing I can vouch for:
someone sat still long enough to think of you at length, and then folded the
thinking into an envelope. Numerals age strangely, so check them here:
1234567890, and the pairs worth squinting at, Il1, O0, rn m.</p>
</div>

<h2>B — system serif stack, 11.5pt</h2>
<div class="sample face-b">
<p>By the time you read this, the house will have settled another inch and the
garden will have made its own decisions. I am writing at the kitchen table on an
ordinary evening, with the radio on low, because ordinary evenings are the ones
I most want you to have proof of.</p>
<p>Whatever has changed between my now and yours, one thing I can vouch for:
someone sat still long enough to think of you at length, and then folded the
thinking into an envelope. Numerals age strangely, so check them here:
1234567890, and the pairs worth squinting at, Il1, O0, rn m.</p>
</div>
</body>
</html>
```

- [ ] **Step 2: Confirm it renders both faces**

Start the dev server (launch config "tessera" / `node tools/serve.js`), open `http://localhost:8137/specimen.html`. Expected: block A visibly heavier/rounder than block B (Young Serif loaded, not the fallback); one page in the print preview of the browser's print dialog.

- [ ] **Step 3: Commit**

```powershell
git add specimen.html
git commit -m "chore(specimen): one-page letter-body specimen for the paper decision (temporary)"
```

---

### Task 5: Gates

**Files:** none modified — verification only. Definition of done lives in `docs/engineering/testing.md`.

- [ ] **Step 1: Gate 1 — syntax + module tests**

Run:
```powershell
node --check sw.js
node tools/test-manifest.js
node tools/test-zip.js
node tools/test-token.js
```
Expected: all green (24 + 9 + 21 tests as of the 2026-07-10 audit); test-token.js unchanged proves the token SVG kept generic fonts (fixtures are law — any diff here is a stop-and-report, never a regeneration).

- [ ] **Step 2: Gate 2 — prose**

Run:
```powershell
node tools/prose-check.js
```
Expected: clean apart from the two known justified WARNs (landing placeholder glyphs, recorded in decisions.md). The specimen text above contains no em-dashes and no anaphora stacking, so no new findings.

- [ ] **Step 3: Gate 3 — browser pass (starts at 375px)**

With the dev server running and the SW unregistered (or a hard reload after it reinstalls):
1. Full loop at 375px, then desktop: compose → seal a test letter → print preview.
2. In DevTools, on the print preview, check computed `font-family` actually *rendered* (Rendered Fonts panel): cover kicker/title/plea + sheet headings = Young Serif; instructions `readme-pre` + all sheet footers = Courier Prime; letter body = the system serif (unchanged).
3. Both print sizes: `Ctrl+P`, paper A4 then Letter — no clipped content, page breaks intact (one sheet per page), ink-light holds.
4. Offline: DevTools → Network → Offline, reload, reopen the print preview via a registry reprint. Expected: faces still correct (fonts served from the SW cache), zero console errors.
5. Register page (registry → print register): heading in Young Serif, table unchanged.

- [ ] **Step 4: Format drift + century spot-check**

Run the project skills `/spec-sync` (must come back clean — no format surface moved) and `/century-audit` spot-check: no external requests at compose/export/print (DevTools network log shows only same-origin), token checks unchanged.

---

### Task 6: Docs, same day (canon rule: code and docs may not disagree overnight)

**Files:**
- Modify: `docs/design-language.md:17` (§Typography — the revisit clause is now exercised)
- Modify: `docs/features/print-kit.md:16` (print rules line names the faces)
- Modify: `docs/decisions.md` (append-only entry)
- Modify: `docs/PROGRESS.md` (log entry, newest first)

- [ ] **Step 1: Amend design-language.md §Typography**

Replace the single bullet on line 17 with:

```markdown
- **Faces (since 2026-07-10):** the app owns two OFL faces in `fonts/` — **Young Serif** (display: cover sheet, sheet headings) and **Courier Prime** (typewriter voice: instructions page, sheet footers) — vendored from the landing so screen and paper share one identity. Vendored ≠ dependent: `@font-face` uses local file URLs only, and every use keeps the system stack as fallback, so a copy with `fonts/` stripped still prints sanely. The **letter body** stays on the system serif stack `Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Times New Roman', serif` until the specimen print decides it on paper (candidates: Young Serif 11.5pt vs the system stack; recorded fallback if both disappoint: EB Garamond). Decision by print-output quality, recorded in decisions.md.
```

- [ ] **Step 2: Align print-kit.md's print-rules line**

On `docs/features/print-kit.md:16`, replace the trailing `serif stack, sizes in `pt`` with `app-owned faces with system-stack fallbacks (design-language.md §Typography), sizes in `pt``, leaving the rest of the line intact.

- [ ] **Step 3: Append the decisions.md entry**

Match the file's existing entry format (read its tail first), content:

```markdown
## 2026-07-10 — Print kit adopts the landing faces (revisit clause exercised)
The design-language §Typography revisit clause (vendor a single OFL face, decide
by print-output quality) is exercised early, at v0.1 instead of v0.3, because the
landing redesign gave the product its typographic identity and the physical
walkthrough supplied print evidence. `fonts/` now owns Young Serif + Courier
Prime (OFL, copied from the landing, which keeps its own set). Base mapping:
display = cover + headings, typewriter = instructions + footers. The letter body
is deliberately undecided until the one-page specimen is printed and judged on
paper; EB Garamond is the recorded fallback if both candidates disappoint.
Token SVG untouched (fixtures are law). CACHE_VERSION untouched (triple moves
via /release).
```

- [ ] **Step 4: PROGRESS.md log entry**

Add at the top of the Log section:

```markdown
- **2026-07-10 (print base look)** — Print kit typography aligned with the landing:
  `fonts/` vendors Young Serif + Courier Prime (OFL), style.css maps display/typewriter
  faces onto the existing sheet classes with system-stack fallbacks, sw.js precaches the
  TTFs (CACHE_VERSION untouched). Letter body awaits the specimen print (author, paper).
  Gates green; /spec-sync clean. Spec: superpowers/specs/2026-07-10-print-base-look-design.md.
```

- [ ] **Step 5: Commit**

```powershell
git add docs/design-language.md docs/features/print-kit.md docs/decisions.md docs/PROGRESS.md
git commit -m "docs: print base look lands — typography canon, decision, progress"
```

---

### Task 7: The paper decision (author checkpoint — blocks only the letter body)

**Files:**
- Modify (conditional): `style.css` (`.letter-body` + the `@media print` `.letter-body` rule)
- Delete: `specimen.html`
- Modify: `docs/decisions.md` (append the verdict), `docs/design-language.md:17` (letter-body sentence)

This task cannot be executed by an agent — the author prints `specimen.html` once and judges on paper. Follow-through by outcome:

- [ ] **If A (Young Serif) wins:** add `font-family: var(--display);` to `.letter-body` in `style.css`; append the verdict to decisions.md; update the letter-body sentence in design-language.md §Typography; delete `specimen.html`; re-run Task 5 Steps 1–3; commit `feat(print): letter body set in Young Serif (specimen verdict)`.
- [ ] **If B (system stack) wins:** no CSS change; append the verdict to decisions.md; update design-language.md to say the body face is decided (system stack, by specimen); delete `specimen.html`; commit `docs: letter body stays on the system stack (specimen verdict)`.
- [ ] **If neither:** vendor `fonts/EBGaramond-Regular.ttf` + its OFL (same pattern as Task 1), add its `@font-face` (same pattern as Task 2 Step 1), add it to `CORE` in sw.js, regenerate the specimen with EB Garamond as face A, author re-prints once. Then resolve as above and delete `specimen.html`.

---

## Execution notes

- Order: Tasks 1→2→3 are sequential (CSS references `fonts/`, SW references both). Task 4 is independent after Task 1. Task 5 gates everything; Task 6 same day as Tasks 1–5; Task 7 is the author's, later.
- Every commit lands on `dev`. Nothing here touches `main` or triggers `/release`.
- Stop conditions: any fixture diff in `tools/test-token.js` (format event — stop, report); any `/spec-sync` finding (same); Young Serif rendering illegibly at 9pt kicker size on paper is Task 7 evidence, not a reason to improvise new sizes.
