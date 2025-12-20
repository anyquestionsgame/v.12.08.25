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
import { SteampunkLayout, BrassButton, GameCard, GhostButton, Gear, GaugePanel, HolidayGarland } from '@/components/ui/qtc-components';
import AnimatedScore from '@/components/AnimatedScore';

interface PlayerData {
  name: string;
  goodAt: string;
  ratherDie: string;
}

interface PlayerScore {
  name: string;
  score: number;
}

type GamePhase = 'transition' | 'handoff' | 'announce' | 'clue' | 'perform' | 'success' | 'timeout' | 'final';

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
      setPhase('handoff');
      setCurrentPrompt(null);
      setSelectedGuesser(null);
      setPassedTo(null);
      setElapsedTime(0);
    }
  };

  const startHandoff = () => {
    setPhase('announce');
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
        setPhase('announce');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (players.length === 0) {
    return (
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </div>
      </SteampunkLayout>
    );
  }

  // TRANSITION SCREEN
  if (phase === 'transition') {
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex flex-col items-center justify-center">
          <div className="text-center animate-fadeInScale">
            <h1 className="font-heading text-[48px] font-bold text-qtc-brass-light">
              NO PRESSURE
            </h1>
            <p className="mt-4 font-body text-[16px] text-qtc-copper">
              (There&apos;s definitely pressure)
            </p>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // HANDOFF SCREEN (between rounds)
  if (phase === 'handoff') {
    const nextPerformer = players[performerIndex];
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center animate-fadeInScale">
            <h1 className="font-heading text-[48px] font-bold text-qtc-brass-light">
              {nextPerformer?.name.toUpperCase()} IS UP NEXT
            </h1>
            <p className="mt-4 font-body text-[16px] text-qtc-copper">
              Pass the phone now
            </p>
            <BrassButton
              onClick={startHandoff}
              variant="holiday"
              size="lg"
              className="mt-12"
            >
              READY
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 1 - Type Announcement
  if (phase === 'announce') {
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-teal-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {performer?.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top bar with scores */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider">
              Round {currentRound} of {players.length}
            </p>
            <div className="flex gap-4">
              {scores.map((s, i) => (
                <GaugePanel
                  key={i}
                  label={s.name}
                  value={s.score}
                  unit="pts"
                  className="scale-75"
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <h1 className="mt-4 font-heading text-[32px] font-bold text-qtc-brass-light text-center">
              {actualPerformer?.name.toUpperCase()}, THE CLOCK IS ALREADY RUNNING
            </h1>
            
            <div className="mt-8 w-[100px] h-[3px] bg-qtc-brass rounded-full" />
            
            <p className="mt-8 font-body text-[16px] text-qtc-copper text-center">
              Act it out. Draw it. Hum it. No words allowed.
            </p>
            
            {/* Escape hatch */}
            <GameCard variant="dark" className="mt-8 max-w-[360px]">
              <p className="font-body text-[14px] text-qtc-copper text-center">
                {ESCAPE_HATCH_TEXT}
              </p>
            </GameCard>
            
            <p className="mt-8 font-heading text-[24px] font-bold text-qtc-brass-light">
              {performer.name.toUpperCase()}, YOU&apos;RE UP!
            </p>
            
            <BrassButton
              onClick={showClue}
              variant="holiday"
              size="lg"
              className="mt-8"
            >
              SEE YOUR CLUE
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 2 - Clue Reveal
  if (phase === 'clue' && currentPrompt) {
    const eligiblePassTargets = players.filter(p => p.name !== performer.name);
    
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-teal-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {(passedTo || performer.name).toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Warning */}
          <p className="font-mono text-[14px] text-qtc-brass uppercase tracking-wider">
            Only {passedTo || performer.name} should see this!
          </p>
          
          {/* Category badge */}
          <p className="mt-6 font-mono text-[12px] font-medium uppercase tracking-wider text-qtc-brass">
            {currentPrompt.category}
          </p>
          
          {/* The clue */}
          <GameCard variant="teal" className="mt-4 max-w-[400px]">
            <p className="font-heading text-[32px] font-normal text-qtc-cream text-center leading-relaxed">
              {currentPrompt.clue}
            </p>
          </GameCard>
          
          {/* Pass option (only if not already passed) */}
          {!passedTo && (
            <div className="mt-8">
              <p className="font-body text-[14px] text-qtc-copper text-center mb-4">
                Don&apos;t know this? Pass to someone else:
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                {eligiblePassTargets.map((player, i) => (
                  <GhostButton
                    key={i}
                    onClick={() => passToSomeone(player.name)}
                    className="px-4 py-2"
                  >
                    Pass to {player.name}
                  </GhostButton>
                ))}
              </div>
            </div>
          )}
          
          {passedTo && (
            <p className="mt-6 font-body text-[14px] text-qtc-brass">
              Passed! {passedTo} gets +1 point automatically.
            </p>
          )}
          
          <BrassButton
            onClick={startPerforming}
            variant="holiday"
            size="lg"
            className="mt-8"
          >
            START PERFORMING
          </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 3 - Performance Timer
  if (phase === 'perform') {
    const timing = getTimingForType(currentType);
    const maxTime = timing.slow;
    const zone = getTimeZone();
    
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-teal-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {actualPerformer?.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top info */}
          <div className="px-6 py-4 text-center border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-body text-[14px] text-qtc-copper">
              {actualPerformer?.name} is performing...
            </p>
            <p className="font-heading text-[20px] font-bold text-qtc-brass-light mt-1">
              EVERYONE ELSE: GUESS!
            </p>
          </div>

          {/* Timer */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <p className={`font-mono text-[80px] font-bold ${
              zone === 'fast' ? 'text-qtc-holiday-green' :
              zone === 'medium' ? 'text-qtc-brass' :
              'text-qtc-holiday-red'
            }`}>
              {formatTime(timer)}
            </p>
            
            {/* Progress bar with zones */}
            <div className="mt-8 w-full max-w-[360px]">
              <div className="flex rounded-lg overflow-hidden h-3">
                <div 
                  className={`transition-all ${zone === 'fast' ? 'bg-qtc-holiday-green' : 'bg-qtc-holiday-green/30'}`}
                  style={{ width: `${(timing.fast / maxTime) * 100}%` }}
                />
                <div 
                  className={`transition-all ${zone === 'medium' ? 'bg-qtc-brass' : 'bg-qtc-brass/30'}`}
                  style={{ width: `${((timing.medium - timing.fast) / maxTime) * 100}%` }}
                />
                <div 
                  className={`transition-all ${zone === 'slow' ? 'bg-qtc-holiday-red' : 'bg-qtc-holiday-red/30'}`}
                  style={{ width: `${((timing.slow - timing.medium) / maxTime) * 100}%` }}
                />
              </div>
              
              {/* Zone labels */}
              <div className="flex mt-2 text-[12px] font-body">
                <div className="text-qtc-holiday-green" style={{ width: `${(timing.fast / maxTime) * 100}%` }}>
                  3pts
                </div>
                <div className="text-qtc-brass" style={{ width: `${((timing.medium - timing.fast) / maxTime) * 100}%` }}>
                  2pts
                </div>
                <div className="text-qtc-holiday-red" style={{ width: `${((timing.slow - timing.medium) / maxTime) * 100}%` }}>
                  1pt
                </div>
              </div>
            </div>
            
            {/* Guess button */}
            <BrassButton
              onClick={someoneGuessed}
              variant="primary"
              size="lg"
              className="mt-12 w-full max-w-[360px] bg-qtc-holiday-green text-qtc-cream"
            >
              SOMEONE GUESSED IT!
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
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
      <SteampunkLayout variant="holiday" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-holiday-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {actualPerformerName.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-mono text-[14px] text-qtc-holiday-green uppercase tracking-wider">
            Got it!
          </p>
          
          <h1 className="mt-4 font-heading text-[28px] font-bold text-qtc-brass-light text-center">
            WHO GUESSED IT?
          </h1>
          
          {/* Player buttons */}
          <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[320px]">
            {eligibleGuessers.map((player, index) => (
              <button
                key={index}
                onClick={() => selectGuesser(player.name)}
                className={`
                  p-5 rounded-xl font-heading text-[18px] font-bold border-2
                  transition-all duration-150 ease-out cursor-pointer active:scale-[0.96]
                  ${selectedGuesser === player.name
                    ? 'bg-brass-gradient text-qtc-black border-qtc-brass-light/30 shadow-brass'
                    : 'bg-qtc-charcoal text-qtc-cream border-qtc-brass/50 hover:border-qtc-brass'
                  }
                `}
              >
                {player.name}
              </button>
            ))}
          </div>
          
          {/* Points preview */}
          {selectedGuesser && (
            <GameCard variant="brass" className="mt-8">
              <p className="font-body text-[14px] text-qtc-copper text-center">
                Time: {elapsedTime}s = {points} points each
              </p>
              <div className="mt-4 flex gap-6 justify-center">
                <div className="text-center">
                  <p className="font-body text-[12px] text-qtc-copper">{actualPerformerName}</p>
                  <p className="font-heading text-[24px] font-bold text-qtc-brass">+{points}</p>
                </div>
                <div className="text-center">
                  <p className="font-body text-[12px] text-qtc-copper">{selectedGuesser}</p>
                  <p className="font-heading text-[24px] font-bold text-qtc-brass">+{points}</p>
                </div>
              </div>
            </GameCard>
          )}
          
          <BrassButton
            onClick={confirmSuccess}
            disabled={!selectedGuesser}
            variant={selectedGuesser ? "holiday" : "secondary"}
            size="lg"
            className="mt-8"
          >
            NEXT ROUND
          </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 5 - Timeout
  if (phase === 'timeout' && currentPrompt) {
    const actualPerformerName = passedTo || performer.name;
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-teal-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {actualPerformerName.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-mono text-[14px] text-qtc-holiday-red uppercase tracking-wider">
            Time&apos;s Up!
          </p>
          
          <h1 className="mt-4 font-heading text-[32px] font-bold text-qtc-brass-light text-center">
            No one got it
          </h1>
          
          <GameCard variant="dark" className="mt-8 max-w-[360px]">
            <p className="font-body text-[14px] text-qtc-copper text-center mb-2">
              It was:
            </p>
            <p className="font-heading text-[24px] font-normal text-qtc-cream text-center">
              &ldquo;{currentPrompt.clue}&rdquo;
            </p>
          </GameCard>
          
          <p className="mt-6 font-body text-[16px] text-qtc-copper">
            No points this round
          </p>
          
          <BrassButton
            onClick={nextRound}
            variant="holiday"
            size="lg"
            className="mt-8"
          >
            {currentRound >= players.length ? 'SEE FINAL SCORES' : 'NEXT ROUND'}
          </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 6 - Final Scores
  if (phase === 'final') {
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const winner = sortedScores[0];
    
    return (
      <SteampunkLayout variant="holiday">
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
          <HolidayGarland className="mb-6" />
          
          <p className="font-mono text-[13px] text-qtc-copper uppercase tracking-wider">
            Performance Complete
          </p>
          
          <h1 className="mt-4 font-heading text-[42px] font-bold text-qtc-brass-light text-center">
            {winner.name.toUpperCase()} WINS!
          </h1>
          
          <div className="mt-4 w-[100px] h-[3px] bg-qtc-brass rounded-full" />
          
          {/* Final scoreboard */}
          <div className="mt-10 w-full max-w-[320px] space-y-3">
            {sortedScores.map((s, i) => (
              <GameCard
                key={i}
                variant={i === 0 ? "brass" : "dark"}
                className={i === 0 ? 'bg-brass-gradient text-qtc-black' : ''}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`font-heading text-[20px] font-bold ${i === 0 ? 'text-qtc-black' : 'text-qtc-copper'}`}>
                      {i + 1}
                    </span>
                    <span className={`font-body text-[18px] font-medium ${i === 0 ? 'text-qtc-black' : 'text-qtc-cream'}`}>
                      {s.name}
                    </span>
                  </div>
                  <AnimatedScore 
                    value={s.score} 
                    className={`font-heading text-[24px] font-bold ${i === 0 ? 'text-qtc-black' : 'text-qtc-brass'}`} 
                  />
                </div>
              </GameCard>
            ))}
          </div>
          
          <BrassButton
            onClick={handleGameComplete}
            variant="holiday"
            size="lg"
            className="mt-12"
          >
            CONTINUE
          </BrassButton>
          
          <GhostButton
            onClick={() => router.push('/')}
            className="mt-4"
          >
            Back to Home
          </GhostButton>
        </main>
      </SteampunkLayout>
    );
  }

  return null;
}

