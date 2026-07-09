# Custody — how a letter is carried across decades

*Part of the Tessera format. Licence: CC0 1.0 (public domain). Plain-language guidance, not legal advice.*

A letter that must cross forty years will usually cross hands. Tessera treats the custodian — the person who keeps a sealed letter safe — as an honoured role with a small, explicit promise, instead of leaving it to luck.

## The custodian's promise

Someone who accepts a Tessera letter into their keeping agrees to four things:

1. **Keep it** — dry, together with its story (this README), somewhere it will be found rather than lost.
2. **Don't open it** — not even a little, not even to check. It isn't theirs to open.
3. **Don't destroy it unread** — if keeping it becomes impossible, passing it on is always the alternative.
4. **Pass it on with its story** — a letter handed over without its explanation becomes trash; with its explanation it stays a letter. Succession means giving the next keeper both.

That's the whole job. It is deliberately small enough to say yes to.

## The custody chain

The manifest's `custody` array records the chain in order — first entry is the current keeper:

```json
"custody": [
  { "holder": "Gustav", "instructions": "Keep with the family papers." },
  { "holder": "whichever of our children keeps the family papers", "instructions": "You were trusted with this before you were born." }
]
```

Rules:
- `holder` may be a name, a role ("the eldest"), or a relationship — roles survive better than names across generations.
- `instructions` are for *that keeper*: where to keep it, when to hand it on, who comes next if the plan fails.
- When custody actually changes, the new keeper (or a tool) may append an entry rather than rewrite history — the chain is a record, not just a plan.
- The chain is always duplicated in prose in `README.txt`; a keeper should never need to read JSON to know their job.

## Practical guidance for writers

- **Prefer places to people, and roles to names.** "With the family papers" outlives any individual; "the person who keeps the photo albums" is a findable role in most families.
- **Tell the custodian they are one.** A letter hidden too well is a letter lost. The print kit's cover sheet exists so the object explains itself on a shelf.
- **Redundancy is honest.** Keeping the digital folder in two places and the paper in one is not paranoia; it's the century test applied at home.
- **Wills and estates:** a sentence in a will ("the sealed letters in the blue box are to be delivered, unopened, per their cover sheets") does more than any technology. A reviewed template for this arrives with the estate pack (v2.x, after real legal review); until then, this single-sentence pattern is the guidance.

## What custody is not

Custody is not enforcement. A custodian *can* open a letter early; the format's honesty rule (SPEC §7) means Tessera never pretends otherwise. The promise, the cover sheet, and the half-token — the writer keeping the matching half — are social and physical weight, and they have carried sealed letters for two thousand years.
