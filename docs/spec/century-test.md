# The century test — conformance checklist

*Part of the Tessera format. Licence: CC0 1.0 (public domain).*

The century test is the format's single design constraint (SPEC, preamble): every element of a Tessera letter must survive **(a)** the death of any company, **(b)** the death of any file-format fashion, **(c)** the death of the author, and **(d)** discovery by a finder with no computer. This file turns that sentence into checks. `/century-audit` walks them; a release may not ship with an unexplained ✗.

## A. Company-death checks

- [ ] The exported letter folder contains no URL that is *required* for understanding (URLs may appear, flagged as optional and mortal).
- [ ] The web tool runs from `file://` or any static host — no API, no analytics *requirement*, no CDN, no webfont fetch, no external request of any kind at compose/export/print time.
- [ ] The repo can be forked/mirrored and produce an identical tool with no accounts or keys.
- [ ] No feature's *data* lives anywhere except the user's device and their exports.

## B. Format-death checks

- [ ] Required files are plain UTF-8 text (no BOM); readable in any text editor of any era.
- [ ] The zip uses the *store* method — entries are readable as raw bytes even without zip tooling.
- [ ] Every fact in `manifest.json` also exists as prose in `README.txt` (priority rule holds).
- [ ] Dates appear both ISO 8601 and written out in words.
- [ ] Media guidance followed: durable common formats, one-line prose description per file, transcript canonical when media carries the heart.
- [ ] `token.svg` is plain SVG 1.1 with no scripts, no external references, no fonts.

## C. Author-death checks

- [ ] The spec and templates are CC0 — no permission needed from anyone, ever.
- [ ] The tool is MIT and self-contained — no build step, no dependency registry, vendored code only.
- [ ] Nothing in the format requires Tessera-the-project to exist: SPEC.md alone (or the printed instructions page alone) is enough to understand and even reimplement a letter.
- [ ] The docs record every decision an heir/maintainer would need (decisions.md is append-only).

## D. No-computer checks

- [ ] The print kit contains the complete letter, all essential metadata, the opening instructions, and the token — paper alone is a complete Tessera letter.
- [ ] `README.txt` (and its printed twin) works cold: a stranger with no context knows what the object is and what to do, from the object itself.
- [ ] The token authenticates by eye — pattern matching along the broken edge, no machine.
- [ ] Checksums are an *offer* to future computers, never a requirement for future readers.
- [ ] The kit teaches its own assembly: from the sheets alone, the sealer can tell what goes inside and what faces out.

## Walkthrough protocol (run per release; see engineering/testing.md)

1. Compose a real letter; export folder + print kit.
2. Print it. Cut the token. Seal the letter sheet + travel half + instructions page in an envelope; the cover sheet faces out — fold it around the envelope or paste it to the front.
3. Open the exported folder with only a text editor; confirm nothing essential is missing or opaque.
4. Hand the cover sheet to someone who has never seen the project — the moment a finder actually has, seal unbroken; watch — no coaching — whether they can say what the object is, who it's for, and what they should do with it. Then hand them the instructions page — the moment after a rightful opening — and watch for the same.
5. Record results (and any ✗ with explanation) in the release notes.

## Known, accepted mortality

Honesty section: things Tessera *is* content to let die — the website's hosting, the hosted gallery (v1.0+), any convenience feature. The test protects **letters**, not the project. The project is allowed to be mortal; the letters are not.
