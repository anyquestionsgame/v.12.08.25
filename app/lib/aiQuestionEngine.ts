import Anthropic from '@anthropic-ai/sdk';

// ═══════════════════════════════════════════════════════════
// TYPESCRIPT TYPES
// ═══════════════════════════════════════════════════════════

export interface TriviaQuestion {
  originalCategory: string;  // The actual topic (e.g., "Wine") - used for question generation
  displayCategory: string;   // The fun name shown to players (e.g., "Pretentious Restaurant Moments")
  difficulty: 100 | 200 | 300 | 400;
  questionText: string;
  rangeText: string;
  answer: {
    display: string;
    acceptable: string[];
  };
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
  category: string
): Promise<string> {
  // Check cache first
  if (adjacentNameCache.has(category.toLowerCase())) {
    console.log(`[AI Engine] Adjacent name cache hit for: ${category}`);
    return adjacentNameCache.get(category.toLowerCase())!;
  }

  console.log(`[AI Engine] Generating adjacent category name for: ${category}`);

  try {
    const systemPrompt = `You generate fun but CLEAR category names for trivia.

═══════════════════════════════════════════════════════════
CRITICAL REQUIREMENTS
═══════════════════════════════════════════════════════════

1. IMMEDIATELY RECOGNIZABLE - Players should instantly know what topic this relates to
2. SLIGHTLY PLAYFUL - Add a fun angle, but keep it obvious
3. NO OBSCURE REFERENCES - Don't require cultural knowledge to understand
4. SIMPLE LANGUAGE - Use common words everyone knows
5. 2-4 words maximum

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

═══════════════════════════════════════════════════════════
THE TEST
═══════════════════════════════════════════════════════════

Ask: "Would someone with ZERO knowledge of this topic understand this category name?"
If NO → it's too obscure, try again
If YES → good!

The category name should make players think "oh yeah, that makes sense" NOT "what does that mean?"
Keep it simple. Keep it clear. Make it slightly fun.`;

    const userPrompt = `Generate ONE adjacent category name for: "${category}"
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
    
    // Cache the result
    adjacentNameCache.set(category.toLowerCase(), cleanName);
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
  expertName: string
): Promise<TriviaQuestion[]> {
  // Check cache first
  const cacheKey = `${category}-${playerName}-${expertName}`;
  if (questionCache.has(cacheKey)) {
    console.log(`[AI Engine] Cache hit for: ${category}`);
    return questionCache.get(cacheKey)!;
  }

  console.log(`[AI Engine] Generating questions for category: ${category}`);

  // Generate the fun adjacent category name first
  const displayCategory = await generateAdjacentCategoryName(category);

  try {
    // ═══════════════════════════════════════════════════════════
    // CLAUDE API - Clean prompts for better results
    // ═══════════════════════════════════════════════════════════

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

Never generate questions that ask "what is X known for" or "what is associated with X" - those are NOT trivia questions.`;

    const userPrompt = `Generate 4 trivia questions about "${category}" for player ${playerName}.
The expert who can steal wrong answers is ${expertName}.

Difficulty levels:
- 100 points: Basic - anyone who's heard of this topic would know
- 200 points: Casual - someone with mild familiarity would know
- 300 points: Fan - dedicated enthusiast knowledge
- 400 points: Expert - deep cut only true experts know

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "difficulty": 100,
      "questionText": "What year did Survivor premiere on CBS?",
      "rangeText": "This is TV history 101.",
      "answer": {
        "display": "2000",
        "acceptable": ["2000", "two thousand"]
      }
    },
    {
      "difficulty": 200,
      "questionText": "Which host has hosted Survivor since season 1?",
      "rangeText": "If you've seen even one episode...",
      "answer": {
        "display": "Jeff Probst",
        "acceptable": ["Jeff Probst", "Probst"]
      }
    },
    {
      "difficulty": 300,
      "questionText": "What is the name of the final vote where the jury picks the winner?",
      "rangeText": "Superfan territory.",
      "answer": {
        "display": "Final Tribal Council",
        "acceptable": ["Final Tribal Council", "Tribal Council", "FTC"]
      }
    },
    {
      "difficulty": 400,
      "questionText": "How many days do contestants typically spend on the island in a standard season?",
      "rangeText": "Only true fans track the calendar.",
      "answer": {
        "display": "39 days",
        "acceptable": ["39", "39 days", "thirty-nine", "thirty-nine days"]
      }
    }
  ]
}

Now generate 4 questions about "${category}" following this exact format.`;

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
    console.log(`[AI Engine] Raw response received for: ${category}`);

    // Extract JSON from response (Claude might include markdown code blocks)
    let jsonText = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);
    const rawQuestions = parsed.questions || parsed;

    // Validate structure
    if (!Array.isArray(rawQuestions) || rawQuestions.length !== 4) {
      throw new Error(`Invalid response structure: expected 4 questions, got ${Array.isArray(rawQuestions) ? rawQuestions.length : 'non-array'}`);
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
        answer: q.answer
      };
    });

    // Store in cache
    questionCache.set(cacheKey, questions);
    console.log(`[AI Engine] Successfully generated ${questions.length} questions for: ${category} (displayed as: ${displayCategory})`);

    return questions;

  } catch (error) {
    console.error('[AI Engine] Generation failed:', error);
    
    // Return fallback mock questions
    return await getMockQuestions(category, playerName);
  }
}

// ═══════════════════════════════════════════════════════════
// FALLBACK: EXPERT-ASKED QUESTIONS
// ═══════════════════════════════════════════════════════════
// When AI fails, the expert asks the question instead

async function getMockQuestions(category: string, playerName: string): Promise<TriviaQuestion[]> {
  console.log(`[AI Engine] Using fallback questions for: ${category}`);
  
  // Still try to get a fun display name even for fallback
  const displayCategory = await generateAdjacentCategoryName(category).catch(() => category);

  // Fallback: Generic but properly formatted trivia questions
  // These are real questions that can be asked and answered
  return [
    {
      originalCategory: category,
      displayCategory,
      difficulty: 100,
      questionText: `what is ${category} most commonly associated with?`,
      rangeText: `Think of the first thing that comes to mind - the obvious answer.`,
      answer: {
        display: "(Accept any reasonable answer)",
        acceptable: ["any", "reasonable", "answer"]
      }
    },
    {
      originalCategory: category,
      displayCategory,
      difficulty: 200,
      questionText: `what is a well-known fact about ${category}?`,
      rangeText: `Something most people who know about ${category} would agree on.`,
      answer: {
        display: "(Accept any reasonable answer)",
        acceptable: ["any", "reasonable", "answer"]
      }
    },
    {
      originalCategory: category,
      displayCategory,
      difficulty: 300,
      questionText: `what is a specific detail about ${category} that casual fans might not know?`,
      rangeText: `This requires some real knowledge of the topic.`,
      answer: {
        display: "(Accept any reasonable answer)",
        acceptable: ["any", "reasonable", "answer"]
      }
    },
    {
      originalCategory: category,
      displayCategory,
      difficulty: 400,
      questionText: `what is an expert-level fact about ${category}?`,
      rangeText: `Only true experts would know this one.`,
      answer: {
        display: "(Accept any reasonable answer)",
        acceptable: ["any", "reasonable", "answer"]
      }
    }
  ];
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
  difficulty: 100 | 200 | 300 | 400,
  playerName: string,
  expertName: string
): Promise<TriviaQuestion | null> {
  const questions = await generateQuestions(category, playerName, expertName);
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
