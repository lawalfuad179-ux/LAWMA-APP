# signals/

One **observation** per file. Signals are evidence, not fixes — they describe what's wrong, with proof.

## Filename convention

`<NNN>-<short-kebab-slug>.md` — e.g. `001-login-cta-low-contrast.md`. Use the next sequential number; do not reuse.

## Required frontmatter

```yaml
---
id: 001
title: Login CTA has insufficient contrast
page: /login
severity: high | medium | low
category: hierarchy | spacing | typography | color | depth | alignment | touch | brand
found_by: auditor
found_at: 2026-06-23
status: open | promoted | dismissed
promoted_to: <task-id, if status=promoted>
---
```

## Body sections

1. **Observation** — what the Auditor saw.
2. **Evidence** — screenshot path (under `runs/<date>/screenshots/`) or code snippet with file path.
3. **Why it matters** — pitch context, UX impact.
4. **Suggested direction** — *not* a prescription; just the Auditor's hunch on the fix shape.
