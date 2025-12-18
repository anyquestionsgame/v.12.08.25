'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface PlayerSetupData {
  name: string;
  selfCategory: string;
  peerCategory: string;
  peerCategoryFrom: string;
}

type SetupPhase = 'input' | 'generating' | 'ready';

// Wrapper component to handle Suspense for useSearchParams
export default function KingOfHeartsSetup() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FFF8DC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
      </main>
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
  const [setupPhase, setSetupPhase] = useState<SetupPhase>('input');
  
  // Form state for current player
  const [selfCategory, setSelfCategory] = useState('');
  const [peerCategory, setPeerCategory] = useState('');
  
  // Track which players have been assigned peer categories
  const [assignedPeerPlayers, setAssignedPeerPlayers] = useState<string[]>([]);
  
  // The player that current player will assign a peer category to
  const [peerTargetPlayer, setPeerTargetPlayer] = useState<string>('');

  // Generation progress
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [categoriesGenerated, setCategoriesGenerated] = useState(0);

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
    
    // Build categories for Round 1 (selfCategory) and Round 2 (peerCategory)
    const round1Categories = finalPlayers.map(p => ({
      name: p.selfCategory,
      expert: p.name,
    }));
    
    const round2Categories = finalPlayers.map(p => ({
      name: p.peerCategory,
      expert: p.name,
    }));
    
    const allCategories = [...round1Categories, ...round2Categories];
    const playerNamesList = finalPlayers.map(p => p.name);
    
    console.log(`[Setup] Pre-generating questions for ${allCategories.length} categories`);
    setGenerationProgress(`Preparing ${allCategories.length} categories...`);

    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: allCategories,
          players: playerNamesList,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      console.log(`[Setup] Generated ${data.totalQuestions} questions`);
      
      // Store questions in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('king_of_hearts_questions', JSON.stringify(data.questionsByCategory));
        localStorage.setItem('king_of_hearts_players', JSON.stringify(finalPlayers));
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
      }
      
      setGenerationProgress('Using backup questions...');
      setTimeout(() => {
        router.push('/king-of-hearts/play');
      }, 1000);
    }
  };

  // Prevent SSR issues
  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#FFF8DC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Redirect if no players
  if (playerNames.length === 0) {
    return (
      <main className="min-h-screen bg-[#FFF8DC] flex flex-col items-center justify-center px-6">
        <p className="font-body text-[16px] text-[#52796F] text-center">
          No players found. Redirecting...
        </p>
        <button
          onClick={() => router.push('/king-of-hearts')}
          className="mt-6 px-8 py-4 bg-[#C41E3A] text-[#FFF8DC] font-body text-lg font-bold rounded-xl shadow-lg"
        >
          Go Back
        </button>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // GENERATING QUESTIONS SCREEN
  // ═══════════════════════════════════════════════════════════
  if (setupPhase === 'generating' || setupPhase === 'ready') {
    const allCategories = players.flatMap(p => [p.selfCategory, p.peerCategory]).filter(Boolean);
    
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
        <div className="text-center max-w-[500px]">
          {/* Animated spinner */}
          <div className="mb-8 flex justify-center">
            {setupPhase === 'generating' ? (
              <div className="w-20 h-20 border-4 border-[#D4AF37] border-t-[#C41E3A] rounded-full animate-spin" />
            ) : (
              <div className="w-20 h-20 bg-[#165B33] rounded-full flex items-center justify-center">
                <span className="text-4xl">✓</span>
              </div>
            )}
          </div>
          
          <h1 className="font-heading text-[36px] font-bold text-[#165B33]">
            {setupPhase === 'generating' ? 'Preparing your game...' : 'Ready to play!'}
          </h1>
          
          <p className="mt-4 font-body text-[18px] text-[#52796F]">
            {setupPhase === 'generating' 
              ? 'Generating trivia questions with AI...'
              : 'All questions loaded!'
            }
          </p>
          
          {/* Category list */}
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: "0 4px 20px rgba(196,30,58,0.1)" }}>
            <p className="font-body text-[12px] text-[#D4AF37] uppercase tracking-wider font-semibold mb-4">
              Categories
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {allCategories.map((cat, i) => (
                <span 
                  key={i}
                  className="px-3 py-1 bg-[#FFF8DC] text-[#165B33] font-body text-[14px] rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
          
          {/* Bouncing dots */}
          {setupPhase === 'generating' && (
            <div className="mt-8 flex justify-center gap-2">
              <div className="w-3 h-3 bg-[#C41E3A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-[#165B33] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          
          {generationProgress && (
            <p className="mt-4 font-body text-[14px] text-[#52796F]">
              {generationProgress}
            </p>
          )}
        </div>
      </main>
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
      <main className="min-h-screen bg-[#FFF8DC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PLAYER INPUT SCREEN
  // ═══════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
      <div className="flex flex-col items-center w-full max-w-[500px]">
        {/* Progress indicator */}
        <p className="font-body text-[13px] text-[#52796F] uppercase tracking-wider">
          Player {currentPlayerIndex + 1} of {players.length}
        </p>

        {/* Title */}
        <h1 className="mt-4 font-heading text-[36px] font-bold text-[#165B33] tracking-tight select-none text-center">
          {currentPlayer.name}, {getPositionText()}
        </h1>

        <div className="mt-10 w-full space-y-8">
          {/* Question 1: Self Category */}
          <div className="bg-white rounded-2xl p-6 shadow-md" style={{ boxShadow: "0 4px 20px rgba(196,30,58,0.1)" }}>
            <label className="block font-body text-[18px] font-medium text-[#165B33] mb-2 select-none">
              What&apos;s something you know too much about?
            </label>
            <p className="mb-4 font-body text-[14px] text-[#52796F]">
              You can be as specific as you want
            </p>
            <input
              type="text"
              value={selfCategory}
              onChange={(e) => setSelfCategory(e.target.value)}
              placeholder="Your weird expertise..."
              className="w-full h-[56px] px-4 bg-[#FFF8DC] border-2 border-[#C41E3A] rounded-xl font-body text-[16px] text-[#165B33] placeholder-[#52796F] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30"
              autoFocus
            />
          </div>

          {/* Question 2: Peer Category */}
          {peerTargetPlayer && (
            <div className="bg-white rounded-2xl p-6 shadow-md" style={{ boxShadow: "0 4px 20px rgba(196,30,58,0.1)" }}>
              <label className="block font-body text-[18px] font-medium text-[#165B33] mb-2 select-none">
                What&apos;s something <span className="text-[#C41E3A]">{peerTargetPlayer}</span> won&apos;t shut up about?
              </label>
              <p className="mb-4 font-body text-[14px] text-[#52796F]">
                What does {peerTargetPlayer} always bring up?
              </p>
              <input
                type="text"
                value={peerCategory}
                onChange={(e) => setPeerCategory(e.target.value)}
                placeholder={`${peerTargetPlayer}'s obsession...`}
                className="w-full h-[56px] px-4 bg-[#FFF8DC] border-2 border-[#C41E3A] rounded-xl font-body text-[16px] text-[#165B33] placeholder-[#52796F] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleNextPlayer}
          disabled={!isFormComplete}
          className={`
            mt-10 px-12 py-5 font-body text-lg font-bold rounded-xl cursor-pointer
            transition-all duration-150 ease-out select-none
            ${isFormComplete
              ? 'bg-[#C41E3A] text-[#FFF8DC] hover:bg-[#D4AF37] hover:text-[#165B33] hover:scale-[0.98] active:scale-[0.96] shadow-lg'
              : 'bg-white border-2 border-[#52796F] text-[#52796F] cursor-not-allowed'
            }
          `}
          style={isFormComplete ? { boxShadow: "0 4px 20px rgba(196,30,58,0.25)" } : {}}
        >
          {isLastPlayer ? 'Start Game' : 'Next Player'}
        </button>

        {/* Visual progress dots */}
        <div className="mt-8 flex gap-2">
          {players.map((_, index) => (
            <div
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${index < currentPlayerIndex
                  ? 'bg-[#D4AF37]'
                  : index === currentPlayerIndex
                    ? 'bg-[#C41E3A]'
                    : 'bg-[#52796F]/30'
                }
              `}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
