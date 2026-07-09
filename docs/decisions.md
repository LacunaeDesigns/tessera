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

## Standing author gates
1. Real USPTO/EUIPO trademark clearance before anything commercial (classes 9 + 16).
2. v1.0 public announcement timing + copy.
3. Anything physical/commercial (kits, bound books).
4. Estate-pack legal review.
5. Gallery moderation policy before the commons opens.
