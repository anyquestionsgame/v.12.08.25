'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  generateMostLikelyToPrompt, 
  MOST_LIKELY_TO_SCORING,
  SavageryLevel,
  VoteResult
} from '@/app/lib/mostLikelyToEngine';
import { 
  loadSession, 
  updateGameScores, 
  advanceToNextGame, 
  saveSession, 
  isSessionComplete, 
  GAME_ROUTES,
  getCurrentGame
} from '@/app/lib/gameOrchestrator';

interface PlayerData {
  name: string;
  goodAt: string;
  ratherDie: string;
}

interface PlayerScore {
  name: string;
  score: number;
}

type GamePhase = 'transition' | 'handoff' | 'intro' | 'prediction' | 'countdown' | 'results' | 'final';

export default function MostLikelyTo() {
  const router = useRouter();
  
  // Game state
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(5); // 5 rounds per game
  const [readerIndex, setReaderIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('transition');
  const [savageryLevel, setSavageryLevel] = useState<SavageryLevel>('standard');
  
  // Round state
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [usedPrompts, setUsedPrompts] = useState<string[]>([]);
  const [readerPrediction, setReaderPrediction] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(6);
  const [voteResults, setVoteResults] = useState<VoteResult[]>([]);
  const [winners, setWinners] = useState<string[]>([]);

  // Load player data and session
  useEffect(() => {
    try {
      const session = loadSession();
      if (!session) {
        console.error('No session found - redirecting to games');
        router.push('/games');
        return;
      }
      
      const currentSavagery = session.savageryLevel || 'standard';
      setSavageryLevel(currentSavagery);
      
      const storedPlayers = localStorage.getItem('players') || localStorage.getItem('qtc_players');
      if (storedPlayers) {
        const playerData: PlayerData[] = JSON.parse(storedPlayers);
        
        // Handle both data formats
        const formattedPlayers = playerData.map((p: any) => ({
          name: p.name || 'Unknown',
          goodAt: p.goodAt || p.expertise || 'General Knowledge',
          ratherDie: p.ratherDie || p.ratherDieThan || ''
        }));
        
        if (formattedPlayers.length === 0) {
          console.error('No valid players found');
          router.push('/setup');
          return;
        }
        
        setPlayers(formattedPlayers);
        setScores(formattedPlayers.map(p => ({ name: p.name, score: 0 })));
        
        // Generate first prompt
        const allRatherDieThan = formattedPlayers.map(p => p.ratherDie).filter(Boolean);
        const prompt = generateMostLikelyToPrompt(currentSavagery, allRatherDieThan, []);
        setCurrentPrompt(prompt);
        setUsedPrompts([prompt]);
      } else {
        console.error('No players found - redirecting to setup');
        router.push('/setup');
      }
    } catch (error) {
      console.error('Error loading game data:', error);
      router.push('/setup');
    }
  }, [router]);

  // Countdown effect
  useEffect(() => {
    if (phase !== 'countdown' || countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // When countdown hits 0, move to manual vote collection
  useEffect(() => {
    if (phase === 'countdown' && countdown === 0) {
      // Stay on countdown screen showing "POINT NOW!"
    }
  }, [phase, countdown]);

  const getNextPrompt = useCallback(() => {
    const allRatherDieThan = players.map(p => p.ratherDie).filter(Boolean);
    const prompt = generateMostLikelyToPrompt(savageryLevel, allRatherDieThan, usedPrompts);
    setUsedPrompts(prev => [...prev, prompt]);
    return prompt;
  }, [players, savageryLevel, usedPrompts]);

  const startRound = () => {
    setPhase('prediction');
  };

  const submitPrediction = (playerName: string) => {
    setReaderPrediction(playerName);
    setCountdown(6);
    setPhase('countdown');
  };

  const recordVotes = (votedPlayer: string, voteCount: number) => {
    setVoteResults(prev => {
      const existing = prev.find(v => v.playerName === votedPlayer);
      if (existing) {
        return prev.map(v => 
          v.playerName === votedPlayer 
            ? { ...v, votes: v.votes + voteCount }
            : v
        );
      }
      return [...prev, { playerName: votedPlayer, votes: voteCount }];
    });
  };

  const finalizeResults = () => {
    // Sort results
    const sorted = [...voteResults].sort((a, b) => b.votes - a.votes);
    
    // Find winners (handle ties)
    const maxVotes = sorted[0]?.votes || 0;
    const roundWinners = sorted.filter(r => r.votes === maxVotes).map(r => r.playerName);
    setWinners(roundWinners);
    
    // Award points
    setScores(prev => prev.map(s => {
      let newScore = s.score;
      
      // Reader gets points if they guessed correctly
      if (s.name === players[readerIndex].name && roundWinners.includes(readerPrediction || '')) {
        newScore += MOST_LIKELY_TO_SCORING.readerGuessedCorrect;
      }
      
      // Winners get points (ties each get 1)
      if (roundWinners.includes(s.name)) {
        newScore += roundWinners.length > 1 
          ? MOST_LIKELY_TO_SCORING.tie 
          : MOST_LIKELY_TO_SCORING.mostVotes;
      }
      
      return { ...s, score: newScore };
    }));
    
    setPhase('results');
  };

  const nextRound = () => {
    if (currentRound >= totalRounds) {
      setPhase('final');
    } else {
      // Next round
      setCurrentRound(prev => prev + 1);
      setReaderIndex(prev => (prev + 1) % players.length);
      setPhase('handoff');
      setReaderPrediction(null);
      setVoteResults([]);
      setWinners([]);
      setCurrentPrompt(getNextPrompt());
    }
  };

  const startHandoff = () => {
    setPhase('intro');
  };

  const handleGameComplete = () => {
    try {
      const finalScores: Record<string, number> = {};
      scores.forEach(s => {
        if (s.name) {
          finalScores[s.name] = s.score || 0;
        }
      });

      let session = loadSession();
      
      if (!session) {
        console.error('No session found - redirecting to games');
        router.push('/games');
        return;
      }
      
      session = updateGameScores(session, 'mostLikelyTo', finalScores);
      session = advanceToNextGame(session);
      saveSession(session);
      
      const isTestingMode = localStorage.getItem('qtc_testing_mode') === 'true';
      
      if (isSessionComplete(session)) {
        router.push(isTestingMode ? '/test-setup' : '/final-scores');
      } else {
        const nextGame = getCurrentGame(session);
        if (nextGame && GAME_ROUTES[nextGame]) {
          router.push(GAME_ROUTES[nextGame]);
        } else {
          console.error('Invalid next game - going to final scores');
          router.push(isTestingMode ? '/test-setup' : '/final-scores');
        }
      }
    } catch (error) {
      console.error('Error completing game:', error);
      router.push('/games');
    }
  };

  const playAgain = () => {
    router.push('/games');
  };

  // Auto-advance from transition to intro
  useEffect(() => {
    if (phase === 'transition') {
      const timer = setTimeout(() => {
        setPhase('intro');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const reader = players[readerIndex];

  if (players.length === 0) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex items-center justify-center">
        <p className="font-body text-[16px] text-[#9B9388]">Loading...</p>
      </main>
    );
  }

  // TRANSITION SCREEN
  if (phase === 'transition') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center">
        <div className="text-center animate-fadeInScale">
          <h1 className="font-heading text-[48px] font-bold text-[#F0EEE9]">
            JUDGMENT TIME
          </h1>
          <p className="mt-4 font-body text-[16px] text-[#9B9388]">
            Democracy, but make it chaotic
          </p>
        </div>
      </main>
    );
  }

  // HANDOFF SCREEN (between rounds)
  if (phase === 'handoff') {
    const nextReader = players[readerIndex];
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <div className="text-center animate-fadeInScale">
          <h1 className="font-heading text-[48px] font-bold text-[#F0EEE9]">
            {nextReader?.name.toUpperCase()} IS UP NEXT
          </h1>
          <p className="mt-4 font-body text-[16px] text-[#9B9388]">
            Pass the phone now
          </p>
          <button
            onClick={startHandoff}
            className="mt-12 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            READY
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 1 - Round Intro
  if (phase === 'intro') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#D4A574] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {reader?.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar with scores */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            Round {currentRound} of {totalRounds}
          </p>
          <div className="flex gap-4">
            {scores.map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-body text-[11px] text-[#9B9388]">{s.name}</p>
                <p className="font-heading text-[16px] font-bold text-[#D4A574]">{s.score}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-body text-[13px] text-[#9B9388] uppercase tracking-wider">
            Most Likely To
          </p>
          
          <div className="mt-8 p-6 bg-[#2D2B28] rounded-xl max-w-[360px]">
            <p className="font-heading text-[24px] font-normal text-[#F0EEE9] text-center leading-relaxed">
              &ldquo;{currentPrompt}&rdquo;
            </p>
          </div>
          
          <p className="mt-8 font-body text-[16px] text-[#9B9388] text-center max-w-[300px]">
            Vote for who fits. Argue about it later.
          </p>
          
          <button
            onClick={startRound}
            className="mt-12 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            MAKE MY PREDICTION
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 2 - Reader Makes Prediction
  if (phase === 'prediction') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#D4A574] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {reader?.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            {reader.name}&apos;s Prediction
          </p>
          <p className="font-body text-[12px] text-[#D4A574]">
            Don&apos;t let anyone see!
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h1 className="font-heading text-[28px] font-bold text-[#F0EEE9] text-center">
            WHO WILL WIN?
          </h1>
          
          <p className="mt-4 font-body text-[14px] text-[#9B9388] text-center">
            Tap who you think will get the most votes
          </p>
          
          {/* Player buttons */}
          <div className="mt-8 w-full max-w-[400px] grid grid-cols-2 gap-4">
            {players.map((player, index) => (
              <button
                key={index}
                onClick={() => submitPrediction(player.name)}
                className="p-5 bg-[#2D2B28] text-[#F0EEE9] rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:bg-[#F0EEE9] hover:text-[#1F1E1C] active:scale-[0.96]"
              >
                {player.name}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // SCREEN 3 - Countdown
  if (phase === 'countdown') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#D4A574] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {reader?.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
        {countdown > 0 ? (
          <>
            <p className="font-body text-[16px] text-[#9B9388] uppercase tracking-wider">
              Everyone get ready to point...
            </p>
            
            <p className="mt-8 font-heading text-[120px] font-bold text-[#D4A574]">
              {countdown}
            </p>
            
            <p className="mt-4 font-heading text-[24px] text-[#F0EEE9]">
              {currentPrompt}
            </p>
          </>
        ) : (
          <>
            <p className="font-heading text-[64px] font-bold text-[#F0EEE9]">
              POINT NOW!
            </p>
            
            <p className="mt-8 font-body text-[18px] text-[#9B9388] text-center max-w-[300px]">
              Everyone point at who you think is most likely!
            </p>
            
            <div className="mt-12 w-full max-w-[400px]">
              <p className="font-body text-[14px] text-[#9B9388] text-center mb-4">
                Tap each person&apos;s name for each vote they received:
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {players.map((player, index) => {
                  const currentVotes = voteResults.find(v => v.playerName === player.name)?.votes || 0;
                  return (
                    <button
                      key={index}
                      onClick={() => recordVotes(player.name, 1)}
                      className="p-4 bg-[#2D2B28] rounded-xl transition-all duration-150 ease-out cursor-pointer hover:bg-[#3D3B38] active:scale-[0.96]"
                    >
                      <p className="font-heading text-[18px] font-bold text-[#F0EEE9]">
                        {player.name}
                      </p>
                      <p className="mt-1 font-mono text-[24px] text-[#D4A574]">
                        {currentVotes}
                      </p>
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={finalizeResults}
                disabled={voteResults.length === 0}
                className={`
                  mt-8 w-full py-5 font-body text-lg font-bold rounded-lg cursor-pointer
                  transition-all duration-150 ease-out select-none
                  ${voteResults.length > 0
                    ? 'bg-[#F0EEE9] text-[#1F1E1C] hover:opacity-90 hover:scale-[0.98] active:scale-[0.96]'
                    : 'bg-transparent border-2 border-[#9B9388] text-[#9B9388] cursor-not-allowed'
                  }
                `}
              >
                COUNT VOTES
              </button>
            </div>
          </>
        )}
        </div>
      </main>
    );
  }

  // SCREEN 4 - Results
  if (phase === 'results') {
    const readerCorrect = winners.includes(readerPrediction || '');
    const sortedResults = [...voteResults].sort((a, b) => b.votes - a.votes);
    
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#D4A574] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {reader?.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            Round {currentRound} Results
          </p>
          <div className="flex gap-4">
            {scores.map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-body text-[11px] text-[#9B9388]">{s.name}</p>
                <p className="font-heading text-[16px] font-bold text-[#D4A574]">{s.score}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-body text-[13px] text-[#9B9388] uppercase tracking-wider">
            Most votes go to...
          </p>
          
          <h1 className="mt-4 font-heading text-[42px] font-bold text-[#D4A574] text-center">
            {winners.length > 1 ? winners.join(' & ') : winners[0]}
          </h1>
          
          {/* Vote breakdown */}
          <div className="mt-8 w-full max-w-[300px] space-y-2">
            {sortedResults.map((result, i) => (
              <div
                key={i}
                className={`
                  flex items-center justify-between p-3 rounded-lg
                  ${winners.includes(result.playerName) ? 'bg-[#D4A574]/20' : 'bg-[#2D2B28]'}
                `}
              >
                <span className="font-body text-[16px] text-[#F0EEE9]">{result.playerName}</span>
                <span className="font-mono text-[18px] text-[#D4A574]">{result.votes} votes</span>
              </div>
            ))}
          </div>
          
          {/* Reader prediction reveal */}
          <div className="mt-8 p-4 bg-[#2D2B28] rounded-xl">
            <p className="font-body text-[14px] text-[#9B9388] text-center">
              {reader.name} predicted: <span className="text-[#F0EEE9] font-bold">{readerPrediction}</span>
            </p>
            <p className={`mt-2 font-heading text-[18px] text-center ${readerCorrect ? 'text-[#D4A574]' : 'text-[#9B9388]'}`}>
              {readerCorrect ? `Correct! +${MOST_LIKELY_TO_SCORING.readerGuessedCorrect} points` : 'Not quite!'}
            </p>
          </div>
          
          <button
            onClick={nextRound}
            className="mt-12 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            {currentRound >= totalRounds ? 'SEE FINAL SCORES' : 'NEXT ROUND'}
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 5 - Final Scores
  if (phase === 'final') {
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const winner = sortedScores[0];
    
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <p className="font-body text-[13px] text-[#9B9388] uppercase tracking-wider">
          Game Complete
        </p>
        
        <h1 className="mt-4 font-heading text-[42px] font-bold text-[#F0EEE9] text-center">
          {winner.name.toUpperCase()} WINS!
        </h1>
        
        <div className="mt-4 w-[100px] h-[3px] bg-[#D4A574] rounded-full" />
        
        {/* Final scoreboard */}
        <div className="mt-10 w-full max-w-[320px] space-y-3">
          {sortedScores.map((s, i) => (
            <div
              key={i}
              className={`
                flex items-center justify-between p-4 rounded-lg
                ${i === 0 ? 'bg-[#D4A574] text-[#1F1E1C]' : 'bg-[#2D2B28] text-[#F0EEE9]'}
              `}
            >
              <div className="flex items-center gap-3">
                <span className={`font-heading text-[20px] font-bold ${i === 0 ? 'text-[#1F1E1C]' : 'text-[#9B9388]'}`}>
                  {i + 1}
                </span>
                <span className="font-body text-[18px] font-medium">{s.name}</span>
              </div>
              <span className="font-heading text-[24px] font-bold">{s.score}</span>
            </div>
          ))}
        </div>
        
        <button
          onClick={handleGameComplete}
          className="mt-12 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
        >
          CONTINUE
        </button>
        
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-12 py-4 bg-transparent text-[#9B9388] font-body text-[16px] font-medium cursor-pointer transition-all duration-150 ease-out hover:text-[#F0EEE9] select-none"
        >
          Back to Home
        </button>
      </main>
    );
  }

  return null;
}

