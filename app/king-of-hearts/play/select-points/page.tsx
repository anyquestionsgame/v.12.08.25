'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/app/lib/gameState';
import { SteampunkLayout, BrassButton, GhostButton, HolidayGarland } from '@/components/ui/qtc-components';

export default function PointSelection() {
  const router = useRouter();
  const { state, getAvailablePointValues, setCurrentDifficulty, getCategoryExpert } = useGameState();

  useEffect(() => {
    if (!state.currentCategory) {
      router.push('/king-of-hearts/play');
    }
  }, [state.currentCategory, router]);

  if (!state.currentCategory) {
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-qtc-copper">Loading...</p>
        </main>
      </SteampunkLayout>
    );
  }

  const availablePoints = getAvailablePointValues(state.currentCategory);
  const expertName = getCategoryExpert(state.currentCategory);

  const handlePointSelect = (points: number) => {
    setCurrentDifficulty(points);
    router.push('/king-of-hearts/play/question');
  };

  const handleBack = () => {
    router.push('/king-of-hearts/play');
  };

  return (
    <SteampunkLayout variant="dark">
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[500px]">
          <HolidayGarland className="mb-6" />
          <h1 className="font-heading text-[36px] font-bold text-qtc-cream text-center mb-2">
            {state.currentCategory}
          </h1>
          {expertName && (
            <p className="font-body text-[16px] text-qtc-copper text-center mb-8">
              {expertName}&apos;s territory
            </p>
          )}

          <div className="grid grid-cols-4 gap-4 mb-8">
            {[100, 200, 300, 400].map((points) => {
              const isAvailable = availablePoints.includes(points);
              return (
                <button
                  key={points}
                  onClick={() => isAvailable && handlePointSelect(points)}
                  disabled={!isAvailable}
                  className={`
                    h-[80px] rounded-lg border-2 font-heading text-[24px] font-bold
                    transition-all duration-150 ease-out
                    ${isAvailable
                      ? 'bg-qtc-cream text-qtc-black border-qtc-cream hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] cursor-pointer'
                      : 'bg-transparent text-qtc-copper border-qtc-copper opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  {points}
                </button>
              );
            })}
          </div>

          <GhostButton
            onClick={handleBack}
            className="w-full"
          >
            Back to Categories
          </GhostButton>
        </div>
      </main>
    </SteampunkLayout>
  );
}

