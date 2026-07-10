import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { api, API_BASE_URL } from '@/constants/api';

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  token: string | null;
  user: any;
  pendingMailto: string | null;
  clearPendingMailto: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  pendingMailto: null,
  clearPendingMailto: () => {},
  loginWithGoogle: async () => {},
  loginWithMicrosoft: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMailto, setPendingMailto] = useState<string | null>(null);

  const incomingUrl = Linking.useURL();

  useEffect(() => {
    if (incomingUrl && incomingUrl.startsWith('mailto:')) {
      // Parse mailto:hr@company.com?subject=...
      const rawEmail = incomingUrl.replace('mailto:', '').split('?')[0];
      setPendingMailto(rawEmail);
    }
  }, [incomingUrl]);

  const clearPendingMailto = () => setPendingMailto(null);

  const fetchUserStatus = async (jwt: string) => {
    try {
      const res = await fetch(api('/auth/status'), {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await res.json();
      if (data.authenticated) {
        setUser(data);
      } else {
        await AsyncStorage.removeItem('reco_jwt');
        setToken(null);
      }
    } catch (err) {
      console.error('Fetch status error:', err);
    }
  };

  useEffect(() => {
    // Check AsyncStorage for existing token
    AsyncStorage.getItem('reco_jwt').then(storedToken => {
      if (storedToken) {
        setToken(storedToken);
        fetchUserStatus(storedToken).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const handleOAuthLogin = async (providerUrl: string) => {
    try {
      const redirectUri = Linking.createURL('/login');
      const authUrl = `${API_BASE_URL}${providerUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === 'success' && result.url) {
        const urlParams = Linking.parse(result.url);
        const rawToken = urlParams.queryParams?.token;
        const jwt = Array.isArray(rawToken) ? rawToken[0] : rawToken;
        if (jwt) {
          await AsyncStorage.setItem('reco_jwt', jwt);
          setToken(jwt);
          await fetchUserStatus(jwt);
        }
      }
    } catch (error) {
      console.error('OAuth Error:', error);
    }
  };

  const loginWithGoogle = () => handleOAuthLogin('/auth/google');
  const loginWithMicrosoft = () => handleOAuthLogin('/auth/microsoft');
  
  const logout = async () => {
    await AsyncStorage.removeItem('reco_jwt');
    setToken(null);
    setUser(null);
  };

  // Re-pull /auth/status so screens can sync user state after mutations
  // (e.g. the Builder refreshing resumeName/resumeData after an upload).
  const refreshUser = async () => {
    if (token) await fetchUserStatus(token);
  };

  return (
    <AuthContext.Provider value={{ token, user, pendingMailto, clearPendingMailto, loginWithGoogle, loginWithMicrosoft, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
