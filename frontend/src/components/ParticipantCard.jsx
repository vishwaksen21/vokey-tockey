import React, { useRef, useEffect } from 'react';
import SpeakingIndicator from './SpeakingIndicator';

/**
 * Participant card component showing a single participant
 */
const ParticipantCard = ({ 
  clientId, 
  stream, 
  isLocal = false, 
  isMuted = false 
}) => {
  const audioRef = useRef(null);

  // Play remote audio stream
  useEffect(() => {
    if (audioRef.current && stream && !isLocal) {
      console.log(`📢 Setting up audio for ${clientId}:`, {
        hasAudioTracks: stream.getAudioTracks().length,
        audioTrackEnabled: stream.getAudioTracks()[0]?.enabled,
        audioTrackReadyState: stream.getAudioTracks()[0]?.readyState,
        streamId: stream.id,
        streamActive: stream.active
      });
      
      const audio = audioRef.current;
      audio.srcObject = stream;
      audio.volume = 1.0;
      audio.muted = false;
      
      // Try to play immediately
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`✅ Audio playing for ${clientId}`);
          })
          .catch(err => {
            console.error(`❌ Error playing audio for ${clientId}:`, err);
            
            // Retry after user interaction
            const retryPlay = () => {
              audio.play()
                .then(() => {
                  console.log(`✅ Audio playing for ${clientId} (after retry)`);
                  document.removeEventListener('click', retryPlay);
                })
                .catch(e => console.error('Retry failed:', e));
            };
            
            document.addEventListener('click', retryPlay, { once: true });
            console.log('⚠️ Click anywhere to start audio playback');
          });
      }
    }
  }, [stream, isLocal, clientId]);

  // Generate a display name from client ID
  const getDisplayName = (id) => {
    if (isLocal) return 'You';
    // Take last 6 characters of UUID
    const shortId = id.slice(-6);
    return `User ${shortId}`;
  };

  return (
    <div className="card flex items-center justify-between p-4">
      {/* User info */}
      <div className="flex items-center space-x-3">
        {/* Avatar / Speaking indicator */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
            {getDisplayName(clientId).charAt(0)}
          </div>
          
          {/* Speaking indicator overlay */}
          {stream && !isMuted && (
            <div className="absolute -bottom-1 -right-1">
              <SpeakingIndicator stream={stream} size="md" />
            </div>
          )}
        </div>

        {/* Name and status */}
        <div>
          <div className="font-semibold text-white flex items-center space-x-2">
            <span>{getDisplayName(clientId)}</span>
            {isLocal && (
              <span className="text-xs bg-primary-600 px-2 py-0.5 rounded-full">
                You
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            {isMuted ? (
              <span className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Muted</span>
              </span>
            ) : !isLocal && !stream ? (
              <span className="text-yellow-500">Connecting...</span>
            ) : (
              <span className="text-green-500">Connected</span>
            )}
          </div>
        </div>
      </div>

      {/* Audio element for remote streams */}
      {!isLocal && stream && (
        <audio 
          ref={audioRef} 
          autoPlay 
          playsInline 
          muted={false}
        />
      )}
    </div>
  );
};

export default ParticipantCard;
