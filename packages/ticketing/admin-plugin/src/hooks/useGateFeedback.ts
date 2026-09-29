import { useCallback, useEffect, useRef } from 'react';
import type { ScanTone } from '../utils/scan.ts';

// One high beep for go, two for look again, a long low one for stop; vibration where supported
// (not on iOS).
const SIGNALS: Record<ScanTone, { frequencies: number[]; seconds: number; vibrate: number[] }> = {
  ok: { frequencies: [880], seconds: 0.12, vibrate: [60] },
  warn: { frequencies: [520, 520], seconds: 0.1, vibrate: [80, 60, 80] },
  error: { frequencies: [220], seconds: 0.4, vibrate: [200, 80, 200] },
};

/**
 * Beeps and vibrates on scan results. Browsers only play audio after a user gesture, so call
 * unlock() from a click handler (starting the camera, a lookup, redeeming) before the first signal.
 */
const useGateFeedback = (enabled: boolean) => {
  const audioRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (!audioRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      audioRef.current = new AudioContextClass();
    }
    if (audioRef.current.state === 'suspended') audioRef.current.resume().catch(() => undefined);
  }, [enabled]);

  const signal = useCallback(
    (tone: ScanTone) => {
      if (!enabled) return;
      const { frequencies, seconds, vibrate } = SIGNALS[tone];
      navigator.vibrate?.(vibrate);
      const audio = audioRef.current;
      if (!audio || audio.state !== 'running') return;
      frequencies.forEach((frequency, index) => {
        const start = audio.currentTime + index * (seconds + 0.06);
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(start);
        oscillator.stop(start + seconds);
      });
    },
    [enabled],
  );

  useEffect(
    () => () => {
      audioRef.current?.close().catch(() => undefined);
      audioRef.current = null;
    },
    [],
  );

  return { unlock, signal };
};

export default useGateFeedback;
