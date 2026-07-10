import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '@/constants/api';

// Written interview practice. Backend:
//   POST /jobs/:id/interview-prep      → { interviewQuestions: [...] }
//   PUT  /jobs/:id                     → persist typed answers (question.userNotes)
//   POST /jobs/:id/grade-answer        → { score, aiFeedback, improvedVersion } for a saved answer
export default function InterviewPrepModal({ visible, job, token, onClose }: {
  visible: boolean; job: any; token: string | null; onClose: () => void;
}) {
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
      const res = await fetch(api(`/jobs/${job._id}/interview-prep`), { method: 'POST', headers: authHeaders });
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
    if (!q.userNotes?.trim()) { Alert.alert('Write an answer first', 'Type your answer, then grade it.'); return; }
    setGradingId(q._id);
    try {
      // The grader reads the answer from the server, so persist answers first.
      await fetch(api(`/jobs/${job._id}`), {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify({ interviewQuestions: questions }),
      });
      const res = await fetch(api(`/jobs/${job._id}/grade-answer`), {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ questionId: q._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Grading failed');
      setQuestions(prev => prev.map((item, i) =>
        i === idx ? { ...item, score: data.score, aiFeedback: data.aiFeedback, improvedVersion: data.improvedVersion } : item));
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
          <View>
            <Text style={styles.title}>Interview Prep</Text>
            <Text style={styles.sub}>{job.job} · {job.companyName}</Text>
          </View>
          <TouchableOpacity onPress={onClose}><Text style={styles.done}>Done</Text></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {questions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Generate 8 tailored questions based on this job description, then practice your answers and get AI feedback.</Text>
              <TouchableOpacity style={styles.genBtn} onPress={handleGenerate} disabled={generating}>
                {generating ? <ActivityIndicator color="#fff" /> : <Text style={styles.genText}>Generate Questions</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            questions.map((q, idx) => (
              <View key={q._id || idx} style={styles.qCard}>
                <View style={styles.qTop}>
                  <Text style={styles.qType}>{q.type}</Text>
                  {q.score != null && <Text style={styles.score}>{q.score}/10</Text>}
                </View>
                <Text style={styles.question}>{idx + 1}. {q.question}</Text>
                {q.suggestedPoints ? <Text style={styles.hint}>Hint: {q.suggestedPoints}</Text> : null}
                <TextInput
                  style={styles.answer}
                  multiline
                  value={q.userNotes}
                  onChangeText={(t) => setAnswer(idx, t)}
                  placeholder="Type your answer…"
                  placeholderTextColor="#71717a"
                />
                <TouchableOpacity style={styles.gradeBtn} onPress={() => handleGrade(idx)} disabled={gradingId === q._id}>
                  {gradingId === q._id ? <ActivityIndicator color="#fff" /> : <Text style={styles.gradeText}>Grade my answer</Text>}
                </TouchableOpacity>
                {q.aiFeedback ? (
                  <View style={styles.feedback}>
                    <Text style={styles.feedbackLabel}>AI Feedback</Text>
                    <Text style={styles.feedbackText}>{q.aiFeedback}</Text>
                    {q.improvedVersion ? (
                      <>
                        <Text style={[styles.feedbackLabel, { marginTop: 8 }]}>Model answer</Text>
                        <Text style={styles.feedbackText} selectable>{q.improvedVersion}</Text>
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 13, color: '#a1a1aa', marginTop: 2 },
  done: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
  content: { padding: 16 },
  emptyBox: { marginTop: 40, alignItems: 'center' },
  emptyText: { color: '#a1a1aa', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  genBtn: { backgroundColor: '#4f46e5', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8 },
  genText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  qCard: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  qTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  qType: { color: '#8b5cf6', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  score: { color: '#10b981', fontSize: 14, fontWeight: 'bold' },
  question: { color: '#f4f4f5', fontSize: 15, fontWeight: '600', lineHeight: 21 },
  hint: { color: '#71717a', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  answer: { backgroundColor: '#09090b', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 12, color: '#f4f4f5', minHeight: 90, textAlignVertical: 'top', marginTop: 10 },
  gradeBtn: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  gradeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  feedback: { backgroundColor: '#09090b', borderRadius: 8, padding: 12, marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#10b981' },
  feedbackLabel: { color: '#10b981', fontSize: 12, fontWeight: 'bold' },
  feedbackText: { color: '#d4d4d8', fontSize: 13, lineHeight: 19, marginTop: 4 },
});
