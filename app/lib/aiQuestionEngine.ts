import OpenAI from 'openai';

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
// OPENAI CLIENT INITIALIZATION (LAZY)
// ═══════════════════════════════════════════════════════════

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
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
    const systemPrompt = `You generate creative, adjacent category names for trivia following the ANY QUESTIONS voice.

RULES:
- NEVER use the category name directly
- Find a 6-degrees-adjacent topic that connects
- Should be surprising but make sense once revealed
- Use specific brands, cultural references
- 2-5 words maximum
- Make people think "Wait, who knows THIS?"
- Be irreverent but not mean

EXAMPLES:
- Wine → "Pretentious Restaurant Moments"
- Excel → "Office Space Meltdowns"
- Reality TV → "Rose Ceremony Drama"
- Cats → "3AM Zoomies Psychology"
- Pottery → "Ghost Movie References"
- Taylor Swift → "Breakup Playlist Essentials"
- My Grandmother → "Embarrassing Holiday Stories"
- LinkedIn → "Corporate Cringe Content"
- Trader Joe's → "Bougie Grocery Behavior"
- Coffee → "Morning Personality Disorders"
- Dogs → "Park Bench Small Talk"
- Cooking → "Recipe Comment Section Drama"
- Sports → "Fantasy League Meltdowns"
- History → "Wikipedia Rabbit Holes"
- Music → "Aux Cord Pressure Moments"

The category should surprise players when they learn whose expertise it is.`;

    const userPrompt = `Generate ONE adjacent category name for: "${category}"
Return ONLY the category name, nothing else. No quotes, no explanation.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.9, // High creativity
      max_tokens: 50,
    });

    const adjacentName = response.choices[0].message.content?.trim() || category;
    
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
    // OPENAI PROMPTS
    // ═══════════════════════════════════════════════════════════

    const systemPrompt = `You are a trivia question writer for "King of Hearts" by ANY QUESTIONS.

═══════════════════════════════════════════════════════════
CRITICAL RULE #1: FACTUAL TRIVIA ONLY
═══════════════════════════════════════════════════════════

You MUST generate FACTUAL TRIVIA QUESTIONS with SPECIFIC, VERIFIABLE ANSWERS.

NEVER GENERATE THESE (WILL BE REJECTED):
❌ "What comes to mind when you think of X?"
❌ "What's your opinion on X?"
❌ "Describe something about X"
❌ "What do you associate with X?"
❌ "What's something interesting about X?"
❌ Answers like "any reasonable answer" or "varies" or "depends" or "group decides"

ALWAYS GENERATE THESE:
✅ "What year did X happen?" → "1985"
✅ "Who invented X?" → "Thomas Edison"
✅ "What company makes X?" → "Ford"
✅ "How many X are there?" → "47"
✅ "What is the name of X?" → "Specific Name"
✅ Answers that are OBJECTIVELY CORRECT OR INCORRECT

EXAMPLE - CATEGORY: "Trucks"
BAD: "What comes to mind when someone mentions trucks?" 
     Answer: "any reasonable answer" ← NEVER DO THIS

GOOD: "What's the best-selling truck in America for 40+ years?"
      Answer: "Ford F-150" ← SPECIFIC, VERIFIABLE FACT

BAD: "What do you think makes a good truck?"
     Answer: "varies by person" ← NEVER DO THIS

GOOD: "What year did Ford switch the F-150 to an aluminum body?"
      Answer: "2015" ← SPECIFIC, VERIFIABLE FACT

═══════════════════════════════════════════════════════════
QUESTION FORMAT
═══════════════════════════════════════════════════════════

- Questions displayed as: "[Player Name], [your question text]"
- DO NOT include the player name in your question text
- Start directly with the question (lowercase is fine)
- All questions must have a SINGLE CORRECT ANSWER or small set of correct answers

═══════════════════════════════════════════════════════════
RANGE TEXT FORMAT
═══════════════════════════════════════════════════════════

- Displayed as: "What's your best guess? [your range text]"
- For numbers: specify acceptable range ("within 5 years", "within 1000 lbs")
- For facts: give a helpful hint about the answer format
- Conversational, slightly sarcastic but friendly

GOOD RANGE TEXT:
- "We'll give you within 5 years on this one"
- "It's an American company... that narrows it down"
- "Three letters, starts with F"
- "The number might surprise you - within 10% works"

═══════════════════════════════════════════════════════════
THE ANY QUESTIONS VOICE
═══════════════════════════════════════════════════════════

- Hyper-specific references make it fun
- Conversational, not stuffy trivia-host style
- Makes even obscure facts feel approachable
- Slightly cheeky but never mean

All answers MUST include acceptable variations (alternate spellings, nicknames, ranges for numbers).`;

    const userPrompt = `Generate 4 FACTUAL TRIVIA questions about "${category}" with STRICT difficulty scaling.
The current player is ${playerName}. The expert who can steal is ${expertName}.

═══════════════════════════════════════════════════════════
ABSOLUTE REQUIREMENT: FACTUAL QUESTIONS ONLY
═══════════════════════════════════════════════════════════

Every question MUST be:
- A verifiable fact with a specific answer
- Google-able and provable
- NOT an opinion, feeling, or subjective experience

If ${expertName} is the expert on ${category}, they should be able to STEAL
the hard questions by knowing facts that ${playerName} doesn't.

═══════════════════════════════════════════════════════════
DIFFICULTY CALIBRATION (READ CAREFULLY)
═══════════════════════════════════════════════════════════

100 POINTS - "Zero expertise needed":
- Someone who has NEVER studied ${category} could answer this
- General pop culture / common knowledge level
- The most famous, obvious fact about the topic
- Answerable in under 5 seconds with no research
- Example for "Trucks": "What company makes the F-150?" (Ford)
- Example for "Wine": "What country is Champagne from?" (France)
- Example for "Excel": "What company makes Excel?" (Microsoft)

200 POINTS - "Casual familiarity":
- Someone who has engaged with ${category} once or twice would know
- Not universal knowledge, but fairly well-known
- Casual fans get it right, complete outsiders might struggle
- Example for "Trucks": "What does F-150 stand for the 150 of?" (payload capacity class)
- Example for "Wine": "What grape makes Chardonnay?" (Chardonnay grape)
- Example for "Excel": "What's the keyboard shortcut to save?" (Ctrl+S)

300 POINTS - "Regular engagement required":
- Requires consistent exposure to ${category}
- Dedicated fans would know, casuals would struggle
- The kind of fact you'd know if you follow this topic
- Example for "Trucks": "What year did Ford switch F-150 to aluminum body?" (2015)
- Example for "Wine": "What are the 3 grapes allowed in Champagne?" (Chardonnay, Pinot Noir, Pinot Meunier)
- Example for "Excel": "What's the row limit in modern Excel?" (1,048,576)

400 POINTS - "Expert knowledge only":
- Only dedicated experts/enthusiasts know this
- Deep trivia, obscure facts, specific technical details
- Even regular fans might need to guess
- The expert (${expertName}) should have an advantage here
- Example for "Trucks": "What's the towing capacity of a 2024 F-150 with the 3.5L EcoBoost?" (14,000 lbs)
- Example for "Wine": "What's the minimum aging time for Champagne?" (15 months for non-vintage)
- Example for "Excel": "What's the maximum number of arguments in CONCATENATE?" (255)

CRITICAL SCALING TEST:
- 100: Would a random person on the street know this? YES = good
- 400: Would only someone who studies ${category} know this? YES = good
- If all 4 feel similar difficulty, you've failed

═══════════════════════════════════════════════════════════
ANSWER FORMAT REQUIREMENTS
═══════════════════════════════════════════════════════════

"display": The primary correct answer shown to players
"acceptable": Array of ALL valid answers including:
  - Common misspellings
  - Abbreviations and full names
  - Reasonable numerical ranges (for number questions)
  - Nicknames or alternate names

EXAMPLE ANSWER:
{
  "display": "Ford F-150",
  "acceptable": ["Ford F-150", "F-150", "F150", "Ford F150", "the F-150"]
}

═══════════════════════════════════════════════════════════
JSON OUTPUT FORMAT
═══════════════════════════════════════════════════════════

Return ONLY valid JSON:
{
  "questions": [
    { 
      "category": "${category}", 
      "difficulty": 100, 
      "questionText": "what company makes the most popular truck in America?",
      "rangeText": "It's an American company... big hint there",
      "answer": { "display": "Ford", "acceptable": ["Ford", "Ford Motor Company", "Ford Motors"] }
    },
    { 
      "category": "${category}", 
      "difficulty": 200, 
      "questionText": "...",
      "rangeText": "...",
      "answer": { "display": "...", "acceptable": ["..."] }
    },
    { 
      "category": "${category}", 
      "difficulty": 300, 
      "questionText": "...",
      "rangeText": "...",
      "answer": { "display": "...", "acceptable": ["..."] }
    },
    { 
      "category": "${category}", 
      "difficulty": 400, 
      "questionText": "...",
      "rangeText": "...",
      "answer": { "display": "...", "acceptable": ["..."] }
    }
  ]
}

Generate FACTUAL questions with SPECIFIC answers. RESPECT THE DIFFICULTY CURVE!`;

    // ═══════════════════════════════════════════════════════════
    // API CALL
    // ═══════════════════════════════════════════════════════════

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini', // Cheap and fast
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // Slightly lower for more factual responses
      max_tokens: 2000,
    });

    // ═══════════════════════════════════════════════════════════
    // PARSE RESPONSE
    // ═══════════════════════════════════════════════════════════

    const content = response.choices[0].message.content;
    console.log(`[AI Engine] Raw response received for: ${category}`);

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content);
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
// FALLBACK: MOCK QUESTIONS (Now with factual structure)
// ═══════════════════════════════════════════════════════════

async function getMockQuestions(category: string, playerName: string): Promise<TriviaQuestion[]> {
  console.log(`[AI Engine] Using fallback mock questions for: ${category}`);
  
  // Still try to get a fun display name even for fallback
  const displayCategory = await generateAdjacentCategoryName(category).catch(() => category);

  // These are generic but still factual-style questions
  return [
    {
      originalCategory: category,
      displayCategory,
      difficulty: 100,
      questionText: `what's the most famous or well-known thing about ${category}?`,
      rangeText: `This is the easy one - go with the obvious answer.`,
      answer: {
        display: "The most famous fact about this topic",
        acceptable: ["famous fact", "well known fact", "obvious answer"]
      }
    },
    {
      originalCategory: category,
      displayCategory,
      difficulty: 200,
      questionText: `what's a basic fact someone familiar with ${category} would know?`,
      rangeText: `If you've spent any time with ${category}, you probably know this.`,
      answer: {
        display: "A commonly known fact",
        acceptable: ["common fact", "basic fact", "known fact"]
      }
    },
    {
      originalCategory: category,
      displayCategory,
      difficulty: 300,
      questionText: `what's a fact about ${category} that dedicated fans would know?`,
      rangeText: `This one's for the real ${category} enthusiasts.`,
      answer: {
        display: "An enthusiast-level fact",
        acceptable: ["fan fact", "enthusiast knowledge", "dedicated fan answer"]
      }
    },
    {
      originalCategory: category,
      displayCategory,
      difficulty: 400,
      questionText: `what's an obscure trivia fact about ${category} that only experts know?`,
      rangeText: `Deep cut territory - only true experts get this one.`,
      answer: {
        display: "Expert-level trivia",
        acceptable: ["expert answer", "obscure fact", "deep trivia"]
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
