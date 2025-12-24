'use client';

import { useState, useCallback } from 'react';
import { TriviaQuestion } from '@/app/lib/aiQuestionEngine';

interface UseAIQuestionsResult {
  questions: Map<string, TriviaQuestion[]>;
  loading: boolean;
  error: string | null;
  generateForCategory: (category: string, playerName: string, expertName: string) => Promise<TriviaQuestion[]>;
  getQuestion: (category: string, difficulty: 100 | 200 | 300 | 400) => TriviaQuestion | null;
  preGenerateAll: (categories: { name: string; expert: string }[], playerName: string) => Promise<void>;
  clearCache: () => void;
}

export function useAIQuestions(): UseAIQuestionsResult {
  const [questions, setQuestions] = useState<Map<string, TriviaQuestion[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate questions for a single category
  const generateForCategory = useCallback(async (
    category: string,
    playerName: string,
    expertName: string
  ): Promise<TriviaQuestion[]> => {
    // Check if already cached
    if (questions.has(category)) {
      console.log(`[useAIQuestions] Cache hit: ${category}`);
      return questions.get(category)!;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, playerName, expertName }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      const newQuestions = data.questions as TriviaQuestion[];

      // Update cache
      setQuestions(prev => {
        const updated = new Map(prev);
        updated.set(category, newQuestions);
        return updated;
      });

      console.log(`[useAIQuestions] Generated ${newQuestions.length} questions for: ${category}`);
      return newQuestions;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error(`[useAIQuestions] Error:`, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [questions]);

  // Get a specific question from cache
  const getQuestion = useCallback((
    category: string,
    difficulty: 100 | 200 | 300 | 400
  ): TriviaQuestion | null => {
    const categoryQuestions = questions.get(category);
    if (!categoryQuestions) return null;
    return categoryQuestions.find(q => q.difficulty === difficulty) || null;
  }, [questions]);

  // Pre-generate questions for all categories
  const preGenerateAll = useCallback(async (
    categories: { name: string; expert: string }[],
    playerName: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    console.log(`[useAIQuestions] Pre-generating for ${categories.length} categories`);

    try {
      // Generate in batches to avoid overwhelming the API
      const batchSize = 2;
      
      for (let i = 0; i < categories.length; i += batchSize) {
        const batch = categories.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(cat => generateForCategory(cat.name, playerName, cat.expert))
        );

        // Small delay between batches
        if (i + batchSize < categories.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      console.log(`[useAIQuestions] Pre-generation complete`);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error(`[useAIQuestions] Pre-generation error:`, err);
    } finally {
      setLoading(false);
    }
  }, [generateForCategory]);

  // Clear the cache
  const clearCache = useCallback(() => {
    setQuestions(new Map());
    setError(null);
    console.log(`[useAIQuestions] Cache cleared`);
  }, []);

  return {
    questions,
    loading,
    error,
    generateForCategory,
    getQuestion,
    preGenerateAll,
    clearCache,
  };
}

