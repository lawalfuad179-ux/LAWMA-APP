import { Bone, SkeletonPage, SkeletonCard, SkeletonSection } from '@/components/ui/Skeleton';

export default function ActivitiesLoading() {
  return (
    <SkeletonPage>
      <Bone w="45%" h={28} radius={8} />

      <SkeletonSection>
        {[...Array(5)].map((_, i) => (
          <SkeletonCard key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Bone w="55%" h={13} radius={6} />
              <Bone w={64} h={22} radius={999} />
            </div>
            <Bone w="40%" h={11} radius={6} style={{ marginTop: 6 }} />
          </SkeletonCard>
        ))}
      </SkeletonSection>
    </SkeletonPage>
  );
}
