---
name: qa
description: Run the Tessera QA gates (syntax/units, prose, browser walkthrough) from docs/engineering/testing.md. Use before claiming any change is done, and before /release.
---

# /qa — the definition of done

Green ≠ done. Run every gate that applies; report each with evidence, not adjectives. An unread WARN is not a pass.

## Gate 1 — syntax & units (every change)
1. `node --check` every touched JS file.
2. `node tools/test-manifest.js` · `node tools/test-zip.js` · `node tools/test-token.js` (later: `test-ics.js`, `test-crypt.js`). All must pass.
3. If any fixture in `tools/fixtures/` changed: STOP. A fixture diff is a format event — it needs a spec-version note and a `docs/decisions.md` entry. Never regenerate silently.

## Gate 2 — prose (any letter-facing copy change)
- `node tools/prose-check.js` over UI strings, `data/occasions.js`, and README-template output.
- Read every WARN and say what you did about it. Banned: em-dashes (outside interrupted speech), negation-anaphora stacks, urgency patterns, therapy-speak, AI-tell words (rules: docs/design-language.md + docs/features/open-when.md).

## Gate 3 — browser (every feature change)
Start the preview server (`.claude/launch.json` → "tessera", or `node tools/serve.js`).
1. **375px first** (house rule) — screenshot, don't trust computed styles. Then desktop.
2. Full loop: compose → seal → zip downloads → print view renders → registry row appears → reload persists.
3. Offline: dev-tools offline after first load; compose/seal/print still work.
4. Print preview at **A4 and US Letter**: page breaks between sheets, footer on every sheet, no clipped content, ink-light rule (no solid fields).
5. Both themes (paper / lamplight); `prefers-reduced-motion` on the sealing flourish.

## Resilience rules (Gate 3)

- **Environment first** (user-level `env-doctor` skill has the full list): confirm the server on 8137 serves THIS working tree (`Get-NetTCPConnection -LocalPort 8137 -State Listen`, check the owning process — another chat's server has hijacked ports before); cache-bust every navigation (`?v=<timestamp>`); the SW can serve a stale build — confirm the version triple matches the checkout.
- **Timeout policy:** a capture that times out gets ONE retry; on second failure fall back to the accessibility tree / rendered text and mark that item `verified-via-DOM`. Two consecutive automation stalls → finish the walkthrough manually and say so in the report. A late honest report beats a hung session.
- **Budget guard:** before Gate 3, check usage (`npx -y ccusage@latest blocks --active --json`); at ≥90% of the 5-hour window, report Gates 1–2 now and checkpoint Gate 3 for a fresh session.

## Report format
One line per gate item: ✓/✗/n-a + evidence (command output line, screenshot, or file:line). Any ✗ means not done — say so plainly.
