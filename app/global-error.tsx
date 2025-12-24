'use client';

import { useEffect } from 'react';
import ErrorState from '@/components/ErrorState';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <ErrorState
          title="Something went wrong"
          message={error?.message || 'An unexpected error occurred. Please refresh the page.'}
          onRetry={reset}
          showGoBack={true}
        />
      </body>
    </html>
  );
}

