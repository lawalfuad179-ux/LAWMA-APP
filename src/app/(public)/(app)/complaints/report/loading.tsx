import { Bone, SkeletonPage, SkeletonCard } from '@/components/ui/Skeleton';

export default function ComplaintReportLoading() {
  return (
    <SkeletonPage>
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bone w="50%" h={28} radius={8} />
        <Bone w="65%" h={14} radius={6} />
      </div>

      {/* Form card */}
      <SkeletonCard>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            <Bone w="30%" h={12} radius={6} />
            <Bone w="100%" h={48} radius={10} />
          </div>
        ))}
        {/* Photo upload area */}
        <Bone w="100%" h={100} radius={12} style={{ marginTop: 4 }} />
        {/* Submit */}
        <Bone w="100%" h={52} radius={12} style={{ marginTop: 8 }} />
      </SkeletonCard>
    </SkeletonPage>
  );
}
