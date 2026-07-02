'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lock, ChevronRight, X } from 'lucide-react';

import { PasswordSection } from './PasswordSection';
import pageStyles from '@/app/(public)/(app)/profile/page.module.css';
import styles from './PasswordQuickAccess.module.css';

type Props = {
  hasPassword: boolean;
};

export function PasswordQuickAccess({ hasPassword }: Props) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <>
      <button type="button" className={pageStyles.quickLink} onClick={() => setOpen(true)}>
        <div className={pageStyles.quickLinkIcon}>
          <Lock size={18} strokeWidth={1.5} />
        </div>
        <div className={pageStyles.quickLinkBody}>
          <span className={pageStyles.quickLinkLabel}>
            {hasPassword ? 'Change Password' : 'Create Password'}
          </span>
          <span className={pageStyles.quickLinkDesc}>
            {hasPassword ? 'Update your password to keep your account secure' : 'Sign in without waiting for a code'}
          </span>
        </div>
        <ChevronRight size={16} className={pageStyles.quickLinkChevron} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-label={hasPassword ? 'Change Password' : 'Create Password'}
              initial={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.header}>
                <div className={styles.headerTitle}>
                  <Lock size={16} strokeWidth={1.5} />
                  <span>{hasPassword ? 'Change Password' : 'Create Password'}</span>
                </div>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setOpen(false)}
                  aria-label="Cancel"
                >
                  <X size={14} strokeWidth={2} />
                  <span>Cancel</span>
                </button>
              </div>
              <PasswordSection hasPassword={hasPassword} onSuccess={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
