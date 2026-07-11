// Gate 2 — letter-facing copy scans (docs/design-language.md + open-when.md rules).
// Usage: node tools/prose-check.js [files...]   (default: the letter-facing set)
// WARNs are for reading, not for CI to hide behind; exit 1 only with --strict.
'use strict';
const fs = require('fs');
const path = require('path');

const DEFAULT_FILES = ['data/occasions.js', 'index.html', 'js/print.js',
  'js/manifest.js', 'landing/landing.js', 'landing/opening.js', 'landing/reminders.js'];

const RULES = [
  { re: /—/g, why: 'em-dash (banned outside interrupted speech)' },
  { re: /\bNot [^.!?\n]{2,40}\. Not /g, why: 'negation-anaphora stack' },
  { re: /\b(hold space|your feelings are valid|self-care|healing journey)\b/gi, why: 'therapy-speak' },
  { re: /\b(act now|don't miss|hurry|limited time|last chance)\b/gi, why: 'urgency pattern' },
  { re: /\b(delve|tapestry|testament to|in a world|unleash|elevate)\b/gi, why: 'AI-tell vocabulary' },
  { re: /\w!{2,}/g, why: 'stacked exclamation marks' }
];

/* Strip JS comments so file-header prose and annotations don't drown real
   copy findings. Line-based and deliberately simple: full block comments and
   trailing comment tails. Letter-facing strings never live in comments. */
function stripComments(line, f) {
  if (!/\.js$/.test(f)) return line;
  return line.replace(/\/\*.*?(\*\/|$)/g, '').replace(/^\s*\*.*$/, '').replace(/\/\/.*$/, '');
}

let warns = 0;
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
for (const f of (args.length ? args : DEFAULT_FILES)) {
  const p = path.join(__dirname, '..', f);
  if (!fs.existsSync(p)) { console.log('skip (missing): ' + f); continue; }
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  lines.forEach(function (raw, i) {
    const line = stripComments(raw, f);
    for (const r of RULES) {
      r.re.lastIndex = 0;
      if (r.re.test(line)) {
        warns++;
        console.log('WARN ' + f + ':' + (i + 1) + ' ' + r.why + ' -> ' + line.trim().slice(0, 90));
      }
    }
  });
}
console.log(warns ? '\n' + warns + ' WARN(s). Read each one; fix or justify.' : 'prose: clean');
if (warns && process.argv.includes('--strict')) process.exit(1);
