# Print kit assembly — design

*2026-07-10 · from the v0.1 physical century walkthrough · approach approved by the author*

## Finding

The first physical walkthrough (real printer, real envelope) surfaced this: the
walkthrough protocol in `docs/spec/century-test.md` says to seal the letter
sheet, the travel half of the token, and the instructions page inside the
envelope — and never mentions the cover sheet. The cover sheet
(`js/print.js`, `coverSheet()`) is *designed* to face outward ("A letter,
sealed… / To be opened by… / If you are keeping this for someone"), but nothing
on paper or in the protocol says so. Following the canon exactly produces a
blank envelope whose "do not open yet" page is sealed inside the thing it
protects. The author hit exactly this.

Root cause: the kit does not teach its own assembly. The knowledge "cover goes
outside" lives only in `docs/features/print-kit.md`, which no sealer reads.

## Design

The fix is copy and protocol, not structure — the cover sheet already solves
the finder's problem once it is actually on the outside.

### 1. Cover sheet gains one sealer-facing line (`js/print.js`)

After the promises block, before the footer, a quiet note in the token-sheet
register (which already speaks to the assembler: "Print this page on the
stiffest paper you have"):

> This page goes on the outside. Fold it around the sealed envelope, or paste
> it to the front.

Plain sentences, no em dashes. Final wording must pass
`node tools/prose-check.js` (Gate 2). Styled like the existing `sheet-note`,
ink-light, no new layout.

Trade-off accepted: the line is permanent — a century on, the cover still
carries one sentence addressed to the sealer. Precedent is the token sheet;
the line also serves a custodian reprinting from the registry.

### 2. Walkthrough protocol fixed (`docs/spec/century-test.md`)

- **Step 2** becomes: seal the letter sheet + travel half + instructions page
  *inside*; the **cover sheet faces out**, folded around the envelope or
  pasted to the front.
- **Step 4** becomes two-stage: hand the cold reader the **cover sheet first**
  (the pre-opening moment a real finder has), then the instructions page (the
  post-opening moment). Today the protocol cold-reads a page a finder cannot
  legally see.
- **New D-check bullet**: "The kit teaches its own assembly: from the sheets
  alone, the sealer can tell what goes inside and what faces out." This makes
  `/century-audit` catch any regression permanently.

### 3. Docs trail

- `docs/features/print-kit.md`: cover-sheet entry notes the printed assembly
  line.
- `docs/decisions.md`: append-only entry — walkthrough finding → this fix;
  protocol amendment is a spec clarification, not a format change.
- `docs/PROGRESS.md` log: the finding and fix recorded as the v0.1
  physical-walkthrough notes — the place the v0.2 envelope plan's drift check
  already reads. No edit to `v0.2-envelope-themes.md` itself.

## Not a format event

`README.txt` template, `manifest.json`, fixtures, and the zip are untouched.
No spec version note needed; `/spec-sync` runs anyway because a `docs/spec/`
file changes.

## Out of scope

The fold-and-glue envelope template stays in v0.2
(`docs/plans/v0.2-envelope-themes.md`) as the structural long-term answer; it
was deliberately sequenced after these walkthrough notes and remains so.

## Verification

1. `node --check js/print.js`; module tests unaffected but run per Gate 1.
2. `node tools/prose-check.js` (Gate 2) — the new line is letter-facing copy.
3. Browser print preview at A4 + Letter: line present on the cover sheet,
   nothing clipped, ink-light rule holds, instructions sheet byte-identical.
4. `/spec-sync` clean.
5. Human step: the author holds the already-printed kit against the amended
   protocol and confirms assembly is now obvious from the sheets alone.
