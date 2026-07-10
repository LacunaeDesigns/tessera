---
name: token-lab
description: Iterate token art (js/token.js) inside the determinism contract — render fixture seeds, review visually, and handle fixture diffs as format events. Use for any token art change.
---

# /token-lab — token art iteration

The token authenticates by eye, not by cryptography: two halves, matchable across forty years of fading. Art may evolve; determinism may not.

## The contract (non-negotiable)
- Same seed ⇒ byte-identical SVG, forever, in any environment. No `Math.random`, no `Date`, no locale calls — only the seeded sfc32 stream.
- Plain SVG 1.1, no scripts, no external refs, no fonts (century test B). 400×400 viewBox.
- Output shape stays `{full, left, right, sheet}`; the break line stays irregular and interlocking; halves must pair unambiguously.
- Palette: ink + wax tones from docs/design-language.md; it should read as an object, not a graphic.

## Iteration loop
1. Write a small scratch script (scratchpad, not the repo) that requires `js/token.js`, renders the two fixture seeds plus a handful of exploratory seeds, and writes SVGs to the scratchpad.
2. Look at them (open in browser). Judge as an object: mintable, cuttable, matchable by eye at drawer distance.
3. Edit `js/token.js`; keep every random draw flowing from the seeded PRNG in a stable order (insertion order is part of determinism).
4. `node tools/test-token.js` after every edit.

## Fixture diffs are format events
If the art change is intended to ship, the committed fixtures in `tools/fixtures/` will diff. That requires, same day: a spec-version note, a `docs/decisions.md` entry (what changed, why, what happens to already-printed tokens), then loud fixture regeneration. Already-printed halves must still be discussed: old tokens never become "wrong".
