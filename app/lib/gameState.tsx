'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface GamePlayer {
  name: string;
  selfCategory: string; // Round 1 category
  peerCategory: string; // Round 2 category
  score: number;
}

export interface AskedQuestion {
  category: string;
  difficulty: number;
  round: 1 | 2;
}

export interface GameState {
  players: GamePlayer[];
  currentPlayerIndex: number;
  currentRound: 1 | 2;
  questionsAsked: AskedQuestion[];
  roundComplete: boolean;
  currentCategory: string | null;
  currentDifficulty: number | null;
  expertStealAttempted: boolean;
  expertName: string | null;
}

export interface ScoreResult {
  originalPlayer: { name: string; points: number };
  expertPlayer?: { name: string; points: number };
}

interface GameStateContextType {
  state: GameState;
  initializeGame: (players: Array<{ name: string; round1Category: string; round2Category: string }>) => void;
  getCurrentPlayer: () => GamePlayer | null;
  getAvailableCategories: () => Array<{ name: string; expert: string; available: boolean }>;
  getAvailablePointValues: (category: string) => number[];
  markQuestionAsked: (category: string, difficulty: number) => void;
  advanceToNextPlayer: () => void;
  isRoundComplete: () => boolean;
  setCurrentCategory: (category: string | null) => void;
  setCurrentDifficulty: (difficulty: number | null) => void;
  setExpertStealAttempted: (attempted: boolean, expertName?: string) => void;
  updateScore: (playerName: string, points: number) => void;
  calculateScore: (winner: 'original' | 'expert' | 'nobody') => ScoreResult;
  resetForRound2: () => void;
  getCategoryExpert: (category: string) => string | null;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    currentRound: 1,
    questionsAsked: [],
    roundComplete: false,
    currentCategory: null,
    currentDifficulty: null,
    expertStealAttempted: false,
    expertName: null,
  });

  const initializeGame = useCallback((players: Array<{ name: string; round1Category: string; round2Category: string }>) => {
    const gamePlayers: GamePlayer[] = players.map(p => ({
      name: p.name,
      selfCategory: p.round1Category,
      peerCategory: p.round2Category,
      score: 0,
    }));

    // Random starting player
    const randomIndex = Math.floor(Math.random() * gamePlayers.length);

    setState({
      players: gamePlayers,
      currentPlayerIndex: randomIndex,
      currentRound: 1,
      questionsAsked: [],
      roundComplete: false,
      currentCategory: null,
      currentDifficulty: null,
      expertStealAttempted: false,
      expertName: null,
    });
  }, []);

  const getCurrentPlayer = useCallback((): GamePlayer | null => {
    if (state.players.length === 0) return null;
    return state.players[state.currentPlayerIndex] || null;
  }, [state.players, state.currentPlayerIndex]);

  const getAvailableCategories = useCallback((): Array<{ name: string; expert: string; available: boolean }> => {
    const round = state.currentRound;
    const categories: Array<{ name: string; expert: string; available: boolean }> = [];

    state.players.forEach(player => {
      const categoryName = round === 1 ? player.selfCategory : player.peerCategory;
      const expert = player.name;
      
      // Count how many questions have been asked for this category in this round
      const askedCount = state.questionsAsked.filter(
        q => q.category === categoryName && q.round === round
      ).length;

      // Category is exhausted if all 4 difficulties (100, 200, 300, 400) have been asked
      const available = askedCount < 4;

      categories.push({
        name: categoryName,
        expert,
        available,
      });
    });

    return categories;
  }, [state.players, state.currentRound, state.questionsAsked]);

  const getAvailablePointValues = useCallback((category: string): number[] => {
    const round = state.currentRound;
    const askedDifficulties = state.questionsAsked
      .filter(q => q.category === category && q.round === round)
      .map(q => q.difficulty);

    const allDifficulties = [100, 200, 300, 400];
    return allDifficulties.filter(d => !askedDifficulties.includes(d));
  }, [state.questionsAsked, state.currentRound]);

  const markQuestionAsked = useCallback((category: string, difficulty: number) => {
    setState(prev => ({
      ...prev,
      questionsAsked: [
        ...prev.questionsAsked,
        { category, difficulty, round: prev.currentRound }
      ],
    }));
  }, []);

  const advanceToNextPlayer = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
      currentCategory: null,
      currentDifficulty: null,
      expertStealAttempted: false,
      expertName: null,
    }));
  }, []);

  const isRoundComplete = useCallback((): boolean => {
    const round = state.currentRound;
    const categories = state.players.map(p => 
      round === 1 ? p.selfCategory : p.peerCategory
    );

    // Check if all categories have all 4 questions asked
    for (const category of categories) {
      const askedCount = state.questionsAsked.filter(
        q => q.category === category && q.round === round
      ).length;
      if (askedCount < 4) {
        return false;
      }
    }

    return true;
  }, [state.players, state.currentRound, state.questionsAsked]);

  const setCurrentCategory = useCallback((category: string | null) => {
    setState(prev => ({ ...prev, currentCategory: category }));
  }, []);

  const setCurrentDifficulty = useCallback((difficulty: number | null) => {
    setState(prev => ({ ...prev, currentDifficulty: difficulty }));
  }, []);

  const setExpertStealAttempted = useCallback((attempted: boolean, expertName?: string) => {
    setState(prev => ({
      ...prev,
      expertStealAttempted: attempted,
      expertName: expertName || null,
    }));
  }, []);

  const updateScore = useCallback((playerName: string, points: number) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.name === playerName ? { ...p, score: p.score + points } : p
      ),
    }));
  }, []);

  const calculateScore = useCallback((winner: 'original' | 'expert' | 'nobody'): ScoreResult => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || !state.currentCategory || !state.currentDifficulty) {
      throw new Error('Invalid game state for scoring');
    }

    const pointValue = state.currentDifficulty;
    const category = state.currentCategory;
    const round = state.currentRound;
    const isOriginalPlayerCategory = 
      (round === 1 && currentPlayer.selfCategory === category) ||
      (round === 2 && currentPlayer.peerCategory === category);

    const expertName = state.expertName;
    const expertStealAttempted = state.expertStealAttempted;

    let originalPlayerPoints = 0;
    let expertPlayerPoints: number | undefined;

    if (winner === 'original') {
      // Original player correct
      originalPlayerPoints = pointValue;
      // If expert attempted steal and original was correct, expert was wrong = full penalty
      if (expertStealAttempted && expertName) {
        expertPlayerPoints = -pointValue; // Full penalty for failed steal
      }
      // If expert didn't attempt steal, they're not in the result (expertPlayerPoints stays undefined)
    } else if (winner === 'expert') {
      // Expert steal success
      if (!expertStealAttempted || !expertName) {
        throw new Error('Expert steal attempted but no expert name');
      }
      originalPlayerPoints = isOriginalPlayerCategory 
        ? -pointValue  // Full penalty for own category
        : -Math.floor(pointValue / 2);  // Half penalty for other category
      expertPlayerPoints = pointValue;  // Full points for successful steal
    } else {
      // Nobody got it right
      originalPlayerPoints = isOriginalPlayerCategory
        ? -pointValue  // Full penalty for own category
        : -Math.floor(pointValue / 2);  // Half penalty for other category
      
      // Expert loses full points if they attempted steal
      if (expertStealAttempted && expertName) {
        expertPlayerPoints = -pointValue;  // Full penalty for failed steal
      }
    }

    const result: ScoreResult = {
      originalPlayer: {
        name: currentPlayer.name,
        points: originalPlayerPoints,
      },
    };

    if (expertPlayerPoints !== undefined && expertName) {
      result.expertPlayer = {
        name: expertName,
        points: expertPlayerPoints,
      };
    }

    return result;
  }, [state, getCurrentPlayer]);

  const resetForRound2 = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentRound: 2,
      questionsAsked: [],
      roundComplete: false,
      currentCategory: null,
      currentDifficulty: null,
      expertStealAttempted: false,
      expertName: null,
      // Random starting player for Round 2
      currentPlayerIndex: Math.floor(Math.random() * prev.players.length),
    }));
  }, []);

  const getCategoryExpert = useCallback((category: string): string | null => {
    const round = state.currentRound;
    const player = state.players.find(p =>
      (round === 1 ? p.selfCategory : p.peerCategory) === category
    );
    return player?.name || null;
  }, [state.players, state.currentRound]);

  return (
    <GameStateContext.Provider
      value={{
        state,
        initializeGame,
        getCurrentPlayer,
        getAvailableCategories,
        getAvailablePointValues,
        markQuestionAsked,
        advanceToNextPlayer,
        isRoundComplete,
        setCurrentCategory,
        setCurrentDifficulty,
        setExpertStealAttempted,
        updateScore,
        calculateScore,
        resetForRound2,
        getCategoryExpert,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}

