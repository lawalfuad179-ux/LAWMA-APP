import { Bone, SkeletonPage, SkeletonCard } from '@/components/ui/Skeleton';
import styles from './loading.module.css';

export default function RecyclingLoading() {
  return (
    <>
      {/* Desktop sticky header placeholder */}
      <div className={styles.desktopHeader}>
        <Bone w={120} h={20} radius={6} />
        <div style={{ display: 'flex', gap: 12 }}>
          <Bone w={76} h={38} radius={999} />
          <Bone w={44} h={44} radius={12} />
        </div>
      </div>

      <SkeletonPage>
        {/* Mobile title */}
        <div className={styles.mobileHeader}>
          <Bone w="45%" h={26} radius={8} />
          <Bone w="60%" h={14} radius={6} style={{ marginTop: 4 }} />
        </div>

        {/* Tab bar */}
        <Bone w="100%" h={52} radius={14} />

        {/* Reward cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} style={{ gap: 10 }}>
              <Bone w={44} h={44} radius={12} />
              <Bone w="70%" h={14} radius={6} />
              <Bone w="100%" h={12} radius={6} />
              <Bone w="85%" h={12} radius={6} />
            </SkeletonCard>
          ))}
        </div>

        {/* Tip category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bone w={16} h={16} radius={4} />
            <Bone w={100} h={12} radius={6} />
          </div>
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i}>
              <Bone w="20%" h={10} radius={6} />
              <Bone w="55%" h={14} radius={6} style={{ marginTop: 2 }} />
              <Bone w="100%" h={12} radius={6} />
              <Bone w="75%" h={12} radius={6} />
            </SkeletonCard>
          ))}
        </div>
      </SkeletonPage>
    </>
  );
}
