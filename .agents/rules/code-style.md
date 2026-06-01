---
trigger: always_on
---

# Code Style Rules

These are the code-style rules for the LAWMA app. They exist so the codebase reads the same way no matter who (or which agent) wrote a given file.

Consistency matters more than personal preference.

---

# Language

TypeScript everywhere.

No JavaScript files inside:
- `src/app/`
- `src/components/`
- `src/lib/`

Configuration files are the only exceptions.

Strict mode is always enabled.

Do not disable:
- `strict`
- `noImplicitAny`
- `strictNullChecks`

to silence errors.

Fix the type instead.

---

# Naming

## Components

Components use:
- `PascalCase`
- `PascalCase.tsx`

Example:

```txt
ComplaintCard.tsx
```

exports:

```ts
ComplaintCard
```

---

## Hooks

Hooks:
- start with `use`
- live in `hooks/`
- or beside the component if tightly scoped

Examples:

```ts
useComplaintStatus
useScheduleReminder
```

---

## Utilities

Utility functions use:
- `camelCase`
- `camelCase.ts`

Example:

```txt
formatPhoneNumber.ts
```

---

## Constants

Fixed configuration constants use:

```txt
SCREAMING_SNAKE_CASE
```

Everything else uses:

```txt
camelCase
```

---

## Prisma Models

Database models are:
- singular
- PascalCase

Examples:

```prisma
Resident
Complaint
Payment
CollectionSchedule
Notification
```

Database columns use:
- `snake_case` in PostgreSQL
- `camelCase` in Prisma

---

## Boolean Variables

Boolean names must read naturally:

Good:
```ts
isLoading
hasError
canSubmit
isVerified
```

Bad:
```ts
loading
error
submit
verified
```

---

# File Organization

One component per file.

If a helper function is used only inside one component:
- define it below the component

If it is reused:
- move it into `lib/`

---

## Order Inside Component Files

1. Imports
2. Types/interfaces
3. Constants
4. Component
5. Internal helper functions

---

## Import Ordering

Order imports like this:

1. React
2. Third-party libraries
3. Internal imports (`@/`)

Separate groups with blank lines.

---

# TypeScript Rules

Prefer:

```ts
type
```

over:

```ts
interface
```

unless declaration merging is needed.

Keep types close to where they are used.

Shared types belong in:
- `src/types/`
- or domain-specific type files

---

## No `any`

Never use:

```ts
any
```

Use:
```ts
unknown
```

then narrow with type guards.

If `any` is absolutely necessary:
- explain why in a comment

---

## Zod Validation

Use zod for all external input:
- forms
- route handlers
- webhook payloads
- environment variables
- query parameters

TypeScript alone is not runtime validation.

---

# React Rules

Use:
- Function Components
- Hooks

Do not use:
- Class Components

---

## Props

Destructure props in the function signature.

Example:

```ts
export function Button({ label, disabled }: ButtonProps) {
```

---

## Server Components

Server Components are the default.

Only add:

```ts
"use client"
```

when the component truly needs:
- state
- effects
- browser APIs
- event handlers

Do not add `"use client"` defensively.

---

## Component Size

Keep components small.

If a component exceeds roughly:
```txt
200 lines
```

look for pieces to extract.

---

# Formatting

Formatting is controlled by Prettier.

Do not fight the formatter.

Rules:
- Two-space indentation
- Single quotes
- Semicolons required
- Trailing commas where valid

---

# Comments

Comments explain:
- WHY

not:
- WHAT

Bad:

```ts
// Increment counter
count++;
```

Good:

```ts
// LAWMA occasionally retries complaint sync requests;
// the unique complaint reference prevents duplicates.
```

---

## JSDoc

Use JSDoc for:
- shared utility functions
- payment logic
- auth helpers
- validation helpers

Avoid unnecessary JSDoc on simple internal components.

---

# Error Handling

Use `try/catch` around:
- database calls
- network calls
- JSON parsing
- payment operations
- file uploads

---

## Structured Errors

Return structured responses.

Success:

```ts
{
  ok: true,
  data
}
```

Failure:

```ts
{
  ok: false,
  error: {
    code,
    message
  }
}
```

---

## Never Expose Internal Errors

Never expose:
- Prisma errors
- stack traces
- internal file paths
- raw exceptions

Log the real error on the server.

Return sanitized messages to residents.

---

# Async Code

Prefer:

```ts
async/await
```

Avoid:
```ts
.then()
```

unless there is a strong reason.

---

## Background Tasks

Do not fire promises without awaiting them unless intentional.

If intentionally backgrounded:
- explain with a comment

---

# Imports

Use the alias:

```ts
@/
```

Example:

```ts
import { Button } from '@/components/ui/Button';
```

Do not use deep relative paths.

---

## Dependency Direction

Dependencies flow one way:

```txt
lib → components → app
```

Do not import:
- from `app/` into `components/`
- from `app/` into `lib/`

---

# Styling Rules

The LAWMA app uses:
- CSS Modules
- Design tokens
- CSS variables

Do NOT use:
- Tailwind
- styled-components
- inline styles
- CSS-in-JS libraries

---

## CSS Modules

All component styles use:

```txt
ComponentName.module.css
```

---

## Design Tokens

Never hardcode:
- colors
- font sizes
- spacing
- typography values

Always use CSS variables from:

```txt
tokens/tokens.css
```

Example:

```css
color: var(--color-on-surface);
font-size: var(--body-large-font-size);
```

---

# Accessibility Rules

Every interactive element must:
- be keyboard reachable
- have visible focus states
- support screen readers where applicable

---

## Labels

Inputs require:
- labels
- `htmlFor`
- matching `id`

Do not rely only on placeholders.

---

## Images

All images require:
- `alt`

Decorative images use:

```html
alt=""
```

---

# Mobile-First Rules

LAWMA is mobile-first.

Every component must work on:
```txt
375px viewport width
```

Touch targets must be:
```txt
44px minimum height
```

---

# Performance Rules

Optimize for:
- low-end Android devices
- weak network conditions
- small payloads
- fast rendering

Avoid:
- unnecessary re-renders
- large client-side bundles
- excessive dependencies

---

# Logging

Do not leave:

```ts
console.log()
```

inside committed code.

Use the logger utility instead.

---

# Dependencies

Do not add dependencies without developer approval.

Every dependency:
- increases bundle size
- increases maintenance cost
- increases security surface area

Keep dependencies minimal.

---

# What Not to Do

- Do not use `any`
- Do not bypass zod validation
- Do not hardcode colors or typography
- Do not add Tailwind
- Do not add Redux/Zustand unnecessarily
- Do not expose sensitive server errors
- Do not add large UI libraries
- Do not introduce unapproved architecture patterns
- Do not create duplicate components when extending existing ones would work better