# `manifest.json` — field-by-field reference

*Part of the Tessera format. Licence: CC0 1.0 (public domain).*

The manifest is the machine-readable card catalogue of a letter. It never carries anything that isn't also in `README.txt` in prose — if the JSON becomes archaeology, nothing essential is lost (the priority rule in SPEC.md §1).

## Required fields (v0.1)

| Field | Type | Meaning | Rules |
|---|---|---|---|
| `tessera` | string | Spec version, e.g. `"0.1"` | Writers set the version they implement. Readers accept any version and do their best; they must not refuse to open a letter over a version number. |
| `id` | string | Letter ID, e.g. `"TSR-4f2a-91c3"` | `TSR-` + first 8 hex chars of the token seed, grouped in fours, lowercase hex. Derived, never invented (SPEC §4). |
| `written` | string | Date sealed, ISO 8601 date (`"2026-07-10"`) | Local civil date where the writer sat. No time component required. |
| `openOn` | string | The date the letter waits for (`"2044-06-21"`) | ISO 8601 date. May be past when opened late; that's fine — letters are patient. |
| `from` | string | The writer, as they wish to be known to the opener | Free text. `"Rika"`, `"Your mother"`, `"Someone who was 31 in 2026"` are all valid. |
| `to` | string | The intended opener, as addressed | Free text. `"My daughter, on her eighteenth birthday"`, `"Whoever finds this"`. |
| `checksumAlgo` | string | `"SHA-256"` | v0.1 defines only SHA-256. Future versions may add algorithms; the field says which was used. |
| `tokenSeed` | string | Hex digest of the canonical seed string (SPEC §5) | Lowercase hex, 64 chars. Lets any tool re-derive and re-verify the token art. |

## Optional fields (v0.1)

| Field | Type | Meaning | Rules |
|---|---|---|---|
| `occasion` | string | A slug naming the prompt/occasion used | Known v0.1 slugs: `open-when-sad`, `open-when-doubt`, `open-when-3am`, `open-when-lost`, `open-when-proud`, `milestone-18`, `future-self`, `anniversary`, `stranger-2126`, `custom`. Unknown slugs are fine — the field is descriptive, not an enum. |
| `language` | string | BCP-47 tag of the letter's language (`"en"`, `"sv"`, `"zh-Hant"`) | Helps future finders seek translation. |
| `custody` | array | Ordered custody chain | Each entry: `{ "holder": string, "instructions": string }`. First entry is the current custodian. See [custody.md](custody.md). |
| `writeback` | object or null | Lineage, for reply chains (v0.2+) | `{ "inReplyTo": "<id>", "generation": 2 }`. `null` or absent for an originating letter. |
| `media` | array | One-line descriptions of `media/` files | Each entry: `{ "file": "media/…", "note": string }`. Duplicated in prose in README.txt. |
| `encryption` | object | How `letter.txt.enc` is locked (SPEC §9) | Present **only** when the letter file is `letter.txt.enc`. `{ "algo": "AES-256-GCM", "kdf": "PBKDF2-SHA256", "iterations": int, "salt": base64, "iv": base64, "hint"?: string }`. The `hint` is a writer-chosen recovery cue, optional and omitted when blank — never the passphrase itself. `README.txt` is never encrypted. Additive field in the 0.1 line; absent for unencrypted letters. |

## Forward-compatibility rules (the two that matter)

1. **Readers ignore unknown fields. Writers preserve fields they did not create.** A 2050 tool re-zipping a 2026 letter must carry every 2026 field through unchanged, even ones it doesn't understand.
2. **While the spec version begins `0.`, fields may change between versions. From `1.0`, the required set above is frozen forever** — future versions may only add optional fields.

## Canonical example

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
    { "holder": "Gustav", "instructions": "Keep with the family papers. If you cannot keep it, pass it on with its story to whoever can." }
  ],
  "checksumAlgo": "SHA-256",
  "tokenSeed": "9c1185a5c5e9fc54612808977ee8f548b2258d31aa79cb2d6b8c2a1f0e3d4c5b",
  "writeback": null
}
```

## Validation notes for implementers

- Encode as UTF-8, no BOM; pretty-print with 2-space indent (human readability is a format feature, not a style choice).
- Dates must be valid calendar dates; `openOn` before `written` is legal (a letter "to the person I was") but tools should confirm intent.
- Empty strings are not valid values for required fields; omit optional fields rather than writing `""`.
