'use client';

import { useRouter } from 'next/navigation';
import ErrorState from '@/components/ErrorState';

export default function NotFound() {
  const router = useRouter();

  return (
    <ErrorState
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      onRetry={() => router.push('/')}
      showGoBack={true}
    />
  );
}

