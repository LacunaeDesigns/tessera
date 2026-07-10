# The self-describing `README.txt` — canonical template

*Part of the Tessera format. Licence: CC0 1.0 (public domain). Translations of this template are encouraged and need no permission.*

Every Tessera letter carries a README addressed to **whoever finds it** — the named opener, a custodian, or a stranger in a drawer-clearing eighty years from now. It must work cold: no context, no software, no surviving URL. It duplicates everything essential in prose, in the letter's language, with dates written out in words.

Template fields in `{braces}` are filled by the writing tool. Sections in square brackets are included conditionally.

---

```
================================================================
THIS IS A LETTER MEANT FOR THE FUTURE.
================================================================

Sealed on:      {written-date-in-words}  ({written-iso})
To be opened:   {open-date-in-words}  ({openOn-iso})
From:           {from}
For:            {to}
Letter ID:      {id}
[IF WRITEBACK: In answer to:   {inReplyTo} (letter
                {generation} in its exchange)]

----------------------------------------------------------------
IF YOU ARE THE PERSON THIS IS FOR
----------------------------------------------------------------
If the open date has arrived (or long passed - letters are
patient), this letter is yours. Find the file called
"letter.txt" in this folder, or the printed letter if this
came to you on paper. Read it somewhere quiet.

If the date has not yet come: it waits. Not before, if you
can bear it. It was sealed with that request.

[IF TOKEN: You may have been given half of a small patterned
token, or one may be enclosed. The other half belongs to the
person who wrote this. If the halves match along their broken
edge, the letter is genuine. This works by eye; no machine is
needed.]

----------------------------------------------------------------
IF YOU FOUND THIS AND DON'T KNOW WHAT IT IS
----------------------------------------------------------------
Someone wrote this letter in {written-year} to be read by
"{to}" on or after {open-date-in-words}. It matters to
someone, even if everyone involved is gone.

Please do one of these, in order of preference:
  1. Deliver it, unopened, to the person it is for.
  2. Keep it safely until its date, then open it gently -
     you are now its reader of last resort.
  3. Pass it, with this explanation, to someone who can do
     1 or 2.
Please do not destroy it unread.

[IF CUSTODY: The people who agreed to look after this letter:
{custody-chain-in-prose}]

----------------------------------------------------------------
WHAT THE OTHER FILES ARE
----------------------------------------------------------------
letter.txt      - the letter itself. Plain text. This is the
                  thing that matters.
manifest.json   - the same facts as this page, arranged for
                  computer programs.
checksums.txt   - fingerprints (SHA-256) of each file, so a
                  future reader can check nothing was damaged.
                  Any computer of your era can do this check;
                  none needs to.
[token.svg      - the two-part token, as an image file.]
[media/         - {media-notes-in-prose}]

----------------------------------------------------------------
ABOUT THIS FORMAT
----------------------------------------------------------------
This letter is kept in the Tessera format: an open, public-
domain way of folding a letter, its dates, and its keeping
instructions into ordinary files that need no particular
program to read. The format was first published in 2026.
Web addresses die, so none is required - but if the word
"Tessera letter format" still finds anything in your era,
you can learn more there.

Everything essential is already in your hands.
================================================================
```

---

## Rules for implementers

- Plain ASCII line art only (the `=`/`-` rules above); no box-drawing characters — they survive fewer encodings and fewer printers.
- Hard-wrap at ~64 columns so the file prints legibly on anything.
- Dates in words use the letter's `language`; the ISO form always appears beside them in parentheses.
- The four sections (for the person · for the finder · the files · the format) are required; the bracketed passages appear only when the letter has a token, custody chain, media, or lineage.
- The lineage line (added 2026-07-10, with v0.2 write-back) appears only when the manifest carries a non-null `writeback`; it keeps the rule that the manifest never says anything the README does not say in prose. Originating letters are unchanged.
- Tone: calm, concrete, kind. The finder section is written for someone slightly rushed and slightly moved, standing over a box of a stranger's things.

## Translation guidance

Translate meaning, not phrasing; keep the section order; keep "Please do not destroy it unread." as close to literal as the language allows — it is the sentence doing the most work. Published translations should carry the same CC0 dedication.
