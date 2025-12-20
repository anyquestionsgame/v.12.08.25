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
              PHONE A FRIEND
            </h1>
            <p className="mt-4 font-body text-[16px] text-qtc-copper">
              Who do you trust in a crisis?
            </p>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // HANDOFF SCREEN (between rounds)
  if (phase === 'handoff') {
    const nextSubject = currentCard?.subject;
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center animate-fadeInScale">
            <h1 className="font-heading text-[48px] font-bold text-qtc-brass-light">
              {nextSubject?.toUpperCase()} IS UP NEXT
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
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-copper-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {currentCard.subject.toUpperCase()}&apos;S TURN — HOLD THE PHONE
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
              Time for...
            </p>
            
            <h1 className="mt-4 font-heading text-[36px] font-bold text-qtc-brass-light text-center">
              COME THRU!
            </h1>
            
            <div className="mt-6 w-[100px] h-[3px] bg-qtc-brass rounded-full" />
            
            <p className="mt-8 font-heading text-[24px] font-normal text-qtc-cream text-center">
              {currentCard.subject.toUpperCase()}, we&apos;re about to find out who you trust...
            </p>
            
            <GameCard variant="dark" className="mt-8 max-w-[360px]">
              <p className="font-body text-[14px] text-qtc-copper text-center">
                Everyone else predicts who you&apos;d call in a crisis
              </p>
            </GameCard>
            
            <BrassButton
              onClick={startRound}
              variant="holiday"
              size="lg"
              className="mt-10"
            >
              START
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 2 - Scenario Display
  if (phase === 'scenario') {
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-copper-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {currentCard.subject.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="font-mono text-[13px] text-qtc-brass uppercase tracking-wider">
            The Scenario
          </p>
          
          <GameCard variant="copper" className="mt-6 max-w-[400px]">
            <p className="font-heading text-[24px] font-normal text-qtc-copper-light text-center leading-relaxed">
              {currentCard.scenario}
            </p>
          </GameCard>
          
          <p className="mt-8 font-body text-[16px] text-qtc-copper text-center max-w-[320px]">
            Everyone except {currentCard.subject}: Write down who IN THIS ROOM {currentCard.subject} would call
          </p>
          
          <BrassButton
            onClick={startPredicting}
            variant="holiday"
            size="lg"
            className="mt-10"
          >
            READY TO PREDICT
          </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
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
        <SteampunkLayout variant="dark" showGears={true}>
          <main className="min-h-screen flex flex-col">
            {/* Whose turn banner */}
            <div className="w-full py-3 bg-copper-gradient text-center shadow-deep">
              <p className="font-heading text-[18px] font-bold text-qtc-cream">
                {currentPredictor.toUpperCase()}&apos;S TURN — HOLD THE PHONE
              </p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-6">
            <p className="font-body text-[14px] text-qtc-holiday-green uppercase tracking-wider">
              Got it!
            </p>
            
            <h1 className="mt-4 font-heading text-[28px] font-bold text-qtc-cream text-center">
              Your prediction is locked in
            </h1>
            
            <p className="mt-8 font-body text-[18px] text-qtc-copper">
              Pass the phone to...
            </p>
            
            <p className="mt-2 font-heading text-[32px] font-bold text-qtc-brass">
              {nextPredictor || currentCard.subject}
            </p>
            
            <BrassButton
              onClick={() => {
                if (currentPredictorIndex >= predictors.length - 1) {
                  setPhase('subject');
                } else {
                  setCurrentPredictorIndex(prev => prev + 1);
                }
              }}
              variant="holiday"
              size="lg"
              className="mt-10"
            >
              NEXT
            </BrassButton>
            </div>
          </main>
        </SteampunkLayout>
      );
    }
    
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-copper-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {currentPredictor.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top bar */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider">
              Prediction {currentPredictorIndex + 1} of {predictors.length}
            </p>
            <p className="font-body text-[12px] text-qtc-brass">
              Don&apos;t let {currentCard.subject} see!
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <p className="font-mono text-[14px] text-qtc-copper uppercase tracking-wider">
              {currentPredictor}&apos;s turn
            </p>
            
            <h1 className="mt-4 font-heading text-[24px] font-bold text-qtc-brass-light text-center">
              WHO WOULD {currentCard.subject.toUpperCase()} CALL?
            </h1>
            
            <p className="mt-4 font-body text-[14px] text-qtc-copper text-center max-w-[300px]">
              {currentCard.scenario}
            </p>
            
            {/* Player buttons */}
            <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[320px]">
              {options.map((player, index) => (
                <button
                  key={index}
                  onClick={() => submitPrediction(player.name)}
                  className="p-5 bg-qtc-charcoal text-qtc-cream rounded-xl font-heading text-[18px] font-bold transition-all duration-150 ease-out cursor-pointer hover:bg-brass-gradient hover:text-qtc-black active:scale-[0.96] border-2 border-qtc-brass/50"
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 4 - Subject's Turn
  if (phase === 'subject') {
    const options = players.filter(p => p.name !== currentCard.subject);
    
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-copper-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {currentCard.subject.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top bar */}
          <div className="px-6 py-4 flex items-center justify-center border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-brass uppercase tracking-wider">
              {currentCard.subject}&apos;s Turn
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <h1 className="font-heading text-[28px] font-bold text-qtc-brass-light text-center">
              {currentCard.subject.toUpperCase()}, WHO WOULD YOU ACTUALLY CALL?
            </h1>
            
            <p className="mt-4 font-body text-[14px] text-qtc-copper text-center max-w-[320px]">
              {currentCard.scenario}
            </p>
            
            <p className="mt-6 font-body text-[12px] text-qtc-brass">
              Must pick someone in this room
            </p>
            
            {/* Player buttons */}
            <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-[320px]">
              {options.map((player, index) => (
                <button
                  key={index}
                  onClick={() => submitSubjectChoice(player.name)}
                  className={`
                    p-5 rounded-xl font-heading text-[18px] font-bold border-2
                    transition-all duration-150 ease-out cursor-pointer active:scale-[0.96]
                    ${subjectChoice === player.name
                      ? 'bg-brass-gradient text-qtc-black border-qtc-brass-light/30 shadow-brass'
                      : 'bg-qtc-charcoal text-qtc-cream border-qtc-brass/50 hover:border-qtc-brass'
                    }
                  `}
                >
                  {player.name}
                </button>
              ))}
            </div>
            
            <BrassButton
              onClick={revealResults}
              disabled={!subjectChoice}
              variant={subjectChoice ? "holiday" : "secondary"}
              size="lg"
              className="mt-10"
            >
              REVEAL RESULTS
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // SCREEN 5 - Results & Scoring
  if (phase === 'results' && roundResults && subjectChoice) {
    return (
      <SteampunkLayout variant="holiday" showGears={true}>
        <main className="min-h-screen flex flex-col">
          {/* Whose turn banner */}
          <div className="w-full py-3 bg-holiday-gradient text-center shadow-deep">
            <p className="font-heading text-[18px] font-bold text-qtc-cream">
              {currentCard.subject.toUpperCase()}&apos;S TURN — HOLD THE PHONE
            </p>
          </div>
          {/* Top bar */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider">
              Round {currentRound} Results
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
          <div className="flex-1 flex flex-col items-center px-6 py-8 overflow-y-auto">
            <HolidayGarland className="mb-6" />
            
            <p className="font-mono text-[13px] text-qtc-copper uppercase tracking-wider">
              {currentCard.subject} would call...
            </p>
            
            <h1 className="mt-4 font-heading text-[42px] font-bold text-qtc-brass-light text-center">
              {subjectChoice.toUpperCase()}
            </h1>
            
            <div className="mt-6 w-[100px] h-[3px] bg-qtc-brass rounded-full" />
            
            {/* Predictions breakdown */}
            <div className="mt-8 w-full max-w-[360px] space-y-3">
              {Object.entries(predictions).map(([predictor, predicted]) => {
                const isCorrect = predicted === subjectChoice;
                return (
                  <GameCard
                    key={predictor}
                    variant={isCorrect ? "brass" : "dark"}
                    className={isCorrect ? 'bg-brass-gradient text-qtc-black' : ''}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-[18px] ${isCorrect ? 'text-qtc-black' : 'text-qtc-holiday-red'}`}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                        <span className={`font-body text-[16px] ${isCorrect ? 'text-qtc-black' : 'text-qtc-cream'}`}>
                          {predictor}
                        </span>
                      </div>
                      <span className={`font-body text-[14px] ${isCorrect ? 'text-qtc-black' : 'text-qtc-copper'}`}>
                        guessed {predicted}
                      </span>
                    </div>
                  </GameCard>
                );
              })}
            </div>
            
            {/* Points breakdown */}
            <GameCard variant="dark" className="mt-8 w-full max-w-[360px]">
              <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider text-center mb-4">
                Points This Round
              </p>
              
              <div className="space-y-2">
                {/* Correct predictors */}
                {roundResults.correctPredictors.map(name => (
                  <div key={`correct-${name}`} className="flex justify-between">
                    <span className="font-body text-[14px] text-qtc-cream">{name}</span>
                    <span className="font-heading text-[16px] font-bold text-qtc-holiday-green">
                      +{COME_THRU_SCORING.correctPrediction} (correct!)
                    </span>
                  </div>
                ))}
                
                {/* Chosen person */}
                {subjectChoice !== currentCard.subject && (
                  <div className="flex justify-between">
                    <span className="font-body text-[14px] text-qtc-cream">{subjectChoice}</span>
                    <span className="font-heading text-[16px] font-bold text-qtc-brass">
                      +{COME_THRU_SCORING.chosenPerson} (the chosen one)
                    </span>
                  </div>
                )}
                
                {/* Subject points for wrong guesses */}
                {roundResults.points[currentCard.subject] > 0 && (
                  <div className="flex justify-between">
                    <span className="font-body text-[14px] text-qtc-cream">{currentCard.subject}</span>
                    <span className="font-heading text-[16px] font-bold text-qtc-brass">
                      +{roundResults.points[currentCard.subject]} ({Object.keys(predictions).length - roundResults.correctPredictors.length} wrong guesses)
                    </span>
                  </div>
                )}
              </div>
            </GameCard>
            
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
            Come Thru Complete
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
