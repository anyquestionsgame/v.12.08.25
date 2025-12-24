'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/app/lib/gameState';
import { getQuestion, formatQuestionText, formatRangeText, formatPlayerPrompt } from '@/app/lib/questions';
import { SteampunkLayout, BrassButton, GameCard, HolidayGarland, Gear } from '@/components/ui/qtc-components';

export default function QuestionDisplay() {
  const router = useRouter();
  const { state, getCurrentPlayer, getCategoryExpert, setExpertStealAttempted } = useGameState();
  const [showExpertSteal, setShowExpertSteal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!state.currentCategory || !state.currentDifficulty) {
      router.push('/king-of-hearts/play');
    }
  }, [state.currentCategory, state.currentDifficulty, router]);

  if (!mounted || !state.currentCategory || !state.currentDifficulty) {
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </main>
      </SteampunkLayout>
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
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-qtc-copper">Question not found</p>
        </main>
      </SteampunkLayout>
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

  // Expert Steal Prompt
  if (showExpertSteal) {
    const stealPrompts = [
      `${expertName}, say more!`,
      `${expertName}, show us what you got`,
      `${expertName}, prove it`,
      `${expertName}, let's hear it`,
    ];
    const randomPrompt = stealPrompts[Math.floor(Math.random() * stealPrompts.length)];

    return (
      <SteampunkLayout variant="holiday">
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
          <HolidayGarland className="mb-8" />
          <div className="w-full max-w-[500px] text-center">
            <h1 className="font-heading text-[42px] font-bold text-qtc-cream mb-8">
              {randomPrompt}
            </h1>
            
            <p className="font-body text-[18px] text-qtc-copper mb-12">
              {expertName} answers verbally...
            </p>

            <BrassButton
              onClick={handleReveal}
              variant="holiday"
              size="lg"
            >
              What&apos;s the real answer?
            </BrassButton>
          </div>
        </main>
      </SteampunkLayout>
    );
  }

  // Question Display
  const questionText = formatQuestionText(question, currentPlayer.name);
  const rangeText = formatRangeText(question, currentPlayer.name);
  const playerPrompt = formatPlayerPrompt(question, currentPlayer.name);

  return (
    <SteampunkLayout variant="dark">
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[600px]">
          <div className="text-center mb-8">
            <h1 className="font-heading text-[24px] font-bold text-qtc-copper uppercase tracking-wider mb-2">
              {state.currentCategory} - {state.currentDifficulty}
            </h1>
          </div>

          <GameCard variant="brass" className="mb-8">
            <p className="font-body text-[28px] text-qtc-cream mb-6 text-center leading-relaxed">
              {questionText}
            </p>
            
            <p className="font-body text-[18px] text-qtc-copper text-center mb-4">
              {rangeText}
            </p>
            
            <p className="font-body text-[16px] text-qtc-brass text-center italic">
              {playerPrompt}
            </p>
          </GameCard>

          <div className="flex flex-col gap-4">
            {canSteal && (
              <BrassButton
                onClick={handleSteal}
                variant="primary"
                size="lg"
                className="border-2 border-qtc-brass"
              >
                {expertName}, steal!
              </BrassButton>
            )}
            
            <BrassButton
              onClick={handleReveal}
              variant="holiday"
              size="lg"
            >
              Reveal the answer
            </BrassButton>
          </div>
        </div>
      </main>
    </SteampunkLayout>
  );
}

