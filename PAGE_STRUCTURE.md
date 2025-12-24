# Page Structure & Routing Guide

## Complete Page List

### Root Pages
1. **`/` (Home)** - `app/page.tsx`
   - Intro sequence with studio logo and title
   - Main landing page with "START NEW GAME" button
   - Testing mode toggle
   - Redirects to `/setup` or `/test-setup` based on mode

### Setup Flow
2. **`/setup`** - `app/setup/page.tsx`
   - Select number of players (3-8)
   - Redirects to `/onboarding?players={count}`

3. **`/onboarding`** - `app/onboarding/page.tsx`
   - Multi-step player onboarding:
     - **Intro**: Welcome screen
     - **Questions**: Collect player info (name, good at, rather die than) with 60s timer
     - **Savagery**: Choose game intensity (gentle/standard/brutal)
     - **Location**: Optional location detection or manual entry
   - Redirects to `/games` after completion

4. **`/games`** - `app/games/page.tsx`
   - Select which games to play
   - Available games:
     - **That's So You** (`/play`) - Essence game
     - **Most Likely To** (`/play/most-likely-to`)
     - **Come Thru** (`/play/come-thru`)
     - **Performance** (`/play/performance`)
     - **Trivia** (`/play/trivia`)
   - Creates game session and navigates to first selected game

### Game Pages
5. **`/play`** - `app/play/page.tsx`
   - **That's So You** game
   - Essence-based prompts (e.g., "Netflix category", "Trader Joe's product")
   - Players answer what the subject player is
   - Scoring based on creativity and accuracy
   - Phases: transition → intro → collecting → picking → reveal → final

6. **`/play/most-likely-to`** - `app/play/most-likely-to/page.tsx`
   - **Most Likely To** game
   - Prompts like "Most likely to have a secret plant graveyard"
   - Players point to who fits the prompt
   - Phases: transition → intro → countdown → voting → reveal → final

7. **`/play/come-thru`** - `app/play/come-thru/page.tsx`
   - **Come Thru** game
   - Scenario-based prompts (e.g., "Needed someone to pretend to be their therapist's reference")
   - Players answer who would come through in that scenario
   - Phases: transition → intro → collecting → picking → reveal → final

8. **`/play/performance`** - `app/play/performance/page.tsx`
   - **Performance** game
   - Multi-type game: drawing, acting, charades, etc.
   - Different prompts based on performance type
   - Phases: transition → intro → clue → performing → scoring → final

9. **`/play/trivia`** - `app/play/trivia/page.tsx`
   - **Trivia** game
   - Category-based trivia questions
   - Players select answers
   - Phases: transition → selection → question → answer → reveal → final

### Final Pages
10. **`/final-scores`** - `app/final-scores/page.tsx`
    - Final scoreboard with all game results
    - Shows winners with confetti animation
    - Game-by-game breakdown
    - Options to play again or start new game

### Testing/Development
11. **`/test-setup`** - `app/test-setup/page.tsx`
    - Quick test mode setup
    - Generates test players automatically
    - Allows quick game testing without full onboarding

### Error Pages
12. **`/error`** - `app/error.tsx`
    - Error boundary for runtime errors
    - Uses ErrorState component

13. **`/not-found`** - `app/not-found.tsx`
    - 404 page
    - Uses ErrorState component

14. **`/global-error`** - `app/global-error.tsx`
    - Global error boundary for root layout errors

---

## Routing Flow

```
┌─────────────────┐
│   / (Home)      │
│  Landing Page  │
└────────┬────────┘
         │
         ├─→ /setup (Select Players)
         │         │
         │         └─→ /onboarding?players={N}
         │                      │
         │                      └─→ /games (Select Games)
         │                                 │
         │                                 └─→ /play/* (Game Routes)
         │                                            │
         │                                            ├─→ /play (That's So You)
         │                                            ├─→ /play/most-likely-to
         │                                            ├─→ /play/come-thru
         │                                            ├─→ /play/performance
         │                                            └─→ /play/trivia
         │                                                      │
         │                                                      └─→ /final-scores
         │                                                                 │
         │                                                                 └─→ /games (Play Again)
         │
         └─→ /test-setup (Testing Mode)
                    │
                    └─→ /play/* (Same game flow)
```

## Game Flow Pattern

All game pages follow a similar pattern:

1. **SessionGuard** - Validates game session exists
2. **Load Session** - Gets players, scores, current game state
3. **Game Phases**:
   - `transition` - Transition screen between games
   - `intro` - Game introduction
   - `[game-specific phases]` - Gameplay
   - `final` - Round/game completion
4. **Score Update** - Updates session with game scores
5. **Advance** - Moves to next game or final scores
6. **Navigation**:
   - If more games → Next game route
   - If all complete → `/final-scores` (or `/test-setup` in test mode)
   - Error → `/games` or `/setup`

## Key Components

### Guards
- **SessionGuard** - Protects pages that require a valid game session
- **PlayersGuard** - Ensures players exist before rendering

### Shared Components
- **Loading** - Loading state
- **ErrorState** - Error display
- **AnimatedScore** - Score animations
- **Confetti** - Winner celebration
- **Toast** - Notifications
- **NavigationHelper** - Keyboard navigation helpers

## Data Flow

1. **localStorage** - Stores:
   - `qtc_testing_mode` - Testing mode flag
   - `qtc_savagery` - Savagery level
   - `qtc_location` - Location
   - `qtc_intro_shown` - Intro shown flag (sessionStorage)
   - `qtc_session` - Full game session (via gameOrchestrator)

2. **Game Session** - Managed by `gameOrchestrator.ts`:
   - Players array
   - Selected games
   - Current game index
   - Scores per game
   - Savagery level
   - Location

## Game Types

Defined in `app/lib/gameOrchestrator.ts`:
- `thatsSoYou` → `/play`
- `mostLikelyTo` → `/play/most-likely-to`
- `comeThru` → `/play/come-thru`
- `performance` → `/play/performance`
- `trivia` → `/play/trivia`

## Special Features

### Testing Mode
- Toggle on home page (bottom left)
- Uses `/test-setup` instead of full onboarding
- Generates test players automatically
- Returns to `/test-setup` instead of `/final-scores` when complete

### Savagery Levels
- **Gentle** - Family-friendly prompts
- **Standard** - Mild roasting
- **Brutal** - Edgy, for close friends

### Location Detection
- Optional GPS-based location detection
- Uses BigDataCloud reverse geocoding API
- Falls back to manual entry

