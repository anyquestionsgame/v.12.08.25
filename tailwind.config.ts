import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Brand Colors (from logo & sizzle)
        qtc: {
          // Backgrounds
          black: "#0A0A0A",           // Deep black (primary bg)
          charcoal: "#1A1A1A",        // Lighter black (secondary bg)
          slate: "#2C3539",           // Dark slate (tertiary bg)
          
          // Metallics - Primary Palette
          cream: "#F5E6D3",           // Ivory/cream (from logo)
          brass: {
            light: "#D4AF37",         // Light brass/gold
            DEFAULT: "#B8860B",       // Standard brass
            dark: "#8B6914",          // Dark brass
          },
          copper: {
            light: "#E85D04",         // Light copper/orange
            DEFAULT: "#CD7F32",       // Standard copper
            dark: "#A55828",          // Dark copper
          },
          bronze: {
            light: "#CD9575",         // Light bronze
            DEFAULT: "#B87333",       // Standard bronze
            dark: "#8B5A3C",          // Dark bronze
          },
          
          // Accent Colors
          orange: "#FF6B35",          // Vibrant orange (logo accent)
          teal: "#2A9D8F",            // Teal accent (gauge detail)
          patina: "#82A0AA",          // Blue-green patina
          
          // Holiday Colors
          holiday: {
            red: "#C41E3A",           // Deep cranberry
            green: "#165B33",         // Forest green
            gold: "#FFB627",          // Bright gold
            snow: "#F8F9FA",          // Snow white
          },
          
          // Functional Colors
          steam: "rgba(255, 255, 255, 0.1)",  // Steam/smoke overlay
          glow: "rgba(255, 107, 53, 0.3)",    // Orange glow
          shadow: "rgba(0, 0, 0, 0.6)",       // Deep shadows
        },
      },
      
      fontFamily: {
        // Keep your existing fonts - they work well
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        
        // Alternative display font options (if you want more character)
        display: ["Bebas Neue", "Impact", "sans-serif"],  // For big bold headings
        tech: ["Orbitron", "monospace"],                   // For number displays
      },
      
      letterSpacing: {
        tight: "-0.02em",
        wider: "0.05em",
        widest: "0.15em",
      },
      
      boxShadow: {
        // Steampunk depth effects
        'emboss': 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3)',
        'deboss': 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(255,255,255,0.1)',
        'brass': '0 4px 12px rgba(212, 175, 55, 0.4), 0 2px 4px rgba(0,0,0,0.3)',
        'copper': '0 4px 12px rgba(255, 107, 53, 0.4), 0 2px 4px rgba(0,0,0,0.3)',
        'glow-orange': '0 0 20px rgba(255, 107, 53, 0.5), 0 0 40px rgba(255, 107, 53, 0.2)',
        'glow-brass': '0 0 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.2)',
        'rivet': 'inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.2)',
        'deep': '0 8px 24px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)',
      },
      
      backgroundImage: {
        // Gradients for metallic effects
        'brass-gradient': 'linear-gradient(135deg, #D4AF37 0%, #B8860B 50%, #8B6914 100%)',
        'copper-gradient': 'linear-gradient(135deg, #E85D04 0%, #CD7F32 50%, #A55828 100%)',
        'bronze-gradient': 'linear-gradient(135deg, #CD9575 0%, #B87333 50%, #8B5A3C 100%)',
        'teal-gradient': 'linear-gradient(135deg, #2A9D8F 0%, #1E7A6E 50%, #155A4F 100%)',
        'holiday-gradient': 'linear-gradient(135deg, #C41E3A 0%, #165B33 50%, #FFB627 100%)',
        
        // Texture overlays
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\")",
        'scanline': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
      },
      
      borderRadius: {
        'rivet': '50%',
        'gear': '4px',
      },
      
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'steam': 'steam 3s ease-in-out infinite',
        'flicker': 'flicker 0.15s ease-in-out',
      },
      
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)',
            opacity: '1'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(255, 107, 53, 0.6)',
            opacity: '0.9'
          },
        },
        'steam': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0.1' },
          '50%': { transform: 'translateY(-20px) scale(1.1)', opacity: '0.15' },
          '100%': { transform: 'translateY(-40px) scale(1.2)', opacity: '0' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
