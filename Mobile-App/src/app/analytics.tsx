import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';

type Analytics = {
  total: number;
  applied: number;
  pending: number;
  replied: number;
  responseRate: number;
  avgReplyTimeHours: number;
};

export default function AnalyticsScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await fetch(api('/jobs/analytics'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load analytics');
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const funnel = data
    ? [
        { label: 'Tracked', value: data.total, color: '#6366f1' },
        { label: 'Applied', value: data.applied, color: '#8b5cf6' },
        { label: 'Replied', value: data.replied, color: '#10b981' },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnel.map(f => f.value));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Your application funnel & response rate</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor="#4f46e5" />}
        >
          {/* Response rate hero */}
          <View style={styles.heroCard}>
            <Text style={styles.heroValue}>{data?.responseRate ?? 0}%</Text>
            <Text style={styles.heroLabel}>Recruiter response rate</Text>
          </View>

          {/* Stat grid */}
          <View style={styles.grid}>
            <Stat label="Tracked" value={data?.total ?? 0} />
            <Stat label="Applied" value={data?.applied ?? 0} />
            <Stat label="Pending" value={data?.pending ?? 0} />
            <Stat label="Replies" value={data?.replied ?? 0} accent />
          </View>

          {/* Funnel bars */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pipeline</Text>
            {funnel.map(f => (
              <View key={f.label} style={styles.barRow}>
                <Text style={styles.barLabel}>{f.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(f.value / funnelMax) * 100}%`, backgroundColor: f.color }]} />
                </View>
                <Text style={styles.barValue}>{f.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Avg. time to reply</Text>
            <Text style={styles.metricValue}>
              {data?.avgReplyTimeHours ? `${data.avgReplyTimeHours}h` : '—'}
            </Text>
            <Text style={styles.metricSub}>from send to recruiter response</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent && { color: '#10b981' }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#a1a1aa', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { color: '#f87171', fontSize: 14, textAlign: 'center' },
  content: { padding: 16 },
  heroCard: { backgroundColor: '#18181b', borderRadius: 16, borderWidth: 1, borderColor: '#27272a', padding: 24, alignItems: 'center', marginBottom: 16 },
  heroValue: { color: '#10b981', fontSize: 48, fontWeight: 'bold' },
  heroLabel: { color: '#a1a1aa', fontSize: 14, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flexGrow: 1, flexBasis: '45%', backgroundColor: '#18181b', borderRadius: 12, borderWidth: 1, borderColor: '#27272a', padding: 16 },
  statValue: { color: '#f4f4f5', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#a1a1aa', fontSize: 13, marginTop: 2 },
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardTitle: { color: '#f4f4f5', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { color: '#a1a1aa', fontSize: 13, width: 64 },
  barTrack: { flex: 1, height: 10, backgroundColor: '#27272a', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  barValue: { color: '#f4f4f5', fontSize: 13, fontWeight: '600', width: 32, textAlign: 'right' },
  metricValue: { color: '#f4f4f5', fontSize: 32, fontWeight: 'bold' },
  metricSub: { color: '#71717a', fontSize: 13, marginTop: 2 },
});
