import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';
import { Theme, SharedStyles } from '@/constants/theme';
import {
  DollarSignIcon,
  TrendingUpIcon,
  XIcon,
  CheckCircleIcon,
} from '@/components/Icons';

export default function SalaryModal({
  visible,
  job,
  onClose,
}: {
  visible: boolean;
  job: any;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [offered, setOffered] = useState('');
  const [target, setTarget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setResult(job?.salaryNegotiation || null);
    setOffered('');
    setTarget('');
  }, [job?._id]);

  if (!job) return null;

  const num = (s: string) => {
    const n = parseFloat(s.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : null;
  };

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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>Salary & Compensation</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {job.job || 'Position'} • {job.companyName || 'Company'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <XIcon size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Input Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Market Compensation Benchmark</Text>
            <Text style={styles.cardDesc}>
              Compare current offer against market percentiles for this title and location.
            </Text>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Offered Salary</Text>
                <TextInput
                  style={styles.input}
                  placeholder="$120,000"
                  placeholderTextColor={Theme.colors.textSubtle}
                  keyboardType="numeric"
                  value={offered}
                  onChangeText={setOffered}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Target Compensation</Text>
                <TextInput
                  style={styles.input}
                  placeholder="$145,000"
                  placeholderTextColor={Theme.colors.textSubtle}
                  keyboardType="numeric"
                  value={target}
                  onChangeText={setTarget}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <TrendingUpIcon size={16} color="#ffffff" />
                  <Text style={styles.analyzeBtnText}>Analyze Compensation & Strategy</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Market Insights & Percentiles Result */}
          {result ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Market Range Percentiles</Text>
                <View style={styles.benchmarkGrid}>
                  <View style={styles.benchmarkItem}>
                    <Text style={styles.benchmarkLabel}>25th Percentile</Text>
                    <Text style={styles.benchmarkVal}>
                      {result.marketLow ? `$${result.marketLow.toLocaleString()}` : '$110,000'}
                    </Text>
                  </View>
                  <View style={[styles.benchmarkItem, styles.benchmarkItemActive]}>
                    <Text style={styles.benchmarkLabelActive}>Median (50th)</Text>
                    <Text style={styles.benchmarkValActive}>
                      {result.marketAverage ? `$${result.marketAverage.toLocaleString()}` : '$135,000'}
                    </Text>
                  </View>
                  <View style={styles.benchmarkItem}>
                    <Text style={styles.benchmarkLabel}>90th Percentile</Text>
                    <Text style={styles.benchmarkVal}>
                      {result.marketHigh ? `$${result.marketHigh.toLocaleString()}` : '$165,000'}
                    </Text>
                  </View>
                </View>

                {result.marketInsights ? (
                  <View style={styles.insightBox}>
                    <Text style={styles.insightText}>{result.marketInsights}</Text>
                  </View>
                ) : null}
              </View>

              {/* Negotiation Scripts */}
              {Array.isArray(result.talkingPoints) && result.talkingPoints.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Negotiation Talking Points</Text>
                  <View style={styles.pointsList}>
                    {result.talkingPoints.map((point: string, idx: number) => (
                      <View key={idx} style={styles.pointItem}>
                        <CheckCircleIcon size={14} color={Theme.colors.brandAccent} />
                        <Text style={styles.pointText}>{point}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          ) : null}
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
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textMain,
  },
  sub: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 2,
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textMain,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    lineHeight: 17,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Theme.colors.bgInput,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    color: Theme.colors.textMain,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    backgroundColor: Theme.colors.brandPrimary,
    borderRadius: Theme.radii.md,
    ...Theme.shadows.glow,
  },
  analyzeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  benchmarkGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  benchmarkItem: {
    flex: 1,
    backgroundColor: Theme.colors.bgElevated,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    padding: 10,
    alignItems: 'center',
  },
  benchmarkItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: Theme.colors.brandPrimary,
  },
  benchmarkLabel: {
    fontSize: 11,
    color: Theme.colors.textSubtle,
    fontWeight: '600',
  },
  benchmarkLabelActive: {
    fontSize: 11,
    color: Theme.colors.brandPrimaryLight,
    fontWeight: '700',
  },
  benchmarkVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textMain,
    marginTop: 4,
  },
  benchmarkValActive: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.brandPrimaryLight,
    marginTop: 4,
  },
  insightBox: {
    backgroundColor: Theme.colors.bgElevated,
    borderRadius: Theme.radii.sm,
    padding: 10,
  },
  insightText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    lineHeight: 17,
  },
  pointsList: {
    gap: 8,
    marginTop: 8,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pointText: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.textMain,
    lineHeight: 18,
  },
});
