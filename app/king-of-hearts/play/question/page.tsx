'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/app/lib/gameState';
import { getQuestion, formatQuestionText, formatRangeText, formatPlayerPrompt } from '@/app/lib/questions';

export default function QuestionDisplay() {
  const router = useRouter();
  const { state, getCurrentPlayer, getCategoryExpert, setExpertStealAttempted } = useGameState();
  const [showExpertSteal, setShowExpertSteal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Redirect if no category or difficulty selected
    if (!state.currentCategory || !state.currentDifficulty) {
      router.push('/king-of-hearts/play');
    }
  }, [state.currentCategory, state.currentDifficulty, router]);

  if (!mounted || !state.currentCategory || !state.currentDifficulty) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex items-center justify-center">
        <p className="text-[#9B9388]">Loading...</p>
      </main>
    );
  }

  const currentPlayer = getCurrentPlayer();
  if (!currentPlayer) {
    router.push('/king-of-hearts/play');
    return null;
  }

  const question = getQuestion(state.currentCategory, state.currentDifficulty);
  if (!question) {
    return (
      <main className="min-h-screen bg-[#1F1E1C] flex items-center justify-center">
        <p className="text-[#9B9388]">Question not found</p>
      </main>
    );
  }

  const expertName = getCategoryExpert(state.currentCategory);
  const canSteal = expertName && expertName !== currentPlayer.name && !state.expertStealAttempted;

  const handleSteal = () => {
    setExpertStealAttempted(true, expertName || undefined);
    setShowExpertSteal(true);
  };

  const handleReveal = () => {
    router.push('/king-of-hearts/play/answer');
  };

  // SCREEN 9: Expert Steal Prompt
  if (showExpertSteal) {
    const stealPrompts = [
      `${expertName}, say more!`,
      `${expertName}, show us what you got`,
      `${expertName}, prove it`,
      `${expertName}, let's hear it`,
    ];
    const randomPrompt = stealPrompts[Math.floor(Math.random() * stealPrompts.length)];

    return (
      <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[500px] text-center">
          <h1 className="font-heading text-[42px] font-bold text-[#F0EEE9] mb-8">
            {randomPrompt}
          </h1>
          
          <p className="font-body text-[18px] text-[#9B9388] mb-12">
            {expertName} answers verbally...
          </p>

          <button
            onClick={handleReveal}
            className="px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
            style={{ borderRadius: '8px' }}
          >
            What&apos;s the real answer?
          </button>
        </div>
      </main>
    );
  }

  // SCREEN 8: Question Display
  const questionText = formatQuestionText(question, currentPlayer.name);
  const rangeText = formatRangeText(question, currentPlayer.name);
  const playerPrompt = formatPlayerPrompt(question, currentPlayer.name);

  return (
    <main className="min-h-screen bg-[#1F1E1C] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[600px]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-[24px] font-bold text-[#9B9388] uppercase tracking-wider mb-2">
            {state.currentCategory} - {state.currentDifficulty}
          </h1>
        </div>

        {/* Question Card */}
        <div className="bg-[#2D2B28] rounded-xl p-8 mb-8 border-2 border-[#F0EEE9]">
          <p className="font-body text-[28px] text-[#F0EEE9] mb-6 text-center leading-relaxed">
            {questionText}
          </p>
          
          <p className="font-body text-[18px] text-[#9B9388] text-center mb-4">
            {rangeText}
          </p>
          
          <p className="font-body text-[16px] text-[#D4A574] text-center italic">
            {playerPrompt}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          {canSteal && (
            <button
              onClick={handleSteal}
              className="px-8 py-4 bg-transparent border-2 border-[#D4A574] text-[#D4A574] font-body text-[18px] font-bold rounded-lg cursor-pointer transition-all duration-150 ease-out hover:bg-[#D4A574]/10 hover:scale-[0.98] active:scale-[0.96] select-none"
            >
              {expertName}, steal!
            </button>
          )}
          
          <button
            onClick={handleReveal}
            className="px-12 py-5 bg-[#F0EEE9] text-[#1F1E1C] font-body text-lg font-bold rounded cursor-pointer transition-all duration-150 ease-out hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] select-none"
            style={{ borderRadius: '8px' }}
          >
            Reveal the answer
          </button>
        </div>
      </div>
    </main>
  );
}

