---
name: century-audit
description: Walk the century-test conformance checklist (docs/spec/century-test.md) against the current build. Use per release, or when any change might touch durability.
---

# /century-audit — conformance review

The century test protects **letters**, not the project. The project may be mortal; the letters are not.

## Procedure
1. Open `docs/spec/century-test.md` and take its checklist rows in order.
2. For each row, record ✓ / ✗ / n-a **with evidence**: a file:line reference, a command output, or a browser observation. No row is answered from memory.
3. Rows that need the browser (file:// operation, no external requests at compose/export/print): run the app from `file://` and from `node tools/serve.js` with dev-tools network log open; the request log is the evidence.
4. Conditional rows (e.g. encrypted letters carry an unencrypted README + printed escrow card) apply only when the feature exists — mark n-a with the version note otherwise.
5. Per release, the five-step physical walkthrough in the spec (compose real → print real → cut → seal → reopen with only a text editor + cold-reader test) is run by a human; record the date and results.

## Verdict
- Output a table: row · verdict · evidence.
- **An unexplained ✗ blocks the release.** An explained ✗ needs a `docs/decisions.md` entry accepting the trade, same day.
- Append the audit table to the release notes.
