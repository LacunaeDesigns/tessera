# Reminders without servers (v0.2)

## Purpose
A letter needs its date remembered for decades. Tessera refuses server-side scheduling (the FutureMe failure mode), so it exports remembering into things that already survive: calendars people migrate for life, and paper.

## What ships
- **ICS export** — per letter or whole registry: a standards-compliant `.ics` (all-day event on `openOn`, summary *"A letter is ready: {to} — {id}"*, description with cover-sheet text; UID = letter ID; no alarms forced, one optional same-day `VALARM`). Calendar files are the one digital artifact people reliably carry across providers for decades.
- **The open-dates card** — a printed wallet/drawer card listing waiting letters (ID · opens · for), a companion to the register sheet; and per-letter, the open date already lives on the cover sheet — the envelope is its own reminder.
- **Registry nudge-free display** — the ladder shows time-until quietly ("opens in eleven years"). No notifications, no countdown urgency (design-language rule).

## Implementation
- `js/ics.js` — pure ICS builder (RFC 5545 folding at 75 octets, CRLF line endings, UTC-free all-day dates), dual export, fixture-tested. Wired into registry rows and letter sealing.
- Card added as a register-page variant in `print.js`.

## QA hooks
- `node tools/test-ics.js` — fixture letters ⇒ byte-exact ICS; line-folding and CRLF rules; imports cleanly (manual check) into at least two calendar apps.
- `/qa`: export from registry and from sealing; card print layout.

## Open questions
- Repeating "check the drawer" annual event (one ICS for the whole practice, solstice-anchored) — likely yes at v1.0 alongside Delivery Day.
