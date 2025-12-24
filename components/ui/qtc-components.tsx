/**
 * QTC GAMES - COMPONENT LIBRARY
 * Steampunk Holiday Edition
 * 
 * Reusable components following The Quality Time Company brand aesthetic:
 * - Brass/copper metallics
 * - Industrial mechanical elements
 * - Deep shadows and 3D depth
 * - Holiday theming
 */

// Module exports

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

// ============================================================================
// BUTTONS
// ============================================================================

interface BrassButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'holiday';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Primary brass button with embossed effect
 * Usage: Main CTAs, important actions
 */
export function BrassButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}: BrassButtonProps) {
  const sizeClasses = {
    sm: 'px-6 py-3 text-sm',
    md: 'px-10 py-4 text-base',
    lg: 'px-12 py-5 text-lg',
  };

  const variantClasses = {
    primary: 'bg-brass-gradient shadow-brass border-2 border-qtc-brass-light/30 text-qtc-black',
    secondary: 'bg-copper-gradient shadow-copper border-2 border-qtc-orange/30 text-qtc-cream',
    holiday: 'bg-holiday-gradient shadow-glow-orange border-2 border-qtc-holiday-gold/40 text-qtc-cream',
  };

  return (
    <motion.button
      className={`
        font-heading font-bold rounded-lg
        shadow-emboss
        relative overflow-hidden
        transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.96 }}
      {...props}
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-scanline pointer-events-none" />
      
      {/* Rivet decorations */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-qtc-black/40 shadow-rivet" />
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-qtc-black/40 shadow-rivet" />
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-qtc-black/40 shadow-rivet" />
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-qtc-black/40 shadow-rivet" />
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

/**
 * Ghost button with brass border
 * Usage: Secondary actions, cancel buttons
 */
export function GhostButton({ 
  children, 
  className = '',
  ...props 
}: HTMLMotionProps<"button">) {
  return (
    <motion.button
      className={`
        px-8 py-3 
        font-body font-medium
        border-2 border-qtc-brass
        text-qtc-brass
        rounded-lg
        bg-qtc-black/50
        backdrop-blur-sm
        transition-all duration-200
        hover:bg-qtc-brass/10 hover:border-qtc-brass-light
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ============================================================================
// CARDS & CONTAINERS
// ============================================================================

interface GameCardProps {
  children: ReactNode;
  variant?: 'brass' | 'copper' | 'teal' | 'dark';
  className?: string;
}

/**
 * Main game card with metallic border and depth
 * Usage: Question cards, player cards, content containers
 */
export function GameCard({
  children,
  variant = 'brass',
  className = ''
}: GameCardProps) {
  const variantStyles = {
    brass: 'border-qtc-brass bg-qtc-charcoal',
    copper: 'border-qtc-copper bg-qtc-charcoal',
    teal: 'border-qtc-teal bg-qtc-charcoal',
    dark: 'border-qtc-cream/20 bg-qtc-black',
  };

  return (
    <div className={`
      relative
      border-4 ${variantStyles[variant]}
      rounded-xl
      shadow-deep
      overflow-hidden
      ${className}
    `}>
      {/* Corner gears decoration */}
      <div className="absolute top-0 left-0 w-8 h-8">
        <svg viewBox="0 0 32 32" className="w-full h-full fill-qtc-brass/20">
          <circle cx="16" cy="16" r="12" />
          <circle cx="16" cy="16" r="6" fill="currentColor" />
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <rect
              key={i}
              x="14"
              y="4"
              width="4"
              height="8"
              fill="currentColor"
              transform={`rotate(${angle} 16 16)`}
            />
          ))}
        </svg>
      </div>
      
      {/* Noise texture */}
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-30" />
      
      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
      
      {/* Rivets in corners */}
      <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-qtc-brass-dark shadow-rivet" />
      <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-qtc-brass-dark shadow-rivet" />
      <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-qtc-brass-dark shadow-rivet" />
      <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-qtc-brass-dark shadow-rivet" />
    </div>
  );
}

/**
 * Gauge-style panel for displaying information
 * Usage: Score displays, status panels
 */
export function GaugePanel({ 
  label, 
  value,
  unit = '',
  className = '' 
}: { 
  label: string; 
  value: string | number;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={`
      relative
      bg-qtc-charcoal
      border-2 border-qtc-copper
      rounded-lg
      p-4
      shadow-copper
      ${className}
    `}>
      {/* Top indicator light */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
        <div className="w-4 h-4 rounded-full bg-qtc-orange shadow-glow-orange animate-pulse-glow" />
      </div>
      
      <div className="text-center">
        <div className="font-mono text-xs text-qtc-copper-light uppercase tracking-widest mb-1">
          {label}
        </div>
        <div className="font-heading text-3xl text-qtc-brass-light font-bold">
          {value}
          {unit && <span className="text-lg ml-1 text-qtc-brass">{unit}</span>}
        </div>
      </div>
      
      {/* Meter lines decoration */}
      <div className="absolute bottom-2 left-4 right-4 h-1 bg-qtc-brass/20 rounded-full">
        <div className="h-full bg-brass-gradient rounded-full" style={{ width: '60%' }} />
      </div>
    </div>
  );
}

// ============================================================================
// INPUTS
// ============================================================================

interface BrassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/**
 * Metallic-themed input field
 * Usage: Player names, text entry
 */
export function BrassInput({ 
  label,
  className = '',
  ...props 
}: BrassInputProps) {
  return (
    <div className="relative">
      {label && (
        <label className="block font-mono text-xs text-qtc-brass uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`
            w-full
            px-4 py-3
            bg-qtc-black/80
            border-2 border-qtc-brass/50
            rounded-lg
            font-body text-qtc-cream
            placeholder-qtc-brass/40
            focus:outline-none
            focus:border-qtc-brass
            focus:shadow-brass
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
        {/* Corner brackets decoration */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-qtc-copper rounded-tl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-qtc-copper rounded-tr" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-qtc-copper rounded-bl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-qtc-copper rounded-br" />
      </div>
    </div>
  );
}

// ============================================================================
// DECORATIVE ELEMENTS
// ============================================================================

/**
 * Animated gear decoration
 * Usage: Loading states, page transitions, decoration
 */
export function Gear({ 
  size = 'md',
  speed = 'normal',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const speedClasses = {
    slow: 'animate-spin-slow',
    normal: 'animate-spin',
    fast: 'animate-spin duration-2000',
  };

  return (
    <div className={`${sizeClasses[size]} ${speedClasses[speed]} ${className}`}>
      <svg viewBox="0 0 64 64" className="w-full h-full fill-qtc-brass">
        <circle cx="32" cy="32" r="20" />
        <circle cx="32" cy="32" r="10" fill="currentColor" className="fill-qtc-black" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <rect
            key={i}
            x="28"
            y="8"
            width="8"
            height="16"
            rx="2"
            fill="currentColor"
            transform={`rotate(${angle} 32 32)`}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Steam/smoke effect overlay
 * Usage: Atmospheric effects, transitions
 */
export function SteamEffect({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute bottom-0 w-32 h-32 bg-gradient-radial from-white/10 to-transparent rounded-full blur-xl animate-steam"
          style={{
            left: `${i * 20}%`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Holiday garland decoration
 * Usage: Header decoration for holiday edition
 */
export function HolidayGarland({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full animate-pulse-glow ${
            i % 3 === 0 ? 'bg-qtc-holiday-red shadow-[0_0_10px_rgba(196,30,58,0.8)]' :
            i % 3 === 1 ? 'bg-qtc-holiday-green shadow-[0_0_10px_rgba(22,91,51,0.8)]' :
            'bg-qtc-holiday-gold shadow-[0_0_10px_rgba(255,182,39,0.8)]'
          }`}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// LAYOUTS
// ============================================================================

/**
 * Main page layout with steampunk background
 * Usage: Wrap all pages for consistent styling
 */
export function SteampunkLayout({ 
  children,
  variant = 'dark',
  showGears = true,
  className = '' 
}: {
  children: ReactNode;
  variant?: 'dark' | 'copper' | 'holiday';
  showGears?: boolean;
  className?: string;
}) {
  const backgroundStyles = {
    dark: 'bg-qtc-black',
    copper: 'bg-gradient-to-br from-qtc-black via-qtc-charcoal to-qtc-slate',
    holiday: 'bg-gradient-to-br from-qtc-black via-qtc-holiday-red/20 to-qtc-holiday-green/20',
  };

  return (
    <div className={`min-h-screen ${backgroundStyles[variant]} relative overflow-hidden ${className}`}>
      {/* Background texture */}
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-scanline pointer-events-none" />
      
      {/* Decorative gears */}
      {showGears && (
        <>
          <div className="absolute top-10 left-10 opacity-10">
            <Gear size="lg" speed="slow" />
          </div>
          <div className="absolute bottom-20 right-20 opacity-10">
            <Gear size="md" speed="slow" className="rotate-45" />
          </div>
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export const QTCComponents = {
  // Buttons
  BrassButton,
  GhostButton,
  
  // Cards
  GameCard,
  GaugePanel,
  
  // Inputs
  BrassInput,
  
  // Decorative
  Gear,
  SteamEffect,
  HolidayGarland,
  
  // Layouts
  SteampunkLayout,
};
