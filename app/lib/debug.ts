// Debug utility for QTC app
export function debugSession() {
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem('qtc_game_session');
    const players = localStorage.getItem('qtc_players');
    const savagery = localStorage.getItem('qtc_savagery');
    const location = localStorage.getItem('qtc_location');
    const testingMode = localStorage.getItem('qtc_testing_mode');
    
    console.log('=== QTC DEBUG ===');
    console.log('Session:', session ? JSON.parse(session) : 'none');
    console.log('Players:', players ? JSON.parse(players) : 'none');
    console.log('Savagery:', savagery);
    console.log('Location:', location);
    console.log('Testing Mode:', testingMode);
    console.log('===============');
  }
}

// Clear all QTC data
export function clearAllQTCData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('qtc_game_session');
    localStorage.removeItem('qtc_players');
    localStorage.removeItem('players');
    localStorage.removeItem('playerCount');
    localStorage.removeItem('qtc_savagery');
    localStorage.removeItem('qtc_location');
    localStorage.removeItem('selectedGames');
  }
}

