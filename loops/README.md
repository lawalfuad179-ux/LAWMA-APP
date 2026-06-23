# Loops — agent-driven improvement system

This folder is the **harness** for autonomous agent loops working on the LAWMA app. It's adapted from Jason Zhou's loop-engineering pattern.

## Mental model

A **loop** is a recurring workflow where one or more agents wake up, do useful work, and write what they did into shared files so the next run (and other loops) can build on it.

Each loop has four ingredients:

1. **Trigger** — what wakes the loop up (manual `/loop`, cron via `/schedule`, or webhook)
2. **Tools** — what the agents can do (Read, Edit, Bash, Playwright, etc.)
3. **Contract** — the loop's `contract.md` (goal, workflow, boundaries, backlog)
4. **Artifacts** — shared knowledge written to disk so loops compound

## Folder layout

```
loops/
├── README.md          ← you are here
├── WORK_LOG.md        ← global cross-loop activity log (read last 5-10 entries before any work)
└── <loop-name>/
    ├── contract.md    ← the loop's spec
    ├── signals/       ← observations and findings (one .md per signal)
    ├── tasks/         ← actionable engineering tickets
    └── runs/          ← timestamped run logs (one .md per loop execution)
```

## Roles inside a loop

| Role | What it does | Verifies own work? |
|------|--------------|--------------------|
| **Auditor** | Looks at the app, finds issues, files signals | No — signals are evidence, not fixes |
| **Triage** | Reads signals, dedupes, promotes top items to tasks with acceptance criteria | No |
| **Implementer** | Picks top task, implements fix, commits | No — never self-verifies |
| **Verifier** | Read-only. Reads task + diff, reports pass/fail. | n/a |

**Hard rule (from Jason's video):** *Implementers never verify their own work.* Always spawn a separate read-only Verifier agent.

## How an agent should start any run

Before doing anything:

1. Read `loops/WORK_LOG.md` — last 5-10 entries.
2. Read the loop's `contract.md` — goal, workflow, boundaries.
3. Read recent files in `signals/` and `tasks/` for context.

When finishing:

1. Append your work to `loops/WORK_LOG.md` (single line: `[timestamp] [loop] [role] — what you did`).
2. Append to the loop's `runs/YYYY-MM-DD-<role>.md`.
3. Update any task statuses you changed.

## Parallelism

For the LAWMA test loop, agents run **sequentially** — Auditor → Triage → Implementer → Verifier.

For larger loops (e.g. LinqLab M/W/F), switch implementers to **parallel via git worktrees**:

```bash
git worktree add ../lawma-impl-<task-id> -b loop/<task-id>
```

Each implementer works in its own worktree; the dev server can run in each without colliding. See [docs/worktree-conventions.md](../docs/worktree-conventions.md) when we add it.

## Current loops

- **ui-ux** — finds visual-polish issues and ships small UI/UX fixes. See [ui-ux/contract.md](ui-ux/contract.md).
