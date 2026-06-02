import { Card } from '@/components/ui/Card';
import { RECYCLING_TIPS } from '@/constants';
import styles from './page.module.css';

const categories = [...new Set(RECYCLING_TIPS.map((t) => t.category))];

export default function RecyclingPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Recycling Guide</h1>
      <p className={styles.subtitle}>Learn how to sort your waste properly</p>

      {categories.map((category) => (
        <section key={category}>
          <h2 className={styles.categoryTitle}>{category}</h2>
          <div className={styles.grid}>
            {RECYCLING_TIPS.filter((t) => t.category === category).map((tip) => (
              <Card key={tip.title} className={styles.card}>
                <span className={styles.cardCategory}>{tip.category}</span>
                <h3 className={styles.cardTitle}>{tip.title}</h3>
                <p className={styles.description}>{tip.description}</p>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
