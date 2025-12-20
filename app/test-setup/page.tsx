'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createGameSession,
  saveSession,
  GAME_ROUTES,
  GAME_ID_MAP,
  GameType
} from '@/app/lib/gameOrchestrator';
import { SteampunkLayout, BrassButton, BrassInput, GameCard, GhostButton, Gear } from '@/components/ui/qtc-components';

function generateTestPlayers(count: number) {
  const names = ['Alice', 'Bob', 'Charlie', 'Dana', 'Eve', 'Frank', 'Grace', 'Hank'];
  const expertises = ['Reality TV', 'Pottery', 'Excel', 'Wine', 'Sci-Fi Books', 'Pop Culture'];
  
  return Array.from({ length: count }, (_, i) => ({
    name: names[i] || `Player ${i + 1}`,
    expertise: expertises[i % expertises.length],
    ratherDieThan: ''
  }));
}

export default function TestSetup() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(4);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [savageryLevel, setSavageryLevel] = useState<'gentle' | 'standard' | 'brutal'>('standard');
  const [location, setLocation] = useState('Test City');

  useEffect(() => {
    // Check if testing mode is enabled
    const testingMode = localStorage.getItem('qtc_testing_mode') === 'true';
    if (!testingMode) {
      router.push('/');
    }
  }, [router]);

  const handleExitTesting = () => {
    localStorage.setItem('qtc_testing_mode', 'false');
    router.push('/');
  };

  const handleStartTesting = () => {
    if (!selectedGame) {
      console.error('No game selected');
      return;
    }

    try {
      // Generate test players
      const testPlayers = generateTestPlayers(playerCount);
      
      if (testPlayers.length === 0) {
        console.error('Failed to generate test players');
        return;
      }
      
      // Save test players (for backwards compatibility)
      const playerData = testPlayers.map(p => ({
        name: p.name,
        goodAt: p.expertise,
        ratherDie: p.ratherDieThan
      }));
      
      try {
        localStorage.setItem('players', JSON.stringify(playerData));
        localStorage.setItem('qtc_players', JSON.stringify(testPlayers));
      } catch (error) {
        console.error('Error saving test players:', error);
        return;
      }
      
      // Create session with single game
      const session = createGameSession(
        testPlayers,
        [selectedGame],
        savageryLevel,
        location.trim() || undefined
      );
      saveSession(session);
      
      // Navigate directly to the game
      const gameRoute = GAME_ROUTES[selectedGame];
      if (gameRoute) {
        router.push(gameRoute);
      } else {
        console.error('Invalid game route');
      }
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const gameOptions: Array<{ id: string; type: GameType; name: string }> = [
    { id: 'thats-so-you', type: 'thatsSoYou', name: "THAT'S SO YOU" },
    { id: 'most-likely-to', type: 'mostLikelyTo', name: 'MOST LIKELY TO' },
    { id: 'trivia', type: 'trivia', name: 'TRIVIA' },
    { id: 'no-pressure', type: 'performance', name: 'NO PRESSURE' },
    { id: 'come-thru', type: 'comeThru', name: 'COME THRU' }
  ];

  return (
    <SteampunkLayout variant="dark" showGears={true}>
      <main className="min-h-screen flex flex-col relative">
        {/* Exit button */}
        <button
          onClick={handleExitTesting}
          className="absolute top-6 left-6 z-10 font-body text-[14px] text-qtc-copper cursor-pointer hover:text-qtc-brass transition-colors select-none"
        >
          ← Exit Testing Mode
        </button>

        {/* Header */}
        <div className="flex flex-col items-center pt-16 pb-8 px-6">
          <h1 className="font-heading text-[32px] font-bold text-qtc-brass tracking-tight select-none">
            TESTING MODE
          </h1>
          <p className="mt-2 font-body text-[14px] text-qtc-copper">
            Quick single-game testing
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center px-6 pb-8 overflow-y-auto">
          {/* Player Count */}
          <div className="w-full max-w-[400px] mb-8">
            <p className="font-mono text-[13px] font-medium uppercase tracking-wider text-qtc-copper mb-4 text-center">
              Number of Test Players
            </p>
            <div className="flex gap-4 justify-center">
              {[3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setPlayerCount(num)}
                  className={`
                    w-[60px] h-[60px] rounded-lg border-2
                    font-heading text-[24px] font-bold
                    transition-all duration-150 ease-out
                    hover:scale-[0.98] active:scale-[0.96]
                    cursor-pointer select-none
                    ${playerCount === num
                      ? 'bg-brass-gradient text-qtc-black border-qtc-brass-light/30 shadow-brass'
                      : 'bg-transparent text-qtc-cream border-qtc-brass/50 hover:border-qtc-brass'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="mt-4 font-body text-[12px] text-qtc-copper text-center">
              Will generate: {generateTestPlayers(playerCount).map(p => p.name).join(', ')}
            </p>
          </div>

          {/* Game Selection */}
          <div className="w-full max-w-[400px] mb-8">
            <p className="font-mono text-[13px] font-medium uppercase tracking-wider text-qtc-copper mb-4 text-center">
              Game to Test
            </p>
            <div className="space-y-3">
              {gameOptions.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.type)}
                  className={`
                    w-full py-4 px-6 rounded-lg border-2 font-heading text-[18px] font-bold
                    transition-all duration-150 ease-out cursor-pointer
                    hover:scale-[0.98] active:scale-[0.96] select-none
                    ${selectedGame === game.type
                      ? 'bg-brass-gradient text-qtc-black border-qtc-brass-light/30 shadow-brass'
                      : 'bg-transparent text-qtc-cream border-qtc-brass/50 hover:border-qtc-brass hover:bg-qtc-charcoal'
                    }
                  `}
                >
                  {game.name}
                </button>
              ))}
            </div>
          </div>

          {/* Savagery Level */}
          <div className="w-full max-w-[400px] mb-8">
            <p className="font-mono text-[13px] font-medium uppercase tracking-wider text-qtc-copper mb-4 text-center">
              Savagery Level
            </p>
            <div className="flex gap-3 justify-center">
              {(['gentle', 'standard', 'brutal'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSavageryLevel(level)}
                  className={`
                    px-6 py-3 rounded-lg font-body text-[14px] font-bold border-2
                    transition-all duration-150 ease-out cursor-pointer
                    hover:scale-[0.98] active:scale-[0.96] select-none
                    ${savageryLevel === level
                      ? 'bg-brass-gradient text-qtc-black border-qtc-brass-light/30 shadow-brass'
                      : 'bg-transparent text-qtc-cream border-qtc-brass/50 hover:border-qtc-brass'
                    }
                  `}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="w-full max-w-[400px] mb-8">
            <p className="font-mono text-[13px] font-medium uppercase tracking-wider text-qtc-copper mb-4 text-center">
              Location (Optional)
            </p>
            <BrassInput
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Test City"
              className="w-full"
            />
          </div>

          {/* Start Button */}
          <BrassButton
            onClick={handleStartTesting}
            disabled={!selectedGame}
            variant={selectedGame ? "holiday" : "secondary"}
            size="lg"
            className="w-full max-w-[400px]"
          >
            START TESTING
          </BrassButton>
        </div>
      </main>
    </SteampunkLayout>
  );
}

