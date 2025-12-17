'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
      // Get players from localStorage
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

  // Auto-advance after showing the screen
  useEffect(() => {
    if (mounted && players.length > 0) {
      const timer = setTimeout(() => {
        // Set round to 2 before navigating
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
      <main className="min-h-screen bg-[#FFF8DC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Get Round 2 categories (peer categories)
  const round2Categories = players.map(p => ({
    category: p.peerCategory,
    player: p.name,
  }));

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
      <div className="w-full max-w-[500px] text-center">
        {/* Title */}
        <p className="font-body text-[14px] text-[#52796F] uppercase tracking-wider">
          Get Ready
        </p>
        <h1 className="mt-2 font-heading text-[56px] font-bold text-[#165B33]">
          ROUND 2
        </h1>
        
        <p className="mt-4 font-heading text-[24px] text-[#C41E3A] font-semibold">
          Things They Won&apos;t Shut Up About
        </p>
        
        <p className="mt-2 font-body text-[16px] text-[#52796F]">
          Your friends picked these categories for you
        </p>

        {/* Category Preview */}
        <div className="mt-10 bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: "0 4px 20px rgba(196,30,58,0.1)" }}>
          <p className="font-body text-[12px] text-[#D4AF37] uppercase tracking-wider mb-4 font-semibold">
            New Categories
          </p>
          <div className="space-y-3">
            {round2Categories.map((cat, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center p-3 bg-[#FFF8DC] rounded-xl"
              >
                <span className="font-body text-[16px] text-[#165B33] font-medium">
                  {cat.category}
                </span>
                <span className="font-body text-[14px] text-[#52796F]">
                  {cat.player}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        <div className="mt-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </main>
  );
}
