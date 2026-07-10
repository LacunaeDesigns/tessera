---
name: spec-sync
description: Format-drift detector — verify SPEC.md, docs/spec/*, and the implementation (js/manifest.js, js/export.js, fixtures) still agree. Use after any change touching the format, and per release.
---

# /spec-sync — the format may not drift

The format is public domain and must outlive the tool. When code and spec disagree, one of them is fixed the same day — that is the whole skill.

## What to compare
1. **Folder contents**: SPEC §1 file list ↔ what `js/export.js` actually assembles (README.txt, letter.txt, manifest.json, checksums.txt, token.svg).
2. **Manifest fields**: `docs/spec/manifest-schema.md` field table ↔ `buildManifest()` output in `js/manifest.js`. Every field: presence, name, type, optionality. Reserved fields (e.g. `writeback`) stay reserved.
3. **README template**: `docs/spec/readme-template.md` ↔ `renderReadme()` output — same sections, same words, dates in words, wrap width.
4. **Derivations**: ID and tokenSeed rules (SPEC §4–5) ↔ `deriveId()` / `tokenSeedString()` canonicalisation.
5. **Fixtures**: `tools/fixtures/` agree with all of the above (`node tools/test-manifest.js`, `test-zip.js`, `test-token.js` green).

## Method
- Run the three test suites first; they encode most of the contract.
- Then diff by reading: schema doc field list against `buildManifest` source; template doc against `renderReadme` source. Quote line refs for every mismatch.

## On drift
- Report each mismatch as: what the spec says · what the code does · which one is wrong.
- Fix the wrong side same day. A change to the spec side is a **format event**: spec version note + `docs/decisions.md` entry + fixture regeneration done loudly, never silently.
