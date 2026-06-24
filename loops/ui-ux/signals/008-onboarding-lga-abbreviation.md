---
id: 008
title: Onboarding uses "LGA" abbreviation without expansion
page: /onboarding
severity: low
category: typography
found_by: auditor
found_at: 2026-06-23
status: promoted
promoted_to: task-004
---

## Observation
The "Know your pickup day" card reads: *"See your LGA's exact collection schedule before you miss it."* "LGA" (Local Government Area) is widely understood by Lagos residents but not universally — and is jargon for a first-onboarding moment.

## Why it matters
This is the resident's first 10 seconds with the app. Even mild friction at "what does LGA mean" undermines the "simple, transparent" pitch this page is making.

## Suggested direction
- Replace with plain language: "See your area's exact collection schedule before you miss it."
- Or first-mention expansion: "See your LGA (Local Government Area) collection schedule…"
- File: `src/app/(public)/onboarding/page.tsx`.
