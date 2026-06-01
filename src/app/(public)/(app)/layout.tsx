import { Navbar } from '@/components/ui/Navbar';
import styles from './layout.module.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>{children}</main>
      <Navbar />
    </div>
  );
}
