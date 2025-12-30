'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TriviaQuestion } from '@/app/lib/aiQuestionEngine';
import { 
  SteampunkLayout, 
  BrassButton, 
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

// Shared category for Final Round - loaded from localStorage
interface GameConfig {
  sharedCategory: string;
  playerCount: number;
}

type GamePhase = 
  | 'loading'
  | 'round-intro'      // Show round title before starting
  | 'category-select'
  | 'point-select'
  | 'generating'
  | 'question'
  | 'steal'
  | 'scoring';

// ═══════════════════════════════════════════════════════════
// ANY QUESTIONS PERSONALITY - CALLOUTS & COMMENTARY
// ═══════════════════════════════════════════════════════════

// Category-specific personality map
const categoryPersonality: Record<string, { callout: string; intro: string; steal: string }> = {
  wine: {
    callout: "Pour one out - someone's getting tested",
    intro: "put down that glass",
    steal: "time to prove you're not just pretentious"
  },
  excel: {
    callout: "Finally has an audience for this",
    intro: "close that spreadsheet",
    steal: "formula time"
  },
  spreadsheets: {
    callout: "Finally has an audience for this",
    intro: "step away from the pivot tables",
    steal: "VLOOKUP this"
  },
  'reality tv': {
    callout: "Watches enough to teach a masterclass",
    intro: "pause the reunion",
    steal: "no spoilers"
  },
  cats: {
    callout: "Camera roll is 90% cats",
    intro: "stop showing us cat videos",
    steal: "your cat can't help you"
  },
  dogs: {
    callout: "Has 47 dog photos to show you later",
    intro: "yes, we've seen the puppy pics",
    steal: "fetch this answer"
  },
  'taylor swift': {
    callout: "Ready for it?",
    intro: "shake it off and focus",
    steal: "time to prove you're not just a casual listener"
  },
  music: {
    callout: "Spotify Wrapped is their personality",
    intro: "put down the aux cord",
    steal: "hit the right note"
  },
  food: {
    callout: "Reviews every restaurant",
    intro: "put down the menu",
    steal: "what's cooking?"
  },
  cooking: {
    callout: "Claims they're 'pretty good at cooking'",
    intro: "step away from the kitchen",
    steal: "time to taste test"
  },
  movies: {
    callout: "Has opinions about the Oscars",
    intro: "and the award goes to...",
    steal: "cut to the chase"
  },
  sports: {
    callout: "Will make this about their fantasy team",
    intro: "this isn't about your bracket",
    steal: "game time"
  },
  travel: {
    callout: "Will somehow mention this at parties",
    intro: "we get it, you've been places",
    steal: "navigate this one"
  },
  history: {
    callout: "Actually paid attention in class",
    intro: "time travel not allowed",
    steal: "rewrite history"
  },
  science: {
    callout: "Watches a lot of documentaries",
    intro: "no Googling allowed",
    steal: "prove your hypothesis"
  },
  gaming: {
    callout: "Takes this very seriously",
    intro: "pause the game",
    steal: "boss fight time"
  },
  pottery: {
    callout: "Ghost movie vibes",
    intro: "channel your inner Patrick Swayze",
    steal: "wheel and deal"
  },
  plants: {
    callout: "Has named all of them",
    intro: "water your answer carefully",
    steal: "time to grow"
  },
  coffee: {
    callout: "It's not just caffeine, it's a lifestyle",
    intro: "espresso yourself",
    steal: "brew up an answer"
  }
};

// Get category callout with fallback
const getCategoryCallout = (category: string, expertName: string): string => {
  const lowerCat = category.toLowerCase();
  
  // Check for exact match
  if (categoryPersonality[lowerCat]) {
    return categoryPersonality[lowerCat].callout;
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(categoryPersonality)) {
    if (lowerCat.includes(key) || key.includes(lowerCat)) {
      return value.callout;
    }
  }
  
  // Generic fallbacks with expert name
  const genericCallouts = [
    `Time to see if ${expertName} actually knows this`,
    `${expertName} finally gets to show off`,
    `Let's test ${expertName}'s expertise`,
    `${expertName}'s moment to shine`,
    `Put ${expertName} on the spot`
  ];
  
  return genericCallouts[Math.floor(Math.random() * genericCallouts.length)];
};

// Point value descriptions
const pointDescriptions: Record<number, { label: string; subtitle: string }> = {
  // Round 1 points
  100: { label: "100", subtitle: "The gimme" },
  200: { label: "200", subtitle: "Casual fan territory" },
  300: { label: "300", subtitle: "Deep cut territory" },
  // Round 2 points
  250: { label: "250", subtitle: "Easy-ish territory" },
  500: { label: "500", subtitle: "Prove you've been listening" }
};

// Get available points based on round and player count
const getRoundPoints = (round: 1 | 2, playerCount: number): number[] => {
  if (round === 2) {
    if (playerCount >= 7) return [500];
    return [250, 500];
  }
  // Round 1
  if (playerCount >= 5) return [200, 300];
  return [100, 200, 300];
};

// Steal prompts
const getStealPrompt = (expertName: string, category: string): { title: string; subtitle: string } => {
  const lowerCat = category.toLowerCase();
  
  // Check for category-specific steal line
  for (const [key, value] of Object.entries(categoryPersonality)) {
    if (lowerCat.includes(key) || key.includes(lowerCat)) {
      return {
        title: `${expertName},`,
        subtitle: value.steal
      };
    }
  }
  
  // Generic steal prompts
  const prompts = [
    { title: `${expertName},`, subtitle: "show us what you got!" },
    { title: `${expertName},`, subtitle: "prove it!" },
    { title: `Time to earn that expert title,`, subtitle: expertName },
    { title: `${expertName},`, subtitle: "save us from this disaster" },
    { title: `Your moment,`, subtitle: `${expertName} - don't blow it` },
    { title: `${expertName},`, subtitle: "here's your chance!" },
    { title: `Alright ${expertName},`, subtitle: "redemption time" }
  ];
  
  return prompts[Math.floor(Math.random() * prompts.length)];
};

// Scoring commentary
const getScoringCommentary = (playerName: string, expertName: string | null, stealAttempted: boolean): string => {
  const commentary = [
    `Moment of truth...`,
    `Let's see who's walking away with points...`,
    `Time to settle this...`,
    `And the verdict is...`,
    `Who actually knew it?`
  ];
  
  if (stealAttempted && expertName) {
    commentary.push(
      `Did ${expertName} save the day?`,
      `${playerName} or ${expertName}?`,
      `Someone's getting points, someone's not...`
    );
  }
  
  return commentary[Math.floor(Math.random() * commentary.length)];
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function KingOfHeartsPlay() {
  const router = useRouter();
  
  // Core game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('loading');
  
  // Game configuration (loaded from setup)
  const [gameConfig, setGameConfig] = useState<GameConfig>({ sharedCategory: '', playerCount: 4 });
  
  // Question tracking
  const [questionsAsked, setQuestionsAsked] = useState<Set<string>>(new Set());
  
  // AI Question cache
  const [questionCache, setQuestionCache] = useState<Map<string, TriviaQuestion[]>>(new Map());
  
  // Display category names mapping (original -> fun display name)
  const [displayCategoryNames, setDisplayCategoryNames] = useState<Map<string, string>>(new Map());
  
  // Current question state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [stealAttempted, setStealAttempted] = useState(false);
  const [expertName, setExpertName] = useState<string | null>(null);
  
  // Personality state - store random selections so they don't change on re-render
  const [stealPromptData, setStealPromptData] = useState<{ title: string; subtitle: string } | null>(null);
  const [scoringCommentary, setScoringCommentary] = useState<string>('');
  
  const [mounted, setMounted] = useState(false);

  // Load players and pre-generated questions from localStorage
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const storedPlayers = localStorage.getItem('king_of_hearts_players');
      const storedRound = localStorage.getItem('king_of_hearts_round');
      const storedQuestions = localStorage.getItem('king_of_hearts_questions');
      const storedSharedCategory = localStorage.getItem('king_of_hearts_shared_category');
      
      if (storedPlayers) {
        try {
          const parsed = JSON.parse(storedPlayers);
          const isRound2 = storedRound === '2';
          
          const gamePlayers: Player[] = parsed.map((p: any) => ({
            name: p.name,
            selfCategory: p.selfCategory,
            peerCategory: p.peerCategory,
            score: p.score || 0,
          }));
          
          setPlayers(gamePlayers);
          setCurrentRound(isRound2 ? 2 : 1);
          setCurrentPlayerIndex(Math.floor(Math.random() * gamePlayers.length));
          
          // Load game configuration
          setGameConfig({
            sharedCategory: storedSharedCategory || '',
            playerCount: gamePlayers.length,
          });
          
          if (storedQuestions) {
            try {
              const questionsData = JSON.parse(storedQuestions);
              const cache = new Map<string, TriviaQuestion[]>();
              const displayNames = new Map<string, string>();
              
              for (const [category, questions] of Object.entries(questionsData)) {
                const typedQuestions = questions as TriviaQuestion[];
                cache.set(category, typedQuestions);
                
                // Extract display category from first question if available
                if (typedQuestions.length > 0 && typedQuestions[0].displayCategory) {
                  displayNames.set(category, typedQuestions[0].displayCategory);
                }
              }
              
              setQuestionCache(cache);
              setDisplayCategoryNames(displayNames);
              console.log(`[Play] Loaded ${cache.size} pre-generated categories with fun names from storage`);
            } catch (e) {
              console.error('Error parsing stored questions:', e);
            }
          }
          
          // Show round intro first, then category select
          setGamePhase('round-intro');
        } catch (error) {
          console.error('Error parsing players:', error);
          router.push('/king-of-hearts');
        }
      } else {
        router.push('/king-of-hearts');
      }
    }
  }, [router]);

  const currentPlayer = useMemo(() => {
    if (players.length === 0) return null;
    return players[currentPlayerIndex];
  }, [players, currentPlayerIndex]);

  const categories = useMemo(() => {
    return players.map(player => ({
      name: currentRound === 1 ? player.selfCategory : player.peerCategory,
      expert: player.name,
    }));
  }, [players, currentRound]);

  const isCategoryExhausted = useCallback((categoryName: string) => {
    const roundPoints = getRoundPoints(currentRound, players.length);
    return roundPoints.every(d => questionsAsked.has(`${categoryName}-${d}`));
  }, [questionsAsked, currentRound, players.length]);

  const getAvailablePoints = useCallback((categoryName: string) => {
    const roundPoints = getRoundPoints(currentRound, players.length);
    return roundPoints.filter(d => !questionsAsked.has(`${categoryName}-${d}`));
  }, [questionsAsked, currentRound, players.length]);

  const getCategoryExpert = useCallback((categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.expert || null;
  }, [categories]);

  // Helper to get display category name (fun name) for a category
  const getDisplayCategory = useCallback((originalCategory: string): string => {
    return displayCategoryNames.get(originalCategory) || originalCategory;
  }, [displayCategoryNames]);

  // AI Question Generation
  const generateQuestionsForCategory = async (category: string, expert: string): Promise<TriviaQuestion[]> => {
    if (questionCache.has(category)) {
      return questionCache.get(category)!;
    }

    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          playerName: currentPlayer?.name || 'Player',
          expertName: expert,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error);

      const questions = data.questions as TriviaQuestion[];
      
      // Store questions in cache
      setQuestionCache(prev => {
        const updated = new Map(prev);
        updated.set(category, questions);
        return updated;
      });
      
      // Extract and store display category name
      if (questions.length > 0 && questions[0].displayCategory) {
        setDisplayCategoryNames(prev => {
          const updated = new Map(prev);
          updated.set(category, questions[0].displayCategory);
          return updated;
        });
      }
      
      return questions;
    } catch (error) {
      console.error('[Play] AI generation failed:', error);
      return getFallbackQuestions(category);
    }
  };

  const getFallbackQuestions = (category: string): TriviaQuestion[] => {
    // Fallback: REAL questions (not meta-descriptions) when AI fails
    // Generate fallback questions based on current round
    const roundPoints = getRoundPoints(currentRound, players.length);
    
    const fallbackByPoints: Record<number, { question: string; range: string }> = {
      100: { question: `what is the most famous thing associated with ${category}?`, range: `Think of the most obvious answer - we're being generous.` },
      200: { question: `who is the most well-known person in the field of ${category}?`, range: `Any famous name related to ${category} works.` },
      300: { question: `what year did ${category} become widely popular or recognized?`, range: `Only true ${category} experts would know this.` },
      250: { question: `what is a common term or concept in ${category}?`, range: `Something you'd pick up with casual interest.` },
      500: { question: `what is a specific fact that dedicated ${category} fans would know?`, range: `Time to prove you've been paying attention.` },
    };
    
    return roundPoints.map(difficulty => ({
      originalCategory: category,
      displayCategory: category, // Fallback uses original name
      difficulty,
      questionText: fallbackByPoints[difficulty]?.question || `What's something interesting about ${category}?`,
      rangeText: fallbackByPoints[difficulty]?.range || `Think about what you know about ${category}.`,
      answer: {
        display: "(The expert will judge the answer)",
        acceptable: ["any reasonable answer", "expert judgment"]
      }
    }));
  };

  const handleCategorySelect = (categoryName: string) => {
    if (isCategoryExhausted(categoryName)) return;
    setSelectedCategory(categoryName);
    setExpertName(getCategoryExpert(categoryName));
    setGamePhase('point-select');
  };

  const handlePointSelect = async (difficulty: number) => {
    if (!selectedCategory || !expertName) return;
    if (questionsAsked.has(`${selectedCategory}-${difficulty}`)) return;
    
    setSelectedDifficulty(difficulty);
    
    let questions = questionCache.get(selectedCategory);
    if (!questions) {
      setGamePhase('generating');
      questions = await generateQuestionsForCategory(selectedCategory, expertName);
    }
    
    const question = questions.find(q => q.difficulty === difficulty);
    if (question) {
      setCurrentQuestion(question);
      setQuestionsAsked(prev => new Set([...Array.from(prev), `${selectedCategory}-${difficulty}`]));
      setGamePhase('question');
    } else {
      setGamePhase('category-select');
    }
  };

  const handleStealAttempt = () => {
    setStealAttempted(true);
    // Generate steal prompt when entering steal phase
    if (expertName && selectedCategory) {
      setStealPromptData(getStealPrompt(expertName, selectedCategory));
    }
    setGamePhase('steal');
  };

  const handleRevealAnswer = () => {
    // Generate scoring commentary when revealing answer
    setScoringCommentary(getScoringCommentary(
      currentPlayer?.name || 'Player',
      expertName,
      stealAttempted
    ));
    setGamePhase('scoring');
  };

  const handleScoreSelection = (winner: 'original' | 'expert' | 'nobody') => {
    if (!currentPlayer || !selectedDifficulty || !selectedCategory) return;

    const pointValue = selectedDifficulty;
    const isOwnCategory = currentRound === 1 
      ? currentPlayer.selfCategory === selectedCategory
      : currentPlayer.peerCategory === selectedCategory;

    const updatedPlayers = [...players];

    if (winner === 'original') {
      const playerIndex = players.findIndex(p => p.name === currentPlayer.name);
      if (playerIndex !== -1) {
        updatedPlayers[playerIndex] = { 
          ...updatedPlayers[playerIndex], 
          score: updatedPlayers[playerIndex].score + pointValue 
        };
      }
    } else if (winner === 'expert' && stealAttempted && expertName) {
      const originalIndex = players.findIndex(p => p.name === currentPlayer.name);
      if (originalIndex !== -1) {
        const penalty = isOwnCategory ? -pointValue : -Math.floor(pointValue / 2);
        updatedPlayers[originalIndex] = { 
          ...updatedPlayers[originalIndex], 
          score: updatedPlayers[originalIndex].score + penalty 
        };
      }
      
      const expertIndex = players.findIndex(p => p.name === expertName);
      if (expertIndex !== -1) {
        updatedPlayers[expertIndex] = { 
          ...updatedPlayers[expertIndex], 
          score: updatedPlayers[expertIndex].score + pointValue 
        };
      }
    } else {
      const originalIndex = players.findIndex(p => p.name === currentPlayer.name);
      if (originalIndex !== -1) {
        const penalty = isOwnCategory ? -pointValue : -Math.floor(pointValue / 2);
        updatedPlayers[originalIndex] = { 
          ...updatedPlayers[originalIndex], 
          score: updatedPlayers[originalIndex].score + penalty 
        };
      }
      
      if (stealAttempted && expertName) {
        const expertIndex = players.findIndex(p => p.name === expertName);
        if (expertIndex !== -1) {
          updatedPlayers[expertIndex] = { 
            ...updatedPlayers[expertIndex], 
            score: updatedPlayers[expertIndex].score - pointValue 
          };
        }
      }
    }

    setPlayers(updatedPlayers);
    
    // Reset state
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setCurrentQuestion(null);
    setStealAttempted(false);
    setExpertName(null);
    setStealPromptData(null);
    setScoringCommentary('');
    
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextPlayerIndex);
    
    const roundComplete = categories.every(cat => isCategoryExhausted(cat.name));
    
    if (roundComplete) {
      if (currentRound === 1) {
        // Round 1 complete - save state and go to round complete screen
        if (typeof window !== 'undefined') {
          localStorage.setItem('king_of_hearts_game_state', JSON.stringify({
            players: updatedPlayers,
            currentRound: 1,
          }));
        }
        router.push('/king-of-hearts/round-complete');
      } else {
        // Round 2 complete - go to Final Round (wagering)
        if (typeof window !== 'undefined') {
          localStorage.setItem('king_of_hearts_game_state', JSON.stringify({
            players: updatedPlayers,
            currentRound: 2,
          }));
        }
        router.push('/king-of-hearts/final-round');
      }
    } else {
      setGamePhase('category-select');
    }
  };

  const roundTitle = currentRound === 1 
    ? "Things We Know Too Much About"
    : "Things We Won't Shut Up About";

  // Loading state
  if (!mounted || gamePhase === 'loading' || players.length === 0) {
    return (
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN: ROUND INTRO
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'round-intro') {
    const roundSubtitle = currentRound === 1 
      ? "Answer questions about YOUR expertise"
      : "Answer questions about THEIR expertise";
    
    return (
      <SteampunkLayout variant="holiday">
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <HolidayGarland className="mb-8" />
          
          <p className="font-mono text-[14px] text-qtc-copper uppercase tracking-wider">
            Round {currentRound} of 3
          </p>
          
          <h1 className="mt-4 font-heading text-[42px] font-bold text-qtc-brass-light text-center leading-tight">
            {roundTitle}
          </h1>
          
          <p className="mt-4 font-body text-[18px] text-qtc-cream text-center max-w-[400px]">
            {roundSubtitle}
          </p>
          
          <div className="mt-8 w-[100px] h-[3px] bg-qtc-brass rounded-full" />
          
          {/* Player categories for this round */}
          <div className="mt-8 w-full max-w-[400px] space-y-2">
            {players.map((player) => {
              const category = currentRound === 1 ? player.selfCategory : player.peerCategory;
              return (
                <GameCard key={player.name} variant="dark" className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-body text-[16px] text-qtc-cream font-medium">
                      {player.name}
                    </span>
                    <span className="font-body text-[14px] text-qtc-copper">
                      {category}
                    </span>
                  </div>
                </GameCard>
              );
            })}
          </div>
          
          <BrassButton
            variant="holiday"
            size="lg"
            onClick={() => setGamePhase('category-select')}
            className="mt-10"
          >
            Start Round {currentRound}
          </BrassButton>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN: AI GENERATING QUESTIONS
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'generating') {
    const loadingMessages = [
      "Consulting the trivia gods...",
      "Summoning obscure facts...",
      "Mining the depths of knowledge...",
      "Brewing the perfect questions...",
      "Channeling trivia energy...",
    ];
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    
    return (
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-[500px]">
            <div className="mb-8 flex justify-center">
              <Gear size="lg" speed="fast" />
            </div>
            
            <h1 className="font-heading text-[32px] font-bold text-qtc-brass-light">
              {randomMessage}
            </h1>
            
            <p className="mt-4 font-body text-[18px] text-qtc-copper">
              Generating questions about <span className="text-qtc-holiday-red font-semibold">{selectedCategory}</span>
            </p>
            
            <div className="mt-6 flex justify-center gap-2">
              <div className="w-2 h-2 bg-qtc-holiday-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-qtc-brass rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-qtc-holiday-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN: CATEGORY SELECTION
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'category-select') {
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <div className="min-h-screen flex flex-col">
          {/* Round indicator */}
          <div className="w-full py-3 bg-holiday-gradient text-center shadow-deep">
            <p className="font-heading text-[16px] font-bold text-qtc-cream uppercase tracking-wider">
              Round {currentRound}: {roundTitle}
            </p>
          </div>

          {/* Scoreboard */}
          <div className="px-4 py-4 flex items-center justify-center gap-4 bg-qtc-charcoal/80 border-b border-qtc-brass/30">
            {players.map((player, index) => (
              <GaugePanel
                key={player.name}
                label={player.name}
                value={player.score}
                unit="pts"
                className={index === currentPlayerIndex ? 'border-qtc-holiday-red shadow-glow-orange' : ''}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center px-6 py-8">
            <HolidayGarland className="mb-6" />
            
            <h1 className="font-heading text-[32px] font-bold text-qtc-brass-light text-center">
              {currentPlayer?.name}, pick a category
            </h1>

            {/* Category buttons with personality callouts */}
            <div className="mt-8 w-full max-w-[500px] space-y-3">
              {categories.map((category) => {
                const exhausted = isCategoryExhausted(category.name);
                const questionsLeft = getAvailablePoints(category.name).length;
                const isCached = questionCache.has(category.name);
                const displayName = getDisplayCategory(category.name);
                const callout = getCategoryCallout(category.name, category.expert);
                
                return (
                  <button
                    key={category.name}
                    onClick={() => handleCategorySelect(category.name)}
                    disabled={exhausted}
                    className={`
                      w-full p-5 rounded-xl text-left
                      transition-all duration-150 ease-out
                      ${exhausted
                        ? 'bg-qtc-slate cursor-not-allowed opacity-60 border-2 border-qtc-slate'
                        : 'bg-holiday-gradient cursor-pointer hover:opacity-90 active:scale-[0.98] border-2 border-qtc-holiday-gold/40 shadow-deep'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`font-heading text-[18px] font-bold ${
                          exhausted ? 'text-qtc-copper' : 'text-qtc-cream'
                        }`}>
                          {displayName.toUpperCase()}
                        </p>
                        <p className={`mt-1 font-body text-[14px] ${
                          exhausted ? 'text-qtc-copper/60' : 'text-qtc-cream/80'
                        }`}>
                          {category.expert}&apos;s expertise • {questionsLeft} left
                        </p>
                        {/* Personality callout */}
                        {!exhausted && displayName === category.name && (
                          <p className="mt-2 font-body text-[12px] text-qtc-brass italic">
                            &ldquo;{callout}&rdquo;
                          </p>
                        )}
                      </div>
                      {isCached && !exhausted && (
                        <span className="text-[10px] bg-qtc-brass text-qtc-black px-2 py-1 rounded-full font-bold ml-2">
                          READY
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN: POINT VALUE SELECTION
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'point-select' && selectedCategory) {
    const availablePoints = getAvailablePoints(selectedCategory);
    const displayName = getDisplayCategory(selectedCategory);
    
    return (
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="w-full py-3 bg-holiday-gradient text-center shadow-deep">
            <p className="font-heading text-[16px] font-bold text-qtc-cream uppercase tracking-wider">
              {displayName}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <HolidayGarland className="mb-6" />
            
            {/* Personality header */}
            <p className="font-body text-[16px] text-qtc-brass italic text-center mb-2">
              Alright {currentPlayer?.name}, how brave are we feeling?
            </p>
            
            <h1 className="font-heading text-[32px] font-bold text-qtc-brass-light text-center">
              Pick your point value
            </h1>

            {/* Point buttons with personality */}
            <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[400px]">
              {getRoundPoints(currentRound, players.length).map((points) => {
                const available = availablePoints.includes(points);
                const { label, subtitle } = pointDescriptions[points] || { label: String(points), subtitle: "" };
                
                return (
                  <BrassButton
                    key={points}
                    variant={available ? "primary" : "secondary"}
                    size="lg"
                    onClick={() => handlePointSelect(points)}
                    disabled={!available}
                    className="flex flex-col items-center py-6"
                  >
                    <span className="font-heading text-[36px] font-bold">{label}</span>
                    {available && (
                      <span className="font-body text-[12px] opacity-80 mt-1">{subtitle}</span>
                    )}
                  </BrassButton>
                );
              })}
            </div>

            {/* Back button */}
            <button
              onClick={() => {
                setSelectedCategory(null);
                setGamePhase('category-select');
              }}
              className="mt-8 px-6 py-3 bg-transparent text-qtc-copper font-body text-[16px] cursor-pointer hover:text-qtc-brass transition-colors"
            >
              ← Back to Categories
            </button>
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN: QUESTION DISPLAY
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'question' && currentQuestion && selectedCategory && selectedDifficulty) {
    const expert = getCategoryExpert(selectedCategory);
    const showStealButton = expert && expert !== currentPlayer?.name;
    const stealPointValue = Math.floor(selectedDifficulty / 2);
    const displayName = currentQuestion.displayCategory || getDisplayCategory(selectedCategory);
    
    return (
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="w-full py-3 bg-qtc-holiday-green text-center shadow-deep">
            <p className="font-heading text-[16px] font-bold text-qtc-cream uppercase tracking-wider">
              {displayName} — {selectedDifficulty}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
            {/* Question card */}
            <GameCard variant="brass" className="w-full max-w-[500px] mb-6">
              {/* Line 1: Player name + question text */}
              <p className="text-[24px] font-heading font-bold text-qtc-brass-light leading-relaxed">
                <span className="text-qtc-holiday-red">{currentPlayer?.name}</span>, {currentQuestion.questionText}
              </p>
              
              {/* Line 2: "What's your best guess?" + range text */}
              {currentQuestion.rangeText && (
                <p className="mt-4 text-[18px] font-body font-medium text-qtc-copper leading-relaxed">
                  What&apos;s your best guess? {currentQuestion.rangeText}
                </p>
              )}

              {/* Divider before steal section */}
              {showStealButton && (
                <>
                  <div className="mt-6 mb-6 w-full h-[1px] bg-qtc-brass/30" />
                  
                  {/* Steal prompt */}
                  <p className="text-[18px] font-body text-qtc-copper leading-relaxed">
                    <span className="font-semibold text-qtc-brass-light">{expert}</span>, before we see the truth, do you want to...
                  </p>
                </>
              )}
            </GameCard>

            {/* Buttons */}
            <div className="flex flex-col gap-3 w-full max-w-[400px]">
              {showStealButton && (
                <BrassButton
                  variant="secondary"
                  size="lg"
                  onClick={handleStealAttempt}
                  className="w-full"
                >
                  Steal for {stealPointValue} Points
                </BrassButton>
              )}
              
              <BrassButton
                variant="holiday"
                size="lg"
                onClick={handleRevealAnswer}
                className="w-full"
              >
                Reveal the Answer
              </BrassButton>
            </div>
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN: EXPERT STEAL PROMPT
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'steal' && expertName && stealPromptData) {
    const fullPrompt = `${stealPromptData.title} ${stealPromptData.subtitle}`;
    
    return (
      <SteampunkLayout variant="holiday">
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <HolidayGarland className="mb-8" />
          
          <div className="text-center max-w-[500px]">
            <h1 className="font-heading text-[40px] font-bold text-qtc-brass-light leading-tight">
              {fullPrompt}
            </h1>
          </div>

          <BrassButton
            variant="holiday"
            size="lg"
            onClick={handleRevealAnswer}
            className="mt-12"
          >
            What&apos;s the real answer?
          </BrassButton>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN: COMBINED ANSWER REVEAL + SCORING SELECTION
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'scoring' && currentQuestion && currentPlayer) {
    return (
      <SteampunkLayout variant="holiday">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8">
          <HolidayGarland className="mb-6" />
          
          {/* Answer Section */}
          <GameCard variant="brass" className="w-full max-w-[500px] mb-6">
            <p className="font-mono text-[14px] text-qtc-copper uppercase tracking-wider text-center font-semibold mb-4">
              The Answer
            </p>
            
            <h1 className="font-heading text-[42px] font-bold text-qtc-brass-light text-center">
              {currentQuestion.answer.display}
            </h1>
            
            {currentQuestion.answer.acceptable && currentQuestion.answer.acceptable.length > 0 && (
              <p className="mt-3 font-body text-[14px] text-qtc-copper text-center">
                Also accept: {currentQuestion.answer.acceptable.slice(0, 3).join(', ')}
              </p>
            )}
          </GameCard>

          {/* Divider */}
          <div className="w-[60px] h-[3px] bg-qtc-brass rounded-full" />

          {/* Scoring commentary */}
          <p className="mt-4 font-body text-[16px] text-qtc-brass italic text-center">
            {scoringCommentary}
          </p>

          {/* Scoring Section */}
          <h2 className="mt-4 font-heading text-[24px] font-bold text-qtc-brass-light text-center">
            Who got it right?
          </h2>

          <div className="mt-6 flex flex-col gap-3 w-full max-w-[400px]">
            {/* Original player button */}
            <BrassButton
              variant="holiday"
              size="lg"
              onClick={() => handleScoreSelection('original')}
              className="w-full"
            >
              {currentPlayer.name} ✓
            </BrassButton>

            {/* Expert button (only if steal was attempted) */}
            {stealAttempted && expertName && (
              <BrassButton
                variant="primary"
                size="lg"
                onClick={() => handleScoreSelection('expert')}
                className="w-full"
              >
                {expertName} stole it ✓
              </BrassButton>
            )}

            {/* No one button */}
            <BrassButton
              variant="secondary"
              size="lg"
              onClick={() => handleScoreSelection('nobody')}
              className="w-full"
            >
              No one got it ✗
            </BrassButton>
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  // Fallback for steal without prompt data
  if (gamePhase === 'steal' && expertName) {
    return (
      <SteampunkLayout variant="holiday">
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <HolidayGarland className="mb-8" />
          
          <div className="text-center max-w-[500px]">
            <h1 className="font-heading text-[40px] font-bold text-qtc-brass-light leading-tight">
              {expertName}, show us what you got!
            </h1>
          </div>

          <BrassButton
            variant="holiday"
            size="lg"
            onClick={handleRevealAnswer}
            className="mt-12"
          >
            What&apos;s the real answer?
          </BrassButton>
        </div>
      </SteampunkLayout>
    );
  }

  return null;
}
