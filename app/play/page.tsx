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
  getCurrentGame
} from '@/app/lib/gameOrchestrator';
import Loading from '@/components/Loading';
import AnimatedScore from '@/components/AnimatedScore';
import { playTimerWarning, playTimerExpired } from '@/utils/sounds';

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

export default function Play() {
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
      
      // Try both player storage keys
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
        
        // Generate first prompt using essence engine
        // Collect ALL players' "rather die than" preferences for filtering
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
    return <Loading />;
  }

  // TRANSITION SCREEN
  if (phase === 'transition') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center">
        <div className="text-center animate-fadeInScale">
          <h1 className="font-heading text-[48px] font-bold text-[#F0EEE9]">
            TIME TO GET PERSONAL
          </h1>
          <p className="mt-4 font-body text-[16px] text-[#9B9388]">
            We&apos;re about to learn too much
          </p>
        </div>
      </main>
    );
  }

  // HANDOFF SCREEN (between rounds)
  if (phase === 'handoff') {
    const nextSubject = players[subjectIndex];
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <div className="text-center animate-fadeInScale">
          <h1 className="font-heading text-[48px] font-bold text-[#F0EEE9]">
            {nextSubject?.name.toUpperCase()} IS UP NEXT
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
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col animate-fadeIn">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#D4A574] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {subject.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar with scores */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            Round {currentRound} of {players.length}
          </p>
          <div className="flex gap-4">
            {scores.map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-body text-[11px] text-[#9B9388]">{s.name}</p>
                <AnimatedScore value={s.score} className="font-heading text-[16px] font-bold text-[#D4A574]" />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-body text-[13px] text-[#9B9388] uppercase tracking-wider">
            That&apos;s So You
          </p>
          
          <p className="mt-8 font-heading text-[28px] font-normal text-[#F0EEE9] text-center leading-relaxed">
            &ldquo;{currentPrompt}&rdquo;
          </p>
          
          <p className="mt-8 font-body text-[16px] text-[#9B9388] text-center">
            Everyone else: be honest. Be brutal. Be quick.
          </p>
          
          <button
            onClick={startAnswerCollection}
            className="mt-12 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            START ROUND
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 2 - Collecting Answers
  if (phase === 'collecting') {
    const currentAnswerer = answeringPlayers[currentAnswererIndex];
    
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col animate-fadeIn">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#D4A574] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {subject.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar with timer */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            Player {currentAnswererIndex + 1} of {answeringPlayers.length}
          </p>
          <span className={`font-mono text-[28px] font-bold transition-colors duration-300 ${
            timer <= 10 
              ? 'text-[#F0EEE9] animate-pulse-slow' 
              : 'text-[#D4A574]'
          }`}>
            {formatTime(timer)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h1 className="font-heading text-[32px] font-bold text-[#F0EEE9] text-center">
            {currentAnswerer.name.toUpperCase()}, YOUR TURN
          </h1>
          
          <p className="mt-6 font-heading text-[20px] font-normal text-[#9B9388] text-center leading-relaxed">
            &ldquo;{currentPrompt}&rdquo;
          </p>
          
          <p className="mt-4 font-body text-[14px] text-[#9B9388]">
            Don&apos;t let {subject.name} see your answer!
          </p>
          
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="mt-8 w-full max-w-[400px] h-[56px] px-4 bg-transparent border-2 border-[#F0EEE9] rounded-lg font-body text-[16px] text-[#F0EEE9] placeholder-[#9B9388] focus:outline-none focus:ring-2 focus:ring-[#F0EEE9]/30"
            autoFocus
          />
          
          <button
            onClick={submitAnswer}
            disabled={!currentAnswer.trim()}
            className={`
              mt-8 px-12 py-5 font-body text-lg font-bold rounded-lg cursor-pointer
              transition-all duration-150 ease-out select-none
              ${currentAnswer.trim()
                ? 'bg-[#F0EEE9] text-[#1F1E1C] hover:opacity-90 hover:scale-[0.98] active:scale-[0.96]'
                : 'bg-transparent border-2 border-[#9B9388] text-[#9B9388] cursor-not-allowed'
              }
            `}
          >
            SUBMIT ANSWER
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 3 - Subject Picks
  if (phase === 'picking') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col animate-fadeIn">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#D4A574] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {subject.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            Round {currentRound}
          </p>
          <div className="flex gap-4">
            {scores.map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-body text-[11px] text-[#9B9388]">{s.name}</p>
                <AnimatedScore value={s.score} className="font-heading text-[16px] font-bold text-[#D4A574]" />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center px-6 py-8">
          <h1 className="font-heading text-[32px] font-bold text-[#F0EEE9] text-center">
            {subject.name.toUpperCase()}, PICK YOUR FAVORITE
          </h1>
          
          <p className="mt-4 font-body text-[14px] text-[#9B9388] text-center">
            &ldquo;{currentPrompt}&rdquo;
          </p>
          
          {/* Answer buttons */}
          <div className="mt-8 w-full max-w-[400px] space-y-4">
            {answers.map((answer, index) => (
              <button
                key={index}
                onClick={() => selectAnswer(index)}
                className={`
                  w-full p-6 rounded-xl text-left
                  transition-all duration-150 ease-out cursor-pointer
                  ${selectedAnswerIndex === index
                    ? 'bg-[#F0EEE9] text-[#1F1E1C] border-2 border-[#F0EEE9]'
                    : 'bg-[#2D2B28] text-[#F0EEE9] border-2 border-transparent hover:border-[#F0EEE9]/50'
                  }
                `}
              >
                <p className="font-heading text-[20px] font-normal leading-relaxed">
                  &ldquo;{answer.text}&rdquo;
                </p>
              </button>
            ))}
          </div>
          
          <button
            onClick={confirmSelection}
            disabled={selectedAnswerIndex === null}
            className={`
              mt-8 px-12 py-5 font-body text-lg font-bold rounded-lg cursor-pointer
              transition-all duration-150 ease-out select-none
              ${selectedAnswerIndex !== null
                ? 'bg-[#F0EEE9] text-[#1F1E1C] hover:opacity-90 hover:scale-[0.98] active:scale-[0.96]'
                : 'bg-transparent border-2 border-[#9B9388] text-[#9B9388] cursor-not-allowed'
              }
            `}
          >
            CONFIRM PICK
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 4 - Reveal & Score
  if (phase === 'reveal' && winningAnswer) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col animate-fadeIn">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#D4A574] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {subject.name.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            Round {currentRound} Complete
          </p>
          <div className="flex gap-4">
            {scores.map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-body text-[11px] text-[#9B9388]">{s.name}</p>
                <AnimatedScore value={s.score} className="font-heading text-[16px] font-bold text-[#D4A574]" />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-body text-[13px] text-[#9B9388] uppercase tracking-wider">
            {subject.name} picked
          </p>
          
          <div className="mt-6 p-8 bg-[#2D2B28] rounded-xl max-w-[400px]">
            <p className="font-heading text-[28px] font-normal text-[#F0EEE9] text-center leading-relaxed">
              &ldquo;{winningAnswer.text}&rdquo;
            </p>
          </div>
          
          <p className="mt-6 font-body text-[18px] text-[#F0EEE9]">
            Written by <span className="font-bold text-[#D4A574]">{winningAnswer.playerName}</span>
          </p>
          
          <div className="mt-8 flex gap-8">
            <div className="text-center">
              <p className="font-body text-[12px] text-[#9B9388]">{subject.name}</p>
              <p className="font-heading text-[24px] font-bold text-[#D4A574]">+{ESSENCE_SCORING.subject}</p>
            </div>
            <div className="text-center">
              <p className="font-body text-[12px] text-[#9B9388]">{winningAnswer.playerName}</p>
              <p className="font-heading text-[24px] font-bold text-[#D4A574]">+{ESSENCE_SCORING.author}</p>
            </div>
          </div>
          
          <button
            onClick={nextRound}
            className="mt-12 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            {currentRound >= players.length ? 'SEE FINAL SCORES' : 'NEXT ROUND'}
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
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6 animate-fadeIn">
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
              <AnimatedScore value={s.score} className="font-heading text-[24px] font-bold" />
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
