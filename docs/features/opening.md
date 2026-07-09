# Opening (v0.2) — receive, verify, ceremony, write-back

## Purpose
Receiving is half the product. v0.2 gives the opener a door of their own: verify a letter is intact and genuine, open it with the weight it deserves, and answer it forward.

## Walkthrough
Home gains a fourth door: **Open a letter.**

1. **Receive** — drop in a Tessera folder or zip (file input; nothing uploads — century test A). The tool reads `manifest.json`/`README.txt`, shows the facts: from, for, sealed, opens.
2. **Verify** — checksums recomputed and compared; token re-derived from `letter.txt` + manifest fields and displayed beside the enclosed `token.svg`; if the opener holds a physical half, the screen shows the break line large for matching by eye. Verification failures warn gently and *never block reading* (a damaged letter is still a letter; the priority rule holds).
3. **The date check** — if `openOn` is future, the tool says so and asks, once, without judgment: *It asked to wait until {date-in-words}. Open anyway?* The ritual is honest, not enforced (SPEC §7).
4. **Ceremony** — a paced reveal: the facts, a breath, then the letter, typeset as the print kit sets it, one screen, no chrome. `prefers-reduced-motion` collapses the pacing to a single quiet appearance.
5. **Write back** — the invitation: *Answer it forward.* Composing from here sets `writeback: { inReplyTo: <id>, generation: n }` — letter genealogies whose replies take decades (the manifest field is reserved in v0.1 precisely so v0.1 letters can be answered).
6. **Custody intake** — alternatively: *I am keeping this for someone* records a registry entry (custodian view) without opening anything.

## Implementation
- `js/open.js` — file intake (zip reading needs a store-method *reader* added to `js/zip.js`), verification, ceremony renderer; reuses `token.js` (re-derivation) and `print.js` typesetting.
- Registry gains `role: "writer" | "custodian" | "opened"`.

## QA hooks
- `node tools/test-zip.js` extends to read-back round-trips (write → read → byte-equal).
- `/qa`: verify-pass, tamper (edited letter.txt ⇒ checksum warning, reading still allowed), early-open flow, write-back manifest correctness, reduced-motion ceremony.

## Open questions
- Should ceremony offer to *print* the letter before showing it ("read it on paper")? Leaning yes — one more nudge toward the reference copy.
