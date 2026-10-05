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
  BotIcon,
  AwardIcon,
  XIcon,
  CheckCircleIcon,
  CheckIcon,
} from '@/components/Icons';

export default function InterviewPrepModal({
  visible,
  job,
  onClose,
}: {
  visible: boolean;
  job: any;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);

  useEffect(() => {
    setQuestions(job?.interviewQuestions || []);
  }, [job?._id]);

  if (!job) return null;
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(api(`/jobs/${job._id}/interview-prep`), {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions');
      setQuestions(data.interviewQuestions || []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const setAnswer = (idx: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => (i === idx ? { ...q, userNotes: text } : q)));
  };

  const handleGrade = async (idx: number) => {
    const q = questions[idx];
    if (!q.userNotes?.trim()) {
      Alert.alert('Answer Required', 'Type your practice response before requesting AI grading.');
      return;
    }
    setGradingId(q._id || `${idx}`);
    try {
      await fetch(api(`/jobs/${job._id}`), {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ interviewQuestions: questions }),
      });
      const res = await fetch(api(`/jobs/${job._id}/grade-answer`), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ questionId: q._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Grading failed');
      setQuestions(prev =>
        prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                score: data.score,
                aiFeedback: data.aiFeedback,
                improvedVersion: data.improvedVersion,
              }
            : item
        )
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setGradingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>AI Interview Prep</Text>
            <Text style={styles.company} numberOfLines={1}>
              {job.job || 'Position'} • {job.companyName || 'Company'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <XIcon size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Top Generator Action Card */}
          <View style={styles.topCard}>
            <View style={styles.topCardHeader}>
              <View style={styles.iconCircle}>
                <BotIcon size={20} color={Theme.colors.brandPrimaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topCardTitle}>Role-Specific Practice</Text>
                <Text style={styles.topCardDesc}>
                  Generate curated technical & behavioral questions extracted from this job description.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.genBtn}
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <BotIcon size={16} color="#ffffff" />
                  <Text style={styles.genBtnText}>
                    {questions.length > 0 ? 'Regenerate Questions' : 'Generate Practice Questions'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Question Cards List */}
          {questions.map((q, idx) => (
            <View key={q._id || idx} style={styles.questionCard}>
              <View style={styles.qHeader}>
                <Text style={styles.qNumber}>Question {idx + 1}</Text>
                {q.category ? (
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{q.category}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.qText}>{q.question}</Text>

              {q.idealAnswer ? (
                <View style={styles.tipsBox}>
                  <Text style={styles.tipsTitle}>Key Points to Cover:</Text>
                  <Text style={styles.tipsText}>{q.idealAnswer}</Text>
                </View>
              ) : null}

              <TextInput
                style={styles.answerInput}
                multiline
                placeholder="Draft your answer here..."
                placeholderTextColor={Theme.colors.textSubtle}
                value={q.userNotes || ''}
                onChangeText={txt => setAnswer(idx, txt)}
              />

              <TouchableOpacity
                style={[
                  styles.gradeBtn,
                  gradingId === (q._id || `${idx}`) && styles.gradeBtnDisabled,
                ]}
                onPress={() => handleGrade(idx)}
                disabled={gradingId === (q._id || `${idx}`)}
              >
                {gradingId === (q._id || `${idx}`) ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <AwardIcon size={14} color="#ffffff" />
                    <Text style={styles.gradeBtnText}>AI Grade & Improve</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Feedback and Score Result */}
              {q.score != null ? (
                <View style={styles.feedbackBox}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreTitle}>AI Answer Score</Text>
                    <View style={styles.scorePill}>
                      <Text style={styles.scoreValue}>{q.score}/100</Text>
                    </View>
                  </View>

                  {q.aiFeedback ? (
                    <Text style={styles.feedbackText}>{q.aiFeedback}</Text>
                  ) : null}

                  {q.improvedVersion ? (
                    <View style={styles.improvedBox}>
                      <Text style={styles.improvedTitle}>Polished Star-Method Answer:</Text>
                      <Text style={styles.improvedText}>{q.improvedVersion}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))}
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
  topCard: {
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: 16,
    ...Theme.shadows.card,
  },
  topCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textMain,
  },
  topCardDesc: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    backgroundColor: Theme.colors.brandPrimary,
    borderRadius: Theme.radii.md,
    ...Theme.shadows.glow,
  },
  genBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  questionCard: {
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: 16,
    gap: 10,
    ...Theme.shadows.card,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.brandPrimaryLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.radii.full,
    backgroundColor: Theme.colors.bgElevated,
  },
  categoryText: {
    fontSize: 11,
    color: Theme.colors.textSubtle,
    fontWeight: '600',
  },
  qText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textMain,
    lineHeight: 20,
  },
  tipsBox: {
    backgroundColor: Theme.colors.bgElevated,
    borderRadius: Theme.radii.sm,
    padding: 10,
  },
  tipsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSubtle,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    lineHeight: 17,
  },
  answerInput: {
    backgroundColor: Theme.colors.bgInput,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    color: Theme.colors.textMain,
    fontSize: 13,
    lineHeight: 18,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  gradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    backgroundColor: Theme.colors.brandPrimary,
    borderRadius: Theme.radii.md,
  },
  gradeBtnDisabled: {
    opacity: 0.6,
  },
  gradeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  feedbackBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textMain,
  },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radii.full,
    backgroundColor: Theme.colors.brandAccent,
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  feedbackText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    lineHeight: 17,
  },
  improvedBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  improvedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.brandAccent,
    marginBottom: 4,
  },
  improvedText: {
    fontSize: 12,
    color: Theme.colors.textMain,
    lineHeight: 18,
  },
});
