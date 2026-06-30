'use client';

import { motion, useReducedMotion } from 'framer-motion';

type RevealProps = {
  children: React.ReactNode;
  /** Stagger offset in seconds. */
  delay?: number;
  /** Vertical travel distance in px (default 14). */
  y?: number;
  className?: string;
};

/**
 * Scroll-triggered fade + rise. A client component that accepts server-rendered
 * children, so it can wrap content inside React Server Component pages without
 * forcing the whole page to `'use client'`.
 *
 * Animates once when it enters the viewport. Collapses to a no-op (static,
 * fully visible) when the user prefers reduced motion.
 */
export function Reveal({ children, delay = 0, y = 14, className }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px 0px' }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
