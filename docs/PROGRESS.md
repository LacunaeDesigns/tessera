# Progress — execution tracker

The living record of what is actually done, against [roadmap.md](roadmap.md). Update when a task lands; `/release` refuses if this file lies. The cross-machine twin is the Ariadne vault (`projects/tessera.md`) — status there, granularity here.

**Snapshot (2026-07-10, evening):** the app runs. Shell shipped and browser-verified end-to-end (compose → seal → zip with independently verified checksums → print kit PDFs at A4 + Letter → registry → reload persistence → offline). All modules committed on `dev`. Remaining for v0.1: the author tasks (founding letters, physical century walkthrough, Netlify unlisted ship).

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
| index.html + style.css | done | committed 2026-07-10; both themes, 375px-first screenshots |
| tools/prose-check.js (Gate 2) | done | caught 2 real em-dash strings; both fixed |
| Commit the module files | done | commits `7949922`, `136cbbc` on `dev` |
| Founding letters (author) | not started | plan Task 7 — exit criterion |
| Ship: Netlify unlisted, repo flips public | not started | plan Task 7; needs the physical century walkthrough first |

## v0.2 — The Opening

| Item | State | Plan |
|---|---|---|
| Zip reader + verification core | planned | [plans/v0.2-opening.md](plans/v0.2-opening.md) |
| Receive · verify · ceremony · write-back · custody intake | planned | same |
| ICS export + open-dates card | planned | [plans/v0.2-reminders.md](plans/v0.2-reminders.md) |
| Passphrase privacy + escrow card + honesty page | planned | [plans/v0.2-encryption.md](plans/v0.2-encryption.md) |
| Envelope generator + print themes | brief only | [plans/v0.2-envelope-themes.md](plans/v0.2-envelope-themes.md) |

## v0.3+ 

Briefs with definition-of-ready triggers: [plans/later-versions.md](plans/later-versions.md).

## Infrastructure

| Item | State |
|---|---|
| CLAUDE.md (agent instructions) | done 2026-07-10 |
| Project skills: /qa /century-audit /spec-sync /occasion /token-lab /release | done 2026-07-10 |
| Dev server (tools/serve.js) + .claude/launch.json | done 2026-07-10 |
| CI (Gate 1 + prose on push) | deferred until repo is public (testing.md) |

## Log (newest first)

- **2026-07-10 (evening)** — Executed plans/v0.1-completion.md Tasks 1–6. Shell landed; full browser QA: compose→seal loop produced folder `TSR-17ee-5e98` with all five spec files, checksums re-verified with Get-FileHash, print engine proven via A4 + Letter PDFs, offline pass green (14 precached entries), lamplight + paper themes screenshotted, 375px first. prose-check caught and fixed two real em-dash UI strings. Known dev-only friction: the service worker's cache-first strategy serves stale files during development; unregister the SW (or bump CACHE_VERSION) after editing shell files. Remaining: Task 7 (author).
- **2026-07-10** — Session: code audit (modules ~90%, all tests green, shell missing); wrote CLAUDE.md, six project skills, dev server, this tracker, and plans for v0.1 completion + full v0.2. Cost review: stack is $0 end-to-end on free tiers; only future watch-item is Netlify Forms at v1.0 (free-tier cap; zero-cost swap noted in plans/later-versions.md).
