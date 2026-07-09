'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button type="button" className={className} onClick={() => router.back()} aria-label="Go back">
      <ArrowLeft size={18} strokeWidth={1.5} />
    </button>
  );
}
