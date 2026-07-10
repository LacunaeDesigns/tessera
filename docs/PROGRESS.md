# Progress — execution tracker

The living record of what is actually done, against [roadmap.md](roadmap.md). Update when a task lands; `/release` refuses if this file lies. The cross-machine twin is the Ariadne vault (`projects/tessera.md`) — status there, granularity here.

**Snapshot (2026-07-10, night):** **v0.1.0 shipped.** The front door is live at tessera-letters.netlify.app (unlisted — no announcement), `main` minted and deployed, all gates re-run green the same evening. v0.2 (the opening) is next; plans are written.

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
| Zip reader + verification core | planned | [plans/v0.2-opening.md](plans/v0.2-opening.md) |
| Receive · verify · ceremony · write-back · custody intake | planned | same |
| ICS export + open-dates card | planned | [plans/v0.2-reminders.md](plans/v0.2-reminders.md) |
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
