---
trigger: always_on
---

# Rule: Design System

## Token Files Are the Source of Truth

The LAWMA app has one design token file. The agent must never modify it without permission:

- `tokens/tokens.css`

This token file contains:
- Color values
- Font sizes
- Font weights
- Line heights
- Font families

The token file exports CSS custom properties globally.

---

## Mandatory: Use CSS Variables, Never Raw Values

The agent must never write hardcoded color values or typography values anywhere in the codebase.

Wrong:

```css
color: #1a1a1a;
font-size: 16px;
font-family: 'Inter', sans-serif;
background: #f5f5f5;
```

Correct:

```css
color: var(--color-on-surface);
font-size: var(--body-large-font-size);
font-family: var(--body-large-font-family);
background: var(--color-surface);
```

Before writing any style value:
1. Check the token file
2. Use existing variables
3. If no variable exists, ask before creating a new one

---

## LAWMA Visual Direction

The LAWMA app should feel:
- Clean
- Trustworthy
- Government-reliable
- Calm
- Accessible
- Lightweight
- Clear for low-tech users

Avoid:
- Decorative UI
- Excessive gradients
- Heavy animations
- Visual clutter
- Tiny text
- Low-contrast elements
- Complex layouts

---

## Spacing Scale

Use multiples of 4px only.

Allowed values:
- `4px`
- `8px`
- `12px`
- `16px`
- `24px`
- `32px`
- `48px`
- `64px`

Wrong:

```css
padding: 13px;
gap: 18px;
margin-top: 22px;
```

Correct:

```css
padding: 16px;
gap: 24px;
margin-top: 32px;
```

---

## Border Radius

Use only:
- Small elements/tags: `4px`
- Buttons/inputs: `8px`
- Cards/modals: `12px`

Do not invent new radius values.

---

## Styling Method

- All component styles use CSS Modules (`.module.css` files).
- No inline `style={{}}` props except for truly dynamic values that cannot be expressed in CSS (e.g., a progress bar width driven by a number).
- No Tailwind. No styled-components. CSS Modules only.

Use:
```txt
ComponentName.module.css
```

Do NOT use:
- Tailwind
- styled-components
- Global component CSS
- Inline styles

Inline styles are only allowed for:
- Dynamic widths
- Runtime-calculated positions
- Truly dynamic visual values

---

## Mobile-First Rules

LAWMA users are primarily mobile users.

Default styles MUST target mobile screens.

Use:

```css
@media (min-width: 768px) {
  /* desktop/tablet styles */
}
```

The app MUST work properly on a `375px` viewport.

Critical mobile screens:
- Onboarding
- OTP verification
- Dashboard
- Collection schedule
- Complaint reporting
- Complaint tracking
- Payment flow
- Notifications
- Resident profile
- Recycling education pages

---

## Touch Targets

All tappable elements must be at least `44px` tall.

Applies to:
- Buttons
- Inputs
- Tabs
- Navigation items
- Payment options
- Cards
- Complaint categories

---

## Forms

Forms must be:
- Simple
- Forgiving
- Easy to complete

Rules:
- Use clear labels
- Avoid placeholder-only labels
- Preserve form state on errors
- Use helpful validation messages
- Break long forms into steps

Important forms:
- Resident onboarding
- Address setup
- Complaint reporting
- Payment confirmation
- Profile editing

---

## Error and Empty States

Every important flow must include:
- Loading states
- Empty states
- Error states
- Retry states
- Success states

Use simple human language.

Examples:

```txt
Network connection is unstable. Retrying…
```

```txt
Payment failed. Please try again.
```

```txt
A similar report already exists in your area.
```

```txt
Your report has been submitted successfully.
```

---

## Accessibility Rules

The agent must prioritize accessibility.

Requirements:
- Use readable font sizes
- Maintain strong color contrast
- Use clear button labels
- Avoid icon-only actions
- Use large touch targets
- Do not rely on color alone for status communication

---

## Component Rules

Components must be:
- Reusable
- Mobile-first
- Token-based
- Easy to maintain
- Easy to read

Preferred components:
- Button
- Input
- Select
- Card
- StatusBadge
- ComplaintCard
- ScheduleCard
- PaymentMethodCard
- NotificationItem
- EmptyState
- ErrorState
- LoadingState

---

## Status Styling

Complaint statuses:
- Submitted
- In Review
- Assigned
- Resolved

Payment statuses:
- Pending
- Successful
- Failed
- Reversed

Collection statuses:
- Scheduled
- Delayed
- Missed
- Completed

Do not hardcode colors for statuses.

Use CSS variables only.

---

## Layout Rules

Prefer:
- Single-column mobile layouts
- Clear card sections
- Bottom navigation
- Large buttons
- Sticky primary actions

Avoid:
- Dense dashboards
- Complex grids
- Hidden actions
- Small touch targets
- Overloaded cards

---

## LAWMA-Specific UX Rules

The agent must design for real Lagos residents using the app in imperfect conditions.

Always consider:
- Poor network
- Low-end Android devices
- Outdoor usage
- Users with low digital confidence
- Fast complaint reporting
- Stress-sensitive payment/status checking

The interface should reduce effort, not add more steps.

---

## Final Rule

Before styling any component, the agent must check:

1. Is there a CSS variable for this?
2. Is the spacing from the allowed scale?
3. Is the radius allowed?
4. Is the component mobile-first?
5. Is the touch target at least `44px`?
6. Is the UI simple enough for low-tech users?