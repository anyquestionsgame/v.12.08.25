// MOST LIKELY TO PROMPT LIBRARY
// Based on Master Game Library - organized by savagery level

export type SavageryLevel = 'gentle' | 'standard' | 'brutal';

// GENTLE PROMPTS (appropriate for all groups)
const gentlePrompts: string[] = [
  "Start a podcast and abandon it after 3 episodes",
  "Get way too competitive during a game of Uno",
  "Order DoorDash from literally across the street",
  "Bring a spreadsheet to game night",
  "Start composting then quit when it gets gross",
  "Buy a Peloton and use it as a clothing rack",
  "Start every story with 'I saw this thing on Reddit'",
  "Join CrossFit and never shut up about it",
  "Get emotionally attached to a Roomba",
  "Cry at a commercial about insurance",
  "Have a secret plant graveyard",
  "Own 14 different water bottles",
  "Still use MySpace unironically",
  "Get into a one-sided argument with a self-checkout machine",
  "Impulse buy a disco ball",
  "Name their car",
  "Treat their air fryer like a personality trait",
  "Have strong opinions about fonts",
  "Get unreasonably excited about office supplies"
];

// STANDARD PROMPTS (mild roasting)
const standardPrompts: string[] = [
  "Get kicked out of an escape room for taking it too seriously",
  "Cry during the Pixar logo before the movie even starts",
  "Become a pickleball person overnight and make it their whole personality",
  "Venmo request $3.50 for gas",
  "Get banned from NextDoor for being too involved",
  "Create a 47-slide PowerPoint for a casual hangout",
  "Get too drunk at Top Golf and asked to leave",
  "Cry in a Trader Joe's parking lot",
  "Get really into birding during a midlife crisis",
  "Have a secret second family in The Sims",
  "Start a fight at a PTA meeting",
  "Get catfished by someone pretending to be less attractive",
  "Send 'u up?' texts at 3am",
  "Fight a goose and lose",
  "Fake their own death to get out of plans",
  "Get their foot stuck in a toilet",
  "Believe a conspiracy theory for exactly 3 days",
  "Accidentally join a cult",
  "Get emotional at a Costco sample station"
];

// BRUTAL PROMPTS (edgy, for close friends)
const brutalPrompts: string[] = [
  "Text 'u up?' to their therapist",
  "Get caught using ChatGPT to write their wedding vows",
  "Join an MLM and not realize it's an MLM",
  "Fail the citizenship test of their own country",
  "Have a secret TikTok with 50K followers about something weird",
  "Get divorced over a board game",
  "Die taking a selfie",
  "Get fired for their Twitter likes",
  "Marry someone they met in a Facebook comments section",
  "Peak in middle school",
  "Fake a work emergency to avoid a birthday party",
  "Get banned from a buffet for 'crossing a line'",
  "Catfish someone using their pet's photos",
  "Start a YouTube channel that gets them on a watchlist",
  "Have their browser history leaked and it ends a friendship",
  "Get into a physical fight over a parking spot",
  "Become a local news story for the wrong reasons"
];

// FILTER: Remove prompts based on "rather die than" responses
export function filterPrompts(
  prompts: string[],
  allRatherDieThan: string[]
): string[] {
  return prompts.filter(prompt => {
    const lowerPrompt = prompt.toLowerCase();
    return !allRatherDieThan.some(item => 
      lowerPrompt.includes(item.toLowerCase())
    );
  });
}

// GENERATE: Select a random prompt based on savagery level
export function generateMostLikelyToPrompt(
  savageryLevel: SavageryLevel,
  allRatherDieThan: string[] = [],
  usedPrompts: string[] = []
): string {
  // Select prompt pool based on savagery
  let promptPool: string[];
  
  switch(savageryLevel) {
    case 'gentle':
      promptPool = [...gentlePrompts];
      break;
    case 'standard':
      promptPool = [...gentlePrompts, ...standardPrompts];
      break;
    case 'brutal':
      promptPool = [...gentlePrompts, ...standardPrompts, ...brutalPrompts];
      break;
  }
  
  // Filter out "rather die than" topics from ALL players
  promptPool = filterPrompts(promptPool, allRatherDieThan);
  
  // Filter out already used prompts
  promptPool = promptPool.filter(p => !usedPrompts.includes(p));
  
  // If we've used everything, reset but keep filters
  if (promptPool.length === 0) {
    promptPool = filterPrompts(
      savageryLevel === 'gentle' ? gentlePrompts :
      savageryLevel === 'standard' ? [...gentlePrompts, ...standardPrompts] :
      [...gentlePrompts, ...standardPrompts, ...brutalPrompts],
      allRatherDieThan
    );
  }
  
  // Random selection
  const randomPrompt = promptPool[Math.floor(Math.random() * promptPool.length)];
  
  // Format as full prompt
  return `Who IN THIS ROOM is most likely to ${randomPrompt}?`;
}

// SCORING SYSTEM
export interface MostLikelyToScore {
  readerGuessedCorrect: number;  // Reader predicted winner: 2 points
  mostVotes: number;              // Person with most votes: 1 point
  tie: number;                    // Each person in tie: 1 point
}

export const MOST_LIKELY_TO_SCORING: MostLikelyToScore = {
  readerGuessedCorrect: 2,
  mostVotes: 1,
  tie: 1
};

// GAME MECHANICS
export interface VoteResult {
  playerName: string;
  votes: number;
}

export function calculateMostLikelyToWinner(
  votes: Record<string, string> // voter -> votedFor
): VoteResult[] {
  const voteCounts: Record<string, number> = {};
  
  Object.values(votes).forEach(votedFor => {
    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
  });
  
  return Object.entries(voteCounts)
    .map(([playerName, votes]) => ({ playerName, votes }))
    .sort((a, b) => b.votes - a.votes);
}

// Export prompt pools for testing/debugging
export const promptPools = {
  gentle: gentlePrompts,
  standard: standardPrompts,
  brutal: brutalPrompts
};

