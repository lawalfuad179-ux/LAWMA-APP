import { Card } from '@/components/ui/Card';
import styles from './page.module.css';

const topics = [
  {
    icon: '🥤',
    title: 'Plastic Bottles',
    description: 'Rinse and crush PET bottles. Remove caps and labels. Drop at designated collection points.',
  },
  {
    icon: '📦',
    title: 'Cardboard & Paper',
    description: 'Flatten cardboard boxes. Keep dry and clean. Separate from food waste.',
  },
  {
    icon: '🥫',
    title: 'Aluminum Cans',
    description: 'Rinse cans. Crush to save space. Separate from general waste.',
  },
  {
    icon: '🍌',
    title: 'Organic Waste',
    description: 'Food scraps and yard waste can be composted. Do not mix with plastics.',
  },
  {
    icon: '🔋',
    title: 'Electronics & Batteries',
    description: 'Do not dispose of batteries, phones, or electronics in general waste. Take to dedicated e-waste collection points.',
  },
  {
    icon: '♻️',
    title: 'Why Recycle?',
    description: 'Recycling reduces landfill waste, creates jobs, and keeps Lagos waterways clean. Every bottle and can diverted from a drainage channel helps prevent flooding.',
  },
];

export default function RecyclingPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Recycling Guide</h1>
      <p className={styles.subtitle}>Learn how to sort your waste properly</p>

      <div className={styles.grid}>
        {topics.map((topic) => (
          <Card key={topic.title} className={styles.card}>
            <span className={styles.icon} aria-hidden="true">{topic.icon}</span>
            <h2 className={styles.cardTitle}>{topic.title}</h2>
            <p className={styles.description}>{topic.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
