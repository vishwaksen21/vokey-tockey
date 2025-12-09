// Configuration for the app
const config = {
  // Backend WebSocket URL - must use wss:// in production
  backendWsUrl: import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000',
};

// Log configuration on load (for debugging)
console.log('App Configuration:', config);

export default config;
