# LAWMA / Sweep Residents App — Design System Extraction

> Extraction job (2026-08-11, Fourth Seat). Source of truth: the live app code at
> `residents-app/` (Next.js 16, React 19, CSS Modules, no Tailwind). Nothing here was invented;
> every value below was measured from the codebase. Where the app is inconsistent, the conflict
> is reported raw and the resolution is deferred to Third Seat.
>
> App surfaces in scope: resident app (landing, auth/onboarding, dashboard, payments, recycling,
> complaints, schedules, notifications, profile, smart-bins) plus the `/center` and `/station`
> kiosk consoles. The sibling `Admin App (start)` (`lawma-admin-mockup`, port 3200) is a static
> mockup and was NOT used as a source; the kiosk consoles inside `residents-app` are the
> token-disciplined reference code.

## 0. Token architecture (how the system is actually stored)

| File | Role |
|---|---|
| `tokens/color-tokens.json` | Material 3 color source: key colors, 18-step tonal palettes (primary/secondary/tertiary/neutral/neutralVariant), light+dark role maps |
| `tokens/design-tokens.tokens.json` | Figma Design Tokens export (`org.lukasoppermann.figmaDesignTokens` styleIds): the full type system |
| `tokens/build-tokens.js` | Node script that resolves role references → emits `tokens/tokens.css` |
| `tokens/tokens.css` | The generated + hand-maintained CSS consumed by the app (`@import '../../tokens/tokens.css'` in `globals.css`) |

Consumption: CSS Modules use `var(--color-*)`, `var(--*-font-size)`, `var(--shadow-*)`,
`var(--radius-*)`. Theme switching is `html[data-theme="dark"]` (stored in localStorage,
`layout.tsx` themeInit script). Font is next/font `Inter`.

**⚠ Raw finding (no action taken):** `tokens.css` contains ~202 lines of hand-authored tokens
(status colors, radius/shadow scale, HSL triplets, focus rings, media colors, semantic one-offs)
that exist ONLY in the generated file, not in the JSON sources. Running `node tokens/build-tokens.js`
(verified) deletes them — the build regenerates `tokens.css` and wipes the hand-written blocks.
The build script is not safe to run as-is.

---

## 1. Color

### 1.1 Brand key colors (from `color-tokens.json`)

| Token | Value | Role |
|---|---|---|
| `--color-primary` | `hsl(24, 98%, 50%)` (≈ #ff6600 orange) | Brand primary, CTAs, active states |
| `--color-secondary` | `hsl(82, 81%, 23%)` (dark olive-green, light mode) | Secondary actions |
| `--color-tertiary` | `hsl(192, 100%, 25%)` (dark teal, light mode) | Tertiary accents (recycling/bins) |

Supporting tonal palettes exist at 18 steps each (0,10,20,30,40,50,60,70,80,87,90,92,94,95,96,98,99,100)
for primary (orange), secondary (green), tertiary (teal), neutral (greys), neutralVariant (warm greys).
Error palette is NOT in the JSON — it lives only as FALLBACKS in `build-tokens.js`
(`color.palette.error.*`, standard M3 red ramp).

### 1.2 Role tokens actually consumed (usage frequency across all CSS/TSX)

Light mode values (dark mode overrides exist for all — see `tokens/tokens.css`):

| Role | Light value | Uses | Typical use |
|---|---|---|---|
| `--color-on-surface-variant` | `hsl(0, 1%, 28%)` | 176 | Secondary text, labels, icons |
| `--color-primary` | `hsl(24, 98%, 50%)` | 172 | CTAs, links, active nav, focus |
| `--color-on-surface` | `hsl(180, 2%, 11%)` | 146 | Primary text |
| `--color-outline-variant` | `hsl(0, 0%, 88%)` | 142 | Field/divider borders |
| `--color-surface` | `hsl(0, 0%, 100%)` | 110 | Cards, inputs, sheets |
| `--color-error` | `hsl(0, 54%, 41%)` | 49 | Errors, danger |
| `--color-surface-container-low` | `hsl(0, 0%, 97%)` | 41 | Subtle raised surfaces |
| `--color-surface-container-high` | `hsl(0, 0%, 92%)` | 38 | Disabled fills, pressed states |
| `--color-on-primary` | `hsl(0, 0%, 100%)` | 31 | Text on primary |
| `--color-surface-container` | `hsl(0, 0%, 95%)` | 30 | Raised surfaces, hover fills |
| `--color-primary-container` | `hsl(19, 100%, 79%)` | 26 | Brand-tinted fills |
| `--color-outline` | `hsl(0, 0%, 47%)` | 19 | Placeholders, disabled icons |
| `--color-secondary` / `--color-secondary-container` | `hsl(82, 81%, 23%)` / `hsl(85, 54%, 63%)` | 15/13 | Secondary buttons |
| `--color-background` | `hsl(0, 0%, 99%)` | 6 | Page background |

### 1.3 Status semantics (hand-authored in `tokens.css`, both themes)

| Group | info | success | warning | error |
|---|---|---|---|---|
| base | `hsl(207, 70%, 50%)` | `hsl(122, 39%, 49%)` | `hsl(35, 100%, 50%)` | `hsl(0, 68%, 50%)` |
| container | `hsl(207, 80%, 94%)` | `hsl(142, 60%, 92%)` | `hsl(28, 80%, 92%)` | `hsl(0, 60%, 93%)` |
| on-container | `hsl(207, 80%, 28%)` | `hsl(142, 70%, 22%)` | `hsl(28, 90%, 26%)` | `hsl(0, 60%, 28%)` |

(Note: `--color-status-success/warning/error/info` base values are declared twice —
`hsl(122,39%,49%)` in the first block, then re-declared `hsl(142,60%,38%)`-family block
overrides some — see tokens.css lines 90-115 vs 348-353. Third Seat: pick the canonical base set.)

### 1.4 Custom one-offs (hand-authored, mostly single-use)

`--color-surface-warm: #fcfbf8` (warm page surfaces) · `--color-cta-dark-bg: #1c1c1e` /
`--color-cta-dark-subtitle: #99a1ab` (landing CTA footer) · activity badge pairs
(review `#ffedd4`/`#f54900`, submitted `#f9efdc`/`#57310f`, confirmed `#dff7e8`/`#149954`) ·
`--color-sidebar-active-bg: #fff4ec` · `--color-text-secondary: #6b7280` ·
`--color-text-action: #364153` · `--color-text-description: #4a5565` ·
`--color-surface-stat: #f7f7f7` · report-icon lifecycle colors ·
`--color-primary-tint: hsl(24, 98%, 96%)` · `--color-primary-pressed: hsl(24, 98%, 44%)` ·
status border/tint variants · `--color-meter-amber: hsl(35, 95%, 58%)` ·
theme-invariant media colors (`--color-white`, `--color-black`, `--color-ink: hsl(220, 20%, 10%)`,
`--color-media-scrim`, `--color-media-flash: #ffd700` + flash-bg).

### 1.5 Hardcoded color leftovers (escaped the token system)

- `schedules/page.module.css:210-211` — `var(--color-status-warning-container, hsl(39,100%,92%))` and
  `var(--color-on-status-warning, hsl(28,80%,26%))`: HSL fallbacks used because the token names
  `--color-on-status-warning` do not exist (only `-container` variants do). ⚠ naming inconsistency.
- `smart-bins/page.module.css:382` — `var(--color-error-container, hsl(0,100%,95%))` fallback.
- `notifications/NotificationList.module.css:86` — `#b45309` (amber) + `color-mix(in srgb, orange 15%, ...)`: sole raw hex + color-mix in the app.

### 1.6 HSL triplet tokens (for alpha washes)

`--color-primary-hsl: 24, 98%, 50%` · `--color-error-hsl: 0, 54%, 41%` ·
`--color-success-hsl: 142, 60%, 40%` · `--color-ink-hsl: 220, 20%, 10%` ·
`--color-white-hsl: 0, 0%, 100%` — used as `hsla(var(--color-primary-hsl), 0.3)` for
brand-tinted shadows/rings (focus rings, CTA elevation, error washes).

---

## 2. Type

### 2.1 Font family

- **Inter** (next/font/google, latin subset, weight axis unrestricted) — the only family. Body inherits
  `--body-large-font-family: 'Inter'` from `globals.css`.
- Mono appears in exactly 5 places: `font-family: ui-monospace, SFMono-Regular, Menlo, monospace`
  (balances, amounts, codes — e.g. wallet/payment amounts).

### 2.2 Type scale (from `design-tokens.tokens.json`, emitted as CSS vars) — all weight 500 by spec

| Token | Size | Line-height | Letter-spacing | Real usage |
|---|---|---|---|---|
| display large | 64 | 96 | −2.88 | landing hero only (1 use) |
| display medium | 54 | 81 | −2.16 | (unused in src) |
| display small | 40 | 60 | −1.2 | 4 uses |
| headline large | 38 | 48 | −0.836 | (unused) |
| headline medium | 32 | 42 | −0.64 | 4 uses |
| headline small | 24 | 36 | −0.288 | 21 uses (page h1s) |
| title large | 28 | 42 | −0.56 | 6 uses |
| title medium | 20 | 30 | −0.3 | 14 uses |
| title small | 16 | 24 | −0.16 | 26 uses |
| body large | 16 | 24 | −0.192 | 22 uses (default body, set on `<body>`) |
| body medium | 14 | 21 | −0.14 | 91 uses (most common — app text default) |
| body small | 12 | 18 | −0.118 | 80 uses |
| label large | 14 | 21 | −0.168 | 7 uses (form labels, buttons sm) |
| label medium | 12 | 18 | −0.12 | 1 use |
| label small | 11 | 16.5 | −0.108 | 9 uses (badges) |
| label tiny (custom) | 10 | — | 0.06em | 1 use (stat captions) |
| text-13 / text-15 / text-18 (custom) | 13 / 15 / 18 | — | — | 12 / 2 / 3 uses (legacy micro scale) |

### 2.3 Weight usage (measured)

- 600: 103 uses (buttons, card titles, nav) — the de-facto emphasis weight
- 700: 111 uses (h1/h2, strong stat figures)
- 500: 46 uses (labels, secondary emphasis)
- 800: 7 uses — kiosk consoles only (`/center`, `/station` balance figures)
- 400: 5 uses

### 2.4 Hardcoded sizes outside the scale

36px (wallet balance, kiosk balances), 22px (kiosk headings), 15px, 13px, 11px, 10px, 9px.
Bigger sizes live in the kiosk consoles; the 13/15/18 custom vars exist to cover mid-gap sizes.

---

## 3. Spacing / radius / border / elevation

### 3.1 Spacing (measured set — no declared scale token exists; these are the real values)

`2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 56` px.

Top usage: gap 12 (66), 8 (58), 6 (50), 10 (40), 4 (39), 14 (30), 16 (25), 24 (15);
padding 24, 24×16 (page shell), 12×14 (inputs/buttons), 32×40 (wide cards), 14×16, 12×16.
Page shells: `padding: 40px 24px 56px` (mobile page bottom), `padding: 32px 40px` (cards),
`padding-bottom: 72px` on main (nav clearance).

### 3.2 Radius (measured; token scale exists but adoption is partial)

| Token | Value | Uses as var | Raw-value occurrences (approx) |
|---|---|---|---|
| `--radius-sm` | 9px | 0 | 9px ×3 |
| `--radius-md` | 12px | 4 | 12px ×36 |
| `--radius-lg` | 16px | 1 | 16px ×28 |
| `--radius-pill` | 999px | 2 | 999px ×25, 100px ×10 |
| — | 10px | — | ×51 (inputs, buttons, chips — NOT tokenized) |
| — | 14px | — | ×19, 8px ×22, 20px ×11, 24px ×4, 6px ×6, 4px ×4, 2px ×6 |
| — | 50% / 60% / 52% / 64% | — | avatars, dots, meters |

⚠ 10px (the single most common radius, used by `Input`, `Select`, buttons) is not in the token scale.

### 3.3 Border

- Field borders: `1.5px solid var(--color-outline-variant)` (inputs, selects)
- Separators/dividers: `1px solid var(--color-outline-variant)` (and `--color-outline` on muted)
- Buttons: `border: none` (solid variants); ghost = `1px solid var(--color-outline-variant)`
- Active tab indicator: `2px` underlines (primary color)

### 3.4 Elevation (shadow scale exists + a long tail of ad-hoc values)

Token scale:

| Token | Light | Dark |
|---|---|---|
| `--shadow-1` | `0 1px 2px hsla(0,0%,0%,0.08)` | alpha 0.35 |
| `--shadow-2` | `0 4px 12px hsla(0,0%,0%,0.10)` | alpha 0.45 |
| `--shadow-3` | `0 12px 32px hsla(0,0%,0%,0.16)` | alpha 0.60 |
| `--shadow-brand-1` | `0 2px 6px hsla(24,98%,50%,0.2)` | (same) |
| `--shadow-brand-2` | `0 4px 14px hsla(24,98%,50%,0.4)` | (same) |

Focus rings: `0 0 0 3px hsla(...)` ×3 semantic colors (primary/error/success at 0.12 alpha).

Ad-hoc shadows in CSS (sampled, each 1-4 uses): `0 8px 32px …0.14/0.06` (sheets),
`0 24px 64px rgba(0,0,0,0.28)` (kiosk modals), `0 -4px 32px …0.12` (bottom sheets),
`0 6px 24px hsla(primary, 0.4)` (primary CTA glows), plus ~30 one-off `0 Xpx Ypx` variants.

---

## 4. Layout

### 4.1 Breakpoints (measured)

| Breakpoint | Direction | Uses |
|---|---|---|
| 640px | min-width | 18 |
| 768px | min-width | 18 (app shell: sidebar appears, main margin-left) |
| 860px | min-width | 3 |
| 1024px | min-width | 2 |
| 720px | max-width | 3 (kiosk) |
| 767px | max-width | 5 (mobile nav / stack) |
| 560px | max-width | 2 |

### 4.2 App shell

- `--sidebar-w: 220px` (defined `globals.css` html; desktop sidebar 220px, main gets
  `margin-left: var(--sidebar-w)` at ≥768px)
- Mobile: fixed top header (80px pad-top on main) + fixed bottom nav (72px pad-bottom, with
  `env(safe-area-inset-bottom)`)
- Kiosk consoles (`/center`, `/station`): full-bleed, up to 720px-wide content, no sidebar

### 4.3 Grid

- `repeat(4, 1fr)` ×2 (dashboard quick actions), `repeat(2, 1fr)` ×2, `1fr 1fr` ×2,
  `repeat(3, 1fr)`, `repeat(auto-fit, minmax(260px, 1fr))` (landing community cards),
  `minmax(0, 1fr) minmax(420px, 0.95fr)` (smart-bins desktop split),
  `1fr 96px 76px` (payment row). Flexbox is dominant: 490 `display:flex` vs 10 `display:grid`.

### 4.4 Container widths

Landing ~1100px max; form/page shells 440px / 400px / 480px / 600px (auth, onboarding);
`max-width: 75vw` and `calc(100vw - 96px)` in kiosks; sheets ~620-700px.

### 4.5 Motion (measured)

- Page transitions: `pageIn` (0.5s, +12px rise), `fadeUp` (0.5s, +8px), `fadeIn` (0.6s) —
  defined in `globals.css` with reduced-motion kill-switch
- Framer-motion: login, onboarding, landing, RecycleTabs, AuroraBackground, Reveal,
  ComplaintList, ActivityList, PasswordQuickAccess, star-icon
- `Reveal` (scroll-reveal wrapper, IntersectionObserver, default y=14)
- Buttons: `transform 0.15s`, press scale 0.97, primary sheen sweep 0.6s cubic-bezier(0.16,1,0.3,1)
- Nav items: 0.15s color/transform, active icon scale 1.1

---

## 5. Component inventory (reusable `src/components/ui/`)

All components are CSS Modules. Icons: **lucide-react** (strokeWidth 1.5-2) + 4 custom
(`filled-bell-icon`, `star-icon`, `truck-electric-icon`, types) + SVG illustrations inline.

| Component | Variants / props | Tokens consumed |
|---|---|---|
| `Button` | variant: primary / secondary / ghost / danger; size: sm / md / lg; `isLoading` (spinner) | `--color-primary`+on, `--color-secondary-container`, outline-variant, `--color-error`+on; `--radius-md`; `--shadow-brand-1/2`; label-large/body-large/title-small sizes; focus ring |
| `Input` | label, error, helpText, icon, fieldState success/error, prefix, password eye-toggle | 1.5px outline-variant border, 10px radius (untokenized), `--color-error`, `--color-status-success`, focus-ring-primary/error/success, 48px min-height |
| `Select` | label, options, placeholder, error, icon, chevron | same field recipe as Input |
| `OtpInput` | value, onChange, error, autoFocus, label | field recipe, 6 cells |
| `AddressInput` | Google Maps Places autocomplete | field recipe + results dropdown |
| `Card` | children, className, `onClick` (→ clickable button card) | `--color-surface`, shadow-1, radius-lg |
| `Badge` | variant: info / success / warning / error / neutral | `--color-status-*` container/on-container pairs, radius-pill, label-small 600 |
| `StatusBadge` | same variants + `getComplaintBadgeVariant` / `getPaymentBadgeVariant` / `getBillBadgeVariant` mappers | same as Badge (composes Badge styles) |
| `StatusTimeline` | steps `{key,label}[]`, currentKey; done/current states | primary/on-primary markers, outline-variant connectors |
| `Skeleton` | `Bone`, `SkeletonPage`, `SkeletonCard`, `SkeletonEyebrow`, `SkeletonSection` | surface-container-high fills |
| `EmptyState` | variant: complaints / notifications / payments / schedule / default; title, message, action | outline icon, on-surface-variant text, primary action link |
| `Toast` | success / error / warning / info (ToastContext provider) | status containers + icons (UserCheck, XCircle, AlertCircle, Info) |
| `Navbar` | mobile fixed bottom nav + desktop fixed sidebar; active item indicator (primary, 1.1 scale) | `--color-primary`, outline-variant border, sidebar-active-bg |
| `AppHeader` | fixed top bar (mobile) | surface + outline-variant border |
| `ThemeToggle` | light/dark switch → `data-theme` | — |
| `BackButton`, `LogoutButton` (variant danger), `InstallPrompt`, `NetworkError`, `PasswordRulesChecklist`, `FirstLoginTour`, `OnboardingOverlay`, `ProductTour`, `AuroraBackground` (animated aurora), `Reveal`, `LottiePlayer` | single-purpose | status/error tokens, media colors |

### Feature components (`components/<domain>/` — page-level building blocks)

- **complaints**: `ComplaintsPageClient`, `ComplaintList` (framer-motion), `SwipeableComplaintCard`,
  `ComplaintImageGallery`, `EditComplaintForm`
- **payments** (`app/(public)/(app)/payments/`): `BalanceCard` (36px balance), `PayNowButton`,
  `PayAllButton`, `BillHistoryList`, `EmptyBillsState`, `PaymentVerifySheet` (bottom sheet,
  shadow `0 -4px 32px`, radius 20px)
- **dashboard**: `DashboardClient`, `DashboardActivity`, `ProfileCompletionCard` (SVG ring)
- **recycling**: `RecycleTabs` (framer-motion), `RecycleScanTab`, `RecycleHistory`
- **rewards**: `RewardsWalletCard` (800-weight balance), `RewardHistoryList`
- **schedules**: `PspContactCard`, `TrackPickupMap` (Google Maps)
- **activity / notifications / profile**: `ActivityList`, `NotificationList`, `AvatarUpload`
  (react-easy-crop + heic), `ProfileEditForm`, `PasswordSection`, `PasswordQuickAccess`
- **kiosk/center/station** (console apps, the most token-disciplined code): `KioskNav`,
  `CenterKiosk`, `CenterLogin`, `StationKiosk` — share pill chips, 2px radius inputs, 800-weight
  figures, 22/36px headings

### Iconography

lucide-react throughout (20px default, strokeWidth 1.5-2); custom: bell (filled), star, truck-electric.

---

## 6. Raw inconsistencies observed (decisions deferred — see §7)

1. **10px radius** is the most-used radius (Input/Select/51 sites) but is not in the token scale
   (9/12/16/999 are).
2. **Status base colors declared twice** in tokens.css (two `:root` blocks, lines ~90-115 and
   348-353, with conflicting values for success/warning/error/info).
3. **Missing token names**: `--color-on-status-warning`, `--color-on-status-success`,
   `--color-on-status-info` referenced in schedules fallbacks but never defined (only
   `-container` on-colors exist).
4. **Build script is destructive**: `build-tokens.js` regenerates `tokens.css` and wipes the
   hand-authored blocks (verified: 202 lines deleted). JSON sources and generated CSS have
   diverged — the JSON files do not contain status colors, radius/shadow scale, or the type
   overrides; source of truth is currently the CSS.
5. **Type weight drift**: token spec says all-500; app emphasizes with 600/700/800. Kiosk uses 800,
   resident app never does.
6. **`--color-secondary` light value is very dark** (`hsl(82,81%,23%)`) — secondary surfaces use
   `-container` instead; the base role is nearly unused (15 uses, mostly buttons that look dark).
7. **Unused token tiers**: display-medium, headline-large (0 uses); label-medium (1); several
   display/headline letter-spacing vars consumed only via full spec.
8. **Legacy micro sizes** (`--text-13/15/18`) coexist with label-tiny; 13px appears hardcoded
   ×23 sites.
9. **Shadows**: ~40 ad-hoc shadow values exist outside the 5-token scale; kiosk uses
   `0 24px 64px` and `calc(100vw - 96px)` / 75vw surfaces.
10. **The `Admin App (start)` mockup** (port 3200) shares the LAWMA brand but was not measured;
    its palette may drift from this system.

## 7. Third Seat resolutions (2026-08-12)

Every §6 inconsistency and every deferred decision is resolved below. Fixes marked APPLIED were
made and verified this session (tsc 0, build clean, `node build-tokens.js` no longer touches
`tokens.css`, md5 identical). Fixes marked DELEGATED are mechanical migrations spun into a packet
(`tasks/lawma-token-migration.md`), not done inline, per the free-model routing rule.

**Structural and token fixes (APPLIED):**
- **§6.4 destructive build script.** `build-tokens.js` now writes a `tokens.generated.css` diff
  artifact and never overwrites `tokens.css`, which is declared the hand-maintained source of
  truth. Verified: `tokens.css` md5 unchanged after a build run. `tokens.generated.css` gitignored.
- **§6.2 duplicate status base.** The second `:root` block that re-declared the four
  `--color-status-*` bases is deleted; its M3 vivid values were folded into the canonical status
  family, so nothing that renders changed. Status colors now have a single source.
- **§6.3 missing on-status names.** `--color-on-status-success/-warning/-info` added to the family
  (dark inks mirroring the `-on-*-container` values). Warning matches its one live fallback
  `hsl(28,80%,26%)` exactly, so no render change.
- **§6.1 10px radius.** Added `--radius-input: 10px` as the canonical control radius. New CSS uses
  it; migrating the ~51 existing 10px hardcodes to the token is DELEGATED.

**Palette and naming decisions (DECIDED, low/no code):**
- **Final palette:** the values now single-sourced in `tokens.css` are canonical (brand orange
  primary; the M3 vivid status set; the light/dark role maps from `color-tokens.json`). Amber
  `#b45309` / `color-mix` one-offs become a token in the shadow/semantic pass (DELEGATED).
- **§6.6 dark secondary base:** keep `--color-secondary` for M3 role completeness, but UI uses
  `-container`; the base stays a reserve role. No change.
- **§6.5 type weights:** the "all-500" spec was descriptive of the Figma export. The app's emphasis
  weights (600/700/800; kiosk 800) are intentional and canonical. The system sanctions a weight
  scale, not a single weight. No code change (weights already in use).
- **§6.7 unused type tiers:** keep (they come from the Figma export, cost nothing, aid completeness).
- **Component naming:** `StatusBadge` = status/semantic, `Badge` = neutral counts (keep both).
  Button sizes sm/md/lg at 44/48/52 min-heights (44 = HIG minimum). Any refactor is DELEGATED.
- **External sources:** do NOT pull from the Instagram feed or the official LAWMA site into the
  token system. The app code is the source of truth and external refs never override it.
- **§6.10 `Admin App (start)` mockup:** keep separate for now. It is a static mockup, not the
  token-disciplined reference; reconcile only if it becomes a real build.

**Mechanical migrations (DELEGATED, `tasks/lawma-token-migration.md`):**
- §6.1 migrate ~51 `10px` hardcodes to `--radius-input`.
- §6.8 migrate `--text-13/15/18` and the 23 hardcoded 13px sites to the `label-tiny` scale.
- §6.9 audit ~40 ad-hoc shadows to the 5-token scale, and add kiosk-scoped tokens for the large
  `0 24px 64px` kiosk surfaces.
- Fold the amber `#b45309` / `color-mix` one-offs into a named token.

The design system's decision layer is now complete: palette, naming, and every inconsistency have
a canonical answer, the token architecture is safe to build against, and the remaining work is
mechanical migration captured in the packet above.

## 8. Verification (actual output)

- `node tokens/build-tokens.js` → `Generated tokens.css` — but `git diff --stat tokens/` showed
  `tokens.css | 213 +++---------------------` (202 deletions, 11 insertions) proving the
  hand-authored blocks would be lost; file restored via `git checkout tokens/tokens.css`.
- `node -e "JSON.parse(...color-tokens.json); JSON.parse(...design-tokens.tokens.json)"` →
  `JSON OK`.
- `npx tsc --noEmit` → exit 0, no errors.
