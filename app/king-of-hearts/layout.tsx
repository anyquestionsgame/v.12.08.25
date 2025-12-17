'use client';

import { GameStateProvider } from '@/app/lib/gameState';

export default function KingOfHeartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GameStateProvider>{children}</GameStateProvider>;
}

