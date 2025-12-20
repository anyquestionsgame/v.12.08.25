'use client';

import { useEffect } from 'react';
import ErrorState from '@/components/ErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      message={error?.message || 'An unexpected error occurred. Please try again.'}
      onRetry={reset}
      showGoBack={true}
    />
  );
}

