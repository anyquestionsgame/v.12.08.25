'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  SteampunkLayout, 
  BrassButton, 
  GhostButton, 
  GameCard, 
  HolidayGarland, 
  Gear 
} from '@/components/ui/qtc-components';

interface Player {
  name: string;
  selfCategory: string;
  peerCategory: string;
  score: number;
}

export default function GameOver() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const finalScores = localStorage.getItem('king_of_hearts_final_scores');
      if (finalScores) {
        try {
          setPlayers(JSON.parse(finalScores));
        } catch (error) {
          console.error('Error parsing final scores:', error);
          router.push('/king-of-hearts');
        }
      } else {
        router.push('/king-of-hearts');
      }
    }
  }, [router]);

  const handlePlayAgain = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('king_of_hearts_players');
      localStorage.removeItem('king_of_hearts_game_state');
      localStorage.removeItem('king_of_hearts_final_scores');
      localStorage.removeItem('king_of_hearts_round');
    }
    router.push('/king-of-hearts');
  };

  const handleBackToHome = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('king_of_hearts_players');
      localStorage.removeItem('king_of_hearts_game_state');
      localStorage.removeItem('king_of_hearts_final_scores');
      localStorage.removeItem('king_of_hearts_round');
    }
    router.push('/');
  };

  if (!mounted || players.length === 0) {
    return (
      <SteampunkLayout variant="copper">
        <main className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </main>
      </SteampunkLayout>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <SteampunkLayout variant="holiday">
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fadeIn">
        <div className="w-full max-w-[500px]">
          <HolidayGarland className="mb-6" />
          <p className="font-body text-[14px] text-qtc-copper uppercase tracking-wider text-center">
            Game Complete
          </p>

          {winner && (
            <div className="mt-4 text-center">
              <h1 className="font-heading text-[48px] font-bold text-qtc-holiday-green">
                {winner.name.toUpperCase()}
              </h1>
              <p className="font-heading text-[28px] font-bold text-qtc-brass">
                WINS! 🏆
              </p>
              <p className="mt-2 font-body text-[18px] text-qtc-copper">
                with {winner.score} points
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <div className="w-[100px] h-[3px] bg-qtc-brass rounded-full" />
          </div>

          <GameCard variant="brass" className="mt-8">
            <p className="font-body text-[12px] text-qtc-brass uppercase tracking-wider mb-4 font-semibold">
              Final Standings
            </p>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => {
                const isWinner = player.name === winner?.name;
                const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                
                return (
                  <div
                    key={player.name}
                    className={`flex justify-between items-center p-4 rounded-xl ${
                      isWinner 
                        ? 'bg-qtc-brass shadow-md' 
                        : 'bg-qtc-cream'
                    }`}
                    style={isWinner ? { boxShadow: "0 4px 15px rgba(212,175,55,0.4)" } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-heading text-[20px] font-bold ${
                        isWinner ? 'text-qtc-black' : 'text-qtc-copper'
                      }`}>
                        {index + 1}.
                      </span>
                      <span className={`font-body text-[18px] font-medium ${
                        isWinner ? 'text-qtc-black' : 'text-qtc-holiday-green'
                      }`}>
                        {player.name} {medal}
                      </span>
                    </div>
                    <span className={`font-heading text-[24px] font-bold ${
                      isWinner 
                        ? 'text-qtc-black' 
                        : player.score >= 0 ? 'text-qtc-holiday-green' : 'text-qtc-holiday-red'
                    }`}>
                      {player.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </GameCard>

          <div className="mt-8 space-y-3">
            <BrassButton
              onClick={handlePlayAgain}
              variant="holiday"
              size="lg"
              className="w-full"
            >
              Play Again
            </BrassButton>
            
            <GhostButton
              onClick={handleBackToHome}
              className="w-full"
            >
              Back to Home
            </GhostButton>
          </div>
        </div>
      </main>
    </SteampunkLayout>
  );
}
