---
id: 001
title: Make landing hero (headline + copy + CTAs) fit within mobile viewport
source_signals: [001]
status: verified
priority: P0
files_touched: ["src/app/page.module.css"]
verifier_notes: "PASS — all 6 ACs met. Hero 896px (≤900). All hero content + both CTAs above mobile fold. Desktop unchanged. No console errors. See runs/2026-06-23-verifier.md."
verified_at: 2026-06-23
created: 2026-06-23
---

## Context
On the LAWMA app landing page (`/`), the hero section is 1136px tall on a 375x812 mobile viewport. Result: the first thing the user sees at the DG demo is the LandingHeader (logo + "Get started" + theme toggle) followed by a large empty cream area; the headline, supporting copy, and Lagos State Government badge all sit below the fold. See signal 001.

This is the #1 first-impression risk before the pitch.

## Acceptance criteria (Verifier will check each one)

1. **Above-the-fold content on mobile (375x812):** Headline (`Manage your waste, stay in control.`), the supporting paragraph, and the Lagos State Government badge must all be at least partially visible without scrolling.
2. **At least one CTA visible above the fold:** Either the primary `Get started` or the secondary `I already have an account` must be visible without scrolling on mobile (375x812).
3. **No regression on desktop:** At 1280x800 the hero must still read with comfortable spacing — headline, copy, CTAs, and phone mockup all visible; nothing cramped, nothing overlapping.
4. **Hero section height ≤ 900px on mobile (375 viewport).** Currently 1136. Implementer reports the new measured height in `files_touched` notes.
5. **No new console errors** when navigating to `/` (check via `mcp__Claude_Preview__preview_logs`).
6. **Implementer ran the dev server and confirmed the fix renders** — verifier will re-run.

## Constraints (do NOT change)
- Do not change the headline copy or the supporting paragraph wording.
- Do not change the CTA labels.
- Do not remove the phone mockup or the Lagos State Government badge — they're brand-credibility elements for the pitch.
- Do not edit components outside `src/app/page.tsx`, `src/app/page.module.css`, or `src/components/landing/LandingHeader.tsx` (and its module CSS).
- Do not touch `tokens/`.
- Sequential mode — single implementer, no worktrees this run.

## Suggested approach
The first thing to try: reduce vertical padding on the hero section at the mobile breakpoint in `src/app/page.module.css` (look for `.heroSection` / `.heroInner` / `.heroContent`). If the hero is using a top-aligned flex/grid where the phone mockup is pushing content down, consider re-ordering so the text + CTAs come above the mockup on mobile, with the mockup below.

If `.heroContent` uses `min-height: 100vh` or similar, that's the smoking gun on mobile.

Implementer is free to deviate; document the chosen approach in the `runs/2026-06-23-implementer.md` log.

## Verifier procedure
1. Restart / reload dev server, navigate to `/`.
2. Resize to mobile (375x812). Take a screenshot. Confirm headline + copy + badge + ≥1 CTA visible without scrolling.
3. Resize to desktop (1280x800). Take a screenshot. Confirm no regression.
4. Eval `document.querySelector('main section').getBoundingClientRect().height` at mobile width — must be ≤ 900.
5. Check `preview_logs --level error` — no new errors.
6. Update this task's `status` and `verifier_notes`.
