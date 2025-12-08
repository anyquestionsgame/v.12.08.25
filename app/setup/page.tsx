'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Setup() {
  const [selectedPlayers, setSelectedPlayers] = useState<number | null>(null);
  const router = useRouter();

  const playerOptions = [3, 4, 5, 6, 7, 8];

  const handleContinue = () => {
    if (selectedPlayers) {
      // Save player count and navigate to onboarding
      localStorage.setItem('playerCount', selectedPlayers.toString());
      router.push(`/onboarding?players=${selectedPlayers}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Heading */}
        <h1 className="font-heading text-[42px] font-bold text-[#F0EEE9] tracking-tight select-none">
          BEFORE WE PLAY
        </h1>

        {/* Decorative line */}
        <div className="mt-4 w-[100px] h-[3px] bg-[#D4A574] rounded-full" />

        {/* Subheading */}
        <p className="mt-8 font-body text-[13px] font-medium uppercase tracking-wider text-[#9B9388] select-none">
          How many players?
        </p>

        {/* Player count grid */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {playerOptions.map((num) => (
            <button
              key={num}
              onClick={() => setSelectedPlayers(num)}
              className={`
                w-[80px] h-[80px] rounded-lg border-2 border-[#F0EEE9]
                font-heading text-[32px] font-bold
                transition-all duration-150 ease-out
                hover:scale-[0.98] active:scale-[0.96]
                cursor-pointer select-none
                ${selectedPlayers === num
                  ? 'bg-[#F0EEE9] text-[#1F1E1C]'
                  : 'bg-transparent text-[#F0EEE9]'
                }
              `}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selectedPlayers}
          className={`
            mt-[80px] px-12 py-5 font-body text-lg font-bold rounded cursor-pointer
            transition-all duration-150 ease-out select-none
            ${selectedPlayers
              ? 'bg-[#F0EEE9] text-[#1F1E1C] hover:opacity-90 hover:scale-[0.98] active:scale-[0.96]'
              : 'bg-transparent border-2 border-[#9B9388] text-[#9B9388] cursor-not-allowed'
            }
          `}
          style={{ borderRadius: '8px' }}
        >
          CONTINUE
        </button>
      </div>
    </main>
  );
}
