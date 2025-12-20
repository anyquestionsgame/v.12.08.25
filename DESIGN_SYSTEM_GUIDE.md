# THE QUALITY TIME CO. - DESIGN SYSTEM
**Steampunk Holiday Edition**

## 🎯 Design Philosophy

The QTC aesthetic combines:
- **Victorian steampunk** - brass, copper, industrial machinery
- **Analog gaming** - tactile, mechanical, vintage feel
- **Holiday warmth** - festive reds, greens, and golds
- **Elder millennial cool** - playful but sophisticated

---

## 🎨 Color System

### Core Palette

**Backgrounds:**
```
qtc-black      #0A0A0A    Primary background (deep black)
qtc-charcoal   #1A1A1A    Secondary surfaces
qtc-slate      #2C3539    Tertiary surfaces
```

**Metallics (Primary):**
```
qtc-cream              #F5E6D3    Text on dark backgrounds
qtc-brass-light        #D4AF37    Highlights, accents
qtc-brass              #B8860B    Primary brass
qtc-brass-dark         #8B6914    Shadows, depth
qtc-copper-light       #E85D04    Warm accents
qtc-copper             #CD7F32    Secondary metallic
qtc-copper-dark        #A55828    Depth
qtc-bronze-light       #CD9575    Tertiary metallic
qtc-bronze             #B87333    
qtc-bronze-dark        #8B5A3C    
```

**Accent Colors:**
```
qtc-orange     #FF6B35    Logo accent, CTAs
qtc-teal       #2A9D8F    Gauge details
qtc-patina     #82A0AA    Aged copper feel
```

**Holiday Palette:**
```
qtc-holiday-red    #C41E3A    Cranberry red
qtc-holiday-green  #165B33    Forest green
qtc-holiday-gold   #FFB627    Bright gold
qtc-holiday-snow   #F8F9FA    White highlights
```

### Color Usage Guidelines

| Element | Color | Example |
|---------|-------|---------|
| Page backgrounds | `qtc-black` | Main app background |
| Content cards | `qtc-charcoal` | Game cards, panels |
| Primary CTAs | `bg-brass-gradient` | "Start Game" button |
| Secondary CTAs | `bg-copper-gradient` | "Continue" button |
| Text on dark | `qtc-cream` | Body text |
| Headings | `qtc-brass-light` | Page titles |
| Borders | `qtc-brass` | Card borders |
| Input fields | `qtc-black` bg + `qtc-brass` border | Player name inputs |

---

## 📝 Typography

### Font Stack
```
font-heading    Space Grotesk    Titles, buttons, emphasis
font-body       Inter            Body text, UI elements  
font-mono       JetBrains Mono   Code, technical displays
font-display    Bebas Neue       Big impact headings (optional)
font-tech       Orbitron         Number displays (optional)
```

### Type Scale
```
text-xs      12px    Labels, captions
text-sm      14px    Secondary text
text-base    16px    Body text
text-lg      18px    Emphasized text
text-xl      20px    Subheadings
text-2xl     24px    Card titles
text-3xl     30px    Section headings
text-4xl     36px    Page titles
text-5xl     48px    Hero text
text-6xl     60px    Display text
```

### Usage Examples
```tsx
// Page title
<h1 className="font-heading text-5xl font-bold text-qtc-brass-light">
  Any Questions?
</h1>

// Card title
<h2 className="font-heading text-2xl text-qtc-cream">
  Round 1: Most Likely To
</h2>

// Body text
<p className="font-body text-base text-qtc-cream/80">
  Select the player most likely to...
</p>

// Number display
<div className="font-mono text-4xl text-qtc-orange">
  +15
</div>

// Label
<span className="font-mono text-xs text-qtc-copper uppercase tracking-widest">
  Score
</span>
```

---

## 🔘 Component Patterns

### Buttons

**Primary Brass Button** (Main CTAs)
```tsx
<BrassButton variant="primary" size="lg">
  Start Game
</BrassButton>
```

**Copper Button** (Secondary actions)
```tsx
<BrassButton variant="secondary" size="md">
  Continue
</BrassButton>
```

**Holiday Button** (Special holiday edition actions)
```tsx
<BrassButton variant="holiday" size="md">
  🎄 Play Holiday Edition
</BrassButton>
```

**Ghost Button** (Tertiary actions, cancel)
```tsx
<GhostButton>
  Cancel
</GhostButton>
```

### Cards & Containers

**Game Card** (Questions, content)
```tsx
<GameCard variant="brass">
  <h3 className="text-qtc-brass-light mb-4">Question</h3>
  <p className="text-qtc-cream">Who is most likely to...</p>
</GameCard>
```

**Gauge Panel** (Scores, stats)
```tsx
<GaugePanel 
  label="Current Score"
  value={125}
  unit="pts"
/>
```

### Inputs

**Text Input**
```tsx
<BrassInput
  label="Player Name"
  placeholder="Enter name..."
  value={playerName}
  onChange={(e) => setPlayerName(e.target.value)}
/>
```

---

## ✨ Visual Effects

### Shadows & Depth

```tsx
// Embossed (raised element)
className="shadow-emboss"

// Debossed (pressed element)
className="shadow-deboss"

// Brass glow
className="shadow-brass"

// Copper glow
className="shadow-copper"

// Orange glow (active states)
className="shadow-glow-orange"

// Deep shadow (cards, modals)
className="shadow-deep"

// Rivet detail
className="shadow-rivet"
```

### Gradients

```tsx
// Brass metallic gradient
className="bg-brass-gradient"

// Copper gradient
className="bg-copper-gradient"

// Holiday gradient (multi-color)
className="bg-holiday-gradient"
```

### Textures

```tsx
// Subtle noise overlay
className="bg-noise opacity-30"

// Scanline effect (retro screens)
className="bg-scanline"
```

### Animations

```tsx
// Slow gear rotation
<Gear size="lg" speed="slow" />

// Pulsing glow (indicator lights)
className="animate-pulse-glow"

// Steam effect
<SteamEffect />

// Flicker (malfunction effect)
className="animate-flicker"
```

---

## 🎪 Layout Patterns

### Full Page Layout
```tsx
<SteampunkLayout variant="dark" showGears={true}>
  <div className="container mx-auto px-6 py-12">
    {/* Your content */}
  </div>
</SteampunkLayout>
```

### Page with Holiday Theme
```tsx
<SteampunkLayout variant="holiday" showGears={true}>
  <HolidayGarland className="mb-8" />
  {/* Holiday content */}
</SteampunkLayout>
```

### Centered Card Layout
```tsx
<SteampunkLayout>
  <div className="min-h-screen flex items-center justify-center p-6">
    <GameCard variant="brass" className="max-w-2xl w-full">
      {/* Content */}
    </GameCard>
  </div>
</SteampunkLayout>
```

---

## 🎮 Game-Specific Patterns

### Player Name Entry
```tsx
<div className="space-y-4">
  {playerNames.map((name, i) => (
    <BrassInput
      key={i}
      label={`Player ${i + 1}`}
      value={name}
      onChange={(e) => updateName(i, e.target.value)}
    />
  ))}
</div>
```

### Question Display
```tsx
<GameCard variant="brass">
  <div className="text-center">
    <div className="font-mono text-xs text-qtc-copper uppercase mb-2">
      Round 1 • Question 3
    </div>
    <h2 className="font-heading text-3xl text-qtc-brass-light mb-6">
      Who is most likely to win a dance competition?
    </h2>
    <div className="flex gap-4 justify-center">
      {players.map(player => (
        <BrassButton key={player} variant="secondary">
          {player}
        </BrassButton>
      ))}
    </div>
  </div>
</GameCard>
```

### Score Display
```tsx
<div className="grid grid-cols-2 gap-4">
  {players.map(player => (
    <GaugePanel
      key={player.id}
      label={player.name}
      value={player.score}
      unit="pts"
    />
  ))}
</div>
```

### Loading State
```tsx
<div className="flex items-center gap-4">
  <Gear size="md" speed="fast" />
  <span className="font-body text-qtc-brass">
    Generating questions...
  </span>
</div>
```

---

## 🎄 Holiday Edition Enhancements

### Add Holiday Decorations
```tsx
// Header with garland
<div className="mb-8">
  <HolidayGarland />
  <h1 className="font-heading text-5xl text-center text-qtc-brass-light mt-4">
    Any Questions?
  </h1>
</div>
```

### Holiday Color Accents
```tsx
// Replace brass with holiday colors for special emphasis
<BrassButton 
  variant="holiday"
  className="border-qtc-holiday-gold shadow-glow-brass"
>
  🎁 Special Holiday Round
</BrassButton>
```

### Snowfall Effect (Optional)
```tsx
// Add to layout for atmospheric snow
<div className="absolute inset-0 pointer-events-none overflow-hidden">
  {[...Array(20)].map((_, i) => (
    <div
      key={i}
      className="absolute w-2 h-2 bg-white rounded-full opacity-60 animate-[fall_10s_linear_infinite]"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 10}s`,
      }}
    />
  ))}
</div>
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Do This First)
- [x] Replace `tailwind.config.ts` with new design system
- [x] Create `/components/ui/` folder
- [x] Add `qtc-components.tsx` to components
- [ ] Update `globals.css` with base styles
- [ ] Test component library renders

### Phase 2: Page Migration (Do This Second)
- [x] Update main entry page (`page.tsx`)
- [x] Migrate player name entry screen
- [ ] Update question display screens
- [ ] Update scoring screens
- [ ] Add holiday decorations

### Phase 3: Polish (Final touches)
- [ ] Add gear animations to loading states
- [ ] Implement steam effects on transitions
- [ ] Add rivet details to cards
- [ ] Test responsive behavior
- [ ] Add holiday garland to headers

---

## 🚀 Quick Start

1. **Replace Tailwind config:**
   ```bash
   cp tailwind.config.ts tailwind.config.ts.backup
   # Copy new tailwind.config.ts from design system
   ```

2. **Add component library:**
   ```bash
   mkdir -p components/ui
   # Copy qtc-components.tsx to components/ui/
   ```

3. **Import and use:**
   ```tsx
   import { BrassButton, GameCard, SteampunkLayout } from '@/components/ui/qtc-components';
   
   export default function MyPage() {
     return (
       <SteampunkLayout>
         <GameCard variant="brass">
           <h1 className="text-qtc-brass-light">Hello QTC!</h1>
           <BrassButton variant="primary">Start Game</BrassButton>
         </GameCard>
       </SteampunkLayout>
     );
   }
   ```

---

## 🎨 Design Inspiration Reference

**From Logo:**
- Black background (#0A0A0A)
- Cream lettering (#F5E6D3)
- Orange accents (#FF6B35)
- Brass/gold gears and dials
- Industrial mechanical elements

**From Sizzle Video:**
- 3D brass/copper materials
- Steam/smoke atmospherics
- Dramatic lighting and shadows
- Rotating gears and mechanical movement
- Deep blacks with metallic highlights
- Physical depth and dimension

**Holiday Edition Additions:**
- Festive reds and greens
- Gold ornamental accents
- Garland decorations
- Warm glow effects
- Snow/frost optional

---

## 💡 Pro Tips

1. **Layering:** Build depth with multiple shadow layers
2. **Contrast:** Use cream text on black, brass on charcoal
3. **Hierarchy:** Brass for primary, copper for secondary, bronze for tertiary
4. **Motion:** Add subtle animations for life (gears, pulses, steam)
5. **Restraint:** Don't over-decorate - let metallics breathe
6. **Texture:** Subtle noise and scanlines add analog feel
7. **Holiday Balance:** Use holiday colors as accents, not primaries

---

**Need help?** Reference the component library examples or check existing game screens for patterns to follow.
