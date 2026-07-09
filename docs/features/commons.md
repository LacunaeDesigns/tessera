# The commons (v1.0) — Delivery Day, the gallery, the kits

## Purpose
Tessera stays serverless for letters forever; the commons is the *optional* shared layer around the practice — a calendar date, a reading room, and printable kits for the occasions people already gather for. All of it can die without a single letter being lost (the "known, accepted mortality" clause in century-test.md).

## What ships
- **Delivery Day** — the winter solstice, 21 December (June solstice noted for the southern hemisphere): the shared annual date for opening due letters and writing the next ones. The site carries a quiet countdown and a single page of ritual suggestions (open together; read aloud only if the reader offers; write back the same evening). One optional ICS (annual repeat) covers the whole practice.
- **The gallery** — voluntarily contributed *opened* letters, submitted through a form (Netlify Forms, the Perpetūra feedback pipeline reused), curated by hand into static pages. Submissions require: the opener contributed it, names may be redacted, no letters from minors' writers without the writer's consent, no unopened letters ever. Curation rules live with the author; `/gallery-triage` (skill, built at v1.0) pulls submissions → drafts entries → author approves each. Nothing publishes automatically. **Moderation policy is an author gate before the door opens.**
- **The kits** — printable packs that run a room, each a PDF-able static page: **wedding** (guests write to the couple; opened at the 1st/10th/25th anniversary; a basket, cards, and a sign), **baby** (shower guests to the child at milestones), **classroom** (write to yourself at graduation; a teacher's one-page runbook, storage and handout logistics, no app required in the room), **graduation/retirement** (colleagues' letters at 5/10 years). Kits are the growth engine precisely because they work with zero accounts: the paper does the marketing.
- **Spec v1.0** — required manifest fields frozen forever; conformance suite + test vectors published as a standalone page; third-party implementations listed and welcomed.
- **README template translations** — starting with the languages closest to home (Swedish, Chinese), each CC0, each reviewed by a native reader.

## Implementation
- Static pages + one Netlify Form; `/gallery-triage` skill; kits as print-CSS pages reusing `print.js` machinery; no engine changes.

## QA hooks
- `/qa`: kit pages print correctly on A4/Letter; gallery pages build statically; form → author inbox loop tested end-to-end once per release that touches it.
- `/century-audit`: confirms the commons stays severable — deleting it must leave tool + format whole.

## Open questions
- Gallery hosting under the main domain vs. a sibling ("read.tessera…") — decide at v1.0 with the announcement plan (author gate).
- Whether Delivery Day gets a yearly "letters opened this year" count (voluntary, aggregate) — only if it can be done without tracking; a submission checkbox, never analytics.
