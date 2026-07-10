import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '@/constants/api';

// AI salary benchmarking + negotiation talking points for a job.
// Backend: POST /jobs/:id/salary-negotiation
//   body { offeredSalary?: number, targetSalary?: number, currency, location }
//   → { success, salaryNegotiation: { marketLow, marketAverage, marketHigh, marketInsights, talkingPoints[] } }
export default function SalaryModal({ visible, job, token, onClose }: {
  visible: boolean; job: any; token: string | null; onClose: () => void;
}) {
  const [offered, setOffered] = useState('');
  const [target, setTarget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setResult(job?.salaryNegotiation || null);
    setOffered(''); setTarget('');
  }, [job?._id]);

  if (!job) return null;

  const num = (s: string) => { const n = parseFloat(s.replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : null; };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch(api(`/jobs/${job._id}/salary-negotiation`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          offeredSalary: num(offered),
          targetSalary: num(target),
          currency,
          location: job.location || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data.salaryNegotiation || null);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: any) => (v == null || v === '' ? '—' : `${currency} ${v}`);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Salary Negotiation</Text>
            <Text style={styles.sub}>{job.job} · {job.companyName}</Text>
          </View>
          <TouchableOpacity onPress={onClose}><Text style={styles.done}>Done</Text></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your numbers (optional)</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Offered</Text>
                <TextInput style={styles.input} value={offered} onChangeText={setOffered} keyboardType="numeric" placeholder="e.g. 90000" placeholderTextColor="#71717a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Target</Text>
                <TextInput style={styles.input} value={target} onChangeText={setTarget} keyboardType="numeric" placeholder="e.g. 110000" placeholderTextColor="#71717a" />
              </View>
              <View style={{ width: 80 }}>
                <Text style={styles.label}>Currency</Text>
                <TextInput style={styles.input} value={currency} onChangeText={setCurrency} autoCapitalize="characters" maxLength={4} />
              </View>
            </View>
            <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeText}>Get AI Benchmarks</Text>}
            </TouchableOpacity>
          </View>

          {result && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Market range</Text>
                <View style={styles.rangeRow}>
                  <Range label="Low" value={fmt(result.marketLow)} />
                  <Range label="Average" value={fmt(result.marketAverage)} accent />
                  <Range label="High" value={fmt(result.marketHigh)} />
                </View>
                {result.marketInsights ? <Text style={styles.insights}>{result.marketInsights}</Text> : null}
              </View>

              {Array.isArray(result.talkingPoints) && result.talkingPoints.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Talking points</Text>
                  {result.talkingPoints.map((tp: string, i: number) => (
                    <View key={i} style={styles.tpRow}>
                      <Text style={styles.tpBullet}>•</Text>
                      <Text style={styles.tpText} selectable>{tp}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Range({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.rangeItem}>
      <Text style={styles.rangeLabel}>{label}</Text>
      <Text style={[styles.rangeValue, accent && { color: '#10b981' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 13, color: '#a1a1aa', marginTop: 2 },
  done: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
  content: { padding: 16 },
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardTitle: { color: '#f4f4f5', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  label: { color: '#a1a1aa', fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: '#09090b', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 10, color: '#f4f4f5', fontSize: 14 },
  analyzeBtn: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  analyzeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeItem: { alignItems: 'center', flex: 1 },
  rangeLabel: { color: '#71717a', fontSize: 12 },
  rangeValue: { color: '#f4f4f5', fontSize: 15, fontWeight: 'bold', marginTop: 4 },
  insights: { color: '#a1a1aa', fontSize: 13, lineHeight: 19, marginTop: 14 },
  tpRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tpBullet: { color: '#4f46e5', fontSize: 14 },
  tpText: { color: '#d4d4d8', fontSize: 13, lineHeight: 19, flex: 1 },
});
