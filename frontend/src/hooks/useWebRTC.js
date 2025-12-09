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

      console.log('Microphone access granted');
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
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
        console.log(`✅ Added local ${track.kind} track to peer connection for`, peerId);
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
      console.log('Remote stream:', event.streams[0]);
      
      setPeers(prev => ({
        ...prev,
        [peerId]: {
          ...prev[peerId],
          connection: pc,
          stream: event.streams[0],
          isSpeaking: false,
        }
      }));
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
      pendingCandidatesRef.current[peerId].forEach(candidate => {
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
      const pc = createPeerConnection(fromPeerId);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
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
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
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
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Added ICE candidate from', fromPeerId);
      } else {
        // Store candidate to add later when remote description is set
        console.log('Storing ICE candidate for later:', fromPeerId);
        if (!pendingCandidatesRef.current[fromPeerId]) {
          pendingCandidatesRef.current[fromPeerId] = [];
        }
        pendingCandidatesRef.current[fromPeerId].push(new RTCIceCandidate(candidate));
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
        // Create offer to new peer - delay slightly to ensure they're ready
        setTimeout(() => {
          if (localStreamRef.current) {
            console.log('Creating offer to new peer (microphone ready):', peerId);
            createOffer(peerId);
          } else {
            console.warn('Cannot create offer yet, microphone not ready for:', peerId);
          }
        }, 1000); // Wait 1 second for new peer to initialize
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

    // Create offers to existing peers when we join
    signalingSocket.otherPeers.forEach(peerId => {
      if (!peerConnectionsRef.current[peerId]) {
        console.log('Creating connection to existing peer:', peerId);
        createOffer(peerId);
      }
    });
  }, [signalingSocket.otherPeers, clientId, createOffer, localStream]); // Added localStream as dependency

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
