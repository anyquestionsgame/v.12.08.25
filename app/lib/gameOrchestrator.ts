// GAME ORCHESTRATOR
// Manages multi-game sessions with cross-game scoring

export type GameType = 
  | 'thatsSoYou' 
  | 'mostLikelyTo' 
  | 'trivia' 
  | 'performance' 
  | 'comeThru';

export interface Player {
  name: string;
  expertise: string;
  ratherDieThan: string;
  totalScore: number;
}

export interface GameSession {
  players: Player[];
  selectedGames: GameType[];
  currentGameIndex: number;
  location?: string;
  savageryLevel: 'gentle' | 'standard' | 'brutal';
  gameScores: Record<GameType, Record<string, number>>; // game -> player -> score
}

// INITIALIZE SESSION
export function createGameSession(
  players: Array<{name: string, expertise: string, ratherDieThan: string}>,
  selectedGames: GameType[],
  savageryLevel: 'gentle' | 'standard' | 'brutal' = 'standard',
  location?: string
): GameSession {
  // Validate inputs
  if (!players || players.length === 0) {
    throw new Error('Cannot create session: no players provided');
  }
  if (!selectedGames || selectedGames.length === 0) {
    throw new Error('Cannot create session: no games selected');
  }
  
  // Ensure all players have required fields
  const validatedPlayers = players.map(p => ({
    name: p.name || 'Unknown',
    expertise: p.expertise || 'General Knowledge',
    ratherDieThan: p.ratherDieThan || '',
    totalScore: 0
  }));
  
  return {
    players: validatedPlayers,
    selectedGames,
    currentGameIndex: 0,
    location,
    savageryLevel,
    gameScores: {} as Record<GameType, Record<string, number>>
  };
}

// GET CURRENT GAME
export function getCurrentGame(session: GameSession): GameType | null {
  if (session.currentGameIndex >= session.selectedGames.length) {
    return null; // All games complete
  }
  return session.selectedGames[session.currentGameIndex];
}

// ADVANCE TO NEXT GAME
export function advanceToNextGame(session: GameSession): GameSession {
  return {
    ...session,
    currentGameIndex: session.currentGameIndex + 1
  };
}

// UPDATE SCORES AFTER A GAME
export function updateGameScores(
  session: GameSession,
  gameType: GameType,
  playerScores: Record<string, number> // player name -> points earned this game
): GameSession {
  if (!playerScores || Object.keys(playerScores).length === 0) {
    console.warn('No scores provided for game:', gameType);
    return session;
  }
  
  // Update game-specific scores
  const updatedGameScores = {
    ...session.gameScores,
    [gameType]: playerScores
  };
  
  // Update total scores
  const updatedPlayers = session.players.map(player => {
    const gameScore = playerScores[player.name] || 0;
    return {
      ...player,
      totalScore: player.totalScore + gameScore
    };
  });
  
  return {
    ...session,
    players: updatedPlayers,
    gameScores: updatedGameScores
  };
}

// GET SCOREBOARD (sorted by total score)
export function getScoreboard(session: GameSession): Player[] {
  return [...session.players].sort((a, b) => b.totalScore - a.totalScore);
}

// GET WINNER(S)
export function getWinners(session: GameSession): Player[] {
  const scoreboard = getScoreboard(session);
  if (scoreboard.length === 0) return [];
  
  const topScore = scoreboard[0].totalScore;
  return scoreboard.filter(p => p.totalScore === topScore);
}

// PROGRESS TRACKING
export function getProgress(session: GameSession): {
  current: number;
  total: number;
  percentage: number;
} {
  const current = session.currentGameIndex;
  const total = session.selectedGames.length;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return { current, total, percentage };
}

// GAME DISPLAY NAMES
export const GAME_NAMES: Record<GameType, string> = {
  thatsSoYou: "THAT'S SO YOU",
  mostLikelyTo: "MOST LIKELY TO",
  trivia: "TRIVIA",
  performance: "NO PRESSURE",
  comeThru: "COME THRU"
};

// GAME ROUTES
export const GAME_ROUTES: Record<GameType, string> = {
  thatsSoYou: '/play',
  mostLikelyTo: '/play/most-likely-to',
  trivia: '/play/trivia',
  performance: '/play/performance',
  comeThru: '/play/come-thru'
};

// GAME IDS (for mapping from selection)
export const GAME_ID_MAP: Record<string, GameType> = {
  'thats-so-you': 'thatsSoYou',
  'most-likely-to': 'mostLikelyTo',
  'trivia': 'trivia',
  'no-pressure': 'performance',
  'come-thru': 'comeThru'
};

// IS SESSION COMPLETE?
export function isSessionComplete(session: GameSession): boolean {
  return session.currentGameIndex >= session.selectedGames.length;
}

// STORAGE HELPERS (localStorage)
const SESSION_KEY = 'qtc_game_session';

export function saveSession(session: GameSession): void {
  if (typeof window === 'undefined') {
    console.warn('Cannot save session: window is undefined');
    return;
  }
  
  try {
    if (!localStorage) {
      console.warn('localStorage is not available');
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

export function loadSession(): GameSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    if (!localStorage) {
      console.warn('localStorage is not available');
      return null;
    }
    
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate session structure
      if (parsed && parsed.players && Array.isArray(parsed.players) && parsed.selectedGames && Array.isArray(parsed.selectedGames)) {
        return parsed;
      } else {
        console.error('Invalid session structure');
        return null;
      }
    }
  } catch (error) {
    console.error('Error loading session:', error);
  }
  
  return null;
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

// Get next game route
export function getNextGameRoute(session: GameSession): string | null {
  const currentGame = getCurrentGame(session);
  if (!currentGame) return null;
  return GAME_ROUTES[currentGame];
}

// Get game name by type
export function getGameName(gameType: GameType): string {
  return GAME_NAMES[gameType];
}

