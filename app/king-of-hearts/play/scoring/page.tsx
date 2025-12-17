'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/app/lib/gameState';

export default function ScoringSelection() {
  const router = useRouter();
  const { state, getCurrentPlayer, calculateScore, updateScore, markQuestionAsked, advanceToNextPlayer, isRoundComplete } = useGameState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Redirect if no category or difficulty selected
    if (!state.currentCategory || !state.currentDifficulty) {
      router.push('/king-of-hearts/play');
    }
  }, [state.currentCategory, state.currentDifficulty, router]);

  if (!mounted || !state.currentCategory || !state.currentDifficulty) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex items-center justify-center">
        <p className="text-[#9B9388]">Loading...</p>
      </main>
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
      // Calculate score changes
      const scoreResult = calculateScore(winner);

      // Apply score changes
      updateScore(scoreResult.originalPlayer.name, scoreResult.originalPlayer.points);
      if (scoreResult.expertPlayer) {
        updateScore(scoreResult.expertPlayer.name, scoreResult.expertPlayer.points);
      }

      // Mark question as asked
      markQuestionAsked(state.currentCategory!, state.currentDifficulty!);

      // Store score changes for animation screen
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('score_changes', JSON.stringify(scoreResult));
      }

      // Navigate to score change animation
      router.push('/king-of-hearts/play/score-change');
    } catch (error) {
      console.error('Error calculating score:', error);
    }
  };

  return (
    <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[500px]">
        {/* Title */}
        <h1 className="font-heading text-[36px] font-bold text-[#F0EEE9] text-center mb-12">
          Who got it right?
        </h1>

        {/* Scoring Buttons */}
        <div className="space-y-4">
          {/* Original Player */}
          <button
            onClick={() => handleScoring('original')}
            className="w-full py-6 bg-[#F0EEE9] text-[#1F1E1C] font-body text-[20px] font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            {currentPlayer.name}
          </button>

          {/* Expert (if steal attempted) */}
          {expertStealAttempted && expertName && (
            <button
              onClick={() => handleScoring('expert')}
              className="w-full py-6 bg-[#D4A574] text-[#1F1E1C] font-body text-[20px] font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
            >
              {expertName}
            </button>
          )}

          {/* Nobody */}
          <button
            onClick={() => handleScoring('nobody')}
            className="w-full py-6 bg-transparent border-2 border-[#9B9388] text-[#9B9388] font-body text-[20px] font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:border-[#F0EEE9] hover:text-[#F0EEE9] select-none"
          >
            No one
          </button>
        </div>
      </div>
    </main>
  );
}

