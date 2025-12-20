'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/app/lib/gameState';
import type { ScoreResult } from '@/app/lib/gameState';
import { SteampunkLayout, GameCard, HolidayGarland, Gear } from '@/components/ui/qtc-components';

export default function ScoreChangeAnimation() {
  const router = useRouter();
  const { state, advanceToNextPlayer, isRoundComplete } = useGameState();
  const [scoreChanges, setScoreChanges] = useState<ScoreResult | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
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

    const timer = setTimeout(() => {
      setAnimationComplete(true);
      if (isRoundComplete()) {
        if (state.currentRound === 1) {
          router.push('/king-of-hearts/round-complete');
        } else {
          router.push('/king-of-hearts/game-over');
        }
      } else {
        advanceToNextPlayer();
        router.push('/king-of-hearts/play');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, isRoundComplete, state.currentRound, advanceToNextPlayer]);

  if (!scoreChanges) {
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </main>
      </SteampunkLayout>
    );
  }

  const originalPlayerOldScore = state.players.find(p => p.name === scoreChanges.originalPlayer.name)?.score || 0;
  const originalPlayerNewScore = originalPlayerOldScore + scoreChanges.originalPlayer.points;
  
  const expertPlayerOldScore = scoreChanges.expertPlayer 
    ? (state.players.find(p => p.name === scoreChanges.expertPlayer!.name)?.score || 0)
    : null;
  const expertPlayerNewScore = expertPlayerOldScore !== null && scoreChanges.expertPlayer
    ? expertPlayerOldScore + scoreChanges.expertPlayer.points
    : null;

  return (
    <SteampunkLayout variant="dark">
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <HolidayGarland className="mb-8" />
        <div className="w-full max-w-[500px] space-y-6">
          <GameCard variant="dark" className="border-2 border-qtc-cream">
            <div className="flex justify-between items-center">
              <span className="font-body text-[24px] font-bold text-qtc-cream">
                {scoreChanges.originalPlayer.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[20px] text-qtc-copper">
                  {originalPlayerOldScore}
                </span>
                <span className="font-mono text-[24px] text-qtc-cream">→</span>
                <span className={`font-mono text-[32px] font-bold ${
                  scoreChanges.originalPlayer.points >= 0 ? 'text-qtc-holiday-green' : 'text-qtc-holiday-red'
                }`}>
                  {originalPlayerNewScore}
                </span>
                <span className={`font-body text-[20px] font-bold ${
                  scoreChanges.originalPlayer.points >= 0 ? 'text-qtc-holiday-green' : 'text-qtc-holiday-red'
                }`}>
                  ({scoreChanges.originalPlayer.points >= 0 ? '+' : ''}{scoreChanges.originalPlayer.points})
                </span>
              </div>
            </div>
          </GameCard>

          {scoreChanges.expertPlayer && expertPlayerOldScore !== null && expertPlayerNewScore !== null && (
            <GameCard variant="brass" className="border-2 border-qtc-brass">
              <div className="flex justify-between items-center">
                <span className="font-body text-[24px] font-bold text-qtc-cream">
                  {scoreChanges.expertPlayer.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[20px] text-qtc-copper">
                    {expertPlayerOldScore}
                  </span>
                  <span className="font-mono text-[24px] text-qtc-cream">→</span>
                  <span className={`font-mono text-[32px] font-bold ${
                    scoreChanges.expertPlayer.points >= 0 ? 'text-qtc-holiday-green' : 'text-qtc-holiday-red'
                  }`}>
                    {expertPlayerNewScore}
                  </span>
                  <span className={`font-body text-[20px] font-bold ${
                    scoreChanges.expertPlayer.points >= 0 ? 'text-qtc-holiday-green' : 'text-qtc-holiday-red'
                  }`}>
                    ({scoreChanges.expertPlayer.points >= 0 ? '+' : ''}{scoreChanges.expertPlayer.points})
                  </span>
                </div>
              </div>
            </GameCard>
          )}
        </div>
      </main>
    </SteampunkLayout>
  );
}

