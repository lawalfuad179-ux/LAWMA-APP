import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import styles from './LandingHeader.module.css';

export function LandingHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoLink}>
        <Image src="/logo-light.png" alt="LAWMA" width={100} height={24} className={styles.logoLight} style={{ width: 'auto', height: 24 }} />
        <Image src="/logo-dark.png"  alt="LAWMA" width={100} height={24} className={styles.logoDark} style={{ width: 'auto', height: 24 }} />
      </Link>
      <nav className={styles.nav}>
        <Link href="/login" className={styles.btnPrimary}>Get started</Link>
        <Link href="/login?mode=signin" className={styles.btnGhost}>Sign in</Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
