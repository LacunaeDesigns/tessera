# Later versions — pre-plan briefs (v0.3 · v1.0 · v2.x)

These are deliberately **briefs, not plans**. Writing step-level plans for far-future features before the near versions ship guarantees drift, and drift is a bug (docs/README.md). Each brief states scope, constraints, and its *definition of ready* — the trigger for writing the real plan.

## v0.3 — Occasions & Series

**Occasion library + prompt decks** ([../features/occasions.md](../features/occasions.md))
- All new sets authored via `/occasion` (calibration corpus + bright-door rule). Data-only change per set. The grief set gets outside reading first (open-when.md open question).
- Ready when: v0.2 shipped; `/occasion` has produced at least one set end-to-end.

**Milestone series wizard**
- A whole ladder in one sitting (child at 5/10/15/18): a loop around the existing compose flow ending in the same seal path — n letters, n folders, one print session. Engine constraint: **no new seal path** (architecture rule).
- Ready when: compose flow has survived real use; decision on batch-print UX (one combined print view vs. sequential kits).

**The letter ladder** — registry's drawn view of the future (upgrade of the v0.1 list). Pure registry/CSS work.

**Co-written letters** — two `from` voices, alternating or merged; format question (one `from` field vs. array) must go through `/spec-sync` + format-event protocol if the manifest changes.

**Bound-booklet export** ([../features/booklet.md](../features/booklet.md)) — print-CSS imposition (signatures, page ordering); the hardest print work in the roadmap; needs the physical walkthrough lessons from v0.1/v0.2 first.

**Webfont decision revisit** — vendored OFL face (e.g. EB Garamond) judged purely on print-output quality; vendored ≠ dependent (decisions.md 2026-07-10). Zero cost either way.

## v1.0 — The Commons

**Spec v1.0 freeze** — required fields frozen forever; conformance suite + test vectors published; third-party implementations invited. This is the heart of v1.0; everything else is presentation.
**Shared gallery** — voluntarily contributed opened letters; static, curated. The display side is static pages and stays free at any scale; only the intake pipe ever changes. **The zero-cost scaling ladder (decided 2026-07-10):** start with Netlify Forms (zero setup, fine under 100 submissions/month) → if volume grows, a Cloudflare Worker/Pages Function that files each submission as a GitHub issue via the API (free tier 100k requests/day ≈ unlimited here; no submitter accounts; spam via free Turnstile; `/gallery-triage` works the issue queue; accepted entries build to static pages via Actions, free on public repos). GitHub Issue forms directly are the zero-infrastructure fallback but require submitter GitHub accounts — wrong audience, fallback only. Honest ceiling: moderation time, not intake — every entry is human-curated (author gate 5), so the queue-based pipe is also the one that scales the *triage*, not just the form.
**Kits** (wedding, baby, classroom, graduation) — print-CSS pages reusing `print.js` machinery; content work via `/occasion`.
**Translations** of the README template — CC0, community-invitable; needs a per-language dates-in-words strategy in `manifest.js` (the hard part; scope it honestly).
**Delivery Day** (21 December) — content + ICS practice event, not engine.

- Ready when: v0.3 shipped; author gates 2 (announcement) and 5 (moderation policy) decided.

## v2.x — The Century Layer (each item independent)

- **Paper is the backup** ([../features/century-layer.md](../features/century-layer.md)) — digital→paper→digital encoding. Research-first: encoding density vs. home-printer/scanner reality; prototype with the existing zip bytes before promising anything in the spec.
- **The Hundred-Year Room** — letters to 2126; mostly occasion content + registry presentation.
- **Letter exchange** — deliberately last; requires matching machinery and a trust design that doesn't break "no accounts, no server". Do not start before a written design doc.
- **Audio letters** — transcript canonical (format event: new optional file + manifest field).
- **Estate pack** — author gate 4 (real legal review) before any work.
- **Physical kit** — author gates 1 + 3 (trademark clearance, commercial) before any work.
