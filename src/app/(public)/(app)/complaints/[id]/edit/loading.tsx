import { Bone, SkeletonPage, SkeletonCard } from '@/components/ui/Skeleton';

export default function EditComplaintLoading() {
  return (
    <SkeletonPage>
      {/* Back + title */}
      <Bone w={90} h={36} radius={8} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bone w="50%" h={26} radius={8} />
        <Bone w="60%" h={13} radius={6} />
      </div>

      {/* Form card */}
      <SkeletonCard>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            <Bone w="30%" h={12} radius={6} />
            <Bone w="100%" h={48} radius={10} />
          </div>
        ))}
        <Bone w="100%" h={100} radius={10} />
        <Bone w="100%" h={52} radius={12} style={{ marginTop: 8 }} />
      </SkeletonCard>
    </SkeletonPage>
  );
}
