# Progress — execution tracker

The living record of what is actually done, against [roadmap.md](roadmap.md). Update when a task lands; `/release` refuses if this file lies. The cross-machine twin is the Ariadne vault (`projects/tessera.md`) — status there, granularity here.

**Snapshot (2026-07-10):** docs canon complete · pure modules fixture-tested (54 tests green) · all v0.1 app modules code-complete but unverified in a browser · **blocker: the shell (`index.html` + `style.css`) does not exist yet** · plans written for v0.1 completion and all of v0.2.

## v0.1 — Foundations

| Item | State | Evidence / plan |
|---|---|---|
| Format spec + schema + README template + custody + century test | done | committed (SPEC.md, docs/spec/) |
| Pure modules: manifest.js · token.js · zip.js | done | 24 + 21 + 9 tests green (2026-07-10 audit) |
| Writing room (compose.js, state.js, export.js) | code-complete, unverified | audit 2026-07-10; verify via [plans/v0.1-completion.md](plans/v0.1-completion.md) Task 5 |
| Print kit renderer (print.js) | code-complete, needs print CSS | plan Task 3 |
| Registry (registry.js) | code-complete, unverified | plan Task 5 |
| Open-when set (data/occasions.js) | done, pending prose gate | plan Task 4 |
| Offline shell (sw.js, main.js, version.json) | code-complete | audit 2026-07-10 |
| **index.html + style.css** | **not started — the blocker** | plan Tasks 1–3 |
| tools/prose-check.js (Gate 2) | not started | plan Task 4 |
| Commit the module files (currently untracked) | pending browser proof | plan Task 6 |
| Founding letters (author) | not started | plan Task 7 — exit criterion |
| Ship: Netlify unlisted, repo flips public | not started | plan Task 7 |

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

- **2026-07-10** — Session: code audit (modules ~90%, all tests green, shell missing); wrote CLAUDE.md, six project skills, dev server, this tracker, and plans for v0.1 completion + full v0.2. Cost review: stack is $0 end-to-end on free tiers; only future watch-item is Netlify Forms at v1.0 (free-tier cap; zero-cost swap noted in plans/later-versions.md).
