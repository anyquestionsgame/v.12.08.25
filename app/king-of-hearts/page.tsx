'use client';

/**
 * KING OF HEARTS ENTRY PAGE - REDESIGNED
 * Updated with QTC Steampunk Design System
 * 
 * Changes from original:
 * - Black background instead of cream
 * - Brass/copper color scheme
 * - BrassButton and BrassInput components
 * - SteampunkLayout wrapper
 * - Holiday garland decoration
 * - Gear loading animations
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrassButton, 
  BrassInput, 
  SteampunkLayout, 
  HolidayGarland,
  Gear 
} from '@/components/ui/qtc-components';

type Screen = 1 | 2 | 3;

export default function KingOfHeartsEntry() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<Screen>(1);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [mounted, setMounted] = useState(false);
  const [videoFadingOut, setVideoFadingOut] = useState(false);

  // Generate random animation values for title
  const titleText = "ANY QUESTIONS";
  const letterAnimations = useMemo(() => {
    return titleText.split('').map((letter, i) => {
      if (letter === ' ') return null;
      return {
        x: Math.random() * 800 - 400,
        y: -(Math.random() * 350 + 200),
        rotate: Math.random() * 2160 - 1080,
        duration: Math.random() * 0.8 + 1.0,
        delay: 0.6 + Math.random() * 0.6,
      };
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [videoError, setVideoError] = useState(false);
  
  useEffect(() => {
    if (videoError && currentScreen === 1) {
      const timer = setTimeout(() => {
        handleVideoEnd();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [videoError, currentScreen]);

  const handleVideoEnd = () => {
    setTimeout(() => {
      setVideoFadingOut(true);
      setTimeout(() => {
        setCurrentScreen(2);
      }, 500);
    }, 1000);
  };

  // Loading state
  if (!mounted) {
    return (
      <SteampunkLayout variant="dark">
        <div className="min-h-screen flex items-center justify-center">
          <Gear size="lg" speed="fast" />
        </div>
      </SteampunkLayout>
    );
  }

  const validPlayerNames = playerNames.filter(name => name.trim().length > 0);
  const canStartSetup = validPlayerNames.length >= 2;

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  };

  const handleAddPlayer = () => {
    if (playerNames.length < 8) {
      setPlayerNames([...playerNames, '']);
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (playerNames.length > 2) {
      const newNames = playerNames.filter((_, i) => i !== index);
      setPlayerNames(newNames);
    }
  };

  const handleStartSetup = () => {
    if (canStartSetup) {
      const params = new URLSearchParams();
      validPlayerNames.forEach((name, index) => {
        params.append(`p${index + 1}`, name.trim());
      });
      router.push(`/king-of-hearts/setup?${params.toString()}`);
    }
  };

  // SCREEN 1: VIDEO SPLASH
  if (currentScreen === 1) {
    return (
      <motion.div 
        className="fixed inset-0 w-full h-full bg-black"
        initial={{ opacity: 1 }}
        animate={{ opacity: videoFadingOut ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <video
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={handleVideoEnd}
          onError={(e) => {
            console.error('Video error:', e);
            setVideoError(true);
          }}
          onLoadedData={() => {
            console.log('Video loaded successfully');
            setVideoError(false);
          }}
          onCanPlay={() => {
            console.log('Video can play');
          }}
          className="w-full h-full object-cover"
        >
          <source src="/videos/quality-time-intro.mp4" type="video/mp4" />
          <source src="/videos/quality-time-intro.mov" type="video/quicktime" />
        </video>
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-qtc-black">
            <div className="text-center">
              <p className="font-body text-qtc-cream mb-4">Video failed to load</p>
              <BrassButton
                onClick={() => {
                  setVideoError(false);
                  setCurrentScreen(2);
                }}
                variant="primary"
              >
                Skip Intro
              </BrassButton>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // SCREEN 2: ANIMATED TITLE SEQUENCE
  if (currentScreen === 2) {
    return (
      <SteampunkLayout variant="copper">
        <motion.main 
          className="min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Subtle brass gradient overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-qtc-brass/5 via-transparent to-qtc-copper/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 2 }}
          />
          
          <div className="flex flex-col items-center w-full max-w-[700px] relative z-10">
            {/* WELCOME TO */}
            <motion.p 
              className="font-mono text-[18px] tracking-[0.3em] select-none uppercase text-qtc-brass"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Welcome to
            </motion.p>
            
            {/* ANY QUESTIONS - Chaotic dice drop */}
            <div className="mt-4 flex justify-center items-center flex-wrap">
              {titleText.split('').map((letter, index) => {
                if (letter === ' ') {
                  return <span key={index} className="w-3 md:w-5" />;
                }
                
                const anim = letterAnimations[index];
                if (!anim) return null;
                
                return (
                  <motion.span
                    key={index}
                    className="inline-block font-heading text-[44px] md:text-[68px] font-extrabold select-none text-qtc-brass-light"
                    style={{ 
                      textShadow: "2px 2px 8px rgba(184, 134, 11, 0.5), 4px 4px 16px rgba(255, 107, 53, 0.3)",
                    }}
                    initial={{
                      x: anim.x,
                      y: anim.y,
                      rotate: anim.rotate,
                      opacity: 0,
                      scale: 0.3
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      rotate: 0,
                      opacity: 1,
                      scale: 1
                    }}
                    transition={{
                      duration: anim.duration,
                      delay: anim.delay,
                      ease: [0.22, 1.8, 0.36, 1],
                    }}
                  >
                    {letter}
                  </motion.span>
                );
              })}
            </div>
            
            {/* HOLIDAY EDITION - with garland */}
            <motion.div 
              className="mt-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3, duration: 0.8 }}
            >
              <HolidayGarland className="mb-4" />
              <motion.p 
                className="font-heading text-[20px] md:text-[24px] select-none text-center tracking-wide font-semibold text-qtc-holiday-red"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(196, 30, 58, 0.4)",
                    "0 0 20px rgba(196, 30, 58, 0.7)",
                    "0 0 10px rgba(196, 30, 58, 0.4)"
                  ]
                }}
                transition={{
                  delay: 3.5,
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                The King of Hearts Edition
              </motion.p>
            </motion.div>
            
            {/* LET'S PLAY BUTTON */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4.5, duration: 0.6 }}
            >
              <BrassButton
                variant="holiday"
                size="lg"
                onClick={() => setCurrentScreen(3)}
                className="mt-16"
              >
                Let&apos;s Play
              </BrassButton>
            </motion.div>
          </div>
        </motion.main>
      </SteampunkLayout>
    );
  }

  // SCREEN 3: PLAYER NAME ENTRY - REDESIGNED
  return (
    <SteampunkLayout variant="dark" showGears={true}>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[500px]">
          {/* Holiday decoration */}
          <HolidayGarland className="mb-8" />
          
          {/* Title */}
          <h1 className="font-heading text-[36px] font-bold text-qtc-brass-light tracking-tight text-center mb-2">
            Enter the names of the players
          </h1>
          
          {/* Subtitle with gear decoration */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Gear size="sm" speed="slow" />
            <p className="font-mono text-xs text-qtc-copper uppercase tracking-wider">
              2-8 Players Required
            </p>
            <Gear size="sm" speed="slow" className="rotate-180" />
          </div>
          
          {/* Player inputs */}
          <div className="space-y-4 mb-6">
            {playerNames.map((name, index) => (
              <div key={index} className="flex gap-3 items-center">
                <BrassInput
                  label={`Player ${index + 1}`}
                  value={name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  placeholder="Enter name..."
                  autoFocus={index === 0}
                  className="flex-1"
                />
                
                {/* Remove button for extra players */}
                {playerNames.length > 4 && (
                  <button
                    onClick={() => handleRemovePlayer(index)}
                    className="w-[56px] h-[56px] mt-6 flex items-center justify-center
                             bg-qtc-charcoal border-2 border-qtc-copper/50 
                             text-qtc-copper rounded-lg font-body text-[20px] 
                             hover:border-qtc-orange hover:text-qtc-orange 
                             transition-all cursor-pointer shadow-copper"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add player button */}
          {playerNames.length < 8 && (
            <button
              onClick={handleAddPlayer}
              className="w-full px-6 py-3 mb-6
                       bg-qtc-charcoal border-2 border-qtc-brass/30 
                       text-qtc-brass font-body text-[14px] font-medium 
                       rounded-lg transition-all
                       hover:border-qtc-brass hover:bg-qtc-brass/10"
            >
              + Add Player
            </button>
          )}

          {/* Start setup button */}
          <BrassButton
            variant={canStartSetup ? "holiday" : "primary"}
            size="lg"
            onClick={handleStartSetup}
            disabled={!canStartSetup}
            className={`w-full ${!canStartSetup && 'opacity-50 cursor-not-allowed'}`}
          >
            {canStartSetup ? '🎄 Start Holiday Edition' : 'Need More Players'}
          </BrassButton>

          {!canStartSetup && (
            <p className="mt-4 font-mono text-[13px] text-qtc-copper/60 text-center tracking-wide">
              Add at least 2 players to continue
            </p>
          )}

          {/* Quick test link */}
          <button
            onClick={() => router.push('/king-of-hearts/setup')}
            className="mt-8 w-full px-4 py-2 font-body text-[14px] 
                     text-qtc-brass/60 hover:text-qtc-brass 
                     transition-colors underline underline-offset-2"
          >
            🧪 Quick Test Mode
          </button>
        </div>
      </div>
    </SteampunkLayout>
  );
}
