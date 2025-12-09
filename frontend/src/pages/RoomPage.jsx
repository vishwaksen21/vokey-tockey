import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useRoomWebSocket from '../hooks/useRoomWebSocket';
import useWebRTC from '../hooks/useWebRTC';
import MicButton from '../components/MicButton';
import ParticipantCard from '../components/ParticipantCard';
import { validateRoomId } from '../utils/roomIdGenerator';

/**
 * Room page component - the voice chat room
 */
const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Validate room ID
  useEffect(() => {
    if (!validateRoomId(roomId)) {
      alert('Invalid room ID');
      navigate('/');
    }
  }, [roomId, navigate]);

  // WebSocket connection
  const signalingSocket = useRoomWebSocket(roomId);
  
  // WebRTC connections
  const {
    localStream,
    peers,
    isMuted,
    micPermissionGranted,
    micError,
    initializeMicrophone,
    toggleMute,
  } = useWebRTC(signalingSocket.clientId, signalingSocket);

  // Initialize microphone when connected
  useEffect(() => {
    if (signalingSocket.isConnected && !hasInitialized && signalingSocket.clientId) {
      initializeMicrophone();
      setHasInitialized(true);
    }
  }, [signalingSocket.isConnected, signalingSocket.clientId, hasInitialized, initializeMicrophone]);

  // Copy room ID to clipboard
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  // Share room link
  const shareRoom = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Join my Vokey-Tockey room',
        text: `Join me in this voice chat room: ${roomId}`,
        url: url,
      });
    } else {
      copyRoomId();
    }
  };

  // Leave room
  const leaveRoom = () => {
    signalingSocket.disconnect();
    navigate('/');
  };

  // Get connection status display
  const getStatusDisplay = () => {
    if (!signalingSocket.isConnected) {
      return {
        text: 'Connecting...',
        color: 'text-yellow-500',
        icon: '⏳',
      };
    }
    
    if (micError) {
      return {
        text: 'Microphone Error',
        color: 'text-red-500',
        icon: '❌',
      };
    }
    
    if (!micPermissionGranted) {
      return {
        text: 'Requesting Mic Access...',
        color: 'text-yellow-500',
        icon: '🎤',
      };
    }
    
    return {
      text: 'Connected',
      color: 'text-green-500',
      icon: '✓',
    };
  };

  const status = getStatusDisplay();
  const participantCount = 1 + Object.keys(peers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Room info */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
                <span>Voice Room</span>
                <span className={`text-sm font-normal ${status.color} flex items-center space-x-1`}>
                  <span>{status.icon}</span>
                  <span>{status.text}</span>
                </span>
              </h1>
              
              <div className="flex items-center space-x-3">
                <code className="bg-gray-800 px-3 py-1 rounded text-primary-400 font-mono">
                  {roomId}
                </code>
                
                <button
                  onClick={copyRoomId}
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
                  title="Copy room ID"
                >
                  {showCopied ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={shareRoom}
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
                  title="Share room"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Leave button */}
            <button
              onClick={leaveRoom}
              className="btn-danger flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Leave Room</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {micError && (
          <div className="mb-6 bg-red-900/50 border border-red-500 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-red-400 font-semibold">Microphone Access Required</h3>
                <p className="text-red-300 text-sm mt-1">{micError}</p>
                <button
                  onClick={initializeMicrophone}
                  className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Participants */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Participants ({participantCount})
                </h2>
              </div>

              {/* Participant list */}
              <div className="space-y-3">
                {/* Local user */}
                {signalingSocket.clientId && (
                  <ParticipantCard
                    clientId={signalingSocket.clientId}
                    stream={localStream}
                    isLocal={true}
                    isMuted={isMuted}
                  />
                )}

                {/* Remote peers */}
                {Object.entries(peers).map(([peerId, peerData]) => (
                  <ParticipantCard
                    key={peerId}
                    clientId={peerId}
                    stream={peerData.stream}
                    isLocal={false}
                    isMuted={false}
                  />
                ))}

                {/* Empty state */}
                {participantCount === 1 && (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-lg font-medium">Waiting for others to join...</p>
                    <p className="text-sm mt-2">Share the room ID above to invite people</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Controls and info */}
          <div className="space-y-4">
            {/* Microphone control */}
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-white mb-4">
                Microphone
              </h3>
              
              <div className="flex justify-center mb-4">
                <MicButton
                  isMuted={isMuted}
                  onToggle={toggleMute}
                  disabled={!micPermissionGranted}
                />
              </div>

              <p className="text-sm text-gray-400">
                {isMuted ? 'You are muted' : 'You are unmuted'}
              </p>
            </div>

            {/* Room info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-3">
                Room Info
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Participants:</span>
                  <span className="text-white font-semibold">{participantCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-semibold ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Room ID:</span>
                  <span className="text-white font-mono text-xs">{roomId.slice(0, 12)}...</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="card bg-primary-900/20 border-primary-700">
              <h3 className="text-lg font-semibold text-primary-400 mb-3">
                💡 Tips
              </h3>
              
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 flex-shrink-0">•</span>
                  <span>Use headphones to avoid echo</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 flex-shrink-0">•</span>
                  <span>Share the room ID to invite others</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 flex-shrink-0">•</span>
                  <span>Mute when not speaking</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 flex-shrink-0">•</span>
                  <span>This room is anonymous and temporary</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
