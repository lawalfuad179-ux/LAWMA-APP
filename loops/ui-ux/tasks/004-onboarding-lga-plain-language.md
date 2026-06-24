---
id: 004
title: Replace "LGA" jargon with plain language on onboarding card
source_signals: [008]
status: verified
priority: P2
files_touched: ["src/app/(public)/onboarding/page.tsx"]
verifier_notes: "PASS — DOM check: hasOldLgaCopy=false, hasNewAreaCopy=true. Other onboarding cards unchanged. Signup LGA select field untouched (still labelled LGA, which is the official Lagos term)."
verified_at: 2026-06-23
created: 2026-06-23
---

## Context
Onboarding step 1 card "Know your pickup day" uses "See your LGA's exact collection schedule before you miss it." First-impression jargon — friction against the "simple, transparent" pitch.

## Acceptance criteria
1. The phrase "your LGA's" is replaced with plain language ("your area's") on the onboarding step-1 card.
2. The other two cards on step 1 are unchanged.
3. Signup form `lga` field (where LGA is the actual selection) remains labelled "LGA" — that's the official Lagos term, only the marketing onboarding copy is being demystified.
4. No layout change, only copy.
