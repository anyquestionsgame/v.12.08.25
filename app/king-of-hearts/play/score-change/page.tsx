'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/app/lib/gameState';
import type { ScoreResult } from '@/app/lib/gameState';

export default function ScoreChangeAnimation() {
  const router = useRouter();
  const { state, advanceToNextPlayer, isRoundComplete } = useGameState();
  const [scoreChanges, setScoreChanges] = useState<ScoreResult | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Load score changes from sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('score_changes');
      if (stored) {
        try {
          setScoreChanges(JSON.parse(stored));
        } catch (error) {
          console.error('Error parsing score changes:', error);
        }
      }
    }

    // Auto-advance after animation
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      
      // Check if round is complete
      if (isRoundComplete()) {
        if (state.currentRound === 1) {
          router.push('/king-of-hearts/round-complete');
        } else {
          router.push('/king-of-hearts/game-over');
        }
      } else {
        // Advance to next player and return to category selection
        advanceToNextPlayer();
        router.push('/king-of-hearts/play');
      }
    }, 2000); // 2 second animation

    return () => clearTimeout(timer);
  }, [router, isRoundComplete, state.currentRound, advanceToNextPlayer]);

  if (!scoreChanges) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex items-center justify-center">
        <p className="text-[#9B9388]">Loading...</p>
      </main>
    );
  }

  // Calculate new scores (old score + points change)
  const originalPlayerOldScore = state.players.find(p => p.name === scoreChanges.originalPlayer.name)?.score || 0;
  const originalPlayerNewScore = originalPlayerOldScore + scoreChanges.originalPlayer.points;
  
  const expertPlayerOldScore = scoreChanges.expertPlayer 
    ? (state.players.find(p => p.name === scoreChanges.expertPlayer!.name)?.score || 0)
    : null;
  const expertPlayerNewScore = expertPlayerOldScore !== null && scoreChanges.expertPlayer
    ? expertPlayerOldScore + scoreChanges.expertPlayer.points
    : null;

  return (
    <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[500px] space-y-6">
        {/* Original Player Score Change */}
        <div className="bg-[#2D2B28] rounded-xl p-6 border-2 border-[#F0EEE9]">
          <div className="flex justify-between items-center">
            <span className="font-body text-[24px] font-bold text-[#F0EEE9]">
              {scoreChanges.originalPlayer.name}
            </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[20px] text-[#9B9388]">
                  {originalPlayerOldScore}
                </span>
                <span className="font-mono text-[24px]">→</span>
                <span className={`font-mono text-[32px] font-bold ${
                  scoreChanges.originalPlayer.points >= 0 ? 'text-[#81B29A]' : 'text-[#E07A5F]'
                }`}>
                  {originalPlayerNewScore}
                </span>
              <span className={`font-body text-[20px] font-bold ${
                scoreChanges.originalPlayer.points >= 0 ? 'text-[#81B29A]' : 'text-[#E07A5F]'
              }`}>
                ({scoreChanges.originalPlayer.points >= 0 ? '+' : ''}{scoreChanges.originalPlayer.points})
              </span>
            </div>
          </div>
        </div>

        {/* Expert Player Score Change (if applicable) */}
        {scoreChanges.expertPlayer && expertPlayerOldScore !== null && expertPlayerNewScore !== null && (
          <div className="bg-[#2D2B28] rounded-xl p-6 border-2 border-[#D4A574]">
            <div className="flex justify-between items-center">
              <span className="font-body text-[24px] font-bold text-[#F0EEE9]">
                {scoreChanges.expertPlayer.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[20px] text-[#9B9388]">
                  {expertPlayerOldScore}
                </span>
                <span className="font-mono text-[24px]">→</span>
                <span className={`font-mono text-[32px] font-bold ${
                  scoreChanges.expertPlayer.points >= 0 ? 'text-[#81B29A]' : 'text-[#E07A5F]'
                }`}>
                  {expertPlayerNewScore}
                </span>
                <span className={`font-body text-[20px] font-bold ${
                  scoreChanges.expertPlayer.points >= 0 ? 'text-[#81B29A]' : 'text-[#E07A5F]'
                }`}>
                  ({scoreChanges.expertPlayer.points >= 0 ? '+' : ''}{scoreChanges.expertPlayer.points})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

