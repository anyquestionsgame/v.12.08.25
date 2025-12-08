'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  generatePerformancePrompt,
  getNextPerformanceType,
  calculatePerformanceScore,
  getTypeDisplayName,
  getTypeInstructions,
  getTimingForType,
  ESCAPE_HATCH_TEXT,
  PerformanceType,
  PerformancePrompt,
  SavageryLevel
} from '@/app/lib/performanceEngine';
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

type GamePhase = 'transition' | 'announce' | 'clue' | 'perform' | 'success' | 'timeout' | 'final';

export default function Performance() {
  const router = useRouter();
  
  // Game state
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [performerIndex, setPerformerIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('transition');
  const [savageryLevel, setSavageryLevel] = useState<SavageryLevel>('standard');
  
  // Round state
  const [currentType, setCurrentType] = useState<PerformanceType>('charades');
  const [currentPrompt, setCurrentPrompt] = useState<PerformancePrompt | null>(null);
  const [usedPrompts, setUsedPrompts] = useState<string[]>([]);
  const [selectedGuesser, setSelectedGuesser] = useState<string | null>(null);
  const [passedTo, setPassedTo] = useState<string | null>(null);
  
  // Timer
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

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
        
        // Set first type
        const type = getNextPerformanceType(1);
        setCurrentType(type);
      } else {
        console.error('No players found - redirecting to setup');
        router.push('/setup');
      }
    } catch (error) {
      console.error('Error loading game data:', error);
      router.push('/setup');
    }
  }, [router]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning) return;
    
    const maxTime = getTimingForType(currentType).slow;
    
    if (timer <= 0) {
      setIsTimerRunning(false);
      setPhase('timeout');
      return;
    }
    
    const interval = setInterval(() => {
      setTimer(prev => {
        const newTime = prev - 1;
        setElapsedTime(maxTime - newTime);
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timer, currentType]);

  const generateNewPrompt = () => {
    const allRatherDieThan = players.map(p => p.ratherDie).filter(Boolean);
    const prompt = generatePerformancePrompt(
      currentType,
      savageryLevel,
      allRatherDieThan,
      usedPrompts
    );
    setCurrentPrompt(prompt);
    setUsedPrompts(prev => [...prev, prompt.clue]);
  };

  const showClue = () => {
    generateNewPrompt();
    setPhase('clue');
  };

  const passToSomeone = (playerName: string) => {
    setPassedTo(playerName);
    // Passed player gets 1 point automatically
    setScores(prev => prev.map(s => 
      s.name === playerName ? { ...s, score: s.score + 1 } : s
    ));
    setPhase('clue');
  };

  const startPerforming = () => {
    const maxTime = getTimingForType(currentType).slow;
    setTimer(maxTime);
    setElapsedTime(0);
    startTimeRef.current = Date.now();
    setIsTimerRunning(true);
    setPhase('perform');
  };

  const someoneGuessed = () => {
    setIsTimerRunning(false);
    setPhase('success');
  };

  const selectGuesser = (guesserName: string) => {
    setSelectedGuesser(guesserName);
  };

  const confirmSuccess = () => {
    if (!selectedGuesser) return;
    
    const actualPerformer = passedTo || players[performerIndex].name;
    const points = calculatePerformanceScore(elapsedTime, currentType, true);
    
    // Award points to both performer and guesser
    setScores(prev => prev.map(s => {
      if (s.name === actualPerformer || s.name === selectedGuesser) {
        return { ...s, score: s.score + points };
      }
      return s;
    }));
    
    nextRound();
  };

  const nextRound = () => {
    if (currentRound >= players.length) {
      setPhase('final');
    } else {
      // Next round
      const nextRoundNum = currentRound + 1;
      setCurrentRound(nextRoundNum);
      setPerformerIndex(prev => (prev + 1) % players.length);
      setCurrentType(getNextPerformanceType(nextRoundNum));
      setPhase('transition');
      setCurrentPrompt(null);
      setSelectedGuesser(null);
      setPassedTo(null);
      setElapsedTime(0);
    }
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
      
      session = updateGameScores(session, 'performance', finalScores);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeZone = (): 'fast' | 'medium' | 'slow' | 'expired' => {
    const timing = getTimingForType(currentType);
    if (elapsedTime <= timing.fast) return 'fast';
    if (elapsedTime <= timing.medium) return 'medium';
    if (elapsedTime <= timing.slow) return 'slow';
    return 'expired';
  };

  const performer = players[performerIndex];
  const actualPerformer = passedTo ? players.find(p => p.name === passedTo) : performer;

  // Auto-advance from transition to announce
  useEffect(() => {
    if (phase === 'transition') {
      const timer = setTimeout(() => {
        setPhase('transition');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

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
            NO PRESSURE
          </h1>
          <p className="mt-4 font-body text-[16px] text-[#9B9388]">
            (There&apos;s definitely pressure)
          </p>
        </div>
      </main>
    );
  }

  // SCREEN 1 - Type Announcement
  if (phase === 'announce') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Top bar with scores */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            Round {currentRound} of {players.length}
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
          <h1 className="mt-4 font-heading text-[32px] font-bold text-[#F0EEE9] text-center">
            {actualPerformer?.name.toUpperCase()}, THE CLOCK IS ALREADY RUNNING
          </h1>
          
          <div className="mt-8 w-[100px] h-[3px] bg-[#D4A574] rounded-full" />
          
          <p className="mt-8 font-body text-[16px] text-[#9B9388] text-center">
            Act it out. Draw it. Hum it. No words allowed.
          </p>
          
          {/* Escape hatch */}
          <div className="mt-8 p-4 bg-[#2D2B28] rounded-xl max-w-[360px]">
            <p className="font-body text-[14px] text-[#9B9388] text-center">
              {ESCAPE_HATCH_TEXT}
            </p>
          </div>
          
          <p className="mt-8 font-heading text-[24px] font-bold text-[#F0EEE9]">
            {performer.name.toUpperCase()}, YOU&apos;RE UP!
          </p>
          
          <button
            onClick={showClue}
            className="mt-8 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            SEE YOUR CLUE
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 2 - Clue Reveal
  if (phase === 'clue' && currentPrompt) {
    const eligiblePassTargets = players.filter(p => p.name !== performer.name);
    
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        {/* Warning */}
        <p className="font-body text-[14px] text-[#D4A574] uppercase tracking-wider">
          Only {passedTo || performer.name} should see this!
        </p>
        
        {/* Category badge */}
        <p className="mt-6 font-body text-[12px] font-medium uppercase tracking-wider text-[#D4A574]">
          {currentPrompt.category}
        </p>
        
        {/* The clue */}
        <div className="mt-4 p-8 bg-[#2D2B28] rounded-xl max-w-[400px]">
          <p className="font-heading text-[32px] font-normal text-[#F0EEE9] text-center leading-relaxed">
            {currentPrompt.clue}
          </p>
        </div>
        
        {/* Pass option (only if not already passed) */}
        {!passedTo && (
          <div className="mt-8">
            <p className="font-body text-[14px] text-[#9B9388] text-center mb-4">
              Don&apos;t know this? Pass to someone else:
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              {eligiblePassTargets.map((player, i) => (
                <button
                  key={i}
                  onClick={() => passToSomeone(player.name)}
                  className="px-4 py-2 bg-transparent border-2 border-[#9B9388] text-[#9B9388] rounded-lg font-body text-[14px] cursor-pointer hover:border-[#F0EEE9] hover:text-[#F0EEE9] transition-all"
                >
                  Pass to {player.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {passedTo && (
          <p className="mt-6 font-body text-[14px] text-[#D4A574]">
            Passed! {passedTo} gets +1 point automatically.
          </p>
        )}
        
        <button
          onClick={startPerforming}
          className="mt-8 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
        >
          START PERFORMING
        </button>
      </main>
    );
  }

  // SCREEN 3 - Performance Timer
  if (phase === 'perform') {
    const timing = getTimingForType(currentType);
    const maxTime = timing.slow;
    const zone = getTimeZone();
    
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Top info */}
        <div className="px-6 py-4 text-center border-b border-[#2D2B28]">
          <p className="font-body text-[14px] text-[#9B9388]">
            {actualPerformer?.name} is performing...
          </p>
          <p className="font-heading text-[20px] font-bold text-[#F0EEE9] mt-1">
            EVERYONE ELSE: GUESS!
          </p>
        </div>

        {/* Timer */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className={`font-mono text-[80px] font-bold ${
            zone === 'fast' ? 'text-[#4A7C59]' :
            zone === 'medium' ? 'text-[#D4A574]' :
            'text-[#C45B4D]'
          }`}>
            {formatTime(timer)}
          </p>
          
          {/* Progress bar with zones */}
          <div className="mt-8 w-full max-w-[360px]">
            <div className="flex rounded-lg overflow-hidden h-3">
              <div 
                className={`transition-all ${zone === 'fast' ? 'bg-[#4A7C59]' : 'bg-[#4A7C59]/30'}`}
                style={{ width: `${(timing.fast / maxTime) * 100}%` }}
              />
              <div 
                className={`transition-all ${zone === 'medium' ? 'bg-[#D4A574]' : 'bg-[#D4A574]/30'}`}
                style={{ width: `${((timing.medium - timing.fast) / maxTime) * 100}%` }}
              />
              <div 
                className={`transition-all ${zone === 'slow' ? 'bg-[#C45B4D]' : 'bg-[#C45B4D]/30'}`}
                style={{ width: `${((timing.slow - timing.medium) / maxTime) * 100}%` }}
              />
            </div>
            
            {/* Zone labels */}
            <div className="flex mt-2 text-[12px] font-body">
              <div className="text-[#4A7C59]" style={{ width: `${(timing.fast / maxTime) * 100}%` }}>
                3pts
              </div>
              <div className="text-[#D4A574]" style={{ width: `${((timing.medium - timing.fast) / maxTime) * 100}%` }}>
                2pts
              </div>
              <div className="text-[#C45B4D]" style={{ width: `${((timing.slow - timing.medium) / maxTime) * 100}%` }}>
                1pt
              </div>
            </div>
          </div>
          
          {/* Guess button */}
          <button
            onClick={someoneGuessed}
            className="mt-12 w-full max-w-[360px] py-6 bg-[#4A7C59] text-[#F0EEE9] font-heading text-[24px] font-bold rounded-xl cursor-pointer transition-all duration-150 ease-out hover:opacity-90 active:scale-[0.98] select-none"
          >
            SOMEONE GUESSED IT!
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 4 - Success Input
  if (phase === 'success') {
    const eligibleGuessers = players.filter(p => 
      p.name !== (passedTo || performer.name)
    );
    const points = calculatePerformanceScore(elapsedTime, currentType, true);
    const actualPerformerName = passedTo || performer.name;
    
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <p className="font-body text-[14px] text-[#4A7C59] uppercase tracking-wider">
          Got it!
        </p>
        
        <h1 className="mt-4 font-heading text-[28px] font-bold text-[#F0EEE9] text-center">
          WHO GUESSED IT?
        </h1>
        
        {/* Player buttons */}
        <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[320px]">
          {eligibleGuessers.map((player, index) => (
            <button
              key={index}
              onClick={() => selectGuesser(player.name)}
              className={`
                p-5 rounded-xl font-heading text-[18px] font-bold
                transition-all duration-150 ease-out cursor-pointer active:scale-[0.96]
                ${selectedGuesser === player.name
                  ? 'bg-[#F0EEE9] text-[#1F1E1C]'
                  : 'bg-[#2D2B28] text-[#F0EEE9] hover:bg-[#3D3B38]'
                }
              `}
            >
              {player.name}
            </button>
          ))}
        </div>
        
        {/* Points preview */}
        {selectedGuesser && (
          <div className="mt-8 p-4 bg-[#2D2B28] rounded-xl">
            <p className="font-body text-[14px] text-[#9B9388] text-center">
              Time: {elapsedTime}s = {points} points each
            </p>
            <div className="mt-4 flex gap-6 justify-center">
              <div className="text-center">
                <p className="font-body text-[12px] text-[#9B9388]">{actualPerformerName}</p>
                <p className="font-heading text-[24px] font-bold text-[#D4A574]">+{points}</p>
              </div>
              <div className="text-center">
                <p className="font-body text-[12px] text-[#9B9388]">{selectedGuesser}</p>
                <p className="font-heading text-[24px] font-bold text-[#D4A574]">+{points}</p>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={confirmSuccess}
          disabled={!selectedGuesser}
          className={`
            mt-8 px-12 py-5 font-body text-lg font-bold rounded-lg cursor-pointer
            transition-all duration-150 ease-out select-none
            ${selectedGuesser
              ? 'bg-[#F0EEE9] text-[#1F1E1C] hover:opacity-90 hover:scale-[0.98] active:scale-[0.96]'
              : 'bg-transparent border-2 border-[#9B9388] text-[#9B9388] cursor-not-allowed'
            }
          `}
        >
          NEXT ROUND
        </button>
      </main>
    );
  }

  // SCREEN 5 - Timeout
  if (phase === 'timeout' && currentPrompt) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <p className="font-body text-[14px] text-[#C45B4D] uppercase tracking-wider">
          Time&apos;s Up!
        </p>
        
        <h1 className="mt-4 font-heading text-[32px] font-bold text-[#F0EEE9] text-center">
          No one got it
        </h1>
        
        <div className="mt-8 p-6 bg-[#2D2B28] rounded-xl max-w-[360px]">
          <p className="font-body text-[14px] text-[#9B9388] text-center mb-2">
            It was:
          </p>
          <p className="font-heading text-[24px] font-normal text-[#F0EEE9] text-center">
            &ldquo;{currentPrompt.clue}&rdquo;
          </p>
        </div>
        
        <p className="mt-6 font-body text-[16px] text-[#9B9388]">
          No points this round
        </p>
        
        <button
          onClick={nextRound}
          className="mt-8 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
        >
          {currentRound >= players.length ? 'SEE FINAL SCORES' : 'NEXT ROUND'}
        </button>
      </main>
    );
  }

  // SCREEN 6 - Final Scores
  if (phase === 'final') {
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const winner = sortedScores[0];
    
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <p className="font-body text-[13px] text-[#9B9388] uppercase tracking-wider">
          Performance Complete
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

