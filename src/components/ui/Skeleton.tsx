import styles from './Skeleton.module.css';

type BoneProps = {
  w?: string | number;
  h?: string | number;
  radius?: string | number;
  className?: string;
  style?: React.CSSProperties;
};

export function Bone({ w, h, radius, className, style }: BoneProps) {
  return (
    <div
      className={`${styles.bone} ${className ?? ''}`}
      style={{ width: w, height: h, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}

export function SkeletonCard({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <div className={styles.card} style={style}>{children}</div>;
}

export function SkeletonEyebrow() {
  return (
    <div className={styles.eyebrow}>
      <Bone w={16} h={16} radius={4} />
      <Bone w={120} h={12} className={styles.line} />
    </div>
  );
}

export function SkeletonSection({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SkeletonEyebrow />
      {children}
    </div>
  );
}
