import React from 'react';
import { StyleSheet, Text, View, Modal, SafeAreaView, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL, WEB_URL } from '@/constants/api';

// Account screen: profile, plan + usage, referral link, upgrade, logout.
// Usage/referral data comes from /auth/status (stored on user by useAuth).
export default function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
      Alert.alert('Referral link', referralUrl);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { logout(); onClose(); } },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.done}>Done</Text></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile */}
          <View style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.name || 'User'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
            <View style={[styles.planBadge, isPro ? styles.planPro : styles.planFree]}>
              <Text style={[styles.planText, isPro && { color: '#c7d2fe' }]}>{isPro ? 'PRO' : 'FREE'}</Text>
            </View>
          </View>

          {/* Usage */}
          <View style={styles.card2}>
            <Text style={styles.cardTitle}>Usage</Text>
            <Meter label="Jobs tracked" value={user?.jobCount || 0} limit={jobLimit} pct={jobPct} />
            <Meter label="AI features this month" value={user?.aiRequestCount || 0} limit={aiLimit} pct={aiPct} />
            {!isPro && (
              <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
                <Text style={styles.upgradeText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Referrals */}
          <View style={styles.card2}>
            <Text style={styles.cardTitle}>Referrals</Text>
            <View style={styles.referralStats}>
              <View style={styles.refStat}><Text style={styles.refNum}>{user?.referralClicks || 0}</Text><Text style={styles.refLabel}>Clicks</Text></View>
              <View style={styles.refStat}><Text style={[styles.refNum, { color: '#10b981' }]}>{user?.referralConversions || 0}</Text><Text style={styles.refLabel}>Pro converts</Text></View>
            </View>
            {referralUrl ? <Text style={styles.refLink} selectable numberOfLines={1}>{referralUrl}</Text> : null}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareReferral} disabled={!referralUrl}>
              <Text style={styles.shareText}>Share referral link</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Meter({ label, value, limit, pct }: { label: string; value: number; limit: number; pct: number }) {
  const display = limit === Infinity ? `${value} / ∞` : `${value} / ${limit}`;
  const over = limit !== Infinity && value > limit;
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.meterRow}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={[styles.meterValue, over && { color: '#f87171' }]}>{display}</Text>
      </View>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${pct * 100}%`, backgroundColor: over ? '#f87171' : '#6366f1' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  done: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
  content: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  name: { color: '#f4f4f5', fontSize: 16, fontWeight: 'bold' },
  email: { color: '#a1a1aa', fontSize: 13, marginTop: 2 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  planFree: { backgroundColor: '#27272a' },
  planPro: { backgroundColor: '#3730a3' },
  planText: { fontSize: 11, fontWeight: 'bold', color: '#a1a1aa' },
  card2: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardTitle: { color: '#f4f4f5', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  meterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  meterLabel: { color: '#a1a1aa', fontSize: 13 },
  meterValue: { color: '#f4f4f5', fontSize: 13, fontWeight: '600' },
  meterTrack: { height: 8, backgroundColor: '#27272a', borderRadius: 5, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 5 },
  upgradeBtn: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  upgradeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  referralStats: { flexDirection: 'row', gap: 24, marginBottom: 12 },
  refStat: { alignItems: 'center' },
  refNum: { color: '#f4f4f5', fontSize: 22, fontWeight: 'bold' },
  refLabel: { color: '#71717a', fontSize: 11, marginTop: 2 },
  refLink: { color: '#a1a1aa', fontSize: 12, backgroundColor: '#09090b', padding: 10, borderRadius: 8, marginBottom: 10 },
  shareBtn: { backgroundColor: '#27272a', padding: 12, borderRadius: 8, alignItems: 'center' },
  shareText: { color: '#f4f4f5', fontWeight: '600', fontSize: 14 },
  logoutBtn: { padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#7f1d1d', marginTop: 4 },
  logoutText: { color: '#f87171', fontWeight: 'bold', fontSize: 14 },
});
