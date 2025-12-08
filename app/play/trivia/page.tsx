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
            TRIVIA TIME
          </h1>
          <p className="mt-4 font-body text-[16px] text-[#9B9388]">
            Show us what you know
          </p>
        </div>
      </main>
    );
  }

  // HANDOFF SCREEN (between rounds)
  if (phase === 'handoff') {
    const nextAnswerer = currentCard?.answerer;
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <div className="text-center animate-fadeInScale">
          <h1 className="font-heading text-[48px] font-bold text-[#F0EEE9]">
            {nextAnswerer?.toUpperCase()} IS UP NEXT
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

  // SCREEN 1 - Question Selection
  if (phase === 'selection') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#9A8BC4] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {currentCard.answerer.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar with scores */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            Question {currentTurn} of {players.length}
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
          {/* Category badge */}
          <p className="font-body text-[12px] font-medium uppercase tracking-wider text-[#D4A574]">
            {getCategoryDisplay(currentCard)}
          </p>
          
          <h1 className="mt-4 font-heading text-[32px] font-bold text-[#F0EEE9] text-center">
            {currentCard.answerer.toUpperCase()}, YOU&apos;RE UP
          </h1>
          
          <div className="mt-8 w-[100px] h-[3px] bg-[#D4A574] rounded-full" />
          
          <p className="mt-6 font-body text-[16px] text-[#9B9388] text-center">
            Pick your difficulty
          </p>
          
          {/* Steal info */}
          <div className="mt-6 p-4 bg-[#2D2B28] rounded-xl max-w-[360px]">
            {currentCard.stealType === 'expert' ? (
              <p className="font-body text-[14px] text-[#9B9388] text-center">
                If wrong, <span className="text-[#D4A574] font-bold">{currentCard.expert}</span> can steal for 2 points
              </p>
            ) : (
              <p className="font-body text-[14px] text-[#9B9388] text-center">
                If wrong, <span className="text-[#D4A574] font-bold">ANYONE</span> can steal for 2 points
              </p>
            )}
          </div>
          
          {/* Difficulty selection */}
          <div className="mt-10 flex gap-4">
            <button
              onClick={() => selectDifficulty('easy')}
              className="px-8 py-6 bg-[#2D2B28] text-[#F0EEE9] rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:bg-[#F0EEE9] hover:text-[#1F1E1C] active:scale-[0.96]"
            >
              EASY
              <span className="block font-body text-[14px] font-normal text-[#D4A574] mt-1">
                1 point
              </span>
            </button>
            
            <button
              onClick={() => selectDifficulty('hard')}
              className="px-8 py-6 bg-[#2D2B28] text-[#F0EEE9] rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:bg-[#F0EEE9] hover:text-[#1F1E1C] active:scale-[0.96]"
            >
              HARD
              <span className="block font-body text-[14px] font-normal text-[#D4A574] mt-1">
                3 points
              </span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // SCREEN 2 - Question Display
  if (phase === 'question') {
    const question = selectedDifficulty === 'easy' 
      ? currentCard.questions.easy 
      : currentCard.questions.hard;
    
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#9A8BC4] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {currentCard.answerer.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar with timer */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            {selectedDifficulty?.toUpperCase()} • {selectedDifficulty === 'easy' ? '1' : '3'} point{selectedDifficulty === 'hard' ? 's' : ''}
          </p>
          <span className={`font-mono text-[28px] font-bold ${timer <= 10 ? 'text-[#F0EEE9]' : 'text-[#D4A574]'}`}>
            {formatTime(timer)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-body text-[14px] text-[#9B9388]">
            Your question:
          </p>
          
          <div className="mt-6 p-8 bg-[#2D2B28] rounded-xl max-w-[400px]">
            <p className="font-heading text-[24px] font-normal text-[#F0EEE9] text-center leading-relaxed">
              {question.question}
            </p>
          </div>
          
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="mt-8 w-full max-w-[400px] h-[56px] px-4 bg-transparent border-2 border-[#F0EEE9] rounded-lg font-body text-[16px] text-[#F0EEE9] placeholder-[#9B9388] focus:outline-none focus:ring-2 focus:ring-[#F0EEE9]/30"
            autoFocus
          />
          
          <button
            onClick={submitAnswer}
            className="mt-8 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            SUBMIT ANSWER
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 3a - Answer Verification
  if (phase === 'answer') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#9A8BC4] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {currentCard.answerer.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="font-body text-[14px] text-[#9B9388] uppercase tracking-wider">
          {currentCard.answerer} answered:
        </p>
        
        <div className="mt-4 p-6 bg-[#2D2B28] rounded-xl max-w-[400px]">
          <p className="font-heading text-[24px] font-normal text-[#F0EEE9] text-center">
            &ldquo;{userAnswer || '(no answer)'}&rdquo;
          </p>
        </div>
        
        <p className="mt-8 font-heading text-[20px] text-[#F0EEE9]">
          Was that correct?
        </p>
        
        <p className="mt-2 font-body text-[14px] text-[#9B9388]">
          {currentCard.stealType === 'expert' 
            ? `${currentCard.expert}, you decide!`
            : 'Group decides!'}
        </p>
        
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => markAnswer(true)}
            className="px-10 py-5 bg-[#4A7C59] text-[#F0EEE9] rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:opacity-90 active:scale-[0.96]"
          >
            ✓ CORRECT
          </button>
          
          <button
            onClick={() => markAnswer(false)}
            className="px-10 py-5 bg-[#C45B4D] text-[#F0EEE9] rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:opacity-90 active:scale-[0.96]"
          >
            ✗ WRONG
          </button>
        </div>
        </div>
      </main>
    );
  }

  // SCREEN 3b - Steal Phase
  if (phase === 'steal') {
    // Expert Steal
    if (currentCard.stealType === 'expert' && !stealAttempt) {
      return (
        <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-[#9A8BC4] text-center">
            <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
              {currentCard.expert?.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-body text-[14px] text-[#C45B4D] uppercase tracking-wider">
            Wrong Answer!
          </p>
          
          <h1 className="mt-4 font-heading text-[28px] font-bold text-[#F0EEE9] text-center">
            {currentCard.expert?.toUpperCase()}, STEAL FOR 2 POINTS?
          </h1>
          
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => attemptSteal(currentCard.expert || '')}
              className="px-10 py-5 bg-[#D4A574] text-[#1F1E1C] rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:opacity-90 active:scale-[0.96]"
            >
              YES, I&apos;LL STEAL
            </button>
            
            <button
              onClick={skipSteal}
              className="px-10 py-5 bg-[#2D2B28] text-[#F0EEE9] rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:opacity-90 active:scale-[0.96]"
            >
              PASS
            </button>
          </div>
          </div>
        </main>
      );
    }
    
    // Community Steal - select who's stealing
    if (currentCard.stealType === 'community' && !stealAttempt) {
      const eligibleStealers = players.filter(
        p => p.name !== currentCard.answerer
      );
      
      return (
        <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
          <p className="font-body text-[14px] text-[#C45B4D] uppercase tracking-wider">
            Wrong Answer!
          </p>
          
          <h1 className="mt-4 font-heading text-[28px] font-bold text-[#F0EEE9] text-center">
            ANYONE CAN STEAL!
          </h1>
          
          <p className="mt-2 font-body text-[16px] text-[#9B9388]">
            First to tap gets to answer for 2 points
          </p>
          
          <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[320px]">
            {eligibleStealers.map((player, index) => (
              <button
                key={index}
                onClick={() => attemptSteal(player.name)}
                className="p-5 bg-[#2D2B28] text-[#F0EEE9] rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:bg-[#D4A574] hover:text-[#1F1E1C] active:scale-[0.96]"
              >
                {player.name}
              </button>
            ))}
          </div>
          
          <button
            onClick={skipSteal}
            className="mt-8 px-8 py-4 bg-transparent text-[#9B9388] font-body text-[16px] cursor-pointer hover:text-[#F0EEE9]"
          >
            No one wants to steal
          </button>
        </main>
      );
    }
    
    // Steal attempt in progress
    if (stealAttempt && stealCorrect === null) {
      return (
        <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-[#9A8BC4] text-center">
            <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
              {stealAttempt.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-body text-[14px] text-[#D4A574] uppercase tracking-wider">
            Steal Attempt
          </p>
          
          <h1 className="mt-4 font-heading text-[28px] font-bold text-[#F0EEE9] text-center">
            {stealAttempt.toUpperCase()}, WHAT&apos;S YOUR ANSWER?
          </h1>
          
          <input
            type="text"
            value={stealAnswer}
            onChange={(e) => setStealAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="mt-8 w-full max-w-[400px] h-[56px] px-4 bg-transparent border-2 border-[#D4A574] rounded-lg font-body text-[16px] text-[#F0EEE9] placeholder-[#9B9388] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/30"
            autoFocus
          />
          
          <p className="mt-6 font-body text-[16px] text-[#9B9388]">
            Was that correct?
          </p>
          
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => markSteal(true)}
              className="px-10 py-5 bg-[#4A7C59] text-[#F0EEE9] rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:opacity-90 active:scale-[0.96]"
            >
              ✓ CORRECT
            </button>
            
            <button
              onClick={() => markSteal(false)}
              className="px-10 py-5 bg-[#C45B4D] text-[#F0EEE9] rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:opacity-90 active:scale-[0.96]"
            >
            ✗ WRONG
          </button>
          </div>
          </div>
        </main>
      );
    }
  }

  // SCREEN 4 - Score Update
  if (phase === 'score') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#9A8BC4] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {currentCard.answerer.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            Question {currentTurn} Complete
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
          {pointsAwarded.length > 0 ? (
            <>
              <p className="font-body text-[14px] text-[#D4A574] uppercase tracking-wider">
                Points Awarded
              </p>
              
              {pointsAwarded.map((award, i) => (
                <div key={i} className="mt-4 text-center">
                  <p className="font-heading text-[48px] font-bold text-[#D4A574]">
                    +{award.points}
                  </p>
                  <p className="font-body text-[18px] text-[#F0EEE9]">
                    {award.player}
                  </p>
                </div>
              ))}
            </>
          ) : (
            <>
              <p className="font-body text-[14px] text-[#9B9388] uppercase tracking-wider">
                No Points This Round
              </p>
              
              <p className="mt-4 font-heading text-[24px] text-[#F0EEE9]">
                Better luck next time!
              </p>
            </>
          )}
          
          {/* Current standings */}
          <div className="mt-10 w-full max-w-[280px]">
            <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider text-center mb-4">
              Current Standings
            </p>
            {[...scores].sort((a, b) => b.score - a.score).slice(0, 3).map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-[#2D2B28] rounded-lg mb-2"
              >
                <span className="font-body text-[16px] text-[#F0EEE9]">{s.name}</span>
                <span className="font-heading text-[18px] font-bold text-[#D4A574]">{s.score}</span>
              </div>
            ))}
          </div>
          
          <button
            onClick={nextQuestion}
            className="mt-10 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            {currentTurn >= players.length ? 'SEE FINAL SCORES' : 'NEXT QUESTION'}
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
          Trivia Complete
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

