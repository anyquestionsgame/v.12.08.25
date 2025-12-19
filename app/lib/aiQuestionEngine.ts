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
    // OPENAI PROMPTS
    // ═══════════════════════════════════════════════════════════

    const systemPrompt = `You are a trivia question writer. Generate DIRECT FACTUAL QUESTIONS only.

╔═══════════════════════════════════════════════════════════╗
║  CRITICAL INSTRUCTIONS FOR JSON FIELDS - READ FIRST       ║
╚═══════════════════════════════════════════════════════════╝

The 'questionText' field must contain THE ACTUAL TRIVIA QUESTION ITSELF.
This is the literal question that will be read aloud to the player.

CORRECT examples of questionText:
- "Who wrote the novel Ulysses?"
- "In what year was Dubliners published?"
- "What Irish county is James Joyce from?"
- "How many chapters are in Finnegans Wake?"

WRONG examples of questionText (NEVER DO THIS):
- "the expert will ask you a question about Irish Literature"
- "name an Irish author"
- "what's a fact about Joyce"
- Any text that describes the question instead of being the question

Remember: questionText = THE QUESTION ITSELF, WORD FOR WORD, AS IT WILL BE SPOKEN.

Not instructions. Not descriptions. The literal question.

Format: Start with a question word (Who/What/When/Where/How) or 'Is/Are/Was/Were'.

╔═══════════════════════════════════════════════════════════╗
║  CRITICAL FORMAT REQUIREMENT                              ║
╚═══════════════════════════════════════════════════════════╝

You must ask DIRECT FACTUAL QUESTIONS, not meta-questions.

❌ WRONG - META-QUESTIONS (DO NOT GENERATE THESE):
- "What's an obscure fact about cooking?"
- "Name something only experts know about wine"
- "Tell me an expert-level detail about trucks"
- "What would a cooking expert know?"
- "Share a deep-cut fact about pottery"
- "What's something interesting about X?"
- "What's a fact that requires expertise?"

✅ CORRECT - DIRECT TRIVIA QUESTIONS (ALWAYS USE THIS FORMAT):
- "At what temperature does the Maillard reaction occur?" → "300-500°F"
- "Which Italian region produces Barolo wine?" → "Piedmont"
- "What's the payload capacity of a 2024 Ford F-150?" → "3,250 lbs"
- "What is the term for leather-hard clay?" → "Greenware"
- "What year was the first iPhone released?" → "2007"
- "Who directed Pulp Fiction?" → "Quentin Tarantino"

THE QUESTION MUST:
1. Ask about ONE specific fact
2. Have ONE correct answer (a fact, number, name, or date)
3. Test if the player KNOWS this specific fact
4. NOT ask the player to generate/name/share/tell a fact

BANNED PHRASES - NEVER START A QUESTION WITH:
- "What's a fact about..."
- "Name something..."
- "Tell me..."
- "Share a..."
- "What would an expert know..."
- "What's something interesting..."
- "What's an obscure fact..."

REQUIRED QUESTION STARTERS:
- "What is..." / "What was..."
- "Which..." / "Who..."
- "How many..." / "How much..."
- "What year..." / "In what year..."
- "What temperature..." / "At what..."
- "Where is..." / "Where was..."

═══════════════════════════════════════════════════════════
EXAMPLES BY CATEGORY
═══════════════════════════════════════════════════════════

COOKING:
❌ WRONG: "What's something a chef would know about cooking?"
✅ RIGHT: "What temperature does water boil at sea level?" → "212°F / 100°C"

WINE:
❌ WRONG: "Name an expert-level wine fact"
✅ RIGHT: "Which grape is used to make Champagne's base wine?" → "Chardonnay, Pinot Noir, or Pinot Meunier"

TRUCKS:
❌ WRONG: "Tell me something only truck experts know"
✅ RIGHT: "What year did Ford switch the F-150 to an aluminum body?" → "2015"

POTTERY:
❌ WRONG: "Share a deep-cut pottery fact"
✅ RIGHT: "What temperature is required to fire stoneware?" → "2200-2400°F"

═══════════════════════════════════════════════════════════
QUESTION DISPLAY FORMAT
═══════════════════════════════════════════════════════════

- Questions displayed as: "[Player Name], [your question text]"
- DO NOT include the player name - we add it
- Start directly with the question (lowercase is fine)

═══════════════════════════════════════════════════════════
RANGE TEXT FORMAT
═══════════════════════════════════════════════════════════

- Displayed as: "What's your best guess? [your range text]"
- For numbers: specify acceptable range ("within 5 years", "within 100 lbs")
- For names: give a helpful hint ("It's a French region", "Think American companies")
- Keep it conversational and slightly playful

All answers MUST include acceptable variations (alternate spellings, nicknames, ranges for numbers).`;

    const userPrompt = `Generate 4 DIRECT FACTUAL TRIVIA questions about "${category}".
The current player is ${playerName}. The expert who can steal is ${expertName}.

╔═══════════════════════════════════════════════════════════╗
║  REMINDER: NO META-QUESTIONS                              ║
╚═══════════════════════════════════════════════════════════╝

❌ DO NOT WRITE: "What's a fact about ${category}?"
❌ DO NOT WRITE: "Name something an expert would know about ${category}"
❌ DO NOT WRITE: "What's something interesting about ${category}?"

✅ WRITE QUESTIONS LIKE:
- "What is [specific thing about ${category}]?"
- "Which [specific thing] is associated with ${category}?"
- "How many/much [specific measurement about ${category}]?"
- "What year did [specific event about ${category}] happen?"

Each question must have ONE specific, factual answer.
If ${expertName} is the expert, they should know the HARD questions that ${playerName} might not.

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

FINAL CHECK before outputting:
- Does each question ask about ONE specific fact? ✓
- Does each question have ONE correct answer? ✓
- Did you avoid "what's a fact about..." or "name something..."? ✓

Generate DIRECT trivia questions with SPECIFIC answers. NO META-QUESTIONS!`;

    // ═══════════════════════════════════════════════════════════
    // API CALL
    // ═══════════════════════════════════════════════════════════

    // Few-shot example to show the AI exactly what format we want
    const fewShotExample = {
      questions: [
        {
          category: "Wine",
          difficulty: 100,
          questionText: "which country produces Champagne?",
          rangeText: "Think major wine regions - this is wine 101.",
          answer: {
            display: "France",
            acceptable: ["France", "French"]
          }
        },
        {
          category: "Wine",
          difficulty: 200,
          questionText: "what grape variety is used to make Pinot Grigio?",
          rangeText: "It's in the name... kind of.",
          answer: {
            display: "Pinot Gris",
            acceptable: ["Pinot Gris", "Pinot Grigio", "the Pinot Gris grape"]
          }
        },
        {
          category: "Wine",
          difficulty: 300,
          questionText: "what is the minimum aging requirement for non-vintage Champagne?",
          rangeText: "We'll accept within 3 months.",
          answer: {
            display: "15 months",
            acceptable: ["15 months", "15 mo", "12-18 months", "about 15 months"]
          }
        },
        {
          category: "Wine",
          difficulty: 400,
          questionText: "what is the maximum permitted yield in liters per hectare for Burgundy Grand Cru vineyards?",
          rangeText: "This is deep wine nerd territory. Within 500 liters.",
          answer: {
            display: "3,500 liters",
            acceptable: ["3500", "3,500", "3500 liters", "35 hectoliters"]
          }
        }
      ]
    };

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o', // More expensive but better instruction following
      messages: [
        { role: 'system', content: systemPrompt },
        // Few-shot example: show the AI a perfect response
        { 
          role: 'user', 
          content: 'Generate 4 DIRECT FACTUAL TRIVIA questions about "Wine". The current player is Sarah. The expert who can steal is Marcus.'
        },
        {
          role: 'assistant',
          content: JSON.stringify(fewShotExample)
        },
        // Now the actual request
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5, // Lower for more consistent, instruction-following responses
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
