# Print kit (v0.1 core; themes & envelope v0.2)

## Purpose
The print kit is the reference copy of the letter (century test D: paper alone is a complete Tessera letter). Sealing opens a print view; the browser's print dialog does the rest. No PDF library — print CSS is the whole engine.

## The sheets (v0.1)
Each sheet is a page-break-isolated section, self-identifying via a small footer (letter ID + open date) in case sheets are separated:

1. **Cover sheet** — for the outside of an envelope or the top of a box: *A letter, sealed {written-in-words}. To be opened by {to} on {open-date-in-words}. Not before, if you can bear it.* Plus the custodian's four promises, distilled (from [../spec/custody.md](../spec/custody.md)). The sheet carries its own assembly line — "This page goes on the outside. Fold it around the sealed envelope, or paste it to the front." — so the kit teaches what faces out (2026-07-10 walkthrough finding).
2. **Letter sheet(s)** — the letter typeset in serif, 11.5pt, ~65ch, generous margins; dates and ID in the footer only. The page a granddaughter actually reads.
3. **Instructions page** — the printed twin of `README.txt` (same sections, same words, hard-wrapped prose): for the person it's for, for the finder, what the files are (if the digital folder survives), about the format.
4. **Token sheet** — both halves with a dashed cut line and scissors-free instructions in words; the ID under each half; the assembled preview for reference. Cardstock note ("print this page on the stiffest paper you have").
5. **Register page** — printed from the registry, not the compose flow (see [registry.md](registry.md)).

## Print rules (from design-language.md)
A4 with US Letter tolerance (`@page` margins ≥ 15mm, no content in the outer 6mm); ink-light (hairline rules, no solid fields); dashed hairlines for cuts; every sheet self-identifying; app-owned faces with system-stack fallbacks (design-language.md §Typography), sizes in `pt`.

## Implementation
- `js/print.js` — renders the kit into `#screen-print` from the same data object `export.js` builds; `window.print()` on user action. On screen, the sheets render as stacked paper cards (a faithful preview); `@media print` strips chrome and sets page breaks (`break-after: page` per `.sheet`).
- Token SVGs are inlined (no `<img>` fetch). Everything works offline.

## v0.2 additions
- **Envelope generator**: a fold-and-glue template sized to the letter sheet folded in thirds, dates + cover text printed on the flap.
- **Print themes**: *letterpress* (default refined), *aerogramme* (airmail border, lighter stock), *telegram* (monospace date-stamped header), *wax-seal* (cover ornament + seal placement mark). Themes restyle within the print rules; the instructions page never changes voice.

## QA hooks
- `/qa`: print-preview at A4 and Letter — no clipped content, page breaks between sheets, footers present on every sheet; ink-light check (no filled areas > 5% of page); 375px screen preview usable.
- Century walkthrough step 2 (print, cut, seal) uses this kit — a real printer, not just preview, before each release.

## Open questions
- Duplex guidance (letter on one side only, so sheets can be separated safely) — current answer: single-sided always; revisit with themes.
