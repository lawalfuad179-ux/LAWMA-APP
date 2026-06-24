# LAWMA APP — Current State

_Updated: 2026-06-24 by Claude Opus 4.7. **Stub — needs Michael's brain-dump to be complete.**_

## Two parallel streams

LAWMA work runs on two parallel tracks. STATE.md tracks both.

---

## Stream 1 — Product (the Next.js app)

### Status
🟢 Active. General UI refinement via the `loops/ui-ux/` autonomous loop. Previous cycle completed Landing, Auth, and Dashboard pages.

### Last touched
- Loop cycle: Landing, Auth, Dashboard UI refinement (done)
- Recent product commits: payments (reward-credit auto-apply, verify-modal centering — `56a578c`, `d312bd7`)

### Next task
**Continue the `loops/ui-ux/` cycle on the remaining pages.** Once all pages have been refined, immediately switch to the pitch deck (see Stream 2).

### Loops portability (works in any IDE, not just Claude)

The methodology lives in `loops/README.md` + each loop's `contract.md` + `loops/WORK_LOG.md`. Any agent (Antigravity, OpenCode, Gemini, GPT) can continue it by:

1. Reading `loops/ui-ux/contract.md` (the spec)
2. Reading the last 5–10 entries of `loops/WORK_LOG.md` (recent state)
3. Picking the next page in the backlog (or finding remaining pages by reading what's been done)
4. Doing one iteration of refinement
5. Logging the run in `loops/ui-ux/runs/<timestamp>.md` and updating `WORK_LOG.md`

**The only Claude-specific bit is the `/loop` slash-command trigger.** In other IDEs, manually tell the agent: *"Read loops/ui-ux/contract.md and WORK_LOG.md, then run one iteration of the ui-ux loop and log it."* Same outcome.

### Blockers
None. Soft signal: once the loop has covered all pages, **switch immediately to Stream 2 (pitch deck)** — that's the higher-leverage next step.

### Don't touch zones
None.

### Live state
- Deployed on Vercel (`kingfizzy-projects/lawma-app`, Hobby plan)
- Recent stuck-deploy incident resolved via project recreate — see `decisions/0001`
- Repo: https://github.com/lawalfuad179-ux/LAWMA-APP

---

## Stream 2 — Pitch (DG of LAWMA + family meeting)

### Status
🟡 Locked plan, ready to produce on trigger keyword `LAWMA-PITCH-GO`.

### Context
- DS Hon. Meranda made the introduction
- Expected meeting: DG of LAWMA + family
- Deck spine, ask numbers, contradictions, pilot data, scaling plan — already vetted and ready

### Next action
**No confirmed meeting date yet.** Pitch plan stays locked, ready to produce on trigger keyword `LAWMA-PITCH-GO`. Once the `loops/ui-ux/` cycle finishes covering all pages, switch focus to the pitch deck even without a date — it's the next high-leverage block of work.

### Source
Full plan: `~/ai-workspace/wiki/projects/lawma/project_lawma_pitch_plan_locked.md`
Context: `~/ai-workspace/wiki/projects/lawma/project_lawma_pitch_context.md`

---

## Brand notes (cross-stream)

- **The orange-dot cluster IS the LAWMA brand glyph / favicon.** It is intentional, not "the wrong logo." Don't flag it as a mistake.
- Brand assets live in `Brand Assets/`.

---

## Open questions for next session

- [ ] Update `loops/ui-ux/contract.md` backlog with the pages still pending (so any agent picks up correctly)
- [ ] Confirm whether the pitch trigger keyword `LAWMA-PITCH-GO` should still produce the locked deck plan or needs updating (revisit once a meeting date is set)
- [ ] Rename `implementation_plam.md` → `implementation_plan.md` (typo)

## Working rules — quick refresh

- `AGENTS.md` (this repo) — product principles
- `AGENT_CONTEXT.md` (this repo) — deep technical briefing
- `~/ai-workspace/standards/ai-collaboration.md` — universal AI operating rules
