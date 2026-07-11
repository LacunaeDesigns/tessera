# The tessera token (v0.1)

## Purpose
Every letter deterministically generates a two-half visual token — the *tessera hospitalis*. One half stays with the writer, one travels with the letter. Matching halves authenticate letter to opener across decades, by eye, with no machine. This file is the **reference algorithm**; its fixtures are the format's conformance vectors.

## Determinism contract (format-level, SPEC §5)
- Seed string: `"tessera:0.1\n" + openOn + "\n" + written + "\n" + from + "\n" + to + "\n" + letterText`, where `letterText` is letter.txt with CRLF→LF and the whole text trimmed of trailing whitespace.
- `tokenSeed` = SHA-256 hex of the UTF-8 bytes of that string.
- Same seed ⇒ byte-identical SVG output, on any engine, forever. Consequences for implementers: **no `Math.random`, no `Date`, no locale-dependent formatting**; every float rendered through a fixed `round2()`; every iteration order explicit.

## Reference art — generations of one family

Art may evolve; determinism may not. Each generation is frozen forever once
superseded, and **verification accepts any generation** (the opener's tool
re-draws with the current renderer first, then each frozen one; a byte-match
on any is authentic). Old tokens never become wrong; printed halves from any
generation remain valid forever.

- **Generation 1 — "mosaic ring" (2026-07-10 → 2026-07-11).** Frozen in
  `js/token-legacy.js`; conformance vectors `tools/fixtures/token-legacy-fix*.svg`
  (the original fixture bytes, renamed, never regenerated).
- **Generation 2 — "watercolor mosaic" (2026-07-11 → current).** Lives in
  `js/token.js`; conformance vectors `tools/fixtures/token-fix*.svg`. Chosen by
  the author from three rendered candidates (decisions.md 2026-07-11).

Both render into a 400×400 viewBox, plain SVG 1.1, no scripts/external
refs/fonts/filters (century test B):

1. **PRNG**: sfc32 seeded from the first 16 bytes of the seed digest (4×uint32). All randomness flows from this single stream in a fixed order.
2. **Tiles (gen 2)**: a cream substrate carrying 3–5 seeded watercolor washes — blobby light-pastel polygons (fill-opacity 0.5–0.7 with a 0.3-opacity pooling core) — beneath a finer polar mosaic: 4 or 5 seeded rings, per-ring sector counts from a seeded target tile width (~175–208 tiles), per-ring phase rotation, ~3.2px grout through which the washes show. Tile fills stay ink ~50% / wax ~20% / deep pastels ~30% so the grayscale skeleton survives fading. (Gen 1: 4 fixed rings × 10/14/18/22 sectors, ink 55% / wax 25% / warm mids 20%.)
3. **Break line** (identical in both generations): a vertical-ish polyline through the token — 7 points from top to bottom, x-jitter ±12% of radius, with two interlocking notches (small triangular zigzags) at PRNG-chosen points. This is the "broken edge" the eye will match.
4. **Halves**: the full token is clipped twice (left/right of the break polyline via `clipPath`) into two standalone halves.
5. **Output `token.svg`**: both halves side by side separated by a dashed cut line, the letter ID beneath each half in a small text element (IDs must survive separation), and the assembled token small in a corner as a preview. This one file serves folder and print kit.

## Fading tolerance
Matching must survive forty years of sun: the break-line *shape* (not colour) carries the authentication, tile contrast is high, and halves carry the ID as text. A photocopy of a half must still match.

## Implementation
- `js/token.js` — generation 2, pure, dual browser/Node export: `renderTokenSvg(seedHex, id)` → `{ full, left, right, sheet }` SVG strings; sfc32 + helpers internal. WebCrypto SHA-256 stays in `export.js` (Node ≥ 18 shares `crypto.subtle`).
- `js/token-legacy.js` — generation 1, frozen; same api under `TesseraTokenLegacy`. Loaded by the app solely for the verification fallback in `js/open.js`.

## QA hooks
- `node tools/test-token.js` — **both generations**: fixture seeds ⇒ byte-identical SVG (committed fixtures in `tools/fixtures/`); determinism across runs; clip-path validity; no scripts/filters/external refs; no forbidden tokens (`Math.random`, `Date`, `toLocale`) via source scan of both files; cross-generation asserts (generations differ; gen 2 is finer and carries washes).
- `node tools/test-open.js` — a folder sealed under generation-1 art verifies `tokenOk` with no warning (the fallback).
- `/token-lab` — regenerate the fixture sheet + a review grid of 12 seeds for the author's eye before any art change. **Any change to the rendered bytes is a format event**: new fixtures, spec-version note, decisions.md entry.

## Open questions
- Additional art families (constellation, botanical) — v0.3+, each with its own fixtures; the manifest may then record `tokenFamily`.
- Embossing/foil-friendly single-colour variant for the physical kit (v2.x).
