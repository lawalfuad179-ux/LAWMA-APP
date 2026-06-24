---
id: 002
title: Login Continue button disabled state misreads as broken styling
page: /login
severity: low
category: color
found_by: auditor
found_at: 2026-06-23
status: promoted
promoted_to: task-003
---

## Observation
At default state (empty input), the Continue button renders as `rgb(252, 103, 3)` (brand primary) at opacity 0.45, producing a pale peach color with white text on top. Reads as a styling error rather than an intentional disabled state. Contrast (white on pale peach) also fails AA.

## Evidence
- `computedStyle`: `background-color: rgb(252, 103, 3); opacity: 0.45; color: rgb(255, 255, 255)`.
- `disabled: true` (intentional — input is empty).

## Why it matters
Government users will be skeptical of a polished-looking app shipping with what appears to be a malformed button. Even though it's working correctly, the visual signal is wrong.

## Suggested direction
- Disabled state: use a neutral gray (e.g. `var(--color-surface-container-high)` bg + `var(--color-on-surface-variant)` text), not the primary at reduced opacity.
- OR: keep the brand color but add a subtle visual disabled indicator (lock icon, "Enter your number first" helper text) so the intent reads.
