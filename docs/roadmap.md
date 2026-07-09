# Roadmap — the living plan

Versions are promises kept in order. Nothing in a later version may quietly add a dependency that breaks the century test.

## v0.1 — Foundations (current)

The smallest thing that is actually Tessera: write, seal, print, keep.

- **Format spec v0.1** ([../SPEC.md](../SPEC.md)) + manifest schema, README template, custody guidance, century-test checklist.
- **Writing room** ([features/writing-room.md](features/writing-room.md)): compose flow (guided + free), localStorage drafts, offline via service worker.
- **Folder export**: the canonical Tessera zip (vendored store-only zip writer, no dependencies).
- **Token generator** ([features/token.md](features/token.md)): deterministic two-half SVG, fixture-tested.
- **Print kit v1** ([features/print-kit.md](features/print-kit.md)): letter sheet, cover sheet, instructions page, token sheet.
- **Open-when prompt set** ([features/open-when.md](features/open-when.md)) — promoted from v0.3 because "those who could use a hand" are first-class (vision promise 2).
- **Registry** ([features/registry.md](features/registry.md)): local ledger + printable register page.
- **Founding letters**: the author writes the first real ones. Exit criterion, not garnish.
- Ship: Netlify (unlisted), repo flips public.

## v0.2 — The Opening

Receiving is half the product.

- **Receive & verify** ([features/opening.md](features/opening.md)): drop a folder/zip in, checksums verified, token halves matched.
- **Opening ceremony**: a paced, quiet reveal; the screen holds the moment.
- **Write-back chains**: every opened letter invites a reply to the next horizon; manifests record lineage — letter genealogies.
- **Reminders without servers** ([features/reminders.md](features/reminders.md)): ICS export, printable open-dates card.
- **Envelope generator + print themes** (letterpress / aerogramme / telegram / wax-seal).
- **Passphrase privacy** ([features/encryption.md](features/encryption.md)): WebCrypto, printed key-escrow card, honesty page.

## v0.3 — Occasions & Series

- **Occasion library + prompt decks** ([features/occasions.md](features/occasions.md)): milestones, anniversaries, the next owner of this house, a stranger in 100 years.
- **Milestone series wizard**: a whole ladder in one sitting (child at 5/10/15/18).
- **The letter ladder**: the registry's view of your future, made visible.
- **Co-written letters**; **bound-booklet export** ([features/booklet.md](features/booklet.md)).
- Webfont decision revisited (design-language.md).

## v1.0 — The Commons (public launch proper)

- **Delivery Day** (winter solstice, 21 December — southern-hemisphere note in spec).
- **Shared gallery** of voluntarily contributed opened letters (Netlify Forms → curated static entries; `/gallery-triage` skill arrives here).
- **Kits**: wedding, baby, classroom, graduation/retirement.
- **Spec v1.0**: required fields frozen forever; conformance suite + test vectors published; third-party implementations invited.
- **Translations** of the self-describing README template.
- Announcement (author gate).

## v2.x — The Century Layer (each item independent)

- **Paper is the backup**: the digital folder encoded as printable data sheets; digital → paper → digital with no infrastructure ([features/century-layer.md](features/century-layer.md)).
- **The Hundred-Year Room**: letters to anyone, 2126.
- **Letter exchange**: strangers swap sealed letters (deliberately last; matching machinery).
- **Audio letters** (transcript canonical).
- **Estate pack** (with real legal review — author gate).
- **Physical kit** (paper, seals; commercial — author gate).

## Sustainability stance

The core is free and open forever; that *is* the outlive-me mechanism. Revenue, if it ever exists, attaches only to atoms (kits, bound books) — never to the format, the tool, or anyone's letters.
