import { Bone, SkeletonPage, SkeletonCard, SkeletonSection } from '@/components/ui/Skeleton';

export default function NotificationPrefsLoading() {
  return (
    <SkeletonPage>
      {/* Back + title */}
      <Bone w={90} h={36} radius={8} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bone w="55%" h={28} radius={8} />
        <Bone w="65%" h={13} radius={6} />
      </div>

      {/* Email section */}
      <SkeletonSection>
        <SkeletonCard style={{ gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--color-outline-variant)' : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bone w={140} h={14} radius={6} />
                <Bone w={180} h={12} radius={6} />
              </div>
              <Bone w={44} h={26} radius={999} />
            </div>
          ))}
        </SkeletonCard>
      </SkeletonSection>

      {/* SMS section */}
      <SkeletonSection>
        <SkeletonCard style={{ gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--color-outline-variant)' : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bone w={140} h={14} radius={6} />
                <Bone w={180} h={12} radius={6} />
              </div>
              <Bone w={44} h={26} radius={999} />
            </div>
          ))}
        </SkeletonCard>
      </SkeletonSection>
    </SkeletonPage>
  );
}
