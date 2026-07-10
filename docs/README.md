# Tessera docs — the canon

These documents are the source of truth for Tessera. When code and docs disagree, fix one of them the same day. (Pattern inherited from Perpetūra: docs are canon; drift is a bug.)

## Reading orders by task

- **New to the project?** [vision.md](vision.md) → [../SPEC.md](../SPEC.md) → [roadmap.md](roadmap.md)
- **Touching the format?** [../SPEC.md](../SPEC.md) → [spec/manifest-schema.md](spec/manifest-schema.md) → [spec/century-test.md](spec/century-test.md) → run `/spec-sync` after
- **Building a feature?** its file in [features/](features/) → [engineering/architecture.md](engineering/architecture.md) → [design-language.md](design-language.md) → run `/qa` after
- **Writing prompts / letter-facing copy?** [design-language.md](design-language.md) (tone of voice) → [features/open-when.md](features/open-when.md) (the calibration corpus)
- **Releasing?** [engineering/testing.md](engineering/testing.md) → `/qa` → `/century-audit` → `/release`

## Map

**Direction**
- [vision.md](vision.md) — why Tessera exists; the three promises; who it serves
- [positioning.md](positioning.md) — prior art, the gap, name rationale + collision scan
- [design-language.md](design-language.md) — typography, palette, tone of voice, print aesthetics, accessibility
- [roadmap.md](roadmap.md) — v0.1 → v2.x, the living plan
- [decisions.md](decisions.md) — key decisions log (append-only)

**The format (CC0, public domain)**
- [../SPEC.md](../SPEC.md) — the Tessera format v0.1
- [spec/manifest-schema.md](spec/manifest-schema.md) — `manifest.json` field by field
- [spec/readme-template.md](spec/readme-template.md) — the self-describing README.txt template
- [spec/custody.md](spec/custody.md) — custody chains, promises, succession
- [spec/century-test.md](spec/century-test.md) — the conformance checklist

**Features** (each: purpose → walkthrough → format touchpoints → implementation → QA hooks → open questions)
- v0.1: [writing-room.md](features/writing-room.md) · [token.md](features/token.md) · [print-kit.md](features/print-kit.md) · [registry.md](features/registry.md) · [open-when.md](features/open-when.md)
- v0.2: [opening.md](features/opening.md) · [reminders.md](features/reminders.md) · [encryption.md](features/encryption.md)
- v0.3: [occasions.md](features/occasions.md) · [booklet.md](features/booklet.md)
- v1.0: [commons.md](features/commons.md)
- v2.x: [century-layer.md](features/century-layer.md)

**Engineering**
- [engineering/architecture.md](engineering/architecture.md) — module map, storage, no-build rules, versioning triple
- [engineering/testing.md](engineering/testing.md) — QA gates and the century-test walkthrough protocol

**Execution** (working documents; the canon above outranks them on conflict)
- [PROGRESS.md](PROGRESS.md) — the execution tracker; twin of the Ariadne vault status
- [plans/v0.1-completion.md](plans/v0.1-completion.md) — shell + prose gate + QA + ship prep
- [plans/v0.2-opening.md](plans/v0.2-opening.md) · [plans/v0.2-reminders.md](plans/v0.2-reminders.md) · [plans/v0.2-encryption.md](plans/v0.2-encryption.md) — executable v0.2 plans
- [plans/v0.2-envelope-themes.md](plans/v0.2-envelope-themes.md) · [plans/later-versions.md](plans/later-versions.md) — pre-plan briefs with definition-of-ready triggers

## Skills (project commands)

`/qa` (full QA pass) · `/century-audit` (conformance review) · `/spec-sync` (format-drift detector) · `/occasion` (prompt/pack authoring) · `/token-lab` (token art iteration) · `/release` (version bump + ship). `/gallery-triage` arrives with the commons (v1.0).
