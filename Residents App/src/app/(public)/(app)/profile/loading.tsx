import { Bone, SkeletonPage, SkeletonCard, SkeletonSection } from '@/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <SkeletonPage>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 0' }}>
        <Bone w={80} h={80} radius="50%" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Bone w="55%" h={20} radius={6} />
          <Bone w="40%" h={14} radius={6} />
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <Bone w={80} h={24} radius={999} />
            <Bone w={130} h={24} radius={999} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[...Array(2)].map((_, i) => (
          <SkeletonCard key={i} style={{ alignItems: 'center', padding: 20, gap: 10 }}>
            <Bone w={36} h={36} radius={10} />
            <Bone w="60%" h={22} radius={6} />
            <Bone w="50%" h={12} radius={6} />
          </SkeletonCard>
        ))}
      </div>

      {/* Quick links */}
      <SkeletonSection>
        <SkeletonCard style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: i < 4 ? '1px solid var(--color-outline-variant)' : 'none' }}>
              <Bone w={36} h={36} radius={10} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bone w="45%" h={14} radius={6} />
                <Bone w="65%" h={12} radius={6} />
              </div>
              <Bone w={16} h={16} radius={4} style={{ flexShrink: 0 }} />
            </div>
          ))}
        </SkeletonCard>
      </SkeletonSection>

      {/* Personal info form */}
      <SkeletonSection>
        <SkeletonCard style={{ gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Bone w="30%" h={12} radius={6} />
              <Bone w="100%" h={48} radius={10} />
            </div>
          ))}
          <Bone w="100%" h={48} radius={10} style={{ marginTop: 4 }} />
        </SkeletonCard>
      </SkeletonSection>
    </SkeletonPage>
  );
}
