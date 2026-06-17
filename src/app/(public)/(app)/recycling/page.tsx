import { Leaf, Home, Store, Building2, Ban } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { RecycleTabs } from '@/components/recycling/RecycleTabs';
import { RECYCLING_TIPS } from '@/constants';
import styles from './page.module.css';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Home: <Home size={18} strokeWidth={1.5} />,
  Markets: <Store size={18} strokeWidth={1.5} />,
  Businesses: <Building2 size={18} strokeWidth={1.5} />,
  'Illegal Dumping': <Ban size={18} strokeWidth={1.5} />,
};

const categories = [...new Set(RECYCLING_TIPS.map((t) => t.category))];

function GuideContent() {
  return (
    <div className={styles.guideContent}>
      {categories.map((category) => (
        <div key={category} className={styles.section}>
          <div className={styles.sectionHeader}>
            {CATEGORY_ICONS[category] || <Leaf size={16} strokeWidth={1.5} />}
            <span className={styles.sectionTitle}>{category}</span>
          </div>
          <div className={styles.grid}>
            {RECYCLING_TIPS.filter((t) => t.category === category).map((tip) => (
              <Card key={tip.title} className={styles.card}>
                <span className={styles.cardCategory}>{tip.category}</span>
                <h3 className={styles.cardTitle}>{tip.title}</h3>
                <p className={styles.cardDesc}>{tip.description}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecyclingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Recycling</h1>
        <p className={styles.subtitle}>Learn, scan your waste & earn bill discounts</p>
      </div>

      <RecycleTabs guideContent={<GuideContent />} />
    </div>
  );
}
