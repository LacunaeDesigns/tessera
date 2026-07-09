# The Tessera Format — v0.1

**Status:** Draft v0.1 (2026-07-10) · **Licence: CC0 1.0 Universal (public domain)** — anyone may implement, extend, translate, or republish this format, forever, with no permission and no attribution.

Tessera is a format for **letters meant to be opened in the future** — months, years, or decades from the day they are sealed. It is designed to a single constraint, the **century test**:

> Every element of a Tessera letter must survive (a) the death of any company, (b) the death of any file format fashion, (c) the death of the author, and (d) discovery by a finder who has no computer.

Paper is therefore the reference implementation. The digital folder is the convenience copy.

## 1. One letter = one folder

A Tessera letter is a single folder (or a `.zip` archive of that folder — "store" method preferred, so the bytes are readable even without decompression tools).

```
tessera-TSR-4f2a-91c3/
├── README.txt        ← for humans: self-describing, duplicates everything essential in prose
├── letter.txt        ← the letter itself, plain text, UTF-8
├── manifest.json     ← for machines: metadata
├── checksums.txt     ← SHA-256 of every other file
├── token.svg         ← the two-half tessera token (see §5)
└── media/            ← optional: photographs, recordings (see §6)
```

The folder name is `tessera-<ID>` where `<ID>` is the letter ID (§4). Nothing in the format depends on the folder name surviving.

### Required files
`README.txt`, `letter.txt`, `manifest.json`, `checksums.txt`. A letter missing `token.svg` or `media/` is still a valid Tessera letter.

### Priority rule
If the files ever disagree, **`README.txt` wins, then `letter.txt`, then `manifest.json`**. Prose outranks structure, because prose is what a finder in 2126 can still read.

## 2. Text conventions (century-test rules)

- All text files are **UTF-8, no BOM**, LF or CRLF line endings (readers must accept both).
- Dates appear twice everywhere they matter: **ISO 8601** (`2044-06-21`) for machines, and **written out in words** ("the twenty-first of June, two thousand and forty-four") in `README.txt` — because JSON may become archaeology, but words survive.
- No file in a Tessera letter may *require* a network, a font, a URL, or a specific program to be understood.

## 3. `manifest.json`

```json
{
  "tessera": "0.1",
  "id": "TSR-4f2a-91c3",
  "written": "2026-07-10",
  "openOn": "2044-06-21",
  "from": "Rika",
  "to": "My daughter, on her eighteenth birthday",
  "occasion": "milestone-18",
  "language": "en",
  "custody": [
    { "holder": "Gustav", "instructions": "Keep with the family papers. If you cannot keep it, pass it with its story to whoever can." }
  ],
  "checksumAlgo": "SHA-256",
  "tokenSeed": "9c1185a5c5e9fc54612808977ee8f548b2258d31",
  "writeback": null
}
```

Field-by-field reference, examples, and forward-compatibility rules: [docs/spec/manifest-schema.md](docs/spec/manifest-schema.md). The two rules that matter most:

1. **Readers must ignore fields they do not recognise, and writers must preserve fields they did not create.** (A letter may be re-zipped by a 2050 tool without losing what a 2026 tool wrote.)
2. `"tessera"` is the spec version. While it begins `0.`, fields may change between versions; from `1.0`, the required fields are frozen forever.

## 4. Identity and integrity

- **Letter ID:** `TSR-` followed by the first 8 hex characters of the letter hash (§5), grouped in fours: `TSR-4f2a-91c3`. The ID is printed on every sheet of the print kit, so paper and folder can always be matched.
- **`checksums.txt`:** one line per file, `sha256sum` format (`<hex>  <filename>`). Verification needs any SHA-256 tool — or none: checksums protect against silent corruption, not against readers without computers, who simply read the letter.

## 5. The token

Every letter deterministically generates a **two-half visual token** from its content, in the tradition of the *tessera hospitalis*: one half stays with the writer, one travels with the sealed letter. Matching halves authenticate letter to opener across any span of years — by eye, with no machine.

- **Seed:** `SHA-256` over the canonical byte string
  `"tessera:0.1\n" + openOn + "\n" + written + "\n" + from + "\n" + to + "\n" + letterText`
  where `letterText` is `letter.txt` with line endings normalised to LF and trailing whitespace of the whole text trimmed. The hex digest is recorded as `tokenSeed` in the manifest.
- **Art:** any implementation may render any art from the seed, provided it is (a) deterministic — same seed, same image, on any machine, and (b) split into two halves along an irregular seed-derived break line, such that the halves visibly interlock. The reference algorithm lives in [docs/features/token.md](docs/features/token.md); its output fixtures are the conformance vectors.
- The token authenticates by **pattern-matching, not cryptography**. It is a handshake, not a lock (see §7).

## 6. Media

Optional files under `media/`. Century-test guidance, not requirements: prefer the most durable common formats (JPEG or PNG for images, plain WAV or MP3 for audio), name files descriptively, and describe each file in one line inside `README.txt` — so a finder knows what `media/voice-for-your-wedding-day.mp3` was, even if nothing nearby can play it. If media carries the heart of the letter, transcribe it: **the transcript in `letter.txt` is canonical, the recording is the treasure.**

## 7. Sealing: ritual, custody, and honesty

Tessera does **not** provide time-lock cryptography. Enforcing "cannot be read before the date" with mathematics requires trusted services that themselves fail the century test — so Tessera declines to pretend. Instead:

- **Sealing is a ritual.** An envelope, a date, a request written on the cover: *not before, if you can bear it.* This has worked for letters for two thousand years.
- **Custody is explicit.** The manifest and README name who holds the letter and what a custodian promises — keep it, or pass it on *with its story*, never open it, never destroy it unread. Guidance: [docs/spec/custody.md](docs/spec/custody.md).
- **Encryption, when offered, is labelled honestly** as privacy from strangers (a passphrase the writer escrows with a person, on paper), never as time-release. See [docs/features/encryption.md](docs/features/encryption.md).

## 8. `README.txt` — the self-describing letter

The heart of the format. Every Tessera letter carries a README addressed to **whoever finds it**, written to be understood cold: what this is, who it is for, when it may be opened, what the other files are, what a custodian should do, and what Tessera is — with the honest note that URLs die and none of this needs one. Canonical template (CC0, translatable): [docs/spec/readme-template.md](docs/spec/readme-template.md).

## 9. Conformance

An implementation conforms if it: produces folders with the four required files; follows the text conventions (§2); derives ID and tokenSeed exactly as specified (§4–5); preserves unknown manifest fields; and passes the century-test checklist in [docs/spec/century-test.md](docs/spec/century-test.md). Test vectors (letters with known IDs, seeds, and token fixtures) ship with the reference implementation.

---

*This specification is dedicated to the public domain under CC0 1.0. It was first written in 2026. If you are reading it long after that, and the tools are gone: everything essential about a Tessera letter can be rebuilt from this document and a pencil.*
