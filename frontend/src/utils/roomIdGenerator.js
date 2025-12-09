/**
 * Generate a random room ID
 * @returns {string} A random room ID in format "vokey-XXXXXX"
 */
export const generateRoomId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;
  let result = 'vokey-';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Validate room ID format
 * @param {string} roomId - The room ID to validate
 * @returns {boolean} True if valid
 */
export const validateRoomId = (roomId) => {
  if (!roomId || typeof roomId !== 'string') return false;
  
  // Allow alphanumeric, hyphens, and underscores, 3-50 chars
  const pattern = /^[a-zA-Z0-9_-]{3,50}$/;
  return pattern.test(roomId);
};
