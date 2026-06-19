import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, View, ActivityIndicator } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import LoginScreen from '@/components/LoginScreen';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

function RootNavigation() {
  const { token, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // If we don't have a token, show the Login Screen
  if (!token) {
    return <LoginScreen />;
  }

  // If we have a token, show the main Tabs
  return <AppTabs />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <RootNavigation />
      </ThemeProvider>
    </AuthProvider>
  );
}
