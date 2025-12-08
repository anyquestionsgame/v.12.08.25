// ESSENCE PROMPT LIBRARY
// Based on Master Game Library - organized by savagery level

export type SavageryLevel = 'gentle' | 'standard' | 'brutal';

interface EssencePrompt {
  category: string;
  savagery: SavageryLevel;
}

// GENTLE PROMPTS (appropriate for all groups)
const gentlePrompts: string[] = [
  "Netflix category",
  "Trader Joe's product",
  "IKEA furniture name",
  "LinkedIn headline",
  "Candle scent at HomeGoods",
  "Spotify Daylist title",
  "Trader Joe's seasonal item",
  "Bath & Body Works soap name",
  "Paint color at Home Depot",
  "Craft beer name",
  "Food truck concept",
  "Terrible superpower",
  "Infomercial product",
  "Weather phenomenon",
  "Wordle opening word",
  "Peloton leaderboard name",
  "Amazon 'Customers also bought' suggestion",
  "Costco sample",
  "Fortune cookie message"
];

// STANDARD PROMPTS (mild roasting)
const standardPrompts: string[] = [
  "Grocery store aisle",
  "Pizza topping",
  "Traffic light",
  "Bathroom graffiti",
  "Car bumper sticker",
  "Yard sale sign",
  "Hotel continental breakfast item",
  "Rejected Ben & Jerry's flavor",
  "Gas station snack",
  "DMV wait time",
  "Apartment listing lie",
  "Wedding dance move",
  "Elevator button",
  "Parking spot",
  "Gym January stereotype",
  "Restaurant bathroom sign",
  "Uber rating",
  "Prescription side effect",
  "Drunk Amazon purchase"
];

// BRUTAL PROMPTS (edgy, for close friends)
const brutalPrompts: string[] = [
  "FBI surveillance code name",
  "Prescription drug side effect",
  "Breakup text",
  "Family reunion role",
  "High school superlative",
  "Dating app warning label",
  "Obituary headline",
  "Intervention topic",
  "Garage sale price tag",
  "Bathroom stall graffiti",
  "Disease you'd be patient zero for",
  "FBI surveillance file title",
  "Gaslight tactic",
  "Conspiracy theory",
  "Reason you'd be fired"
];

// FILTER: Remove prompts based on "rather die than" responses
export function filterPrompts(
  prompts: string[],
  ratherDieThan: string[]
): string[] {
  return prompts.filter(prompt => {
    const lowerPrompt = prompt.toLowerCase();
    return !ratherDieThan.some(item => 
      lowerPrompt.includes(item.toLowerCase())
    );
  });
}

// GENERATE: Select a random prompt based on savagery level
export function generateEssencePrompt(
  playerName: string,
  savageryLevel: SavageryLevel,
  ratherDieThan: string[] = [],
  usedPrompts: string[] = []
): { prompt: string; category: string } {
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
  
  // Filter out "rather die than" topics
  promptPool = filterPrompts(promptPool, ratherDieThan);
  
  // Filter out already used prompts
  promptPool = promptPool.filter(p => !usedPrompts.includes(p));
  
  // If we've used everything, reset but keep filters
  if (promptPool.length === 0) {
    promptPool = filterPrompts(
      savageryLevel === 'gentle' ? gentlePrompts :
      savageryLevel === 'standard' ? [...gentlePrompts, ...standardPrompts] :
      [...gentlePrompts, ...standardPrompts, ...brutalPrompts],
      ratherDieThan
    );
  }
  
  // Random selection
  const randomCategory = promptPool[Math.floor(Math.random() * promptPool.length)];
  
  // Format as full prompt
  return {
    prompt: `If ${playerName} were a ${randomCategory.toLowerCase()}...`,
    category: randomCategory
  };
}

// SCORING SYSTEM
export interface EssenceScore {
  subject: number;  // Person being described gets 2 points
  author: number;   // Author of chosen answer gets 2 points
}

export const ESSENCE_SCORING: EssenceScore = {
  subject: 2,
  author: 2
};

// Export prompt pools for testing/debugging
export const promptPools = {
  gentle: gentlePrompts,
  standard: standardPrompts,
  brutal: brutalPrompts
};

