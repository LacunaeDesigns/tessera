# Print Kit Assembly Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The print kit teaches its own assembly — one sealer-facing line on the cover sheet, the century-test walkthrough protocol amended to match, and the docs trail recorded. Blocks the v0.1 ship.

**Architecture:** Copy and protocol only, no structure. The cover sheet already carries everything a finder needs before opening; the defect is that nothing tells the sealer it faces out. One printed line fixes the artifact; spec/docs amendments fix the protocol that misled the author. Spec: [../specs/2026-07-10-print-kit-assembly-design.md](../specs/2026-07-10-print-kit-assembly-design.md).

**Tech Stack:** Vanilla JS (no build), print CSS, node gate scripts (`tools/test-*.js`, `tools/prose-check.js`), dev server `node tools/serve.js` (launch name "tessera").

**Context for a fresh executor:** Read `CLAUDE.md` first. The print kit is `js/print.js` (the `el(tag, cls, text)` helper builds DOM; each sheet is a `section.sheet.sheet-<name>`; `.sheet-note` in `style.css:98` is the quiet-note style the token sheet already uses). The century test is `docs/spec/century-test.md`. **Dev-only trap:** the service worker serves precached files cache-first — after editing `js/print.js`, unregister the SW in the preview browser (`navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))` then reload) or changes won't appear. Never bump `CACHE_VERSION` by hand (release-only, via `/release`).

**No format event:** `README.txt` template, `manifest.json`, fixtures, and the zip are untouched. If any step seems to require touching those, stop and report.

---

### Task 1: Cover sheet gains the assembly line

**Files:**
- Modify: `js/print.js` (in `coverSheet()`, after the promises block, ~line 43)

- [ ] **Step 1: Add the line**

In `js/print.js`, `coverSheet()`, insert one line between the promises block and the footer:

```js
    promises.appendChild(ul);
    sheet.appendChild(promises);
    sheet.appendChild(el('p', 'sheet-note', 'This page goes on the outside. Fold it around the sealed envelope, or paste it to the front.'));
    sheet.appendChild(footer(f.id, f.openWhenNeeded ? 'opens when needed' : 'opens ' + f.openOn));
```

(The existing `promises.appendChild(ul); … sheet.appendChild(footer(…));` lines are shown for placement; only the `sheet-note` line is new. Reuse `.sheet-note` — do not add new CSS.)

- [ ] **Step 2: Gate 1 — syntax + module tests**

Run: `node --check js/print.js`
Expected: no output, exit 0.

Run: `node tools/test-manifest.js && node tools/test-zip.js && node tools/test-token.js`
Expected: all green (24 + 9 + 21 tests; print.js isn't covered by them, but Gate 1 says run them on any JS change).

- [ ] **Step 3: Gate 2 — prose scan**

Run: `node tools/prose-check.js`
Expected: clean except the two known justified WARNs on the `landing.js` em-dash placeholder glyph (recorded in decisions.md). Any new finding on the cover-sheet line is a failure — fix the wording, don't suppress.

- [ ] **Step 4: Browser verification**

Start the dev server (preview launch name "tessera" → http://localhost:8137/). Unregister the SW as described in the header, reload. Complete the six-step compose flow at `#write` with throwaway values (to: "Test Reader", an open date next year, a short body), seal, and in the print view confirm:
- The cover sheet shows the new line, quiet-styled, between the promises list and the footer.
- The instructions sheet (`.sheet-instructions` / `readme-pre`) is unchanged — the line must NOT appear there.
- Nothing clips at A4 or Letter in print preview; the cover still fits one page.

The preview browser has its own localStorage, so the throwaway letter never touches the author's registry.

- [ ] **Step 5: Commit**

```bash
git add js/print.js
git commit -m "fix(print): cover sheet says it goes on the outside (walkthrough finding)"
```

### Task 2: Century-test protocol amendments

**Files:**
- Modify: `docs/spec/century-test.md` (walkthrough protocol steps 2 and 4; section D)

- [ ] **Step 1: Amend walkthrough step 2**

Replace:

```markdown
2. Print it. Cut the token. Seal the letter sheet + travel half + instructions page in an envelope.
```

with:

```markdown
2. Print it. Cut the token. Seal the letter sheet + travel half + instructions page in an envelope; the cover sheet faces out — fold it around the envelope or paste it to the front.
```

- [ ] **Step 2: Amend walkthrough step 4**

Replace:

```markdown
4. Hand the printed instructions page to someone who has never seen the project; watch — no coaching — whether they can say what the object is, who it's for, and what they should do with it.
```

with:

```markdown
4. Hand the cover sheet to someone who has never seen the project — the moment a finder actually has, seal unbroken; watch — no coaching — whether they can say what the object is, who it's for, and what they should do with it. Then hand them the instructions page — the moment after a rightful opening — and watch for the same.
```

- [ ] **Step 3: Add the D-check bullet**

Append to section "D. No-computer checks":

```markdown
- [ ] The kit teaches its own assembly: from the sheets alone, the sealer can tell what goes inside and what faces out.
```

- [ ] **Step 4: Commit**

```bash
git add docs/spec/century-test.md
git commit -m "docs(spec): walkthrough seals cover-out, cold-reads the cover first; new assembly D-check"
```

### Task 3: Docs trail

**Files:**
- Modify: `docs/features/print-kit.md` (sheet list, item 1)
- Modify: `docs/engineering/testing.md` (Gate 4 paragraph, line ~23)
- Modify: `docs/decisions.md` (append to the entry list, before "## Standing author gates")
- Modify: `docs/PROGRESS.md` (new log entry at the top of "## Log (newest first)")

- [ ] **Step 1: print-kit.md** — at the end of sheet item 1 (Cover sheet), append:

```markdown
The sheet carries its own assembly line — "This page goes on the outside. Fold it around the sealed envelope, or paste it to the front." — so the kit teaches what faces out (2026-07-10 walkthrough finding).
```

- [ ] **Step 2: testing.md** — in the Gate 4 paragraph, replace:

```markdown
compose real, print real (a physical printer), cut, seal, reopen the folder with only a text editor, cold-reader test on the instructions page.
```

with:

```markdown
compose real, print real (a physical printer), cut, seal (cover sheet out), reopen the folder with only a text editor, cold-reader test on the cover sheet first, then the instructions page.
```

- [ ] **Step 3: decisions.md** — append this entry to the decision list (keep it above "## Standing author gates"):

```markdown
- **2026-07-10 · The kit teaches its own assembly (walkthrough finding).** The first physical century walkthrough produced a blank envelope: the protocol said to seal the letter sheet, travel half, and instructions page, and never said the cover sheet faces out — so the "do not open yet" page was sealed inside the thing it protects. Fix: a sealer-facing line printed on the cover sheet ("This page goes on the outside. Fold it around the sealed envelope, or paste it to the front."), the walkthrough protocol now seals cover-out and cold-reads the cover before the instructions page, and a new D-check pins it. Spec clarification, not a format change; the v0.2 envelope template remains the structural answer.
```

- [ ] **Step 4: PROGRESS.md** — add at the top of the log:

```markdown
- **2026-07-10 (physical walkthrough)** — First physical century walkthrough (author, real printer). Finding: the kit never said the cover sheet faces out — following the protocol sealed the instructions page inside and left the envelope blank. Fixed same day: assembly line on the cover sheet (print.js), century-test.md steps 2/4 amended + new assembly D-check, print-kit.md and testing.md aligned, decisions.md entry. Author reports the remaining walkthrough steps passed (text-editor reopen, cold read of the instructions page).
```

- [ ] **Step 5: Commit**

```bash
git add docs/features/print-kit.md docs/engineering/testing.md docs/decisions.md docs/PROGRESS.md
git commit -m "docs: record the assembly finding — print-kit, testing gate, decision, progress log"
```

### Task 4: Spec-sync + author confirmation

- [ ] **Step 1:** Invoke the `/spec-sync` skill. Expected: clean — nothing here touches the format (README template, manifest, fixtures untouched). Any drift it reports is a stop-and-report.
- [ ] **Step 2 (author, human):** Hold the already-printed kit against the amended protocol and confirm assembly is now obvious from the sheets alone; re-read the printed line once on paper. This closes the walkthrough finding.

## Self-review notes

- Spec coverage: printed line (Task 1), protocol + D-check (Task 2), docs trail (Task 3 — testing.md added beyond the spec because canon files must agree same day), verification + human close-out (Tasks 1/4). Out-of-scope guard (envelope stays v0.2) is in the header.
- No placeholder steps; every edit shows its exact text.
- The only judgment call left to the executor is driving the six-step compose UI in Task 1 Step 4 — behavioral criteria are stated instead of selectors on purpose.
