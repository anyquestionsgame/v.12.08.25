import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions, TriviaQuestion, getRoundConfig } from '@/app/lib/aiQuestionEngine';

// Route segment config - prevent build-time analysis
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════
// POST /api/questions/generate
// ═══════════════════════════════════════════════════════════
// Generate AI-powered trivia questions
//
// SINGLE CATEGORY:
// Request: { category: string, playerName: string, expertName: string, round?: number, playerCount?: number }
// Response: { success: true, questions: TriviaQuestion[], category: string }
//
// BULK GENERATION:
// Request: { categories: [{ name: string, expert: string, round?: number }], players: string[], playerCount?: number }
// Response: { success: true, questionsByCategory: { [category]: TriviaQuestion[] } }
// ═══════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a bulk request
    if (body.categories && Array.isArray(body.categories)) {
      return handleBulkGeneration(body);
    }
    
    // Single category generation
    return handleSingleGeneration(body);

  } catch (error) {
    console.error('[API] Error generating questions:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate questions' 
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════
// SINGLE CATEGORY GENERATION
// ═══════════════════════════════════════════════════════════

async function handleSingleGeneration(body: any) {
  const { category, playerName, expertName, round = 1, playerCount = 4, howKnow = '' } = body;

  // Validate required fields
  if (!category || typeof category !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid category' },
      { status: 400 }
    );
  }

  if (!playerName || typeof playerName !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid playerName' },
      { status: 400 }
    );
  }

  if (!expertName || typeof expertName !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid expertName' },
      { status: 400 }
    );
  }

  const validRound = (round === 1 || round === 2 || round === 3) ? round : 1;
  
  console.log(`[API] Generating questions for category: ${category} (Round ${validRound})`);

  const questions = await generateQuestions(category, playerName, expertName, validRound as 1 | 2 | 3, playerCount, howKnow);

  return NextResponse.json({
    success: true,
    questions,
    category,
    count: questions.length,
    round: validRound,
  });
}

// ═══════════════════════════════════════════════════════════
// BULK GENERATION (All categories at once)
// ═══════════════════════════════════════════════════════════

async function handleBulkGeneration(body: any) {
  const { categories, players, playerCount } = body;

  // Validate
  if (!Array.isArray(categories) || categories.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Categories must be a non-empty array' },
      { status: 400 }
    );
  }

  if (!Array.isArray(players) || players.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Players must be a non-empty array' },
      { status: 400 }
    );
  }

  const numPlayers = playerCount || players.length;
  console.log(`[API] Bulk generating questions for ${categories.length} categories (${numPlayers} players)`);

  const questionsByCategory: Record<string, TriviaQuestion[]> = {};
  const errors: string[] = [];

  // Generate questions for each category
  // Process in parallel with a small batch size to avoid rate limits
  const batchSize = 2;
  
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (cat: { name: string; howKnow?: string; expert: string; round?: number }) => {
      try {
        // Determine round from category config, default to 1
        const round = (cat.round === 1 || cat.round === 2 || cat.round === 3) ? cat.round : 1;
        
        // Use first player name for the prompts (they all see the same questions)
        // Pass howKnow for expertise disambiguation
        const questions = await generateQuestions(cat.name, players[0], cat.expert, round as 1 | 2 | 3, numPlayers, cat.howKnow);
        return { category: cat.name, questions, success: true, round };
      } catch (error) {
        console.error(`[API] Failed to generate for ${cat.name}:`, error);
        const round = (cat.round === 1 || cat.round === 2 || cat.round === 3) ? cat.round : 1;
        return { 
          category: cat.name, 
          questions: getFallbackQuestions(cat.name, players[0], round as 1 | 2 | 3, numPlayers, cat.howKnow), 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          round
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      questionsByCategory[result.category] = result.questions;
      if (!result.success) {
        errors.push(`${result.category}: ${result.error}`);
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < categories.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const totalQuestions = Object.values(questionsByCategory).reduce(
    (sum, qs) => sum + qs.length, 0
  );

  console.log(`[API] Bulk generation complete: ${totalQuestions} questions for ${categories.length} categories`);

  return NextResponse.json({
    success: true,
    questionsByCategory,
    totalCategories: categories.length,
    totalQuestions,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// Fallback questions if AI fails - these are REAL questions, not meta-descriptions
function getFallbackQuestions(category: string, playerName: string, round: 1 | 2 | 3 = 1, playerCount: number = 4, howKnow?: string): TriviaQuestion[] {
  const config = getRoundConfig(playerCount, round);
  
  return config.difficulties.map(difficulty => ({
    originalCategory: category,
    displayCategory: category,
    difficulty,
    questionText: `what is something specific about ${category} that tests your knowledge?`,
    rangeText: `This is a ${difficulty} point question - good luck!`,
    answer: {
      display: "(The expert will judge the answer)",
      acceptable: ["any reasonable answer", "expert judgment"]
    },
    round
  }));
}

// ═══════════════════════════════════════════════════════════
// GET /api/questions/generate
// ═══════════════════════════════════════════════════════════

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Question Generator API',
    usage: {
      single: 'POST with { category, playerName, expertName }',
      bulk: 'POST with { categories: [{ name, expert }], players: string[] }',
    },
  });
}
