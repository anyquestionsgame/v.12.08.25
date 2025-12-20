'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateEssencePrompt, SavageryLevel, ESSENCE_SCORING } from '@/app/lib/essenceEngine';
import { 
  loadSession, 
  updateGameScores, 
  advanceToNextGame, 
  saveSession, 
  isSessionComplete, 
  GAME_ROUTES,
  getCurrentGame,
  GameSession
} from '@/app/lib/gameOrchestrator';
import Loading from '@/components/Loading';
import AnimatedScore from '@/components/AnimatedScore';
import { playTimerWarning, playTimerExpired } from '@/utils/sounds';
import { SteampunkLayout, BrassButton, BrassInput, GameCard, GhostButton, Gear, GaugePanel } from '@/components/ui/qtc-components';

interface PlayerData {
  name: string;
  goodAt: string;
  ratherDie: string;
}

interface PlayerScore {
  name: string;
  score: number;
}

interface Answer {
  playerIndex: number;
  playerName: string;
  text: string;
}

type GamePhase = 'transition' | 'handoff' | 'intro' | 'collecting' | 'picking' | 'reveal' | 'final';

function PlayContent({ session: initialSession }: { session: GameSession }) {
  const router = useRouter();
  
  // Game state
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('transition');
  const [savageryLevel, setSavageryLevel] = useState<SavageryLevel>('standard');
  
  // Answer collection state
  const [currentAnswererIndex, setCurrentAnswererIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // Selection state
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [winningAnswer, setWinningAnswer] = useState<Answer | null>(null);
  
  // Timer
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Prompts used this game (track categories to avoid repeats)
  const [usedPromptCategories, setUsedPromptCategories] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Load player data from session
  useEffect(() => {
    try {
      const currentSavagery = initialSession.savageryLevel || 'standard';
      setSavageryLevel(currentSavagery);
      
      // Convert session players to PlayerData format
      const formattedPlayers: PlayerData[] = initialSession.players.map(p => ({
        name: p.name || 'Unknown',
        goodAt: p.expertise || 'General Knowledge',
        ratherDie: p.ratherDieThan || ''
      }));
      
      if (formattedPlayers.length === 0) {
        console.error('No valid players found');
        router.push('/setup');
        return;
      }
      
      setPlayers(formattedPlayers);
      setScores(formattedPlayers.map(p => ({ name: p.name, score: 0 })));
      
      // Generate first prompt using essence engine
      const allRatherDieThan = formattedPlayers.map(p => p.ratherDie).filter(Boolean);
      const firstPlayer = formattedPlayers[0];
      const { prompt, category } = generateEssencePrompt(
        firstPlayer.name,
        currentSavagery,
        allRatherDieThan,
        []
      );
      setCurrentPrompt(prompt);
      setUsedPromptCategories([category]);
    } catch (error) {
      console.error('Error loading game data:', error);
      router.push('/setup');
    }
  }, [initialSession, router]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || timer <= 0) {
      if (timer === 0 && isTimerRunning) {
        playTimerExpired();
      }
      return;
    }
    
    // Play warning sound at 10 seconds
    if (timer === 10) {
      playTimerWarning();
    }
    
    const interval = setInterval(() => {
      setTimer(prev => {
        const newTime = prev - 1;
        // Play warning sound at 10 seconds
        if (newTime === 10) {
          playTimerWarning();
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // Get non-subject players for answering
  const getAnsweringPlayers = useCallback(() => {
    return players.filter((_, index) => index !== subjectIndex);
  }, [players, subjectIndex]);

  const getNextPrompt = useCallback((subjectPlayer: PlayerData) => {
    // Collect ALL players' "rather die than" preferences for filtering
    const allRatherDieThan = players.map(p => p.ratherDie).filter(Boolean);
    const { prompt, category } = generateEssencePrompt(
      subjectPlayer.name,
      savageryLevel,
      allRatherDieThan,
      usedPromptCategories
    );
    setUsedPromptCategories(prev => [...prev, category]);
    return prompt;
  }, [players, savageryLevel, usedPromptCategories]);

  const startAnswerCollection = () => {
    setPhase('collecting');
    setCurrentAnswererIndex(0);
    setAnswers([]);
    setCurrentAnswer('');
    setTimer(30);
    setIsTimerRunning(true);
  };

  const submitAnswer = () => {
    if (!currentAnswer.trim()) return;
    
    const answeringPlayers = getAnsweringPlayers();
    const actualPlayerIndex = players.findIndex(p => p.name === answeringPlayers[currentAnswererIndex].name);
    
    const newAnswer: Answer = {
      playerIndex: actualPlayerIndex,
      playerName: answeringPlayers[currentAnswererIndex].name,
      text: currentAnswer.trim(),
    };
    
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    setIsTimerRunning(false);
    
    // Check if all answering players have submitted
    if (currentAnswererIndex >= answeringPlayers.length - 1) {
      // Move to picking phase
      setPhase('picking');
    } else {
      // Next answerer
      setCurrentAnswererIndex(prev => prev + 1);
      setTimer(30);
      setIsTimerRunning(true);
    }
  };

  const selectAnswer = (index: number) => {
    setSelectedAnswerIndex(index);
  };

  const confirmSelection = () => {
    if (selectedAnswerIndex === null) return;
    
    const winner = answers[selectedAnswerIndex];
    setWinningAnswer(winner);
    
    // Award points using ESSENCE_SCORING
    setScores(prev => prev.map((s, i) => {
      let newScore = s.score;
      // Subject gets points for picking
      if (i === subjectIndex) newScore += ESSENCE_SCORING.subject;
      // Winner gets points
      if (i === winner.playerIndex) newScore += ESSENCE_SCORING.author;
      return { ...s, score: newScore };
    }));
    
    setPhase('reveal');
  };

  const nextRound = () => {
    const nextSubjectIndex = (subjectIndex + 1) % players.length;
    
    if (currentRound >= players.length) {
      // Game over
      setPhase('final');
    } else {
      // Next round
      setCurrentRound(prev => prev + 1);
      setSubjectIndex(nextSubjectIndex);
      setPhase('handoff');
      setSelectedAnswerIndex(null);
      setWinningAnswer(null);
      setCurrentPrompt(getNextPrompt(players[nextSubjectIndex]));
    }
  };

  const startHandoff = () => {
    setPhase('intro');
  };

  const handleGameComplete = () => {
    try {
      // Convert scores to Record<string, number>
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
      
      // Update scores for this game
      session = updateGameScores(session, 'thatsSoYou', finalScores);
      session = advanceToNextGame(session);
      saveSession(session);
      
      // Check if testing mode
      const isTestingMode = localStorage.getItem('qtc_testing_mode') === 'true';
      
      // Check if all games complete
      if (isSessionComplete(session)) {
        router.push(isTestingMode ? '/test-setup' : '/final-scores');
      } else {
        // Go to next game
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
    return `0:${seconds.toString().padStart(2, '0')}`;
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

  const subject = players[subjectIndex];
  const answeringPlayers = getAnsweringPlayers();

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
              TIME TO GET PERSONAL
            </h1>
            <p className="mt-4 font-body text-[16px] text-qtc-copper">
              We&apos;re about to learn too much
            </p>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // HANDOFF SCREEN (between rounds)
  if (phase === 'handoff') {
    const nextSubject = players[subjectIndex];
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center animate-fadeInScale">
            <h1 className="font-heading text-[48px] font-bold text-qtc-brass-light">
              {nextSubject?.name.toUpperCase()} IS UP NEXT
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

  // SCREEN 1 - Round Intro
  if (phase === 'intro') {
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col animate-fadeIn">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-brass-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-black">
              {subject.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
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
            <p className="font-mono text-[13px] text-qtc-copper uppercase tracking-wider">
              That&apos;s So You
            </p>
            
            <GameCard variant="brass" className="mt-8 max-w-[500px]">
              <p className="font-heading text-[28px] font-normal text-qtc-brass-light text-center leading-relaxed">
                &ldquo;{currentPrompt}&rdquo;
              </p>
            </GameCard>
            
            <p className="mt-8 font-body text-[16px] text-qtc-copper text-center">
              Everyone else: be honest. Be brutal. Be quick.
            </p>
            
            <BrassButton
              onClick={startAnswerCollection}
              variant="holiday"
              size="lg"
              className="mt-12"
            >
              START ROUND
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 2 - Collecting Answers
  if (phase === 'collecting') {
    const currentAnswerer = answeringPlayers[currentAnswererIndex];
    
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col animate-fadeIn">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-brass-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-black">
              {subject.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top bar with timer */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider">
              Player {currentAnswererIndex + 1} of {answeringPlayers.length}
            </p>
            <span className={`font-mono text-[28px] font-bold transition-colors duration-300 ${
              timer <= 10 
                ? 'text-qtc-cream animate-pulse-slow' 
                : 'text-qtc-brass'
            }`}>
              {formatTime(timer)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <h1 className="font-heading text-[32px] font-bold text-qtc-brass-light text-center">
              {currentAnswerer.name.toUpperCase()}, YOUR TURN
            </h1>
            
            <GameCard variant="copper" className="mt-6 max-w-[400px]">
              <p className="font-heading text-[20px] font-normal text-qtc-copper-light text-center leading-relaxed">
                &ldquo;{currentPrompt}&rdquo;
              </p>
            </GameCard>
            
            <p className="mt-4 font-body text-[14px] text-qtc-copper">
              Don&apos;t let {subject.name} see your answer!
            </p>
            
            <BrassInput
              type="text"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="mt-8 w-full max-w-[400px]"
              autoFocus
            />
            
            <BrassButton
              onClick={submitAnswer}
              disabled={!currentAnswer.trim()}
              variant={currentAnswer.trim() ? "holiday" : "secondary"}
              size="lg"
              className="mt-8"
            >
              SUBMIT ANSWER
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 3 - Subject Picks
  if (phase === 'picking') {
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col animate-fadeIn">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-brass-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-black">
              {subject.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top bar */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider">
              Round {currentRound}
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
          <div className="flex-1 flex flex-col items-center px-6 py-8">
            <h1 className="font-heading text-[32px] font-bold text-qtc-brass-light text-center">
              {subject.name.toUpperCase()}, PICK YOUR FAVORITE
            </h1>
            
            <p className="mt-4 font-body text-[14px] text-qtc-copper text-center">
              &ldquo;{currentPrompt}&rdquo;
            </p>
            
            {/* Answer buttons */}
            <div className="mt-8 w-full max-w-[400px] space-y-4">
              {answers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => selectAnswer(index)}
                  className={`
                    w-full p-6 rounded-xl text-left border-2
                    transition-all duration-150 ease-out cursor-pointer
                    ${selectedAnswerIndex === index
                      ? 'bg-brass-gradient text-qtc-black border-qtc-brass-light/30 shadow-brass'
                      : 'bg-qtc-charcoal text-qtc-cream border-qtc-brass/50 hover:border-qtc-brass'
                    }
                  `}
                >
                  <p className="font-heading text-[20px] font-normal leading-relaxed">
                    &ldquo;{answer.text}&rdquo;
                  </p>
                </button>
              ))}
            </div>
            
            <BrassButton
              onClick={confirmSelection}
              disabled={selectedAnswerIndex === null}
              variant={selectedAnswerIndex !== null ? "holiday" : "secondary"}
              size="lg"
              className="mt-8"
            >
              CONFIRM PICK
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 4 - Reveal & Score
  if (phase === 'reveal' && winningAnswer) {
    return (
      <SteampunkLayout variant="holiday" showGears={true}>
        <main className="min-h-screen flex flex-col animate-fadeIn">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-holiday-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {subject.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top bar */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider">
              Round {currentRound} Complete
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
            <p className="font-mono text-[13px] text-qtc-copper uppercase tracking-wider">
              {subject.name} picked
            </p>
            
            <GameCard variant="brass" className="mt-6 max-w-[400px]">
              <p className="font-heading text-[28px] font-normal text-qtc-brass-light text-center leading-relaxed">
                &ldquo;{winningAnswer.text}&rdquo;
              </p>
            </GameCard>
            
            <p className="mt-6 font-body text-[18px] text-qtc-cream">
              Written by <span className="font-bold text-qtc-brass">{winningAnswer.playerName}</span>
            </p>
            
            <div className="mt-8 flex gap-8">
              <div className="text-center">
                <p className="font-body text-[12px] text-qtc-copper">{subject.name}</p>
                <p className="font-heading text-[24px] font-bold text-qtc-brass">+{ESSENCE_SCORING.subject}</p>
              </div>
              <div className="text-center">
                <p className="font-body text-[12px] text-qtc-copper">{winningAnswer.playerName}</p>
                <p className="font-heading text-[24px] font-bold text-qtc-brass">+{ESSENCE_SCORING.author}</p>
              </div>
            </div>
            
            <BrassButton
              onClick={nextRound}
              variant="holiday"
              size="lg"
              className="mt-12"
            >
              {currentRound >= players.length ? 'SEE FINAL SCORES' : 'NEXT ROUND'}
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 5 - Final Scores
  if (phase === 'final') {
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const winner = sortedScores[0];
    
    return (
      <SteampunkLayout variant="holiday">
        <main className="min-h-screen flex flex-col items-center justify-center px-6 animate-fadeIn">
          <p className="font-mono text-[13px] text-qtc-copper uppercase tracking-wider">
            Game Complete
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

export default function Play() {
  return (
    <SessionGuard redirectOnInvalid={true}>
      {(session) => <PlayContent session={session} />}
    </SessionGuard>
  );
}
