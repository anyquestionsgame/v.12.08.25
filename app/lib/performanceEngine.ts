// PERFORMANCE ENGINE
// Based on Master Game Library

export type PerformanceType = 'charades' | 'drawing' | 'humming';
export type SavageryLevel = 'gentle' | 'standard' | 'brutal';
export type CategoryHint = 
  | '[WORK]' 
  | '[DAILY LIFE]' 
  | '[SOCIAL]' 
  | '[MONEY]' 
  | '[FOOD]' 
  | '[TECH]' 
  | '[FITNESS]'
  | '[2000s HIT]'
  | '[CLASSIC]'
  | '[TV THEME]'
  | '[GUILTY PLEASURE]'
  | '[90s HIT]'
  | '[MOVIE THEME]'
  | '[VIRAL HIT]';

interface PerformancePrompt {
  clue: string;
  category: CategoryHint;
  type: PerformanceType;
  savagery: SavageryLevel;
}

// CHARADES PROMPTS (act it out, no sounds)
const charadePrompts: PerformancePrompt[] = [
  // GENTLE
  { clue: "Trying to look busy when boss walks by", category: '[WORK]', type: 'charades', savagery: 'gentle' },
  { clue: "Walking into spider web", category: '[DAILY LIFE]', type: 'charades', savagery: 'gentle' },
  { clue: "Pretending to wave at someone behind them", category: '[SOCIAL]', type: 'charades', savagery: 'gentle' },
  { clue: "Opening stubborn pickle jar", category: '[FOOD]', type: 'charades', savagery: 'gentle' },
  { clue: "Parallel parking with audience", category: '[DAILY LIFE]', type: 'charades', savagery: 'gentle' },
  { clue: "Wrong USB orientation", category: '[TECH]', type: 'charades', savagery: 'gentle' },
  { clue: "Post-leg-day walk", category: '[FITNESS]', type: 'charades', savagery: 'gentle' },
  
  // STANDARD
  { clue: "Realizing you left edibles in Uber", category: '[DAILY LIFE]', type: 'charades', savagery: 'standard' },
  { clue: "Seeing your credit card statement", category: '[MONEY]', type: 'charades', savagery: 'standard' },
  { clue: "Ending conversation at Trader Joe's", category: '[SOCIAL]', type: 'charades', savagery: 'standard' },
  { clue: "Crying in car outside Trader Joe's", category: '[DAILY LIFE]', type: 'charades', savagery: 'standard' },
  { clue: "Walk of shame from escape room", category: '[SOCIAL]', type: 'charades', savagery: 'standard' },
  { clue: "Face seeing gas prices", category: '[MONEY]', type: 'charades', savagery: 'standard' },
  
  // BRUTAL
  { clue: "Finding out you're lactose intolerant at 30", category: '[FOOD]', type: 'charades', savagery: 'brutal' },
  { clue: "Gender reveal gone wrong", category: '[SOCIAL]', type: 'charades', savagery: 'brutal' },
  { clue: "WiFi cutting out during final", category: '[TECH]', type: 'charades', savagery: 'brutal' },
  { clue: "Accidentally liking your ex's post from 3 years ago", category: '[SOCIAL]', type: 'charades', savagery: 'brutal' }
];

// DRAWING PROMPTS
const drawingPrompts: PerformancePrompt[] = [
  // GENTLE
  { clue: "Spider in shower", category: '[DAILY LIFE]', type: 'drawing', savagery: 'gentle' },
  { clue: "Last pizza slice disappearing", category: '[FOOD]', type: 'drawing', savagery: 'gentle' },
  { clue: "CrossFit person explaining CrossFit", category: '[FITNESS]', type: 'drawing', savagery: 'gentle' },
  { clue: "Cat ignoring expensive toy", category: '[DAILY LIFE]', type: 'drawing', savagery: 'gentle' },
  { clue: "Monday morning face", category: '[WORK]', type: 'drawing', savagery: 'gentle' },
  
  // STANDARD
  { clue: "Millennial taking selfie", category: '[SOCIAL]', type: 'drawing', savagery: 'standard' },
  { clue: "Crying in car outside Trader Joe's", category: '[DAILY LIFE]', type: 'drawing', savagery: 'standard' },
  { clue: "Impulse Amazon purchase regret", category: '[MONEY]', type: 'drawing', savagery: 'standard' },
  
  // BRUTAL
  { clue: "Walk of shame but from an escape room", category: '[SOCIAL]', type: 'drawing', savagery: 'brutal' },
  { clue: "Reading old texts to therapist", category: '[SOCIAL]', type: 'drawing', savagery: 'brutal' }
];

// HUMMING PROMPTS (songs)
const hummingPrompts: PerformancePrompt[] = [
  { clue: "Hey Ya! - OutKast", category: '[2000s HIT]', type: 'humming', savagery: 'gentle' },
  { clue: "Mr. Brightside - The Killers", category: '[2000s HIT]', type: 'humming', savagery: 'gentle' },
  { clue: "Sweet Caroline - Neil Diamond", category: '[CLASSIC]', type: 'humming', savagery: 'gentle' },
  { clue: "The Office theme", category: '[TV THEME]', type: 'humming', savagery: 'gentle' },
  { clue: "Baby Shark", category: '[GUILTY PLEASURE]', type: 'humming', savagery: 'standard' },
  { clue: "Seven Nation Army - White Stripes", category: '[2000s HIT]', type: 'humming', savagery: 'gentle' },
  { clue: "Old Town Road - Lil Nas X", category: '[VIRAL HIT]', type: 'humming', savagery: 'standard' },
  { clue: "Friends theme", category: '[TV THEME]', type: 'humming', savagery: 'gentle' },
  { clue: "September - Earth, Wind & Fire", category: '[CLASSIC]', type: 'humming', savagery: 'gentle' },
  { clue: "Bohemian Rhapsody - Queen", category: '[CLASSIC]', type: 'humming', savagery: 'gentle' },
  { clue: "Take On Me - a-ha", category: '[CLASSIC]', type: 'humming', savagery: 'gentle' },
  { clue: "Toxic - Britney Spears", category: '[2000s HIT]', type: 'humming', savagery: 'gentle' },
  { clue: "Single Ladies - Beyoncé", category: '[2000s HIT]', type: 'humming', savagery: 'gentle' },
  { clue: "Bad Guy - Billie Eilish", category: '[VIRAL HIT]', type: 'humming', savagery: 'standard' }
];

// FILTER by savagery and "rather die than"
export function filterPerformancePrompts(
  prompts: PerformancePrompt[],
  savageryLevel: SavageryLevel,
  ratherDieThan: string[]
): PerformancePrompt[] {
  return prompts.filter(prompt => {
    // Savagery filter
    const savageryMatch = 
      savageryLevel === 'gentle' ? prompt.savagery === 'gentle' :
      savageryLevel === 'standard' ? prompt.savagery !== 'brutal' :
      true; // brutal = all levels
    
    // Content filter
    const contentSafe = !ratherDieThan.some(item =>
      prompt.clue.toLowerCase().includes(item.toLowerCase())
    );
    
    return savageryMatch && contentSafe;
  });
}

// GENERATE prompt for specific type
export function generatePerformancePrompt(
  type: PerformanceType,
  savageryLevel: SavageryLevel,
  ratherDieThan: string[] = [],
  usedPrompts: string[] = []
): PerformancePrompt {
  // Select pool based on type
  let pool: PerformancePrompt[];
  
  switch(type) {
    case 'charades':
      pool = [...charadePrompts];
      break;
    case 'drawing':
      pool = [...drawingPrompts];
      break;
    case 'humming':
      pool = [...hummingPrompts];
      break;
  }
  
  // Filter by savagery and content
  pool = filterPerformancePrompts(pool, savageryLevel, ratherDieThan);
  
  // Remove used prompts
  pool = pool.filter(p => !usedPrompts.includes(p.clue));
  
  // If empty, reset
  if (pool.length === 0) {
    pool = filterPerformancePrompts(
      type === 'charades' ? charadePrompts :
      type === 'drawing' ? drawingPrompts :
      hummingPrompts,
      savageryLevel,
      ratherDieThan
    );
  }
  
  // Random selection
  return pool[Math.floor(Math.random() * pool.length)];
}

// EQUAL DISTRIBUTION: rotate through types
export function getNextPerformanceType(
  roundNumber: number
): PerformanceType {
  const types: PerformanceType[] = ['charades', 'drawing', 'humming'];
  return types[(roundNumber - 1) % 3];
}

// TIMING & SCORING
export interface TimingWindow {
  fast: number;    // 0-10 seconds
  medium: number;  // 11-20 seconds  
  slow: number;    // 21-30 seconds
}

export const CHARADES_TIMING: TimingWindow = {
  fast: 10,
  medium: 20,
  slow: 30
};

export const DRAWING_TIMING: TimingWindow = {
  fast: 15,
  medium: 30,
  slow: 45
};

export const HUMMING_TIMING: TimingWindow = {
  fast: 10,
  medium: 20,
  slow: 30
};

export interface PerformanceScoring {
  fast: number;    // Both performer and guesser get this
  medium: number;
  slow: number;
  fail: number;
}

export const PERFORMANCE_SCORING: PerformanceScoring = {
  fast: 3,
  medium: 2,
  slow: 1,
  fail: 0
};

// ESCAPE HATCH
export const ESCAPE_HATCH_TEXT = 
  "If I don't know this clue, I can pass the card to someone else to read instead. They automatically get 1 point, even if they fail.";

export function calculatePerformanceScore(
  timeInSeconds: number,
  performanceType: PerformanceType,
  success: boolean
): number {
  if (!success) return 0;
  
  const timing = 
    performanceType === 'charades' ? CHARADES_TIMING :
    performanceType === 'drawing' ? DRAWING_TIMING :
    HUMMING_TIMING;
  
  if (timeInSeconds <= timing.fast) return PERFORMANCE_SCORING.fast;
  if (timeInSeconds <= timing.medium) return PERFORMANCE_SCORING.medium;
  if (timeInSeconds <= timing.slow) return PERFORMANCE_SCORING.slow;
  return PERFORMANCE_SCORING.fail;
}

// Get timing for performance type
export function getTimingForType(type: PerformanceType): TimingWindow {
  switch(type) {
    case 'charades': return CHARADES_TIMING;
    case 'drawing': return DRAWING_TIMING;
    case 'humming': return HUMMING_TIMING;
  }
}

// Get type display name
export function getTypeDisplayName(type: PerformanceType): string {
  switch(type) {
    case 'charades': return 'ACT IT OUT';
    case 'drawing': return 'DRAW IT';
    case 'humming': return 'HUM IT';
  }
}

// Get type instructions
export function getTypeInstructions(type: PerformanceType): string {
  switch(type) {
    case 'charades': return 'No sounds! Act it out silently.';
    case 'drawing': return 'No letters or numbers! Draw only.';
    case 'humming': return 'Hum the tune! No words or whistling.';
  }
}

// Export prompt type for external use
export type { PerformancePrompt };

// Export pools for testing
export const promptPools = {
  charades: charadePrompts,
  drawing: drawingPrompts,
  humming: hummingPrompts
};

