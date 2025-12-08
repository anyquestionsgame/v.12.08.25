// TRIVIA ENGINE
// Based on Core Generation Document rules

export type SavageryLevel = 'gentle' | 'standard' | 'brutal';
export type StealType = 'expert' | 'community';

// EXPERTISE → ADJACENT TOPICS MAPPING
// Column B from Master Game Library (6-degrees adjacent, never direct)

interface ExpertiseMapping {
  expertise: string;
  adjacentTopics: string[];
  categoryName: string; // The surprising category name
}

export const EXPERTISE_MAP: ExpertiseMapping[] = [
  {
    expertise: "Reality TV",
    adjacentTopics: [
      "TV shows", "celebrity marriages", "dating statistics",
      "social media drama", "production secrets", "network history",
      "streaming wars", "celebrity divorces", "influencer culture"
    ],
    categoryName: "Rose Ceremony Drama"
  },
  {
    expertise: "Pottery",
    adjacentTopics: [
      "Ghost movie", "ceramics", "clay temperatures", "art history",
      "ancient civilizations", "craft fairs", "DIY culture",
      "pottery wheels", "kilns", "archaeological finds"
    ],
    categoryName: "Wheel Spinning"
  },
  {
    expertise: "Pop Culture",
    adjacentTopics: [
      "Music videos", "celebrity insurance", "social media stats",
      "streaming services", "viral moments", "award shows",
      "celebrity net worth", "fashion fails", "memes"
    ],
    categoryName: "Main Character Energy"
  },
  {
    expertise: "Sci-Fi Books",
    adjacentTopics: [
      "Movie adaptations", "future predictions", "space facts",
      "author trivia", "dystopian themes", "technology terms",
      "cult classics", "convention culture", "physics concepts"
    ],
    categoryName: "Dystopian Predictions"
  },
  {
    expertise: "British Crime",
    adjacentTopics: [
      "Detective shows", "BBC productions", "murder statistics",
      "British slang", "procedural formats", "streaming imports",
      "accent types", "UK geography"
    ],
    categoryName: "Proper Murder"
  },
  {
    expertise: "Conspiracy Theories",
    adjacentTopics: [
      "Moon landing", "UFO sightings", "government secrets",
      "urban legends", "internet mysteries", "documentary subjects",
      "historical cover-ups", "cryptids"
    ],
    categoryName: "Tinfoil Hat Hour"
  },
  {
    expertise: "Excel",
    adjacentTopics: [
      "Office Space movie", "workplace comedy", "corporate culture",
      "keyboard shortcuts", "Microsoft history", "office pranks",
      "productivity stats", "work-from-home"
    ],
    categoryName: "Office Space Meltdowns"
  },
  {
    expertise: "Wine",
    adjacentTopics: [
      "Pretentious restaurant moments", "sommelier culture",
      "French regions", "grape varieties", "wine pairing",
      "cork vs screw cap debates", "wine snob vocabulary"
    ],
    categoryName: "Pretentious Sips"
  }
];

// QUESTION TEMPLATES
// Easy = Google-able in 10 seconds
// Hard = Need actual knowledge

interface TriviaQuestion {
  easy: {
    question: string;
    answer: string;
    acceptableAnswers?: string[];
  };
  hard: {
    question: string;
    answer: string;
    acceptableAnswers?: string[];
  };
}

// EXPERT STEAL QUESTIONS (use expertise only, no location)
export function generateExpertStealQuestions(
  expertise: string,
  expertName: string
): TriviaQuestion | null {
  const mapping = EXPERTISE_MAP.find(
    e => e.expertise.toLowerCase() === expertise.toLowerCase()
  );
  
  if (!mapping) {
    // Fallback for unknown expertise
    return {
      easy: {
        question: `What is ${expertise}?`,
        answer: "See expert for acceptable answer"
      },
      hard: {
        question: `Name an advanced concept in ${expertise}`,
        answer: "See expert for acceptable answer"
      }
    };
  }
  
  // Generate questions based on adjacent topics
  // These are templates - in full version would pull from question bank
  return {
    easy: {
      question: `In the world of ${mapping.categoryName}, what's the most basic thing everyone knows?`,
      answer: `Expert ${expertName} will verify`,
      acceptableAnswers: []
    },
    hard: {
      question: `What's something only a ${expertise} expert would know about ${mapping.adjacentTopics[0]}?`,
      answer: `Expert ${expertName} will verify`,
      acceptableAnswers: []
    }
  };
}

// COMMUNITY STEAL QUESTIONS (CAN use location + shared interests)
export function generateCommunityStealQuestions(
  location?: string,
  sharedInterests?: string[]
): TriviaQuestion {
  if (location) {
    // Extract city name (before comma if formatted as "City, State")
    const cityName = location.split(',')[0].trim();
    
    const locationQuestions = [
      {
        easy: {
          question: `What's the most famous landmark in ${cityName}?`,
          answer: "Group decides - must be verifiable"
        },
        hard: {
          question: `What year was ${cityName} officially founded?`,
          answer: "Google-verifiable - closest answer wins"
        }
      },
      {
        easy: {
          question: `What's the best restaurant in ${cityName}?`,
          answer: "Group vote - most agreed answer"
        },
        hard: {
          question: `What's ${cityName}'s population? (Closest wins)`,
          answer: "Google-verifiable"
        }
      },
      {
        easy: {
          question: `Name a famous person from ${cityName}`,
          answer: "Any correct answer accepted"
        },
        hard: {
          question: `What's the area code for ${cityName}?`,
          answer: "Exact match required"
        }
      }
    ];
    
    // Random selection
    return locationQuestions[Math.floor(Math.random() * locationQuestions.length)];
  }
  
  // Fallback: generic community questions
  return {
    easy: {
      question: "What's something everyone in this room has in common?",
      answer: "Group decides"
    },
    hard: {
      question: "What's the combined age of everyone playing?",
      answer: "Calculate total"
    }
  };
}

// ROUND-BASED DISTRIBUTION
// Odd rounds = Expert Steal
// Even rounds = Community Steal
export function determineStealType(roundNumber: number): StealType {
  return roundNumber % 2 === 1 ? 'expert' : 'community';
}

// SCORING
export interface TriviaScoring {
  easy: number;      // 1 point
  hard: number;      // 3 points
  steal: number;     // 2 points (both types)
}

export const TRIVIA_SCORING: TriviaScoring = {
  easy: 1,
  hard: 3,
  steal: 2
};

// CARD GENERATION
export interface TriviaCard {
  turnNumber: number;
  reader: string;
  answerer: string;
  stealType: StealType;
  expert?: string;
  category: string;
  questions: TriviaQuestion;
}

export function generateTriviaCard(
  turnNumber: number,
  players: Array<{name: string, expertise: string, ratherDieThan: string}>,
  location?: string
): TriviaCard {
  const playerCount = players.length;
  const roundNumber = Math.ceil(turnNumber / playerCount);
  const playerIndex = ((turnNumber - 1) % playerCount);
  const nextPlayerIndex = (playerIndex + 1) % playerCount;
  
  const reader = players[playerIndex];
  const answerer = players[nextPlayerIndex];
  const stealType = determineStealType(roundNumber);
  
  if (stealType === 'expert') {
    // Expert Steal: Pick expertise from someone who ISN'T reader or answerer
    const availableExperts = players.filter(
      p => p.name !== reader.name && p.name !== answerer.name
    );
    
    if (availableExperts.length === 0) {
      // Fallback: use reader's expertise but answerer can't steal
      const questions = generateExpertStealQuestions(
        reader.expertise,
        reader.name
      );
      
      return {
        turnNumber,
        reader: reader.name,
        answerer: answerer.name,
        stealType,
        expert: reader.name,
        category: reader.expertise,
        questions: questions || {
          easy: { question: "Fallback", answer: "See expert" },
          hard: { question: "Fallback hard", answer: "See expert" }
        }
      };
    }
    
    // Random expert from available pool
    const expert = availableExperts[
      Math.floor(Math.random() * availableExperts.length)
    ];
    
    const questions = generateExpertStealQuestions(
      expert.expertise,
      expert.name
    );
    
    return {
      turnNumber,
      reader: reader.name,
      answerer: answerer.name,
      stealType,
      expert: expert.name,
      category: expert.expertise,
      questions: questions || {
        easy: { question: "Fallback", answer: "See expert" },
        hard: { question: "Fallback hard", answer: "See expert" }
      }
    };
    
  } else {
    // Community Steal: Can use location
    const questions = generateCommunityStealQuestions(location);
    
    return {
      turnNumber,
      reader: reader.name,
      answerer: answerer.name,
      stealType,
      category: "Community Knowledge",
      questions
    };
  }
}

// VALIDATION
export function validateAnswer(
  givenAnswer: string,
  correctAnswer: string,
  acceptableAnswers: string[] = []
): boolean {
  const normalized = givenAnswer.toLowerCase().trim();
  const correctNormalized = correctAnswer.toLowerCase().trim();
  
  if (normalized === correctNormalized) return true;
  
  return acceptableAnswers.some(
    acceptable => acceptable.toLowerCase().trim() === normalized
  );
}

// Export for testing/debugging
export { TriviaQuestion };

