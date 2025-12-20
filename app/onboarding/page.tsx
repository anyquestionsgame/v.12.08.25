'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SteampunkLayout, BrassButton, BrassInput, GameCard, GhostButton, Gear } from '@/components/ui/qtc-components';

interface PlayerData {
  name: string;
  goodAt: string;
  ratherDie: string;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState<'intro' | 'questions' | 'savagery' | 'location'>('intro');
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [playerCount, setPlayerCount] = useState(4);
  const [timer, setTimer] = useState(60);
  const [timerExpired, setTimerExpired] = useState(false);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  
  // Current player's form data
  const [name, setName] = useState('');
  const [goodAt, setGoodAt] = useState('');
  const [ratherDie, setRatherDie] = useState('');
  
  // Savagery and location
  const [savageryLevel, setSavageryLevel] = useState<'gentle' | 'standard' | 'brutal'>('standard');
  const [location, setLocation] = useState('');
  const [locationError, setLocationError] = useState('');
  
  // Mounted state to prevent SSR issues
  const [mounted, setMounted] = useState(false);

  // Set mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get player count from URL params or localStorage
  useEffect(() => {
    if (!mounted) return;
    
    const urlPlayers = searchParams.get('players');
    if (urlPlayers) {
      setPlayerCount(parseInt(urlPlayers, 10));
    } else {
      const storedPlayers = localStorage.getItem('playerCount');
      if (storedPlayers) {
        setPlayerCount(parseInt(storedPlayers, 10));
      }
    }
  }, [searchParams, mounted]);

  // Timer countdown
  useEffect(() => {
    if (step !== 'questions') return;
    if (timer <= 0) {
      setTimerExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFormComplete = name.trim() && goodAt.trim() && ratherDie.trim();

  const handleStart = () => {
    setStep('questions');
    setTimer(60);
    setTimerExpired(false);
  };

  const handleSavageryContinue = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('qtc_savagery', savageryLevel);
    }
    setStep('location');
  };

  const handleLocationDetect = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocoding to get city name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          const data = await response.json();
          if (data.city && data.principalSubdivision) {
            setLocation(`${data.city}, ${data.principalSubdivision}`);
            setLocationError('');
          } else {
            setLocationError("Can't detect location - please enter manually");
          }
        } catch (error) {
          setLocationError("Can't detect location - please enter manually");
        }
      },
      () => {
        setLocationError("Can't detect location - please enter manually");
      }
    );
  };

  const handleLocationContinue = () => {
    const locationValue = location.trim() || undefined;
    if (typeof window !== 'undefined') {
      localStorage.setItem('qtc_location', locationValue || '');
    }
    router.push('/games');
  };

  const handleLocationSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('qtc_location', '');
    }
    router.push('/games');
  };

  const handleNextPlayer = useCallback(() => {
    // Save current player's data
    const newPlayerData: PlayerData = {
      name: name.trim(),
      goodAt: goodAt.trim(),
      ratherDie: ratherDie.trim(),
    };
    
    const updatedPlayers = [...players, newPlayerData];
    setPlayers(updatedPlayers);

    if (currentPlayer >= playerCount) {
      // Last player - save to localStorage and move to savagery selection
      if (typeof window !== 'undefined') {
        localStorage.setItem('players', JSON.stringify(updatedPlayers));
        // Also save with orchestrator key format
        const orchestratorPlayers = updatedPlayers.map(p => ({
          name: p.name,
          expertise: p.goodAt,
          ratherDieThan: p.ratherDie
        }));
        localStorage.setItem('qtc_players', JSON.stringify(orchestratorPlayers));
      }
      setStep('savagery');
    } else {
      // Next player
      setCurrentPlayer((prev) => prev + 1);
      setName('');
      setGoodAt('');
      setRatherDie('');
      setTimer(60);
      setTimerExpired(false);
    }
  }, [name, goodAt, ratherDie, players, currentPlayer, playerCount, router]);

  // Prevent SSR issues - don't render until mounted
  if (!mounted) {
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </main>
      </SteampunkLayout>
    );
  }

  // Intro Screen
  if (step === 'intro') {
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col items-center justify-center">
          <div className="relative z-10 flex flex-col items-center">
            {/* Heading */}
            <h1 className="font-heading text-[52px] font-bold text-qtc-brass-light tracking-tight select-none">
              INTRODUCTIONS
            </h1>

            {/* Decorative line */}
            <div className="mt-4 w-[100px] h-[3px] bg-qtc-brass rounded-full" />

            {/* Instructions */}
            <p className="mt-8 font-body text-[16px] text-qtc-copper text-center max-w-[300px]">
              Pass the phone around. Each player gets 60 seconds.
            </p>

            {/* Start button */}
            <BrassButton
              onClick={handleStart}
              variant="holiday"
              size="lg"
              className="mt-[80px]"
            >
              START
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // Savagery Selection Screen
  if (step === 'savagery') {
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="relative z-10 flex flex-col items-center w-full max-w-[400px]">
            <h1 className="font-heading text-[42px] font-bold text-qtc-brass-light tracking-tight select-none text-center">
              HOW SAVAGE?
            </h1>
            
            <p className="mt-4 font-body text-[16px] text-qtc-copper text-center">
              This controls how edgy the prompts get
            </p>
            
            <div className="mt-8 w-full space-y-4">
              {/* GENTLE */}
              <button
                onClick={() => setSavageryLevel('gentle')}
                className={`
                  w-full p-6 rounded-xl border-2 text-left
                  transition-all duration-150 ease-out cursor-pointer
                  ${savageryLevel === 'gentle' 
                    ? 'bg-qtc-charcoal border-qtc-brass shadow-brass' 
                    : 'bg-transparent border-qtc-brass/50 hover:border-qtc-brass'
                  }
                `}
              >
                <h3 className="font-heading text-[24px] font-bold text-qtc-brass-light">GENTLE</h3>
                <p className="mt-2 font-body text-[14px] text-qtc-copper">
                  Things you&apos;d admit to your mom
                </p>
              </button>
              
              {/* STANDARD */}
              <button
                onClick={() => setSavageryLevel('standard')}
                className={`
                  w-full p-6 rounded-xl border-2 text-left
                  transition-all duration-150 ease-out cursor-pointer
                  ${savageryLevel === 'standard' 
                    ? 'bg-qtc-charcoal border-qtc-brass shadow-brass' 
                    : 'bg-transparent border-qtc-brass/50 hover:border-qtc-brass'
                  }
                `}
              >
                <h3 className="font-heading text-[24px] font-bold text-qtc-brass-light">STANDARD</h3>
                <p className="mt-2 font-body text-[14px] text-qtc-copper">
                  Embarrassing, not incriminating
                </p>
              </button>
              
              {/* BRUTAL */}
              <button
                onClick={() => setSavageryLevel('brutal')}
                className={`
                  w-full p-6 rounded-xl border-2 text-left
                  transition-all duration-150 ease-out cursor-pointer
                  ${savageryLevel === 'brutal' 
                    ? 'bg-qtc-charcoal border-qtc-brass shadow-brass' 
                    : 'bg-transparent border-qtc-brass/50 hover:border-qtc-brass'
                  }
                `}
              >
                <h3 className="font-heading text-[24px] font-bold text-qtc-brass-light">BRUTAL</h3>
                <p className="mt-2 font-body text-[14px] text-qtc-copper">
                  Everything&apos;s on the table. Blame the game.
                </p>
              </button>
            </div>
            
            <BrassButton
              onClick={handleSavageryContinue}
              variant="holiday"
              size="lg"
              className="mt-10"
            >
              CONTINUE
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // Location Input Screen
  if (step === 'location') {
    return (
      <SteampunkLayout variant="dark" showGears={true}>
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="relative z-10 flex flex-col items-center w-full max-w-[400px]">
            <h1 className="font-heading text-[42px] font-bold text-qtc-brass-light tracking-tight select-none text-center">
              WHERE ARE YOU PLAYING?
            </h1>
            
            <p className="mt-4 font-body text-[14px] text-qtc-copper text-center">
              This personalizes some questions to your area
            </p>
            
            {/* Auto-detect link */}
            <button
              onClick={handleLocationDetect}
              className="mt-6 font-body text-[14px] text-qtc-brass cursor-pointer hover:text-qtc-brass-light transition-colors"
            >
              📍 Use my current location
            </button>
            
            {locationError && (
              <p className="mt-2 font-body text-[12px] text-qtc-holiday-red text-center">
                {locationError}
              </p>
            )}
            
            {/* Input field */}
            <BrassInput
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setLocationError('');
              }}
              placeholder="City, State (e.g., Austin, Texas)"
              className="mt-6 w-full"
            />
            
            <p className="mt-2 font-body text-[12px] text-qtc-copper text-center">
              Optional - skip if you want generic questions only
            </p>
            
            {/* Buttons */}
            <div className="mt-8 w-full flex gap-4">
              <GhostButton
                onClick={handleLocationSkip}
                className="flex-1"
              >
                SKIP
              </GhostButton>
              
              <BrassButton
                onClick={handleLocationContinue}
                variant="holiday"
                size="lg"
                className="flex-1"
              >
                CONTINUE
              </BrassButton>
            </div>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // Questions Screen
  return (
    <SteampunkLayout variant="dark" showGears={true}>
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="relative z-10 flex flex-col items-center w-full max-w-[400px]">
          {/* Header with timer */}
          <div className="w-full flex items-center justify-between mb-8">
            <h2 className="font-heading text-[24px] font-bold text-qtc-brass-light select-none">
              YOUR TURN, PLAYER {currentPlayer}
            </h2>
            <span className={`font-mono text-[32px] ${timerExpired ? 'text-qtc-cream' : 'text-qtc-brass'}`}>
              {formatTime(timer)}
            </span>
          </div>

          {/* Timer warning */}
          {timerExpired && (
            <p className="mb-4 font-body text-[14px] text-qtc-brass text-center">
              Time&apos;s up! But no rush—finish when you&apos;re ready.
            </p>
          )}

          {/* Input fields */}
          <GameCard variant="brass" className="w-full mb-6">
            <div className="space-y-4">
              <BrassInput
                label="Hi! I'm:"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full"
              />

              <BrassInput
                label="I'm weirdly good at:"
                value={goodAt}
                onChange={(e) => setGoodAt(e.target.value)}
                placeholder="Something unexpected"
                className="w-full"
              />

              <BrassInput
                label="I'd rather die than:"
                value={ratherDie}
                onChange={(e) => setRatherDie(e.target.value)}
                placeholder="Your dealbreaker"
                className="w-full"
              />
            </div>
          </GameCard>

          {/* Next/Finish button */}
          <BrassButton
            onClick={handleNextPlayer}
            disabled={!isFormComplete}
            variant={isFormComplete ? "holiday" : "secondary"}
            size="lg"
            className="w-full"
          >
            {currentPlayer >= playerCount ? 'FINISH' : 'NEXT PLAYER'}
          </BrassButton>

          {/* Progress indicator */}
          <p className="mt-6 font-body text-[13px] text-qtc-copper">
            Player {currentPlayer} of {playerCount}
          </p>
        </div>
      </main>
    </SteampunkLayout>
  );
}

export default function Onboarding() {
  return (
    <Suspense fallback={
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </main>
      </SteampunkLayout>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
