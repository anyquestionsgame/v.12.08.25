'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validatePlayersExist } from '@/utils/sessionValidation';
import { Player } from '@/app/lib/gameOrchestrator';
import ErrorState from './ErrorState';
import Loading from './Loading';

interface PlayersGuardProps {
  children: (players: Player[]) => React.ReactNode;
  redirectOnInvalid?: boolean;
}

export default function PlayersGuard({
  children,
  redirectOnInvalid = false
}: PlayersGuardProps) {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const result = validatePlayersExist();
    
    if (!result.valid) {
      setError(result.error || 'Failed to load players');
      if (redirectOnInvalid) {
        router.push('/onboarding');
      }
    } else {
      setPlayers(result.players || []);
    }
  }, [mounted, redirectOnInvalid, router]);

  if (!mounted) {
    return <Loading />;
  }

  if (error) {
    if (redirectOnInvalid) {
      return <Loading />; // Will redirect
    }

    return (
      <ErrorState
        title="Players Not Found"
        message={error}
        onRetry={() => router.push('/onboarding')}
        showGoBack={true}
      />
    );
  }

  if (!players || players.length === 0) {
    return <Loading />;
  }

  return <>{children(players)}</>;
}

