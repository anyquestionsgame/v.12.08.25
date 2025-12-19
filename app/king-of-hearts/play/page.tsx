'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TriviaQuestion } from '@/app/lib/aiQuestionEngine';

interface Player {
  name: string;
  selfCategory: string;
  peerCategory: string;
  score: number;
}

type GamePhase = 
  | 'loading'
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
  100: { label: "100", subtitle: "The gimme" },
  200: { label: "200", subtitle: "Casual fan territory" },
  300: { label: "300", subtitle: "Actually paying attention" },
  400: { label: "400", subtitle: "Show-off question" }
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
          
          setGamePhase('category-select');
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
    const difficulties = [100, 200, 300, 400];
    return difficulties.every(d => questionsAsked.has(`${categoryName}-${d}`));
  }, [questionsAsked]);

  const getAvailablePoints = useCallback((categoryName: string) => {
    return [100, 200, 300, 400].filter(d => !questionsAsked.has(`${categoryName}-${d}`));
  }, [questionsAsked]);

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
    // Fallback: Expert asks the question verbally when AI fails
    const fallbackData = [
      { difficulty: 100, question: `the expert will ask you an easy question about ${category}...`, range: `Something anyone who's heard of ${category} would know.` },
      { difficulty: 200, question: `the expert will ask you a medium question about ${category}...`, range: `Something a casual fan would probably know.` },
      { difficulty: 300, question: `the expert will ask you a harder question about ${category}...`, range: `This one's for dedicated fans.` },
      { difficulty: 400, question: `the expert will ask you an expert-level question about ${category}...`, range: `Only true experts would know this.` },
    ];
    
    return fallbackData.map(({ difficulty, question, range }) => ({
      originalCategory: category,
      displayCategory: category, // Fallback uses original name
      difficulty: difficulty as 100 | 200 | 300 | 400,
      questionText: question,
      rangeText: range,
      answer: {
        display: "(Expert asks the question verbally)",
        acceptable: ["expert question", "verbal question"]
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('king_of_hearts_game_state', JSON.stringify({
            players: updatedPlayers,
            currentRound: 1,
          }));
        }
        router.push('/king-of-hearts/round-complete');
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem('king_of_hearts_final_scores', JSON.stringify(updatedPlayers));
        }
        router.push('/king-of-hearts/game-over');
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
      <main className="min-h-screen bg-[#FFF8DC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
      </main>
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
      <main className="min-h-screen flex flex-col items-center justify-center px-6 animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-[#C41E3A] rounded-full animate-spin" />
          </div>
          
          <h1 className="font-heading text-[32px] font-bold text-[#165B33]">
            {randomMessage}
          </h1>
          
          <p className="mt-4 font-body text-[18px] text-[#52796F]">
            Generating questions about <span className="text-[#C41E3A] font-semibold">{selectedCategory}</span>
          </p>
          
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-2 h-2 bg-[#C41E3A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#165B33] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN 6: CATEGORY SELECTION
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'category-select') {
    return (
      <main className="min-h-screen flex flex-col animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
        {/* Round indicator */}
        <div className="w-full py-3 bg-[#C41E3A] text-center shadow-md">
          <p className="font-heading text-[16px] font-bold text-[#FFF8DC] uppercase tracking-wider">
            Round {currentRound}: {roundTitle}
          </p>
        </div>

        {/* Scoreboard */}
        <div className="px-4 py-4 flex items-center justify-center gap-4 bg-white/80 border-b border-[#D4AF37]/30">
          {players.map((player, index) => (
            <div 
              key={player.name} 
              className={`text-center px-4 py-2 rounded-xl transition-all ${
                index === currentPlayerIndex ? 'bg-[#C41E3A] shadow-md' : 'bg-[#FFF8DC]'
              }`}
              style={index === currentPlayerIndex ? { boxShadow: "0 2px 10px rgba(196,30,58,0.3)" } : {}}
            >
              <p className={`font-body text-[12px] ${
                index === currentPlayerIndex ? 'text-[#FFF8DC]' : 'text-[#52796F]'
              }`}>
                {player.name}
              </p>
              <p className={`font-heading text-[20px] font-bold ${
                index === currentPlayerIndex 
                  ? 'text-[#FFF8DC]' 
                  : player.score >= 0 ? 'text-[#165B33]' : 'text-[#C41E3A]'
              }`}>
                {player.score}
              </p>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center px-6 py-8">
          <h1 className="font-heading text-[32px] font-bold text-[#165B33] text-center">
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
                    w-full p-5 rounded-2xl text-left
                    transition-all duration-150 ease-out
                    ${exhausted
                      ? 'bg-[#E8E4D9] cursor-not-allowed opacity-60'
                      : 'bg-[#C41E3A] cursor-pointer hover:bg-[#A91830] active:scale-[0.98] shadow-lg'
                    }
                  `}
                  style={!exhausted ? { boxShadow: "0 4px 15px rgba(196,30,58,0.25)" } : {}}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`font-heading text-[18px] font-bold ${
                        exhausted ? 'text-[#52796F]' : 'text-[#FFF8DC]'
                      }`}>
                        {displayName.toUpperCase()}
                      </p>
                      <p className={`mt-1 font-body text-[14px] ${
                        exhausted ? 'text-[#52796F]/60' : 'text-[#FFF8DC]/80'
                      }`}>
                        {category.expert}&apos;s expertise • {questionsLeft} left
                      </p>
                      {/* Personality callout - only show if we don't have a fun display name yet */}
                      {!exhausted && displayName === category.name && (
                        <p className="mt-2 font-body text-[12px] text-[#D4AF37] italic">
                          &ldquo;{callout}&rdquo;
                        </p>
                      )}
                    </div>
                    {isCached && !exhausted && (
                      <span className="text-[10px] bg-[#D4AF37] text-[#165B33] px-2 py-1 rounded-full font-bold ml-2">
                        READY
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN 7: POINT VALUE SELECTION
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'point-select' && selectedCategory) {
    const availablePoints = getAvailablePoints(selectedCategory);
    const displayName = getDisplayCategory(selectedCategory);
    
    return (
      <main className="min-h-screen flex flex-col animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
        {/* Header */}
        <div className="w-full py-3 bg-[#165B33] text-center shadow-md">
          <p className="font-heading text-[16px] font-bold text-[#FFF8DC] uppercase tracking-wider">
            {displayName}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Personality header */}
          <p className="font-body text-[16px] text-[#D4AF37] italic text-center mb-2">
            Alright {currentPlayer?.name}, how brave are we feeling?
          </p>
          
          <h1 className="font-heading text-[32px] font-bold text-[#165B33] text-center">
            Pick your point value
          </h1>

          {/* Point buttons with personality */}
          <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[400px]">
            {[100, 200, 300, 400].map((points) => {
              const available = availablePoints.includes(points);
              const { label, subtitle } = pointDescriptions[points];
              
              return (
                <button
                  key={points}
                  onClick={() => handlePointSelect(points)}
                  disabled={!available}
                  className={`
                    py-6 px-4 rounded-2xl flex flex-col items-center
                    transition-all duration-150 ease-out
                    ${available
                      ? 'bg-[#D4AF37] text-[#165B33] cursor-pointer hover:bg-[#C9A227] active:scale-[0.98] shadow-lg'
                      : 'bg-[#E8E4D9] text-[#52796F] cursor-not-allowed opacity-60'
                    }
                  `}
                  style={available ? { boxShadow: "0 4px 15px rgba(212,175,55,0.35)" } : {}}
                >
                  <span className="font-heading text-[36px] font-bold">{label}</span>
                  {available && (
                    <span className="font-body text-[12px] opacity-80 mt-1">{subtitle}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Back button */}
          <button
            onClick={() => {
              setSelectedCategory(null);
              setGamePhase('category-select');
            }}
            className="mt-8 px-6 py-3 bg-transparent text-[#52796F] font-body text-[16px] cursor-pointer hover:text-[#165B33] transition-colors"
          >
            ← Back to Categories
          </button>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN 8: QUESTION DISPLAY - INTEGRATED FLOW
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'question' && currentQuestion && selectedCategory && selectedDifficulty) {
    const expert = getCategoryExpert(selectedCategory);
    const showStealButton = expert && expert !== currentPlayer?.name;
    const stealPointValue = Math.floor(selectedDifficulty / 2);
    // Use displayCategory from the question if available, otherwise fall back to state
    const displayName = currentQuestion.displayCategory || getDisplayCategory(selectedCategory);
    
    return (
      <main className="min-h-screen flex flex-col animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
        {/* Header */}
        <div className="w-full py-3 bg-[#165B33] text-center shadow-md">
          <p className="font-heading text-[16px] font-bold text-[#FFF8DC] uppercase tracking-wider">
            {displayName} — {selectedDifficulty}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          {/* Question card - integrated narrative flow */}
          <div className="w-full max-w-[500px] p-8 bg-white rounded-3xl shadow-xl" style={{ boxShadow: "0 8px 30px rgba(196,30,58,0.15)" }}>
            {/* Line 1: Player name + question text */}
            <p className="text-[24px] font-semibold text-[#165B33] leading-relaxed">
              <span className="font-bold">{currentPlayer?.name}</span>, {currentQuestion.questionText}
            </p>
            
            {/* Line 2: "What's your best guess?" + range text */}
            {currentQuestion.rangeText && (
              <p className="mt-4 text-[18px] font-medium text-[#D4AF37] leading-relaxed">
                What&apos;s your best guess? {currentQuestion.rangeText}
              </p>
            )}

            {/* Divider before steal section */}
            {showStealButton && (
              <>
                <div className="mt-6 mb-6 w-full h-[1px] bg-[#E8E4D9]" />
                
                {/* Steal prompt - consistent styling, name flows naturally */}
                <p className="text-[18px] text-[#52796F] leading-relaxed">
                  <span className="font-semibold">{expert}</span>, before we see the truth, do you want to...
                </p>
              </>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col gap-3 w-full max-w-[400px]">
            {showStealButton && (
              <button
                onClick={handleStealAttempt}
                className="w-full py-4 bg-[#CD7F32] text-white font-body text-lg font-bold rounded-xl cursor-pointer transition-all duration-150 ease-out hover:bg-[#B8722D] active:scale-[0.98] shadow-lg"
                style={{ boxShadow: "0 4px 15px rgba(205,127,50,0.35)" }}
              >
                Steal for {stealPointValue} Points
              </button>
            )}
            
            <button
              onClick={handleRevealAnswer}
              className="w-full py-4 bg-[#C41E3A] text-[#FFF8DC] font-body text-lg font-bold rounded-xl cursor-pointer transition-all duration-150 ease-out hover:bg-[#A91830] active:scale-[0.98] shadow-lg"
              style={{ boxShadow: "0 4px 15px rgba(196,30,58,0.35)" }}
            >
              Reveal the Answer
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN 9: EXPERT STEAL PROMPT
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'steal' && expertName && stealPromptData) {
    // Combine title and subtitle into one flowing sentence
    const fullPrompt = `${stealPromptData.title} ${stealPromptData.subtitle}`;
    
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
        <div className="text-center max-w-[500px]">
          <h1 className="font-heading text-[40px] font-bold text-[#165B33] leading-tight">
            {fullPrompt}
          </h1>
        </div>

        <button
          onClick={handleRevealAnswer}
          className="mt-12 px-12 py-5 bg-[#C41E3A] text-[#FFF8DC] font-body text-lg font-bold rounded-xl cursor-pointer transition-all duration-150 ease-out hover:bg-[#A91830] active:scale-[0.98] shadow-lg"
          style={{ boxShadow: "0 4px 20px rgba(196,30,58,0.35)" }}
        >
          What&apos;s the real answer?
        </button>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREEN 10: COMBINED ANSWER REVEAL + SCORING SELECTION
  // ═══════════════════════════════════════════════════════════
  if (gamePhase === 'scoring' && currentQuestion && currentPlayer) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-8 animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
        {/* Answer Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl w-full max-w-[500px]" style={{ boxShadow: "0 8px 30px rgba(212,175,55,0.2)" }}>
          <p className="font-body text-[14px] text-[#D4AF37] uppercase tracking-wider text-center font-semibold">
            The Answer
          </p>
          
          <h1 className="mt-4 font-heading text-[42px] font-bold text-[#165B33] text-center">
            {currentQuestion.answer.display}
          </h1>
          
          {currentQuestion.answer.acceptable && currentQuestion.answer.acceptable.length > 0 && (
            <p className="mt-3 font-body text-[14px] text-[#52796F] text-center">
              Also accept: {currentQuestion.answer.acceptable.slice(0, 3).join(', ')}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="mt-6 w-[60px] h-[3px] bg-[#D4AF37] rounded-full" />

        {/* Scoring commentary - personality */}
        <p className="mt-4 font-body text-[16px] text-[#D4AF37] italic text-center">
          {scoringCommentary}
        </p>

        {/* Scoring Section */}
        <h2 className="mt-4 font-heading text-[24px] font-bold text-[#165B33] text-center">
          Who got it right?
        </h2>

        <div className="mt-6 flex flex-col gap-3 w-full max-w-[400px]">
          {/* Original player button */}
          <button
            onClick={() => handleScoreSelection('original')}
            className="w-full py-5 bg-[#165B33] text-[#FFF8DC] font-body text-lg font-bold rounded-xl cursor-pointer transition-all duration-150 ease-out hover:bg-[#0D4A28] active:scale-[0.98] shadow-lg"
            style={{ boxShadow: "0 4px 15px rgba(22,91,51,0.35)" }}
          >
            {currentPlayer.name} ✓
          </button>

          {/* Expert button (only if steal was attempted) */}
          {stealAttempted && expertName && (
            <button
              onClick={() => handleScoreSelection('expert')}
              className="w-full py-5 bg-[#D4AF37] text-[#165B33] font-body text-lg font-bold rounded-xl cursor-pointer transition-all duration-150 ease-out hover:bg-[#C9A227] active:scale-[0.98] shadow-lg"
              style={{ boxShadow: "0 4px 15px rgba(212,175,55,0.35)" }}
            >
              {expertName} stole it ✓
            </button>
          )}

          {/* No one button */}
          <button
            onClick={() => handleScoreSelection('nobody')}
            className="w-full py-5 bg-[#C41E3A] text-[#FFF8DC] font-body text-lg font-bold rounded-xl cursor-pointer transition-all duration-150 ease-out hover:bg-[#A91830] active:scale-[0.98] shadow-lg"
            style={{ boxShadow: "0 4px 15px rgba(196,30,58,0.35)" }}
          >
            No one got it ✗
          </button>
        </div>
      </main>
    );
  }

  // Fallback for steal without prompt data
  if (gamePhase === 'steal' && expertName) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
        <div className="text-center max-w-[500px]">
          <h1 className="font-heading text-[40px] font-bold text-[#165B33] leading-tight">
            {expertName}, show us what you got!
          </h1>
        </div>

        <button
          onClick={handleRevealAnswer}
          className="mt-12 px-12 py-5 bg-[#C41E3A] text-[#FFF8DC] font-body text-lg font-bold rounded-xl cursor-pointer transition-all duration-150 ease-out hover:bg-[#A91830] active:scale-[0.98] shadow-lg"
        >
          What&apos;s the real answer?
        </button>
      </main>
    );
  }

  return null;
}
