# Writing room (v0.1)

## Purpose
The compose flow: a quiet sequence of questions that ends with a sealed letter — a Tessera folder and a print kit. One task per screen; the app disappears, the letter remains.

## Walkthrough
Home offers three doors: **Write a letter** · **Your letters** (registry) · **About** (format + honesty page). "Write a letter" enters the flow:

1. **Who is it for?** — free-text `to` ("My daughter, on her eighteenth birthday") + occasion chips: the open-when set (see [open-when.md](open-when.md)), *a milestone*, *your future self*, *an anniversary*, *a stranger in the far future*, *something else*. Picking a chip sets `occasion` and later offers its prompts; it never constrains.
2. **When should it open?** — a date field plus quick picks (*in 1 year · in 5 · in 10 · in 25 · on the winter solstice, {year}*). Beneath, the date rendered in words ("the twenty-first of June, two thousand and forty-four") — the same words the README will carry. Open-when letters may choose **"no date — it opens when it's needed"** (`openOn` = written date; the cover sheet says *open when the title says so* — see open-when.md).
3. **Who is it from?** — `from`, with the hint that "Your mother" or "Someone who was 31 in 2026" can outlive a name.
4. **The letter** — a full-screen serif page, ~65ch measure. If an occasion was picked, its prompts appear as faint marginal questions (dismissible), never as form fields. Autosaves to a local draft on every pause.
5. **Who will keep it?** — optional custody: holder + one line of instructions, with the guidance from [../spec/custody.md](../spec/custody.md) distilled to two sentences. Skippable ("I'll keep it myself").
6. **Seal it** — a review of the facts; then sealing: the token draws itself (the one permitted flourish); the letter ID appears; the folder (`.zip`) downloads; the print kit opens ([print-kit.md](print-kit.md)); the registry records it. A toggle — default **off** — offers "keep a copy of the letter text in this browser"; the honest default is that the folder is the letter and a browser is not an archive.

## Format touchpoints
Produces the canonical folder per SPEC §1: `README.txt` (from the template, dates in words), `letter.txt` (LF line endings), `manifest.json` (schema doc), `checksums.txt`, `token.svg`. ID and `tokenSeed` derived per SPEC §4–5.

## Implementation
- `js/compose.js` — flow state machine (steps above), renders into `#screen-write`; no framework, direct DOM.
- `js/state.js` — `tessera_v1` localStorage: `{ drafts: {…}, registry: […], settings: {…} }`; draft autosave (debounced 500ms).
- `js/manifest.js` — pure: `buildManifest(fields)`, `renderReadme(fields)` (template from spec), `datesInWords(iso, lang)`, `deriveId(seedHex)`, canonical seed string builder. Dual browser/Node export for tests.
- `js/export.js` — assembles files, SHA-256 via WebCrypto, `checksums.txt`, zips via `js/zip.js` (vendored store-only writer), triggers download; hands the same data to the print view.
- `js/zip.js` — pure store-method zip writer (local headers + CRC-32 + central directory), dual export, fixture-tested.
- Offline: `sw.js` precaches the shell; compose/export/print work with no network (century test A).

## QA hooks
- `node tools/test-manifest.js` — ID derivation, seed canonicalisation, README rendering (fixtures), dates-in-words.
- `node tools/test-zip.js` — writes a fixture zip; `tar -tf` lists entries; CRC self-check.
- `/qa` browser pass: full compose→seal→download→print loop at 375px and desktop; draft survives reload; offline compose with dev-tools network off.

## Open questions
- Multi-letter drafts UI (v0.1 keeps one active draft per occasion slot; revisit if it chafes).
- `letter.md` (markdown) variant — deferred; plain text is the century-safe default and markdown is still plain text when it arrives.
