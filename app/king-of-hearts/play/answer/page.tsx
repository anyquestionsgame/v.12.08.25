'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/app/lib/gameState';
import { getQuestion } from '@/app/lib/questions';

export default function AnswerReveal() {
  const router = useRouter();
  const { state } = useGameState();

  useEffect(() => {
    // Redirect if no category or difficulty selected
    if (!state.currentCategory || !state.currentDifficulty) {
      router.push('/king-of-hearts/play');
    }
  }, [state.currentCategory, state.currentDifficulty, router]);

  if (!state.currentCategory || !state.currentDifficulty) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex items-center justify-center">
        <p className="text-[#9B9388]">Loading...</p>
      </main>
    );
  }

  const question = getQuestion(state.currentCategory, state.currentDifficulty);
  if (!question) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex items-center justify-center">
        <p className="text-[#9B9388]">Question not found</p>
      </main>
    );
  }

  const handleContinue = () => {
    router.push('/king-of-hearts/play/scoring');
  };

  return (
    <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[600px] text-center">
        {/* Title */}
        <h1 className="font-heading text-[36px] font-bold text-[#F0EEE9] mb-12">
          THE ANSWER
        </h1>

        {/* Answer Display */}
        <div className="bg-[#2D2B28] rounded-xl p-8 mb-8 border-2 border-[#F0EEE9]">
          <p className="font-heading text-[48px] font-bold text-[#F0EEE9] mb-6">
            {question.answer.display}
          </p>
          
          {question.answer.acceptable.length > 1 && (
            <div className="pt-6 border-t border-[#9B9388]/30">
              <p className="font-body text-[14px] text-[#9B9388] mb-2">
                Also accept:
              </p>
              <p className="font-body text-[16px] text-[#9B9388]">
                {question.answer.acceptable.slice(1).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
          style={{ borderRadius: '8px' }}
        >
          Who got it right?
        </button>
      </div>
    </main>
  );
}

