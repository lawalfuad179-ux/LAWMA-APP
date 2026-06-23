# tasks/

One **actionable engineering ticket** per file. A task is what an Implementer picks up and ships.

## Filename convention

`<NNN>-<short-kebab-slug>.md` — independent numbering from signals. E.g. `001-fix-login-cta-contrast.md`.

## Required frontmatter

```yaml
---
id: 001
title: Fix login CTA contrast and hierarchy
source_signals: [001]
status: open | in-progress | done-pending-verify | verified | rejected
priority: P0 | P1 | P2
files_touched: []   # filled in by Implementer
verifier_notes: ""  # filled in by Verifier
created: 2026-06-23
---
```

## Body sections

1. **Context** — what the signals said, in one paragraph.
2. **Acceptance criteria** — bullet list of verifiable conditions. The Verifier checks each one.
3. **Constraints** — what NOT to change (files, tokens, components).
4. **Suggested approach** — Triage's hunch; Implementer can deviate with a note.
