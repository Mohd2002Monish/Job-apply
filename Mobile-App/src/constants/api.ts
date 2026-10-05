import Constants from 'expo-constants';

// Automatically detect the Mac's local LAN IP when running on Expo Go (physical device)
const getHostIp = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return '192.168.1.29'; // Fallback to current Mac LAN IP
};

const defaultHost = getHostIp();

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || `http://${defaultHost}:3000`;

export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') || `http://${defaultHost}:5173`;

/** Build a full endpoint URL from a leading-slash path. */
export const api = (path: string) => `${API_BASE_URL}${path}`;
