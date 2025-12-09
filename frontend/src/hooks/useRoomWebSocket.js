import { useEffect, useRef, useState, useCallback } from 'react';
import config from '../config';

/**
 * Custom hook to manage WebSocket connection for room signaling
 * 
 * @param {string} roomId - The room ID to connect to
 * @returns {object} WebSocket connection, client ID, connection status, and other peers
 */
const useRoomWebSocket = (roomId) => {
  const [socket, setSocket] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [otherPeers, setOtherPeers] = useState([]); // List of other client IDs in the room
  const [error, setError] = useState(null);
  
  const messageHandlersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Register a message handler
  const onMessage = useCallback((type, handler) => {
    messageHandlersRef.current.set(type, handler);
  }, []);

  // Remove a message handler
  const offMessage = useCallback((type) => {
    messageHandlersRef.current.delete(type);
  }, []);

  // Send a message through WebSocket
  const sendMessage = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return true;
    }
    console.error('WebSocket is not connected');
    return false;
  }, [socket]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!roomId) {
      console.error('Room ID is required');
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    const wsUrl = config.backendWsUrl;
    const url = `${wsUrl}/ws/rooms/${roomId}`;

    console.log('=== WebSocket Connection Debug ===');
    console.log('Environment:', import.meta.env.MODE);
    console.log('VITE_BACKEND_WS_URL:', import.meta.env.VITE_BACKEND_WS_URL);
    console.log('Using URL:', url);
    console.log('==================================');

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully to:', url);
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          // Handle different message types
          switch (message.type) {
            case 'join':
              // Confirmation that we joined the room
              console.log('✅ Joined room - clientId:', message.clientId, 'existingClients:', message.existingClients);
              setClientId(message.clientId);
              setOtherPeers(message.existingClients || []);
              break;

            case 'new-peer':
              // A new peer joined the room
              console.log('👤 New peer joined:', message.clientId);
              setOtherPeers(prev => {
                const updated = [...prev, message.clientId];
                console.log('Updated otherPeers:', updated);
                return updated;
              });
              break;

            case 'peer-left':
              // A peer left the room
              console.log('👋 Peer left:', message.clientId);
              setOtherPeers(prev => {
                const updated = prev.filter(id => id !== message.clientId);
                console.log('Updated otherPeers:', updated);
                return updated;
              });
              break;

            default:
              // Forward to registered handlers
              break;
          }

          // Call registered message handler if exists
          const handler = messageHandlersRef.current.get(message.type);
          if (handler) {
            handler(message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
          setConnectionStatus('reconnecting');
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionStatus('disconnected');
          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            setError('Failed to reconnect after multiple attempts');
          }
        }
      };

      setSocket(ws);
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create connection');
      setConnectionStatus('error');
    }
  }, [roomId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socket) {
      socket.close(1000, 'Client disconnecting');
    }
    
    setSocket(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setClientId(null);
    setOtherPeers([]);
  }, [socket]);

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [roomId]); // Only reconnect if roomId changes

  return {
    socket,
    clientId,
    isConnected,
    connectionStatus,
    otherPeers,
    error,
    sendMessage,
    onMessage,
    offMessage,
    reconnect: connect,
    disconnect,
  };
};

export default useRoomWebSocket;
