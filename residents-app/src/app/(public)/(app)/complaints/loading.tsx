import { Bone, SkeletonPage, SkeletonCard } from '@/components/ui/Skeleton';

export default function ComplaintsLoading() {
  return (
    <SkeletonPage>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Bone w="40%" h={28} radius={8} />
        <Bone w={120} h={40} radius={10} />
      </div>

      {/* Complaint cards */}
      {[...Array(5)].map((_, i) => (
        <SkeletonCard key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
          <Bone w={44} h={44} radius={10} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bone w="55%" h={14} radius={6} />
            <Bone w="70%" h={12} radius={6} />
            <Bone w="40%" h={11} radius={6} />
          </div>
          <Bone w={70} h={24} radius={12} style={{ flexShrink: 0 }} />
        </SkeletonCard>
      ))}
    </SkeletonPage>
  );
}
