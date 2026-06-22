'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

import styles from './InstallPrompt.module.css';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'lawma-install-dismissed';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    // Already installed (display-mode: standalone) → don't prompt.
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }

  if (!visible || !deferred) return null;

  return (
    <div className={styles.root} role="dialog" aria-label="Install LAWMA app">
      <div className={styles.iconWrap}>
        <Download size={18} strokeWidth={1.8} />
      </div>
      <div className={styles.body}>
        <p className={styles.title}>Install LAWMA</p>
        <p className={styles.desc}>Add to your home screen for faster access to bills and schedules.</p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.installBtn} onClick={install}>Install</button>
        <button type="button" className={styles.dismissBtn} onClick={dismiss} aria-label="Dismiss">
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
