import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions, TriviaQuestion } from '@/app/lib/aiQuestionEngine';

// ═══════════════════════════════════════════════════════════
// POST /api/questions/generate
// ═══════════════════════════════════════════════════════════
// Generate AI-powered trivia questions
//
// SINGLE CATEGORY:
// Request: { category: string, playerName: string, expertName: string }
// Response: { success: true, questions: TriviaQuestion[], category: string }
//
// BULK GENERATION:
// Request: { categories: [{ name: string, expert: string }], players: string[] }
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
  const { category, playerName, expertName } = body;

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

  console.log(`[API] Generating questions for category: ${category}`);

  const questions = await generateQuestions(category, playerName, expertName);

  return NextResponse.json({
    success: true,
    questions,
    category,
    count: questions.length,
  });
}

// ═══════════════════════════════════════════════════════════
// BULK GENERATION (All categories at once)
// ═══════════════════════════════════════════════════════════

async function handleBulkGeneration(body: any) {
  const { categories, players } = body;

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

  console.log(`[API] Bulk generating questions for ${categories.length} categories`);

  const questionsByCategory: Record<string, TriviaQuestion[]> = {};
  const errors: string[] = [];

  // Generate questions for each category
  // Process in parallel with a small batch size to avoid rate limits
  const batchSize = 2;
  
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (cat: { name: string; expert: string }) => {
      try {
        // Use first player name for the prompts (they all see the same questions)
        const questions = await generateQuestions(cat.name, players[0], cat.expert);
        return { category: cat.name, questions, success: true };
      } catch (error) {
        console.error(`[API] Failed to generate for ${cat.name}:`, error);
        return { 
          category: cat.name, 
          questions: getFallbackQuestions(cat.name, players[0]), 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
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

// Fallback questions if AI fails
function getFallbackQuestions(category: string, playerName: string): TriviaQuestion[] {
  return [100, 200, 300, 400].map(difficulty => ({
    originalCategory: category,
displayCategory: category,
    displayCategory: category, // Use same name for fallback
    difficulty: difficulty as 100 | 200 | 300 | 400,
    questionText: `Here's a ${difficulty}-point question about ${category}. What's something interesting about this topic?`,
    rangeText: `We'll be generous with this one, ${playerName}.`,
    answer: {
      display: "Ask the group to decide!",
      acceptable: ["any reasonable answer", "group consensus"]
    }
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
