# Opening (v0.2) — receive, verify, ceremony, write-back

## Purpose
Receiving is half the product. v0.2 gives the opener a door of their own: verify a letter is intact and genuine, open it with the weight it deserves, and answer it forward.

## Walkthrough
The landing gains a door of its own: **Open a letter** (a nav item), which opens a
focused overlay over the dimmed page — the same takeover pattern the setup wizard uses,
so the ceremony gets its quiet. The whole ritual happens in that overlay.

1. **Receive** — drop in a Tessera folder or zip (file input; nothing uploads — century test A). The tool reads `manifest.json`/`README.txt`, shows the facts: from, for, sealed, opens.
2. **Verify** — checksums recomputed and compared; token re-derived from `letter.txt` + manifest fields and displayed beside the enclosed `token.svg`; if the opener holds a physical half, the screen shows the break line large for matching by eye. Verification failures warn gently and *never block reading* (a damaged letter is still a letter; the priority rule holds).
3. **The date check** — if `openOn` is future, the tool says so and asks, once, without judgment: *It asked to wait until {date-in-words}. Open anyway?* The ritual is honest, not enforced (SPEC §7).
4. **Ceremony** — a paced reveal: the facts, a breath, then the letter, typeset as the print kit sets it, one screen, no chrome. `prefers-reduced-motion` collapses the pacing to a single quiet appearance.
5. **Write back** — the invitation: *Answer it forward.* Composing from here sets `writeback: { inReplyTo: <id>, generation: n }` — letter genealogies whose replies take decades (the manifest field is reserved in v0.1 precisely so v0.1 letters can be answered).
6. **Custody intake** — alternatively: *I am keeping this for someone* records a registry entry (custodian view) without opening anything.

## Implementation
- `js/open.js` — PURE verification core: `verifyLetter(entries)` (checksums, token
  re-derivation, README fallback), `readmeFacts`, `parseChecksums`. DOM-free and
  Node-tested (`tools/test-open.js`). Reads folders via the store-method reader in
  `js/zip.js`.
- `landing/opening.js` — the opening overlay UI (intake, verify, date gate, ceremony,
  reveal, custody intake), rendered in the landing's visual language. It calls
  `TesseraOpen.verifyLetter` + `TesseraZip.readZip` for all format work, `TesseraPrint`
  for "read it on paper", and `TesseraLanding.answerForward` for write-back. The
  enclosed `token.svg` is shown only as a `blob:` image; only the re-drawn token (our
  own SVG) is ever injected.
- Write-back rides the landing's one seal path: `answerForward` stashes
  `{inReplyTo, generation}` on the compose state, `sealNow` passes it as
  `fields.writeback`, and `export.js`/`manifest.js` write it into the manifest and the
  README's "In answer to" line.
- Registry gains `role: "writer" | "custodian" | "opened"` (storage schema 3).

## QA hooks
- `node tools/test-zip.js` read-back round-trips; `node tools/test-open.js` verification core.
- `/qa`: verify-pass, tamper (edited letter.txt ⇒ checksum warning, reading still allowed), early-open flow, write-back manifest correctness, reduced-motion ceremony.

## Resolved
- Ceremony offers to *print* the letter before showing it ("read it on paper instead") —
  shipped; one more nudge toward the reference copy (decisions.md 2026-07-10).
