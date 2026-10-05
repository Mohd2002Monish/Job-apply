import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Theme, SharedStyles } from '@/constants/theme';
import { GoogleIcon, MicrosoftIcon, BriefcaseIcon, TargetIcon, SendIcon, TrendingUpIcon, LockIcon, ZapIcon } from '@/components/Icons';

export default function LoginScreen() {
  const { loginWithGoogle, loginWithMicrosoft } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'microsoft' | null>(null);

  const handleGoogle = async () => {
    setLoadingProvider('google');
    try {
      await loginWithGoogle();
    } finally {
      setTimeout(() => setLoadingProvider(null), 3000);
    }
  };

  const handleMicrosoft = async () => {
    setLoadingProvider('microsoft');
    try {
      await loginWithMicrosoft();
    } finally {
      setTimeout(() => setLoadingProvider(null), 3000);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        {/* Top Glowing Header Badge */}
        <View style={styles.header}>
          <View style={styles.badgeWrapper}>
            <View style={styles.logoBadge}>
              <BriefcaseIcon size={32} color="#ffffff" strokeWidth={2.2} />
            </View>
            <View style={styles.glowRing} />
          </View>
          <Text style={styles.brandTitle}>RecoCareer<Text style={{ color: Theme.colors.brandPrimaryLight }}>.ai</Text></Text>
          <Text style={styles.brandSubtitle}>
            Autonomous AI Job Application & Career Outreach Platform
          </Text>
        </View>

        {/* Feature Highlights Grid */}
        <View style={styles.featuresSection}>
          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
              <TargetIcon size={18} color={Theme.colors.brandPrimaryLight} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>AI Resume Tailoring</Text>
              <Text style={styles.featureDesc}>Extract keywords & match ATS scores instantly for each application.</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
              <SendIcon size={18} color={Theme.colors.brandAccent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Automated Recruiter Outreach</Text>
              <Text style={styles.featureDesc}>Send tailored cover letters and follow-up emails in one tap.</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
              <TrendingUpIcon size={18} color={Theme.colors.brandCyan} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Recruiter Reply Tracking</Text>
              <Text style={styles.featureDesc}>Track email opens, responses, and generate AI replies in real-time.</Text>
            </View>
          </View>
        </View>

        {/* OAuth Authentication Actions */}
        <View style={styles.authCard}>
          <Text style={styles.authPrompt}>Get started in seconds</Text>

          <TouchableOpacity
            style={[styles.oauthBtn, loadingProvider === 'google' && styles.oauthBtnLoading]}
            onPress={handleGoogle}
            activeOpacity={0.85}
            disabled={!!loadingProvider}
          >
            {loadingProvider === 'google' ? (
              <ActivityIndicator color={Theme.colors.textMain} size="small" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text style={styles.oauthBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.oauthBtn, loadingProvider === 'microsoft' && styles.oauthBtnLoading]}
            onPress={handleMicrosoft}
            activeOpacity={0.85}
            disabled={!!loadingProvider}
          >
            {loadingProvider === 'microsoft' ? (
              <ActivityIndicator color={Theme.colors.textMain} size="small" />
            ) : (
              <>
                <MicrosoftIcon size={20} />
                <Text style={styles.oauthBtnText}>Continue with Microsoft</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.securityFooter}>
            <LockIcon size={13} color={Theme.colors.textSubtle} />
            <Text style={styles.securityText}>Enterprise OAuth 2.0 & SSL Encrypted</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.bgApp,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 20,
    paddingBottom: 28,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  badgeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Theme.colors.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Theme.shadows.glow,
  },
  glowRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    zIndex: 1,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.textMain,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  featuresSection: {
    gap: 10,
    marginVertical: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textMain,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    lineHeight: 16,
  },
  authCard: {
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.xl,
    padding: 20,
    marginTop: 16,
    ...Theme.shadows.card,
  },
  authPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 16,
  },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Theme.colors.bgElevated,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    height: 52,
    marginBottom: 12,
  },
  oauthBtnLoading: {
    opacity: 0.7,
  },
  oauthBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.textMain,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  securityText: {
    fontSize: 11,
    color: Theme.colors.textSubtle,
  },
});
