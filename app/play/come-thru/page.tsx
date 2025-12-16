'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  generateComeThruCard,
  calculateComeThruResults,
  COME_THRU_SCORING,
  ComeThruCard,
  SavageryLevel,
  extractScenarioFromPrompt
} from '@/app/lib/comeThruEngine';
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
import SessionGuard from '@/components/SessionGuard';

interface PlayerData {
  name: string;
  goodAt: string;
  ratherDie: string;
}

interface PlayerScore {
  name: string;
  score: number;
}

type GamePhase = 'transition' | 'handoff' | 'intro' | 'scenario' | 'predicting' | 'subject' | 'results' | 'final';

function ComeThruContent({ session: initialSession }: { session: GameSession }) {
  const router = useRouter();
  
  // Game state
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<GamePhase>('transition');
  const [savageryLevel, setSavageryLevel] = useState<SavageryLevel>('standard');
  
  // Round state
  const [currentCard, setCurrentCard] = useState<ComeThruCard | null>(null);
  const [usedScenarios, setUsedScenarios] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [currentPredictorIndex, setCurrentPredictorIndex] = useState(0);
  const [subjectChoice, setSubjectChoice] = useState<string | null>(null);
  const [roundResults, setRoundResults] = useState<{
    correctPredictors: string[];
    points: Record<string, number>;
  } | null>(null);

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
      
      // Generate first card
      const triviaPlayers = formattedPlayers.map(p => ({
        name: p.name,
        ratherDieThan: p.ratherDie
      }));
      const card = generateComeThruCard(triviaPlayers, 1, currentSavagery, []);
      setCurrentCard(card);
      // Extract raw scenario for deduplication (engine compares raw scenarios, not formatted)
      const rawScenario = extractScenarioFromPrompt(card.scenario);
      setUsedScenarios([rawScenario]);
    } catch (error) {
      console.error('Error loading game data:', error);
      router.push('/setup');
    }
  }, [initialSession, router]);

  const startRound = () => {
    setPhase('scenario');
  };

  const startPredicting = () => {
    setPhase('predicting');
    setCurrentPredictorIndex(0);
    setPredictions({});
  };

  const submitPrediction = (predictedPerson: string) => {
    if (!currentCard) return;
    
    const predictors = currentCard.otherPlayers;
    const currentPredictor = predictors[currentPredictorIndex];
    
    // Store prediction
    setPredictions(prev => ({
      ...prev,
      [currentPredictor]: predictedPerson
    }));
    
    // Move to next predictor or subject phase
    if (currentPredictorIndex >= predictors.length - 1) {
      setPhase('subject');
    } else {
      setCurrentPredictorIndex(prev => prev + 1);
    }
  };

  const submitSubjectChoice = (choice: string) => {
    setSubjectChoice(choice);
  };

  const revealResults = () => {
    if (!currentCard || !subjectChoice) return;
    
    // Calculate results
    const results = calculateComeThruResults(
      predictions,
      subjectChoice,
      currentCard.subject
    );
    
    setRoundResults({
      correctPredictors: results.correctPredictors,
      points: results.points
    });
    
    // Update scores
    setScores(prev => prev.map(s => ({
      ...s,
      score: s.score + (results.points[s.name] || 0)
    })));
    
    setPhase('results');
  };

  const nextRound = () => {
    if (currentRound >= players.length) {
      setPhase('final');
    } else {
      // Next round
      const nextRoundNum = currentRound + 1;
      setCurrentRound(nextRoundNum);
      
      // Generate next card
      const triviaPlayers = players.map(p => ({
        name: p.name || 'Unknown',
        ratherDieThan: p.ratherDie || ''
      }));
      const card = generateComeThruCard(triviaPlayers, nextRoundNum, savageryLevel, usedScenarios);
      setCurrentCard(card);
      // Extract raw scenario for deduplication (engine compares raw scenarios, not formatted)
      const rawScenario = extractScenarioFromPrompt(card.scenario);
      setUsedScenarios(prev => [...prev, rawScenario]);
      
      // Reset state
      setPhase('handoff');
      setPredictions({});
      setCurrentPredictorIndex(0);
      setSubjectChoice(null);
      setRoundResults(null);
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
      
      session = updateGameScores(session, 'comeThru', finalScores);
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
            PHONE A FRIEND
          </h1>
          <p className="mt-4 font-body text-[16px] text-[#9B9388]">
            Who do you trust in a crisis?
          </p>
        </div>
      </main>
    );
  }

  // HANDOFF SCREEN (between rounds)
  if (phase === 'handoff') {
    const nextSubject = currentCard?.subject;
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <div className="text-center animate-fadeInScale">
          <h1 className="font-heading text-[48px] font-bold text-[#F0EEE9]">
            {nextSubject?.toUpperCase()} IS UP NEXT
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
        <div className="w-full py-3 bg-[#E07A5F] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {currentCard.subject.toUpperCase()}&apos;S TURN — HOLD THE PHONE
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
                <p className="font-heading text-[16px] font-bold text-[#D4A574]">{s.score}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-body text-[13px] text-[#9B9388] uppercase tracking-wider">
            Time for...
          </p>
          
          <h1 className="mt-4 font-heading text-[36px] font-bold text-[#D4A574] text-center">
            COME THRU!
          </h1>
          
          <div className="mt-6 w-[100px] h-[3px] bg-[#D4A574] rounded-full" />
          
          <p className="mt-8 font-heading text-[24px] font-normal text-[#F0EEE9] text-center">
            {currentCard.subject.toUpperCase()}, we&apos;re about to find out who you trust...
          </p>
          
          <div className="mt-8 p-4 bg-[#2D2B28] rounded-xl max-w-[360px]">
            <p className="font-body text-[14px] text-[#9B9388] text-center">
              Everyone else predicts who you&apos;d call in a crisis
            </p>
          </div>
          
          <button
            onClick={startRound}
            className="mt-10 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            START
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 2 - Scenario Display
  if (phase === 'scenario') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#E07A5F] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {currentCard.subject.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="font-body text-[13px] text-[#D4A574] uppercase tracking-wider">
          The Scenario
        </p>
        
        <div className="mt-6 p-8 bg-[#2D2B28] rounded-xl max-w-[400px]">
          <p className="font-heading text-[24px] font-normal text-[#F0EEE9] text-center leading-relaxed">
            {currentCard.scenario}
          </p>
        </div>
        
        <p className="mt-8 font-body text-[16px] text-[#9B9388] text-center max-w-[320px]">
          Everyone except {currentCard.subject}: Write down who IN THIS ROOM {currentCard.subject} would call
        </p>
        
        <button
          onClick={startPredicting}
          className="mt-10 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
        >
          READY TO PREDICT
        </button>
        </div>
      </main>
    );
  }

  // SCREEN 3 - Prediction Phase
  if (phase === 'predicting') {
    const predictors = currentCard.otherPlayers;
    const currentPredictor = predictors[currentPredictorIndex];
    const hasPredicted = predictions[currentPredictor];
    
    // Options: everyone except the predictor and subject
    const options = players.filter(p => 
      p.name !== currentPredictor && p.name !== currentCard.subject
    );
    
    // Show confirmation after prediction
    if (hasPredicted) {
      const nextPredictor = predictors[currentPredictorIndex + 1];
      
      return (
        <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-[#E07A5F] text-center">
            <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
              {currentPredictor.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-body text-[14px] text-[#4A7C59] uppercase tracking-wider">
            Got it!
          </p>
          
          <h1 className="mt-4 font-heading text-[28px] font-bold text-[#F0EEE9] text-center">
            Your prediction is locked in
          </h1>
          
          <p className="mt-8 font-body text-[18px] text-[#9B9388]">
            Pass the phone to...
          </p>
          
          <p className="mt-2 font-heading text-[32px] font-bold text-[#D4A574]">
            {nextPredictor || currentCard.subject}
          </p>
          
          <button
            onClick={() => {
              if (currentPredictorIndex >= predictors.length - 1) {
                setPhase('subject');
              } else {
                setCurrentPredictorIndex(prev => prev + 1);
              }
            }}
            className="mt-10 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            NEXT
          </button>
          </div>
        </main>
      );
    }
    
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#E07A5F] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {currentPredictor.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider">
            Prediction {currentPredictorIndex + 1} of {predictors.length}
          </p>
          <p className="font-body text-[12px] text-[#D4A574]">
            Don&apos;t let {currentCard.subject} see!
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-body text-[14px] text-[#9B9388] uppercase tracking-wider">
            {currentPredictor}&apos;s turn
          </p>
          
          <h1 className="mt-4 font-heading text-[24px] font-bold text-[#F0EEE9] text-center">
            WHO WOULD {currentCard.subject.toUpperCase()} CALL?
          </h1>
          
          <p className="mt-4 font-body text-[14px] text-[#9B9388] text-center max-w-[300px]">
            {currentCard.scenario}
          </p>
          
          {/* Player buttons */}
          <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[320px]">
            {options.map((player, index) => (
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

  // SCREEN 4 - Subject's Turn
  if (phase === 'subject') {
    const options = players.filter(p => p.name !== currentCard.subject);
    
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#E07A5F] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {currentCard.subject.toUpperCase()}&apos;S TURN — HOLD THE PHONE
          </p>
        </div>
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-center border-b border-[#2D2B28]">
          <p className="font-body text-[12px] text-[#D4A574] uppercase tracking-wider">
            {currentCard.subject}&apos;s Turn
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h1 className="font-heading text-[28px] font-bold text-[#F0EEE9] text-center">
            {currentCard.subject.toUpperCase()}, WHO WOULD YOU ACTUALLY CALL?
          </h1>
          
          <p className="mt-4 font-body text-[14px] text-[#9B9388] text-center max-w-[320px]">
            {currentCard.scenario}
          </p>
          
          <p className="mt-6 font-body text-[12px] text-[#D4A574]">
            Must pick someone in this room
          </p>
          
          {/* Player buttons */}
          <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-[320px]">
            {options.map((player, index) => (
              <button
                key={index}
                onClick={() => submitSubjectChoice(player.name)}
                className={`
                  p-5 rounded-xl font-heading text-[18px] font-bold
                  transition-all duration-150 ease-out cursor-pointer active:scale-[0.96]
                  ${subjectChoice === player.name
                    ? 'bg-[#F0EEE9] text-[#1F1E1C]'
                    : 'bg-[#2D2B28] text-[#F0EEE9] hover:bg-[#3D3B38]'
                  }
                `}
              >
                {player.name}
              </button>
            ))}
          </div>
          
          <button
            onClick={revealResults}
            disabled={!subjectChoice}
            className={`
              mt-10 px-12 py-5 font-body text-lg font-bold rounded-lg cursor-pointer
              transition-all duration-150 ease-out select-none
              ${subjectChoice
                ? 'bg-[#F0EEE9] text-[#1F1E1C] hover:opacity-90 hover:scale-[0.98] active:scale-[0.96]'
                : 'bg-transparent border-2 border-[#9B9388] text-[#9B9388] cursor-not-allowed'
              }
            `}
          >
            REVEAL RESULTS
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 5 - Results & Scoring
  if (phase === 'results' && roundResults && subjectChoice) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col">
        {/* Whose turn banner */}
        <div className="w-full py-3 bg-[#E07A5F] text-center">
          <p className="font-heading text-[18px] font-bold text-[#1F1E1C]">
            {currentCard.subject.toUpperCase()}&apos;S TURN — HOLD THE PHONE
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
        <div className="flex-1 flex flex-col items-center px-6 py-8 overflow-y-auto">
          <p className="font-body text-[13px] text-[#9B9388] uppercase tracking-wider">
            {currentCard.subject} would call...
          </p>
          
          <h1 className="mt-4 font-heading text-[42px] font-bold text-[#D4A574] text-center">
            {subjectChoice.toUpperCase()}
          </h1>
          
          <div className="mt-6 w-[100px] h-[3px] bg-[#D4A574] rounded-full" />
          
          {/* Predictions breakdown */}
          <div className="mt-8 w-full max-w-[360px] space-y-3">
            {Object.entries(predictions).map(([predictor, predicted]) => {
              const isCorrect = predicted === subjectChoice;
              return (
                <div
                  key={predictor}
                  className={`
                    flex items-center justify-between p-4 rounded-lg
                    ${isCorrect ? 'bg-[#4A7C59]/20' : 'bg-[#2D2B28]'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[18px] ${isCorrect ? 'text-[#4A7C59]' : 'text-[#C45B4D]'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="font-body text-[16px] text-[#F0EEE9]">{predictor}</span>
                  </div>
                  <span className={`font-body text-[14px] ${isCorrect ? 'text-[#4A7C59]' : 'text-[#9B9388]'}`}>
                    guessed {predicted}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Points breakdown */}
          <div className="mt-8 p-4 bg-[#2D2B28] rounded-xl w-full max-w-[360px]">
            <p className="font-body text-[12px] text-[#9B9388] uppercase tracking-wider text-center mb-4">
              Points This Round
            </p>
            
            <div className="space-y-2">
              {/* Correct predictors */}
              {roundResults.correctPredictors.map(name => (
                <div key={`correct-${name}`} className="flex justify-between">
                  <span className="font-body text-[14px] text-[#F0EEE9]">{name}</span>
                  <span className="font-heading text-[16px] font-bold text-[#4A7C59]">
                    +{COME_THRU_SCORING.correctPrediction} (correct!)
                  </span>
                </div>
              ))}
              
              {/* Chosen person */}
              {subjectChoice !== currentCard.subject && (
                <div className="flex justify-between">
                  <span className="font-body text-[14px] text-[#F0EEE9]">{subjectChoice}</span>
                  <span className="font-heading text-[16px] font-bold text-[#D4A574]">
                    +{COME_THRU_SCORING.chosenPerson} (the chosen one)
                  </span>
                </div>
              )}
              
              {/* Subject points for wrong guesses */}
              {roundResults.points[currentCard.subject] > 0 && (
                <div className="flex justify-between">
                  <span className="font-body text-[14px] text-[#F0EEE9]">{currentCard.subject}</span>
                  <span className="font-heading text-[16px] font-bold text-[#D4A574]">
                    +{roundResults.points[currentCard.subject]} ({Object.keys(predictions).length - roundResults.correctPredictors.length} wrong guesses)
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={nextRound}
            className="mt-8 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          >
            {currentRound >= players.length ? 'SEE FINAL SCORES' : 'NEXT ROUND'}
          </button>
        </div>
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
          Come Thru Complete
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

export default function ComeThru() {
  return (
    <SessionGuard redirectOnInvalid={true}>
      {(session) => <ComeThruContent session={session} />}
    </SessionGuard>
  );
}

