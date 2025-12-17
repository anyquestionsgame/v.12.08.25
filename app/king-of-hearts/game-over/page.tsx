'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      // Try to get final scores from localStorage
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
    // Clear all King of Hearts game data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('king_of_hearts_players');
      localStorage.removeItem('king_of_hearts_game_state');
      localStorage.removeItem('king_of_hearts_final_scores');
      localStorage.removeItem('king_of_hearts_round');
    }
    router.push('/king-of-hearts');
  };

  const handleBackToHome = () => {
    // Clear all King of Hearts game data
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
      <main className="min-h-screen bg-[#FFF8DC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Sort players by score (high to low)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
      <div className="w-full max-w-[500px]">
        {/* Game Over */}
        <p className="font-body text-[14px] text-[#52796F] uppercase tracking-wider text-center">
          Game Complete
        </p>

        {/* Winner Announcement */}
        {winner && (
          <div className="mt-4 text-center">
            <h1 className="font-heading text-[48px] font-bold text-[#165B33]">
              {winner.name.toUpperCase()}
            </h1>
            <p className="font-heading text-[28px] font-bold text-[#D4AF37]">
              WINS! 🏆
            </p>
            <p className="mt-2 font-body text-[18px] text-[#52796F]">
              with {winner.score} points
            </p>
          </div>
        )}

        {/* Decorative divider */}
        <div className="mt-6 flex justify-center">
          <div className="w-[100px] h-[3px] bg-[#D4AF37] rounded-full" />
        </div>

        {/* Final Scoreboard */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: "0 4px 20px rgba(196,30,58,0.1)" }}>
          <p className="font-body text-[12px] text-[#D4AF37] uppercase tracking-wider mb-4 font-semibold">
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
                      ? 'bg-[#D4AF37] shadow-md' 
                      : 'bg-[#FFF8DC]'
                  }`}
                  style={isWinner ? { boxShadow: "0 4px 15px rgba(212,175,55,0.4)" } : {}}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-heading text-[20px] font-bold ${
                      isWinner ? 'text-white' : 'text-[#52796F]'
                    }`}>
                      {index + 1}.
                    </span>
                    <span className={`font-body text-[18px] font-medium ${
                      isWinner ? 'text-white' : 'text-[#165B33]'
                    }`}>
                      {player.name} {medal}
                    </span>
                  </div>
                  <span className={`font-heading text-[24px] font-bold ${
                    isWinner 
                      ? 'text-white' 
                      : player.score >= 0 ? 'text-[#165B33]' : 'text-[#C41E3A]'
                  }`}>
                    {player.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handlePlayAgain}
            className="w-full py-5 bg-[#C41E3A] text-[#FFF8DC] font-body text-lg font-bold rounded-xl cursor-pointer transition-all duration-150 ease-out hover:bg-[#D4AF37] hover:text-[#165B33] active:scale-[0.98] shadow-lg"
            style={{ boxShadow: "0 4px 20px rgba(196,30,58,0.3)" }}
          >
            Play Again
          </button>
          
          <button
            onClick={handleBackToHome}
            className="w-full py-4 bg-transparent text-[#52796F] font-body text-[16px] cursor-pointer hover:text-[#165B33] transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
