'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SteampunkLayout, BrassButton } from '@/components/ui/qtc-components';

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
    <SteampunkLayout variant="dark" showGears={true}>
      <main className="min-h-screen flex flex-col items-center justify-center">
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Heading */}
          <h1 className="font-heading text-[42px] font-bold text-qtc-brass-light tracking-tight select-none">
            BEFORE WE PLAY
          </h1>

          {/* Decorative line */}
          <div className="mt-4 w-[100px] h-[3px] bg-qtc-brass rounded-full" />

          {/* Subheading */}
          <p className="mt-8 font-body text-[13px] font-medium uppercase tracking-wider text-qtc-copper select-none">
            How many players?
          </p>

          {/* Player count grid */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {playerOptions.map((num) => (
              <button
                key={num}
                onClick={() => setSelectedPlayers(num)}
                className={`
                  w-[80px] h-[80px] rounded-lg border-2
                  font-heading text-[32px] font-bold
                  transition-all duration-150 ease-out
                  hover:scale-[0.98] active:scale-[0.96]
                  cursor-pointer select-none
                  ${selectedPlayers === num
                    ? 'bg-brass-gradient text-qtc-black border-qtc-brass-light/30 shadow-brass'
                    : 'bg-transparent text-qtc-cream border-qtc-brass/50 hover:border-qtc-brass'
                  }
                `}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Continue button */}
          <BrassButton
            onClick={handleContinue}
            disabled={!selectedPlayers}
            variant={selectedPlayers ? "holiday" : "secondary"}
            size="lg"
            className="mt-[80px]"
          >
            CONTINUE
          </BrassButton>
        </div>
      </main>
    </SteampunkLayout>
  );
}
