# Token Generation 2 (Watercolor Mosaic) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the token's tile field with the author-selected A2 watercolor-underwash art (finer per-letter ring mosaic over seeded pastel washes), while every previously sealed letter keeps verifying clean via a legacy-renderer fallback.

**Architecture:** The current renderer is preserved byte-for-byte as `js/token-legacy.js` (global `TesseraTokenLegacy`). The validated A2 candidate (scratchpad `variant-2.js`, already determinism-verified twice — by its author and by the compare harness) becomes `js/token.js`. `verifyLetter` in `js/open.js` tries current then legacy; a byte-match on either is a clean pass. Old fixture bytes are preserved under legacy names (renamed, never regenerated); gen-2 fixtures are born. Spec: [../specs/2026-07-11-token-watercolor-design.md](../specs/2026-07-11-token-watercolor-design.md).

**Tech Stack:** Vanilla dual-env JS, seeded sfc32, plain SVG 1.1. No build, no deps.

**Invariants:** determinism (same seed ⇒ byte-identical, both generations); `breakLine`/halves/sheet assembly byte-identical to today in BOTH files; no scripts/filters/external refs/fonts in token output; `tessera` spec version stays 0.1; CACHE_VERSION moves only via `/release`.

**Scratchpad source:** `C:/Users/rika.lim/AppData/Local/Temp/claude/C--Users-rika-lim-Documents-tessera/809a6dd0-719a-4dd8-8673-f69ca1bd7111/scratchpad/variant-2.js`

---

### Task 1: Preserve the legacy renderer

**Files:**
- Create: `js/token-legacy.js` (from current `js/token.js`)
- Test: `tools/test-token.js` (Task 3 covers it; this task only creates the file)

- [ ] **Step 1:** Copy the current renderer: `cp js/token.js js/token-legacy.js`.
- [ ] **Step 2:** In `js/token-legacy.js`, change ONLY the header comment and the browser global (the `module.exports` branch stays identical):

Replace the header (lines 1–4) with:

```js
/* token-legacy.js — token art generation 1 ("mosaic ring", 2026-07-10),
   preserved forever so letters sealed before generation 2 keep verifying
   byte-identical (docs/features/token.md: old tokens never become wrong).
   Frozen: do not edit. Same determinism contract as token.js. */
```

Replace the final global line `else root.TesseraToken = api;` with:

```js
  else root.TesseraTokenLegacy = api;
```

- [ ] **Step 3:** Verify the freeze — the two files must differ ONLY in those two places:

Run: `diff <(git show HEAD:js/token.js) js/token-legacy.js`
Expected: exactly two hunks (header comment, global name), nothing else.

- [ ] **Step 4:** `node --check js/token-legacy.js` and a determinism spot-check:

Run: `node -e "const T=require('./js/token-legacy.js'); const s='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; const a=T.renderTokenSvg(s,'TSR-e3b0-c442'), b=T.renderTokenSvg(s,'TSR-e3b0-c442'); console.log('det:', a.sheet===b.sheet);"`
Expected: `det: true`

- [ ] **Step 5:** Commit: `git add js/token-legacy.js && git commit -m "chore(token): preserve generation 1 as token-legacy.js (frozen)"`

### Task 2: Rename the fixtures (bytes preserved) and install generation 2

**Files:**
- Rename: `tools/fixtures/token-fix1.svg` → `tools/fixtures/token-legacy-fix1.svg`, `token-fix2.svg` → `token-legacy-fix2.svg`
- Replace: `js/token.js` (with the validated variant-2)

- [ ] **Step 1:** `git mv tools/fixtures/token-fix1.svg tools/fixtures/token-legacy-fix1.svg && git mv tools/fixtures/token-fix2.svg tools/fixtures/token-legacy-fix2.svg` (git-mv preserves bytes and history; this is the format event's paper trail).
- [ ] **Step 2:** Copy the validated candidate over the live renderer: `cp <scratchpad>/variant-2.js js/token.js` (scratchpad path in the header above).
- [ ] **Step 3:** Fix the header comment in the new `js/token.js` (it still says "variant-2"). Replace the header block with:

```js
/* token.js — the tessera token, art generation 2 ("watercolor mosaic",
   2026-07-11): deterministic two-half SVG from a seed hex. Under the tile
   field, 3-5 soft pastel washes (blobby seeded polygons, fill-opacity
   0.5-0.7) pool like watercolor pigment and show through the grout gaps.
   Above them, a finer seeded ring mosaic (4-5 rings, per-seed sector
   counts) keeps an ink-dark skeleton so the disk survives grayscale
   printing and decades of fading. Generation 1 is frozen in
   token-legacy.js; verification accepts either. Pure, dual browser/Node.
   Determinism contract: no Math.random, no Date, no locale; all floats
   through r2(); all iteration orders explicit. */
```

- [ ] **Step 4:** `node --check js/token.js`. Confirm the global is `root.TesseraToken` (unchanged) and the api is `{ renderTokenSvg, rngFromSeed }`: `grep -n "root.TesseraToken\|module.exports\|var api" js/token.js`.
- [ ] **Step 5:** Do NOT commit yet — Task 3 updates the suite first so the tree never has a red gate committed.

### Task 3: Rework the token suite for two generations; birth the gen-2 fixtures

**Files:**
- Modify: `tools/test-token.js` (full rewrite below)
- Create (born by first run): `tools/fixtures/token-fix1.svg`, `tools/fixtures/token-fix2.svg`

- [ ] **Step 1:** Replace `tools/test-token.js` with:

```js
/* test-token.js — Gate 1 tests for the token renderers: generation 2
   (js/token.js, watercolor mosaic) and the frozen generation 1
   (js/token-legacy.js, mosaic ring). Determinism fixtures, structural
   validity, forbidden-source scan (docs/features/token.md).
   A fixture diff is a format event — never regenerate silently. */
'use strict';
const T = require('../js/token.js');
const TL = require('../js/token-legacy.js');
const M = require('../js/manifest.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let fails = 0;
function ok(name, cond, extra) {
  if (!cond) { fails++; console.error('FAIL ' + name + (extra ? ' — ' + extra : '')); }
  else console.log('ok   ' + name);
}

/* fixture seeds: SHA-256 of two reference letters (unchanged since gen 1) */
const fix1 = crypto.createHash('sha256').update(M.tokenSeedString({
  openOn: '2044-06-21', written: '2026-07-10', from: 'Rika',
  to: 'My daughter, on her eighteenth birthday', letter: 'Dear one,\nBe brave.\n'
})).digest('hex');
const fix2 = crypto.createHash('sha256').update(M.tokenSeedString({
  openOn: '2126-12-21', written: '2026-07-10', from: 'Someone who was 31 in 2026',
  to: 'Whoever finds this', letter: 'Hello from the year the solstice letters began.\n'
})).digest('hex');
const id1 = 'TSR-' + fix1.slice(0, 4) + '-' + fix1.slice(4, 8);
const id2 = 'TSR-' + fix2.slice(0, 4) + '-' + fix2.slice(4, 8);

const fixDir = path.join(__dirname, 'fixtures');
if (!fs.existsSync(fixDir)) fs.mkdirSync(fixDir);

/* both generations walk the same checks */
for (const [gen, R, fixNames] of [
  ['gen2', T, ['token-fix1.svg', 'token-fix2.svg']],
  ['legacy', TL, ['token-legacy-fix1.svg', 'token-legacy-fix2.svg']]
]) {
  const t1 = R.renderTokenSvg(fix1, id1);
  const t2 = R.renderTokenSvg(fix2, id2);
  const t1b = R.renderTokenSvg(fix1, id1);

  ok(gen + ' deterministic full', t1.full === t1b.full);
  ok(gen + ' deterministic sheet', t1.sheet === t1b.sheet);
  ok(gen + ' seeds differ', t1.full !== t2.full);

  for (const [name, t] of [[gen + ' fix1', t1], [gen + ' fix2', t2]]) {
    ok(name + ' full is svg', t.full.startsWith('<svg') && t.full.endsWith('</svg>'));
    ok(name + ' halves non-empty clips', t.left.includes('clipPath') && t.right.includes('clipPath'));
    ok(name + ' halves contain tiles', (t.left.match(/<polygon/g) || []).length > 20 && (t.right.match(/<polygon/g) || []).length > 20);
    ok(name + ' sheet carries ID twice', (t.sheet.match(/TSR-/g) || []).length >= 2);
    const scanBody = t.sheet.split('xmlns="http://www.w3.org/2000/svg"').join('');
    ok(name + ' no external refs', !/https?:|url\(['"]?http|xlink:href=/.test(scanBody));
    ok(name + ' generic fonts only', !/font-family="(?!monospace|serif|sans-serif)/.test(t.sheet));
    ok(name + ' no scripts', !/<script/.test(t.sheet));
    ok(name + ' no filters', !/<filter|feGaussian/i.test(t.sheet));
  }

  /* committed fixtures: byte-identical across releases */
  for (const [file, svg] of [[fixNames[0], t1.sheet], [fixNames[1], t2.sheet]]) {
    const p = path.join(fixDir, file);
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, svg);
      console.log('wrote new fixture ' + file + ' (first run — commit it)');
    } else {
      ok('fixture ' + file + ' unchanged', fs.readFileSync(p, 'utf8') === svg,
        'TOKEN BYTES CHANGED — this is a format event (docs/features/token.md)');
    }
  }
}

/* the two generations must differ (otherwise the fallback is meaningless) */
ok('generations differ', T.renderTokenSvg(fix1, id1).full !== TL.renderTokenSvg(fix1, id1).full);

/* gen 2 look: washes present beneath a finer field */
const g2 = T.renderTokenSvg(fix1, id1);
ok('gen2 has fill-opacity washes', /fill-opacity="0\.[3-7]/.test(g2.full));
ok('gen2 field is finer than gen1', (g2.full.match(/<polygon/g) || []).length > (TL.renderTokenSvg(fix1, id1).full.match(/<polygon/g) || []).length);

/* forbidden-source scan, both files */
for (const f of ['token.js', 'token-legacy.js']) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  ok('no Math.random in ' + f, !/Math\.random\s*\(/.test(src));
  ok('no Date in ' + f, !/\bnew Date\b|\bDate\.now\b/.test(src));
  ok('no toLocale in ' + f, src.indexOf('toLocale') === -1);
}

process.exit(fails ? 1 : 0);
```

- [ ] **Step 2:** Run `node tools/test-token.js`.
Expected: `wrote new fixture token-fix1.svg (first run — commit it)` + same for fix2 (the gen-2 fixture birth); legacy fixtures assert `unchanged` against the renamed files; all other rows `ok`. Exit 0.
- [ ] **Step 3:** Run again: `node tools/test-token.js` — now ALL fixture rows must read `unchanged` (byte-stable across runs). Exit 0.
- [ ] **Step 4:** The other suites must still pass (manifest/zip/state don't touch the token; open does): `node tools/test-open.js` — expected green (it builds folders with the CURRENT renderer, so round-trips still match).
- [ ] **Step 5:** Commit the format event in one atomic commit:

```bash
git add js/token.js tools/test-token.js tools/fixtures/token-fix1.svg tools/fixtures/token-fix2.svg tools/fixtures/token-legacy-fix1.svg tools/fixtures/token-legacy-fix2.svg
git commit -m "feat(token): generation 2 — the watercolor mosaic (format event)"
```

### Task 4: Verification fallback — old tokens never become wrong

**Files:**
- Modify: `js/open.js` (module deps + the token job, currently around lines 152–185)
- Test: `tools/test-open.js`

- [ ] **Step 1: Write the failing test.** In `tools/test-open.js`, add after the zip round-trip section (before the final `console.log(fails ? ...)`):

```js
  /* 5. a letter sealed under generation-1 art verifies clean via the legacy fallback */
  const TL = require('../js/token-legacy.js');
  const legacyF = buildFolder();
  const liIdx = legacyF.files.findIndex(f => f.name === 'token.svg');
  const legacySeed = legacyF.seedHex;
  const legacyId = M.deriveId(legacySeed);
  legacyF.files[liIdx] = { name: 'token.svg', data: Z.utf8(TL.renderTokenSvg(legacySeed, legacyId).sheet + '\n') };
  /* checksums were computed over the gen-2 token; recompute for the legacy one */
  const ciIdx = legacyF.files.findIndex(f => f.name === 'checksums.txt');
  let cks = '';
  for (const fl of legacyF.files) {
    if (fl.name === 'checksums.txt') continue;
    cks += sha(Buffer.from(fl.data)) + '  ' + fl.name + '\n';
  }
  legacyF.files[ciIdx] = { name: 'checksums.txt', data: Z.utf8(cks) };
  const v5 = await O.verifyLetter(legacyF.files);
  ok('legacy token verifies clean (fallback)', v5.tokenOk === true, JSON.stringify(v5.warnings));
  ok('legacy: no token warning', !v5.warnings.some(w => /enclosed token/.test(w)), JSON.stringify(v5.warnings));
  ok('legacy: redrawn token is the matching generation', v5.token.redrawnSheet === TL.renderTokenSvg(legacySeed, legacyId).sheet);
```

(Note: `buildFolder` in this file returns `{ files, id, seedHex }` and `sha` accepts bytes — both already exist; check the file header if signatures moved.)

- [ ] **Step 2:** Run `node tools/test-open.js`.
Expected: FAIL — `legacy token verifies clean (fallback)` (the enclosed gen-1 token doesn't match the gen-2 re-draw and no fallback exists yet).
- [ ] **Step 3: Implement the fallback.** In `js/open.js`:

(a) After the existing module deps (`var Z = ...`, ~line 11), add:

```js
  var TL = root.TesseraTokenLegacy || (typeof require === 'function' ? require('./token-legacy.js') : null);
```

(b) Replace the body of the final `else` branch's `.then(...)` (the block that currently renders `t`, compares, and returns — lines ~167–184) with:

```js
      tokenJob = sha256HexBytes(Z.utf8(seedString)).then(function (seedHex) {
        if (facts.tokenSeed && facts.tokenSeed !== seedHex) {
          warnings.push('the token seed in manifest.json does not match one re-derived from the letter and its facts.');
        }
        var derivedId = M.deriveId(seedHex);
        if (facts.id && facts.id !== derivedId) {
          warnings.push('the letter ID does not match one re-derived from the letter and its facts.');
        }
        /* the id is drawn into the SVG that the screen injects, and this
           manifest is foreign: only a well-formed id may pass; anything
           else falls back to the hex-derived one (XSS guard) */
        var safeId = (facts.id && /^TSR-[0-9a-f]{4}-[0-9a-f]{4}$/.test(facts.id)) ? facts.id : derivedId;
        var enclosed = asText(tokenEntry.data);
        /* try the current art generation first, then the frozen legacy one:
           letters sealed before generation 2 must never become "wrong" */
        var t = T.renderTokenSvg(seedHex, safeId);
        var same = (t.sheet + '\n') === enclosed;
        if (!same && TL) {
          var tl = TL.renderTokenSvg(seedHex, safeId);
          if ((tl.sheet + '\n') === enclosed) { t = tl; same = true; }
        }
        if (!same) warnings.push('the enclosed token does not match one re-drawn from this letter; if you hold a printed half, trust the paper and compare the broken edge by eye.');
        return { ok: same, redrawnFull: t.full, redrawnSheet: t.sheet, enclosed: enclosed };
      });
```

- [ ] **Step 4:** Run `node --check js/open.js && node tools/test-open.js`.
Expected: ALL green including the three new legacy-fallback rows (and every pre-existing row — gen-2 round-trips still match on the first try).
- [ ] **Step 5:** Commit: `git add js/open.js tools/test-open.js && git commit -m "feat(open): legacy token fallback — old letters never become wrong"`

### Task 5: Load the legacy renderer in the app

**Files:**
- Modify: `index.html` (script order), `sw.js` (CORE)

- [ ] **Step 1:** In `index.html`, after `<script src="js/token.js"></script>` add:

```html
<script src="js/token-legacy.js"></script>
```

- [ ] **Step 2:** In `sw.js` CORE, after `'js/token.js',` add `'js/token-legacy.js',`. Do NOT touch CACHE_VERSION.
- [ ] **Step 3:** `node --check sw.js`.
- [ ] **Step 4:** Commit: `git add index.html sw.js && git commit -m "chore(app): load token-legacy.js for verification fallback"`

### Task 6: Token-lab visual pass (the two flagged concerns)

**Files:** scratchpad only (no repo edits unless a defect is found)

- [ ] **Step 1:** Render, to the scratchpad, gen-2 `sheet` SVGs for the two fixture seeds + at least four exploratory seeds (reuse the compare harness pattern).
- [ ] **Step 2:** Eyeball at drawer distance (browser/companion), explicitly judging: (a) wash-core opacity stacking in grout gaps — does any disk read blotchy-opaque? (b) break-stroke contrast — is the cut clearly visible over pastel tiles on every seed? (c) the halves pair unambiguously in grayscale.
- [ ] **Step 3:** If a defect appears: fix in `js/token.js`, re-run `node tools/test-token.js` — the gen-2 fixtures will diff; regenerate them KNOWINGLY in the same commit as the fix (still pre-release, the gen-2 fixture is hours old and unshipped; note it in the commit message). Legacy fixtures must never diff.
- [ ] **Step 4:** Record the pass (seeds looked at, verdict) in the PROGRESS log entry (Task 7).

### Task 7: Docs — the format event, recorded loudly

**Files:**
- Modify: `docs/features/token.md`, `docs/decisions.md`, `docs/PROGRESS.md`, `docs/engineering/architecture.md` (file map), `docs/engineering/testing.md` (suite description)

- [ ] **Step 1:** `docs/features/token.md`: add a dated generation note — the family is "mosaic ring (generation 1, 2026-07-10, frozen in `js/token-legacy.js`) → watercolor mosaic (generation 2, 2026-07-11, `js/token.js`)"; verification accepts either; paper halves from either generation remain valid forever.
- [ ] **Step 2:** `docs/decisions.md` entry (2026-07-11): what changed (A2 watercolor underwash, chosen from three rendered candidates), why (author request: richer mosaic + landing pastels), what happens to already-printed tokens (nothing — legacy fallback verifies them clean; the broken edge still matches by eye), and that the old fixture bytes were renamed, never regenerated.
- [ ] **Step 3:** `docs/engineering/architecture.md`: add `token-legacy.js` to the file map ("frozen generation 1; verification fallback"). `docs/engineering/testing.md`: test-token now covers both generations.
- [ ] **Step 4:** `docs/PROGRESS.md`: log entry (art change, format event handled, fallback proven by test, visual-pass verdict).
- [ ] **Step 5:** `node tools/prose-check.js` (new copy is code comments only — expect clean or justified WARNs). Commit: `git add docs/ && git commit -m "docs(token): generation 2 recorded — format event, legacy fallback"`

### Task 8: Gates, browser QA, release v0.3.1

- [ ] **Step 1:** Gate 1: `node --check` on touched JS; all six suites green; `git status --porcelain tools/fixtures/` must be empty (fixtures committed, stable).
- [ ] **Step 2:** Gate 3 browser pass (375px first): seal a letter → gen-2 token on receipt/sheet; print kit shows gen-2 token sheet; open the freshly sealed letter → token compare "They match." (current generation); open a PRE-CHANGE letter (build one with `token-legacy.js` via the test recipe, or reuse a real pre-change zip) → verifies clean, NO token warning (legacy fallback), and the re-drawn token shown is the legacy art; "show the break line large" works; zero console errors; no external requests.
- [ ] **Step 3:** `/spec-sync` (expect clean — manifest/README/zip untouched) and prose gate.
- [ ] **Step 4:** ASK THE AUTHOR before shipping (established practice). On approval, `/release` as v0.3.1: triple bump, release note + century-audit deltas (token B-row re-evidenced for gen 2; recommend the cheap physical check — print one gen-2 sheet, cut, match by eye), `dev` → `main`, verify live.

---

## Notes for the executor
- `js/token-legacy.js` is frozen the moment it's committed: never edit it, never regenerate `token-legacy-fix*.svg`.
- The gen-2 fixtures may be regenerated ONLY during Task 6's visual pass, pre-release, in the same commit as the art fix that caused it.
- Keep every random draw in `js/token.js` flowing from the seeded stream in stable order; any reorder is a fixture diff.
- variant-2.js was verified deterministic twice already; the suite re-proves it — if determinism fails after the header edit, you changed more than the comment.
