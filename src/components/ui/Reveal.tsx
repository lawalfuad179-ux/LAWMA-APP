'use client';

import { motion, useReducedMotion } from 'framer-motion';

type RevealProps = {
  children: React.ReactNode;
  /** Stagger offset in seconds. */
  delay?: number;
  /** Vertical travel distance in px (default 14). */
  y?: number;
  className?: string;
  /**
   * Fire immediately on mount instead of waiting for the element to scroll
   * into view. Use this for anything above the fold — `whileInView` relies
   * on IntersectionObserver, which can intermittently miss firing for
   * content that's already in the viewport on first paint (a known Framer
   * Motion timing gotcha, worse with any hydration-time layout shift). The
   * effect looks the same either way; only the trigger differs.
   */
  immediate?: boolean;
};

/**
 * Fade + rise entrance. A client component that accepts server-rendered
 * children, so it can wrap content inside React Server Component pages without
 * forcing the whole page to `'use client'`.
 *
 * By default, animates once when it enters the viewport (for below-the-fold
 * content). Pass `immediate` for above-the-fold content that should animate
 * on mount instead. Collapses to a no-op (static, fully visible) when the
 * user prefers reduced motion.
 */
export function Reveal({ children, delay = 0, y = 14, className, immediate = false }: RevealProps) {
  const reduced = useReducedMotion();
  const triggerProp = immediate
    ? { animate: { opacity: 1, y: 0 } }
    : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px 0px' } };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      {...triggerProp}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
