# The tessera token (v0.1)

## Purpose
Every letter deterministically generates a two-half visual token — the *tessera hospitalis*. One half stays with the writer, one travels with the letter. Matching halves authenticate letter to opener across decades, by eye, with no machine. This file is the **reference algorithm**; its fixtures are the format's conformance vectors.

## Determinism contract (format-level, SPEC §5)
- Seed string: `"tessera:0.1\n" + openOn + "\n" + written + "\n" + from + "\n" + to + "\n" + letterText`, where `letterText` is letter.txt with CRLF→LF and the whole text trimmed of trailing whitespace.
- `tokenSeed` = SHA-256 hex of the UTF-8 bytes of that string.
- Same seed ⇒ byte-identical SVG output, on any engine, forever. Consequences for implementers: **no `Math.random`, no `Date`, no locale-dependent formatting**; every float rendered through a fixed `round2()`; every iteration order explicit.

## Reference art: "mosaic ring" family
Rendered into a 400×400 viewBox, plain SVG 1.1, no scripts/external refs/fonts (century test B):

1. **PRNG**: sfc32 seeded from the first 16 bytes of the seed digest (4×uint32, little-endian). All randomness flows from this single stream in a fixed order.
2. **Tiles**: a polar grid — 4 rings × (10, 14, 18, 22) sectors — each cell a quadrilateral tile jittered inward (gap 2.5px, jitter ≤ 3px per vertex, drawn ring by ring, sector by sector). Tile fill drawn from the ink/wax/paper palette (design-language.md) by PRNG weight: ink 55%, wax 25%, warm mid-tones 20%. A thin outer border ring closes the coin.
3. **Break line**: a vertical-ish polyline through the token — 7 points from top to bottom, x-jitter ±12% of radius, with two interlocking notches (small triangular zigzags) at PRNG-chosen points. This is the "broken edge" the eye will match.
4. **Halves**: the full token is clipped twice (left/right of the break polyline via `clipPath`) into two standalone halves.
5. **Output `token.svg`**: both halves side by side separated by a dashed cut line, the letter ID beneath each half in a small text element (IDs must survive separation), and the assembled token small in a corner as a preview. This one file serves folder and print kit.

## Fading tolerance
Matching must survive forty years of sun: the break-line *shape* (not colour) carries the authentication, tile contrast is high, and halves carry the ID as text. A photocopy of a half must still match.

## Implementation
- `js/token.js` — pure, dual browser/Node export: `tokenSeedString(fields)`, `renderTokenSvg(seedHex)` → `{ full, left, right, sheet }` SVG strings; sfc32 + helpers internal. WebCrypto SHA-256 stays in `export.js` (Node ≥ 18 shares `crypto.subtle`).

## QA hooks
- `node tools/test-token.js` — fixture seeds ⇒ byte-identical SVG (committed fixtures in `tools/fixtures/`); determinism across two process runs; clip-path validity (both halves non-empty); no forbidden tokens (`Math.random`, `Date`, `toLocale`) via source scan.
- `/token-lab` — regenerate the fixture sheet + a review grid of 12 seeds for the author's eye before any art change. **Any change to the rendered bytes is a format event**: new fixtures, spec-version note, decisions.md entry.

## Open questions
- Additional art families (constellation, botanical) — v0.3+, each with its own fixtures; the manifest may then record `tokenFamily`.
- Embossing/foil-friendly single-colour variant for the physical kit (v2.x).
