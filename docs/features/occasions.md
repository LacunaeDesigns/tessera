# Occasions & series (v0.3)

## Purpose
Widen the doors: a full occasion library, decks of interview-style prompts for people who freeze at blank pages, whole ladders of letters written in one sitting, and the registry's future made visible.

## What ships
- **Occasion library** — beyond the open-when set: milestones (each birthday that matters, graduation, first heartbreak), anniversaries, *to the next owner of this house*, *to a stranger in 100 years* (`stranger-2126`), *to the person marrying my child*, retirement, the last day of a career. Each: slug, cover line, 3–4 prompts, all in `data/occasions.js` (data change, not engine change), all passing the open-when copy rules including the bright-door rule.
- **Prompt decks** — a guided alternative to the blank page: 6–10 questions answered one at a time (StoryCorps-style interview of yourself), then stitched into a draft the writer edits as a letter. Never shipped as the letter unedited; the deck ends with *"Now make it sound like you."*
- **Milestone series wizard** — one sitting, one recipient, N sealed letters (child at 5/10/15/18; every wedding anniversary to 25). Shared `from`/`to`/custody, per-letter dates and prompts, N print kits batched into one print job, N registry rows.
- **The letter ladder** — the registry's Waiting list drawn as a quiet timeline: now at the left margin, each letter a small sealed mark at its distance into the future, decades marked in words. No interactivity beyond hover/tap for the row. The single most shareable screen in the product; still ink-light when printed.
- **Co-written letters** — two writers alternating or merging; `from` becomes plural; the token sheet prints **three** halves-worth (two keeper halves via a three-way break) — art family question for `/token-lab`.
- **The grief set** — *open on the day you lose someone* — written via the full `/occasion` process with outside readers; the care deferred from v0.1 lands here or not at all.

## Implementation
- `data/occasions.js` grows; `js/compose.js` gains deck mode and series mode (loops over the existing seal path — sealing stays one code path); ladder in `js/registry.js` as SVG.

## QA hooks
- Prose scans over all new deck/occasion strings; `/qa` series-wizard batch (3-letter fixture series ⇒ 3 valid folders, 3 registry rows, one print job); ladder at 375px; grief set does not ship without its outside-reader sign-off recorded in decisions.md.

## Open questions
- Deck answers as optional `media/interview.txt` alongside the letter (the raw material preserved) — leaning yes, writer-optional.
- Three-way token break for co-written letters vs. two identical travel halves — `/token-lab` decides on visual evidence.
