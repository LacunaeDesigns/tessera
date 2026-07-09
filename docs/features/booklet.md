# Bound-booklet export (v0.3)

## Purpose
A series of letters — eighteen years of birthdays, twenty-five anniversaries — deserves to end as a book. The booklet export turns a completed (opened) series or a to-be-given set into a print-ready, home-bindable volume.

## What ships
- **Booklet composer** — select letters from the registry (or import folders); order by date; the tool generates: title page (*Letters to ___, {first year}–{last year}*), one letter per spread section, each with its sealed/opened dates in words, the series' tokens gathered on a plates page, and a colophon (the format note, the ID list).
- **Imposition** — the hard part done in print CSS + JS page logic: A5-on-A4 signature imposition (pages reordered so folded A4 sheets nest into signatures), with a plain sequential mode for spiral/staple binding. Fold-and-sew instructions (words + one diagram) printed as the last page — pamphlet stitch for one signature, kettle stitch pointer for more.
- **Home-printer honesty** — margins tolerant of duplex misalignment (±3mm), ink-light rules maintained, single-signature (≤5 sheets) recommended per volume before suggesting a print shop.

## Implementation
- `js/booklet.js` — selection, ordering, imposition math (pure, fixture-testable: page-sequence arrays for N pages), rendering via `print.js` sheet machinery.

## QA hooks
- `node tools/test-booklet.js` — imposition sequences for 8/16/24-page fixtures (known-good arrays).
- `/qa`: real duplex print + fold of the 8-page fixture; page order correct when folded (physical check, per release that touches imposition).

## Open questions
- Cover treatment (heavier stock page vs. none) — decide at the printer with real paper.
- Whether opened letters' write-back replies interleave chronologically — probably yes, flagged as *the correspondence, whole*.
