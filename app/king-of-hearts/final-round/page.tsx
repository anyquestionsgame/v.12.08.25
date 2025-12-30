'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TriviaQuestion } from '@/app/lib/aiQuestionEngine';
import { 
  SteampunkLayout, 
  BrassButton,
  BrassInput,
  GameCard, 
  HolidayGarland, 
  Gear,
  GaugePanel 
} from '@/components/ui/qtc-components';

interface Player {
  name: string;
  selfCategory: string;
  peerCategory: string;
  score: number;
}

interface PlayerWager {
  name: string;
  wager: number;
  locked: boolean;
  correct?: boolean;
}

type FinalRoundPhase = 
  | 'loading'
  | 'intro'
  | 'wagering'
  | 'question'
  | 'reveal'
  | 'results';

export default function FinalRound() {
  const router = useRouter();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [sharedCategory, setSharedCategory] = useState('');
  const [phase, setPhase] = useState<FinalRoundPhase>('loading');
  const [wagers, setWagers] = useState<PlayerWager[]>([]);
  const [currentWagerIndex, setCurrentWagerIndex] = useState(0);
  const [wagerInput, setWagerInput] = useState('');
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [displayCategory, setDisplayCategory] = useState('');
  const [mounted, setMounted] = useState(false);

  // Load game state from localStorage
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const storedState = localStorage.getItem('king_of_hearts_game_state');
      const storedSharedCategory = localStorage.getItem('king_of_hearts_shared_category');
      const storedQuestions = localStorage.getItem('king_of_hearts_questions');
      
      if (storedState && storedSharedCategory) {
        try {
          const { players: savedPlayers } = JSON.parse(storedState);
          
          const gamePlayers: Player[] = savedPlayers.map((p: any) => ({
            name: p.name,
            selfCategory: p.selfCategory,
            peerCategory: p.peerCategory,
            score: p.score || 0,
          }));
          
          setPlayers(gamePlayers);
          setSharedCategory(storedSharedCategory);
          
          // Initialize wagers for each player
          setWagers(gamePlayers.map(p => ({
            name: p.name,
            wager: 0,
            locked: false,
          })));
          
          // Load pre-generated question for shared category
          if (storedQuestions) {
            const questionsData = JSON.parse(storedQuestions);
            const categoryQuestions = questionsData[storedSharedCategory];
            if (categoryQuestions && categoryQuestions.length > 0) {
              setQuestion(categoryQuestions[0]);
              setDisplayCategory(categoryQuestions[0].displayCategory || storedSharedCategory);
            }
          }
          
          setPhase('intro');
        } catch (error) {
          console.error('Error loading final round state:', error);
          router.push('/king-of-hearts');
        }
      } else {
        router.push('/king-of-hearts');
      }
    }
  }, [router]);

  const handleWagerSubmit = () => {
    const amount = parseInt(wagerInput, 10);
    const currentPlayer = players[currentWagerIndex];
    const maxWager = currentPlayer.score > 0 ? currentPlayer.score : 0;
    const validWager = Math.max(0, Math.min(amount || 0, maxWager));
    
    // Update wager for current player
    setWagers(prev => prev.map((w, i) => 
      i === currentWagerIndex ? { ...w, wager: validWager, locked: true } : w
    ));
    
    // Move to next player or question phase
    if (currentWagerIndex >= players.length - 1) {
      setPhase('question');
    } else {
      setCurrentWagerIndex(prev => prev + 1);
      setWagerInput('');
    }
  };

  const handleRevealAnswer = () => {
    setPhase('reveal');
  };

  const handleMarkCorrect = (playerName: string, isCorrect: boolean) => {
    setWagers(prev => prev.map(w => 
      w.name === playerName ? { ...w, correct: isCorrect } : w
    ));
  };

  const handleFinalize = () => {
    // Calculate final scores
    const updatedPlayers = players.map(player => {
      const playerWager = wagers.find(w => w.name === player.name);
      if (!playerWager) return player;
      
      const scoreChange = playerWager.correct ? playerWager.wager : -playerWager.wager;
      return {
        ...player,
        score: player.score + scoreChange,
      };
    });
    
    setPlayers(updatedPlayers);
    setPhase('results');
    
    // Save final scores
    if (typeof window !== 'undefined') {
      localStorage.setItem('king_of_hearts_final_scores', JSON.stringify(updatedPlayers));
    }
  };

  const handleGameComplete = () => {
    router.push('/king-of-hearts/game-over');
  };

  if (!mounted || phase === 'loading' || players.length === 0) {
    return (
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // INTRO SCREEN
  // ═══════════════════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <SteampunkLayout variant="holiday">
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <HolidayGarland className="mb-8" />
          
          <p className="font-mono text-[14px] text-qtc-copper uppercase tracking-wider">
            Final Round
          </p>
          
          <h1 className="mt-4 font-heading text-[42px] font-bold text-qtc-brass-light text-center leading-tight">
            One Thing You All Know
          </h1>
          
          <GameCard variant="holiday" className="mt-8 max-w-[400px]">
            <p className="text-center font-heading text-[24px] font-bold text-qtc-cream">
              {displayCategory || sharedCategory}
            </p>
            <p className="mt-2 text-center font-body text-[14px] text-qtc-cream/80">
              Everyone wagers on their knowledge
            </p>
          </GameCard>
          
          <div className="mt-8 w-[100px] h-[3px] bg-qtc-brass rounded-full" />
          
          <p className="mt-8 font-body text-[16px] text-qtc-copper text-center max-w-[400px]">
            Each player will secretly wager their points. Answer correctly to win your wager—answer wrong to lose it.
          </p>
          
          <BrassButton
            variant="holiday"
            size="lg"
            onClick={() => setPhase('wagering')}
            className="mt-10"
          >
            Start Wagering
          </BrassButton>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // WAGERING SCREEN (One player at a time)
  // ═══════════════════════════════════════════════════════════
  if (phase === 'wagering') {
    const currentPlayer = players[currentWagerIndex];
    const maxWager = Math.max(0, currentPlayer.score);
    
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="w-full py-3 bg-holiday-gradient text-center shadow-deep">
            <p className="font-heading text-[16px] font-bold text-qtc-cream uppercase tracking-wider">
              {currentPlayer.name}&apos;s Turn — Don&apos;t Let Anyone See!
            </p>
          </div>
          
          {/* Progress */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-qtc-brass/30 bg-qtc-charcoal/80">
            <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider">
              Wager {currentWagerIndex + 1} of {players.length}
            </p>
            <p className="font-body text-[14px] text-qtc-brass">
              Your points: {currentPlayer.score}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <h1 className="font-heading text-[32px] font-bold text-qtc-brass-light text-center">
              {currentPlayer.name}, how confident are you?
            </h1>
            
            <p className="mt-4 font-body text-[16px] text-qtc-copper text-center">
              Category: <span className="text-qtc-holiday-red font-semibold">{displayCategory || sharedCategory}</span>
            </p>
            
            <GameCard variant="brass" className="mt-8 w-full max-w-[400px]">
              <label className="block font-heading text-[18px] font-bold text-qtc-brass-light mb-2">
                Enter your wager
              </label>
              <p className="mb-4 font-body text-[14px] text-qtc-copper">
                Min: 0 • Max: {maxWager}
              </p>
              <BrassInput
                type="number"
                min={0}
                max={maxWager}
                value={wagerInput}
                onChange={(e) => setWagerInput(e.target.value)}
                placeholder={`0 - ${maxWager}`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleWagerSubmit();
                }}
              />
            </GameCard>
            
            <BrassButton
              variant="holiday"
              size="lg"
              onClick={handleWagerSubmit}
              className="mt-8"
            >
              Lock In Wager
            </BrassButton>
            
            {/* Progress dots */}
            <div className="mt-8 flex gap-2">
              {players.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300
                    ${index < currentWagerIndex
                      ? 'bg-qtc-brass'
                      : index === currentWagerIndex
                        ? 'bg-qtc-holiday-red'
                        : 'bg-qtc-copper/30'
                    }
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // QUESTION SCREEN (All players see this)
  // ═══════════════════════════════════════════════════════════
  if (phase === 'question' && question) {
    return (
      <SteampunkLayout variant="holiday" showGears={true}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="w-full py-3 bg-holiday-gradient text-center shadow-deep">
            <p className="font-heading text-[16px] font-bold text-qtc-cream uppercase tracking-wider">
              Final Round — {displayCategory || sharedCategory}
            </p>
          </div>

          {/* Scoreboard with wagers */}
          <div className="px-4 py-4 flex items-center justify-center gap-4 bg-qtc-charcoal/80 border-b border-qtc-brass/30">
            {players.map((player) => {
              const playerWager = wagers.find(w => w.name === player.name);
              return (
                <div key={player.name} className="text-center">
                  <GaugePanel
                    label={player.name}
                    value={player.score}
                    unit="pts"
                  />
                  <p className="mt-1 font-mono text-[12px] text-qtc-holiday-gold">
                    Wagered: {playerWager?.wager || 0}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Question */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <p className="font-mono text-[14px] text-qtc-copper uppercase tracking-wider">
              The Question
            </p>
            
            <GameCard variant="holiday" className="mt-6 max-w-[500px]">
              <p className="font-heading text-[24px] font-normal text-qtc-cream text-center leading-relaxed">
                {question.questionText}
              </p>
              {question.rangeText && (
                <p className="mt-4 font-body text-[16px] text-qtc-cream/80 text-center italic">
                  {question.rangeText}
                </p>
              )}
            </GameCard>
            
            <p className="mt-8 font-body text-[16px] text-qtc-copper text-center max-w-[400px]">
              Everyone think of your answer... When ready, reveal the answer.
            </p>
            
            <BrassButton
              variant="holiday"
              size="lg"
              onClick={handleRevealAnswer}
              className="mt-8"
            >
              Reveal Answer
            </BrassButton>
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // REVEAL SCREEN (Mark who got it right)
  // ═══════════════════════════════════════════════════════════
  if (phase === 'reveal' && question) {
    const allMarked = wagers.every(w => w.correct !== undefined);
    
    return (
      <SteampunkLayout variant="holiday" showGears={true}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="w-full py-3 bg-holiday-gradient text-center shadow-deep">
            <p className="font-heading text-[16px] font-bold text-qtc-cream uppercase tracking-wider">
              The Answer Is...
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center px-6 py-8">
            <HolidayGarland className="mb-6" />
            
            <h1 className="font-heading text-[48px] font-bold text-qtc-brass-light text-center">
              {question.answer.display}
            </h1>
            
            <p className="mt-2 font-body text-[14px] text-qtc-copper">
              Also accepted: {question.answer.acceptable.join(', ')}
            </p>
            
            <div className="mt-8 w-[100px] h-[3px] bg-qtc-brass rounded-full" />
            
            {/* Mark each player correct/incorrect */}
            <p className="mt-8 font-mono text-[14px] text-qtc-copper uppercase tracking-wider">
              Who got it right?
            </p>
            
            <div className="mt-4 w-full max-w-[400px] space-y-3">
              {wagers.map((playerWager) => {
                const player = players.find(p => p.name === playerWager.name);
                if (!player) return null;
                
                return (
                  <GameCard 
                    key={playerWager.name} 
                    variant={playerWager.correct === true ? 'brass' : playerWager.correct === false ? 'dark' : 'copper'}
                    className={playerWager.correct === true ? 'bg-brass-gradient' : ''}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-heading text-[18px] font-bold ${
                          playerWager.correct === true ? 'text-qtc-black' : 'text-qtc-cream'
                        }`}>
                          {playerWager.name}
                        </p>
                        <p className={`font-mono text-[14px] ${
                          playerWager.correct === true ? 'text-qtc-black/70' : 'text-qtc-copper'
                        }`}>
                          Wagered: {playerWager.wager}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkCorrect(playerWager.name, true)}
                          className={`
                            px-4 py-2 rounded-lg font-body text-[14px] font-bold
                            transition-all duration-150
                            ${playerWager.correct === true
                              ? 'bg-qtc-holiday-green text-white'
                              : 'bg-qtc-charcoal text-qtc-cream hover:bg-qtc-holiday-green/80'
                            }
                          `}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleMarkCorrect(playerWager.name, false)}
                          className={`
                            px-4 py-2 rounded-lg font-body text-[14px] font-bold
                            transition-all duration-150
                            ${playerWager.correct === false
                              ? 'bg-qtc-holiday-red text-white'
                              : 'bg-qtc-charcoal text-qtc-cream hover:bg-qtc-holiday-red/80'
                            }
                          `}
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                  </GameCard>
                );
              })}
            </div>
            
            <BrassButton
              variant={allMarked ? "holiday" : "secondary"}
              size="lg"
              onClick={handleFinalize}
              disabled={!allMarked}
              className="mt-8"
            >
              Calculate Final Scores
            </BrassButton>
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ═══════════════════════════════════════════════════════════
  if (phase === 'results') {
    return (
      <SteampunkLayout variant="holiday">
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <HolidayGarland className="mb-6" />
          
          <p className="font-mono text-[14px] text-qtc-copper uppercase tracking-wider">
            Final Round Complete
          </p>
          
          <h1 className="mt-4 font-heading text-[36px] font-bold text-qtc-brass-light text-center">
            Score Changes
          </h1>
          
          <div className="mt-8 w-full max-w-[400px] space-y-3">
            {wagers.map((playerWager) => {
              const scoreChange = playerWager.correct ? playerWager.wager : -playerWager.wager;
              const newScore = (players.find(p => p.name === playerWager.name)?.score || 0);
              
              return (
                <GameCard 
                  key={playerWager.name}
                  variant={playerWager.correct ? 'brass' : 'dark'}
                  className={playerWager.correct ? 'bg-brass-gradient' : ''}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-heading text-[18px] font-bold ${
                        playerWager.correct ? 'text-qtc-black' : 'text-qtc-cream'
                      }`}>
                        {playerWager.name}
                      </p>
                      <p className={`font-mono text-[14px] ${
                        playerWager.correct ? 'text-qtc-black/70' : 'text-qtc-copper'
                      }`}>
                        {playerWager.correct ? '✓ Correct!' : '✗ Wrong'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-heading text-[24px] font-bold ${
                        scoreChange > 0 ? 'text-qtc-holiday-green' : 'text-qtc-holiday-red'
                      }`}>
                        {scoreChange > 0 ? '+' : ''}{scoreChange}
                      </p>
                      <p className={`font-mono text-[12px] ${
                        playerWager.correct ? 'text-qtc-black/70' : 'text-qtc-copper'
                      }`}>
                        Now: {newScore}
                      </p>
                    </div>
                  </div>
                </GameCard>
              );
            })}
          </div>
          
          <BrassButton
            variant="holiday"
            size="lg"
            onClick={handleGameComplete}
            className="mt-10"
          >
            See Final Results
          </BrassButton>
        </div>
      </SteampunkLayout>
    );
  }

  return null;
}

