// SESSION VALIDATION UTILITY
// Validates game sessions and provides clear error messages

import { GameSession, loadSession, Player } from '@/app/lib/gameOrchestrator';

export type ValidationResult = 
  | { valid: true; session: GameSession }
  | { valid: false; error: 'no_session' | 'invalid_session' | 'missing_players' | 'no_games' | 'corrupted_data'; message: string };

export function validateSession(): ValidationResult {
  // Check if we're in browser
  if (typeof window === 'undefined') {
    return {
      valid: false,
      error: 'no_session',
      message: 'Session validation not available on server'
    };
  }

  // Try to load session
  const session = loadSession();
  
  if (!session) {
    return {
      valid: false,
      error: 'no_session',
      message: 'No game session found. Please start a new game.'
    };
  }

  // Validate session structure
  if (!session.players || !Array.isArray(session.players)) {
    return {
      valid: false,
      error: 'invalid_session',
      message: 'Session data is invalid. Please start a new game.'
    };
  }

  // Check players exist and are valid
  if (session.players.length === 0) {
    return {
      valid: false,
      error: 'missing_players',
      message: 'No players found in session. Please set up your game.'
    };
  }

  // Validate each player has required fields
  const invalidPlayers = session.players.filter(p => !p.name || p.name.trim() === '');
  if (invalidPlayers.length > 0) {
    return {
      valid: false,
      error: 'corrupted_data',
      message: 'Some player data is missing. Please start a new game.'
    };
  }

  // Check games are selected
  if (!session.selectedGames || !Array.isArray(session.selectedGames) || session.selectedGames.length === 0) {
    return {
      valid: false,
      error: 'no_games',
      message: 'No games selected. Please choose games to play.'
    };
  }

  // Session is valid
  return {
    valid: true,
    session
  };
}

export function validatePlayersExist(): { valid: boolean; players: Player[] | null; error?: string } {
  if (typeof window === 'undefined') {
    return { valid: false, players: null, error: 'Not available on server' };
  }

  try {
    const storedPlayers = localStorage.getItem('players') || localStorage.getItem('qtc_players');
    if (!storedPlayers) {
      return { valid: false, players: null, error: 'No players found' };
    }

    const playerData = JSON.parse(storedPlayers);
    if (!Array.isArray(playerData) || playerData.length === 0) {
      return { valid: false, players: null, error: 'Invalid player data' };
    }

    // Format players
    const formattedPlayers: Player[] = playerData.map((p: any) => ({
      name: p.name || 'Unknown',
      expertise: p.goodAt || p.expertise || 'General Knowledge',
      ratherDieThan: p.ratherDie || p.ratherDieThan || '',
      totalScore: 0
    }));

    return { valid: true, players: formattedPlayers };
  } catch (error) {
    return { valid: false, players: null, error: 'Failed to parse player data' };
  }
}

export function getRecoveryPath(error: ValidationResult['error']): string {
  switch (error) {
    case 'no_session':
    case 'invalid_session':
    case 'corrupted_data':
      return '/setup';
    case 'missing_players':
      return '/onboarding';
    case 'no_games':
      return '/games';
    default:
      return '/';
  }
}

