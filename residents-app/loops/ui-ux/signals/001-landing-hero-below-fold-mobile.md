---
id: 001
title: Landing hero headline sits below the fold on mobile
page: /
severity: high
category: hierarchy
found_by: auditor
found_at: 2026-06-23
status: promoted
promoted_to: task-001
---

## Observation
On a 375x812 viewport (mobile baseline), the hero section measures 1136px tall. The headline ("Manage your waste, stay in control."), supporting copy, and Lagos State Government badge all render below the visible fold. The only above-the-fold elements are the LandingHeader (logo + "Get started" + theme toggle) and a large empty cream-colored gap.

## Evidence
- DOM check: `<h1>` opacity = 1, gov badge naturalWidth = 1760, both load correctly.
- `document.querySelector('main section').getBoundingClientRect().height` = 1136.
- `document.body.scrollHeight` = 4395.
- Screenshot taken at viewport (375x812) shows large empty cream section between the header and the CTA pair at the very bottom of the visible area.
- File: `src/app/page.tsx` lines 28-57.

## Why it matters
The DG of LAWMA pitch demo will likely happen on a phone or a laptop with a phone simulator. First impression of the app must show *what the app does* in the first viewport, not a blank cream wall. This is the single biggest credibility issue across the audit.

## Suggested direction
- Reduce hero vertical padding on mobile breakpoint (`@media (max-width: 768px)` in `src/app/page.module.css`).
- Or: move CTAs above the phone mockup so headline + copy + CTAs fit in 812px.
- Hero shouldn't exceed ~800px tall on mobile.
