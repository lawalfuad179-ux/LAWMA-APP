import { Bone, SkeletonPage, SkeletonCard } from '@/components/ui/Skeleton';

export default function NotificationsLoading() {
  return (
    <SkeletonPage>
      {/* Title + settings link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Bone w="40%" h={28} radius={8} />
        <Bone w={80} h={28} radius={8} />
      </div>

      {/* Notification items */}
      {[...Array(6)].map((_, i) => (
        <SkeletonCard key={i} style={{ padding: '16px 20px', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Bone w="55%" h={14} radius={6} />
            <Bone w="20%" h={12} radius={6} />
          </div>
          <Bone w="80%" h={13} radius={6} />
          <Bone w="65%" h={12} radius={6} />
        </SkeletonCard>
      ))}
    </SkeletonPage>
  );
}
