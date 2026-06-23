---
id: 003
title: Login subhead says "phone" but input accepts both phone and email
page: /login
severity: medium
category: hierarchy
found_by: auditor
found_at: 2026-06-23
status: open
promoted_to: null
---

## Observation
The "Sign in" page subhead says: **"Enter your phone number to sign in."** The input label reads **"Email or Phone"**, and the placeholder is **"you@example.com or 080 123…"** (truncated). The copy contradicts itself within one screen.

## Why it matters
Residents already nervous about a government app will hesitate if the instructions don't match the input. Trust killer at the auth gate.

## Suggested direction
- Pick one auth identity (phone-first is more sensible for Lagos residents) OR write copy that owns both: "Use your phone or email."
- Fix the placeholder truncation — it cuts mid-number on mobile.
