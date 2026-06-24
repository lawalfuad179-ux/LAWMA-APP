---
id: 007
title: Landing header groups primary CTA with theme toggle
page: /
severity: low
category: hierarchy
found_by: auditor
found_at: 2026-06-23
status: promoted
promoted_to: task-002
---

## Observation
The `LandingHeader` renders a solid orange "Get started" button immediately adjacent to the theme toggle pill in the top-right. Two visually-distinct controls (one a primary CTA, one a preference toggle) sit side-by-side at equal prominence.

## Why it matters
Visual grouping implies semantic grouping. Putting "Get started" next to a theme toggle muddies what the user is supposed to do. The same CTA is also duplicated at the bottom of the hero — the header copy is redundant.

## Suggested direction
- Remove the header "Get started" CTA (keep only the hero CTA).
- Or: keep the header CTA, remove the theme toggle from this header (also see signal 004).
- Inspect `src/components/landing/LandingHeader.tsx`.
