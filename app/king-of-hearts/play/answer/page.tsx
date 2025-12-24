'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/app/lib/gameState';
import { getQuestion } from '@/app/lib/questions';
import { 
  SteampunkLayout, 
  BrassButton, 
  GameCard, 
  HolidayGarland, 
  Gear 
} from '@/components/ui/qtc-components';

export default function AnswerReveal() {
  const router = useRouter();
  const { state } = useGameState();

  useEffect(() => {
    if (!state.currentCategory || !state.currentDifficulty) {
      router.push('/king-of-hearts/play');
    }
  }, [state.currentCategory, state.currentDifficulty, router]);

  if (!state.currentCategory || !state.currentDifficulty) {
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-qtc-copper">Loading...</p>
        </main>
      </SteampunkLayout>
    );
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

  const handleContinue = () => {
    router.push('/king-of-hearts/play/scoring');
  };

  return (
    <SteampunkLayout variant="holiday">
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <HolidayGarland className="mb-8" />
        <div className="w-full max-w-[600px] text-center">
          <h1 className="font-heading text-[36px] font-bold text-qtc-cream mb-12">
            THE ANSWER
          </h1>

          <GameCard variant="brass" className="mb-8">
            <p className="font-heading text-[48px] font-bold text-qtc-cream mb-6">
              {question.answer.display}
            </p>
            
            {question.answer.acceptable.length > 1 && (
              <div className="pt-6 border-t border-qtc-copper/30">
                <p className="font-body text-[14px] text-qtc-copper mb-2">
                  Also accept:
                </p>
                <p className="font-body text-[16px] text-qtc-copper">
                  {question.answer.acceptable.slice(1).join(', ')}
                </p>
              </div>
            )}
          </GameCard>

          <BrassButton
            onClick={handleContinue}
            variant="holiday"
            size="lg"
          >
            Who got it right?
          </BrassButton>
        </div>
      </main>
    </SteampunkLayout>
  );
}

