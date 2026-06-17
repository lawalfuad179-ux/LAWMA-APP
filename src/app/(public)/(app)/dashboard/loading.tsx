import { Bone, SkeletonPage, SkeletonCard, SkeletonSection } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <SkeletonPage>
      {/* Greeting row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Bone w={54} h={54} radius="50%" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Bone w="55%" h={18} radius={6} />
          <Bone w="35%" h={13} radius={6} />
        </div>
        <Bone w={44} h={44} radius={12} style={{ flexShrink: 0, display: 'none' }} className="desktopOnly" />
      </div>

      {/* Collection schedule section */}
      <SkeletonSection>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <SkeletonCard style={{ minHeight: 160 }}>
            <Bone w="40%" h={12} radius={6} />
            <Bone w="60%" h={32} radius={8} style={{ marginTop: 8 }} />
            <Bone w="50%" h={13} radius={6} />
          </SkeletonCard>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} style={{ minHeight: 100, alignItems: 'center', justifyContent: 'center' }}>
                <Bone w={32} h={32} radius={8} />
                <Bone w="70%" h={13} radius={6} style={{ marginTop: 8 }} />
              </SkeletonCard>
            ))}
          </div>
        </div>
      </SkeletonSection>

      {/* Recent activity */}
      <SkeletonSection>
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
            <Bone w={40} h={40} radius={10} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Bone w="65%" h={14} radius={6} />
              <Bone w="45%" h={12} radius={6} />
            </div>
            <Bone w={60} h={24} radius={12} style={{ flexShrink: 0 }} />
          </SkeletonCard>
        ))}
      </SkeletonSection>

      {/* Recycling tip */}
      <SkeletonSection>
        <SkeletonCard style={{ minHeight: 100 }}>
          <Bone w="25%" h={11} radius={6} />
          <Bone w="55%" h={16} radius={6} style={{ marginTop: 4 }} />
          <Bone w="100%" h={12} radius={6} />
          <Bone w="80%" h={12} radius={6} />
        </SkeletonCard>
      </SkeletonSection>
    </SkeletonPage>
  );
}
