---
name: release
description: Version bump + ship — refuses without green gates. Bumps the versioning triple together, records notes, merges dev → main. Use only when a release is intended.
---

# /release — version bump + ship

`/release` refuses politely unless the gates ran **this session** with evidence. No exceptions; that is its job.

## Preconditions (all required)
1. `/qa` Gates 1–3 run with evidence in this session; all ✓.
2. `/century-audit` run for this release; no unexplained ✗ (Gate 4 physical walkthrough recorded for the release).
3. Docs gate (Gate 5): `docs/README.md` indexes every doc; `grep -ri "TBD" docs/` is empty; decisions made during the work are in `docs/decisions.md`; format changes reflected in SPEC.md + schema doc + app (run `/spec-sync`).
4. `docs/PROGRESS.md` reflects what actually shipped.

## Procedure
1. Choose the version (semver; format changes move the spec version separately and loudly).
2. Bump the **versioning triple together, never by hand elsewhere**:
   - `version.json` → `"version"`
   - `js/main.js` → `LOCAL_VERSION`
   - `sw.js` → `CACHE_VERSION` (e.g. `tessera-v0.1.1`)
3. Write the release note (docs/PROGRESS.md log section): version · date · what shipped · century-audit table · any explained ✗.
4. Commit on `dev`.
5. Ship: fast-forward merge `dev` → `main`, push both. `main` is release-only; Netlify deploys from it (once wired at v0.1 ship — until then, stop after the merge and say so).
6. Update the Ariadne vault (`projects/tessera.md`): status line + dated decision entries.

## Refusal format
If any precondition is missing, list exactly which, with what evidence would satisfy it, and stop. Do not bump anything.
