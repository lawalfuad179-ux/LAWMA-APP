import { Leaf, Home, Store, Building2, Ban, ScanLine, Gift, Coins, BadgePercent } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { RecycleTabs } from '@/components/recycling/RecycleTabs';
import { RecyclingPageHeader } from '@/components/recycling/RecyclingPageHeader';
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
      {/* Scan & Earn section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>
            <ScanLine size={15} strokeWidth={1.5} />
            <span>Scan &amp; Earn Rewards</span>
          </div>
        </div>
        <div className={styles.rewardCards}>
          <Card className={styles.rewardCard}>
            <div className={styles.rewardHeader}>
              <div className={styles.rewardIcon}>
                <ScanLine size={22} strokeWidth={1.5} />
              </div>
              <h3 className={styles.rewardTitle}>How scanning works</h3>
            </div>
            <p className={styles.rewardDesc}>
              Go to the Scan &amp; Earn tab and point your camera at any recyclable item. Our AI identifies the material and awards you points instantly. The more items you scan, the more you earn.
            </p>
          </Card>
          <Card className={styles.rewardCard}>
            <div className={styles.rewardHeader}>
              <div className={styles.rewardIcon}>
                <Coins size={22} strokeWidth={1.5} />
              </div>
              <h3 className={styles.rewardTitle}>Points per scan</h3>
            </div>
            <p className={styles.rewardDesc}>
              Earn <strong>10 base points</strong> for every scan, plus <strong>2 bonus points</strong> for each recyclable item identified in the photo. First-time scan of the day gives an extra <strong>25 points</strong>.
            </p>
          </Card>
          <Card className={styles.rewardCard}>
            <div className={styles.rewardHeader}>
              <div className={styles.rewardIcon}>
                <Gift size={22} strokeWidth={1.5} />
              </div>
              <h3 className={styles.rewardTitle}>Redeem for bill discounts</h3>
            </div>
            <p className={styles.rewardDesc}>
              Every <strong>100 points = ₦100 off</strong> your waste bill. Points never expire and can be applied at checkout on the Payments page.
            </p>
          </Card>
          <Card className={styles.rewardCard}>
            <div className={styles.rewardHeader}>
              <div className={styles.rewardIcon}>
                <BadgePercent size={22} strokeWidth={1.5} />
              </div>
              <h3 className={styles.rewardTitle}>Discount limits</h3>
            </div>
            <p className={styles.rewardDesc}>
              Points can cover up to <strong>50% of any single bill</strong> when redeemed at once, keeping the system sustainable while maximising your savings.
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
    <>
      <RecyclingPageHeader />
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Recycling</h1>
        </div>

        <RecycleTabs guideContent={<GuideContent />} />
      </div>
    </>
  );
}
