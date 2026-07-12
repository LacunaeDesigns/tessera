# Design language

Tessera should feel like good stationery, not like software. Every screen is a desk; every export is an object. The app disappears; the letter remains.

## Tone of voice

- **Register:** second person, quiet, warm, precise. Instructional-poetic — the voice of someone showing you where the good paper is kept. Never chirpy, never clinical.
  - Yes: *"Choose the day this letter should wait for."*
  - No: *"Set your delivery date!"* / *"Configure open-date parameter."*
- **No urgency patterns, ever.** No streaks, badges, progress gamification, notification nags, or countdown pressure. Time is the medium, not the enemy.
- **Honesty is house style.** Where a promise can't be kept (time-lock cryptography, delivery guarantees), the copy says so plainly and explains what holds instead (ritual, custody). The reader is never managed.
- **The future reader is present tense.** Copy addressed to openers ("If you are reading this, the date has come") treats them as real people in a real room, not hypotheticals.
- **House prose rules** (inherited from the author's style guide): no em-dashes except interrupted speech; no "Not X. Not Y." anaphora stacking; plain words over ornament. `tools/prose-check.js`-style scans apply to letter-facing copy.

## Typography

- **Faces (since 2026-07-10):** the app owns two OFL faces in `fonts/` — **Young Serif** (display: cover sheet, sheet headings) and **Courier Prime** (typewriter voice: instructions page, sheet footers) — vendored from the landing so screen and paper share one identity. Vendored ≠ dependent: `@font-face` uses local file URLs only (still no webfonts, ever), and every use keeps the system stack as fallback, so a copy with `fonts/` stripped still prints sanely. The **letter body** is decided (specimen print, 2026-07-10): the system serif stack `Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Times New Roman', serif`, judged on paper against Young Serif at 11.5pt. The face that needs no file is also the one a copy can't lose; EB Garamond was the recorded fallback and was not needed. **Reconfirmed at v0.3 (2026-07-12):** the booklet body (9.5pt) was judged system serif vs a vendored EB Garamond in a side-by-side specimen, and the author kept the system stack (more readable at 9.5pt). The webfont question is closed for both bodies; no OFL text face is vendored.
- UI chrome (buttons, labels) may use the system UI stack; anything that is or touches *the letter* is serif.
- Generous measure (~65ch), 1.6 line-height on screen; print sizes set in `pt` (11.5pt body on the letter sheet).

## Palette

Paper and ink. Light theme is cream paper (`#f7f3ea` field, `#211d16` ink, `#8a4b2d` accent — a sealing-wax rust). Dark theme is **lamplight**, not "dark mode": deep warm brown-black (`#1c1813`), soft warm text (`#e8e0d0`), the same wax accent brightened (`#c96f42`). No pure black, no pure white, no cold blues. Accent is used the way wax is used: sparingly, at moments of sealing.

## Layout & interaction

- One column, one task per screen. The compose flow is a sequence of quiet questions, not a form.
- Mobile-first at 375px (house rule: test there, screenshot there). Print output is A4 with US Letter tolerance.
- Motion: almost none. Transitions are fades at most. The single permitted flourish is the moment of sealing (the token drawing itself) and, later, the opening ceremony.
- Accessibility: WCAG AA contrast in both themes; every flow keyboard-completable; `prefers-reduced-motion` respected (the flourish becomes a simple appearance); semantic HTML first, ARIA only where semantics fall short.

## Print aesthetics

The print kit is the product. Rules:
- Each artifact is its own sheet (page-break-controlled): letter, cover sheet, instructions page, token sheet, register page.
- Ink-light by default — hairline rules, no solid fields, nothing that drinks a home printer's cartridge.
- The letter sheet carries the letter ID and open date in a small footer; every sheet is self-identifying if separated.
- Cut/fold lines are dashed hairlines with scissors-free instructions in words as well.
- Print themes (v0.2: letterpress, aerogramme, telegram, wax-seal) restyle within these rules; the default theme is "plain good paper."

## The token's visual language

Mosaic tesserae: a small round token built of irregular tiles in the palette's ink+wax tones, split by an irregular interlocking break line. It should read as an object — something mintable, cuttable, matchable by eye across forty years of fading. Art families live in `/token-lab`; determinism rules in [features/token.md](features/token.md).
