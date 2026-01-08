import Anthropic from '@anthropic-ai/sdk';

// ═══════════════════════════════════════════════════════════
// TYPESCRIPT TYPES
// ═══════════════════════════════════════════════════════════

export interface TriviaQuestion {
  originalCategory: string;  // The actual topic (e.g., "Wine") - used for question generation
  displayCategory: string;   // The fun name shown to players (e.g., "Pretentious Restaurant Moments")
  difficulty: number;        // Point value: 100-500 depending on round
  questionText: string;
  rangeText: string;         // ANY QUESTIONS voice - personality/flavor text
  answer: {
    display: string;
    acceptable: string[];
  };
  round?: 1 | 2 | 3;        // Which round this question is for
}

// ═══════════════════════════════════════════════════════════
// ROUND CONFIGURATION
// ═══════════════════════════════════════════════════════════

export interface RoundConfig {
  questionCount: number;
  difficulties: number[];
  difficultyDescriptions: Record<number, string>;
}

// Get round configuration based on player count
export function getRoundConfig(playerCount: number, round: 1 | 2 | 3): RoundConfig {
  if (round === 3) {
    // Final Round: Single question for all players
    return {
      questionCount: 1,
      difficulties: [350], // Medium-hard difficulty
      difficultyDescriptions: {
        350: "7/10 difficulty - challenging but fair for everyone"
      }
    };
  }
  
  if (round === 2) {
    // Round 2: Peer-selected categories
    if (playerCount >= 7) {
      return {
        questionCount: 1,
        difficulties: [500],
        difficultyDescriptions: {
          500: "7/10 difficulty - solid medium, not expert-level"
        }
      };
    } else {
      return {
        questionCount: 2,
        difficulties: [250, 500],
        difficultyDescriptions: {
          250: "3/10 difficulty - slightly easier than Round 1 medium",
          500: "7/10 difficulty - solid medium, not expert-level"
        }
      };
    }
  }
  
  // Round 1: Self-selected expertise
  if (playerCount >= 5) {
    return {
      questionCount: 2,
      difficulties: [200, 300],
      difficultyDescriptions: {
        200: "5/10 difficulty - casual familiarity",
        300: "10/10 difficulty - dedicated enthusiast, deep cut"
      }
    };
  } else {
    return {
      questionCount: 3,
      difficulties: [100, 200, 300],
      difficultyDescriptions: {
        100: "2/10 difficulty - Google-able in 10 seconds",
        200: "5/10 difficulty - casual familiarity",
        300: "10/10 difficulty - dedicated enthusiast, deep cut"
      }
    };
  }
}

// Cache for adjacent category names
const adjacentNameCache = new Map<string, string>();

// ═══════════════════════════════════════════════════════════
// ANTHROPIC CLIENT INITIALIZATION (LAZY)
// ═══════════════════════════════════════════════════════════

// Lazy initialization to avoid build-time errors
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// ═══════════════════════════════════════════════════════════
// IN-MEMORY CACHE
// ═══════════════════════════════════════════════════════════

const questionCache = new Map<string, TriviaQuestion[]>();

// ═══════════════════════════════════════════════════════════
// GENERATE ADJACENT CATEGORY NAME
// ═══════════════════════════════════════════════════════════

export async function generateAdjacentCategoryName(
  category: string,
  howKnow: string = ''
): Promise<string> {
  // Check cache first (include howKnow since it affects the name)
  const cacheKey = `${category.toLowerCase()}-${howKnow.toLowerCase()}`;
  if (adjacentNameCache.has(cacheKey)) {
    console.log(`[AI Engine] Adjacent name cache hit for: ${category}`);
    return adjacentNameCache.get(cacheKey)!;
  }

  console.log(`[AI Engine] Generating adjacent category name for: ${category}${howKnow ? ` [context: ${howKnow}]` : ''}`);

  try {
    // Build context for personal projects
    const personalProjectContext = howKnow ? `
═══════════════════════════════════════════════════════════
EXPERTISE CONTEXT
═══════════════════════════════════════════════════════════

The player knows about "${category}" because: "${howKnow}"

CRITICAL: If howKnow suggests they CREATED this (made it, wrote it, built it, my show, my project):
- Generate a category name for the GENERAL GENRE/TOPIC, not their specific creation
- Example: "Slam Frank" + "I wrote this musical" → "Off-Broadway Musicals" or "Musical Theater"
- NEVER use the specific project name in the category

If they're a FAN or CONSUMER: Use the topic itself for the category name.
` : '';

    const systemPrompt = `You generate fun but CLEAR category names for trivia.

═══════════════════════════════════════════════════════════
CRITICAL REQUIREMENTS
═══════════════════════════════════════════════════════════

1. IMMEDIATELY RECOGNIZABLE - Players should instantly know what topic this relates to
2. SLIGHTLY PLAYFUL - Add a fun angle, but keep it obvious
3. NO OBSCURE REFERENCES - Don't require cultural knowledge to understand
4. SIMPLE LANGUAGE - Use common words everyone knows
5. 2-4 words maximum
${personalProjectContext}
═══════════════════════════════════════════════════════════
GOOD EXAMPLES (Clear + Fun)
═══════════════════════════════════════════════════════════

- Italian cooking → "Pasta Night Debates"
- Wine → "Wine Snob Territory"
- Trucks → "Pickup Truck Culture"
- Pottery → "Clay & Kiln Basics"
- Excel → "Spreadsheet Wizardry"
- Coffee → "Coffee Order Science"
- Dogs → "Dog Park Expertise"
- Cooking → "Home Chef Secrets"
- History → "History Buff Trivia"
- Music → "Music Nerd Knowledge"
- Reality TV → "Reality TV Deep Cuts"
- Taylor Swift → "Swiftie Knowledge"
- Cats → "Cat Owner Facts"
- Sports → "Sports Stats Corner"
- Movies → "Movie Buff Trivia"
- Trader Joe's → "Grocery Store Favorites"
- "My screenplay" (I wrote it) → "Screenwriting Basics"
- "Slam Frank" (I made this musical) → "Musical Theater"

═══════════════════════════════════════════════════════════
BAD EXAMPLES (Too Obscure - NEVER DO THIS)
═══════════════════════════════════════════════════════════

❌ "Nonna's Kitchen Wars" - Who is nonna? Too clever
❌ "Terroir Tears" - Way too poetic/vague
❌ "Dually Duels" - Too niche, requires truck knowledge
❌ "Bisque Mysteries" - Obscure pottery term
❌ "Office Space Meltdowns" - Movie reference not everyone gets
❌ "3AM Zoomies Psychology" - Too quirky
❌ "Ghost Movie References" - Obscure film reference
❌ "Aux Cord Pressure Moments" - Too abstract
❌ Using a personal project name that no one else knows

═══════════════════════════════════════════════════════════
THE TEST
═══════════════════════════════════════════════════════════

Ask: "Would someone with ZERO knowledge of this topic understand this category name?"
If NO → it's too obscure, try again
If YES → good!

The category name should make players think "oh yeah, that makes sense" NOT "what does that mean?"
Keep it simple. Keep it clear. Make it slightly fun.`;

    const userPrompt = `Generate ONE adjacent category name for: "${category}"${howKnow ? `\nContext: They know this because "${howKnow}"` : ''}
Return ONLY the category name, nothing else. No quotes, no explanation.`;

    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    // Extract text from Claude's response
    const textBlock = response.content.find(block => block.type === 'text');
    const adjacentName = (textBlock && textBlock.type === 'text' ? textBlock.text : category).trim();
    
    // Clean up any quotes that might have been included
    const cleanName = adjacentName.replace(/^["']|["']$/g, '').trim();
    
    // Cache the result (with howKnow context)
    adjacentNameCache.set(cacheKey, cleanName);
    console.log(`[AI Engine] Adjacent name for "${category}": "${cleanName}"`);
    
    return cleanName;

  } catch (error) {
    console.error(`[AI Engine] Failed to generate adjacent name for "${category}":`, error);
    // Fallback to original category name
    return category;
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN FUNCTION: GENERATE QUESTIONS
// ═══════════════════════════════════════════════════════════

export async function generateQuestions(
  category: string,
  playerName: string,
  expertName: string,
  round: 1 | 2 | 3 = 1,
  playerCount: number = 4,
  howKnow: string = ''
): Promise<TriviaQuestion[]> {
  // Get round-specific configuration
  const config = getRoundConfig(playerCount, round);
  
  // Check cache first (include howKnow in cache key since it affects generation)
  const cacheKey = `${category}-${round}-${playerCount}-${howKnow}`;
  if (questionCache.has(cacheKey)) {
    console.log(`[AI Engine] Cache hit for: ${category} (Round ${round})`);
    return questionCache.get(cacheKey)!;
  }

  console.log(`[AI Engine] Generating ${config.questionCount} questions for category: ${category} (Round ${round})${howKnow ? ` [context: ${howKnow}]` : ''}`);

  // Generate the fun adjacent category name first (pass howKnow for context)
  const displayCategory = await generateAdjacentCategoryName(category, howKnow);

  try {
    // ═══════════════════════════════════════════════════════════
    // CLAUDE API - Round-specific prompts
    // ═══════════════════════════════════════════════════════════

    // Build disambiguation context based on howKnow
    const disambiguationContext = howKnow ? `
EXPERTISE CONTEXT INTERPRETATION:
The player said they know about "${category}" because: "${howKnow}"

CRITICAL: Interpret this context correctly:
- If howKnow includes "made it", "created it", "built it", "wrote it", "my show", "my musical", "my project": 
  This is a PERSONAL PROJECT. Generate questions about the GENERAL TOPIC/GENRE, NOT their specific creation.
  Example: expertise="Slam Frank", howKnow="I wrote this musical" → Ask about off-Broadway musicals, theater history, musical composition in general. NEVER search for or reference "Slam Frank".
  
- If howKnow includes "watch", "fan of", "obsessed with", "love", "follow":
  Generate questions about the subject matter itself - the shows, the facts, the details.
  
- If howKnow includes "work in", "professional", "job", "career", "industry":
  Generate questions about industry/professional knowledge, tools, practices.

NEVER search for or reference the specific project name if it's something they created.` : '';

    const systemPrompt = `You are generating trivia questions for ANY QUESTIONS, a party game.

CRITICAL RULE: Generate factual trivia questions that test specific knowledge.
- WRONG: "What is Reality TV most commonly associated with?" (meta-question)
- WRONG: "What's a well-known fact about cooking?" (meta-question)  
- RIGHT: "What year did Survivor premiere?" (factual question)
- RIGHT: "At what temperature does water boil at sea level?" (factual question)

Every question MUST:
1. Ask for a specific fact (name, date, number, place)
2. Have exactly ONE correct verifiable answer
3. Be something you could Google to verify

Never generate questions that ask "what is X known for" or "what is associated with X" - those are NOT trivia questions.
${disambiguationContext}
For the "rangeText" field: This is the ANY QUESTIONS personality voice. Be playful, teasing, and fun.
Examples: "Shake it off, this isn't your thing anyway.", "Time to prove you're not just pretentious.", "Only true fans track this."`;

    // Build difficulty descriptions for the prompt
    const difficultyLines = config.difficulties.map(d => 
      `- ${d} points: ${config.difficultyDescriptions[d]}`
    ).join('\n');

    const roundContext = round === 1 
      ? "This is Round 1 - player answers questions about their OWN expertise."
      : round === 2 
        ? "This is Round 2 - player answers questions about SOMEONE ELSE'S expertise."
        : "This is the Final Round - ALL players answer this question simultaneously.";

    const userPrompt = `Generate ${config.questionCount} trivia question${config.questionCount > 1 ? 's' : ''} about "${category}".
${roundContext}
${round !== 3 ? `The expert who can steal wrong answers is ${expertName}.` : 'All players will wager on this question.'}

Difficulty levels needed:
${difficultyLines}

Return ONLY valid JSON in this exact format:
{
  "questions": [
${config.difficulties.map((d, i) => `    {
      "difficulty": ${d},
      "questionText": "Your factual trivia question here?",
      "rangeText": "Playful ANY QUESTIONS voice comment.",
      "answer": {
        "display": "The Answer",
        "acceptable": ["The Answer", "answer", "alternate spelling"]
      }
    }${i < config.difficulties.length - 1 ? ',' : ''}`).join('\n')}
  ]
}

Now generate ${config.questionCount} question${config.questionCount > 1 ? 's' : ''} about "${category}" at the specified difficult${config.questionCount > 1 ? 'ies' : 'y'}.`;

    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    // ═══════════════════════════════════════════════════════════
    // PARSE RESPONSE
    // ═══════════════════════════════════════════════════════════

    // Extract text content from Claude's response
    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const content = textBlock.text;
    console.log(`[AI Engine] Raw response received for: ${category} (Round ${round})`);

    // Extract JSON from response (Claude might include markdown code blocks)
    let jsonText = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);
    const rawQuestions = parsed.questions || parsed;

    // Validate structure
    if (!Array.isArray(rawQuestions) || rawQuestions.length !== config.questionCount) {
      throw new Error(`Invalid response structure: expected ${config.questionCount} questions, got ${Array.isArray(rawQuestions) ? rawQuestions.length : 'non-array'}`);
    }

    // Validate each question and add category names
    const questions: TriviaQuestion[] = rawQuestions.map((q: any, i: number) => {
      if (!q.questionText || !q.answer?.display) {
        throw new Error(`Question ${i + 1} missing required fields`);
      }
      
      return {
        originalCategory: category,      // The real topic for internal use
        displayCategory: displayCategory, // The fun name for players
        difficulty: q.difficulty,
        questionText: q.questionText,
        rangeText: q.rangeText || '',
        answer: q.answer,
        round: round
      };
    });

    // Store in cache
    questionCache.set(cacheKey, questions);
    console.log(`[AI Engine] Successfully generated ${questions.length} questions for: ${category} (displayed as: ${displayCategory})`);

    return questions;

  } catch (error) {
    console.error('[AI Engine] Generation failed:', error);
    
    // Return fallback mock questions (pass howKnow for context)
    return await getMockQuestions(category, playerName, round, playerCount, howKnow);
  }
}

// ═══════════════════════════════════════════════════════════
// FALLBACK: EXPERT-ASKED QUESTIONS
// ═══════════════════════════════════════════════════════════
// When AI fails, the expert asks the question instead

async function getMockQuestions(
  category: string, 
  playerName: string,
  round: 1 | 2 | 3 = 1,
  playerCount: number = 4,
  howKnow: string = ''
): Promise<TriviaQuestion[]> {
  console.log(`[AI Engine] Using fallback questions for: ${category} (Round ${round})`);
  
  // Still try to get a fun display name even for fallback (pass howKnow for context)
  const displayCategory = await generateAdjacentCategoryName(category, howKnow).catch(() => category);
  
  const config = getRoundConfig(playerCount, round);
  
  // Generate fallback questions based on round config
  const fallbackQuestions: TriviaQuestion[] = config.difficulties.map(difficulty => ({
    originalCategory: category,
    displayCategory,
    difficulty,
    questionText: `what is something specific about ${category} that tests your knowledge?`,
    rangeText: `This is a ${difficulty} point question - good luck!`,
    answer: {
      display: "(Accept any reasonable answer)",
      acceptable: ["any", "reasonable", "answer"]
    },
    round
  }));

  return fallbackQuestions;
}

// ═══════════════════════════════════════════════════════════
// UTILITY: CLEAR CACHE
// ═══════════════════════════════════════════════════════════

export function clearQuestionCache(): void {
  questionCache.clear();
  console.log('[AI Engine] Cache cleared');
}

// ═══════════════════════════════════════════════════════════
// UTILITY: GET SINGLE QUESTION
// ═══════════════════════════════════════════════════════════

export async function getQuestion(
  category: string,
  difficulty: number,
  playerName: string,
  expertName: string,
  round: 1 | 2 | 3 = 1,
  playerCount: number = 4
): Promise<TriviaQuestion | null> {
  const questions = await generateQuestions(category, playerName, expertName, round, playerCount);
  return questions.find(q => q.difficulty === difficulty) || null;
}

// ═══════════════════════════════════════════════════════════
// UTILITY: PRE-GENERATE ALL CATEGORIES
// ═══════════════════════════════════════════════════════════

export async function preGenerateAllQuestions(
  categories: { name: string; expert: string }[],
  playerName: string
): Promise<Map<string, TriviaQuestion[]>> {
  console.log(`[AI Engine] Pre-generating questions for ${categories.length} categories`);
  
  const results = new Map<string, TriviaQuestion[]>();
  
  // Generate in parallel with rate limiting
  const batchSize = 2; // Process 2 at a time to avoid rate limits
  
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize);
    
    const promises = batch.map(cat => 
      generateQuestions(cat.name, playerName, cat.expert)
        .then(questions => ({ name: cat.name, questions }))
    );
    
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(({ name, questions }) => {
      results.set(name, questions);
    });
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < categories.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`[AI Engine] Pre-generation complete: ${results.size} categories`);
  return results;
}
