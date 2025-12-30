'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  SteampunkLayout, 
  BrassButton, 
  BrassInput, 
  GameCard, 
  HolidayGarland, 
  Gear 
} from '@/components/ui/qtc-components';

interface PlayerSetupData {
  name: string;
  selfCategory: string;
  peerCategory: string;
  peerCategoryFrom: string;
}

interface GameSetupData {
  players: PlayerSetupData[];
  sharedCategory: string; // For Final Round - "Something you ALL know about"
}

type SetupPhase = 'shared-category' | 'input' | 'generating' | 'ready';

// Wrapper component to handle Suspense for useSearchParams
export default function KingOfHeartsSetup() {
  return (
    <Suspense fallback={
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </div>
      </SteampunkLayout>
    }>
      <KingOfHeartsSetupContent />
    </Suspense>
  );
}

function KingOfHeartsSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mounted, setMounted] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [players, setPlayers] = useState<PlayerSetupData[]>([]);
  const [setupPhase, setSetupPhase] = useState<SetupPhase>('shared-category');
  
  // Shared category for Final Round - entered first before individual player input
  const [sharedCategory, setSharedCategory] = useState('');
  
  // Form state for current player
  const [selfCategory, setSelfCategory] = useState('');
  const [peerCategory, setPeerCategory] = useState('');
  
  // Track which players have been assigned peer categories
  const [assignedPeerPlayers, setAssignedPeerPlayers] = useState<string[]>([]);
  
  // The player that current player will assign a peer category to
  const [peerTargetPlayer, setPeerTargetPlayer] = useState<string>('');

  // Generation progress
  const [generationProgress, setGenerationProgress] = useState<string>('');

  // ═══════════════════════════════════════════════════════════
  // QUICK TEST MODE
  // ═══════════════════════════════════════════════════════════
  const [quickTestMode, setQuickTestMode] = useState(false);
  const [testCategory, setTestCategory] = useState('');

  // Parse player names from URL params
  const playerNames = useMemo(() => {
    const names: string[] = [];
    for (let i = 1; i <= 8; i++) {
      const name = searchParams.get(`p${i}`);
      if (name) {
        names.push(name);
      }
    }
    return names;
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize players array when we have names
  useEffect(() => {
    if (playerNames.length > 0 && players.length === 0) {
      const initialPlayers: PlayerSetupData[] = playerNames.map(name => ({
        name,
        selfCategory: '',
        peerCategory: '',
        peerCategoryFrom: '',
      }));
      setPlayers(initialPlayers);
    }
  }, [playerNames, players.length]);

  // Determine which player the current player will assign a peer category to
  useEffect(() => {
    if (players.length > 0 && currentPlayerIndex < players.length) {
      const currentPlayerName = players[currentPlayerIndex].name;
      
      const availablePlayers = players
        .map(p => p.name)
        .filter(name => name !== currentPlayerName && !assignedPeerPlayers.includes(name));
      
      if (availablePlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePlayers.length);
        setPeerTargetPlayer(availablePlayers[randomIndex]);
      } else {
        const fallbackPlayers = players
          .map(p => p.name)
          .filter(name => name !== currentPlayerName);
        if (fallbackPlayers.length > 0) {
          const randomIndex = Math.floor(Math.random() * fallbackPlayers.length);
          setPeerTargetPlayer(fallbackPlayers[randomIndex]);
        }
      }
    }
  }, [players, currentPlayerIndex, assignedPeerPlayers]);

  // ═══════════════════════════════════════════════════════════
  // PRE-GENERATE ALL QUESTIONS
  // ═══════════════════════════════════════════════════════════
  
  const preGenerateAllQuestions = async (finalPlayers: PlayerSetupData[]) => {
    setSetupPhase('generating');
    
    // Get player count to determine question counts
    const playerCount = finalPlayers.length;
    
    // Build categories for Round 1 (selfCategory) and Round 2 (peerCategory)
    const round1Categories = finalPlayers.map(p => ({
      name: p.selfCategory,
      expert: p.name,
      round: 1,
    }));
    
    const round2Categories = finalPlayers.map(p => ({
      name: p.peerCategory,
      expert: p.name,
      round: 2,
    }));
    
    // Add shared category for Final Round (no specific expert - all players)
    const finalRoundCategory = {
      name: sharedCategory,
      expert: 'everyone', // Special marker for final round
      round: 3,
    };
    
    const allCategories = [...round1Categories, ...round2Categories, finalRoundCategory];
    const playerNamesList = finalPlayers.map(p => p.name);
    
    console.log(`[Setup] Pre-generating questions for ${allCategories.length} categories (including Final Round)`);
    setGenerationProgress(`Preparing ${allCategories.length} categories...`);

    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: allCategories,
          players: playerNamesList,
          playerCount: playerCount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      console.log(`[Setup] Generated ${data.totalQuestions} questions`);
      
      // Store questions and game setup in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('king_of_hearts_questions', JSON.stringify(data.questionsByCategory));
        localStorage.setItem('king_of_hearts_players', JSON.stringify(finalPlayers));
        localStorage.setItem('king_of_hearts_shared_category', sharedCategory);
        localStorage.removeItem('king_of_hearts_round'); // Start fresh
      }

      setSetupPhase('ready');
      
      // Navigate to play
      setTimeout(() => {
        router.push('/king-of-hearts/play');
      }, 500);

    } catch (error) {
      console.error('[Setup] Generation failed:', error);
      
      // Still proceed with fallback - questions will be generated on-demand
      if (typeof window !== 'undefined') {
        localStorage.setItem('king_of_hearts_players', JSON.stringify(finalPlayers));
        localStorage.setItem('king_of_hearts_shared_category', sharedCategory);
      }
      
      setGenerationProgress('Using backup questions...');
      setTimeout(() => {
        router.push('/king-of-hearts/play');
      }, 1000);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // QUICK TEST MODE - Single category test
  // ═══════════════════════════════════════════════════════════
  
  const handleQuickTest = async () => {
    if (!testCategory.trim()) return;
    
    setSetupPhase('generating');
    setGenerationProgress(`Testing "${testCategory}" questions...`);
    
    // Create a single test player
    const testPlayer: PlayerSetupData = {
      name: 'Test Player',
      selfCategory: testCategory.trim(),
      peerCategory: testCategory.trim(), // Same category for both rounds
      peerCategoryFrom: 'Test Player',
    };
    
    const testPlayers = [testPlayer];
    
    // Only need one category for testing
    const categories = [{ name: testCategory.trim(), expert: 'Test Player' }];
    
    console.log(`[Quick Test] Generating questions for: ${testCategory}`);
    
    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories,
          players: ['Test Player'],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      console.log(`[Quick Test] Generated questions for: ${testCategory}`);
      
      // Store questions in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('king_of_hearts_questions', JSON.stringify(data.questionsByCategory));
        localStorage.setItem('king_of_hearts_players', JSON.stringify(testPlayers));
        localStorage.removeItem('king_of_hearts_round'); // Start fresh
      }

      setSetupPhase('ready');
      setGenerationProgress('Questions ready!');
      
      // Navigate to play
      setTimeout(() => {
        router.push('/king-of-hearts/play');
      }, 500);

    } catch (error) {
      console.error('[Quick Test] Generation failed:', error);
      setGenerationProgress('Generation failed - check console');
      
      // Still proceed with fallback
      if (typeof window !== 'undefined') {
        localStorage.setItem('king_of_hearts_players', JSON.stringify(testPlayers));
      }
      
      setTimeout(() => {
        router.push('/king-of-hearts/play');
      }, 2000);
    }
  };

  // Prevent SSR issues
  if (!mounted) {
    return (
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SHARED CATEGORY INPUT (First Screen - Final Round category)
  // ═══════════════════════════════════════════════════════════
  
  if (setupPhase === 'shared-category' && !quickTestMode && playerNames.length > 0) {
    const handleSharedCategorySubmit = () => {
      if (sharedCategory.trim()) {
        setSetupPhase('input');
      }
    };

    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
          {/* Quick Test Mode Button - Top Right */}
          <button
            onClick={() => setQuickTestMode(true)}
            className="absolute top-4 right-4 px-3 py-2 bg-qtc-copper text-qtc-cream font-body text-[12px] font-bold rounded-lg hover:bg-qtc-copper-dark transition-colors"
          >
            🧪 Quick Test
          </button>

          <div className="flex flex-col items-center w-full max-w-[500px]">
            {/* Holiday decoration */}
            <HolidayGarland className="mb-6" />

            {/* Title */}
            <h1 className="font-heading text-[36px] font-bold text-qtc-brass-light tracking-tight select-none text-center">
              Before we begin...
            </h1>
            
            <p className="mt-4 font-body text-[18px] text-qtc-copper text-center">
              One question for the whole group
            </p>

            <div className="mt-10 w-full">
              {/* Shared Category Input */}
              <GameCard variant="holiday">
                <label className="block font-heading text-[20px] font-bold text-qtc-brass-light mb-2 select-none text-center">
                  What&apos;s something you ALL know about?
                </label>
                <p className="mb-4 font-body text-[14px] text-qtc-copper text-center">
                  This will be the Final Round category for everyone
                </p>
                <BrassInput
                  value={sharedCategory}
                  onChange={(e) => setSharedCategory(e.target.value)}
                  placeholder="A topic everyone here knows..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && sharedCategory.trim()) {
                      handleSharedCategorySubmit();
                    }
                  }}
                />
                <p className="mt-4 font-body text-[12px] text-qtc-copper/70 text-center">
                  Examples: The Office, Your hometown, A shared hobby...
                </p>
              </GameCard>
            </div>

            {/* Submit Button */}
            <BrassButton
              variant={sharedCategory.trim() ? "holiday" : "primary"}
              size="lg"
              onClick={handleSharedCategorySubmit}
              disabled={!sharedCategory.trim()}
              className="mt-10 w-full"
            >
              Continue to Player Setup
            </BrassButton>
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // QUICK TEST MODE UI (Available even without players)
  // ═══════════════════════════════════════════════════════════
  
  if (quickTestMode || playerNames.length === 0) {
    // Show Quick Test UI
    if (setupPhase === 'generating' || setupPhase === 'ready') {
      return (
        <SteampunkLayout variant="dark">
          <div className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-[500px]">
              <div className="mb-8 flex justify-center">
                {setupPhase === 'generating' ? (
                  <Gear size="lg" speed="fast" />
                ) : (
                  <div className="w-20 h-20 bg-qtc-holiday-green rounded-full flex items-center justify-center">
                    <span className="text-4xl text-qtc-cream">✓</span>
                  </div>
                )}
              </div>
              
              <h1 className="font-heading text-[36px] font-bold text-qtc-brass-light">
                {setupPhase === 'generating' ? 'Generating questions...' : 'Ready!'}
              </h1>
              
              <p className="mt-4 font-body text-[18px] text-qtc-copper">
                {generationProgress}
              </p>
              
              <GameCard variant="brass" className="mt-8">
                <div className="text-center">
                  <span className="font-body text-[16px] text-qtc-brass-light font-semibold">
                    Testing: {testCategory}
                  </span>
                </div>
              </GameCard>
            </div>
          </div>
        </SteampunkLayout>
      );
    }

    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-[500px]">
            {/* Header */}
            <div className="text-center mb-8">
              <HolidayGarland className="mb-4" />
              <div className="inline-block px-4 py-2 bg-qtc-copper text-qtc-cream rounded-full mb-4">
                <span className="font-mono text-[14px] font-bold uppercase tracking-wider">🧪 Quick Test Mode</span>
              </div>
              <h1 className="font-heading text-[32px] font-bold text-qtc-brass-light">
                Test a Category
              </h1>
              <p className="mt-2 font-body text-[16px] text-qtc-copper">
                Quickly test how AI generates questions for any topic
              </p>
            </div>

            {/* Category Input */}
            <GameCard variant="brass" className="mb-6">
              <BrassInput
                label="Enter a category to test"
                value={testCategory}
                onChange={(e) => setTestCategory(e.target.value)}
                placeholder="e.g., Cooking, Wine, Trucks, Pottery..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && testCategory.trim()) {
                    handleQuickTest();
                  }
                }}
              />
              
              <p className="mt-4 font-body text-[14px] text-qtc-copper">
                This will generate 4 questions at different difficulty levels
              </p>
            </GameCard>

            {/* Generate Button */}
            <BrassButton
              variant="holiday"
              size="lg"
              onClick={handleQuickTest}
              disabled={!testCategory.trim()}
              className="w-full"
            >
              Generate Test Questions
            </BrassButton>

            {/* Back to Normal Mode */}
            {playerNames.length > 0 && (
              <GhostButton
                onClick={() => setQuickTestMode(false)}
                className="w-full mt-4"
              >
                ← Back to Normal Setup
              </GhostButton>
            )}
            
            {/* Back to Home */}
            <button
              onClick={() => router.push('/king-of-hearts')}
              className="mt-2 w-full py-3 font-body text-[14px] text-qtc-copper/70 hover:text-qtc-copper transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // GENERATING QUESTIONS SCREEN
  // ═══════════════════════════════════════════════════════════
  if (setupPhase === 'generating' || setupPhase === 'ready') {
    const allCategories = players.flatMap(p => [p.selfCategory, p.peerCategory]).filter(Boolean);
    
    return (
      <SteampunkLayout variant="holiday">
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-[500px]">
            {/* Animated spinner */}
            <div className="mb-8 flex justify-center">
              {setupPhase === 'generating' ? (
                <Gear size="lg" speed="fast" />
              ) : (
                <div className="w-20 h-20 bg-qtc-holiday-green rounded-full flex items-center justify-center">
                  <span className="text-4xl text-qtc-cream">✓</span>
                </div>
              )}
            </div>
            
            <HolidayGarland className="mb-6" />
            
            <h1 className="font-heading text-[36px] font-bold text-qtc-brass-light">
              {setupPhase === 'generating' ? 'Preparing your game...' : 'Ready to play!'}
            </h1>
            
            <p className="mt-4 font-body text-[18px] text-qtc-copper">
              {setupPhase === 'generating' 
                ? 'Generating trivia questions with AI...'
                : 'All questions loaded!'
              }
            </p>
            
            {/* Category list */}
            <GameCard variant="brass" className="mt-8">
              <p className="font-mono text-[12px] text-qtc-copper uppercase tracking-wider font-semibold mb-4">
                Categories
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {allCategories.map((cat, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 bg-qtc-brass/20 text-qtc-brass-light font-body text-[14px] rounded-full border border-qtc-brass/30"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </GameCard>
            
            {/* Bouncing dots */}
            {setupPhase === 'generating' && (
              <div className="mt-8 flex justify-center gap-2">
                <div className="w-3 h-3 bg-qtc-holiday-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-qtc-brass rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-qtc-holiday-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            
            {generationProgress && (
              <p className="mt-4 font-body text-[14px] text-qtc-copper">
                {generationProgress}
              </p>
            )}
          </div>
        </div>
      </SteampunkLayout>
    );
  }

  const currentPlayer = players[currentPlayerIndex];
  const isLastPlayer = currentPlayerIndex === players.length - 1;
  const isFormComplete = selfCategory.trim().length > 0 && peerCategory.trim().length > 0;

  const getPositionText = () => {
    if (currentPlayerIndex === 0) return "you're up first";
    if (isLastPlayer) return "you're up last";
    return "you're up next";
  };

  const handleNextPlayer = async () => {
    if (!isFormComplete || !currentPlayer || !peerTargetPlayer) return;

    // Update current player's selfCategory
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
      ...updatedPlayers[currentPlayerIndex],
      selfCategory: selfCategory.trim(),
    };

    // Find the target player and update their peerCategory
    const targetIndex = updatedPlayers.findIndex(p => p.name === peerTargetPlayer);
    if (targetIndex !== -1) {
      updatedPlayers[targetIndex] = {
        ...updatedPlayers[targetIndex],
        peerCategory: peerCategory.trim(),
        peerCategoryFrom: currentPlayer.name,
      };
    }

    setPlayers(updatedPlayers);
    setAssignedPeerPlayers(prev => [...prev, peerTargetPlayer]);

    if (isLastPlayer) {
      // Pre-generate ALL questions before starting game
      await preGenerateAllQuestions(updatedPlayers);
    } else {
      // Move to next player
      setCurrentPlayerIndex(prev => prev + 1);
      setSelfCategory('');
      setPeerCategory('');
      setPeerTargetPlayer('');
    }
  };

  if (!currentPlayer) {
    return (
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </div>
      </SteampunkLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PLAYER INPUT SCREEN
  // ═══════════════════════════════════════════════════════════
  return (
    <SteampunkLayout variant="dark" showGears={true}>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Quick Test Mode Button - Top Right */}
        <button
          onClick={() => setQuickTestMode(true)}
          className="absolute top-4 right-4 px-3 py-2 bg-qtc-copper text-qtc-cream font-body text-[12px] font-bold rounded-lg hover:bg-qtc-copper-dark transition-colors"
        >
          🧪 Quick Test
        </button>

        <div className="flex flex-col items-center w-full max-w-[500px]">
          {/* Holiday decoration */}
          <HolidayGarland className="mb-6" />

          {/* Progress indicator */}
          <p className="font-mono text-[13px] text-qtc-copper uppercase tracking-wider">
            Player {currentPlayerIndex + 1} of {players.length}
          </p>

          {/* Title */}
          <h1 className="mt-4 font-heading text-[36px] font-bold text-qtc-brass-light tracking-tight select-none text-center">
            {currentPlayer.name}, {getPositionText()}
          </h1>

          <div className="mt-10 w-full space-y-6">
            {/* Question 1: Self Category */}
            <GameCard variant="brass">
              <label className="block font-heading text-[18px] font-bold text-qtc-brass-light mb-2 select-none">
                What&apos;s something you know too much about?
              </label>
              <p className="mb-4 font-body text-[14px] text-qtc-copper">
                You can be as specific as you want
              </p>
              <BrassInput
                value={selfCategory}
                onChange={(e) => setSelfCategory(e.target.value)}
                placeholder="Your weird expertise..."
                autoFocus
              />
            </GameCard>

            {/* Question 2: Peer Category */}
            {peerTargetPlayer && (
              <GameCard variant="copper">
                <label className="block font-heading text-[18px] font-bold text-qtc-copper-light mb-2 select-none">
                  What&apos;s something <span className="text-qtc-holiday-red">{peerTargetPlayer}</span> won&apos;t shut up about?
                </label>
                <p className="mb-4 font-body text-[14px] text-qtc-copper">
                  What does {peerTargetPlayer} always bring up?
                </p>
                <BrassInput
                  value={peerCategory}
                  onChange={(e) => setPeerCategory(e.target.value)}
                  placeholder={`${peerTargetPlayer}'s obsession...`}
                />
              </GameCard>
            )}
          </div>

          {/* Submit Button */}
          <BrassButton
            variant={isFormComplete ? "holiday" : "primary"}
            size="lg"
            onClick={handleNextPlayer}
            disabled={!isFormComplete}
            className="mt-10 w-full"
          >
            {isLastPlayer ? '🎄 Start Game' : 'Next Player'}
          </BrassButton>

          {/* Visual progress dots */}
          <div className="mt-8 flex gap-2">
            {players.map((_, index) => (
              <div
                key={index}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index < currentPlayerIndex
                    ? 'bg-qtc-brass'
                    : index === currentPlayerIndex
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
