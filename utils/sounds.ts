// Simple sound effects using Web Audio API
export function playBeep(frequency: number = 800, duration: number = 200) {
  if (typeof window === 'undefined') return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    // Silently fail if audio context is not available
  }
}

export function playTimerWarning() {
  playBeep(600, 150);
}

export function playTimerExpired() {
  playBeep(400, 300);
}

export function playSuccess() {
  playBeep(1000, 200);
}

