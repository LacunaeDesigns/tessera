---
name: occasion
description: Author or revise occasion prompt sets (data/occasions.js) in the house voice, calibrated against the open-when corpus. Use when adding occasions, prompt decks, or any letter-facing copy set.
---

# /occasion — prompt & pack authoring

Prompts are company, not homework. They address the **writer** and point at the *reader's* specific life. Concrete beats profound.

## Calibration
Before writing a word, reread:
- `docs/features/open-when.md` — the calibration corpus; new prompts must sit comfortably beside the v0.1 set.
- `docs/design-language.md` — tone of voice (quiet, warm, precise; never chirpy, never clinical).

## Rules (binding)
- 3–4 prompts per occasion. Each ends where the writer starts writing.
- No em-dashes, no "Not X. Not Y." stacks, no urgency, no therapy-speak ("hold space", "valid"), no instructing the reader to feel.
- **Bright-door rule**: every shipped set includes at least one joyful occasion.
- Each occasion is data: `{ slug, title, coverLine, prompts[], canBeUndated? }` in `data/occasions.js`. Adding a set is a data change, never an engine change.
- The grief set ("open on the day you lose someone") is deferred work requiring outside reading and extra care — do not draft it casually inside another task.

## Verification
1. `node tools/prose-check.js` over the new strings — read every WARN.
2. Read each prompt aloud (literally). If it sounds like an app, rewrite it; it should sound like a person.
3. `node --check data/occasions.js` and confirm the compose flow picks up the new chips in the browser.
