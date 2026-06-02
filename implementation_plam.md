# Antigravity Prompt — Aesthetic LAWMA Landing Page With Realistic Local Assets

Use the Read skill first.

Read:

* `AGENTS.md`
* `.agents/rules/architecture.md`
* `.agents/rules/design-system.md`
* `.agents/rules/code-style.md`
* current landing page files
* current asset folders

## Goal

Redesign the LAWMA landing page into a highly aesthetic, mobile-first, responsive marketing page using realistic Lagos sanitation visuals, product mockups, and optional short video scenes.

The page should feel:

* trustworthy
* local to Lagos
* public-service focused
* clean and modern
* not generic SaaS
* scalable across mobile, tablet, and desktop

## Tech Rules

Do not change the stack.

Use:

* Next.js
* CSS Modules
* Design tokens from `tokens/colors.css`
* existing components where possible

Do not use:

* Tailwind
* hardcoded colors
* hardcoded typography
* styled-components
* unnecessary animation libraries

## Asset Directory Structure

Create this structure:

```txt
public/assets/landing/
├── photos/
│   ├── lawma-truck.jpg
│   ├── waste-collection.jpg
│   ├── clean-neighbourhood.jpg
│   └── lagos-community.jpg
│
├── mockups/
│   ├── dashboard.png
│   ├── report-issue.png
│   ├── schedule.png
│   └── payment.png
│
└── videos/
    ├── hero-clean-lagos.mp4
    ├── waste-collection-loop.mp4
    └── community-reporting-loop.mp4
```

## Landing Page Structure

### 1. Hero Section

Use a split layout.

Mobile:

* headline
* short copy
* CTA buttons
* phone mockup
* image/video below

Desktop:

* text left
* phone mockup + Lagos visual right

Hero headline:

```txt
Cleaner streets start with easier reporting.
```

Supporting copy:

```txt
Track waste collection, report sanitation issues, pay bills, and receive LAWMA updates from one simple mobile-first app.
```

Primary CTA:

```txt
Get Started
```

Secondary CTA:

```txt
Report an Issue
```

Use:

```txt
public/assets/landing/mockups/dashboard.png
```

and optionally:

```txt
public/assets/landing/videos/hero-clean-lagos.mp4
```

as a muted background video or supporting visual.

---

### 2. Trust / Local Context Section

Use real Lagos/LawMA-style photography.

Use:

```txt
public/assets/landing/photos/lawma-truck.jpg
public/assets/landing/photos/clean-neighbourhood.jpg
```

Copy points:

* Built for Lagos residents
* Track your assigned PSP
* Secure Flutterwave payments
* Report missed pickup or illegal dumping
* Get updates from LAWMA

---

### 3. Feature Showcase

Create 4 visual feature blocks:

1. Track Collection Schedule
   Asset:

```txt
public/assets/landing/mockups/schedule.png
```

2. Report Waste Issues
   Asset:

```txt
public/assets/landing/mockups/report-issue.png
```

3. Pay Waste Bills
   Asset:

```txt
public/assets/landing/mockups/payment.png
```

4. Receive LAWMA Updates
   Asset:

```txt
public/assets/landing/photos/lagos-community.jpg
```

Each block should use:

* clear heading
* 1 short paragraph
* supporting image/mockup
* mobile-first stacked layout
* desktop alternating layout

---

### 4. How It Works

Use a clean 3-step layout:

1. Create your resident profile
2. Check schedules, report issues, or pay bills
3. Track updates and receive notifications

Use icons or small image cards.

Do not overcomplicate this section.

---

### 5. Reporting Confidence Section

Use this asset:

```txt
public/assets/landing/photos/waste-collection.jpg
```

Copy:

```txt
Every report gets a ticket number, so residents can track progress clearly from submission to resolution.
```

Show mini timeline:

```txt
Submitted → In Review → Assigned → Resolved
```

---

### 6. Video Enhancement Section

If video files exist, add a lightweight muted video block.

Use:

```txt
public/assets/landing/videos/waste-collection-loop.mp4
```

Rules:

* muted
* loop
* playsInline
* no audio
* no controls
* lazy loaded if possible
* image fallback required

Fallback image:

```txt
public/assets/landing/photos/waste-collection.jpg
```

---

### 7. Final CTA Section

Use a strong visual background image:

```txt
public/assets/landing/photos/clean-neighbourhood.jpg
```

Overlay with token-based gradient or surface layer.

Headline:

```txt
Help keep Lagos cleaner, one report at a time.
```

CTA:

```txt
Start Using LAWMA
```

Secondary CTA:

```txt
View Collection Schedule
```

## Responsive Layout Rules

Mobile:

* single column
* text first
* image after copy
* full-width CTAs
* no cramped cards

Tablet:

* two-column sections only where space allows
* keep readable max widths

Desktop:

* max-width content container
* alternating image/text sections
* larger hero visual
* no full-width stretched text

## Visual Style

Use:

* large local imagery
* rounded image cards
* clean mockups
* soft section backgrounds
* strong spacing
* simple CTAs

Avoid:

* generic stock smiling people
* cartoonish illustrations
* busy gradients
* too many icons
* video that distracts from CTA

## Implementation Files

Update:

```txt
src/app/(public)/page.tsx
src/app/(public)/page.module.css
```

If landing page path is different, inspect and update the correct route.

Optional components:

```txt
src/components/landing/HeroSection.tsx
src/components/landing/FeatureShowcase.tsx
src/components/landing/TrustSection.tsx
src/components/landing/VideoSection.tsx
src/components/landing/FinalCTA.tsx
```

Only create components if the page becomes too large.

## Image Usage Example

Use Next Image:

```tsx
<Image
  src="/assets/landing/photos/lawma-truck.jpg"
  alt="LAWMA waste collection truck on a Lagos street"
  width={1200}
  height={800}
  priority
/>
```

## Video Usage Example

```tsx
<video
  className={styles.video}
  autoPlay
  muted
  loop
  playsInline
  poster="/assets/landing/photos/waste-collection.jpg"
>
  <source src="/assets/landing/videos/waste-collection-loop.mp4" type="video/mp4" />
</video>
```

## Quality Checklist

Before finishing:

* Page works beautifully at 375px, 390px, 414px, 768px, and desktop
* Hero is clear above the fold
* Product mockup is visible
* Real Lagos-style visuals are used
* Missing assets have fallback states
* Videos do not block page loading
* No hardcoded colors
* No hardcoded font sizes
* No Tailwind
* CSS Modules only
* Buttons are at least 44px tall
* Page feels local, trustworthy, and premium
* Page does not look like a generic SaaS template

## Final Instruction

Make the LAWMA landing page feel like a modern civic technology product for Lagos.

The page should combine:

* realistic Lagos sanitation visuals
* app product mockups
* clear resident benefits
* strong mobile usability
* trusted public-service tone
