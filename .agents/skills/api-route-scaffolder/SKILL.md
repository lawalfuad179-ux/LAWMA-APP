# API Route Scaffolder Skill

Load this skill when creating or modifying a Next.js route handler (`app/api/**/route.ts`) or a server action. It tells you the exact shape every route should have in LAWMA Mobile App, so routes behave consistently whether they handle OTP, complaints, payments, schedules, or webhooks.

## Before You Start

Read `.agents/rules/architecture.md` and `.agents/rules/security.md`. This skill assumes you know the difference between a server action and a route handler, and it assumes you will validate input and handle errors the way those rules describe.

Ask: should this be a server action or a route handler?

- **Server action** if the caller is our own resident UI and the action is a form submit or UI-triggered mutation.
- **Route handler** if the caller is a public client, a third party, Flutterwave webhook, file upload boundary, OTP boundary, or another service.

Server actions are preferred for internal form writes. Route handlers are for external boundaries.

## Route Handler Template

```ts
// app/api/<resource>/<action>/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const inputSchema = z.object({
  // Describe every field you expect from the client.
  // CRITICAL: For monetary amounts, validate as integer minor units (Kobo) e.g., z.number().int().positive().
  // Never accept floats or decimals for money.
});

type Success<T> = { ok: true; data: T };
type Failure = { ok: false; error: { code: string; message: string } };

export async function POST(req: NextRequest) {
  try {
    // 1. CSRF Protection: Validate Origin/Referer (except for Flutterwave webhooks).
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    // Route handlers performing mutations must validate origin or referer against app domain.
    if (!origin || !origin.startsWith(appUrl)) {
      if (!referer || !referer.startsWith(appUrl)) {
        return NextResponse.json<Failure>(
          { ok: false, error: { code: 'forbidden', message: 'Request forbidden: invalid origin.' } },
          { status: 403 }
        );
      }
    }

    // 2. Parse and validate.
    const body = await req.json().catch(() => null);
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Check your input and try again.' } },
        { status: 400 }
      );
    }

    // 3. Authenticate if the route requires it.
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } },
        { status: 401 }
      );
    }

    // 4. Authorize: does this resident own the resource they are trying to touch?
    // Do the check explicitly, right here. Do not rely on the URL shape.

    // 5. Do the work. Keep this block small; extract to lib/ if it gets long.
    // Prohibit raw SQL string concatenation inside query blocks.
    const result = await db.$transaction(async (tx) => {
      return tx.resident.findUnique({ where: { id: session.residentId } });
    });

    // 6. Return a structured success response.
    return NextResponse.json<Success<typeof result>>({ ok: true, data: result });
  } catch (error) {
    logger.error('api.<resource>.<action>.failed', { error });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 }
    );
  }
}
```

## The Rules

**Always validate with zod.** Request bodies, query params, and path params all come from outside and cannot be trusted.

**Always authenticate before authorizing.** Check the session exists, then check the session has permission to do the thing. Authorization is always per-resource. "Can this resident view this payment?" means checking `payment.residentId === session.residentId`, not just "is this resident signed in?"

**Always return a consistent envelope.** Success is `{ ok: true, data }`. Failure is `{ ok: false, error: { code, message } }`.

**Never return raw error messages.** Log the real error on the server, return a sanitized message to the client.

**Use proper HTTP status codes.**

- `200` for success
- `201` for resource creation
- `400` for validation errors
- `401` for unauthenticated
- `403` for unauthorized
- `404` for resource not found
- `409` for conflicts
- `429` for rate limit hits
- `500` for server errors

**Rate limit public endpoints.** Anything reachable without a session must have a rate limit. Use `lib/rate-limit.ts`. Lean on it for OTP requests, OTP verification, complaint submission if exposed publicly, and payment initialization.

**Log structured data, not strings.** `logger.info('complaint.created', { complaintId, residentId })` beats `logger.info('Created complaint 123')`.

**Prevent SQL Injection.** Never use raw SQL string interpolation in database operations. Use Prisma parameterization.

**No Unawaited Background Promises.** Do not leave promises unawaited (floating) inside route handlers or actions as serverless runtimes (Vercel) will terminate instantly after sending the response, causing background tasks to fail. Use proper background processing queues or platform-native hooks.

## Server Action Template

```ts
// app/(resident)/<area>/actions.ts

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const inputSchema = z.object({
  // Use coercion helper (z.coerce) for numbers, booleans, and dates,
  // since Object.fromEntries(formData) yields only raw string representations.
  somethingNumber: z.coerce.number().int(),
  somethingBoolean: z.coerce.boolean(),
});

type ActionResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: { code: string; message: string } };

// CRITICAL: Next.js useActionState hook compatibility passes the previous state 
// as the first parameter. Actions designed for form hooks must follow this signature:
export async function createSomething(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } };
    }

    const parsed = inputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { ok: false, error: { code: 'invalid_input', message: 'Please check your entries.' } };
    }

    const created = await db.something.create({
      data: { ...parsed.data, residentId: session.residentId },
    });

    revalidatePath('/dashboard');
    return { ok: true, data: created };
  } catch (error) {
    logger.error('action.create_something.failed', { error });
    return { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } };
  }
}
```

## Idempotency

Any route that creates something paid for must be idempotent. See `skills/flutterwave-integration/SKILL.md` for the pattern using unique constraints. Do not implement payment idempotency with application-level locking; the database is the source of truth.

Complaint duplicate detection should prevent obvious spam, but it is not the same as payment idempotency. Use area, issue type, time window, and location proximity as product-level duplicate signals.

## Request IDs

Every log line should include a request ID so a single request can be traced through logs. The `logger` helper in `lib/logger.ts` should add this automatically when called from a route context.

## Common Mistakes

- Skipping zod validation and trusting TypeScript.
- Forgetting to use `z.coerce` for numerical or boolean properties mapped from `FormData`.
- Authenticating but forgetting to authorize.
- Using `GET` for a mutation.
- Failing to check Origin/Referer headers in non-GET Route Handlers (CSRF vulnerability).
- Allowing float or decimal types for monetary fields instead of integer minor units (Kobo).
- Leaving background promises floating/unawaited in serverless functions.
- Returning raw Prisma errors or exception messages.
- Forgetting to revalidate data after a server action mutates data.
- Putting business logic inline in the route handler. If it is more than a few lines, move it to `lib/`.
- Marking payments successful outside the Flutterwave webhook verification path.
