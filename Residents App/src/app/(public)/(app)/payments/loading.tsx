import { Bone, SkeletonPage, SkeletonCard, SkeletonSection } from '@/components/ui/Skeleton';

export default function PaymentsLoading() {
  return (
    <SkeletonPage>
      {/* Title */}
      <Bone w="40%" h={28} radius={8} />

      {/* Balance card */}
      <SkeletonCard style={{ minHeight: 120, borderRadius: 18, borderColor: 'transparent', padding: '28px 24px', gap: 14 }}>
        <Bone w="50%" h={12} radius={6} />
        <Bone w="70%" h={40} radius={10} />
        <Bone w="45%" h={13} radius={6} />
      </SkeletonCard>

      {/* Bill list */}
      <SkeletonSection>
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Bone w="50%" h={13} radius={6} />
              <Bone w={70} h={24} radius={999} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <Bone w="35%" h={22} radius={6} />
              <Bone w="35%" h={12} radius={6} />
            </div>
            {i === 0 && <Bone w="100%" h={40} radius={10} style={{ marginTop: 4 }} />}
          </SkeletonCard>
        ))}
      </SkeletonSection>
    </SkeletonPage>
  );
}
