'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      // Try to get game state from localStorage
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
    // Store players with their current scores for round 2
    if (typeof window !== 'undefined') {
      // Keep the players data with scores
      localStorage.setItem('king_of_hearts_players', JSON.stringify(players));
      // Don't set round yet - round-2-start will do that
    }
    router.push('/king-of-hearts/round-2-start');
  };

  if (!mounted || players.length === 0) {
    return (
      <main className="min-h-screen bg-[#FFF8DC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Sort players by score (high to low)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const leader = sortedPlayers[0];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
      <div className="w-full max-w-[500px]">
        {/* Title */}
        <p className="font-body text-[14px] text-[#52796F] uppercase tracking-wider text-center">
          Round 1 Complete
        </p>
        <h1 className="mt-2 font-heading text-[42px] font-bold text-[#165B33] text-center">
          HALFTIME
        </h1>

        {/* Leader callout */}
        {leader && (
          <div className="mt-6 text-center bg-white rounded-2xl p-4 shadow-md" style={{ boxShadow: "0 4px 15px rgba(212,175,55,0.2)" }}>
            <p className="font-body text-[16px] text-[#52796F]">
              In the lead:
            </p>
            <p className="font-heading text-[28px] font-bold text-[#D4AF37]">
              {leader.name} with {leader.score} pts
            </p>
          </div>
        )}

        {/* Scoreboard */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: "0 4px 20px rgba(196,30,58,0.1)" }}>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => {
              const isLeader = player.name === leader?.name;
              return (
                <div
                  key={player.name}
                  className={`flex justify-between items-center p-3 rounded-xl ${
                    isLeader ? 'bg-[#D4AF37]/15 border-2 border-[#D4AF37]' : 'bg-[#FFF8DC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-[20px] font-bold text-[#52796F]">
                      {index + 1}.
                    </span>
                    <span className={`font-body text-[18px] font-medium ${
                      isLeader ? 'text-[#D4AF37]' : 'text-[#165B33]'
                    }`}>
                      {player.name}
                    </span>
                  </div>
                  <span className={`font-heading text-[24px] font-bold ${
                    player.score >= 0 ? 'text-[#165B33]' : 'text-[#C41E3A]'
                  }`}>
                    {player.score >= 0 ? '+' : ''}{player.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Round 2 teaser */}
        <div className="mt-8 text-center">
          <p className="font-body text-[16px] text-[#52796F]">
            Round 2: Things We Won&apos;t Shut Up About
          </p>
          <p className="mt-1 font-body text-[14px] text-[#52796F]/70">
            Your friends picked these categories for you
          </p>
        </div>

        {/* Start Round 2 Button */}
        <button
          onClick={handleStartRound2}
          className="mt-8 w-full py-5 bg-[#C41E3A] text-[#FFF8DC] font-body text-lg font-bold rounded-xl cursor-pointer transition-all duration-150 ease-out hover:bg-[#D4AF37] hover:text-[#165B33] active:scale-[0.98] shadow-lg"
          style={{ boxShadow: "0 4px 20px rgba(196,30,58,0.3)" }}
        >
          Start Round 2
        </button>
      </div>
    </main>
  );
}
