---
id: 003
title: Fix login subhead copy + neutralize disabled button color
source_signals: [002, 003]
status: verified
priority: P1
files_touched: ["src/app/(public)/login/page.tsx", "src/components/ui/Button.module.css"]
verifier_notes: "PASS — subtitle now 'Use your phone or email to sign in.' on signin and 'Use your phone or email to get started.' on signup. Disabled Continue button: bg=rgb(235,235,235) neutral gray, color=rgb(72,71,71), opacity=0.85 (was bright orange peach at 0.45). Visual screenshot confirms it reads as disabled, not broken. Cursor not-allowed preserved."
verified_at: 2026-06-23
created: 2026-06-23
---

## Context
Two related polish bugs at the auth gate:
- Signal 003: Login subhead says "Enter your phone number to sign in" but the input accepts phone OR email and is labelled "Email or Phone".
- Signal 002: Disabled buttons render as brand primary at opacity 0.45 (pale peach) — reads as broken styling.

## Acceptance criteria
1. Login signin subhead: replaced with copy that owns both identifiers (e.g. "Use your phone or email to sign in.").
2. Login signup subhead: replaced similarly (e.g. "Use your phone or email to get started.").
3. `Button.module.css` `.root:disabled` no longer relies on opacity-only on a brand color. Instead: neutral gray background (`var(--color-surface-container-high)`), de-emphasized text (`var(--color-on-surface-variant)`), opacity at most 0.85.
4. `not-allowed` cursor preserved.
5. The change applies app-wide (all `Button` usages) — verify primary, secondary, ghost, danger all read as disabled (not just visually broken).
6. No console errors.

## Constraints
- Do not change CTA labels.
- Do not change `--color-primary` token.
- Single CSS edit + two single-line copy edits.
