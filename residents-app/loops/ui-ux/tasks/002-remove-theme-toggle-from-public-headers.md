---
id: 002
title: Remove ThemeToggle from landing, login, and onboarding headers
source_signals: [004, 007]
status: verified
priority: P1
files_touched: ["src/components/landing/LandingHeader.tsx", "src/app/(public)/login/page.tsx", "src/app/(public)/onboarding/page.tsx"]
verifier_notes: "PASS — themeToggleFound=0 on /, /login, /onboarding (via DOM query). AppHeader.tsx + Navbar.tsx untouched. Imports cleaned in both edited page files. No console errors."
verified_at: 2026-06-23
created: 2026-06-23
---

## Context
Theme toggle appears on landing, login, and onboarding — wrong altitude (signal 004). It also competes with the primary "Get started" CTA in the landing header (signal 007). Theme is a one-time preference and belongs to the authenticated app shell (`AppHeader.tsx`, `Navbar.tsx`), where it already exists.

## Acceptance criteria
1. `LandingHeader.tsx` no longer renders `<ThemeToggle />`.
2. `(public)/login/page.tsx` no longer renders `<ThemeToggle />`.
3. `(public)/onboarding/page.tsx` no longer renders `<ThemeToggle />`.
4. `AppHeader.tsx` and `Navbar.tsx` (authenticated shell) still render the theme toggle — unchanged.
5. No console errors on `/`, `/login`, `/onboarding`.
6. The `ThemeToggle` import is removed from any file that no longer uses it (clean unused imports).

## Constraints
- Do not delete `ThemeToggle.tsx` or its CSS — still used post-auth.
- Do not change `AppHeader.tsx` or `Navbar.tsx`.
- No copy or layout changes beyond removing the toggle.
