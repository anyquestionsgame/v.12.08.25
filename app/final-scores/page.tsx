'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadSession,
  clearSession,
  getScoreboard,
  getWinners,
  GAME_NAMES,
  GameSession,
  Player,
  GameType
} from '@/app/lib/gameOrchestrator';
import AnimatedScore from '@/components/AnimatedScore';
import Loading from '@/components/Loading';
import Confetti from '@/components/Confetti';

export default function FinalScores() {
  const router = useRouter();
  const [session, setSession] = useState<GameSession | null>(null);
  const [scoreboard, setScoreboard] = useState<Player[]>([]);
  const [winners, setWinners] = useState<Player[]>([]);
  const [showGameBreakdown, setShowGameBreakdown] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    try {
      const loadedSession = loadSession();
      const testingMode = localStorage.getItem('qtc_testing_mode') === 'true';
      setIsTestingMode(testingMode);
      
      if (loadedSession) {
        setSession(loadedSession);
        const scoreboardData = getScoreboard(loadedSession);
        const winnersData = getWinners(loadedSession);
        
        if (scoreboardData.length === 0) {
          console.error('No scoreboard data - redirecting to home');
          router.push('/');
          return;
        }
        
        setScoreboard(scoreboardData);
        setWinners(winnersData);
        // Show confetti for winners
        if (winnersData.length > 0) {
          setShowConfetti(true);
          // Hide confetti after 3 seconds
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } else {
        console.error('No session found - redirecting to home');
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading final scores:', error);
      router.push('/');
    }
  }, [router]);

  const handlePlayAgain = () => {
    try {
      clearSession();
      router.push(isTestingMode ? '/test-setup' : '/games');
    } catch (error) {
      console.error('Error in handlePlayAgain:', error);
      router.push('/');
    }
  };

  const handleNewGroup = () => {
    try {
      clearSession();
      localStorage.removeItem('players');
      localStorage.removeItem('qtc_players');
      localStorage.removeItem('playerCount');
      localStorage.removeItem('qtc_savagery');
      localStorage.removeItem('qtc_location');
      router.push('/');
    } catch (error) {
      console.error('Error in handleNewGroup:', error);
      router.push('/');
    }
  };

  const getGameScoreForPlayer = (gameType: GameType, playerName: string): number => {
    if (!session?.gameScores[gameType]) return 0;
    return session.gameScores[gameType][playerName] || 0;
  };

  if (!session) {
    return <Loading />;
  }

  const isTie = winners.length > 1;

  return (
    <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center px-6 py-12 animate-fadeIn relative">
      {showConfetti && <Confetti />}
      {/* Celebration header */}
      <div className="text-center animate-slideUp">
        <p className="font-body text-[14px] text-[#D4A574] uppercase tracking-wider">
          {session.selectedGames.length} {session.selectedGames.length === 1 ? 'Game' : 'Games'} Complete
        </p>
        
        <h1 className="mt-4 font-heading text-[48px] font-bold text-[#F0EEE9]">
          GAME OVER
        </h1>
        
        <div className="mt-4 w-[100px] h-[3px] bg-[#D4A574] rounded-full mx-auto" />
      </div>

      {/* Winner announcement */}
      <div className="mt-10 text-center animate-slideUp">
        <p className="font-body text-[14px] text-[#9B9388] uppercase tracking-wider">
          {isTie ? 'Winners' : 'Winner'}
        </p>
        
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="text-4xl animate-pulse-slow">🏆</span>
          <h2 className="font-heading text-[36px] font-bold text-[#D4A574] animate-glow">
            {winners.map(w => w.name.toUpperCase()).join(' & ')}
          </h2>
          <span className="text-4xl animate-pulse-slow">🏆</span>
        </div>
        
        <p className="mt-2 font-mono text-[24px] text-[#F0EEE9]">
          <AnimatedScore value={winners[0]?.totalScore || 0} /> points
        </p>
      </div>

      {/* Full scoreboard */}
      <div className="mt-10 w-full max-w-[360px]">
        <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider text-center mb-4">
          Final Standings
        </p>
        
        <div className="space-y-3">
          {scoreboard.map((player, i) => {
            const isWinner = winners.some(w => w.name === player.name);
            return (
              <div
                key={player.name}
                className={`
                  flex items-center justify-between p-4 rounded-lg transition-all duration-300
                  ${isWinner ? 'bg-[#D4A574] text-[#1F1E1C] animate-glow' : 'bg-[#2D2B28] text-[#F0EEE9]'}
                `}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <span className={`font-heading text-[24px] font-bold ${isWinner ? 'text-[#1F1E1C]' : 'text-[#9B9388]'}`}>
                    {i + 1}
                  </span>
                  <span className="font-body text-[18px] font-medium">{player.name}</span>
                  {isWinner && <span className="text-xl">🏆</span>}
                </div>
                <AnimatedScore 
                  value={player.totalScore} 
                  className="font-heading text-[28px] font-bold"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Game breakdown accordion */}
      <div className="mt-10 w-full max-w-[360px]">
        <button
          onClick={() => setShowGameBreakdown(!showGameBreakdown)}
          className="w-full flex items-center justify-between py-3 font-body text-[14px] text-[#9B9388] uppercase tracking-wider cursor-pointer hover:text-[#F0EEE9] transition-colors"
        >
          <span>Score Breakdown by Game</span>
          <span className="text-[18px]">{showGameBreakdown ? '−' : '+'}</span>
        </button>
        
        {showGameBreakdown && (
          <div className="mt-4 space-y-6">
            {session.selectedGames.map((gameType) => (
              <div key={gameType} className="bg-[#2D2B28] rounded-lg p-4">
                <p className="font-body text-[12px] text-[#D4A574] uppercase tracking-wider mb-3">
                  {GAME_NAMES[gameType]}
                </p>
                
                <div className="space-y-2">
                  {scoreboard.map((player) => {
                    const gameScore = getGameScoreForPlayer(gameType, player.name);
                    return (
                      <div key={player.name} className="flex items-center justify-between">
                        <span className="font-body text-[14px] text-[#F0EEE9]">{player.name}</span>
                        <span className="font-mono text-[16px] text-[#9B9388]">{gameScore} pts</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-12 w-full max-w-[360px] space-y-4">
        <button
          onClick={handlePlayAgain}
          className="w-full py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
        >
          {isTestingMode ? 'TEST AGAIN' : 'PLAY AGAIN'}
        </button>
        
        <button
          onClick={handleNewGroup}
          className="w-full py-4 bg-transparent border-2 border-[#F0EEE9] text-[#F0EEE9] font-body text-[16px] font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:bg-[#F0EEE9] hover:text-[#1F1E1C] select-none"
        >
          NEW GROUP
        </button>
      </div>
    </main>
  );
}

