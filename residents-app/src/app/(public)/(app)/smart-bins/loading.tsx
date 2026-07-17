import { Bone, SkeletonPage, SkeletonCard, SkeletonSection } from '@/components/ui/Skeleton';

export default function SmartBinsLoading() {
  return (
    <SkeletonPage>
      <Bone w="40%" h={28} radius={8} />

      <SkeletonSection>
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Bone w="45%" h={14} radius={6} />
              <Bone w={70} h={24} radius={999} />
            </div>
            <Bone w="65%" h={12} radius={6} style={{ marginTop: 6 }} />
            <Bone w="100%" h={40} radius={10} style={{ marginTop: 8 }} />
          </SkeletonCard>
        ))}
      </SkeletonSection>
    </SkeletonPage>
  );
}
