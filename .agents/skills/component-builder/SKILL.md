# Component Builder Skill

Load this skill whenever you are creating or modifying a React component in LAWMA Mobile App. It tells you where the component goes, how it should be structured, and how to wire it up to the design system without reinventing anything.

## Before You Start

Read `.agents/rules/design-system.md` first. Components that do not follow the design system get rejected at review. This skill assumes you already know the tokens, spacing scale, CSS Modules requirement, and component primitives.

Then ask: does this component already exist? Search `components/` before adding a new one. Two slightly different `Button` components is how codebases rot.

## Where Components Live

```
components/
├── ui/                    primitives: Button, Input, Card, Badge, StatusBadge, etc.
├── onboarding/            onboarding and OTP components
├── schedules/             collection schedule components
├── complaints/            complaint flow and complaint status components
├── payments/              bill, payment method, receipt components
├── notifications/         notification list and preference components
├── recycling/             recycling education components
├── profile/               resident profile components
└── shared/                composites used across more than one domain
```

If a component is used exactly once and it is complex, it can live next to the page that uses it in `app/.../_components/`. Promote it to `components/` when a second caller shows up.

## Component File Template

```tsx
// components/<folder>/<ComponentName>.tsx
// Always use the `@/` alias for importing other components, utils, or hooks (e.g. `@/components/ui/Button`).

import styles from './<ComponentName>.module.css';

type <ComponentName>Props = {
  // Props go here. Required props first, optional after.
  children?: React.ReactNode;
  className?: string;
};

export function <ComponentName>({ children, className }: <ComponentName>Props) {
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return <div className={rootClassName}>{children}</div>;
}
```

```css
/* components/<folder>/<ComponentName>.module.css */

.root {
  color: var(--color-on-surface);
  font-size: var(--body-large-font-size);
}
```

Notes:

- Named export, not default export. Default exports make renaming harder and break auto-imports.
- `className` prop is accepted on components that render a single root element.
- Props type goes above the component, named `<ComponentName>Props`.
- Required props come before optional props.
- Styles live in a colocated CSS Module.
- Use dynamic inline styling *only* for runtime-calculated values (e.g. progress bar width).

## Server vs. Client Components

Default to server components. A component becomes a client component only when it needs one of these:

- React state (`useState`, `useReducer`)
- Effects (`useEffect`, `useLayoutEffect`)
- Browser-only APIs (`window`, `document`, `localStorage`, geolocation)
- File input preview behavior
- Event handlers that are more than a simple link (`onClick`, `onChange`)
- Context consumption for interactivity

If you add `'use client'`, put it on the first line of the file. Do not add it defensively.

Keep the client boundary as low in the tree as possible. A page that is mostly static but has one interactive complaint-category selector should not be a client component; the selector should be.

## Styling & Mobile-First Rules

CSS Modules only. No Tailwind. No styled-components. No inline styles except for truly dynamic runtime values.

Use CSS variables from `tokens/tokens.css` for all colors and typography.

Wrong:

```css
.root {
  color: #1a1a1a;
  font-size: 16px;
}
```

Correct:

```css
.root {
  color: var(--color-on-surface);
  font-size: var(--body-large-font-size);
}
```

Use only the approved spacing scale: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`.

Use only the approved border radius values:
- Small elements/tags: `4px`
- Buttons/inputs: `8px`
- Cards/modals: `12px`

### Touch Targets
All tappable and interactive components (buttons, input fields, tabs, navigation items, cards) must have a minimum touch target size of **44px** (height/width) to support mobile-first accessibility for low-tech or outdoor users.

## Component Size & File Rules

- **Limit Size**: Keep components small. If a component file exceeds roughly **200 lines**, look for logical pieces to extract.
- **One Component Per File**: Each file should only export one primary component.
- **Helper Colocation**: If a helper function is used only inside one component, define it below the component in the same file. If it is reused, move it to a utility file in `lib/` or `utils/`.
- **Prop Naming (Booleans)**: Boolean names must read naturally (e.g., `isLoading`, `hasError`, `canSubmit`, `isVerified` vs. `loading`, `error`, `submit`, `verified`).

## Variants

For components with variants such as `Button`, `StatusBadge`, or `Alert`, use small typed maps rather than long `if/else` chains.

Example:

```tsx
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  danger: styles.danger,
};

const sizeClass: Record<ButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const classes = [styles.root, variantClass[variant], sizeClass[size], className]
    .filter(Boolean)
    .join(' ');

  return <button className={classes} {...props} />;
}
```

## Accessibility & Security

### Accessibility (a11y)
- Every interactive element needs a keyboard-reachable focus state. CSS Modules should include `:focus-visible` styling using the brand token.
- Buttons without visible text need `aria-label`. Icon-only buttons are the most common offender. Do not let them ship without a label.
- Form inputs need associated labels via `htmlFor`/`id`. Avoid placeholder-only labels. Error messages are linked via `aria-describedby`.
- Images need `alt`. Decorative images use `alt=""`. Complaint evidence images should describe the evidence where possible.
- Do not rely on color alone for complaint, payment, or schedule statuses. Pair color with visible text.

### Security
- **No HTML Injection**: Never use `dangerouslySetInnerHTML` unless the content is thoroughly sanitized server-side.
- **URL Validation**: Never place unvalidated user-submitted URLs into `href` or `src` attributes. Only allow `https://` URLs.

## Testing a New Component

If the component is a primitive in `components/ui/`, write a simple manual-check by importing it into `app/_dev/page.tsx` if the project has a dev-only route. Verify:

- Default appearance
- Every variant
- Every size
- Disabled state if applicable
- Focus state by tabbing into it
- Hover state
- Mobile viewport at 375px wide

Domain components can be reviewed in place on the relevant page.

## Common Mistakes

- Creating a new primitive when an existing one would work with a new variant.
- Forgetting the `className` prop on a component that might need layout adjustment.
- Making a component a client component because it was easier.
- Using raw hex values instead of design tokens.
- Using Tailwind classes even though LAWMA uses CSS Modules only.
- Adding complex logic inside JSX. Extract to a named constant or helper above the return.
- Leaving `console.log()` statements inside committed components. Use the logger utility instead.
