# 1. Vercel project recreate is the fix for a "stuck deployment" state

Date: 2026-06-20 (incident) → 2026-06-24 (recorded as ADR)
Status: Accepted

## Context

On 2026-06-17 the LAWMA APP Vercel project (`kingfizzy-projects/lawma-app`, Hobby plan, repo `lawalfuad179-ux/LAWMA-APP`) stopped creating new deployments. `git push`, API deploy hooks, and the Vercel dashboard's "Deploy" button all returned `PENDING` jobs that never materialized. Only "Redeploy of …" of an old commit (`131fec3`) ran. GitHub disconnect+reconnect did not help.

The "commercial-use enforcement" hypothesis was wrong.

This mattered because the `/payments` page was broken in production with Prisma P2022 (`bills.discount_kobo` missing), since migration `0002_add_discount_and_recycling` never ran in the stuck deployment. The fix was on `main` but couldn't reach prod until the stall cleared.

## Decision

**When a Vercel project lands in this stuck state, the fix is to delete the Vercel project and re-import the same repo as a new project of the same name.**

After the recreate, the build runs `prisma migrate deploy`, the missing column appears, and the broken page renders. Everything flows normally afterward.

## How to execute (recipe)

1. Export environment variables first: `npx vercel env pull`.
   - Sensitive vars come back empty and must be re-entered after recreate.
   - **Do NOT manually set `VERCEL_*` or Neon `POSTGRES_*` / `PG*` vars** — those are auto-injected by Vercel and the Neon integration.
2. Delete the Vercel project.
   - Deletion is **async**; the project name can stay reserved briefly.
   - If a re-import fails with "already exists" and you really did delete, re-check the project list and delete again — the first attempt can silently glitch.
3. Re-import the same repo from GitHub as a new project (same name).
4. Re-enter sensitive env vars.
5. Verify Deployment Checks are configured:
   - Typecheck → **blocking**
   - Lint → **non-blocking**
6. If sub-daily cron is needed, **do not set it in `vercel.json`** (Hobby plan caps cron to daily). Use an external trigger like `cron-job.org` to hit a webhook endpoint instead.

## Gotchas (worth remembering for next time)

- **`@vercel/blob` `put()` auto-detects credentials at runtime** even without `BLOB_READ_WRITE_TOKEN` set explicitly. Conditional code that *gates on `process.env.BLOB_READ_WRITE_TOKEN`* will incorrectly fall to a local-fs path on Vercel (read-only filesystem → `EROFS`). **Always use Blob on Vercel, no guard.**
- **Neon-managed `DATABASE_URL` is read-only inside Vercel** once the integration owns it. The `sslmode=verify-full` hygiene fix can't survive integration takeover. The `SECURITY WARNING` about pg-connection-string SSL modes will return — it's noise, not an error.
- **iPhone HEIC images** come in as `image/heic` and Anthropic's vision API rejects them. Convert to JPEG with `heic-convert` before sending.

## Deploy hook

After recreate, the manual deploy hook lives in **Settings → Git → Deploy Hooks**, named `manual-deploy-main`. Use this when you need to force a deploy without a fresh git push.
