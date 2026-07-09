# The century layer (v2.x) — the long-horizon features

Each item here is independent, optional, and only enters a release when it can pass the century test on its own. This file parks their design intent so the roadmap's far end stays concrete.

## Paper is the backup
Encode the entire digital folder as printed 2D data sheets (dense QR sheaf or comparable public-domain encoding, with plain-text header explaining the encoding and where its spec lives), so the loop closes: digital → paper → digital with no infrastructure. Target: a typical letter ≤ 3 data sheets appended to the print kit. The decode path must itself be documented on paper (the instructions page grows a section). This is the feature that makes the "paper is the reference copy" claim total; it ships only with committed fixtures and a documented, dependency-free decoder.

## The Hundred-Year Room
A public commons of letters addressed *to anyone, 2126* (`stranger-2126` occasion): sealed contributions now, published on schedule — the room "opens" progressively as open dates arrive. Static generation from dated content; contributions through the gallery pipeline with the same consent rules. The project's mortality clause applies doubly: contributors are told the room may not survive, and are urged to *also* keep their letter the normal way — the room is a copy, never the keeper.

## Letter exchange
Strangers swap sealed letters to open in N years — pen-pals across time. Needs matching machinery (the one feature that genuinely wants a server), so it is deliberately last and may live as a periodic human-run "exchange event" (Delivery Day adjacent, envelopes through physical post) before it is ever software. If it is never software, that's an acceptable ending.

## Audio letters
`media/` recordings as first-class flow: record in the writing room, transcript required (`letter.txt` stays canonical — the recording is the treasure, the words are the letter). Century guidance: WAV or MP3, one-line prose description, and the instructions page notes what the file is even if nothing nearby can play it.

## Estate pack
Template language for wills ("the sealed letters in the blue box are to be delivered, unopened, per their cover sheets"), custodian-succession worksheets, an executor's one-pager. **Ships only after real legal review (author gate)** and per-jurisdiction caveats; until then, custody.md's single-sentence pattern is the guidance.

## The physical kit
Archival paper, envelopes, seals, token cardstock — atoms for sale (author gate; the sustainability stance in roadmap.md binds: the format, the tool, and everyone's letters stay free). Includes the single-colour embossable token variant from token.md's open questions.

## QA hooks
Each item arrives with its own feature file, fixtures, and century-test rows before build; nothing in this file is buildable as specced — that's what makes it a parking lot and not a plan.
