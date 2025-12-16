'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateSession, getRecoveryPath, ValidationResult } from '@/utils/sessionValidation';
import { GameSession } from '@/app/lib/gameOrchestrator';
import ErrorState from './ErrorState';
import Loading from './Loading';

interface SessionGuardProps {
  children: (session: GameSession) => React.ReactNode;
  requireSession?: boolean; // If false, allows page to load without session (for setup pages)
  redirectOnInvalid?: boolean; // If true, redirects instead of showing error
}

export default function SessionGuard({
  children,
  requireSession = true,
  redirectOnInvalid = false
}: SessionGuardProps) {
  const router = useRouter();
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const result = validateSession();
    setValidation(result);

    // If session required but invalid, and redirect is enabled
    if (requireSession && !result.valid && redirectOnInvalid) {
      const recoveryPath = getRecoveryPath(result.error);
      router.push(recoveryPath);
    }
  }, [mounted, requireSession, redirectOnInvalid, router]);

  // Wait for mount
  if (!mounted) {
    return <Loading />;
  }

  // If session not required, render children (for setup pages)
  if (!requireSession) {
    return <>{children(null as any)}</>;
  }

  // If still validating
  if (!validation) {
    return <Loading />;
  }

  // If invalid and not redirecting, show error
  if (!validation.valid) {
    if (redirectOnInvalid) {
      return <Loading />; // Will redirect
    }

    return (
      <ErrorState
        title="Session Invalid"
        message={validation.message}
        onRetry={() => {
          const recoveryPath = getRecoveryPath(validation.error);
          router.push(recoveryPath);
        }}
        showGoBack={true}
      />
    );
  }

  // Session is valid, render children
  return <>{children(validation.session)}</>;
}

