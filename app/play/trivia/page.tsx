'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  generateTriviaCard,
  TRIVIA_SCORING,
  TriviaCard,
  EXPERTISE_MAP
} from '@/app/lib/triviaEngine';
import { 
  loadSession, 
  updateGameScores, 
  advanceToNextGame, 
  saveSession, 
  isSessionComplete, 
  GAME_ROUTES,
  getCurrentGame
} from '@/app/lib/gameOrchestrator';
import { SteampunkLayout, BrassButton, BrassInput, GameCard, GhostButton, Gear, GaugePanel, HolidayGarland } from '@/components/ui/qtc-components';
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

type GamePhase = 'transition' | 'handoff' | 'selection' | 'question' | 'answer' | 'steal' | 'score' | 'final';
type Difficulty = 'easy' | 'hard';

export default function Trivia() {
  const router = useRouter();
  
  // Game state
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [phase, setPhase] = useState<GamePhase>('transition');
  
  // Round state
  const [currentCard, setCurrentCard] = useState<TriviaCard | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [stealAttempt, setStealAttempt] = useState<string | null>(null);
  const [stealAnswer, setStealAnswer] = useState('');
  const [stealCorrect, setStealCorrect] = useState<boolean | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState<{player: string, points: number}[]>([]);
  
  // Timer
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Load player data and session
  useEffect(() => {
    try {
      const session = loadSession();
      if (!session) {
        console.error('No session found - redirecting to games');
        router.push('/games');
        return;
      }
      
      const location = session.location;
      
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
        
        // Generate first card
        const triviaPlayers = formattedPlayers.map(p => ({
          name: p.name,
          expertise: p.goodAt,
          ratherDieThan: p.ratherDie
        }));
        const card = generateTriviaCard(1, triviaPlayers, location);
        setCurrentCard(card);
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
    if (!isTimerRunning || timer <= 0) return;
    
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const getCategoryDisplay = (card: TriviaCard): string => {
    // Try to find the fancy category name from expertise map
    const mapping = EXPERTISE_MAP.find(
      e => e.expertise.toLowerCase() === card.category.toLowerCase()
    );
    return mapping?.categoryName || card.category;
  };

  const selectDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setPhase('question');
    setTimer(30);
    setIsTimerRunning(true);
  };

  const submitAnswer = () => {
    setIsTimerRunning(false);
    
    // For this version, answers are verified by the group/expert
    // In a full version, we'd use validateAnswer()
    // For now, we'll ask if the answer was correct
    setPhase('answer');
  };

  const markAnswer = (correct: boolean) => {
    setIsCorrect(correct);
    
    if (correct) {
      // Award points
      const points = selectedDifficulty === 'easy' 
        ? TRIVIA_SCORING.easy 
        : TRIVIA_SCORING.hard;
      
      setScores(prev => prev.map(s => 
        s.name === currentCard?.answerer 
          ? { ...s, score: s.score + points }
          : s
      ));
      setPointsAwarded([{ player: currentCard?.answerer || '', points }]);
      setPhase('score');
    } else {
      // Move to steal phase
      setPhase('steal');
    }
  };

  const attemptSteal = (playerName: string) => {
    setStealAttempt(playerName);
  };

  const submitStealAnswer = () => {
    // For this version, group verifies
    // Show result screen
  };

  const markSteal = (correct: boolean) => {
    setStealCorrect(correct);
    
    if (correct && stealAttempt) {
      setScores(prev => prev.map(s => 
        s.name === stealAttempt 
          ? { ...s, score: s.score + TRIVIA_SCORING.steal }
          : s
      ));
      setPointsAwarded([{ player: stealAttempt, points: TRIVIA_SCORING.steal }]);
    } else {
      setPointsAwarded([]);
    }
    
    setPhase('score');
  };

  const skipSteal = () => {
    setPointsAwarded([]);
    setPhase('score');
  };

  const nextQuestion = () => {
    if (currentTurn >= players.length) {
      setPhase('final');
    } else {
      // Next turn
      const nextTurn = currentTurn + 1;
      setCurrentTurn(nextTurn);
      
      // Get location from session
      const session = loadSession();
      const location = session?.location;
      
      // Generate next card
      const triviaPlayers = players.map(p => ({
        name: p.name || 'Unknown',
        expertise: p.goodAt || 'General Knowledge',
        ratherDieThan: p.ratherDie || ''
      }));
      const card = generateTriviaCard(nextTurn, triviaPlayers, location);
      setCurrentCard(card);
      
      // Reset state
      setPhase('handoff');
      setSelectedDifficulty(null);
      setUserAnswer('');
      setIsCorrect(null);
      setStealAttempt(null);
      setStealAnswer('');
      setStealCorrect(null);
      setPointsAwarded([]);
    }
  };

  const startHandoff = () => {
    setPhase('selection');
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
      
      session = updateGameScores(session, 'trivia', finalScores);
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
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  // Auto-advance from transition to selection
  useEffect(() => {
    if (phase === 'transition') {
      const timer = setTimeout(() => {
        setPhase('selection');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (players.length === 0 || !currentCard) {
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
              TRIVIA TIME
            </h1>
            <p className="mt-4 font-body text-[16px] text-qtc-copper">
              Show us what you know
            </p>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // HANDOFF SCREEN (between rounds)
  if (phase === 'handoff') {
    const nextAnswerer = currentCard?.answerer;
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center animate-fadeInScale">
            <h1 className="font-heading text-[48px] font-bold text-qtc-brass-light">
              {nextAnswerer?.toUpperCase()} IS UP NEXT
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

  // SCREEN 1 - Question Selection
  if (phase === 'selection') {
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-bronze-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {currentCard.answerer.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top bar with scores */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider">
              Question {currentTurn} of {players.length}
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
          {/* Category badge */}
          <p className="font-mono text-[12px] font-medium uppercase tracking-wider text-qtc-brass">
            {getCategoryDisplay(currentCard)}
          </p>
          
          <h1 className="mt-4 font-heading text-[32px] font-bold text-qtc-brass-light text-center">
            {currentCard.answerer.toUpperCase()}, YOU&apos;RE UP
          </h1>
          
          <div className="mt-8 w-[100px] h-[3px] bg-qtc-brass rounded-full" />
          
          <p className="mt-6 font-body text-[16px] text-qtc-copper text-center">
            Pick your difficulty
          </p>
          
          {/* Steal info */}
          <GameCard variant="dark" className="mt-6 max-w-[360px]">
            {currentCard.stealType === 'expert' ? (
              <p className="font-body text-[14px] text-qtc-copper text-center">
                If wrong, <span className="text-qtc-brass font-bold">{currentCard.expert}</span> can steal for 2 points
              </p>
            ) : (
              <p className="font-body text-[14px] text-qtc-copper text-center">
                If wrong, <span className="text-qtc-brass font-bold">ANYONE</span> can steal for 2 points
              </p>
            )}
          </GameCard>
          
          {/* Difficulty selection */}
          <div className="mt-10 flex gap-4">
            <button
              onClick={() => selectDifficulty('easy')}
              className="px-8 py-6 bg-qtc-charcoal text-qtc-cream rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:bg-brass-gradient hover:text-qtc-black active:scale-[0.96] border-2 border-qtc-brass/50"
            >
              EASY
              <span className="block font-body text-[14px] font-normal text-qtc-brass mt-1">
                1 point
              </span>
            </button>
            
            <button
              onClick={() => selectDifficulty('hard')}
              className="px-8 py-6 bg-qtc-charcoal text-qtc-cream rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:bg-brass-gradient hover:text-qtc-black active:scale-[0.96] border-2 border-qtc-brass/50"
            >
              HARD
              <span className="block font-body text-[14px] font-normal text-qtc-brass mt-1">
                3 points
              </span>
            </button>
          </div>
        </div>
      </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 2 - Question Display
  if (phase === 'question') {
    const question = selectedDifficulty === 'easy' 
      ? currentCard.questions.easy 
      : currentCard.questions.hard;
    
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-bronze-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {currentCard.answerer.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top bar with timer */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider">
              {selectedDifficulty?.toUpperCase()} • {selectedDifficulty === 'easy' ? '1' : '3'} point{selectedDifficulty === 'hard' ? 's' : ''}
            </p>
            <span className={`font-mono text-[28px] font-bold ${timer <= 10 ? 'text-qtc-cream animate-pulse-slow' : 'text-qtc-brass'}`}>
              {formatTime(timer)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <p className="font-mono text-[14px] text-qtc-copper">
              Your question:
            </p>
            
            <GameCard variant="bronze" className="mt-6 max-w-[400px]">
              <p className="font-heading text-[24px] font-normal text-qtc-brass-light text-center leading-relaxed">
                {question.question}
              </p>
            </GameCard>
            
            <BrassInput
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="mt-8 w-full max-w-[400px]"
              autoFocus
            />
            
            <BrassButton
              onClick={submitAnswer}
              variant="holiday"
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

  // SCREEN 3a - Answer Verification
  if (phase === 'answer') {
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-bronze-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {currentCard.answerer.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-mono text-[14px] text-qtc-copper uppercase tracking-wider">
            {currentCard.answerer} answered:
          </p>
          
          <GameCard variant="dark" className="mt-4 max-w-[400px]">
            <p className="font-heading text-[24px] font-normal text-qtc-cream text-center">
              &ldquo;{userAnswer || '(no answer)'}&rdquo;
            </p>
          </GameCard>
          
          <p className="mt-8 font-heading text-[20px] text-qtc-brass-light">
            Was that correct?
          </p>
          
          <p className="mt-2 font-body text-[14px] text-qtc-copper">
            {currentCard.stealType === 'expert' 
              ? `${currentCard.expert}, you decide!`
              : 'Group decides!'}
          </p>
          
          <div className="mt-8 flex gap-4">
            <BrassButton
              onClick={() => markAnswer(true)}
              variant="primary"
              size="lg"
              className="bg-qtc-holiday-green text-qtc-cream"
            >
              ✓ CORRECT
            </BrassButton>
            
            <BrassButton
              onClick={() => markAnswer(false)}
              variant="primary"
              size="lg"
              className="bg-qtc-holiday-red text-qtc-cream"
            >
              ✗ WRONG
            </BrassButton>
          </div>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 3b - Steal Phase
  if (phase === 'steal') {
    // Expert Steal
    if (currentCard.stealType === 'expert' && !stealAttempt) {
      return (
        <SteampunkLayout variant="dark" showGears={true}>
          <main className="min-h-screen flex flex-col">
            {/* Whose turn banner */}
            <div className="w-full py-3 bg-bronze-gradient text-center shadow-deep">
              <p className="font-heading text-[18px] font-bold text-qtc-cream">
                {currentCard.expert?.toUpperCase()}&apos;S TURN — HOLD THE PHONE
              </p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-6">
            <p className="font-mono text-[14px] text-qtc-holiday-red uppercase tracking-wider">
              Wrong Answer!
            </p>
            
            <h1 className="mt-4 font-heading text-[28px] font-bold text-qtc-brass-light text-center">
              {currentCard.expert?.toUpperCase()}, STEAL FOR 2 POINTS?
            </h1>
            
            <div className="mt-8 flex gap-4">
              <BrassButton
                onClick={() => attemptSteal(currentCard.expert || '')}
                variant="primary"
                size="lg"
              >
                YES, I&apos;LL STEAL
              </BrassButton>
              
              <GhostButton
                onClick={skipSteal}
                className="px-10 py-5"
              >
                PASS
              </GhostButton>
            </div>
            </div>
          </main>
        </SteampunkLayout>
      );
    }
    
    // Community Steal - select who's stealing
    if (currentCard.stealType === 'community' && !stealAttempt) {
      const eligibleStealers = players.filter(
        p => p.name !== currentCard.answerer
      );
      
      return (
        <SteampunkLayout variant="dark" showGears={true}>
          <main className="min-h-screen flex flex-col items-center justify-center px-6">
            <p className="font-mono text-[14px] text-qtc-holiday-red uppercase tracking-wider">
              Wrong Answer!
            </p>
            
            <h1 className="mt-4 font-heading text-[28px] font-bold text-qtc-brass-light text-center">
              ANYONE CAN STEAL!
            </h1>
            
            <p className="mt-2 font-body text-[16px] text-qtc-copper">
              First to tap gets to answer for 2 points
            </p>
            
            <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[320px]">
              {eligibleStealers.map((player, index) => (
                <button
                  key={index}
                  onClick={() => attemptSteal(player.name)}
                  className="p-5 bg-qtc-charcoal text-qtc-cream rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:bg-brass-gradient hover:text-qtc-black active:scale-[0.96] border-2 border-qtc-brass/50"
                >
                  {player.name}
                </button>
              ))}
            </div>
            
            <GhostButton
              onClick={skipSteal}
              className="mt-8"
            >
              No one wants to steal
            </GhostButton>
          </main>
        </SteampunkLayout>
      );
    }
    
    // Steal attempt in progress
    if (stealAttempt && stealCorrect === null) {
      return (
        <SteampunkLayout variant="dark" showGears={true}>
          <main className="min-h-screen flex flex-col">
            {/* Whose turn banner */}
            <div className="w-full py-3 bg-bronze-gradient text-center shadow-deep">
              <p className="font-heading text-[18px] font-bold text-qtc-cream">
                {stealAttempt.toUpperCase()}&apos;S TURN — HOLD THE PHONE
              </p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-6">
            <p className="font-mono text-[14px] text-qtc-brass uppercase tracking-wider">
              Steal Attempt
            </p>
            
            <h1 className="mt-4 font-heading text-[28px] font-bold text-qtc-brass-light text-center">
              {stealAttempt.toUpperCase()}, WHAT&apos;S YOUR ANSWER?
            </h1>
            
            <BrassInput
              type="text"
              value={stealAnswer}
              onChange={(e) => setStealAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="mt-8 w-full max-w-[400px]"
              autoFocus
            />
            
            <p className="mt-6 font-body text-[16px] text-qtc-copper">
              Was that correct?
            </p>
            
            <div className="mt-4 flex gap-4">
              <BrassButton
                onClick={() => markSteal(true)}
                variant="primary"
                size="lg"
                className="bg-qtc-holiday-green text-qtc-cream"
              >
                ✓ CORRECT
              </BrassButton>
              
              <BrassButton
                onClick={() => markSteal(false)}
                variant="primary"
                size="lg"
                className="bg-qtc-holiday-red text-qtc-cream"
              >
                ✗ WRONG
              </BrassButton>
            </div>
            </div>
          </main>
        </SteampunkLayout>
      );
    }
  }

  // SCREEN 4 - Score Update
  if (phase === 'score') {
    return (
      <SteampunkLayout variant="holiday" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-holiday-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {currentCard.answerer.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top bar */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider">
              Question {currentTurn} Complete
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
            {pointsAwarded.length > 0 ? (
              <>
                <p className="font-mono text-[14px] text-qtc-brass uppercase tracking-wider">
                  Points Awarded
                </p>
                
                {pointsAwarded.map((award, i) => (
                  <div key={i} className="mt-4 text-center">
                    <p className="font-heading text-[48px] font-bold text-qtc-brass">
                      +{award.points}
                    </p>
                    <p className="font-body text-[18px] text-qtc-cream">
                      {award.player}
                    </p>
                  </div>
                ))}
              </>
            ) : (
              <>
                <p className="font-mono text-[14px] text-qtc-copper uppercase tracking-wider">
                  No Points This Round
                </p>
                
                <p className="mt-4 font-heading text-[24px] text-qtc-brass-light">
                  Better luck next time!
                </p>
              </>
            )}
            
            {/* Current standings */}
            <div className="mt-10 w-full max-w-[280px]">
              <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider text-center mb-4">
                Current Standings
              </p>
              {[...scores].sort((a, b) => b.score - a.score).slice(0, 3).map((s, i) => (
                <GameCard key={i} variant="dark" className="mb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[16px] text-qtc-cream">{s.name}</span>
                    <AnimatedScore value={s.score} className="font-heading text-[18px] font-bold text-qtc-brass" />
                  </div>
                </GameCard>
              ))}
            </div>
            
            <BrassButton
              onClick={nextQuestion}
              variant="holiday"
              size="lg"
              className="mt-10"
            >
              {currentTurn >= players.length ? 'SEE FINAL SCORES' : 'NEXT QUESTION'}
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
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
          <HolidayGarland className="mb-6" />
          
          <p className="font-mono text-[13px] text-qtc-copper uppercase tracking-wider">
            Trivia Complete
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

