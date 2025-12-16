'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { validateSession, getRecoveryPath } from '@/utils/sessionValidation';

// Navigation helper that shows a back button on game pages
// Helps users navigate if they get lost
export default function NavigationHelper() {
  const router = useRouter();
  const pathname = usePathname();
  const [showHelper, setShowHelper] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Show helper on game pages and final scores
    const isGamePage = pathname?.startsWith('/play') || pathname === '/games' || pathname === '/final-scores';
    setShowHelper(isGamePage);
  }, [pathname, mounted]);

  if (!showHelper || !mounted) return null;

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoToGames = () => {
    const validation = validateSession();
    if (validation.valid) {
      router.push('/games');
    } else {
      router.push(getRecoveryPath(validation.error));
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={handleGoToGames}
        className="px-4 py-2 bg-[#2D2B28] border border-[#9B9388] text-[#9B9388] font-body text-[12px] rounded-lg cursor-pointer transition-all duration-150 ease-out hover:border-[#F0EEE9] hover:text-[#F0EEE9] select-none"
        aria-label="Go to games"
      >
        Games
      </button>
      <button
        onClick={handleGoHome}
        className="px-4 py-2 bg-[#2D2B28] border border-[#9B9388] text-[#9B9388] font-body text-[12px] rounded-lg cursor-pointer transition-all duration-150 ease-out hover:border-[#F0EEE9] hover:text-[#F0EEE9] select-none"
        aria-label="Go home"
      >
        Home
      </button>
    </div>
  );
}

