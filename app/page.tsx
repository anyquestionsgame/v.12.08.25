'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SteampunkLayout, BrassButton } from '@/components/ui/qtc-components';

type IntroPhase = 'studio' | 'title' | 'redirect' | 'main';

export default function Home() {
  const router = useRouter();
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [introPhase, setIntroPhase] = useState<IntroPhase>('studio');
  const [opacity, setOpacity] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const testingMode = localStorage.getItem('qtc_testing_mode') === 'true';
    setIsTestingMode(testingMode);

    // Check if intro was already shown this session
    const introShown = sessionStorage.getItem('qtc_intro_shown');
    if (introShown === 'true') {
      setIntroPhase('main');
      return;
    }

    // Start intro sequence
    // Screen 1: Studio (0-3.5s)
    // - Fade in: 0-1s (1s transition)
    setOpacity(0);
    const fadeInStart = setTimeout(() => {
      setOpacity(1);
    }, 50);

    // - Hold: 1-3s (2s hold)
    // - Fade out: 3-3.5s (0.5s transition)
    const fadeOutStart = setTimeout(() => {
      setIsFadingOut(true);
      setOpacity(0);
    }, 3000);

    // Screen 2: Title (3.5-6s)
    // Start title phase at 3.5s
    const titleStart = setTimeout(() => {
      setIntroPhase('title');
      setIsFadingOut(false); // Reset for title fade in
      setOpacity(0);
      // Fade in: 3.5-4.3s (0.8s) - start immediately after phase change
      setTimeout(() => {
        setOpacity(1);
      }, 50);
    }, 3500);

    // - Hold: 4.3-5.5s (1.2s)
    // - Fade out: 5.5-6s (0.5s transition)
    const titleFadeOut = setTimeout(() => {
      setIsFadingOut(true);
      setOpacity(0);
    }, 5500);

    // Redirect (6s)
    const redirect = setTimeout(() => {
      setIntroPhase('redirect');
      sessionStorage.setItem('qtc_intro_shown', 'true');
      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        if (testingMode) {
          router.push('/test-setup');
        } else {
          router.push('/setup');
        }
      }, 50);
    }, 6000);

    return () => {
      clearTimeout(fadeInStart);
      clearTimeout(fadeOutStart);
      clearTimeout(titleStart);
      clearTimeout(titleFadeOut);
      clearTimeout(redirect);
    };
  }, [router]);

  const toggleTestingMode = () => {
    const newMode = !isTestingMode;
    setIsTestingMode(newMode);
    localStorage.setItem('qtc_testing_mode', newMode ? 'true' : 'false');
  };

  const handleStart = () => {
    if (isTestingMode) {
      router.push('/test-setup');
    } else {
      router.push('/setup');
    }
  };

  // INTRO SEQUENCE
  if (introPhase === 'studio' || introPhase === 'title') {
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen flex flex-col items-center justify-center">
          {introPhase === 'studio' && (
            <div 
              className="flex flex-col items-center justify-center"
              style={{ 
                opacity,
                transition: isFadingOut ? 'opacity 0.5s ease-in-out' : 'opacity 1s ease-in-out'
              }}
            >
              <h1 className="font-heading text-[56px] font-bold text-qtc-cream tracking-tight select-none">
                The Quality Time Co.
              </h1>
              <p className="mt-2 font-body text-[14px] text-qtc-copper lowercase select-none">
                presents
              </p>
            </div>
          )}

          {introPhase === 'title' && (
            <div 
              className="flex flex-col items-center justify-center"
              style={{ 
                opacity,
                transition: isFadingOut ? 'opacity 0.5s ease-in-out' : 'opacity 0.8s ease-in-out'
              }}
            >
              <h1 className="font-heading text-[36px] font-bold text-qtc-brass-light tracking-tight select-none text-center">
                Any Questions?
              </h1>
              <p className="mt-4 font-body text-[16px] text-qtc-copper select-none text-center">
                The perfect game. Every time.
              </p>
            </div>
          )}
        </main>
      </SteampunkLayout>
    );
  }

  // BLANK SCREEN DURING REDIRECT
  if (introPhase === 'redirect') {
    return (
      <SteampunkLayout variant="dark">
        <main className="min-h-screen" />
      </SteampunkLayout>
    );
  }

  // MAIN SCREEN (shown if intro was already shown or skipped)
  return (
    <SteampunkLayout variant="dark" showGears={true}>
      <main className="min-h-screen flex flex-col items-center justify-center relative animate-fadeIn">
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center animate-slideUp">
          {/* Heading */}
          <h1 className="font-heading text-[52px] font-bold text-qtc-brass-light tracking-tight select-none">
            THE QUALITY TIME CO.
          </h1>
          
          {/* Decorative line */}
          <div className="mt-4 w-[100px] h-[3px] bg-qtc-brass rounded-full" />

          {/* Primary Button */}
          <BrassButton
            onClick={handleStart}
            variant={isTestingMode ? "primary" : "holiday"}
            size="lg"
            className="mt-[120px]"
          >
            {isTestingMode ? 'QUICK TEST MODE' : 'START NEW GAME'}
          </BrassButton>
        </div>

        {/* Testing Mode Toggle */}
        <button
          onClick={toggleTestingMode}
          className="absolute bottom-6 left-6 font-body text-[12px] text-qtc-copper cursor-pointer hover:text-qtc-brass transition-colors select-none"
          aria-label="Toggle testing mode"
        >
          🔧 Testing Mode
        </button>
      </main>
    </SteampunkLayout>
  );
}
