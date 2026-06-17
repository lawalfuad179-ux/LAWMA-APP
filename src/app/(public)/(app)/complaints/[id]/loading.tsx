import { Bone, SkeletonPage, SkeletonCard, SkeletonSection } from '@/components/ui/Skeleton';

export default function ComplaintDetailLoading() {
  return (
    <SkeletonPage>
      {/* Back button */}
      <Bone w={90} h={36} radius={8} />

      {/* Title + meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Bone w="65%" h={26} radius={8} />
        <Bone w="50%" h={13} radius={6} />
        <Bone w={80} h={24} radius={999} style={{ marginTop: 4 }} />
      </div>

      {/* Details section */}
      <SkeletonSection>
        <SkeletonCard>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-outline-variant)' }}>
              <Bone w="30%" h={13} radius={6} />
              <Bone w="45%" h={13} radius={6} />
            </div>
          ))}
        </SkeletonCard>
      </SkeletonSection>

      {/* Photos section */}
      <SkeletonSection>
        <div style={{ display: 'flex', gap: 10 }}>
          {[...Array(3)].map((_, i) => (
            <Bone key={i} w={80} h={80} radius={10} />
          ))}
        </div>
      </SkeletonSection>

      {/* Timeline section */}
      <SkeletonSection>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Bone w={12} h={12} radius="50%" style={{ marginTop: 4, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Bone w="45%" h={14} radius={6} />
              <Bone w="60%" h={12} radius={6} />
            </div>
          </div>
        ))}
      </SkeletonSection>
    </SkeletonPage>
  );
}
