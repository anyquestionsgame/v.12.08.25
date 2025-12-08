// COME THRU ENGINE (Phone a Friend)
// Based on Master Game Library

export type SavageryLevel = 'gentle' | 'standard' | 'brutal';

interface ComeThruPrompt {
  scenario: string;
  savagery: SavageryLevel;
}

// GENTLE SCENARIOS
const gentleScenarios: ComeThruPrompt[] = [
  { scenario: "Locked out wearing only a bathrobe and Crocs", savagery: 'gentle' },
  { scenario: "Had to return $300 of drunk Target purchases", savagery: 'gentle' },
  { scenario: "Needed an alibi for calling in sick to see Beyoncé", savagery: 'gentle' },
  { scenario: "Had to parallel park a U-Haul in downtown", savagery: 'gentle' },
  { scenario: "Needed someone to kill a tarantula in their shower", savagery: 'gentle' },
  { scenario: "Needed a one-liner to flirt with a librarian", savagery: 'gentle' },
  { scenario: "Had to get their wedding ring out of a garbage disposal", savagery: 'gentle' },
  { scenario: "Needed someone to pretend to be their therapist's reference", savagery: 'gentle' },
  { scenario: "Had to retrieve their drone from their neighbor's pool", savagery: 'gentle' },
  { scenario: "Needed help writing a Yelp review that destroys someone", savagery: 'gentle' },
  { scenario: "Woke up in a corn maze with no memory of how they got there", savagery: 'gentle' },
  { scenario: "Their Airbnb was a catfish and they need immediate rescue", savagery: 'gentle' }
];

// STANDARD SCENARIOS
const standardScenarios: ComeThruPrompt[] = [
  { scenario: "Had to hide $5000 in OnlyFans income from their accountant", savagery: 'standard' },
  { scenario: "Woke up with a stolen traffic cone in their bedroom", savagery: 'standard' },
  { scenario: "Needed to bury a cursed skull according to specific instructions", savagery: 'standard' },
  { scenario: "Needed extraction from a pyramid scheme party", savagery: 'standard' },
  { scenario: "Accidentally sent their therapist a thirst trap", savagery: 'standard' },
  { scenario: "Had to forge a doctor's note for 'explosive diarrhea'", savagery: 'standard' },
  { scenario: "Needed a counterfeit handicap placard", savagery: 'standard' },
  { scenario: "Had to steal back their diary from their mom's house", savagery: 'standard' },
  { scenario: "Needed someone to bid against them on their own eBay item", savagery: 'standard' },
  { scenario: "Had to sneak an emotional support peacock onto a plane", savagery: 'standard' },
  { scenario: "Got catfished and needs backup for confrontation", savagery: 'standard' },
  { scenario: "Their ex is at the same party and they need an excuse to leave", savagery: 'standard' }
];

// BRUTAL SCENARIOS
const brutalScenarios: ComeThruPrompt[] = [
  { scenario: "Needed to take out a hit on someone via the dark web", savagery: 'brutal' },
  { scenario: "Needed emergency pickup from a failed threesome", savagery: 'brutal' },
  { scenario: "Needed someone to pose as their AA sponsor for court", savagery: 'brutal' },
  { scenario: "Had to blackmail a politician", savagery: 'brutal' },
  { scenario: "Needed help faking their own death for insurance money", savagery: 'brutal' },
  { scenario: "Needed someone to claim the drugs the cops found were theirs", savagery: 'brutal' },
  { scenario: "Had to dispose of a sex doll before parents visit", savagery: 'brutal' },
  { scenario: "Needed help poisoning their HOA president", savagery: 'brutal' },
  { scenario: "Got arrested at a furry convention and needs bail", savagery: 'brutal' },
  { scenario: "Accidentally joined a sex cult and needs deprogramming", savagery: 'brutal' }
];

// FILTER by savagery and "rather die than"
export function filterComeThruScenarios(
  scenarios: ComeThruPrompt[],
  savageryLevel: SavageryLevel,
  allRatherDieThan: string[]
): ComeThruPrompt[] {
  // Get appropriate pool based on savagery
  let pool: ComeThruPrompt[];
  
  switch(savageryLevel) {
    case 'gentle':
      pool = scenarios.filter(s => s.savagery === 'gentle');
      break;
    case 'standard':
      pool = scenarios.filter(s => s.savagery !== 'brutal');
      break;
    case 'brutal':
      pool = [...scenarios];
      break;
  }
  
  // Content filter
  return pool.filter(scenario => {
    return !allRatherDieThan.some(item =>
      scenario.scenario.toLowerCase().includes(item.toLowerCase())
    );
  });
}

// Get all scenarios based on savagery
function getAllScenarios(savageryLevel: SavageryLevel): ComeThruPrompt[] {
  switch(savageryLevel) {
    case 'gentle':
      return [...gentleScenarios];
    case 'standard':
      return [...gentleScenarios, ...standardScenarios];
    case 'brutal':
      return [...gentleScenarios, ...standardScenarios, ...brutalScenarios];
  }
}

// GENERATE scenario for specific player
export function generateComeThruScenario(
  playerName: string,
  savageryLevel: SavageryLevel,
  allRatherDieThan: string[] = [],
  usedScenarios: string[] = []
): string {
  // Get appropriate pool
  let pool = getAllScenarios(savageryLevel);
  
  // Filter by content
  pool = filterComeThruScenarios(pool, savageryLevel, allRatherDieThan);
  
  // Remove used (case-insensitive comparison to handle formatted vs raw scenarios)
  const usedScenariosLower = usedScenarios.map(s => s.toLowerCase());
  pool = pool.filter(p => !usedScenariosLower.includes(p.scenario.toLowerCase()));
  
  // Reset if empty
  if (pool.length === 0) {
    pool = filterComeThruScenarios(
      getAllScenarios(savageryLevel),
      savageryLevel,
      allRatherDieThan
    );
  }
  
  // Random selection
  const scenario = pool[Math.floor(Math.random() * pool.length)];
  
  // Format with player name
  return `Who would ${playerName} call if they ${scenario.scenario.toLowerCase()}?`;
}

// SCORING SYSTEM
export interface ComeThruScoring {
  correctPrediction: number;  // Guessed who they'd call: 2 points
  chosenPerson: number;       // You're the one called: 1 point
  wrongGuess: number;         // Subject gets 1 point per wrong guess
}

export const COME_THRU_SCORING: ComeThruScoring = {
  correctPrediction: 2,
  chosenPerson: 1,
  wrongGuess: 1
};

// GAME CARD
export interface ComeThruCard {
  subject: string;
  scenario: string;
  otherPlayers: string[];
}

export function generateComeThruCard(
  players: Array<{name: string, ratherDieThan: string}>,
  roundNumber: number,
  savageryLevel: SavageryLevel,
  usedScenarios: string[] = []
): ComeThruCard {
  // Rotate who's the subject
  const subjectIndex = (roundNumber - 1) % players.length;
  const subject = players[subjectIndex];
  
  // Everyone else predicts
  const otherPlayers = players
    .filter(p => p.name !== subject.name)
    .map(p => p.name);
  
  // Generate scenario
  const allRatherDieThan = players.map(p => p.ratherDieThan).filter(Boolean);
  const scenario = generateComeThruScenario(
    subject.name,
    savageryLevel,
    allRatherDieThan,
    usedScenarios
  );
  
  return {
    subject: subject.name,
    scenario,
    otherPlayers
  };
}

// RESULT CALCULATION
export interface ComeThruResult {
  predictions: Record<string, string>; // predictor -> predicted person
  actualChoice: string;
  correctPredictors: string[];
  points: Record<string, number>;
}

export function calculateComeThruResults(
  predictions: Record<string, string>,
  actualChoice: string,
  subjectName: string
): ComeThruResult {
  const correctPredictors = Object.entries(predictions)
    .filter(([, predicted]) => predicted === actualChoice)
    .map(([predictor]) => predictor);
  
  const wrongCount = Object.keys(predictions).length - correctPredictors.length;
  
  const points: Record<string, number> = {};
  
  // Correct predictors get 2 points
  correctPredictors.forEach(predictor => {
    points[predictor] = COME_THRU_SCORING.correctPrediction;
  });
  
  // Chosen person gets 1 point
  if (actualChoice !== subjectName) {
    points[actualChoice] = (points[actualChoice] || 0) + COME_THRU_SCORING.chosenPerson;
  }
  
  // Subject gets 1 point per wrong guess
  points[subjectName] = wrongCount * COME_THRU_SCORING.wrongGuess;
  
  return {
    predictions,
    actualChoice,
    correctPredictors,
    points
  };
}

// Extract raw scenario from formatted string (for tracking used scenarios)
export function extractScenarioFromPrompt(prompt: string): string {
  // "Who would X call if they scenario?" -> "scenario"
  const match = prompt.match(/if they (.+)\?$/i);
  return match ? match[1] : prompt;
}

// Export scenario pools for testing
export const scenarioPools = {
  gentle: gentleScenarios,
  standard: standardScenarios,
  brutal: brutalScenarios
};

