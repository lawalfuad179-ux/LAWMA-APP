import { Bone, SkeletonPage, SkeletonCard, SkeletonSection } from '@/components/ui/Skeleton';

export default function SchedulesLoading() {
  return (
    <SkeletonPage>
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bone w="55%" h={28} radius={8} />
        <Bone w="38%" h={14} radius={6} />
      </div>

      {/* Today */}
      <SkeletonSection>
        <SkeletonCard style={{ minHeight: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Bone w={110} h={26} radius={999} />
            <Bone w={72} h={24} radius={999} />
          </div>
          <Bone w="45%" h={22} radius={8} style={{ marginTop: 8 }} />
          <Bone w="55%" h={13} radius={6} />
        </SkeletonCard>
      </SkeletonSection>

      {/* Later this week */}
      <SkeletonSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Bone w="45%" h={14} radius={6} />
                <Bone w={60} h={22} radius={999} />
              </div>
              <Bone w="60%" h={13} radius={6} />
              <Bone w="70%" h={13} radius={6} />
            </SkeletonCard>
          ))}
        </div>
      </SkeletonSection>
    </SkeletonPage>
  );
}
