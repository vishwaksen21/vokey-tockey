import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomId, validateRoomId } from '../utils/roomIdGenerator';

/**
 * Landing page component - entry point for the app
 */
const LandingPage = () => {
  const [roomInput, setRoomInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const roomId = generateRoomId();
    navigate(`/room/${roomId}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    setError('');

    const roomId = roomInput.trim();

    if (!roomId) {
      setError('Please enter a room ID');
      return;
    }

    if (!validateRoomId(roomId)) {
      setError('Invalid room ID format. Use only letters, numbers, hyphens, and underscores.');
      return;
    }

    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <svg 
                className="w-10 h-10 text-white" 
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
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Vokey-Tockey
          </h1>
          
          <p className="text-gray-400 text-lg">
            Anonymous voice chat rooms
          </p>
          
          <p className="text-gray-500 text-sm mt-2">
            No login required • Real-time • WebRTC
          </p>
        </div>

        {/* Main card */}
        <div className="card space-y-6">
          {/* Create random room */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              Start a new room
            </h2>
            <button
              onClick={handleCreateRoom}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              <span>Create Random Room</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800 text-gray-400">OR</span>
            </div>
          </div>

          {/* Join existing room */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              Join an existing room
            </h2>
            
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="Enter room ID"
                  className="input-field w-full"
                  maxLength={50}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                  />
                </svg>
                <span>Join Room</span>
              </button>
            </form>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Anonymous</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Real-time</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">Secure</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8">
          <p className="text-gray-500 text-sm">
            Built with React, FastAPI, and WebRTC
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
