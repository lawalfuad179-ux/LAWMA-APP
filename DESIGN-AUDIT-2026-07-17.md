# LAWMA Residents App — Design Audit (2026-07-17)

Scope: the full app — resident app (landing, login, dashboard, recycling, payments, profile,
complaints, schedules, notifications), `/center`, `/station`. Method: live click-through at
desktop + mobile + dark, plus a full CSS/component code sweep. Quality bar: the two kiosk
modules (`/center`, `/station`) — the newest, most token-disciplined code in the repo.

**These are substantive flow/system findings, not quick fixes.** Nothing here was changed;
this is a backlog for review. Severity: 🔴 Critical · 🟡 Moderate · 🟢 Minor.

---

## A. Seen live in the browser

### 🔴 A1 — Dashboard content below the greeting never renders (mobile) / blanks out (desktop scroll)
On a 375×812 viewport the dashboard shows the profile banner + greeting and then **nothing**
until the bottom nav — the scroll-reveal sections (collection schedule, quick actions, stats)
never fire. On desktop, scrolling with the keyboard leaves a large blank band and the sidebar
mispositions mid-scroll. The app's core screen is effectively empty on phones — and this app's
users are phone users.
**Treatment:** debug the `Reveal`/IntersectionObserver wiring (likely observing an element that
never intersects inside the scroll container); render content visible-by-default and use the
observer only to *animate*, never to *show*.

### 🔴 A2 — The reward wallet has no home
After a centre drop-off credits ₦1,550, the resident sees it… as one thin banner on the
Payments page, floating in an otherwise empty screen. No wallet card on the dashboard, nothing
under Recycling, no transaction history view (the ledger exists in the DB — `PointTransaction`
— it's just never shown). The MD's whole story is "your waste pays your bill"; the app never
*shows* that moment.
**Treatment:** a wallet/rewards card on the dashboard (balance, last credit, "auto-applies to
your next bill") + a ledger list (reuse the kiosk `historyRow` idiom) on Payments or Recycling.

### 🟡 A3 — Operator sessions aren't gated by facility kind
A transfer-station attendant (EBT01) can open `/center` and trade as a buy-back counter — and
the header concatenates to "Ebute-Ero Transfer Station Collection Centre". One session cookie,
two consoles, no `center.kind` check.
**Treatment:** gate `/center` to `kind=BUYBACK` and `/station` to `TRANSFER_STATION` (redirect
to the right console instead of erroring), and stop appending "Collection Centre" to the name.

### 🟡 A4 — OS dark-mode preference is ignored
`prefers-color-scheme: dark` does nothing; only the in-app toggle (`html[data-theme]`) works.
First launch on a dark-mode phone is a white flash-bang.
**Treatment:** default the theme from the media query when no explicit choice is stored.

### 🟡 A5 — Duplicated page titles and CTAs
Every app screen shows its name twice ("Payments" in the top bar, then "Payments" as an h1
directly beneath). The landing hero offers "Get started" + "Sign in" in the navbar and the same
pair again 400px below. Redundancy costs hierarchy on every single screen.
**Treatment:** one title per screen (keep the top-bar one, demote or remove the h1); one
primary CTA pair on the landing.

### 🟡 A6 — Profile-completion banner outranks the greeting
"Complete your profile" (grey card, ring chart, two chip-buttons) sits *above* "Good morning,
Demo" — the app talks about itself before it greets the person, on every visit until 5/5.
**Treatment:** greeting first; completion prompt as a slim dismissible row beneath, or inside
Profile.

### 🟢 A7 — Flagged kiosk receipts push the primary action below the fold
On `/center`, a receipt + flag banner pushes "Next resident" just off a 720px screen — the
no-scroll rule the weigh step obeys breaks on the flagged receipt.
**Treatment:** tighten receipt vertical rhythm when a flag is present (smaller top block), or
cap itemised rows with a "+n more" summary.

---

## B. From the code sweep (35 CSS modules + components)

### System level
- 🔴 **B1 — No radius/spacing/shadow tokens exist.** `tokens/tokens.css` covers color+type only.
  Result: **16 distinct border-radius values** (two competing pill idioms, 999px vs 100px;
  cards at 12/14/16px depending on file) and 30+ hand-rolled box-shadows in two syntax idioms.
  **Treatment:** add `--radius-{sm,md,lg,pill}` + `--shadow-{1,2,3}`, codemod the literals.
- 🔴 **B2 — `prefers-reduced-motion` honored in 0/35 resident-app modules.** The kiosks guard
  their animations; the resident app guards none (nav sheets, toasts, skeleton shimmer,
  timeline, dashboard reveals, payment Lottie confetti). **Treatment:** global reduce-motion
  reset + per-module guards, and a static success mark for the payment sheet.
- 🟡 **B3 — Four parallel badge/chip systems.** `StatusBadge` (4px radius, maps warning→orange
  *primary*), `Badge` (100px, **hardcoded hsl** for info/warning — breaks dark mode), an inline
  profile badge, and the kiosk `.chip` (999px on proper `--color-status-*` tokens — the correct
  model). **Treatment:** collapse to one primitive built on the status tokens.
- 🟡 **B4 — Hardcoded colors that break dark theme:** `Badge.module.css:15-26`,
  `recycling/page.module.css:102` (fixed light tint), `complaints/report/page.module.css:174,218`,
  onboarding SVG fills (`white`/`#fde8d5`). **Treatment:** route through tokens/currentColor.
- 🟢 **B5 — 21 uses of raw 9–11px font sizes** below the type ramp (schedules, timeline, navbar
  labels). **Treatment:** add a `--label-tiny` token.

### Flow level
- 🟡 **B6 — Complaint report form:** only Description validates inline; the generic "fill all
  required fields" error is unreachable (button is disabled until valid). Photo-upload failures
  are **silently swallowed** — the report submits without the photo and never says so.
  **Treatment:** per-field validation on blur; per-photo error/retry state.
- 🟡 **B7 — Missing `loading.tsx`** on `smart-bins` and `activities` — smart-bins fetches and
  flashes empty. **Treatment:** add matching skeletons.
- 🟡 **B8 — Modal accessibility is two-standard:** `Navbar` does focus-trap + Escape +
  `aria-labelledby` correctly; `PaymentVerifySheet` and the smart-bins sheet have none of it.
  **Treatment:** extract Navbar's trap into a shared hook.
- 🟡 **B9 — Near-zero ARIA in the app shell:** no live region on unread badge/toasts, no
  landmarks, icon-only controls unlabeled. (The kiosks, by contrast, use `role="meter"`,
  `radiogroup`, aria-values.)
- 🟢 **B10 — Payment verify dead-end:** after max retries the sheet only offers "Check Again";
  no support/history escape hatch.

### Hierarchy & motion
- 🟡 **B11 — Profile page is five same-weight sections** stacked with identical headers — no
  primary action stands out.
- 🟢 **B12 — Cards-in-cards on the dashboard grid** (bordered tiles inside bordered sections).
- 🟢 **B13 — List items pop in with no motion** (notifications, complaints, payments history)
  while the kiosk history animates — and B2 means what motion exists is unguarded.

---

## Suggested order of attack
1. **A1** (dashboard invisible on mobile) — this is a bug wearing a design costume; fix first.
2. **A2** (wallet surface) — it completes the story the two kiosk modules just built.
3. **B1 + B3/B4** (tokens, one badge system) — unlocks consistency and dark-mode correctness everywhere.
4. **B2** (reduced motion) + **B8/B9** (modal/ARIA parity) — systemic a11y, mostly mechanical.
5. **A3** (session gating) — small, but it's a correctness/trust issue at a real counter.
6. The rest as polish passes.

*Note: demo resident's local dev password was reset to a known value for this audit (local DB
only; prod untouched).*
