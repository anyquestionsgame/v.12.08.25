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

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, // Moderate creativity - clearer results
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
    // SIMPLE PROMPTS + MULTIPLE FEW-SHOT EXAMPLES
    // ═══════════════════════════════════════════════════════════

    const systemPrompt = `You are a trivia question generator. Generate factual trivia questions that test specific knowledge. 

Each question must:
- Ask about ONE specific fact
- Have ONE correct factual answer (a name, number, year, or place)
- Start with Who/What/When/Where/Which/How many

Difficulty scaling:
- 100 points: Common knowledge anyone would know
- 200 points: Casual familiarity with the topic
- 300 points: Regular engagement required  
- 400 points: Expert-level deep knowledge

Return valid JSON with a "questions" array.`;

    const userPrompt = `Generate 4 trivia questions about "${category}" at difficulties 100, 200, 300, 400. Follow the exact format shown in the examples.`;

    // ═══════════════════════════════════════════════════════════
    // FEW-SHOT EXAMPLES - Show don't tell
    // ═══════════════════════════════════════════════════════════

    const wineExample = {
      questions: [
        { category: "Wine", difficulty: 100, questionText: "which country produces Champagne?", rangeText: "Think major wine regions.", answer: { display: "France", acceptable: ["France", "French"] } },
        { category: "Wine", difficulty: 200, questionText: "what grape variety is Pinot Grigio made from?", rangeText: "It's in the name.", answer: { display: "Pinot Gris", acceptable: ["Pinot Gris", "Pinot Grigio"] } },
        { category: "Wine", difficulty: 300, questionText: "how many months must non-vintage Champagne age before release?", rangeText: "Within 3 months is fine.", answer: { display: "15 months", acceptable: ["15 months", "15", "12-18 months"] } },
        { category: "Wine", difficulty: 400, questionText: "what is the maximum yield in hectoliters per hectare for Burgundy Grand Cru?", rangeText: "Deep wine nerd territory.", answer: { display: "35 hectoliters", acceptable: ["35", "35 hl", "3500 liters"] } }
      ]
    };

    const realityTVExample = {
      questions: [
        { category: "Reality TV", difficulty: 100, questionText: "what year did the first season of Survivor premiere?", rangeText: "It was around Y2K.", answer: { display: "2000", acceptable: ["2000", "two thousand"] } },
        { category: "Reality TV", difficulty: 200, questionText: "which network originally aired The Bachelor?", rangeText: "One of the big broadcast networks.", answer: { display: "ABC", acceptable: ["ABC", "the ABC"] } },
        { category: "Reality TV", difficulty: 300, questionText: "how many contestants typically start a season of RuPaul's Drag Race?", rangeText: "Within 2 is fine.", answer: { display: "12-14", acceptable: ["12", "13", "14", "12-14", "thirteen"] } },
        { category: "Reality TV", difficulty: 400, questionText: "what was the original cash prize for winning the first season of Big Brother US?", rangeText: "It was less than you'd think.", answer: { display: "$500,000", acceptable: ["500000", "$500,000", "500k", "half a million"] } }
      ]
    };

    const cookingExample = {
      questions: [
        { category: "Cooking", difficulty: 100, questionText: "at what temperature Fahrenheit does water boil at sea level?", rangeText: "Basic kitchen science.", answer: { display: "212°F", acceptable: ["212", "212 degrees", "212°F", "100 celsius"] } },
        { category: "Cooking", difficulty: 200, questionText: "what Italian word describes pasta cooked to be firm to the bite?", rangeText: "You've seen this on menus.", answer: { display: "al dente", acceptable: ["al dente", "aldente"] } },
        { category: "Cooking", difficulty: 300, questionText: "what is the French term for a mixture of diced carrots, celery, and onions?", rangeText: "Classic culinary foundation.", answer: { display: "mirepoix", acceptable: ["mirepoix", "mire poix"] } },
        { category: "Cooking", difficulty: 400, questionText: "at what temperature range Fahrenheit does the Maillard reaction occur?", rangeText: "Within 50 degrees is fine.", answer: { display: "280-330°F", acceptable: ["280", "300", "320", "280-330", "around 300"] } }
      ]
    };

    const trucksExample = {
      questions: [
        { category: "Trucks", difficulty: 100, questionText: "what company manufactures the F-150?", rangeText: "America's best-selling truck.", answer: { display: "Ford", acceptable: ["Ford", "Ford Motor Company"] } },
        { category: "Trucks", difficulty: 200, questionText: "what does the number 1500 typically indicate in truck model names like Ram 1500?", rangeText: "Think about what trucks carry.", answer: { display: "half-ton payload class", acceptable: ["half ton", "1/2 ton", "payload class", "weight class"] } },
        { category: "Trucks", difficulty: 300, questionText: "what year did Ford switch the F-150 body to aluminum?", rangeText: "Within 2 years.", answer: { display: "2015", acceptable: ["2015", "2014", "2016"] } },
        { category: "Trucks", difficulty: 400, questionText: "what is the maximum towing capacity in pounds of a 2024 Ford F-150 with the 3.5L EcoBoost?", rangeText: "Within 1000 lbs.", answer: { display: "14,000 lbs", acceptable: ["14000", "14,000", "13000-14000", "around 14000"] } }
      ]
    };

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o', // Full model for better instruction following
      messages: [
        { role: 'system', content: systemPrompt },
        // Few-shot example 1: Wine
        { role: 'user', content: 'Generate 4 trivia questions about "Wine" at difficulties 100, 200, 300, 400.' },
        { role: 'assistant', content: JSON.stringify(wineExample) },
        // Few-shot example 2: Reality TV
        { role: 'user', content: 'Generate 4 trivia questions about "Reality TV" at difficulties 100, 200, 300, 400.' },
        { role: 'assistant', content: JSON.stringify(realityTVExample) },
        // Few-shot example 3: Cooking
        { role: 'user', content: 'Generate 4 trivia questions about "Cooking" at difficulties 100, 200, 300, 400.' },
        { role: 'assistant', content: JSON.stringify(cookingExample) },
        // Few-shot example 4: Trucks
        { role: 'user', content: 'Generate 4 trivia questions about "Trucks" at difficulties 100, 200, 300, 400.' },
        { role: 'assistant', content: JSON.stringify(trucksExample) },
        // Actual request
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
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
