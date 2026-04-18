// ============================================
// AudioPlayer - Headless Audio Playback Component
// ============================================
// Converts base64 audio to a playable Blob and auto-plays it.
// Signals when playback ends via the onEnded callback.
// ============================================

import { useEffect, useRef } from 'react';

function AudioPlayer({ audioBase64, autoPlay, onEnded }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioBase64) return;

    try {
      // Convert base64 to blob
      const byteCharacters = atob(audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;

        if (autoPlay) {
          audioRef.current.play().catch((err) => {
            console.error('Audio autoplay failed:', err);
            // If autoplay fails, trigger onEnded so the flow continues
            if (onEnded) onEnded();
          });
        }
      }

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('AudioPlayer error:', err);
      if (onEnded) onEnded();
    }
  }, [audioBase64, autoPlay]);

  const handleEnded = () => {
    if (onEnded) onEnded();
  };

  if (!audioBase64) return null;

  return (
    <audio
      ref={audioRef}
      onEnded={handleEnded}
      style={{ display: 'none' }}
    />
  );
}

export default AudioPlayer;
