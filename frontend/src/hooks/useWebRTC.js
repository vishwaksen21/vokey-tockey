import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * WebRTC configuration
 */
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

/**
 * Custom hook to manage WebRTC connections for voice chat
 * 
 * @param {string} clientId - Our client ID
 * @param {object} signalingSocket - WebSocket hook object for signaling
 * @returns {object} Peers state, local stream, and control functions
 */
const useWebRTC = (clientId, signalingSocket) => {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({}); // peerId -> { connection, stream, isSpeaking }
  const [isMuted, setIsMuted] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [micError, setMicError] = useState(null);

  const peerConnectionsRef = useRef({}); // peerId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef({}); // peerId -> [candidates]

  // Initialize microphone
  const initializeMicrophone = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      console.log('✅ Microphone access granted');
      console.log('🎤 Microphone initialized with', stream.getAudioTracks().length, 'audio tracks');
      console.log('Audio track details:', stream.getAudioTracks()[0]?.getSettings());
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMicPermissionGranted(true);
      setMicError(null);

      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      let errorMessage = 'Failed to access microphone';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.';
      }
      
      setMicError(errorMessage);
      setMicPermissionGranted(false);
      return null;
    }
  }, []);

  // Toggle mute/unmute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log('Microphone', audioTrack.enabled ? 'unmuted' : 'muted');
      }
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((peerId) => {
    if (peerConnectionsRef.current[peerId]) {
      console.log('Peer connection already exists for', peerId);
      return peerConnectionsRef.current[peerId];
    }

    console.log('Creating peer connection for', peerId);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream to connection
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log(`Adding ${tracks.length} tracks to peer connection for`, peerId);
      
      tracks.forEach(track => {
        const sender = pc.addTrack(track, localStreamRef.current);
        console.log(`✅ Added local ${track.kind} track to peer connection for ${peerId}:`, {
          trackId: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          senderId: sender.track?.id
        });
      });
    } else {
      console.error('❌ No local stream available when creating peer connection for', peerId);
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to', peerId);
        signalingSocket.sendMessage({
          type: 'ice-candidate',
          to: peerId,
          payload: event.candidate.toJSON(),
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log(`✅ Received remote ${event.track.kind} track from`, peerId);
      console.log('Remote track details:', {
        trackId: event.track.id,
        enabled: event.track.enabled,
        readyState: event.track.readyState,
        muted: event.track.muted
      });
      console.log('Remote stream:', event.streams[0]);
      console.log('Remote stream tracks:', event.streams[0].getTracks().map(t => ({
        kind: t.kind,
        id: t.id,
        enabled: t.enabled,
        readyState: t.readyState
      })));
      
      // Preserve existing peer state when adding stream
      setPeers(prev => {
        const existing = prev[peerId] || {};
        return {
          ...prev,
          [peerId]: {
            ...existing,
            connection: pc,
            stream: event.streams[0],
          }
        };
      });
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state for', peerId, ':', pc.connectionState);
      
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log('Peer connection failed/disconnected:', peerId);
        // Could attempt to reconnect here
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state for', peerId, ':', pc.iceConnectionState);
    };

    peerConnectionsRef.current[peerId] = pc;
    
    // Add pending ICE candidates if any
    if (pendingCandidatesRef.current[peerId]) {
      console.log(`Adding ${pendingCandidatesRef.current[peerId].length} pending ICE candidates for`, peerId);
      pendingCandidatesRef.current[peerId].forEach(candidate => {
        // Candidates are already in correct format, don't wrap
        pc.addIceCandidate(candidate).catch(err => {
          console.error('Error adding pending ICE candidate:', err);
        });
      });
      delete pendingCandidatesRef.current[peerId];
    }

    return pc;
  }, [signalingSocket]);

  // Create and send offer to peer
  const createOffer = useCallback(async (peerId) => {
    try {
      const pc = createPeerConnection(peerId);
      
      console.log('Creating offer for', peerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('Sending offer to', peerId);
      signalingSocket.sendMessage({
        type: 'offer',
        to: peerId,
        payload: offer,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [createPeerConnection, signalingSocket]);

  // Handle incoming offer
  const handleOffer = useCallback(async (fromPeerId, offer) => {
    try {
      console.log('Received offer from', fromPeerId);
      
      // Ensure we have local stream before handling offer
      if (!localStreamRef.current) {
        console.error('❌ Cannot handle offer - no local stream yet for', fromPeerId);
        return;
      }
      
      const pc = createPeerConnection(fromPeerId);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
      } catch (err) {
        console.warn('⚠️ Ignoring setRemoteDescription error (likely race condition):', err);
        return;
      }
      
      console.log('Creating answer for', fromPeerId);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('Sending answer to', fromPeerId);
      signalingSocket.sendMessage({
        type: 'answer',
        to: fromPeerId,
        payload: answer,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [createPeerConnection, signalingSocket]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (fromPeerId, answer) => {
    try {
      console.log('Received answer from', fromPeerId);
      const pc = peerConnectionsRef.current[fromPeerId];
      
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.warn('⚠️ Ignoring setRemoteDescription error (likely race condition):', err);
        }
      } else {
        console.error('No peer connection found for', fromPeerId);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (fromPeerId, candidate) => {
    try {
      const pc = peerConnectionsRef.current[fromPeerId];
      
      if (pc && pc.remoteDescription) {
        // ICE candidate from server is already JSON, don't wrap again
        await pc.addIceCandidate(candidate);
        console.log('Added ICE candidate from', fromPeerId);
      } else {
        // Store candidate to add later when remote description is set
        console.log('Storing ICE candidate for later:', fromPeerId);
        if (!pendingCandidatesRef.current[fromPeerId]) {
          pendingCandidatesRef.current[fromPeerId] = [];
        }
        // Store as-is, already JSON format
        pendingCandidatesRef.current[fromPeerId].push(candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  // Remove peer connection
  const removePeer = useCallback((peerId) => {
    console.log('Removing peer:', peerId);
    
    const pc = peerConnectionsRef.current[peerId];
    if (pc) {
      pc.close();
      delete peerConnectionsRef.current[peerId];
    }

    setPeers(prev => {
      const updated = { ...prev };
      delete updated[peerId];
      return updated;
    });

    delete pendingCandidatesRef.current[peerId];
  }, []);

  // Set up WebSocket message handlers
  useEffect(() => {
    if (!signalingSocket || !clientId) return;

    // Handle new peer joining
    const handleNewPeer = (message) => {
      const peerId = message.clientId;
      if (peerId !== clientId) {
        console.log('New peer joined:', peerId);
        
        // Only create offer if our clientId is lexicographically smaller
        // This prevents double-offer race condition
        if (clientId < peerId) {
          console.log('📞 We initiate connection (clientId < peerId)');
          // Delay slightly to ensure they're ready
          setTimeout(() => {
            if (localStreamRef.current) {
              console.log('Creating offer to new peer (microphone ready):', peerId);
              createOffer(peerId);
            } else {
              console.warn('Cannot create offer yet, microphone not ready for:', peerId);
            }
          }, 1000);
        } else {
          console.log('📱 Waiting for their offer (clientId > peerId)');
        }
      }
    };

    // Handle peer leaving
    const handlePeerLeft = (message) => {
      const peerId = message.clientId;
      console.log('Peer left:', peerId);
      removePeer(peerId);
    };

    // Handle signaling messages
    const handleSignaling = (message) => {
      const fromPeerId = message.from;
      
      switch (message.type) {
        case 'offer':
          handleOffer(fromPeerId, message.payload);
          break;
        case 'answer':
          handleAnswer(fromPeerId, message.payload);
          break;
        case 'ice-candidate':
          handleIceCandidate(fromPeerId, message.payload);
          break;
        default:
          break;
      }
    };

    // Register message handlers
    signalingSocket.onMessage('new-peer', handleNewPeer);
    signalingSocket.onMessage('peer-left', handlePeerLeft);
    signalingSocket.onMessage('offer', handleSignaling);
    signalingSocket.onMessage('answer', handleSignaling);
    signalingSocket.onMessage('ice-candidate', handleSignaling);

    // Cleanup
    return () => {
      signalingSocket.offMessage('new-peer');
      signalingSocket.offMessage('peer-left');
      signalingSocket.offMessage('offer');
      signalingSocket.offMessage('answer');
      signalingSocket.offMessage('ice-candidate');
    };
  }, [
    signalingSocket,
    clientId,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
  ]);

  // When other peers list changes OR when microphone becomes available, create connections
  useEffect(() => {
    if (!signalingSocket.otherPeers || !clientId) {
      return;
    }

    // Only proceed if we have a local stream
    if (!localStreamRef.current) {
      console.log('Waiting for microphone before creating peer connections...');
      return;
    }

    // Create offers to existing peers when we join (only if our clientId is smaller)
    signalingSocket.otherPeers.forEach(peerId => {
      if (!peerConnectionsRef.current[peerId]) {
        // Only create offer if our clientId is lexicographically smaller
        if (clientId < peerId) {
          console.log('📞 Creating connection to existing peer (clientId < peerId):', peerId);
          createOffer(peerId);
        } else {
          console.log('📱 Waiting for offer from existing peer (clientId > peerId):', peerId);
        }
      }
    });
  }, [signalingSocket.otherPeers, clientId, createOffer, localStream]);
  
  // When microphone becomes available, retry connections for peers we couldn't connect to
  useEffect(() => {
    if (!localStreamRef.current || !clientId || !signalingSocket.otherPeers) return;

    signalingSocket.otherPeers.forEach(peerId => {
      if (!peerConnectionsRef.current[peerId] && clientId < peerId) {
        console.log('🔄 Retrying connection after mic ready:', peerId);
        createOffer(peerId);
      }
    });
  }, [localStream, clientId, signalingSocket.otherPeers, createOffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => {
        pc.close();
      });
      peerConnectionsRef.current = {};

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    localStream,
    peers,
    isMuted,
    micPermissionGranted,
    micError,
    initializeMicrophone,
    toggleMute,
    removePeer,
  };
};

export default useWebRTC;
