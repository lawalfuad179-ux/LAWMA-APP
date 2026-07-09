import styles from './TopBar.module.css';

type Props = {
  title: string;
  subtitle?: string;
};

export function TopBar({ title, subtitle }: Props) {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.titleWrap}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        <div className={styles.lga}>
          <span className={styles.lgaLabel}>LGA</span>
          <span className={styles.lgaName}>Surulere</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input placeholder="Search residents, complaints, bins…" />
          <kbd className={styles.kbd}>⌘K</kbd>
        </div>

        <button className={styles.iconBtn} aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span className={styles.dot} />
        </button>

        <div className={styles.divider} />

        <div className={styles.operator}>
          <div className={styles.avatar}>AB</div>
          <div className={styles.opText}>
            <span className={styles.opName}>Amourisa Bakare</span>
            <span className={styles.opRole}>Control Center Lead</span>
          </div>
        </div>
      </div>
    </header>
  );
}
