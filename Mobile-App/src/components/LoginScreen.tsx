import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { loginWithGoogle, loginWithMicrosoft } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brand}>
          {/* A placeholder for the logo */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>RC</Text>
          </View>
          <Text style={styles.title}>RecoCareer.ai</Text>
          <Text style={styles.subtitle}>Supercharge your job search with AI.</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={loginWithGoogle}>
            <Text style={styles.buttonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.microsoftButton]} onPress={loginWithMicrosoft}>
            <Text style={styles.buttonText}>Continue with Microsoft</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  microsoftButton: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
