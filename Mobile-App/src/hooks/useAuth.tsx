import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export const AuthContext = createContext({
  token: null,
  user: null,
  pendingMailto: null,
  clearPendingMailto: () => {},
  loginWithGoogle: async () => {},
  loginWithMicrosoft: async () => {},
  logout: async () => {},
  isLoading: true,
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMailto, setPendingMailto] = useState(null);

  const incomingUrl = Linking.useURL();

  useEffect(() => {
    if (incomingUrl && incomingUrl.startsWith('mailto:')) {
      // Parse mailto:hr@company.com?subject=...
      const rawEmail = incomingUrl.replace('mailto:', '').split('?')[0];
      setPendingMailto(rawEmail);
    }
  }, [incomingUrl]);

  const clearPendingMailto = () => setPendingMailto(null);

  const fetchUserStatus = async (jwt) => {
    try {
      const res = await fetch('http://localhost:3000/auth/status', {
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

  const handleOAuthLogin = async (providerUrl) => {
    try {
      const redirectUri = Linking.createURL('/login');
      const authUrl = `http://localhost:3000${providerUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === 'success' && result.url) {
        const urlParams = Linking.parse(result.url);
        const jwt = urlParams.queryParams?.token;
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

  return (
    <AuthContext.Provider value={{ token, user, pendingMailto, clearPendingMailto, loginWithGoogle, loginWithMicrosoft, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
