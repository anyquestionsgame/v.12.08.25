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
// OPENAI CLIENT INITIALIZATION
// ═══════════════════════════════════════════════════════════

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const response = await openai.chat.completions.create({
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

QUESTION FORMAT:
- Questions will be displayed as: "[Player Name], [your question text]"
- DO NOT include the player name in your question text
- Start questions directly with the question (lowercase is fine)
- Write as if speaking to the player (use "you" naturally)

RANGE TEXT FORMAT:
- Range text will be displayed as: "What's your best guess? [your range text]"
- Your range text should flow naturally after "What's your best guess?"
- CAN reference the player by name in range text for personality
- Make it conversational and slightly sarcastic

THE ANY QUESTIONS VOICE:
- Hyper-specific brands/references (Trader Joe's not grocery store)
- Worst-case timing humor
- Chronically online but universally understood
- Test: Would someone say "Oh god, that's SO specific but SO true"?

EXAMPLES:

BAD (includes player name in question):
questionText: "Sarah, in what year did the Titanic sink?"
❌ We'll prepend the name - don't include it

GOOD (clean question):
questionText: "in what year did the Titanic sink?"
✅ We prepend: "Sarah, in what year did the Titanic sink?"

BAD (range text doesn't flow):
rangeText: "The answer needs to be within 5 years."
❌ Doesn't flow after "What's your best guess?"

GOOD (flows naturally):
rangeText: "We'll give you within 5 years... is that fair?"
✅ Full display: "What's your best guess? We'll give you within 5 years... is that fair?"

MORE GOOD RANGE TEXT EXAMPLES:
- "We'll accept within 10 because it's the holidays"
- "Within 3 works - we're not monsters"
- "Ballpark is fine... we're being generous today"
- "Within 5 years... feeling confident?"
- "We'll give you some wiggle room here - within 10?"

RANGE TEXT STYLE:
- Conversational, not formal
- Can be sarcastic but not mean
- Reference specific circumstances ("it's the holidays", "we're being nice")
- Should sound like a friend giving you a break

Questions must be Google-verifiable facts with specific answers.
All answers must include acceptable variations (misspellings, ranges for numbers, etc.)`;

    const userPrompt = `Generate 4 trivia questions about "${category}" with STRICT difficulty scaling.
The current player is ${playerName}. The expert who can steal is ${expertName}.

═══════════════════════════════════════════════════════════
DIFFICULTY REQUIREMENTS (CRITICAL - READ CAREFULLY)
═══════════════════════════════════════════════════════════

100 POINTS - "I've heard of this":
- Anyone who's casually aware of ${category} would know
- The most famous/obvious fact about the topic
- Pop culture level knowledge, no expertise needed
- Example difficulty: "What color is Coca-Cola's logo?" (red)
- Should feel like a gimme

200 POINTS - "I've engaged once or twice":
- Requires having watched/read/experienced the topic at least once
- Still fairly well-known, but not universal common knowledge
- Casual fans get it, complete outsiders might not
- Example difficulty: "Who founded Microsoft?" (Bill Gates)

300 POINTS - "I'm a regular fan":
- Requires consistent engagement with the topic
- Dedicated fans would know, casuals might struggle
- Deeper than surface level, but not obscure
- Example difficulty: "What year did Apple release the first iPhone?" (2007)

400 POINTS - "I'm an expert":
- Only dedicated fans/experts know this
- Deep trivia, obscure facts, specific details
- Might require research even for fans
- Example difficulty: "How many episodes of Breaking Bad were directed by Vince Gilligan?" (5)
- Should make even experts think

CRITICAL SCALING RULES:
- Each question MUST be noticeably harder than the previous
- If unsure, make 100 TOO EASY and 400 TOO HARD rather than all medium
- Test: Could someone who knows nothing about ${category} answer the 100? They should.
- Test: Could an expert struggle with the 400? They might.

═══════════════════════════════════════════════════════════
FORMATTING REQUIREMENTS
═══════════════════════════════════════════════════════════

- questionText: Start directly with the question (we'll add "${playerName}," at the beginning)
- rangeText: Should flow naturally after "What's your best guess?"
- Use the ANY QUESTIONS voice - hyper-specific, slightly sarcastic

EXAMPLE OUTPUT:
{
  "category": "${category}",
  "difficulty": 100,
  "questionText": "what's the most famous wine region in France?",
  "rangeText": "We'll give you 3 guesses... it's the obvious one",
  "answer": {
    "display": "Bordeaux or Champagne",
    "acceptable": ["Bordeaux", "Champagne", "Burgundy", "Bourgogne"]
  }
}

Return ONLY valid JSON:
{
  "questions": [
    { "category": "${category}", "difficulty": 100, "questionText": "...", "rangeText": "...", "answer": { "display": "...", "acceptable": ["..."] } },
    { "category": "${category}", "difficulty": 200, "questionText": "...", "rangeText": "...", "answer": { "display": "...", "acceptable": ["..."] } },
    { "category": "${category}", "difficulty": 300, "questionText": "...", "rangeText": "...", "answer": { "display": "...", "acceptable": ["..."] } },
    { "category": "${category}", "difficulty": 400, "questionText": "...", "rangeText": "...", "answer": { "display": "...", "acceptable": ["..."] } }
  ]
}

Make questions specific and fun - but RESPECT THE DIFFICULTY CURVE!`;

    // ═══════════════════════════════════════════════════════════
    // API CALL
    // ═══════════════════════════════════════════════════════════

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cheap and fast
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8, // Creative but not random
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
// FALLBACK: MOCK QUESTIONS
// ═══════════════════════════════════════════════════════════

async function getMockQuestions(category: string, playerName: string): Promise<TriviaQuestion[]> {
  console.log(`[AI Engine] Using fallback mock questions for: ${category}`);
  
  // Still try to get a fun display name even for fallback
  const displayCategory = await generateAdjacentCategoryName(category).catch(() => category);

  return [
    {
      originalCategory: category,
      displayCategory,
      difficulty: 100,
      questionText: `what's the first thing that comes to mind when someone mentions ${category}?`,
      rangeText: `No tricks here, ${playerName} - just say literally anything.`,
      answer: {
        display: "We'll accept any reasonable answer",
        acceptable: ["any answer", "reasonable guess", "good try"]
      }
    },
    {
      originalCategory: category,
      displayCategory,
      difficulty: 200,
      questionText: `if you've spent more than 10 minutes thinking about ${category}, you probably know this one...`,
      rangeText: `Ballpark is fine - we're being generous because it's the holidays.`,
      answer: {
        display: "A commonly known fact",
        acceptable: ["common fact", "well known", "popular answer"]
      }
    },
    {
      originalCategory: category,
      displayCategory,
      difficulty: 300,
      questionText: `here's one for the dedicated ${category} fans in the room...`,
      rangeText: `We'll give you some wiggle room, ${playerName}... feeling confident?`,
      answer: {
        display: "Dedicated fan knowledge",
        acceptable: ["fan fact", "insider knowledge", "deep cut"]
      }
    },
    {
      originalCategory: category,
      displayCategory,
      difficulty: 400,
      questionText: `okay, this is the deep cut - only true ${category} obsessives would know this...`,
      rangeText: `This is the big one - be precise. No pressure, ${playerName}.`,
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

