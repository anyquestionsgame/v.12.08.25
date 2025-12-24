'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/app/lib/gameState';
import { SteampunkLayout, BrassButton, GhostButton, HolidayGarland } from '@/components/ui/qtc-components';

export default function ScoringSelection() {
  const router = useRouter();
  const { state, getCurrentPlayer, calculateScore, updateScore, markQuestionAsked, advanceToNextPlayer, isRoundComplete } = useGameState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!state.currentCategory || !state.currentDifficulty) {
      router.push('/king-of-hearts/play');
    }
  }, [state.currentCategory, state.currentDifficulty, router]);

  if (!mounted || !state.currentCategory || !state.currentDifficulty) {
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-qtc-copper">Loading...</p>
        </main>
      </SteampunkLayout>
    );
  }

  const currentPlayer = getCurrentPlayer();
  if (!currentPlayer) {
    router.push('/king-of-hearts/play');
    return null;
  }

  const expertStealAttempted = state.expertStealAttempted;
  const expertName = state.expertName;

  const handleScoring = (winner: 'original' | 'expert' | 'nobody') => {
    try {
      const scoreResult = calculateScore(winner);
      updateScore(scoreResult.originalPlayer.name, scoreResult.originalPlayer.points);
      if (scoreResult.expertPlayer) {
        updateScore(scoreResult.expertPlayer.name, scoreResult.expertPlayer.points);
      }
      markQuestionAsked(state.currentCategory!, state.currentDifficulty!);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('score_changes', JSON.stringify(scoreResult));
      }
      router.push('/king-of-hearts/play/score-change');
    } catch (error) {
      console.error('Error calculating score:', error);
    }
  };

  return (
    <SteampunkLayout variant="holiday">
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <HolidayGarland className="mb-8" />
        <div className="w-full max-w-[500px]">
          <h1 className="font-heading text-[36px] font-bold text-qtc-cream text-center mb-12">
            Who got it right?
          </h1>

          <div className="space-y-4">
            <BrassButton
              onClick={() => handleScoring('original')}
              variant="holiday"
              size="lg"
              className="w-full"
            >
              {currentPlayer.name}
            </BrassButton>

            {expertStealAttempted && expertName && (
              <BrassButton
                onClick={() => handleScoring('expert')}
                variant="primary"
                size="lg"
                className="w-full bg-qtc-brass text-qtc-black"
              >
                {expertName}
              </BrassButton>
            )}

            <GhostButton
              onClick={() => handleScoring('nobody')}
              className="w-full"
            >
              No one
            </GhostButton>
          </div>
        </div>
      </main>
    </SteampunkLayout>
  );
}

