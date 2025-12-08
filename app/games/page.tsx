'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createGameSession,
  saveSession,
  GAME_ID_MAP,
  GAME_ROUTES,
  GameType
} from '@/app/lib/gameOrchestrator';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

interface PlayerData {
  name: string;
  goodAt: string;
  ratherDie: string;
}

interface Game {
  id: string;
  title: string;
  oneLiner: string; // Punchy hook in accent color
  exampleTemplate: string;
  accentColor: string; // Accent color for this game
  minPlayers?: number; // Minimum players required (defaults to 3)
}

const games: Game[] = [
  {
    id: 'thats-so-you',
    title: "THAT'S SO YOU",
    oneLiner: 'Part roast, part love letter',
    exampleTemplate: 'If {player1} were a drunk Amazon purchase...',
    accentColor: '#D4A574', // Warm amber
    minPlayers: 4,
  },
  {
    id: 'most-likely-to',
    title: 'MOST LIKELY TO',
    oneLiner: "By round three, you're learning things you can't unlearn",
    exampleTemplate: "Who's most likely to start a cult by accident?",
    accentColor: '#6BA5A5', // Soft teal
  },
  {
    id: 'come-thru',
    title: 'COME THRU',
    oneLiner: 'Trust dynamics get exposed',
    exampleTemplate: 'You got arrested at Costco. Who do you call?',
    accentColor: '#E07A5F', // Coral/salmon
    minPlayers: 4,
  },
  {
    id: 'no-pressure',
    title: 'NO PRESSURE',
    oneLiner: "Everyone knows Charades. No one has played with these clues.",
    exampleTemplate: 'Act out: parallel parking with your ex watching',
    accentColor: '#81B29A', // Bright green
  },
  {
    id: 'trivia',
    title: 'TRIVIA',
    oneLiner: "Trivia built around who's playing, not what's popular",
    exampleTemplate: "We're quizzing {player} on {expertise} — steal points if they choke",
    accentColor: '#9A8BC4', // Soft purple
  },
];

export default function Games() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    // Add minimum loading time for smooth transition
    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300)); // Minimum 300ms loading
      
      // Try to load players from either key
      const storedPlayers = localStorage.getItem('players') || localStorage.getItem('qtc_players');
      if (storedPlayers) {
        try {
          const playerData = JSON.parse(storedPlayers);
          // Handle both formats (with goodAt/expertise)
          const formattedPlayers = playerData.map((p: any) => ({
            name: p.name,
            goodAt: p.goodAt || p.expertise || '',
            ratherDie: p.ratherDie || p.ratherDieThan || ''
          }));
          setPlayers(formattedPlayers);
        } catch (error) {
          console.error('Error parsing player data:', error);
          router.push('/setup');
        }
      } else {
        // No players found, redirect to setup
        router.push('/setup');
      }
      setIsLoading(false);
    };
    
    loadData();
  }, [router]);

  const toggleGame = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    
    const minPlayers = game.minPlayers || 3;
    const hasEnoughPlayers = players.length >= minPlayers;
    
    setSelectedGames((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
        showToast('Game removed', 'info');
      } else {
        if (!hasEnoughPlayers) {
          showToast(`This game requires ${minPlayers}+ players`, 'error');
          return prev;
        }
        newSet.add(gameId);
        showToast('Game added!', 'success');
      }
      return newSet;
    });
  };

  const getExampleText = (template: string) => {
    if (players.length === 0) {
      return template
        .replace('{player1}', 'Alex')
        .replace('{player}', 'Alex')
        .replace('{player2}', 'Jordan')
        .replace('{expertise}', 'obscure movie trivia');
    }
    
    const player1 = players[0]?.name || 'Alex';
    const player2 = players[1]?.name || players[0]?.name || 'Jordan';
    const expertise = players[2]?.goodAt || players[0]?.goodAt || 'their thing';
    
    return template
      .replace('{player1}', player1)
      .replace('{player}', player1)
      .replace('{player2}', player2)
      .replace('{expertise}', expertise);
  };

  const handleContinue = () => {
    if (selectedGames.size < 1) {
      console.error('No games selected');
      return;
    }

    if (players.length === 0) {
      console.error('No players found - redirecting to setup');
      router.push('/setup');
      return;
    }

    try {
      // Convert selected game IDs to GameType array
      const selectedGameTypes: GameType[] = Array.from(selectedGames)
        .map(id => GAME_ID_MAP[id])
        .filter(Boolean);
      
      if (selectedGameTypes.length === 0) {
        console.error('Invalid game selection');
        return;
      }
      
      // Create player data for session
      const sessionPlayers = players.map(p => ({
        name: p.name || 'Unknown',
        expertise: p.goodAt || 'General Knowledge',
        ratherDieThan: p.ratherDie || ''
      }));
      
      // Get savagery level and location from localStorage
      const savageryLevel = (localStorage.getItem('qtc_savagery') as 'gentle' | 'standard' | 'brutal') || 'standard';
      const location = localStorage.getItem('qtc_location') || undefined;
      
      // Create and save game session
      const session = createGameSession(
        sessionPlayers,
        selectedGameTypes,
        savageryLevel,
        location
      );
      saveSession(session);
      
      // Also save selected games for backwards compatibility
      localStorage.setItem('selectedGames', JSON.stringify(Array.from(selectedGames)));
      
      // Navigate to the first selected game
      const firstGameType = selectedGameTypes[0];
      const firstGameRoute = GAME_ROUTES[firstGameType];
      if (firstGameRoute) {
        router.push(firstGameRoute);
      } else {
        console.error('Invalid game route');
        router.push('/games');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      router.push('/games');
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (players.length === 0) {
    return (
      <EmptyState
        icon="👥"
        title="No Players Found"
        message="Need at least 3 players to start a game"
        actionLabel="Go to Setup"
        onAction={() => router.push('/setup')}
      />
    );
  }

  const canContinue = selectedGames.size >= 1;

  return (
    <main className="min-h-screen bg-[#1F1E1C] flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-4 px-6">
        <h1 className="font-heading text-[32px] font-bold text-[#F0EEE9] tracking-tight select-none">
          PICK YOUR GAMES
        </h1>
        <p className="mt-1 font-body text-[12px] text-[#9B9388]">
          Tap to select • Play one or play them all
        </p>
      </div>

      {/* Games Grid - All games visible at once */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3 max-w-[600px] mx-auto">
          {games.map((game) => {
            const isSelected = selectedGames.has(game.id);
            const minPlayers = game.minPlayers || 3;
            const hasEnoughPlayers = players.length >= minPlayers;
            const isDisabled = !hasEnoughPlayers && !isSelected;

            return (
              <button
                key={game.id}
                onClick={() => toggleGame(game.id)}
                disabled={isDisabled}
                className={`
                  w-full rounded-xl p-4 text-left relative
                  transition-all duration-200 ease-out
                  select-none
                  ${isSelected
                    ? 'bg-[#2D2B28]'
                    : 'bg-[#2D2B28] hover:bg-[#2D2B28]/80'
                  }
                  ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{
                  minHeight: '160px',
                  borderLeft: `4px solid ${game.accentColor}`,
                  boxShadow: isSelected 
                    ? `0 0 20px ${game.accentColor}30, 0 4px 12px rgba(0,0,0,0.3)`
                    : '0 2px 8px rgba(0,0,0,0.2)'
                }}
                aria-label={
                  isSelected 
                    ? `Remove ${game.title}` 
                    : isDisabled
                    ? `${game.title} requires ${minPlayers}+ players`
                    : `Add ${game.title}`
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Game title */}
                    <h2 className="font-heading text-[20px] font-bold text-[#F0EEE9] leading-tight">
                      {game.title}
                    </h2>

                    {/* One-liner - prominent hook in accent color */}
                    <p 
                      className="mt-2 font-body text-[14px] leading-snug"
                      style={{ color: game.accentColor }}
                    >
                      {game.oneLiner}
                    </p>

                    {/* Example - smaller gray text */}
                    <p className="mt-2 font-body text-[12px] text-[#9B9388] italic leading-relaxed">
                      &ldquo;{getExampleText(game.exampleTemplate)}&rdquo;
                    </p>

                    {/* Min players warning */}
                    {!hasEnoughPlayers && (
                      <p className="mt-2 font-body text-[11px] text-[#D4A574]">
                        Needs {minPlayers}+ players
                      </p>
                    )}
                  </div>

                  {/* Checkmark indicator */}
                  <div 
                    className={`
                      flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                      transition-all duration-200
                      ${isSelected
                        ? 'border-transparent'
                        : 'border-[#9B9388] bg-transparent'
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? game.accentColor : 'transparent',
                      borderColor: isSelected ? game.accentColor : '#9B9388'
                    }}
                  >
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1F1E1C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-6 pb-6 pt-2">
             <button
                 onClick={handleContinue}
                 disabled={!canContinue}
                 className={`
                   w-full h-14 font-body text-[18px] font-bold rounded cursor-pointer
                   transition-all duration-150 ease-out select-none
                   ${canContinue
                     ? 'bg-[#F0EEE9] text-[#1F1E1C] hover:opacity-90'
                     : 'bg-transparent border-2 border-[#9B9388] text-[#9B9388] cursor-not-allowed'
                   }
                 `}
                 style={{ borderRadius: '8px' }}
                 aria-label={canContinue ? `Start playing ${selectedGames.size} game${selectedGames.size > 1 ? 's' : ''}` : 'Select at least one game'}
               >
                 {canContinue
                   ? `PLAY ${selectedGames.size} ${selectedGames.size === 1 ? 'GAME' : 'GAMES'}`
                   : 'SELECT A GAME TO START'
                 }
               </button>
      </div>

      {/* Toast notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </main>
  );
}
