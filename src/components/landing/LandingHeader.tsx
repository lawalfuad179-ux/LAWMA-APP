import Link from 'next/link';
import Image from 'next/image';
import styles from './LandingHeader.module.css';

export function LandingHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoLink}>
        <Image src="/logo-light.png" alt="LAWMA" width={100} height={24} className={styles.logoLight} />
        <Image src="/logo-dark.png"  alt="LAWMA" width={100} height={24} className={styles.logoDark} />
      </Link>
      <nav className={styles.nav}>
        <Link href="/login?mode=signin" className={styles.btnGhost}>Sign in</Link>
        <Link href="/login" className={styles.btnPrimary}>Get started</Link>
      </nav>
    </header>
  );
}
