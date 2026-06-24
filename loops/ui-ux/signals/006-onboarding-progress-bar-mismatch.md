---
id: 006
title: Onboarding progress bar fill does not match "Step 1 of 2" label
page: /onboarding
severity: medium
category: hierarchy
found_by: auditor
found_at: 2026-06-23
status: dismissed
promoted_to: null
dismissed_at: 2026-06-23
dismissed_by: triage
dismissed_reason: Auditor error. Code review shows `.progressBar` has 2 flex:1 segments with `.segmentActive` applied only when `s <= step`. At step=1 of 2, segment 1 is filled = 50% width minus half the 6px gap (~47%). That's correct math. The screenshot was misread — the bar IS at ~50%, not 80%. No code change needed.
---

## Observation
The onboarding page renders a progress bar that appears ~80% filled, but the label beneath reads "Step 1 of 2". For step 1 of 2, the bar should be at ~50%.

## Why it matters
A literal progress bar that lies about progress reads as buggy. The whole onboarding is two screens; getting this wrong on the very first one is avoidable.

## Suggested direction
- Audit the progress bar component's `current` / `total` props.
- Either the math is wrong, or the styling is filling the wrong half.
- File: likely `src/components/onboarding/` — search for the progress component.
