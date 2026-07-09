import styles from './StatusTimeline.module.css';

type StatusStep = {
  key: string;
  label: string;
  date?: string;
};

type Props = {
  steps: StatusStep[];
  currentKey: string;
};

export function StatusTimeline({ steps, currentKey }: Props) {
  const currentIndex = steps.findIndex((s) => s.key === currentKey);

  return (
    <div className={styles.timeline}>
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.key} className={`${styles.step} ${done ? styles.done : ''} ${isCurrent ? styles.current : ''}`}>
            <div className={styles.marker}>
              {done ? <span className={styles.check}>✓</span> : null}
            </div>
            <div className={styles.content}>
              <span className={styles.label}>{step.label}</span>
              {step.date ? (
                <span className={styles.date}>{step.date}</span>
              ) : isCurrent ? (
                <span className={styles.date}>Current</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
