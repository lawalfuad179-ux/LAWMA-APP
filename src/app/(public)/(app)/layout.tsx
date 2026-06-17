import { Navbar } from '@/components/ui/Navbar';
import { AppHeader } from '@/components/ui/AppHeader';
import styles from './layout.module.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <AppHeader />
      <main className={styles.main}>{children}</main>
      <Navbar />
    </div>
  );
}
