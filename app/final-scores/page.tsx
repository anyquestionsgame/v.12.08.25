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
import { SteampunkLayout, BrassButton, GhostButton, GameCard, HolidayGarland, Gear } from '@/components/ui/qtc-components';

function FinalScoresContent({ session: initialSession }: { session: GameSession }) {
  const router = useRouter();
  const [scoreboard, setScoreboard] = useState<Player[]>([]);
  const [winners, setWinners] = useState<Player[]>([]);
  const [showGameBreakdown, setShowGameBreakdown] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    try {
      const testingMode = localStorage.getItem('qtc_testing_mode') === 'true';
      setIsTestingMode(testingMode);
      
      const scoreboardData = getScoreboard(initialSession);
      const winnersData = getWinners(initialSession);
      
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
    } catch (error) {
      console.error('Error loading final scores:', error);
      router.push('/');
    }
  }, [initialSession, router]);

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
    if (!initialSession?.gameScores[gameType]) return 0;
    return initialSession.gameScores[gameType][playerName] || 0;
  };

  const isTie = winners.length > 1;

  return (
    <SteampunkLayout variant="holiday">
      <main className="min-h-screen flex flex-col items-center px-6 py-12 animate-fadeIn relative">
        {showConfetti && <Confetti />}
        <HolidayGarland className="mb-6" />
        
        {/* Celebration header */}
        <div className="text-center animate-slideUp">
          <p className="font-mono text-[14px] text-qtc-brass uppercase tracking-wider">
            {initialSession.selectedGames.length} {initialSession.selectedGames.length === 1 ? 'Game' : 'Games'} Complete
          </p>
          
          <h1 className="mt-4 font-heading text-[48px] font-bold text-qtc-brass-light">
            GAME OVER
          </h1>
          
          <div className="mt-4 w-[100px] h-[3px] bg-qtc-brass rounded-full mx-auto" />
        </div>

        {/* Winner announcement */}
        <div className="mt-10 text-center animate-slideUp">
          <p className="font-mono text-[14px] text-qtc-copper uppercase tracking-wider">
            {isTie ? 'Winners' : 'Winner'}
          </p>
          
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="text-4xl animate-pulse-slow">🏆</span>
            <h2 className="font-heading text-[36px] font-bold text-qtc-brass animate-glow">
              {winners.map(w => w.name.toUpperCase()).join(' & ')}
            </h2>
            <span className="text-4xl animate-pulse-slow">🏆</span>
          </div>
          
          <p className="mt-2 font-mono text-[24px] text-qtc-cream">
            <AnimatedScore value={winners[0]?.totalScore || 0} /> points
          </p>
        </div>

        {/* Full scoreboard */}
        <div className="mt-10 w-full max-w-[360px]">
          <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider text-center mb-4">
            Final Standings
          </p>
          
          <div className="space-y-3">
            {scoreboard.map((player, i) => {
              const isWinner = winners.some(w => w.name === player.name);
              return (
                <GameCard
                  key={player.name}
                  variant={isWinner ? "brass" : "dark"}
                  className={isWinner ? 'bg-brass-gradient text-qtc-black animate-glow' : ''}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`font-heading text-[24px] font-bold ${isWinner ? 'text-qtc-black' : 'text-qtc-copper'}`}>
                        {i + 1}
                      </span>
                      <span className={`font-body text-[18px] font-medium ${isWinner ? 'text-qtc-black' : 'text-qtc-cream'}`}>
                        {player.name}
                      </span>
                      {isWinner && <span className="text-xl">🏆</span>}
                    </div>
                    <AnimatedScore 
                      value={player.totalScore} 
                      className={`font-heading text-[28px] font-bold ${isWinner ? 'text-qtc-black' : 'text-qtc-brass'}`}
                    />
                  </div>
                </GameCard>
              );
            })}
          </div>
        </div>

        {/* Game breakdown accordion */}
        <div className="mt-10 w-full max-w-[360px]">
          <button
            onClick={() => setShowGameBreakdown(!showGameBreakdown)}
            className="w-full flex items-center justify-between py-3 font-mono text-[14px] text-qtc-copper uppercase tracking-wider cursor-pointer hover:text-qtc-brass transition-colors"
          >
            <span>Score Breakdown by Game</span>
            <span className="text-[18px]">{showGameBreakdown ? '−' : '+'}</span>
          </button>
          
          {showGameBreakdown && (
            <div className="mt-4 space-y-6">
              {initialSession.selectedGames.map((gameType) => (
                <GameCard key={gameType} variant="dark" className="p-4">
                  <p className="font-mono text-[12px] text-qtc-brass uppercase tracking-wider mb-3">
                    {GAME_NAMES[gameType]}
                  </p>
                  
                  <div className="space-y-2">
                    {scoreboard.map((player) => {
                      const gameScore = getGameScoreForPlayer(gameType, player.name);
                      return (
                        <div key={player.name} className="flex items-center justify-between">
                          <span className="font-body text-[14px] text-qtc-cream">{player.name}</span>
                          <span className="font-mono text-[16px] text-qtc-copper">{gameScore} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </GameCard>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-12 w-full max-w-[360px] space-y-4">
          <BrassButton
            onClick={handlePlayAgain}
            variant="holiday"
            size="lg"
            className="w-full"
          >
            {isTestingMode ? 'TEST AGAIN' : 'PLAY AGAIN'}
          </BrassButton>
          
          <GhostButton
            onClick={handleNewGroup}
            className="w-full"
          >
            NEW GROUP
          </GhostButton>
        </div>
      </main>
    </SteampunkLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE WRAPPER - Required for Next.js
// ═══════════════════════════════════════════════════════════

export default function FinalScoresPage() {
  const router = useRouter();
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedSession = loadSession();
    if (!loadedSession) {
      router.push('/');
      return;
    }
    setSession(loadedSession);
    setLoading(false);
  }, [router]);

  if (loading || !session) {
    return (
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </div>
      </SteampunkLayout>
    );
  }

  return <FinalScoresContent session={session} />;
}

