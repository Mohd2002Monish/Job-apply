import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';
import { Theme, SharedStyles } from '@/constants/theme';
import {
  TargetIcon,
  SendIcon,
  CheckCircleIcon,
  FileTextIcon,
  XIcon,
  BotIcon,
  BriefcaseIcon,
  UserIcon,
} from '@/components/Icons';

export default function OutreachModal({
  visible,
  job,
  onClose,
}: {
  visible: boolean;
  job: any;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [isTailoring, setIsTailoring] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [ats, setAts] = useState<any>(null);
  const [isCalcAts, setIsCalcAts] = useState(false);

  useEffect(() => {
    setCoverLetter(job?.coverLetter || '');
    setAts(job?.atsAnalysis || null);
  }, [job?._id]);

  if (!job) return null;

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const handleTailorResume = async () => {
    setIsTailoring(true);
    try {
      const res = await fetch(api('/resume/tailor'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ jobId: job._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start tailoring');
      Alert.alert('Tailoring Queued', data.message || 'Your resume is being tailored for this position. Check the Builder tab shortly.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleCalcAts = async () => {
    setIsCalcAts(true);
    try {
      const res = await fetch(api('/resume/ats-score'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ jobId: job._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not calculate ATS score');
      setAts(data.atsAnalysis || null);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsCalcAts(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCL(true);
    try {
      const res = await fetch(api(`/jobs/${job._id}/generate-cover-letter`), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ tone: 'Professional', wordCount: 200 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setCoverLetter(data.coverLetter || '');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      if (coverLetter !== (job.coverLetter || '')) {
        await fetch(api(`/jobs/${job._id}`), {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ coverLetter }),
        });
      }

      const res = await fetch(api('/apply'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ jobIds: [job._id], attachCoverLetter: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');

      const result = Array.isArray(data.results) ? data.results[0] : null;
      if (result && !result.success) throw new Error(result.error || 'Send failed');

      Alert.alert('Email Dispatched', 'Your customized outreach email was sent to the recruiter.');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Modal Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{job.job || 'Position'}</Text>
            <Text style={styles.company} numberOfLines={1}>{job.companyName || 'Company'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <XIcon size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* 1. ATS Match Analysis */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>ATS Match Score</Text>
              {ats?.score != null ? (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{ats.score}/100</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.analysisText}>
              {ats?.analysis || 'Analyze how well your resume matches the required skills for this job.'}
            </Text>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={handleCalcAts}
              disabled={isCalcAts}
            >
              {isCalcAts ? (
                <ActivityIndicator color={Theme.colors.textMain} size="small" />
              ) : (
                <>
                  <TargetIcon size={16} color={Theme.colors.brandPrimaryLight} />
                  <Text style={styles.actionBtnSecondaryText}>
                    {ats?.score != null ? 'Recalculate ATS Score' : 'Calculate ATS Score'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 2. Tailor Resume */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. AI Resume Tailoring</Text>
            <Text style={styles.descText}>
              Inject targeted keywords and optimize bullet points specifically for this position.
            </Text>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={handleTailorResume}
              disabled={isTailoring}
            >
              {isTailoring ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <BotIcon size={16} color="#ffffff" />
                  <Text style={styles.actionBtnPrimaryText}>Tailor Resume with AI</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Cover Letter Generator */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>2. Tailored Outreach Message</Text>
              <TouchableOpacity
                style={styles.aiGenPill}
                onPress={handleGenerateCoverLetter}
                disabled={isGeneratingCL}
              >
                {isGeneratingCL ? (
                  <ActivityIndicator size="small" color={Theme.colors.brandPrimaryLight} />
                ) : (
                  <>
                    <FileTextIcon size={13} color={Theme.colors.brandPrimaryLight} />
                    <Text style={styles.aiGenPillText}>Draft Message</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              multiline
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Hi [Recruiter Name], I am writing to express my interest in..."
              placeholderTextColor={Theme.colors.textSubtle}
            />
          </View>

          {/* 4. Recruiter Dispatch */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Send to Recruiter</Text>
            <View style={styles.recruiterBox}>
              <UserIcon size={14} color={Theme.colors.textSubtle} />
              <Text style={styles.recruiterText}>
                {job.hrName || 'Recruiter'} ({job.hrEmail || job.email || 'No email specified'})
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!coverLetter || (!job.hrEmail && !job.email)) && styles.sendBtnDisabled,
              ]}
              onPress={handleSendEmail}
              disabled={isSending || !coverLetter || (!job.hrEmail && !job.email)}
            >
              {isSending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <SendIcon size={16} color="#ffffff" />
                  <Text style={styles.sendBtnText}>Dispatch Outreach Email</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  company: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textMain,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.brandAccent,
  },
  analysisText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  descText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: Theme.radii.md,
  },
  actionBtnPrimary: {
    backgroundColor: Theme.colors.brandPrimary,
    ...Theme.shadows.glow,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionBtnSecondary: {
    backgroundColor: Theme.colors.bgElevated,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textMain,
  },
  aiGenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radii.full,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
  },
  aiGenPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.brandPrimaryLight,
  },
  textInput: {
    backgroundColor: Theme.colors.bgInput,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    color: Theme.colors.textMain,
    fontSize: 13,
    lineHeight: 19,
    padding: 14,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  recruiterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.bgElevated,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.sm,
    padding: 10,
    marginBottom: 12,
  },
  recruiterText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: Theme.colors.brandAccent,
    borderRadius: Theme.radii.md,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
