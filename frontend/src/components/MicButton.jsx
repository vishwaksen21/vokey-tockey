import React from 'react';

/**
 * Microphone toggle button component
 */
const MicButton = ({ isMuted, onToggle, disabled = false }) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        relative p-4 rounded-full transition-all duration-200 transform hover:scale-105
        ${isMuted 
          ? 'bg-red-600 hover:bg-red-700' 
          : 'bg-primary-600 hover:bg-primary-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        shadow-lg
      `}
      title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
    >
      {isMuted ? (
        // Muted icon
        <svg 
          className="w-8 h-8 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" 
          />
        </svg>
      ) : (
        // Unmuted icon
        <svg 
          className="w-8 h-8 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
          />
        </svg>
      )}
      
      {/* Status indicator */}
      <div className={`
        absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900
        ${isMuted ? 'bg-red-500' : 'bg-green-500'}
      `} />
    </button>
  );
};

export default MicButton;
