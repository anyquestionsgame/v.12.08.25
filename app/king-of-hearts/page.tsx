'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type Screen = 1 | 2 | 3;

export default function KingOfHeartsEntry() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<Screen>(1);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [mounted, setMounted] = useState(false);
  const [videoFadingOut, setVideoFadingOut] = useState(false);

  // Generate random animation values once per component mount
  // This creates unique chaos each time but stays consistent during the session
  const titleText = "ANY QUESTIONS";
  const letterAnimations = useMemo(() => {
    return titleText.split('').map((letter, i) => {
      if (letter === ' ') return null; // Skip space
      return {
        x: Math.random() * 800 - 400,           // -400 to 400 (wide scatter)
        y: -(Math.random() * 350 + 200),        // -550 to -200 (above viewport)
        rotate: Math.random() * 2160 - 1080,    // -1080 to 1080 (3 full rotations)
        duration: Math.random() * 0.8 + 1.0,    // 1.0s to 1.8s
        delay: 0.6 + Math.random() * 0.6,       // 0.6s to 1.2s staggered
      };
    });
  }, []); // Empty deps = only runs once on mount

  useEffect(() => {
    setMounted(true);
  }, []);

  // Video error fallback - only triggers if video fails to load
  const [videoError, setVideoError] = useState(false);
  
  useEffect(() => {
    if (videoError && currentScreen === 1) {
      console.log('Video error detected - using 8 second fallback');
      const timer = setTimeout(() => {
        handleVideoEnd();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [videoError, currentScreen]);

  // Handle video end with breathing room
  const handleVideoEnd = () => {
    console.log('Video ended - starting fade transition');
    // Wait 1 second, then fade out
    setTimeout(() => {
      setVideoFadingOut(true);
      // Wait for fade out (0.5s), then switch screens
      setTimeout(() => {
        setCurrentScreen(2);
      }, 500);
    }, 1000);
  };

  // Prevent SSR issues
  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#FFF8DC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Get valid player names (non-empty, trimmed)
  const validPlayerNames = playerNames.filter(name => name.trim().length > 0);
  const canStartSetup = validPlayerNames.length >= 4;

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
    if (playerNames.length > 4) {
      const newNames = playerNames.filter((_, i) => i !== index);
      setPlayerNames(newNames);
    }
  };

  const handleStartSetup = () => {
    if (canStartSetup) {
      // Navigate to setup with player names as URL params
      const params = new URLSearchParams();
      validPlayerNames.forEach((name, index) => {
        params.append(`p${index + 1}`, name.trim());
      });
      router.push(`/king-of-hearts/setup?${params.toString()}`);
    }
  };

  // SCREEN 1: VIDEO SPLASH - Full screen edge-to-edge
  // Video file location: public/videos/quality-time-intro.mov
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
          onEnded={() => {
            console.log('Video ended naturally');
            handleVideoEnd();
          }}
          onError={() => {
            console.log('Video error - setting fallback');
            setVideoError(true);
          }}
          onLoadedMetadata={(e) => {
            console.log('Video duration:', e.currentTarget.duration, 'seconds');
          }}
          className="w-full h-full object-cover"
          style={{
            // Ensure video fills entire viewport on all devices
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <source src="/videos/quality-time-intro.mov" type="video/quicktime" />
          {/* MP4 fallback for broader browser support */}
          <source src="/videos/quality-time-intro.mp4" type="video/mp4" />
        </video>
      </motion.div>
    );
  }

  // SCREEN 2: ANIMATED TITLE SEQUENCE (Framer Motion)
  // Chaotic dice-dump effect - all letters scattered above, tumble down with varied speeds
  if (currentScreen === 2) {
    // Shooting star animation for subtitle
    const shootingStarVariants = {
      hidden: { 
        opacity: 0, 
        x: -200, 
        filter: "blur(10px)" 
      },
      visible: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: {
          delay: 3,
          duration: 0.8,
          ease: "easeOut" as const
        }
      }
    };

    // Star trail animation
    const trailVariants = {
      hidden: { width: 0, opacity: 0 },
      visible: {
        width: [0, 150, 0],
        opacity: [0, 1, 0],
        transition: {
          delay: 3,
          duration: 0.8,
          times: [0, 0.3, 1]
        }
      }
    };

    return (
      <motion.main 
        className="min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #FFF8DC 0%, #E8E4D9 50%, #D4E2D4 100%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated warm gradient overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(196,30,58,0.08) 0%, rgba(22,91,51,0.08) 50%, rgba(212,175,55,0.1) 100%)"
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 2, ease: "easeInOut" }}
        />
        
        <div className="flex flex-col items-center w-full max-w-[700px] relative z-10">
          {/* WELCOME TO - fades in at 0.5s */}
          <motion.p 
            className="font-body text-[18px] tracking-[0.3em] select-none uppercase"
            style={{ color: "#D4AF37" }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
          >
            Welcome to
          </motion.p>
          
          {/* ANY QUESTIONS - Chaotic dice dump from above */}
          <div 
            className="mt-4 flex justify-center items-center flex-wrap"
            style={{ perspective: '1000px' }}
          >
            {titleText.split('').map((letter, index) => {
              // Handle space character
              if (letter === ' ') {
                return <span key={index} className="w-3 md:w-5" />;
              }
              
              const anim = letterAnimations[index];
              if (!anim) return null;
              
              return (
                <motion.span
                  key={index}
                  className="inline-block font-heading text-[44px] md:text-[68px] font-extrabold select-none"
                  style={{ 
                    color: "#165B33",
                    textShadow: "2px 2px 0px #D4AF37, 4px 4px 12px rgba(196,30,58,0.3)",
                    transformOrigin: 'center center'
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
                    ease: [0.22, 1.8, 0.36, 1], // Strong bounce/overshoot - more dramatic
                    rotate: {
                      duration: anim.duration * 0.9,
                      ease: "easeOut"
                    }
                  }}
                >
                  {letter}
                </motion.span>
              );
            })}
          </div>
          
          {/* THE KING OF HEARTS EDITION - shooting star at 3s */}
          <motion.div 
            className="mt-8 relative"
            variants={shootingStarVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Star trail effect */}
            <motion.div 
              className="absolute right-full top-1/2 -translate-y-1/2 h-[2px]"
              style={{
                background: "linear-gradient(to right, transparent, #D4AF37, #D4AF37)"
              }}
              variants={trailVariants}
              initial="hidden"
              animate="visible"
            />
            <motion.p 
              className="font-body text-[20px] md:text-[24px] select-none text-center tracking-wide font-semibold"
              style={{ color: "#C41E3A" }}
              animate={{
                textShadow: [
                  "0 0 10px rgba(212,175,55,0.4), 0 0 20px rgba(212,175,55,0.2)",
                  "0 0 20px rgba(212,175,55,0.6), 0 0 40px rgba(212,175,55,0.3)",
                  "0 0 10px rgba(212,175,55,0.4), 0 0 20px rgba(212,175,55,0.2)"
                ]
              }}
              transition={{
                delay: 3.8,
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              The King of Hearts Edition
            </motion.p>
          </motion.div>
          
          {/* LET'S PLAY BUTTON - fades in at 4.5s */}
          <motion.button
            onClick={() => setCurrentScreen(3)}
            className="mt-16 px-12 py-5 font-body text-lg font-bold rounded-xl cursor-pointer select-none shadow-lg"
            style={{ 
              backgroundColor: "#C41E3A",
              color: "#FFF8DC",
              boxShadow: "0 4px 20px rgba(196,30,58,0.3)"
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.5, duration: 0.6, ease: "easeOut" }}
            whileHover={{ 
              scale: 0.98, 
              backgroundColor: "#D4AF37",
              color: "#165B33"
            }}
            whileTap={{ scale: 0.96 }}
          >
            Let&apos;s Play
          </motion.button>
        </div>
      </motion.main>
    );
  }

  // SCREEN 3: PLAYER NAME ENTRY
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fadeIn" style={{ background: "linear-gradient(180deg, #FFF8DC 0%, #E8E4D9 100%)" }}>
      <div className="flex flex-col items-center w-full max-w-[500px]">
        <h1 className="font-heading text-[36px] font-bold text-[#165B33] tracking-tight select-none text-center">
          Enter the names of the players
        </h1>
        
        <div className="mt-8 w-full space-y-3">
          {playerNames.map((name, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                placeholder={`Player ${index + 1}`}
                className="flex-1 h-[56px] px-4 bg-white border-2 border-[#C41E3A] rounded-xl font-body text-[16px] text-[#165B33] placeholder-[#52796F] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30 shadow-sm"
                autoFocus={index === 0}
              />
              {playerNames.length > 4 && (
                <button
                  onClick={() => handleRemovePlayer(index)}
                  className="w-[56px] h-[56px] flex items-center justify-center bg-white border-2 border-[#52796F] text-[#52796F] rounded-xl font-body text-[20px] hover:border-[#C41E3A] hover:text-[#C41E3A] transition-all cursor-pointer"
                  aria-label="Remove player"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {playerNames.length < 8 && (
          <button
            onClick={handleAddPlayer}
            className="mt-4 px-6 py-3 bg-white border-2 border-[#52796F] text-[#52796F] font-body text-[14px] font-medium rounded-xl cursor-pointer transition-all duration-150 ease-out hover:border-[#165B33] hover:text-[#165B33] select-none"
          >
            + Add Player
          </button>
        )}

        <button
          onClick={handleStartSetup}
          disabled={!canStartSetup}
          className={`
            mt-8 px-12 py-5 font-body text-lg font-bold rounded-xl cursor-pointer
            transition-all duration-150 ease-out select-none
            ${canStartSetup
              ? 'bg-[#C41E3A] text-[#FFF8DC] hover:bg-[#D4AF37] hover:text-[#165B33] hover:scale-[0.98] active:scale-[0.96] shadow-lg'
              : 'bg-white border-2 border-[#52796F] text-[#52796F] cursor-not-allowed'
            }
          `}
          style={canStartSetup ? { boxShadow: "0 4px 20px rgba(196,30,58,0.25)" } : {}}
        >
          Start Setup
        </button>

        {!canStartSetup && (
          <p className="mt-4 font-body text-[13px] text-[#52796F] text-center">
            Need at least 4 players to start
          </p>
        )}

        {/* Quick Test Link */}
        <button
          onClick={() => router.push('/king-of-hearts/setup')}
          className="mt-8 px-4 py-2 font-body text-[14px] text-[#CD7F32] hover:text-[#A5682A] transition-colors underline underline-offset-2"
        >
          🧪 Quick Test Mode (test AI questions)
        </button>
      </div>
    </main>
  );
}
