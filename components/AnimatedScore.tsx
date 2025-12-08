'use client';

import { useState, useEffect } from 'react';

interface AnimatedScoreProps {
  value: number;
  className?: string;
  showPlus?: boolean;
  newPoints?: number;
}

export default function AnimatedScore({
  value,
  className = '',
  showPlus = false,
  newPoints
}: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      const startValue = displayValue;
      const endValue = value;
      const duration = 1000; // 1 second
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);
        
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value, displayValue]);

  return (
    <div className={`relative ${className}`}>
      <span className={isAnimating ? 'animate-scoreCount' : ''}>
        {displayValue}
      </span>
      {showPlus && newPoints && newPoints > 0 && (
        <span className="absolute -top-4 right-0 text-[#D4A574] font-bold text-sm animate-slideUp">
          +{newPoints}
        </span>
      )}
    </div>
  );
}

