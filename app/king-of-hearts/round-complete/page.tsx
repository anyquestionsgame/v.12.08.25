'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SteampunkLayout, BrassButton, GameCard, HolidayGarland, Gear } from '@/components/ui/qtc-components';

interface Player {
  name: string;
  selfCategory: string;
  peerCategory: string;
  score: number;
}

export default function RoundComplete() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const gameState = localStorage.getItem('king_of_hearts_game_state');
      if (gameState) {
        try {
          const parsed = JSON.parse(gameState);
          setPlayers(parsed.players || []);
        } catch (error) {
          console.error('Error parsing game state:', error);
          router.push('/king-of-hearts');
        }
      } else {
        router.push('/king-of-hearts');
      }
    }
  }, [router]);

  const handleStartRound2 = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('king_of_hearts_players', JSON.stringify(players));
    }
    router.push('/king-of-hearts/round-2-start');
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
  const leader = sortedPlayers[0];

  return (
    <SteampunkLayout variant="holiday">
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fadeIn">
        <div className="w-full max-w-[500px]">
          <HolidayGarland className="mb-6" />
          <p className="font-body text-[14px] text-qtc-copper uppercase tracking-wider text-center">
            Round 1 Complete
          </p>
          <h1 className="mt-2 font-heading text-[42px] font-bold text-qtc-holiday-green text-center">
            HALFTIME
          </h1>

          {leader && (
            <GameCard variant="brass" className="mt-6 text-center">
              <p className="font-body text-[16px] text-qtc-copper">
                In the lead:
              </p>
              <p className="font-heading text-[28px] font-bold text-qtc-brass">
                {leader.name} with {leader.score} pts
              </p>
            </GameCard>
          )}

          <GameCard variant="brass" className="mt-8">
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => {
                const isLeader = player.name === leader?.name;
                return (
                  <div
                    key={player.name}
                    className={`flex justify-between items-center p-3 rounded-xl ${
                      isLeader ? 'bg-qtc-brass/15 border-2 border-qtc-brass' : 'bg-qtc-cream'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-[20px] font-bold text-qtc-copper">
                        {index + 1}.
                      </span>
                      <span className={`font-body text-[18px] font-medium ${
                        isLeader ? 'text-qtc-brass' : 'text-qtc-holiday-green'
                      }`}>
                        {player.name}
                      </span>
                    </div>
                    <span className={`font-heading text-[24px] font-bold ${
                      player.score >= 0 ? 'text-qtc-holiday-green' : 'text-qtc-holiday-red'
                    }`}>
                      {player.score >= 0 ? '+' : ''}{player.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </GameCard>

          <div className="mt-8 text-center">
            <p className="font-body text-[16px] text-qtc-copper">
              Round 2: Things We Won&apos;t Shut Up About
            </p>
            <p className="mt-1 font-body text-[14px] text-qtc-copper/70">
              Your friends picked these categories for you
            </p>
          </div>

          <BrassButton
            onClick={handleStartRound2}
            variant="holiday"
            size="lg"
            className="mt-8 w-full"
          >
            Start Round 2
          </BrassButton>
        </div>
      </main>
    </SteampunkLayout>
  );
}
