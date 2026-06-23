---
id: 004
title: Theme toggle appears on landing, login, and onboarding — wrong altitude
page: /, /login, /onboarding
severity: medium
category: hierarchy
found_by: auditor
found_at: 2026-06-23
status: open
promoted_to: null
---

## Observation
A sun/moon theme toggle pill is rendered in the header of the landing page, the login screen, and the onboarding step screen. It competes for visual weight with the actual primary actions (Get started, Back, Continue).

## Why it matters
Theme is a one-time preference, not an action the user is here to take. Putting it next to primary CTAs adds noise to every first impression and clutters the auth/onboarding flow.

## Suggested direction
- Move the toggle into `/profile` or a settings dropdown that only appears post-auth.
- Or: keep it but visually demote (icon-only, no pill background, smaller).
