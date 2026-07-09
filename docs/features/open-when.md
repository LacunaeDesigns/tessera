# Open-when letters (v0.1)

## Purpose
Letters for the worst day, not the milestone: written by someone who loves the reader, waiting in a drawer for exactly the night they're needed. Promoted into v0.1 because the vision names "those who could use a hand" as first-class. This file holds the v0.1 prompt set and is the **calibration corpus** for all future letter-facing copy (`/occasion` drafts against it).

## How open-when differs in the flow
- **Dating:** the writer may choose *"no date — it opens when it's needed."* `openOn` is set to the written date (format-legal), and the cover sheet replaces the date line with: *To be opened when the title says so, and not out of curiosity.* The title ("Open when you can't sleep") does the gating; the ritual holds it, as always.
- **Addressing:** `to` is a person, the occasion is the door. A set of open-when letters is naturally written as a batch — one sitting, five envelopes, a rubber band. The compose flow offers *"write another for the same person"* after sealing.

## The v0.1 set

Prompts appear as faint marginal questions beside the letter page — company, not homework. Three to four per occasion, house voice.

### Open when you're sad (`open-when-sad`)
- What do you wish someone would say to them tonight? Say it.
- Tell them one true thing you love about them that has nothing to do with anything they achieve.
- Remind them of a specific day the two of you were glad. Small is better than grand.

### Open when you doubt yourself (`open-when-doubt`)
- Name the doubt you suspect they'll be holding. Then tell them what you see instead, and how you know.
- Tell them about a time they were braver or better than they realised. Be exact.
- What would you trust them with, without hesitating? Tell them.

### Open when it's 3 a.m. and you can't sleep (`open-when-3am`)
- Keep them company first; fix nothing. What would you say if you were sitting on the kitchen floor with them?
- Tell them something quiet and ordinary about you, so the room feels less empty.
- Give them one small thing to do when they finish reading. Then say goodnight properly.

### Open when you feel lost (`open-when-lost`)
- Being lost isn't failing; say so in your own words.
- Tell them what has stayed true about them in every version of them you've known.
- If they can't see a path, name the very next stone: something they could do this week. Just one.

### Open when something wonderful has happened (`open-when-proud`)
- You don't know what it is yet. Celebrate them anyway; write the cheer you'd shout.
- Tell them you wanted to be there, and that in this way, you are.
- Ask them the question you'd ask across the table. They'll answer out loud; that's the point.

*(One bright door in the set is deliberate — the drawer shouldn't only open on dark nights.)*

## Copy rules (binding for this file and for `/occasion` output)
House prose rules apply (design-language.md): no em-dashes, no negation-anaphora stacks, no urgency, no therapy-speak ("hold space", "valid"), no instructing the reader to feel. Prompts address the **writer** and always point at the *reader's* specific life; concrete beats profound. The bright-door rule: every shipped set includes at least one joyful occasion.

## Implementation
- `data/occasions.js` — the set as data: `{ slug, title, coverLine, prompts[] }`; compose flow reads it for chips, marginal prompts, and cover-sheet lines. Adding a set is a data change, not an engine change.

## QA hooks
- `/qa` prose scans run over `data/occasions.js` strings (same banned-pattern checks as UI copy).
- Manual read of every prompt aloud before release — if it sounds like an app, rewrite it (it should sound like a person).

## Open questions
- A grief set ("open on the day you lose someone") needs the most care and possibly outside reading; deferred to v0.3 with the `/occasion` process, not rushed into v0.1.
