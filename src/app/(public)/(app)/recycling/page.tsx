import { Leaf, Home, Store, Building2, Ban, ScanLine, Camera, Recycle } from 'lucide-react';

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
      {/* Scan & Analyze section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>
            <ScanLine size={15} strokeWidth={1.5} />
            <span>Scan &amp; Analyze</span>
          </div>
        </div>
        <div className={styles.rewardCards}>
          <Card className={styles.rewardCard}>
            <div className={styles.rewardHeader}>
              <div className={styles.rewardIcon}>
                <Camera size={22} strokeWidth={1.5} />
              </div>
              <h3 className={styles.rewardTitle}>How to scan</h3>
            </div>
            <p className={styles.rewardDesc}>
              Go to the <strong>Scan &amp; Analyze</strong> tab and point your camera at any waste item. Tap <em>Analyze with AI</em> and our model will classify every item in the photo within seconds.
            </p>
          </Card>
          <Card className={styles.rewardCard}>
            <div className={styles.rewardHeader}>
              <div className={styles.rewardIcon}>
                <Recycle size={22} strokeWidth={1.5} />
              </div>
              <h3 className={styles.rewardTitle}>What the AI detects</h3>
            </div>
            <p className={styles.rewardDesc}>
              The AI identifies <strong>plastics, paper, glass, metal, organic waste, and e-waste</strong>, telling you which items are recyclable and the safest way to dispose of each.
            </p>
          </Card>
        </div>
      </div>

      {/* Recycling tips by category */}
      {categories.map((category) => (
        <div key={category} className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>
              {CATEGORY_ICONS[category] || <Leaf size={15} strokeWidth={1.5} />}
              <span>{category}</span>
            </div>
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
      </div>

      <RecycleTabs guideContent={<GuideContent />} />
    </div>
  );
}
