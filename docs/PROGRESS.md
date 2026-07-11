# Progress — execution tracker

The living record of what is actually done, against [roadmap.md](roadmap.md). Update when a task lands; `/release` refuses if this file lies. The cross-machine twin is the Ariadne vault (`projects/tessera.md`) — status there, granularity here.

**Snapshot (2026-07-11):** **v0.3.2 shipped — the sealed-receipt overflow fix.** The mid-session 375px horizontal overflow (scrollWidth 444 after write → seal → open-overlay) is fixed: the sealed receipt's token SVG now sizes to its container instead of laying out at its raw 400px. One CSS rule, no format change. Previous: **v0.3.1 — the watercolor mosaic token.** The token disk's art is reborn as generation 2 (seeded pastel washes under a finer per-letter mosaic); generation 1 is frozen forever in `js/token-legacy.js` and `verifyLetter` falls back to it, so every previously sealed letter still verifies clean with no warning. No format change (fixtures byte-identical for the untouched files; old token fixtures renamed, never regenerated; new ones born). Triple at 0.3.1 / `'0.3.1'` / `'tessera-v0.3.1'`; `main` fast-forwarded from `dev`. All gates re-run this session (six suites incl. both-generation token tests, prose, full browser walkthrough, spec-sync clean), century-audit rows evidenced with a real physical walkthrough (printed, cut, matched by eye — not waived). Remaining v0.2 plans: encryption, then envelope-themes.

## v0.1 — Foundations

| Item | State | Evidence / plan |
|---|---|---|
| Format spec + schema + README template + custody + century test | done | committed (SPEC.md, docs/spec/) |
| Pure modules: manifest.js · token.js · zip.js | done | 24 + 21 + 9 tests green (2026-07-10 audit) |
| Writing room (compose.js, state.js, export.js) | done, browser-verified | full loop 2026-07-10: seal produced a spec-correct folder; SHA-256 checksums verified independently |
| Print kit renderer (print.js) | done, browser-verified | A4 + Letter PDFs generated from the real print engine; sheets break per page, footers self-identify |
| Registry (registry.js) | done, browser-verified | row after seal, reload persistence, reprint without kept text works |
| Open-when set (data/occasions.js) | done, prose gate green | `node tools/prose-check.js` clean 2026-07-10 |
| Offline shell (sw.js, main.js, version.json) | done, verified | 14 entries precached; offline reload + compose pass |
| App shell (app.html + style.css; was index.html pre-swap) | done | committed 2026-07-10; both themes, 375px-first screenshots; print engine now in shared print.css |
| tools/prose-check.js (Gate 2) | done | caught 2 real em-dash strings; both fixed |
| Commit the module files | done | commits `7949922`, `136cbbc` on `dev` |
| Landing page → the real front door (index.html + landing/) | done, browser-verified | implemented 2026-07-10 from the Claude Design handoff; promoted same day: ceremony seals through export.js, shelf reads tessera_v1, front-door swap; see decisions.md entries |
| Founding letters (author) | done | five sealed in `letters/` (gitignored): four by Claude, one by the author; more may follow post-ship (decisions.md 2026-07-10) |
| Ship: Netlify unlisted, repo flips public | shipped 2026-07-10 | v0.1.0 via `/release`: `main` minted from `dev`, Netlify deploys it at tessera-letters.netlify.app; repo public flip is the author's call (decisions.md gate) |

## v0.2 — The Opening

| Item | State | Plan |
|---|---|---|
| Zip reader + verification core | shipped v0.2.0 | [plans/v0.2-opening.md](plans/v0.2-opening.md) Tasks 1–2; `tools/test-open.js` green |
| Receive · verify · ceremony (Tasks 3–4) | shipped v0.2.0 | fourth door + date check + ceremony (`2dcc986`, `5f827d2`) |
| Write-back + custody intake (Task 5) | shipped v0.2.0 | reply lineage end-to-end; schema 3 (`role`); `31a8bb5` |
| ICS export + open-dates card | done, browser-verified (unreleased) | [plans/v0.2-reminders.md](plans/v0.2-reminders.md) all 3 tasks; `test-ics.js` + fixture; QA log below |
| Unify the front end (landing = the app) | done, browser-verified (unreleased) | [superpowers/plans/2026-07-11-unify-front-end.md](superpowers/plans/2026-07-11-unify-front-end.md); opening + reminders now live in the landing; app.html retired; QA log below |
| Passphrase privacy + escrow card + honesty page | planned | [plans/v0.2-encryption.md](plans/v0.2-encryption.md) |
| Envelope generator + print themes | planned | [plans/v0.2-envelope-themes.md](plans/v0.2-envelope-themes.md) |

## v0.3+

Every roadmap item through v2.x now has a written plan — index with confidence grades: [plans/later-versions.md](plans/later-versions.md). Three v2.x items (exchange, estate pack, physical kit) are deliberately gated definitions, not step plans, per their own canon.

## Infrastructure

| Item | State |
|---|---|
| CLAUDE.md (agent instructions) | done 2026-07-10 |
| Project skills: /qa /century-audit /spec-sync /occasion /token-lab /release | done 2026-07-10 |
| Dev server (tools/serve.js) + .claude/launch.json | done 2026-07-10 |
| CI (Gate 1 + prose on push) | deferred until repo is public (testing.md) |

## Log (newest first)

- **2026-07-11 (v0.3.1 — token generation 2, the watercolor mosaic)** — Released via `/release`.
  Version: patch bump to 0.3.1 (an art change within the token family; no format-breaking change —
  the manifest `tessera` spec version stays 0.1, `/spec-sync` confirms zero lines changed across
  every format-critical file). Triple moved together: `version.json` 0.3.1 · `LOCAL_VERSION`
  `'0.3.1'` · `CACHE_VERSION` `'tessera-v0.3.1'`. What shipped: the token disk is reborn as the
  **watercolor mosaic** (author-selected A2 from three rendered candidates): seeded pastel washes
  pooling beneath a finer per-letter ring mosaic (4–5 seeded rings, ~175–208 tiles, per-ring
  phase), ink-dark skeleton preserved for grayscale/fading; the break line and its interlocking
  notches are byte-identical to generation 1 — the authentication mechanism is untouched. Format
  event handled loudly: generation 1 frozen forever in `js/token-legacy.js`, original fixture
  bytes renamed (never regenerated) to `token-legacy-fix*.svg` and asserted against the frozen
  renderer, gen-2 fixtures born; `verifyLetter` falls back to the legacy renderer so every
  previously sealed letter verifies clean with no warning (proven in test-open: a gen-1-sealed
  folder returns tokenOk with zero token warnings, and the re-drawn art shown is the matching
  generation). Ship: `main` fast-forwarded from `dev`, pushed; Netlify deploys `main` (unlisted).
  Author approved the ship.

  Gates re-run this session, all green: Gate 1 — syntax sweep silent, six suites green (test-token
  walks both generations, 51 asserts), fixtures byte-identical (`git status --porcelain
  tools/fixtures/` empty). Gate 2 — prose clean but for the same nine justified WARNs as v0.3.0
  (code-comment em-dashes + the documented placeholder glyphs; no new letter-facing copy). Gate 3
  — full browser pass: seal shows gen-2 art on the receipt (209 tiles, wash fill-opacity present)
  and the print kit; a freshly sealed letter verifies clean via the current renderer ("They
  match.", no warnings); a letter built with the frozen legacy renderer verifies clean via the
  fallback (no "enclosed token" warning; the re-drawn figure is provably the legacy art — zero
  wash fill-opacity, ~64-tile count) and still opens and reads correctly; zero console errors; no
  external requests; 375px clean. Token-lab visual pass: fixture seeds + four exploratory seeds
  rendered at full/faded/drawer-distance on the companion — wash-core stacking caps at ~0.79 alpha
  of a light pastel (cannot go opaque-dark), break-stroke contrast bottoms at ~1.8:1 over gold
  pastel (same order as gen 1 over its warm mids, ~8:1 over ink). `/spec-sync` clean: zero lines
  changed across every format-critical file (manifest.js, zip.js, export.js, SPEC.md, spec docs)
  in all seven token commits.

  Century audit (letter-level rows carry from v0.3.0 — no format change; the token row is
  re-evidenced for both generations this session; **physical walkthrough done, not waived**: the
  author printed a real generation-2 sheet, cut it, and matched the halves by eye — decisions.md):

  | Row | Verdict | Evidence |
  |---|---|---|
  | A: no required URL · file:// + no external requests · fork = identical tool · data only on device | ✓ | unchanged since v0.3.0; token art carries no network dependency in either generation |
  | B: UTF-8 no BOM · zip store · manifest ⊂ README · dates ISO+words | ✓ | six suites green, fixtures byte-identical; manifest/zip/export untouched |
  | B: token.svg plain, no scripts/refs/fonts/filters — **both generations** | ✓ | node check: gen 2 and legacy both `noScript/noFilter/noExternal/genericFontsOnly = true` |
  | B: media guidance | n-a | no media |
  | C: spec CC0 · tool MIT · format outlives project · decisions recorded | ✓ | unchanged; decisions.md holds the format-event entry + the physical-check record |
  | D: paper completeness · cold-read · checksums · assembly | ✓ | kit structure unchanged; only the token's tile art changed |
  | D: token authenticates by eye | ✓ (done, not waived) | author printed a gen-2 sheet, cut along the dashed line, halves matched by eye |

- **2026-07-11 (v0.3.2 — sealed-receipt overflow fix)** — Released via `/release`. Version: patch
  bump to 0.3.2 (a layout fix, no format change). Triple: `version.json` 0.3.2 · `LOCAL_VERSION`
  `'0.3.2'` · `CACHE_VERSION` `'tessera-v0.3.2'`. The browser-QA layout quirk (scrollWidth 444
  at a 375px viewport after write → seal → open-overlay, no reload) is fixed. Root cause was not the
  typewriter scene as the QA pass suggested — `.sec-hero { overflow: clip }` contains it in every
  phase — but the sealed receipt injecting the full token SVG (`width="400"` attributes) into
  `.sealed-token` (max-width 230px) with no svg sizing rule, inside `.sec-seal`, which has no
  overflow clip: right edge exactly 444. One-line fix in `landing.css`
  (`.sealed-token svg { width: 100%; height: auto; }`, the `.token-half svg` idiom); the token now
  renders at its container width. Verified independently in-browser this session (twice — once on
  the fix branch, once after merge): scrollWidth === clientWidth === 375 at every phase (fresh,
  writing, sealed, open overlay); six Gate-1 suites green; prose clean (same justified WARNs);
  `/spec-sync` trivial (no format-critical file touched); zero console errors; no copy changes.
  Ship: `main` fast-forwarded from `dev`, pushed; Netlify deploys `main` (unlisted).

  Century audit: n/a for a CSS-only fix touching no format/century-test row; letter-level rows
  carry unchanged from v0.3.1.

- **2026-07-11 (v0.3.0 — one front end)** — Released via `/release`. Version: minor bump to 0.3.0
  (two whole capabilities land — reminders and the unified front end — with no format-breaking
  change; the manifest `tessera` spec version stays 0.1, fixtures byte-identical). Triple moved
  together: `version.json` 0.3.0 · `LOCAL_VERSION` `'0.3.0'` (now in `js/version.js`) ·
  `CACHE_VERSION` `'tessera-v0.3.0'`. What shipped: the redesigned landing is now the whole app —
  writing at the typewriter desk, opening a received letter with ceremony (a focused overlay),
  answering it forward, keeping one for someone, and calendar/wallet-card reminders. `app.html`
  retired to a redirect; `compose.js`/`registry.js`/`main.js`/`style.css` deleted; `open.js`
  pruned to its pure verification core; `LOCAL_VERSION` relocated to `js/version.js`. Ship: `main`
  fast-forwarded from `dev`, pushed; Netlify deploys `main` (unlisted). Author approved the ship.

  Gates re-run this session, all green: Gate 1 — syntax sweep silent, six suites green
  (`test-open` passes unchanged after the prune, proving the verification core is intact),
  fixtures byte-identical. Gate 2 — prose clean but for four justified WARNs (two code-comment
  em-dashes in `print.js`/`manifest.js`; two `'—'` empty-field placeholder glyphs in the landing
  receipt preview — the documented v0.1.0 placeholders; the new `opening.js`/`reminders.js` copy
  is em-dash-free; `prose-check.js`'s default file list corrected to drop the deleted renderers
  and add the landing modules). Gate 3 — full browser walkthrough at 375px then desktop: the
  typewriter desk still writes and seals (fresh `TSR-7f69-6d8d`, `writeback` null, receipt +
  shelf + reload persistence); opening loop drop → verify (4/4 checksums, token compare) → future
  date interstitial → ceremony → letter; answer-forward launches the reply desk; a sealed reply's
  manifest + README carry the lineage and re-verify clean; custody → "in your keeping" card,
  deduped; reminders (all-dates ICS excludes open-when, includes dated custodian; wallet card
  two-up ink-light); `app.html` redirects to `/`; zero console errors; no external requests; no
  375px overflow. /spec-sync clean (no format module changed).

  Century audit (format unchanged, so letter-level rows are the same artifacts audited at v0.2.0
  this session; web-tool rows re-verified in the Gate-3 walkthrough; **physical walkthrough
  waived** — reused from v0.2, no new paper artifact, kit structure unchanged, decisions.md):

  | Row | Verdict | Evidence |
  |---|---|---|
  | A: no required URL in export | ✓ | format unchanged since v0.2.0 audit; reply README adds only the letter ID |
  | A: file:// + no external requests | ✓ | Gate-3 network log across desk-seal + opening + reminders: only same-origin, `blob:`, one inline `data:` icon — 0 external; SW registration stays `file://`-guarded |
  | A: fork = identical tool, no keys | ✓ | no package.json/build; fewer files than before (plain app deleted) |
  | A: data only on device + exports | ✓ | single `tessera_v1` key; custody stores facts-only; network log confirms nothing leaves |
  | B: UTF-8 no BOM · zip store · manifest ⊂ README (incl. writeback) · dates ISO+words · token.svg plain | ✓ | six suites green, fixtures byte-identical; no format module changed |
  | B: media guidance | n-a | no media |
  | C: spec CC0 · tool MIT · format outlives project · decisions recorded | ✓ | unchanged; decisions.md holds the unification entries |
  | D: paper completeness · cold-read · token-by-eye · checksums · assembly | ✓ (structure) | print engine + kit unchanged; physical re-walk waived (above) |
  | (note) both palettes | n-a | the app is single-palette by design now (decisions.md 2026-07-11); the lamplight dark theme lived only in the retired app.html |

- **2026-07-11 (front end unified — on dev, unreleased)** — The two-front-end split is gone: the
  redesigned landing is now the whole app, and `app.html` is a redirect to `/`. Executed
  superpowers/plans/2026-07-11-unify-front-end.md in four phases, each committed. Phase 0: relocated
  `LOCAL_VERSION` to `js/version.js`, pruned `open.js` to its pure verification core (test-open green
  unchanged, −338 lines), deleted `compose.js`/`registry.js`/`main.js`/`style.css` (−894 lines),
  redirected `app.html`, updated the SW CORE. Phase 1: `landing/opening.js`, the opening ritual as a
  focused overlay in the landing's skin (intake → verify → date gate → ceremony → reveal), reusing
  the pure `verifyLetter`; the enclosed token shown only as a `blob:` image. Phase 2: "Answer it
  forward." (`TesseraLanding.answerForward` → the desk carries `writeback` into the seal → manifest +
  README lineage) and custody intake ("I am keeping this for someone" → an "in your keeping" shelf
  card, deduped, shelf refreshed via `TesseraLanding.refreshShelf`). Phase 3: `landing/reminders.js`
  — "Add to calendar" on the sealed receipt and a shelf-level "Calendar file (all dates)" + "Print a
  wallet card" (the decorative shelf stays uncluttered; decisions.md). Gates: six suites green,
  fixtures byte-identical, prose clean; browser-verified per phase (opening loop, write-back reply
  re-verifies clean, custody, reminders, reduced motion, no console errors, no external requests).
  No format change (`tessera` stays 0.1). Decisions + architecture + opening docs updated. Awaits
  `/release` as **v0.3.0** (reminders + the unified front end shipping together); the versioning
  triple and SW CORE move at release.

- **2026-07-10 (v0.2 reminders — on dev, unreleased)** — plans/v0.2-reminders.md landed, all three
  tasks. Task 1: `js/ics.js`, a pure/deterministic RFC 5545 builder (dual-env, no Date.now — the
  DTSTAMP is the letter's `written` date) with `tools/test-ics.js` (13 asserts: envelope, all-day
  DTSTART, DTSTAMP, 75-octet folding by code point, §3.3.11 escaping, multi-letter calendars,
  optional VALARM, determinism) and a born fixture `reminder-fix1.ics` asserted byte-identical.
  Gate-1 suite list in CLAUDE.md + testing.md corrected to name all six suites (`test-open` had
  drifted off). Task 2: wired into the sealed screen, every registry row (waiting + in-keeping),
  and a whole-registry "Calendar file (all dates)" — open-when letters are never offered a
  calendar file (no date to remember); `export.js` grew a generic `downloadText`. Task 3: the
  open-dates card, a `print.js` register variant (`sheet-card`) — the same wallet/drawer card
  twice on one A4 split by a dashed cut line, listing ID · opens · for, self-identifying; reached
  by "Print a wallet card" in the ledger. Browser-verified: ICS builder output correct, button
  gating right across all surfaces, card renders two copies with the dashed cut and is ink-light
  (paper cream sheet, transparent cards, zero dark solid fills), zero console errors, no external
  requests. Six suites green; prose WARNs are all code-comment em-dashes (house convention).
  Commits `c9871fd` (builder), `2fb9d2e` (wiring), Task 3 following. Not yet released — waits for
  the next `/release` (the triple stays at 0.2.0; `js/ics.js` is in the SW CORE but CACHE_VERSION
  moves only via /release). Remaining manual check deferred to the author: import an exported
  `.ics` into two calendar apps (Google + Outlook) to confirm the all-day event lands on the day.

- **2026-07-10 (v0.2.0 — the opening ships)** — Released via `/release`. Version: minor bump to
  0.2.0 (a whole new capability, the opening, with no format-breaking change — the manifest
  `tessera` spec version stays 0.1; the reserved `writeback` field simply came alive and the
  README gained a conditional, additive lineage line). Triple moved together: `version.json`
  0.2.0 · `LOCAL_VERSION` `'0.2.0'` · `CACHE_VERSION` `'tessera-v0.2.0'`. What shipped: the fourth
  door — a store-method zip reader, verification core (checksums + token re-derivation + README
  fallback), the date interstitial, the ceremony (paper-first offer, chrome quiets, facts held a
  breath, letter fades in; reduced-motion collapses), "Answer it forward." write-back carrying
  `{inReplyTo, generation}` into the sealed manifest and README, and custody intake (facts-only
  `role: "custodian"` entries, storage schema 3). Ship: `main` fast-forwarded from `dev`, pushed;
  Netlify deploys `main` at tessera-letters.netlify.app (unlisted).

  Gates re-run this session, all green: Gate 1 — syntax sweep over every tracked JS silent, five
  module suites green (`test-manifest` with new writeback/lineage asserts, `test-zip`,
  `test-token`, `test-state` at schema 3, `test-open` with writeback round-trip), fixtures
  byte-identical. Gate 2 — prose clean. Gate 3 — full browser walkthrough 375px-first then
  desktop: real wizard seal (auto-download, registry row persists reload), print overlay, opening
  door across clean/tamper/early-open, ceremony + reduced-motion, both themes, no overflow, zero
  console errors, SW re-registered (26 precached entries). /spec-sync clean after the
  readme-template lineage addition.

  Century audit (all rows evidenced this session; **physical walkthrough waived** — author-
  accepted, decisions.md 2026-07-10: kit structurally identical to the v0.1.0 walkthrough, sole
  new paper element is the wrap-tested lineage line):

  | Row | Verdict | Evidence |
  |---|---|---|
  | A: no required URL in export | ✓ | reply README adds only the letter ID; "web addresses die, none required" intact |
  | A: file:// + no external requests | ✓ | network log across open→verify→ceremony→answer→reply-seal: only same-origin, `blob:`, one inline `data:` icon — 0 external |
  | A: fork = identical tool, no keys | ✓ | no package.json/build; opening feature pure vanilla |
  | A: data only on device + exports | ✓ | custody intake stores facts-only locally; network log confirms nothing leaves |
  | B: UTF-8, no BOM | ✓ | node hex check on all five files of a real reply |
  | B: zip store method | ✓ | reply letter text found raw in zip bytes; suite green |
  | B: manifest ⊂ README prose (incl. writeback) | ✓ | node: all seven facts incl. lineage in prose; originating letter emits none |
  | B: dates ISO + words | ✓ | "the twenty-first of June, two thousand and forty-four (2044-06-21)" |
  | B: media guidance | n-a | no media in v0.2 |
  | B: token.svg plain, no scripts/refs/fonts | ✓ | only `xmlns` namespace + internal `url(#cut-*)`; token.js untouched |
  | C: spec CC0 · tool MIT · format outlives project · decisions recorded | ✓ | headers unchanged; decisions.md has the three v0.2 entries + the waiver |
  | D: paper completeness · cold-read · token-by-eye · checksums · assembly | ✓ (structure) | kit structurally identical to the v0.1.0 physical walkthrough; physical re-walk waived (above) |

- **2026-07-10 (v0.2 write-back + custody intake)** — Task 5 of plans/v0.2-opening.md landed,
  closing the plan's implementation tasks. Write-back: "Answer it forward." after the ceremony
  hands `{inReplyTo, generation}` to compose (new `TesseraCompose.answerForward`; attach-never-
  discard if a draft exists — decisions.md), the draft carries it through reload, and
  `doSeal → export.seal → buildManifest` threads it into the sealed manifest. The README grows a
  conditional lineage line ("In answer to: …") because the manifest may never say what the README
  doesn't — an additive format event, recorded in decisions.md + readme-template.md; fixtures
  byte-identical, manifest `tessera` stays 0.1. Custody intake: "I am keeping this for someone"
  on the verify screen records facts-only `role: "custodian"` entries (schema 3 via
  `state.migrate()`, everything older backfills `role: "writer"`); the shelf gains "In your
  keeping". Browser QA at 375px with a synthetic letter: custody intake → confirmation → shelf
  row → reload persists → dedupe ("It is already in your keeping."); full reply loop: open →
  ceremony → Answer it forward → draft carries generation 1 → sealed as a real zip whose manifest
  and README both speak the lineage — and which re-verifies clean through the opening door with
  `facts.writeback` intact (generation 2 would follow). Zero console errors, no overflow. Gate 1
  green (five suites; new writeback/schema-3/lineage tests), prose clean, /spec-sync clean after
  the template fix. Full /qa closed the task same day: Gate-3 walkthrough at 375px then desktop —
  real wizard seal (TSR-1d81-9584, auto-download, registry row persists reload), print overlay
  (cover + instructions sheets, footers), tamper flow (letter.txt "does not match" with the
  cascade of warnings, reading still allowed, edited P.S. visible), early-open interstitial with
  the exact canon copy and once-per-session gating, reduced-motion collapse, both themes
  (lamplight rgb(28,24,19) / paper rgb(247,243,234)), no overflow either size, zero console
  errors, SW re-registered with 26 precached entries, screenshots captured.

- **2026-07-10 (v0.2 ceremony)** — Task 4 of plans/v0.2-opening.md landed (`5f827d2`): the reveal
  offers paper first ("Read it on paper instead" → shared print-kit preview, always the re-drawn
  token, never the enclosed SVG — decision recorded in decisions.md), and reading here quiets the
  chrome, holds the facts ~2s, and fades into the letter. Browser QA with a synthetic letter
  (TSR-ce0a-e4d4, built from the real format helpers, deleted after): intake → verify (4/4
  checksums, facts from manifest) → reveal → ceremony end-to-end; reduced-motion collapses
  straight to the text (no intro, no animation class); leaving mid-ceremony by nav restores the
  chrome instantly and the guarded timers never render the letter over the next screen; Done →
  chrome back, `#home`; paper path renders all four sheets with the re-drawn token and Back
  returns to the reveal; zero console errors; 375px clean (no horizontal overflow). Gate 1 green
  (all five suites incl. test-open), prose clean. QA note for next time: the driver must route
  through another hash between `#open` runs — navigating `#open`→`#open` fires no hashchange
  (this, not an app bug, was the prior session's "flow stops" symptom).

- **2026-07-10 (v0.1.0 — first ship)** — Released via `/release`. Version: the triple already
  read `0.1.0` / `'0.1.0'` / `'tessera-v0.1.0'` consistently and nothing had ever shipped, so
  0.1.0 ships as-is (a bump would misstate the first release). What shipped: the whole of v0.1 —
  the landing as the real front door (ceremony sealing through the one `export.js` path), the
  quiet app at `app.html`, print kit with the landing faces, schema-2 storage, offline shell,
  five founding letters sealed in the author's keeping. Ship: `main` minted from `dev`
  (fast-forward), pushed; Netlify serves it unlisted at tessera-letters.netlify.app.
  Gates re-run this session, all green: syntax sweep over every tracked JS silent; four module
  suites green with fixtures byte-identical; prose clean; browser pass 375px-first then desktop
  (front-door seal `TSR-2641-af4b` end-to-end: wizard → typed letter → real zip download with
  independently re-verified SHA-256 checksums → registry row (schema 2, sealKey) → reload
  persists → both-door visibility → ceremony print kit as real A4 + Letter PDFs, 4 sheets,
  footers, assembly line on the cover, faces per canon with the letter body on the system stack
  per the same-day specimen verdict); offline via SW cache (43 entries) with both doors and the
  writing room working; lamplight palette exact under emulated dark; reduced-motion gate present.
  Known-and-accepted: repeated AudioContext autoplay warnings under automation (sound starts on
  first real user gesture; zero console errors otherwise).

  Century audit (all rows evidenced this session; walkthrough by the author 2026-07-10 with the
  cover-sheet finding fixed same day and the amended line re-read on paper):

  | Row | Verdict | Evidence |
  |---|---|---|
  | A: no required URL in export | ✓ | folder grep: only the SVG xmlns namespace identifier; README says "Web addresses die, so none is required" |
  | A: file:// + no external requests | ✓ | both doors load from `file://`, wizard opens; request log during compose→seal→print: 1 request, all same-origin, 0 external |
  | A: fork = identical tool, no keys | ✓ | no package.json, no node_modules, no build; static files only |
  | A: data only on device + exports | ✓ | single localStorage key `tessera_v1`; downloads; 0 external requests |
  | B: UTF-8, no BOM | ✓ | first-bytes hex of all five files: no EF BB BF |
  | B: zip store method | ✓ | letter text found by grep in raw zip bytes; suite green |
  | B: manifest ⊂ README prose | ✓ | live seal compared field-by-field; suite asserts the sections |
  | B: dates ISO + words | ✓ | live README: "the tenth of July, two thousand and thirty-six (2036-07-10)" |
  | B: media guidance | n-a | no media in v0.1 |
  | B: token.svg plain, no scripts/refs/fonts | ✓ | suite rows + live grep: 0 scripts; generic families only |
  | C: spec CC0 | ✓ | SPEC.md header; century-test.md header |
  | C: tool MIT, self-contained | ✓ | LICENSE (MIT, 2026 Rika Lim); no dependency registry |
  | C: format outlives project | ✓ | SPEC.md pencil clause; README "Everything essential is already in your hands" |
  | C: decisions recorded | ✓ | decisions.md append-only, updated same day |
  | D: paper is a complete letter | ✓ | 5-page kit PDF: cover, letter, instructions ×2, token |
  | D: README works cold | ✓ | author's cold-read 2026-07-10 (walkthrough step 4) |
  | D: token by eye | ✓ | token sheet: halves, dashed cut line, "works by eye; no machine is needed" |
  | D: checksums an offer | ✓ | README: "Any computer of your era can do this check; none needs to" |
  | D: kit teaches assembly | ✓ | cover line "This page goes on the outside…" in today's PDF; walkthrough finding closed |

- **2026-07-10 (author paper tasks clear)** — The three remaining author tasks landed in one
  sitting: specimen verdict is B (letter body stays on the system serif stack; no CSS change,
  `specimen.html` deleted, canon updated in design-language.md §Typography); founding letters
  settled (v0.1 ships with the five already sealed in `letters/` — four by Claude, one by the
  author; see decisions.md); the amended cover-sheet line re-read on paper against the
  century-test protocol and passed. v0.1 now waits only on the Netlify site setup (author
  account) and `/release`.

- **2026-07-10 (landing goes real)** — The front door is the landing and the ceremony is real:
  sealNow() ends in TesseraExport.seal() → registry → download (random-seed souvenir deleted),
  shelf reads tessera_v1 (demo letters retired — their IDs collided with the founding letters'),
  print engine shared via print.css so the kit prints at the ceremony, index.html→app.html +
  landing.html→index.html, fonts consolidated to fonts/, storage schema 2 (sealKey) via migrate()
  with tools/test-state.js as the fourth Gate-1 suite. Browser-verified end-to-end on both doors
  (front-door seal → entry visible in app.html#letters → reload persists; 22-entry precache;
  zero console errors; 375px clean). Author cleared the image licensing gate the same day, so
  this ships with v0.1 via /release. Spec: superpowers/specs/2026-07-10-landing-goes-real-design.md.

- **2026-07-10 (print base look)** — Print kit typography aligned with the landing:
  `fonts/` vendors Young Serif + Courier Prime (OFL), style.css maps display/typewriter
  faces onto the existing sheet classes with system-stack fallbacks, sw.js precaches the
  TTFs (CACHE_VERSION untouched). Letter body awaits the specimen print (author, paper;
  `specimen.html`, temporary). Gates green (module suites, prose clean, browser pass at
  375px + desktop, fonts in SW cache, no external requests); /spec-sync clean. Spec:
  superpowers/specs/2026-07-10-print-base-look-design.md.

- **2026-07-10 (physical walkthrough)** — First physical century walkthrough (author, real printer). Finding: the kit never said the cover sheet faces out — following the protocol sealed the instructions page inside and left the envelope blank. Fixed same day: assembly line on the cover sheet (print.js), century-test.md steps 2/4 amended + new assembly D-check, print-kit.md and testing.md aligned, decisions.md entry. Author reports the remaining walkthrough steps passed (text-editor reopen, cold read of the instructions page).

- **2026-07-10 (late night, second pass)** — Author-requested mobile/UX polish on the landing plus responsive background overhaul: all three floral sections now select author-generated art compositions per screen shape (media queries, JPEG q88, assets 7.9→4.4 MB); on phones the wizard is a centered dialog over a scrim, the letters shelf is a swipeable snap rail, and touch targets / focus-visible rings / 16px mobile inputs / reduced-motion-gated reveals landed page-wide. Found and fixed en route: a `justify-content` axis flip that pushed the scene over the hero copy in column layout, and a genuine 77px horizontal overflow at 375px (gone with the rail). Desktop unchanged; gates green.

- **2026-07-10 (late night)** — Landing page implemented from the author's Claude Design project ("Tessera landing implementation", handoff bundle verified byte-identical to the live design). New surface: `landing.html` + `landing/` (css, js, 17 images, vendored OFL fonts for Young Serif + Courier Prime). Vanilla port of the full prototype: CSS-drawn typewriter with working carriage/caret/type-bar, synthesized Web Audio (clack/bell/zip, toggleable), auto-typing intro demo, setup wizard, seal step with 12-seal picker, receipt preview, ceremonial sealing that mints a real `token.js` token, three-presentation letters shelf. Reuses `data/occasions.js` and `js/token.js` unchanged; app shell and versioning triple untouched. Gates: syntax + all module tests green, prose-check clean apart from two justified placeholder-glyph WARNs (decisions.md), browser QA at desktop + 375px with zero console errors. Author gate added: confirm background/wax-seal image licensing before the landing ships publicly.

- **2026-07-10 (night)** — First real use of the writing room (two letters sealed through the app: TSR-471a-31bf, TSR-1e9e-906d) immediately surfaced a bug: the autosave debounce could re-persist a just-sealed draft after `clearDraft`, so re-entering `#write` resumed an already-sealed letter at the review step. Fixed in `doSeal` (cancel timer, drop live draft) and verified in-browser: post-seal `#write` starts at "1 of 6". `letters/` added to .gitignore so personal sealed folders never ship with a public repo. Bonus finding: `datesInWords` renders 2126 correctly.

- **2026-07-10 (evening)** — Executed plans/v0.1-completion.md Tasks 1–6. Shell landed; full browser QA: compose→seal loop produced folder `TSR-17ee-5e98` with all five spec files, checksums re-verified with Get-FileHash, print engine proven via A4 + Letter PDFs, offline pass green (14 precached entries), lamplight + paper themes screenshotted, 375px first. prose-check caught and fixed two real em-dash UI strings. Known dev-only friction: the service worker's cache-first strategy serves stale files during development; unregister the SW (or bump CACHE_VERSION) after editing shell files. Remaining: Task 7 (author).
- **2026-07-10** — Session: code audit (modules ~90%, all tests green, shell missing); wrote CLAUDE.md, six project skills, dev server, this tracker, and plans for v0.1 completion + full v0.2. Cost review: stack is $0 end-to-end on free tiers; only future watch-item is Netlify Forms at v1.0 (free-tier cap; zero-cost swap noted in plans/later-versions.md).
