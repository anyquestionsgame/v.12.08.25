'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface PlayerData {
  name: string;
  goodAt: string;
  ratherDie: string;
}

export default function Onboarding() {
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

  // Get player count from URL params or localStorage
  useEffect(() => {
    const urlPlayers = searchParams.get('players');
    if (urlPlayers) {
      setPlayerCount(parseInt(urlPlayers, 10));
    } else {
      const storedPlayers = localStorage.getItem('playerCount');
      if (storedPlayers) {
        setPlayerCount(parseInt(storedPlayers, 10));
      }
    }
  }, [searchParams]);

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
    localStorage.setItem('qtc_savagery', savageryLevel);
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
    localStorage.setItem('qtc_location', locationValue || '');
    router.push('/games');
  };

  const handleLocationSkip = () => {
    localStorage.setItem('qtc_location', '');
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
      localStorage.setItem('players', JSON.stringify(updatedPlayers));
      // Also save with orchestrator key format
      const orchestratorPlayers = updatedPlayers.map(p => ({
        name: p.name,
        expertise: p.goodAt,
        ratherDieThan: p.ratherDie
      }));
      localStorage.setItem('qtc_players', JSON.stringify(orchestratorPlayers));
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

  // Intro Screen
  if (step === 'intro') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center">
        <div className="relative z-10 flex flex-col items-center">
          {/* Heading */}
          <h1 className="font-heading text-[52px] font-bold text-[#F0EEE9] tracking-tight select-none">
            INTRODUCTIONS
          </h1>

          {/* Decorative line */}
          <div className="mt-4 w-[100px] h-[3px] bg-[#D4A574] rounded-full" />

          {/* Instructions */}
          <p className="mt-8 font-body text-[16px] text-[#9B9388] text-center max-w-[300px]">
            Pass the phone around. Each player gets 60 seconds.
          </p>

          {/* Start button */}
          <button
            onClick={handleStart}
            className="mt-[80px] px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
            style={{ borderRadius: '8px' }}
          >
            START
          </button>
        </div>
      </main>
    );
  }

  // Savagery Selection Screen
  if (step === 'savagery') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <div className="relative z-10 flex flex-col items-center w-full max-w-[400px]">
          <h1 className="font-heading text-[42px] font-bold text-[#F0EEE9] tracking-tight select-none text-center">
            HOW SAVAGE?
          </h1>
          
          <p className="mt-4 font-body text-[16px] text-[#9B9388] text-center">
            This controls how edgy the prompts get
          </p>
          
          <div className="mt-8 w-full space-y-4">
            {/* GENTLE */}
            <button
              onClick={() => setSavageryLevel('gentle')}
              className={`
                w-full p-6 rounded-xl border-2 border-[#F0EEE9] text-left
                transition-all duration-150 ease-out cursor-pointer
                ${savageryLevel === 'gentle' ? 'bg-[#2D2B28]' : 'bg-transparent'}
              `}
            >
              <h3 className="font-heading text-[24px] font-bold text-[#F0EEE9]">GENTLE</h3>
              <p className="mt-2 font-body text-[14px] text-[#9B9388]">
                Things you&apos;d admit to your mom
              </p>
            </button>
            
            {/* STANDARD */}
            <button
              onClick={() => setSavageryLevel('standard')}
              className={`
                w-full p-6 rounded-xl border-2 border-[#F0EEE9] text-left
                transition-all duration-150 ease-out cursor-pointer
                ${savageryLevel === 'standard' ? 'bg-[#2D2B28]' : 'bg-transparent'}
              `}
            >
              <h3 className="font-heading text-[24px] font-bold text-[#F0EEE9]">STANDARD</h3>
              <p className="mt-2 font-body text-[14px] text-[#9B9388]">
                Embarrassing, not incriminating
              </p>
            </button>
            
            {/* BRUTAL */}
            <button
              onClick={() => setSavageryLevel('brutal')}
              className={`
                w-full p-6 rounded-xl border-2 border-[#F0EEE9] text-left
                transition-all duration-150 ease-out cursor-pointer
                ${savageryLevel === 'brutal' ? 'bg-[#2D2B28]' : 'bg-transparent'}
              `}
            >
              <h3 className="font-heading text-[24px] font-bold text-[#F0EEE9]">BRUTAL</h3>
              <p className="mt-2 font-body text-[14px] text-[#9B9388]">
                Everything&apos;s on the table. Blame the game.
              </p>
            </button>
          </div>
          
          <button
            onClick={handleSavageryContinue}
            className="mt-10 px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
            style={{ borderRadius: '8px' }}
          >
            CONTINUE
          </button>
        </div>
      </main>
    );
  }

  // Location Input Screen
  if (step === 'location') {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <div className="relative z-10 flex flex-col items-center w-full max-w-[400px]">
          <h1 className="font-heading text-[42px] font-bold text-[#F0EEE9] tracking-tight select-none text-center">
            WHERE ARE YOU PLAYING?
          </h1>
          
          <p className="mt-4 font-body text-[14px] text-[#9B9388] text-center">
            This personalizes some questions to your area
          </p>
          
          {/* Auto-detect link */}
          <button
            onClick={handleLocationDetect}
            className="mt-6 font-body text-[14px] text-[#D4A574] cursor-pointer hover:underline"
          >
            📍 Use my current location
          </button>
          
          {locationError && (
            <p className="mt-2 font-body text-[12px] text-[#C45B4D] text-center">
              {locationError}
            </p>
          )}
          
          {/* Input field */}
          <input
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setLocationError('');
            }}
            placeholder="City, State (e.g., Austin, Texas)"
            className="mt-6 w-full h-[56px] px-4 bg-transparent border-2 border-[#F0EEE9] rounded-lg font-body text-[20px] text-[#F0EEE9] placeholder-[#9B9388] focus:outline-none focus:ring-2 focus:ring-[#F0EEE9]/30"
          />
          
          <p className="mt-2 font-body text-[12px] text-[#9B9388] text-center">
            Optional - skip if you want generic questions only
          </p>
          
          {/* Buttons */}
          <div className="mt-8 w-full flex gap-4">
            <button
              onClick={handleLocationSkip}
              className="flex-1 py-4 bg-transparent border-2 border-[#9B9388] text-[#9B9388] font-body text-[16px] font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:border-[#F0EEE9] hover:text-[#F0EEE9] select-none"
            >
              SKIP
            </button>
            
            <button
              onClick={handleLocationContinue}
              className="flex-1 py-4 bg-[#F0EEE9] text-[#1F1E1C] font-body text-[16px] font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
            >
              CONTINUE
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Questions Screen
  return (
    <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
      <div className="relative z-10 flex flex-col items-center w-full max-w-[400px]">
        {/* Header with timer */}
        <div className="w-full flex items-center justify-between mb-8">
          <h2 className="font-heading text-[24px] font-bold text-[#F0EEE9] select-none">
            YOUR TURN, PLAYER {currentPlayer}
          </h2>
          <span className={`font-mono text-[32px] ${timerExpired ? 'text-[#F0EEE9]' : 'text-[#D4A574]'}`}>
            {formatTime(timer)}
          </span>
        </div>

        {/* Timer warning */}
        {timerExpired && (
          <p className="mb-4 font-body text-[14px] text-[#D4A574] text-center">
            Time&apos;s up! But no rush—finish when you&apos;re ready.
          </p>
        )}

        {/* Input fields */}
        <div className="w-full space-y-4">
          <div>
            <label className="block font-body text-[13px] font-medium uppercase tracking-wider text-[#9B9388] mb-2 select-none">
              Hi! I&apos;m:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full h-[56px] px-4 bg-transparent border-2 border-[#F0EEE9] rounded-lg font-body text-[16px] text-[#F0EEE9] placeholder-[#9B9388] focus:outline-none focus:ring-2 focus:ring-[#F0EEE9]/30"
            />
          </div>

          <div>
            <label className="block font-body text-[13px] font-medium uppercase tracking-wider text-[#9B9388] mb-2 select-none">
              I&apos;m weirdly good at:
            </label>
            <input
              type="text"
              value={goodAt}
              onChange={(e) => setGoodAt(e.target.value)}
              placeholder="Something unexpected"
              className="w-full h-[56px] px-4 bg-transparent border-2 border-[#F0EEE9] rounded-lg font-body text-[16px] text-[#F0EEE9] placeholder-[#9B9388] focus:outline-none focus:ring-2 focus:ring-[#F0EEE9]/30"
            />
          </div>

          <div>
            <label className="block font-body text-[13px] font-medium uppercase tracking-wider text-[#9B9388] mb-2 select-none">
              I&apos;d rather die than:
            </label>
            <input
              type="text"
              value={ratherDie}
              onChange={(e) => setRatherDie(e.target.value)}
              placeholder="Your dealbreaker"
              className="w-full h-[56px] px-4 bg-transparent border-2 border-[#F0EEE9] rounded-lg font-body text-[16px] text-[#F0EEE9] placeholder-[#9B9388] focus:outline-none focus:ring-2 focus:ring-[#F0EEE9]/30"
            />
          </div>
        </div>

        {/* Next/Finish button */}
        <button
          onClick={handleNextPlayer}
          disabled={!isFormComplete}
          className={`
            mt-[60px] px-12 py-5 font-body text-lg font-bold rounded cursor-pointer
            transition-all duration-150 ease-out select-none
            ${isFormComplete
              ? 'bg-[#F0EEE9] text-[#1F1E1C] hover:opacity-90 hover:scale-[0.98] active:scale-[0.96]'
              : 'bg-transparent border-2 border-[#9B9388] text-[#9B9388] cursor-not-allowed'
            }
          `}
          style={{ borderRadius: '8px' }}
        >
          {currentPlayer >= playerCount ? 'FINISH' : 'NEXT PLAYER'}
        </button>

        {/* Progress indicator */}
        <p className="mt-6 font-body text-[13px] text-[#9B9388]">
          Player {currentPlayer} of {playerCount}
        </p>
      </div>
    </main>
  );
}
