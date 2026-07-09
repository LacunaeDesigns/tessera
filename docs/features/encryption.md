# Passphrase privacy (v0.2) — and the honesty page

## Purpose
Some letters must not be readable if a box is opened early or a laptop is stolen. Tessera offers **privacy from strangers** — a passphrase — while stating plainly what it is not: time-release. The honesty page is a feature, not an apology.

## What ships
- **Optional sealing passphrase** — at seal time: AES-256-GCM via WebCrypto, key from PBKDF2 (per-letter random salt, high iteration count). The folder then carries `letter.txt.enc` (base64 in a plain-text wrapper with its own header comment), while `README.txt` stays **unencrypted always** — the finder instructions must never be locked. Manifest gains `"encryption": { "algo": "AES-256-GCM", "kdf": "PBKDF2-SHA256", "iterations": n, "salt": "…" }`.
- **The key-escrow card** — printed at sealing: the passphrase (or a hint, writer's choice), *"give this card to someone who is not the custodian"*. Paper key escrow: the two-person rule enforced by geometry, not math. The instructions page explains where the card went.
- **The honesty page** — `/about#honesty`, linked from every encryption touchpoint: why "cannot be read before the date" via cryptography is a promise Tessera won't fake, what does the work instead (ritual, custody, escrow geometry), and when *not* to encrypt (most letters — a lost passphrase is a lost letter, and heirs are the likeliest losers).

## Century-test note
Encryption is the one place Tessera knowingly trades durability for privacy, so the trade is opt-in, loud, and paper-escrowed. The century-test checklist gains a conditional row: *encrypted letters carry an unencrypted README and a printed escrow card.*

## Implementation
- `js/crypt.js` — pure wrapper over WebCrypto (encrypt/decrypt/kdf), dual export where Node's `crypto.subtle` allows; escrow card in `print.js`; decrypt path in `open.js` (v0.2's opening flow prompts when it meets `letter.txt.enc`).

## QA hooks
- `node tools/test-crypt.js` — round-trip fixtures, wrong-passphrase failure mode (clear message, no crash), salt uniqueness.
- `/qa`: seal-with-passphrase → open-with-passphrase full loop; README stays plaintext; escrow card prints.

## Open questions
- Recovery hints stored in manifest (`"hint"`) — probably yes, writer-optional, with copy warning against hints that are answers.
