import React, { useEffect, useRef, useState } from 'react';

/**
 * Speaking indicator component with audio level visualization
 */
const SpeakingIndicator = ({ stream, size = 'md' }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  useEffect(() => {
    if (!stream) {
      setIsSpeaking(false);
      setAudioLevel(0);
      return;
    }

    // Create audio context and analyser
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Analyze audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        
        setAudioLevel(normalizedLevel);
        setIsSpeaking(normalizedLevel > 0.05); // Threshold for speaking
        
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();

    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer ring - pulses when speaking */}
      <div
        className={`
          absolute rounded-full transition-all duration-300
          ${isSpeaking ? 'animate-speaking bg-primary-500 opacity-30' : 'bg-gray-600 opacity-20'}
        `}
        style={{
          width: `${24 + (audioLevel * 20)}px`,
          height: `${24 + (audioLevel * 20)}px`,
        }}
      />
      
      {/* Inner dot */}
      <div
        className={`
          ${sizeClasses[size]} rounded-full transition-all duration-200
          ${isSpeaking ? 'bg-primary-500 scale-110' : 'bg-gray-500'}
        `}
      />
    </div>
  );
};

export default SpeakingIndicator;
