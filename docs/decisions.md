# Key decisions log (append-only)

Format: date · decision · reasoning · who.

- **2026-07-10 · Project greenlit.** Proposal + full roadmap approved by the author ("the idea sounds really fun and I love it"); author delegated remaining product decisions ("You have my full trust in bringing this app to life"). Remaining author gates listed at the end of this file.
- **2026-07-10 · Name: Tessera.** Author-approved. Web scan (docs/positioning.md) found no dominant owner in this space; *Tessera Memories* (journaling app) is the nearest neighbour → standing copy rule: never describe Tessera as a journal/memories app; always "Tessera letters" in discoverability copy.
- **2026-07-10 · Licence split: spec CC0, code MIT.** A format that must outlive its author cannot belong to her; implementers need zero-friction rights forever. Code MIT per house default.
- **2026-07-10 · Paper is the reference implementation.** The printed kit is canonical; the digital folder is the convenience copy. Root of the century test and the priority rule (README.txt > letter.txt > manifest.json).
- **2026-07-10 · No time-lock cryptography, stated plainly.** Math-enforced "cannot read before date" requires trusted live services — fails the century test. Sealing is ritual + custody; encryption (v0.2) is labelled privacy-from-strangers only. Honesty is house style.
- **2026-07-10 · No accounts, no server, no delivery promises.** The differentiator and the durability mechanism are the same fact.
- **2026-07-10 · Open-when promoted to v0.1** (from v0.3). The vision names "those who could use a hand" as first-class; the hardest-day reader doesn't wait for a version number.
- **2026-07-10 · Delivery Day: winter solstice, 21 December** (June solstice noted for the southern hemisphere). The longest night; letters as light.
- **2026-07-10 · Typography: system serif in v0.1; no webfonts.** A font dependency is a network request and a century-test liability. Revisit vendored OFL face at v0.3 on print quality evidence.
- **2026-07-10 · Zip method: store (no compression).** Bytes stay readable even without decompression tooling; a vendored ~120-line writer beats a dependency.
- **2026-07-10 · Token authenticates by eye, not by cryptography.** A handshake, not a lock — matchable across forty years of fading, no machine required.
- **2026-07-10 · Repo: LacunaeDesigns/tessera** (author's personal account, named by email), private until v0.1 ships, `dev` default branch, `main` release-only (house workflow).
- **2026-07-10 · Landing page: implemented from the author's Claude Design handoff as its own surface.** `landing.html` + `landing/` recreate the "Tessera landing implementation" design project (typewriter hero, seal step, letters shelf) in the house stack: no build, no framework, no CDNs. It reuses `js/token.js` and `data/occasions.js` unchanged. Sealing on the landing is ceremonial by design ("this page is a design study"); the one real seal path stays in `js/export.js`. The app at `index.html` and the versioning triple are untouched — the landing is runtime-cached by the existing sw.js fetch handler, not precached. Promoting the landing to the front door (and wiring its inert "Download the folder" to the real app) is a later product decision.
- **2026-07-10 · Fonts on the landing: vendored OFL files, not webfonts.** The design specifies Young Serif + Courier Prime. The no-webfonts rule stands (no network font requests anywhere); vendored ≠ dependent per the v0.3 note in design-language.md, so both faces ship as local OFL-licensed TTFs in `landing/fonts/` (licenses alongside). The app itself keeps the system serif stack.
- **2026-07-10 · Landing copy: house prose rules over design literals.** Two em-dash strings from the design were recast ("Done writing. Seal it →", "Not every letter needs one. Leave it blank…"). The em-dash kept in `landing.js` as the empty-field glyph in the "Read it back" card is a placeholder character, not prose — the two prose-check WARNs on it are justified, not ignored.
- **2026-07-10 · Landing 375px deviations.** The design scales the whole typewriter scene uniformly, including its setup wizard; at phone widths that made the wizard illegible. The wizard and the sound toggle render in an unscaled overlay anchored to the scene wrap instead — visually identical at desktop, readable at 375px (house rule: the browser pass starts there).

## Standing author gates
1. Real USPTO/EUIPO trademark clearance before anything commercial (classes 9 + 16).
2. v1.0 public announcement timing + copy.
3. Anything physical/commercial (kits, bound books).
4. Estate-pack legal review.
5. Gallery moderation policy before the commons opens.
6. Landing image licensing before the landing ships publicly: the four watercolor section backgrounds were placeholder-sourced (the design handoff flags their licensing as unconfirmed) and the twelve wax-seal images are third-party product photography.
