'use client';

import { motion, useReducedMotion } from 'framer-motion';
import styles from './AuroraBackground.module.css';

/**
 * Ambient aurora-blob background. Two slow-drifting, heavily-blurred blobs
 * tinted with the primary token. Sits behind content at z-index 0 inside any
 * `position: relative; overflow: hidden` container.
 *
 * Originated on the landing hero; shared across auth/onboarding surfaces.
 * Returns null when the user prefers reduced motion.
 */
export function AuroraBackground() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div className={styles.auroraContainer} aria-hidden="true">
      <motion.div
        className={styles.auroraBlob1}
        animate={{ x: [0, 50, -25, 0], y: [0, -30, 18, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={styles.auroraBlob2}
        animate={{ x: [0, -40, 28, 0], y: [0, 24, -30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
