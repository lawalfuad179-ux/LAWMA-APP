---
id: 005
title: Login and onboarding use a generic dots glyph instead of the LAWMA logo
page: /login, /onboarding
severity: high
category: brand
found_by: auditor
found_at: 2026-06-23
status: dismissed
promoted_to: null
dismissed_at: 2026-06-23
dismissed_by: human
dismissed_reason: The orange-dot glyph IS the LAWMA favicon (intentional brand mark, lives in Brand Assets/Favicon/). Auditor incorrectly classified it as generic. Memory updated: project_lawma_brand_glyph.
---

## Observation
The login and onboarding screens center a small orange-dot cluster glyph inside a circular background. It does not match any asset in `Brand Assets/Logo/`. There is also no LAWMA wordmark anywhere on the auth/onboarding screens.

## Why it matters
For a government-affiliated app being pitched to the LAWMA DG, the absence of the official LAWMA logo at every brand touchpoint is the kind of detail that gets caught in a five-second skim of the demo. It also fails to establish "yes, you're in the right app" reassurance for first-time residents.

## Suggested direction
- Replace the dots glyph with the actual LAWMA logo from `Brand Assets/Logo/`.
- Add a small LAWMA wordmark beneath or beside the mark on auth/onboarding.
- Audit any other component using this glyph (likely a `LandingHeader` or `AuthHeader` import).
