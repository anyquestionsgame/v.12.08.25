'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SteampunkLayout, HolidayGarland, Gear, GameCard } from '@/components/ui/qtc-components';

interface Player {
  name: string;
  selfCategory: string;
  peerCategory: string;
  score: number;
}

export default function Round2Start() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const storedPlayers = localStorage.getItem('king_of_hearts_players');
      if (storedPlayers) {
        try {
          setPlayers(JSON.parse(storedPlayers));
        } catch (error) {
          console.error('Error parsing players:', error);
          router.push('/king-of-hearts');
        }
      } else {
        router.push('/king-of-hearts');
      }
    }
  }, [router]);

  useEffect(() => {
    if (mounted && players.length > 0) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('king_of_hearts_round', '2');
        }
        router.push('/king-of-hearts/play');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mounted, players, router]);

  if (!mounted || players.length === 0) {
    return (
      <SteampunkLayout variant="copper">
        <main className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </main>
      </SteampunkLayout>
    );
  }

  const round2Categories = players.map(p => ({
    category: p.peerCategory,
    player: p.name,
  }));

  return (
    <SteampunkLayout variant="holiday">
      <main className="min-h-screen flex flex-col items-center justify-center px-6 animate-fadeIn">
        <div className="w-full max-w-[500px] text-center">
          <HolidayGarland className="mb-6" />
          <p className="font-body text-[14px] text-qtc-copper uppercase tracking-wider">
            Get Ready
          </p>
          <h1 className="mt-2 font-heading text-[56px] font-bold text-qtc-holiday-green">
            ROUND 2
          </h1>
          
          <p className="mt-4 font-heading text-[24px] text-qtc-holiday-red font-semibold">
            Things They Won&apos;t Shut Up About
          </p>
          
          <p className="mt-2 font-body text-[16px] text-qtc-copper">
            Your friends picked these categories for you
          </p>

          <GameCard variant="brass" className="mt-10">
            <p className="font-body text-[12px] text-qtc-brass uppercase tracking-wider mb-4 font-semibold">
              New Categories
            </p>
            <div className="space-y-3">
              {round2Categories.map((cat, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 bg-qtc-cream rounded-xl"
                >
                  <span className="font-body text-[16px] text-qtc-holiday-green font-medium">
                    {cat.category}
                  </span>
                  <span className="font-body text-[14px] text-qtc-copper">
                    {cat.player}
                  </span>
                </div>
              ))}
            </div>
          </GameCard>

          <div className="mt-8 flex justify-center">
            <Gear size="md" speed="normal" />
          </div>
        </div>
      </main>
    </SteampunkLayout>
  );
}
