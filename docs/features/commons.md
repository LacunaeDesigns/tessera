# The commons (v1.0) — Delivery Day, the gallery, the kits

## Purpose
Tessera stays serverless for letters forever; the commons is the *optional* shared layer around the practice — a calendar date, a reading room, and printable kits for the occasions people already gather for. All of it can die without a single letter being lost (the "known, accepted mortality" clause in century-test.md).

## What ships
- **Delivery Day** — the winter solstice, 21 December (June solstice noted for the southern hemisphere): the shared annual date for opening due letters and writing the next ones. The site carries a quiet countdown and a single page of ritual suggestions (open together; read aloud only if the reader offers; write back the same evening). One optional ICS (annual repeat) covers the whole practice.
- **The gallery** — voluntarily contributed *opened* letters, submitted through a form (Netlify Forms, the Perpetūra feedback pipeline reused), curated by hand into static pages. Submissions require: the opener contributed it, names may be redacted, no letters from minors' writers without the writer's consent, no unopened letters ever. Curation rules live with the author; `/gallery-triage` (skill, built at v1.0) pulls submissions → drafts entries → author approves each. Nothing publishes automatically. Moderation policy set 2026-07-11 — see **Moderation policy** below (author gate 5, closed).
- **The kits** — printable packs that run a room, each a PDF-able static page: **wedding** (guests write to the couple; opened at the 1st/10th/25th anniversary; a basket, cards, and a sign), **baby** (shower guests to the child at milestones), **classroom** (write to yourself at graduation; a teacher's one-page runbook, storage and handout logistics, no app required in the room), **graduation/retirement** (colleagues' letters at 5/10 years). Kits are the growth engine precisely because they work with zero accounts: the paper does the marketing.
- **Spec v1.0** — required manifest fields frozen forever; conformance suite + test vectors published as a standalone page; third-party implementations listed and welcomed.
- **README template translations** — starting with the languages closest to home (Swedish, Chinese), each CC0, each reviewed by a native reader.

## Moderation policy
Set 2026-07-11 (closes author gate 5). The policy is a rejection rubric applied by a human, not an automated filter.

- **The gate is human approval.** The author approves every entry before it publishes; nothing auto-publishes, ever. A submission lands only in a private inbox (Netlify Forms) or issue queue — invisible to the world until the author builds a page from it. Submission ≠ publication.
- **Welcome:** funny, weird, mundane, heartfelt, and — explicitly — heavy. Grief, dying, depression, letters to the dead, "I don't know if I'll make it to when you read this." The sad and the dark are the soul of the project, not something to filter out.
- **Rejected (six categories):** hate/harassment; sexual content; minors as subjects; third-party private info (doxxing); threats/incitement; spam/ads.
- **The one line that isn't a mood:** a letter *about* despair is welcome; a letter that *instructs or encourages* self-harm is cut. The test is harm-to-the-reader, not sadness.
- **The wordlist is a helper, never a gate.** During triage it flags submissions for the author's closer attention and pre-sorts obvious spam. It never silently hides or publishes anything on its own — wordlists both under-block (hate needs no banned word) and over-block (the most moving letters live near heavy words), so a human reads every one.
- **Consent (restated from the gallery bullet):** the opener contributed it; names redacted by default unless explicitly permitted; no unopened letters ever; no letters involving minors' writers without the writer's consent.

`/gallery-triage` implements this: it checks consent affirmations mechanically, runs the flagging wordlist, drafts entries with redactions applied, and presents each to the author — who makes the final call, every time.

## Implementation
- Static pages + one Netlify Form; `/gallery-triage` skill; kits as print-CSS pages reusing `print.js` machinery; no engine changes.

## QA hooks
- `/qa`: kit pages print correctly on A4/Letter; gallery pages build statically; form → author inbox loop tested end-to-end once per release that touches it.
- `/century-audit`: confirms the commons stays severable — deleting it must leave tool + format whole.

## Open questions
- Gallery hosting under the main domain vs. a sibling ("read.tessera…") — decide at v1.0 with the announcement plan (author gate).
- Whether Delivery Day gets a yearly "letters opened this year" count (voluntary, aggregate) — only if it can be done without tracking; a submission checkbox, never analytics.
