import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL, WEB_URL } from '@/constants/api';
import { Theme, SharedStyles } from '@/constants/theme';
import {
  UserIcon,
  CopyIcon,
  LockIcon,
  XIcon,
  CheckCircleIcon,
  ZapIcon,
  AwardIcon,
} from '@/components/Icons';

export default function SettingsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const isPro = user?.subscriptionTier === 'pro';
  const referralUrl = user?.referralCode ? `${API_BASE_URL}/r/${user.referralCode}` : '';

  const jobLimit = isPro ? Infinity : 5;
  const aiLimit = isPro ? Infinity : 3;
  const jobPct = isPro ? 1 : Math.min((user?.jobCount || 0) / jobLimit, 1);
  const aiPct = isPro ? 1 : Math.min((user?.aiRequestCount || 0) / aiLimit, 1);

  const handleUpgrade = () => WebBrowser.openBrowserAsync(`${WEB_URL}/pricing`);

  const handleShareReferral = async () => {
    if (!referralUrl) return;
    try {
      await Share.share({ message: `Join me on RecoCareer.ai — ${referralUrl}` });
    } catch {
      Alert.alert('Referral Link', referralUrl);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          onClose();
        },
      },
    ]);
  };

  const initials = (user?.name || 'User')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account & Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <XIcon size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* User Profile Card */}
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user?.name || 'Authenticated User'}</Text>
                <Text style={styles.email}>{user?.email || 'user@recocareer.ai'}</Text>
              </View>
              <View style={[styles.planBadge, isPro ? styles.planPro : styles.planFree]}>
                <Text style={[styles.planText, isPro && { color: Theme.colors.brandPrimaryLight }]}>
                  {isPro ? 'PRO MEMBER' : 'FREE TIER'}
                </Text>
              </View>
            </View>
          </View>

          {/* Usage & Quota Limits */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Quota & Limits</Text>

            <View style={styles.quotaItem}>
              <View style={styles.quotaHeader}>
                <Text style={styles.quotaLabel}>Applications Tracked</Text>
                <Text style={styles.quotaValue}>
                  {user?.jobCount || 0} / {isPro ? 'Unlimited' : jobLimit}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: isPro ? '100%' : `${jobPct * 100}%`,
                      backgroundColor: Theme.colors.brandPrimary,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.quotaItem}>
              <View style={styles.quotaHeader}>
                <Text style={styles.quotaLabel}>AI Tailoring & Cover Letters</Text>
                <Text style={styles.quotaValue}>
                  {user?.aiRequestCount || 0} / {isPro ? 'Unlimited' : aiLimit}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: isPro ? '100%' : `${aiPct * 100}%`,
                      backgroundColor: Theme.colors.brandAccent,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Pro Upgrade Banner */}
          {!isPro ? (
            <View style={styles.upgradeCard}>
              <View style={styles.upgradeTop}>
                <View style={styles.sparkleCircle}>
                  <AwardIcon size={20} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upgradeTitle}>Upgrade to RecoCareer Pro</Text>
                  <Text style={styles.upgradeSub}>
                    Unlock unlimited AI auto-tailoring, custom templates, and direct recruiter email dispatch.
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
                <ZapIcon size={16} color="#ffffff" />
                <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Referral Card */}
          {referralUrl ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Invite Friends & Earn Credits</Text>
              <Text style={styles.cardDesc}>
                Share your referral link to earn bonus AI tailoring credits for every friend who joins.
              </Text>

              <TouchableOpacity style={styles.shareBtn} onPress={handleShareReferral}>
                <CopyIcon size={14} color={Theme.colors.brandPrimaryLight} />
                <Text style={styles.shareBtnText}>Share Referral Link</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Logout Action */}
          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
            <LockIcon size={16} color={Theme.colors.brandRose} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bgApp,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderCard,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textMain,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: 16,
    ...Theme.shadows.card,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: Theme.colors.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textMain,
  },
  email: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
  },
  planPro: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  planFree: {
    backgroundColor: Theme.colors.bgElevated,
    borderColor: Theme.colors.borderCard,
  },
  planText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSubtle,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textMain,
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    lineHeight: 17,
    marginBottom: 12,
  },
  quotaItem: {
    marginBottom: 14,
    gap: 6,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaLabel: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
  quotaValue: {
    fontSize: 12,
    color: Theme.colors.textMain,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.bgElevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  upgradeCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: 16,
    gap: 14,
  },
  upgradeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.glow,
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textMain,
  },
  upgradeSub: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    backgroundColor: Theme.colors.brandPrimary,
    borderRadius: Theme.radii.md,
    ...Theme.shadows.glow,
  },
  upgradeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
    backgroundColor: Theme.colors.bgElevated,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.brandPrimaryLight,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    backgroundColor: Theme.colors.bgCard,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.brandRose,
  },
});
