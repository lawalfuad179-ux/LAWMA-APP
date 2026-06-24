---
loop: ui-ux
status: active
mode: sequential
trigger: manual
owner: Michael
created: 2026-06-23
---

# UI/UX Loop — Contract

## Goal

Continuously raise the visual polish of the LAWMA resident-facing app so that, at the DG pitch meeting, the app reads as **a serious, considered execution** — not a vibe-coded prototype.

Specifically: catch and fix the cheap-looking AI-generated patterns (uneven spacing, weak hierarchy, generic typography, inconsistent radii/shadows) before they accumulate.

## Workflow

```
Auditor → Triage → Implementer → Verifier → (log)
```

1. **Auditor** opens the target pages (Playwright preferred, dev-server screenshots OK), reviews each against the rubric below, files one signal per distinct issue.
2. **Triage** dedupes signals, picks top N by impact-vs-effort, writes tasks with concrete acceptance criteria.
3. **Implementer** picks top task, makes the change, runs the dev server to confirm it builds, marks task `done-pending-verify`.
4. **Verifier** (separate read-only agent) reads task + diff + reruns the dev server, reports pass/fail, updates task status to `verified` or `rejected`.

## Boundaries

**In scope:**
- Visual polish on existing components/pages
- Spacing, typography, color, hierarchy, radii, shadows, hover/focus states
- Brand-kit adherence (Seravek font, Makiti/LAWMA palette)

**Out of scope (file a separate signal, do NOT change in this loop):**
- New features or routes
- Backend / API changes
- Auth flow logic
- Schema / Prisma changes
- Anything requiring user-decision input (copy changes that change meaning, IA restructuring)

## Audit rubric (refactoring-ui aligned)

For each page, the Auditor checks:

1. **Hierarchy** — primary action visually dominant? Secondary actions de-emphasized?
2. **Spacing** — consistent vertical rhythm? Adequate breathing room? No cramped clusters?
3. **Typography** — limited font sizes/weights? Line-height appropriate for size (≥1.5 for body, 1.6+ for display)?
4. **Color** — limited palette? Grays used for de-emphasis (not pure black)? Accent reserved for primary action?
5. **Depth** — shadows used sparingly and consistently? Layering reads correctly?
6. **Alignment & rhythm** — elements snapped to a grid? No off-by-4px drift?
7. **Touch targets** — interactive elements ≥44×44px (mobile-first; Lagos residents will use phones)?
8. **Brand fit** — Seravek font present where intended? LAWMA/Makiti colors from tokens, not hardcoded?
9. **Mobile fold budget** — On 375×812 mobile, the hero / first content section of any public page must be ≤ 920px tall (≈100vh minus a 180px header). Auditor measures via `getBoundingClientRect().height` on the first `<main> > section`.

## Pages already refined (previous cycles)

Out of scope unless a regression is filed as a fresh signal.

- `/` — landing
- `/login` — handles sign-in, sign-up, forgot password, OTP, set-up password sub-flows
- `/onboarding`
- `/dashboard`

## Target pages (next cycle backlog)

Pick one per loop iteration. Process top-to-bottom unless an audit signal shifts priority.

1. `/payments` — payment flow (recent: reward-credit auto-apply, verify-modal centering)
2. `/complaints` — complaints listing
3. `/complaints/report` — submit a new complaint
4. `/complaints/[id]` — view a single complaint
5. `/complaints/[id]/edit` — edit a complaint
6. `/schedules` — waste collection schedule
7. `/notifications` — notifications inbox
8. `/notifications/preferences` — notification settings
9. `/profile` — user profile
10. `/recycling` — recycling tips

## Backlog / status

(Updated by Triage and Implementer agents.)

| ID | Title | Status | Priority |
|----|-------|--------|----------|
| 001 | Make landing hero fit within mobile viewport | verified | P0 |
| 002 | Remove ThemeToggle from public headers | verified | P1 |
| 003 | Fix login copy + neutralize disabled button | verified | P1 |
| 004 | Replace LGA jargon on onboarding card | verified | P2 |

### Backlog
_Empty — all open signals from run 1 resolved or dismissed._

## Timeline

- 2026-06-23 — Loop created, first scoped run executed end-to-end.
- 2026-06-23 — Auditor scanned /, /login, /onboarding on mobile. Filed 8 signals.
- 2026-06-23 — Human dismissed signal 005 (dots glyph IS the LAWMA favicon).
- 2026-06-23 — Triage promoted signal 001 → task-001. Held 6 signals for next loop.
- 2026-06-23 — Implementer shipped CSS-only fix in `page.module.css`. Hero 1136 → 896px on mobile.
- 2026-06-23 — Verifier independently confirmed PASS on all 6 ACs.

**First loop cycle complete.** Backlog: 6 held signals ready for next run.

## How to scale to parallel (for LinqLab later)

When this loop graduates to parallel implementers:
- Triage promotes N independent tasks per run (no cross-file conflicts).
- Each Implementer spawns its own worktree: `git worktree add ../<repo>-impl-<task-id> -b loop/<task-id>`.
- Each opens a separate PR.
- One Verifier per PR (still no self-verification).
- Trigger: `/schedule` cron, e.g. M/W/F 09:00.
