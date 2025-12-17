'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/app/lib/gameState';

export default function PointSelection() {
  const router = useRouter();
  const { state, getAvailablePointValues, setCurrentDifficulty, getCategoryExpert } = useGameState();

  useEffect(() => {
    // Redirect if no category selected
    if (!state.currentCategory) {
      router.push('/king-of-hearts/play');
    }
  }, [state.currentCategory, router]);

  if (!state.currentCategory) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex items-center justify-center">
        <p className="text-[#9B9388]">Loading...</p>
      </main>
    );
  }

  const availablePoints = getAvailablePointValues(state.currentCategory);
  const expertName = getCategoryExpert(state.currentCategory);
  const askedPoints = [100, 200, 300, 400].filter(p => !availablePoints.includes(p));

  const handlePointSelect = (points: number) => {
    setCurrentDifficulty(points);
    router.push('/king-of-hearts/play/question');
  };

  const handleBack = () => {
    router.push('/king-of-hearts/play');
  };

  return (
    <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[500px]">
        {/* Header */}
        <h1 className="font-heading text-[36px] font-bold text-[#F0EEE9] text-center mb-2">
          {state.currentCategory}
        </h1>
        {expertName && (
          <p className="font-body text-[16px] text-[#9B9388] text-center mb-8">
            {expertName}&apos;s territory
          </p>
        )}

        {/* Point Value Buttons */}
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
                    ? 'bg-[#F0EEE9] text-[#1F1E1C] border-[#F0EEE9] hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] cursor-pointer'
                    : 'bg-transparent text-[#9B9388] border-[#9B9388] opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {points}
              </button>
            );
          })}
        </div>

        {/* Back Button */}
        <button
          onClick={handleBack}
          className="w-full py-4 bg-transparent border-2 border-[#9B9388] text-[#9B9388] font-body text-[16px] font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:border-[#F0EEE9] hover:text-[#F0EEE9] select-none"
        >
          Back to Categories
        </button>
      </div>
    </main>
  );
}

