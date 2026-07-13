import { useEffect, useState } from 'react';
import type { DesignSystem, Page, SlideMeta, SlideTransition } from '@open-slide/core';
import { useSlidePageNumber } from '@open-slide/core';

import wordmark from '@assets/logos/linqlabs-wordmark-light.svg';
import mark from '@assets/logos/linqlabs-mark-light.svg';

import stillDashboard from './assets/clips/still-dashboard-idle.png';
import stillPaymentConfirmed from './assets/clips/still-payment-confirmed.png';
import stillTrackPickup from './assets/clips/still-track-pickup.png';
import stillSmartBinOrder from './assets/clips/still-smart-bin-order.png';
import stillFileReport from './assets/clips/still-file-report.png';
import stillScanAiRecycle from './assets/clips/still-scan-ai-recycle.png';
import stillTrackStatus from './assets/clips/still-6-2-track-status.png';
import stillNotificationResolved from './assets/clips/still-6-3-notification-resolved.png';

import adminDashboardMockup from './assets/mockups/admin-dashboard.png';
import adminPickupSchedulesMockup from './assets/mockups/admin-pickup-schedules.png';

import lawmaFavicon from './assets/badges/lawma-favicon.png';
import lagosStateSeal from './assets/badges/lagos-state-seal.png';

// ─── Panel-tweakable design tokens ────────────────────────────────────────────
export const design: DesignSystem = {
  palette: { bg: '#F1F5F9', text: '#0F1B29', accent: '#3FD6CD' },
  fonts: {
    display: '"Atkinson Hyperlegible", system-ui, -apple-system, sans-serif',
    body: '"Atkinson Hyperlegible", system-ui, -apple-system, sans-serif',
  },
  typeScale: { hero: 168, body: 36 },
  radius: 16,
};

// ─── House transition (RISE) — quiet, restrained, applies to every page ──────
// One transition family for the whole deck, per design-system convention:
// 6px rise + opacity, exit fast/in, enter slightly slower/out, ~200ms total.
// Never more than one transition vocabulary in a deck — that reads as PowerPoint.
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
export const transition: SlideTransition = {
  duration: 200,
  exit: {
    duration: 140,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-6px)' },
    ],
  },
  enter: {
    duration: 220,
    delay: 80,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

// ─── Webfont (loaded once, idempotent) ────────────────────────────────────────
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap';
if (typeof document !== 'undefined' && !document.getElementById('osd-webfont-lawma')) {
  const link = document.createElement('link');
  link.id = 'osd-webfont-lawma';
  link.rel = 'stylesheet';
  link.href = FONT_HREF;
  document.head.appendChild(link);
}

// ─── Page-load reveal keyframes (once, idempotent) ────────────────────────────
// Used for staggered hero-text reveals (cover/close) and app-screen entrances —
// a page-load sequence, not a scroll effect, per the "orchestrated moment"
// principle: one clean build-in per page, not scattered micro-animations.
const KEYFRAMES_ID = 'osd-keyframes-lawma';
if (typeof document !== 'undefined' && !document.getElementById(KEYFRAMES_ID)) {
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes lawmaFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; animation-delay: 0ms !important; }
    }
  `;
  document.head.appendChild(style);
}
const revealStyle = (delayMs: number): React.CSSProperties => ({
  opacity: 0,
  animation: `lawmaFadeUp 700ms ${EASE_OUT} ${delayMs}ms both`,
});

// ─── Local constants (outside the DesignSystem shape) ────────────────────────
const navy = '#0F1B29';
const ink = '#111B29';
const teal = '#3FD6CD';
const sky = '#3DADD6';
const cream = '#F8FAFC';
const offwhite = '#F1F5F9';
const caption = '#527288';
const line = 'rgba(15,27,41,0.12)';
const green = '#16A34A';
const lawmaOrange = '#FB6703';
const brandOrange = '#FD6603';
const nearWhite = '#F7F7F7';
const mono = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace';
const display = 'var(--osd-font-display)';
const body = 'var(--osd-font-body)';

const PAD = 120;
// Real crop aspect of every captured phone clip (width:height).
const CLIP_ASPECT = 750 / 1624;
// Real crop aspect of the captured admin screenshots (width:height).
const ADMIN_ASPECT = 1600 / 1000;

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: body,
  boxSizing: 'border-box',
} as const;

// Tabular figures + tighter tracking on large numerals — small detail, reads
// as engineered rather than assembled. Bigger numeral = tighter tracking.
const numeralStyle = (size: number): React.CSSProperties => ({
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: size >= 90 ? '-0.02em' : size >= 50 ? '-0.01em' : 0,
});

// ─── Count-up hook — drives both numeral displays and Fill Line widths ───────
// Runs once on mount (each page mounts fresh on navigation), easeOutCubic.
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

// ─── Shared chrome ─────────────────────────────────────────────────────────────
const Eyebrow = ({ label }: { label: string }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: 20,
      letterSpacing: '0.14em',
      color: sky,
      fontWeight: 700,
      marginBottom: 20,
    }}
  >
    {label}
  </div>
);

const Rule = ({ width = 64, color = teal }: { width?: number; color?: string }) => (
  <div style={{ width, height: 4, background: color, borderRadius: 2, marginBottom: 28 }} />
);

const PageNumber = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <span style={{ fontFamily: mono, fontSize: 18, color: caption, letterSpacing: '0.08em', ...numeralStyle(18) }}>
      {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </span>
  );
};

const ContentFooter = () => (
  <div
    style={{
      position: 'absolute',
      left: PAD,
      right: PAD,
      bottom: 44,
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
    }}
  >
    <PageNumber />
  </div>
);

const CornerMark = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const size = 28;
  const t = 4;
  const base: React.CSSProperties = { position: 'absolute', width: size, height: size };
  const styles: Record<string, React.CSSProperties> = {
    tl: { ...base, top: 48, left: 48, borderTop: `${t}px solid ${ink}`, borderLeft: `${t}px solid ${ink}` },
    tr: { ...base, top: 48, right: 48, borderTop: `${t}px solid ${ink}`, borderRight: `${t}px solid ${ink}` },
    bl: { ...base, bottom: 48, left: 48, borderBottom: `${t}px solid ${ink}`, borderLeft: `${t}px solid ${ink}` },
    br: { ...base, bottom: 48, right: 48, borderBottom: `${t}px solid ${ink}`, borderRight: `${t}px solid ${ink}` },
  };
  return <div style={styles[pos]} />;
};

// Fill Line — the deck's one data-infographic signature device. Used ONLY
// where the number is honestly a percentage or a proportion of a whole
// (never forced onto counts/durations that aren't naturally a fill amount).
const FillLine = ({ percent, color = teal }: { percent: number; color?: string }) => {
  const animated = useCountUp(percent);
  return (
    <div style={{ width: '100%', height: 6, background: line, borderRadius: 3, marginTop: 16, overflow: 'hidden' }}>
      <div style={{ width: `${animated}%`, height: '100%', background: color, borderRadius: 3 }} />
    </div>
  );
};

// ─── Static app-screen preview — replaces ImagePlaceholder with the real MVP ──
// Width is derived from height via the clip's real crop aspect so the box is an
// exact fit — no letterboxing, and the full header/nav bar always stays in frame.
// Renders as a plain <img>, not <video> — autoplaying ~20 videos at once in
// this SPA left several stuck on a partial decoded frame; a still sidesteps
// that failure mode entirely for content that's mostly static anyway.
const StillPreview = ({ src, height }: { src: string; height: number }) => {
  const width = Math.round(height * CLIP_ASPECT);
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 20,
        overflow: 'hidden',
        border: `0.5px solid ${lawmaOrange}`,
        boxShadow: `0 10px 24px rgba(15,27,41,0.14), 0 0 16px rgba(251,103,3,0.35)`,
        background: navy,
        flexShrink: 0,
      }}
    >
      <img src={src} width={width} height={height} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  );
};

// ─── Admin screen preview — landscape sibling of StillPreview ────────────────
// Same frame chrome as StillPreview (orange hairline, soft glow, rounded 20)
// but sized for a browser/dashboard screenshot. Three sizing modes:
//   fit='width'  — locks to the parent container width; height is given.
//   fit='height' — derives width from height × ADMIN_ASPECT and centres.
//   fit='fill'   — fills the parent in both axes (use with a flex row that
//                  has alignItems: 'stretch'); reveals the maximum crop of
//                  the screenshot when the caller controls the container size.
const AdminStill = ({
  src,
  height,
  fit = 'height',
  crop = 'cover',
}: {
  src: string;
  height?: number;
  fit?: 'width' | 'height' | 'fill';
  crop?: 'cover' | 'contain';
}) => {
  const sized: React.CSSProperties =
    fit === 'fill'
      ? { width: '100%', height: '100%' }
      : fit === 'width'
        ? { width: '100%', height: height ?? 0 }
        : { width: Math.round((height ?? 0) * ADMIN_ASPECT), height: height ?? 0 };
  return (
    <div
      style={{
        ...sized,
        borderRadius: 20,
        overflow: 'hidden',
        border: `0.5px solid ${lawmaOrange}`,
        boxShadow: `0 10px 24px rgba(15,27,41,0.14), 0 0 16px rgba(251,103,3,0.35)`,
        background: cream,
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: crop,
          objectPosition: crop === 'cover' ? 'top left' : 'center',
          display: 'block',
        }}
      />
    </div>
  );
};

// ─── Mockup placeholder — widescreen frame for a not-yet-built admin screen ───
// Same frame chrome as StillPreview (orange hairline, soft glow) but sized for
// a browser/dashboard aspect. Swap the dashed border for a real screenshot
// once the admin platform has one.
const MockupFrame = ({ label, height = 460 }: { label: string; height?: number }) => (
  <div
    style={{
      width: '100%',
      height,
      borderRadius: 20,
      border: `1.5px dashed ${lawmaOrange}`,
      boxShadow: `0 10px 24px rgba(15,27,41,0.08), 0 0 16px rgba(251,103,3,0.18)`,
      background: cream,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        border: `2px solid ${line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="12" rx="1.5" stroke={caption} strokeWidth="1.6" />
        <path d="M8 20h8M12 16v4" stroke={caption} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
    <div style={{ fontSize: 20, color: caption, fontWeight: 700 }}>{label}</div>
  </div>
);

// ─── 01 — Cover (poster) ───────────────────────────────────────────────────────
const Cover: Page = () => (
  <div
    style={{
      ...fill,
      background: nearWhite,
      color: ink,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `0 ${PAD}px`,
    }}
  >
    <CornerMark pos="tl" />
    <CornerMark pos="tr" />
    <CornerMark pos="bl" />
    <CornerMark pos="br" />

    <img
      src={wordmark}
      alt="LinqLabs"
      style={{ height: 40, position: 'absolute', top: 96, left: PAD, ...revealStyle(0) }}
    />

    <div style={{ maxWidth: 1500 }}>
      <div style={{ width: 320, height: 8, background: ink, marginBottom: 8, ...revealStyle(80) }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 40, ...revealStyle(160) }}>
        <h1
          style={{
            fontFamily: display,
            fontSize: 148,
            fontWeight: 700,
            lineHeight: 1.02,
            margin: 0,
            color: brandOrange,
            letterSpacing: '-0.02em',
          }}
        >
          LAWMA
        </h1>
        <img src={lawmaFavicon} alt="" style={{ height: 120, width: 'auto', display: 'block' }} />
      </div>
      <div style={{ height: 6, background: ink, margin: '20px 0', ...revealStyle(240) }} />
      <h1
        style={{
          fontFamily: display,
          fontSize: 148,
          fontWeight: 700,
          lineHeight: 1.02,
          margin: 0,
          color: cream,
          letterSpacing: '-0.02em',
          WebkitTextStroke: `2px ${ink}`,
          ...revealStyle(300),
        }}
      >
        RESIDENT APP
      </h1>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: 220, height: 8, background: ink, marginTop: 8, ...revealStyle(380) }} />
      </div>
      <p
        style={{
          fontFamily: mono,
          fontSize: 22,
          letterSpacing: '0.12em',
          marginTop: 48,
          color: ink,
          fontWeight: 700,
          ...revealStyle(440),
        }}
      >
        BUILT · DEPLOYED · BY LINQLABS
      </p>
    </div>

    <div
      style={{
        position: 'absolute',
        left: PAD,
        right: PAD,
        bottom: 96,
        borderTop: `1px solid ${ink}`,
        paddingTop: 24,
        fontSize: 26,
        fontWeight: 700,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        ...revealStyle(520),
      }}
    >
      <span>Prepared for Dr Muyiwa Gbadegesin, Managing Director, LAWMA</span>
      <span>13 July 2026</span>
    </div>
  </div>
);

// ─── 02 — The scale (asymmetric bento) ─────────────────────────────────────────
const BentoTile = ({
  col,
  row,
  big = false,
  children,
}: {
  col: string;
  row: string;
  big?: boolean;
  children: React.ReactNode;
}) => (
  <div
    style={{
      gridColumn: col,
      gridRow: row,
      background: cream,
      border: `1px solid ${line}`,
      borderRadius: 16,
      padding: big ? '36px 40px' : '26px 30px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    {children}
  </div>
);

const CountStat = ({
  target,
  decimals = 0,
  prefix = '',
  suffix = '',
  label,
  size,
}: {
  target: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  size: number;
}) => {
  const value = useCountUp(target);
  const formatted =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US');
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: size, fontWeight: 700, color: teal, lineHeight: 1, ...numeralStyle(size) }}>
        {prefix}
        {formatted}
        {suffix}
      </div>
      <div style={{ fontSize: 24, color: ink, marginTop: 10 }}>{label}</div>
    </div>
  );
};

const Scale: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD }}>
    <Eyebrow label="06 — THE SCALE" />
    <Rule />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr 1fr',
        gridTemplateRows: '220px 220px',
        gap: 20,
        marginTop: 24,
      }}
    >
      <BentoTile col="1 / 2" row="1 / 3" big>
        <CountStat target={13000} suffix=" tonnes" label="of waste generated daily" size={112} />
      </BentoTile>
      <BentoTile col="2 / 3" row="1 / 2">
        <CountStat target={5.46} decimals={2} suffix="M tonnes" label="every year" size={64} />
      </BentoTile>
      <BentoTile col="3 / 4" row="1 / 2">
        <CountStat target={23} suffix="M residents" label="in Lagos State" size={64} />
      </BentoTile>
      <BentoTile col="2 / 4" row="2 / 3">
        <CountStat target={420} prefix="≈" suffix=" PSP operators" label="serving the state" size={56} />
      </BentoTile>
    </div>
    <div
      style={{
        position: 'absolute',
        left: PAD,
        right: PAD,
        bottom: 108,
        background: cream,
        border: `1px solid ${line}`,
        borderRadius: 16,
        padding: '22px 28px',
        fontSize: 26,
      }}
    >
      Independent analysis frames the gap as a{' '}
      <b style={{ color: '#B45309', borderBottom: '2px solid #B45309' }}>$400M problem</b> — and a{' '}
      <b style={{ color: teal, borderBottom: `2px solid ${teal}` }}>$2.5B circular-economy opportunity.</b>
      <span style={{ display: 'block', fontSize: 18, color: caption, marginTop: 10 }}>
        Source: LAWMA public disclosures, 2022–2025 (tonnage and resident figures per LAWMA MD statements, Premium Times, Vanguard). Phase 1 delivers the first LCDA-by-LCDA breakdown across all 57 LCDAs.
      </span>
    </div>
    <ContentFooter />
  </div>
);

// ─── 03 — The problem (pull-quote list) ───────────────────────────────────────
const PainRow = ({ text }: { text: string }) => (
  <div style={{ borderBottom: `1px solid ${line}`, padding: '20px 0', fontSize: 36, color: ink, display: 'flex', alignItems: 'baseline', gap: 18 }}>
    <span style={{ color: sky, flex: 'none' }}>•</span>
    <span>{text}</span>
  </div>
);

const Problem: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD }}>
    <Eyebrow label="07 — THE PROBLEM" />
    <h2 style={{ fontFamily: display, fontSize: 68, fontWeight: 700, lineHeight: 1.15, margin: '0 0 56px 0', maxWidth: 1200 }}>
      Compliance is manual.
      <br />
      Visibility is zero.
    </h2>
    <div style={{ maxWidth: 1200 }}>
      <PainRow text="Bills are manually handed to residents" />
      <PainRow text="Payments have no instant confirmation trail" />
      <PainRow text="Missed pickups, waste burning and public waste dumping go unreported" />
      <PainRow text="Recycling participation is unmeasured" />
    </div>
    <p style={{ fontSize: 26, color: caption, marginTop: 48, maxWidth: 1100 }}>
      The majority of Lagos residents carry a smartphone and a mobile wallet. The connection to LAWMA doesn't exist
      yet.
    </p>
    <ContentFooter />
  </div>
);

// ─── 04 — The answer ───────────────────────────────────────────────────────────
const TheAnswer: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD, display: 'flex', alignItems: 'center' }}>
    <div style={{ flex: '0 0 720px' }}>
      <Eyebrow label="08 — THE ANSWER" />
      <Rule />
      <p style={{ fontSize: 26, color: caption, marginBottom: 20 }}>This is what closing that gap looks like.</p>
      <h2 style={{ fontFamily: display, fontSize: 60, fontWeight: 700, lineHeight: 1.2, margin: '0 0 28px 0' }}>
        The LAWMA Resident App (MVP) — built, deployed, live.
      </h2>
      <p style={{ fontSize: 32, color: caption, lineHeight: 1.5, marginBottom: 32 }}>
        A progressive web application on Android, iOS, and desktop — no app store download required.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 12, height: 12, borderRadius: 999, background: green }} />
        <span style={{ fontSize: 26, color: green, fontWeight: 700 }}>Live · MVP deployed</span>
      </div>
    </div>
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', ...revealStyle(150) }}>
      <StillPreview src={stillDashboard} height={840} />
    </div>
    <ContentFooter />
  </div>
);

// ─── 05 — A resident's month ───────────────────────────────────────────────────
const JourneyStep = ({ n, label, still }: { n: number; label: string; still: string }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
    <div style={revealStyle(n * 100)}>
      <StillPreview src={still} height={420} />
    </div>
    <div style={{ fontFamily: mono, fontSize: 28, color: teal, fontWeight: 700, marginTop: 20, ...numeralStyle(28) }}>{n}</div>
    <div style={{ fontSize: 21, lineHeight: 1.35, color: ink, marginTop: 8, maxWidth: 270 }}>{label}</div>
  </div>
);

const ResidentsMonth: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD }}>
    <Eyebrow label="09 — THE JOURNEY" />
    <h2 style={{ fontFamily: display, fontSize: 60, fontWeight: 700, margin: '0 0 56px 0' }}>A resident's month.</h2>
    <div style={{ display: 'flex', gap: 40 }}>
      <JourneyStep n={1} label="Gets a pickup reminder" still={stillDashboard} />
      <JourneyStep n={2} label="Scans waste with AI for recycling guidance" still={stillScanAiRecycle} />
      <JourneyStep n={3} label="Tracks pickup progress on the in-app map" still={stillTrackPickup} />
      <JourneyStep n={4} label="Orders and pays for a smart bin" still={stillSmartBinOrder} />
    </div>
    <ContentFooter />
  </div>
);

// ─── 06 — A resident's complaint ───────────────────────────────────────────────
const ResidentsComplaint: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD }}>
    <Eyebrow label="10 — THE JOURNEY" />
    <h2 style={{ fontFamily: display, fontSize: 60, fontWeight: 700, margin: '0 0 56px 0' }}>A resident's complaint.</h2>
    <div style={{ display: 'flex', gap: 40 }}>
      <JourneyStep n={1} label="Files a report with photo evidence and a map location" still={stillFileReport} />
      <JourneyStep n={2} label="Tracks resolution status in real time" still={stillTrackStatus} />
      <JourneyStep n={3} label="Checks status — resolved" still={stillNotificationResolved} />
      <JourneyStep n={4} label="Notifications for pickup days, environmental sanitation, orders and payments." still={stillPaymentConfirmed} />
    </div>
    <ContentFooter />
  </div>
);

// ─── 07 — Where this goes next ─────────────────────────────────────────────────
// Clean grid-with-dividers card style — no colored top band, no per-cell
// border/shadow. Cells share hairlines the way a table's cells do; only the
// outer group gets a border + radius.
const FUTURE_FEATURES = [
  { title: 'Native mobile apps', sub: 'iOS and Android App Store releases with push notifications' },
  { title: 'Voice & USSD access', sub: 'Feature-phone residents can pay bills and report issues via USSD — no smartphone required' },
  { title: 'Full household history', sub: 'Every pickup, payment, and report for your address, in one place' },
  { title: 'Resident rewards marketplace', sub: 'Recycling points redeemable for airtime and LAWMA services' },
  { title: 'Multi-language support', sub: 'Yoruba, Igbo, Hausa, and Pidgin interfaces' },
  { title: 'A model other states can license', sub: "States that consult LAWMA to build their own platform pay Lagos a royalty" },
];

const FutureCapabilities: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD }}>
    <Eyebrow label="13 — WHERE THIS GOES NEXT" />
    <h2 style={{ fontFamily: display, fontSize: 60, fontWeight: 700, margin: '0 0 20px 0' }}>Built to grow far past this.</h2>
    <p style={{ fontSize: 28, color: caption, maxWidth: 1200, margin: '0 0 40px 0' }}>
      This is the foundation. Here's what the platform becomes from there.
    </p>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        border: `1px solid ${line}`,
        borderRadius: 16,
        overflow: 'hidden',
        background: cream,
      }}
    >
      {FUTURE_FEATURES.map((f, i) => (
        <div
          key={f.title}
          style={{
            padding: '32px 34px',
            borderRight: i % 3 !== 2 ? `1px solid ${line}` : 'none',
            borderBottom: i < 3 ? `1px solid ${line}` : 'none',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: navy, marginBottom: 10 }}>{f.title}</div>
          <div style={{ fontSize: 21, color: caption, lineHeight: 1.45 }}>{f.sub}</div>
        </div>
      ))}
    </div>
    <div style={{ background: `${teal}1A`, border: `1px solid ${teal}`, borderRadius: 12, padding: '16px 24px', marginTop: 20, fontSize: 22, color: navy, lineHeight: 1.55 }}>
      <b>Phase 3 adoption projection:</b> At 49% of Lagos's 23M residents on the platform, LAWMA gains the first real-time, LCDA-by-LCDA waste-intelligence dataset Lagos has ever had — actionable for circular-economy research, site decongestion planning, and scientific partnerships. Every state that replicates the model pays Lagos a royalty.
    </div>
    <ContentFooter />
  </div>
);

// ─── 08 — Validation (equal-weight bento) ─────────────────────────────────────
const ProofTile = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: cream,
      border: `1px solid ${line}`,
      borderRadius: 16,
      padding: '30px 32px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    {children}
  </div>
);

const PercentProof = ({ target, label }: { target: number; label: string }) => {
  const value = useCountUp(target, target % 1 !== 0 ? 900 : 900);
  const formatted = target % 1 !== 0 ? value.toFixed(1) : Math.round(value);
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 80, fontWeight: 700, color: teal, lineHeight: 1, ...numeralStyle(80) }}>
        {formatted}%
      </div>
      <div style={{ fontSize: 24, color: ink, marginTop: 10 }}>{label}</div>
      <FillLine percent={target} />
    </div>
  );
};

const PlainProof = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div style={{ fontFamily: mono, fontSize: 88, fontWeight: 700, color: navy, lineHeight: 1, ...numeralStyle(88) }}>
      {value}
    </div>
    <div style={{ fontSize: 24, color: ink, marginTop: 10 }}>{label}</div>
  </div>
);

const Validation: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD }}>
    <Eyebrow label="12 — VALIDATION" />
    <h2 style={{ fontFamily: display, fontSize: 52, fontWeight: 700, margin: '0 0 12px 0' }}>
      Internal validation cohort — Surulere LGA
    </h2>
    <p style={{ fontSize: 26, color: caption, maxWidth: 1200, margin: '0 0 32px 0' }}>
      We ran a 4-week live test with 20 Surulere households in June 2026 — real bills, real payments, real complaints. Here's what happened.
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '190px 190px', gap: 24, maxWidth: 1560 }}>
      <ProofTile>
        <PercentProof target={88} label="bill payment compliance rate (test mode)" />
      </ProofTile>
      <ProofTile>
        <PlainProof value="45s" label="average time-to-pay" />
      </ProofTile>
      <ProofTile>
        <PlainProof value="11" label="complaints submitted in-app" />
      </ProofTile>
      <ProofTile>
        <PercentProof target={99.2} label="OTP delivery success" />
      </ProofTile>
    </div>
    <p style={{ position: 'absolute', left: PAD, right: PAD, bottom: 108, fontSize: 24, color: caption, borderTop: `1px solid ${line}`, paddingTop: 20 }}>
      Internal validation cohort, June 2026, N=20, 4 weeks. A statistically valid pilot, to LAWMA's specification, is
      proposed as part of Phase 1.
    </p>
    <ContentFooter />
  </div>
);

// ─── 09 — Integrations ─────────────────────────────────────────────────────────
const IntegrationRow = ({ name, desc }: { name: string; desc: string }) => (
  <div style={{ display: 'flex', gap: 48, borderBottom: `1px solid ${line}`, padding: '18px 0', alignItems: 'baseline' }}>
    <div style={{ width: 300, flexShrink: 0, fontSize: 28, fontWeight: 700, color: sky }}>{name}</div>
    <div style={{ fontSize: 28, color: ink }}>{desc}</div>
  </div>
);

const Integrations: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD }}>
    <Eyebrow label="14 — INTEGRATES, NOT REPLACES" />
    <h2 style={{ fontFamily: display, fontSize: 60, fontWeight: 700, margin: '0 0 56px 0' }}>
      Integrates with what LAWMA already runs.
    </h2>
    <div style={{ maxWidth: 1600 }}>
      <IntegrationRow name="PAKAM" desc="Recyclables marketplace — we consume its data and route traffic to it, not replace it" />
      <IntegrationRow name="LawmaPay" desc="Payment cutover planned on contract; Flutterwave is interim" />
      <IntegrationRow name="LAWMA GIS" desc="We consume existing feeds, complementary not competing" />
      <IntegrationRow name="'Know Your PSP'" desc="Delivered into every resident's pocket" />
      <IntegrationRow name="SMS / WhatsApp gateways" desc="Our notification layer is pluggable" />
      <IntegrationRow name="LAWMA Academy" desc="Extends the Academy's school outreach and internship curriculum with always-on, in-app recycling education" />
    </div>
    <ContentFooter />
  </div>
);

// ─── 10 — Already built ────────────────────────────────────────────────────────
const FeatureLine = ({ text }: { text: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${line}`, padding: '14px 0' }}>
    <span style={{ width: 8, height: 8, borderRadius: 999, background: teal, flexShrink: 0 }} />
    <span style={{ fontSize: 28, color: ink }}>{text}</span>
  </div>
);

const AlreadyBuilt: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD, display: 'flex', flexDirection: 'column' }}>
    <Eyebrow label="11 — SHIPPED" />
    <h2 style={{ fontFamily: display, fontSize: 56, fontWeight: 700, margin: '0 0 56px 0' }}>Already built and deployed.</h2>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', width: '100%', gap: 64 }}>
        <div style={{ flex: 1 }}>
          <FeatureLine text="Home dashboard" />
          <FeatureLine text="OTP-first phone verification" />
          <FeatureLine text="Bill payment with PDF receipts" />
          <FeatureLine text="Pickup schedule + live progress map*" />
        </div>
        <div style={{ width: 1, background: line }} />
        <div style={{ flex: 1 }}>
          <FeatureLine text="GPS-pinned complaint reporting" />
          <FeatureLine text="Smart bin ordering and payment" />
          <FeatureLine text="AI recycling analysis" />
          <FeatureLine text="Notifications + WhatsApp support" />
        </div>
      </div>
    </div>
    <p style={{ fontSize: 20, color: caption }}>* pickup map simulated in MVP; live GPS tracking ships in Phase 2</p>
    <ContentFooter />
  </div>
);

// ─── 11 — The admin platform ───────────────────────────────────────────────────
const CapabilityLine = ({ text }: { text: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${line}`, padding: '16px 0' }}>
    <span style={{ width: 8, height: 8, borderRadius: 999, background: teal, flexShrink: 0 }} />
    <span style={{ fontSize: 25, color: ink }}>{text}</span>
  </div>
);

const AdminPlatform: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD, display: 'flex', flexDirection: 'column' }}>
    <Eyebrow label="15 — THE ADMIN PLATFORM" />
    <h2 style={{ fontFamily: display, fontSize: 44, fontWeight: 700, lineHeight: 1.2, margin: '0 0 16px 0' }}>
      The command centre behind every resident interaction.
    </h2>
    <p style={{ fontSize: 22, color: caption, lineHeight: 1.5, maxWidth: 1200, margin: '0 0 28px 0' }}>
      Every payment, complaint, and bin order a resident makes becomes a record LAWMA's own staff can see, act on,
      and report against — one platform for control-room, PSP, and field operations.
    </p>
    <div style={{ flex: 1, display: 'flex', gap: 32, minHeight: 0, alignItems: 'stretch' }}>
      <div style={{ flex: 2 }}>
        <CapabilityLine text="Role-based access for admins, PSPs, and control-room staff" />
        <CapabilityLine text="Billing reconciliation and revenue reporting across every LCDA" />
        <CapabilityLine text="PSP and zone management" />
        <CapabilityLine text="Complaint queues with SLA countdowns" />
        <CapabilityLine text="Live operations map of every driver and route" />
        <CapabilityLine text="LawmaPay integration on contract" />
      </div>
      <div style={{ flex: 3, display: 'flex', alignItems: 'stretch', ...revealStyle(150) }}>
        <AdminStill src={adminDashboardMockup} fit="fill" crop="contain" />
      </div>
    </div>
    <p style={{ fontSize: 20, color: caption, marginTop: 16 }}>* working design for Phase 2 — not yet built</p>
    <ContentFooter />
  </div>
);

// ─── 12 — The ask ──────────────────────────────────────────────────────────────
// The ₦ Unicode glyph (U+20A6) renders with a diagonal strike-through in every
// font available in this environment (confirmed across font-family swaps) —
// draw it as a tiny inline SVG instead so it's pixel-guaranteed regardless of
// font fallback, matching the double-horizontal-bar form used on the signed
// pitch documents.
const NairaGlyph = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size * 0.62}
    height={size * 0.8}
    viewBox="0 0 34 44"
    style={{ display: 'inline-block', verticalAlign: 'baseline', position: 'relative', top: size * 0.06, marginRight: size * 0.08 }}
  >
    <path d="M4 2 L4 42 M30 2 L30 42 M4 2 L30 42" stroke={color} strokeWidth={4.2} fill="none" strokeLinecap="square" />
    <path d="M0 15 L34 15 M0 29 L34 29" stroke={color} strokeWidth={4.2} />
  </svg>
);

const Money = ({ value, size, color = teal }: { value: string; size: number; color?: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
    <NairaGlyph size={size} color={color} />
    <span style={{ fontFamily: mono, fontSize: size, fontWeight: 700, color, ...numeralStyle(size) }}>{value.slice(1)}</span>
  </span>
);

// Fixed card height + justify-content: space-between so the amount always
// anchors to the bottom with breathing room above it, regardless of how long
// the title/desc text runs — same composition on all three cards, not just
// whichever one happens to have the longest text.
const PriceColumn = ({ phase, title, desc, price, highlight = false }: { phase: string; title: string; desc: string; price: string; highlight?: boolean }) => (
  <div
    style={{
      flex: 1,
      minHeight: 300,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: `1px solid ${highlight ? teal : line}`,
      borderRadius: 12,
      padding: '24px 28px',
      background: cream,
    }}
  >
    <div>
      <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: '0.1em', color: sky, fontWeight: 700, marginBottom: 8 }}>
        {phase}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: navy, marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 20, color: caption, lineHeight: 1.5 }}>{desc}</div>
    </div>
    <div id={`price-${phase.toLowerCase().replace(/\s/g, '-')}`} style={{ fontSize: 36 }}>
      <Money value={price} size={36} />
    </div>
  </div>
);

// Segmented proportional Fill Line — the one place the signature device
// represents real money, not a percentage label: each segment's width IS
// that phase's literal share of the ₦260M ask. Legend reads as cumulative
// ranges along the bar (where each phase starts and ends), not standalone
// percentages — easier to scan against the bar itself at a glance.
const PHASE_SHARE = { p1: (100 / 260) * 100, p2: (100 / 260) * 100, p3: (60 / 260) * 100 };
const PHASE_RANGES = [
  { label: 'Phase 1', range: '0–38%', color: sky },
  { label: 'Phase 2', range: '38–77%', color: teal },
  { label: 'Phase 3', range: '77–100%', color: navy },
];
const AskFillLine = () => {
  const progress = useCountUp(1, 900);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', background: line }}>
        <div style={{ width: `${PHASE_SHARE.p1 * progress}%`, background: sky }} />
        <div style={{ width: `${PHASE_SHARE.p2 * progress}%`, background: teal }} />
        <div style={{ width: `${PHASE_SHARE.p3 * progress}%`, background: navy }} />
      </div>
      <div style={{ display: 'flex', gap: 28, marginTop: 12, fontSize: 18, color: caption }}>
        {PHASE_RANGES.map((p) => (
          <span key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, display: 'inline-block', flexShrink: 0 }} />
            {p.label} — {p.range} of total
          </span>
        ))}
      </div>
    </div>
  );
};

const TheAsk: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD }}>
    <Eyebrow label="17 — THE ASK" />
    <h2 style={{ fontFamily: display, fontSize: 56, fontWeight: 700, margin: '0 0 32px 0' }}>
      Three phases. <Money value="₦260M" size={56} color={ink} /> Year 1.
    </h2>
    <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
      <PriceColumn phase="PHASE 1" title="Research & Report" desc="3-month engagement — visits to all 57 LCDAs, waste data audit 2022–2026, formal research report + Lagos Waste Index compilation." price="₦100,000,000" />
      <PriceColumn phase="PHASE 2" title="Product Design, Implementation & Development" desc="Full resident app rollout + six-stage admin platform, built to Phase 1 research findings. Includes VAPT security audit." price="₦100,000,000" highlight />
      <PriceColumn phase="PHASE 3" title="Training, Staffing & Maintenance" desc="Training curriculum, control-centre staffing support, hosting + retainer, marketing, and annual security audit." price="₦60,000,000/yr" />
    </div>
    <AskFillLine />
    <div
      id="price-total"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        background: navy,
        color: cream,
        borderRadius: 12,
        padding: '18px 28px',
        marginBottom: 14,
      }}
    >
      <span style={{ fontSize: 26 }}>Year 1 Total</span>
      <span style={{ fontSize: 40 }}>
        <Money value="₦260,000,000" size={40} />
      </span>
      <span style={{ fontSize: 20, color: '#94A3B8' }}>Each phase paid in full before the next begins</span>
    </div>
    <div style={{ background: `${teal}26`, borderLeft: `4px solid ${teal}`, padding: '16px 24px', fontSize: 22, color: navy }}>
      Designed to be licensed, not just used — if other states adopt the platform style, Lagos earns a royalty.
    </div>
    <ContentFooter />
  </div>
);

// ─── 12 — Admin platform timeline ──────────────────────────────────────────────
// Same clean grid-with-dividers style as the slide 7 feature grid — no top
// band, hairline dividers between cells instead of per-card borders.
const TIMELINE_STEPS = [
  {
    label: 'Research begins',
    deliverable:
      '3-month engagement — all 57 LCDAs visited, waste data audit 2022–2026, LAWMA staff interviews, and first compilation of the Lagos Waste Index.',
  },
  { label: 'Research report', deliverable: "Phase 1 findings delivered — LCDA-by-LCDA compliance gaps, PSP zone failures, billing reconciliation issues. Phase 2 builds to these findings, not a generic spec." },
  { label: 'Platform build', deliverable: 'Six-stage admin platform over 16 weeks — role-based access control (RBAC) by staff tier and zone; billing; PSP management; complaints; and a live operations map (ops map) tracking every driver and route in real time.' },
  { label: 'Training + go-live', deliverable: 'LAWMA staff trained, control room live, LawmaPay cutover complete' },
];

const AdminPlatformTimeline: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD, display: 'flex', flexDirection: 'column' }}>
    <Eyebrow label="16 — ADMIN PLATFORM TIMELINE" />
    <h2 style={{ fontFamily: display, fontSize: 44, fontWeight: 700, margin: '0 0 12px 0' }}>16 weeks from signature to a running control room.</h2>
    <p style={{ fontSize: 20, color: caption, lineHeight: 1.5, maxWidth: 1200, margin: '0 0 24px 0' }}>
      Research and the admin platform build run as one continuous engagement — every deliverable below lands before
      LAWMA staff are trained and the control room goes live.
    </p>
    <div style={{ flex: 1, display: 'flex', gap: 32, minHeight: 0, alignItems: 'stretch' }}>
      <div
        style={{
          flex: 2,
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          border: `1px solid ${line}`,
          borderRadius: 16,
          overflow: 'hidden',
          background: cream,
        }}
      >
        {TIMELINE_STEPS.map((s, i) => (
          <div key={s.label} style={{ padding: '24px 28px' }}>
            <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: teal, marginBottom: 10, ...numeralStyle(28) }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: navy, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 17, color: caption, lineHeight: 1.45 }}>{s.deliverable}</div>
          </div>
        ))}
        {/* Inset crosshair dividers — don't run to the parent border */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 24,
            bottom: 24,
            width: 1,
            background: line,
            transform: 'translateX(-0.5px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 28,
            right: 28,
            height: 1,
            background: line,
            transform: 'translateY(-0.5px)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div style={{ flex: 3, display: 'flex', alignItems: 'stretch', ...revealStyle(150) }}>
        <AdminStill src={adminPickupSchedulesMockup} fit="fill" crop="contain" />
      </div>
    </div>
    <p style={{ fontSize: 20, color: caption, marginTop: 16 }}>* working design for Phase 2 — not yet built</p>
    <ContentFooter />
  </div>
);

// ─── 02 — Who we are ───────────────────────────────────────────────────────────
const FounderCard = ({ name }: { name: string }) => (
  <div style={{ flex: 1, background: cream, border: `1px solid ${line}`, borderRadius: 12, padding: '28px 32px' }}>
    <div style={{ fontSize: 32, fontWeight: 700, color: navy }}>{name}</div>
    <div style={{ fontSize: 22, color: sky, marginTop: 4 }}>Co-Founder</div>
  </div>
);

const WhoWeAre: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD }}>
    <Eyebrow label="02 — WHO WE ARE" />
    <Rule />
    <img src={mark} alt="" style={{ height: 44, marginBottom: 28 }} />
    <h2 style={{ fontFamily: display, fontSize: 60, fontWeight: 700, margin: '0 0 16px 0', color: teal }}>
      LinqLabs — Connected by Design.
    </h2>
    <p style={{ fontSize: 32, color: caption, marginBottom: 16 }}>
      A Lagos-based product studio. We design web and mobile apps that solve users' pain points.
    </p>
    <p style={{ fontSize: 26, color: caption, maxWidth: 1100, marginBottom: 48 }}>
      Our focus: civic and institutional platforms — digital infrastructure built for the millions of Nigerians who have never been properly served by software before.
    </p>
    <div style={{ display: 'flex', gap: 24, maxWidth: 1200 }}>
      <FounderCard name="Lawal Fawaz" />
      <FounderCard name="Lawal Fuad" />
    </div>
    <ContentFooter />
  </div>
);

// ─── 03 — What we do ───────────────────────────────────────────────────────────
const WhatWeDo: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow label="03 — WHAT WE DO" />
    <Rule />
    <h2 style={{ fontFamily: display, fontSize: 60, fontWeight: 700, margin: '0 0 24px 0', lineHeight: 1.15 }}>
      We build digital products institutions can actually run.
    </h2>
    <p style={{ fontSize: 28, color: caption, lineHeight: 1.55, maxWidth: 1200, marginBottom: 48 }}>
      From brief to live deployment — strategy, design, and engineering in one team. No hand-offs, no translation loss between agencies.
    </p>
    <div style={{ maxWidth: 1400 }}>
      {[
        { n: '01', label: 'Research & strategy', sub: 'We start by understanding the institution — its staff, its data, its operational gaps. The product is built on that, not on assumptions.' },
        { n: '02', label: 'Product design & UI/UX', sub: 'From information architecture to pixel-perfect interfaces — designed for the people who will actually use it, not just the people commissioning it.' },
        { n: '03', label: 'Engineering & deployment', sub: 'End-to-end: frontend, backend, infrastructure, integrations, and security audit. One team, one accountability chain.' },
      ].map((item) => (
        <div key={item.n} style={{ display: 'flex', gap: 32, borderBottom: `1px solid ${line}`, padding: '20px 0', alignItems: 'flex-start' }}>
          <div style={{ fontFamily: mono, fontSize: 22, color: teal, fontWeight: 700, width: 44, flexShrink: 0, paddingTop: 3 }}>{item.n}</div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: navy, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 22, color: caption, lineHeight: 1.5 }}>{item.sub}</div>
          </div>
        </div>
      ))}
    </div>
    <ContentFooter />
  </div>
);

// ─── 04 — The offer ────────────────────────────────────────────────────────────
const TheOffer: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow label="04 — THE OFFER" />
    <Rule />
    <p style={{ fontFamily: display, fontSize: 44, fontWeight: 700, lineHeight: 1.35, maxWidth: 1440, margin: '0 0 52px 0' }}>
      We are offering Lagos State a resident-facing digital platform and a command centre — designed, built, and operated by LinqLabs — that gives LAWMA real-time visibility into waste compliance, payments, and field operations across all 57 LCDAs.
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, maxWidth: 1560 }}>
      {[
        { label: 'Revenue visibility', text: 'Every bill payment confirmed instantly. Compliance rates trackable per LCDA, per PSP, per street.' },
        { label: 'Operational intelligence', text: 'Pickup routes, complaint queues, and field-officer locations — in one control room, not scattered across spreadsheets and phone calls.' },
        { label: 'Lagos owns the model', text: "A platform built by Lagos, for Lagos — and licensed to every state that follows. LAWMA earns the royalty." },
      ].map((item) => (
        <div key={item.label} style={{ background: cream, border: `1px solid ${line}`, borderLeft: `4px solid ${teal}`, padding: '30px 32px' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: navy, marginBottom: 12 }}>{item.label}</div>
          <div style={{ fontSize: 22, color: caption, lineHeight: 1.55 }}>{item.text}</div>
        </div>
      ))}
    </div>
    <ContentFooter />
  </div>
);

// ─── 05 — Strategic thrusts ────────────────────────────────────────────────────
const THRUSTS = [
  {
    n: '01',
    title: 'Research baseline',
    sub: "LAWMA's aggregate tonnage is tracked and current. What doesn't exist yet is LCDA-by-LCDA compliance data. Phase 1 — 3 months across all 57 LCDAs — delivers the Lagos Waste Index: the first LCDA-level waste intelligence report Lagos has had since 2022. It belongs to you.",
  },
  {
    n: '02',
    title: 'Resident platform',
    sub: "Lagos has 23M residents. Over 15 million carry smartphones — yet no single channel ties billing, complaints, and pickups together. We built it.",
  },
  {
    n: '03',
    title: 'Admin command centre',
    sub: 'Every resident action generates a record. Right now that record goes nowhere. Your control room gains full visibility — payments, complaints, and pickups — across all 57 LCDAs.',
  },
  {
    n: '04',
    title: 'Data ownership + licensing',
    sub: 'This is a Lagos-built platform. Every state that replicates the model pays Lagos a royalty. You are not a pilot — you are the originator.',
  },
];

const StrategicThrusts: Page = () => (
  <div style={{ ...fill, background: offwhite, color: ink, position: 'relative', padding: PAD, display: 'flex', flexDirection: 'column' }}>
    <Eyebrow label="05 — STRATEGIC THRUST" />
    <h2 style={{ fontFamily: display, fontSize: 56, fontWeight: 700, margin: '0 0 10px 0' }}>
      Four reasons Lagos cannot afford to wait.
    </h2>
    <p style={{ fontSize: 26, color: caption, maxWidth: 1200, margin: '0 0 32px 0' }}>
      Each thrust names what LinqLabs delivers — and why LAWMA specifically needs it.
    </p>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 20, minHeight: 0 }}>
      {THRUSTS.map((t) => (
        <div
          key={t.n}
          style={{
            background: cream,
            border: `1px solid ${line}`,
            borderRadius: 16,
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: lawmaOrange }}>{t.n}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: navy }}>{t.title}</div>
          <div style={{ fontSize: 21, color: caption, lineHeight: 1.5 }}>{t.sub}</div>
        </div>
      ))}
    </div>
    <ContentFooter />
  </div>
);

// ─── 15 — Close (poster) ───────────────────────────────────────────────────────
const Close: Page = () => (
  <div
    style={{
      ...fill,
      background: nearWhite,
      color: ink,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: `0 ${PAD}px`,
    }}
  >
    <CornerMark pos="tl" />
    <CornerMark pos="tr" />
    <CornerMark pos="bl" />
    <CornerMark pos="br" />

    <div style={{ maxWidth: 1500 }}>
      <div style={{ width: 240, height: 8, background: ink, marginBottom: 8, ...revealStyle(0) }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 40, ...revealStyle(80) }}>
        <h1 style={{ fontFamily: display, fontSize: 96, fontWeight: 700, lineHeight: 1.12, margin: 0, color: brandOrange }}>
          Lagos built it first.
        </h1>
        <img src={lagosStateSeal} alt="" style={{ height: 140, width: 'auto', display: 'block' }} />
      </div>
      <h1
        style={{
          fontFamily: display,
          fontSize: 96,
          fontWeight: 700,
          lineHeight: 1.12,
          margin: '8px 0 0 0',
          color: cream,
          WebkitTextStroke: `1.5px ${ink}`,
          ...revealStyle(220),
        }}
      >
        Every state that follows pays Lagos.
      </h1>
      <p style={{ fontSize: 32, marginTop: 40, fontWeight: 700, ...revealStyle(380) }}>
        We are ready to begin Phase 1 immediately upon engagement.
      </p>
    </div>

    <div
      style={{
        position: 'absolute',
        left: PAD,
        right: PAD,
        bottom: 96,
        borderTop: `1px solid ${ink}`,
        paddingTop: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...revealStyle(460),
      }}
    >
      <img src={wordmark} alt="LinqLabs" style={{ height: 30 }} />
      <span style={{ fontSize: 22, fontWeight: 700 }}>Contact.linqlabs@gmail.com</span>
    </div>
  </div>
);

export const meta: SlideMeta = {
  title: 'LAWMA Resident App — Pitch Deck (Bright)',
  createdAt: '2026-07-03T19:55:51.951Z',
};

export default [
  Cover,           // 01
  WhoWeAre,        // 02
  WhatWeDo,        // 03
  TheOffer,        // 04
  StrategicThrusts,// 05
  Scale,           // 06
  Problem,         // 07
  TheAnswer,       // 08
  ResidentsMonth,  // 09
  ResidentsComplaint, // 10
  AlreadyBuilt,    // 11
  Validation,      // 12
  FutureCapabilities, // 13
  Integrations,    // 14
  AdminPlatform,   // 15
  AdminPlatformTimeline, // 16
  TheAsk,          // 17
  Close,           // 18
] satisfies Page[];
