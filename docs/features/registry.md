# Registry (v0.1)

## Purpose
The writer's ledger: every letter sealed (and drafts in progress) on this device — and its printable twin, the register page a family keeps with its papers. The registry is also where *something to look forward to* (vision promise 3) becomes visible.

## Walkthrough
"Your letters" shows two groups:
- **Waiting** — sealed letters ordered by `openOn`, soonest first: ID, to, open date (in words), occasion, who keeps it. This list *is* the letter ladder in v0.1 (the drawn visualization arrives v0.3 — see [occasions.md](occasions.md)).
- **Drafts** — unsealed work, resumable into the compose flow.

Row actions: *print the kit again* (regenerates from stored metadata + kept text if the keep-a-copy toggle was on; otherwise offers the cover/instructions/token sheets only, which need no letter text), *mark as passed on* (appends custody note), *remove from this device* (with the reminder that removing the record does not unseal any paper).

**Print the register** — a single sheet listing all waiting letters (ID · to · sealed · opens · keeper), titled for the drawer it will live in: *Letters in this house, waiting.*

## Privacy stance
The registry stores **metadata only** by default. Letter text is stored only when the writer explicitly kept a copy at sealing (default off — the folder is the letter; a browser is not an archive). Nothing ever leaves the device.

## Format touchpoints
None — the registry is tool-side convenience, not format. A lost registry loses no letters (century test C: the letters live in folders and drawers, not in this app).

## Implementation
- `js/registry.js` — renders both groups + the register sheet (via `print.js`); actions above.
- `js/state.js` — `registry: [{ id, to, from, written, openOn, occasion, custodyHolder, keptText? }]`; schema versioned under the `tessera_v1` key with a `migrate()` seam (Perpetūra save-shape discipline).

## QA hooks
- `/qa`: seal → appears under Waiting, ordered correctly; reload persists; re-print works both with and without kept text; register page prints with footers; remove-from-device warns correctly.
- `node tools/test-manifest.js` covers the shared date-in-words + ID helpers the registry reuses.

## Open questions
- Import: reading a Tessera folder *into* the registry (an "I am now custodian of this" entry) — belongs to the v0.2 opening flow.
- Export/merge of registry across devices — plain-text export sheet is the likely answer (paper again); revisit v0.3.
