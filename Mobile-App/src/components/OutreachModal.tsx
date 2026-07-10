import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, SafeAreaView, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';

export default function OutreachModal({ visible, job, onClose }: { visible: boolean; job: any; onClose: () => void }) {
  const { token } = useAuth();
  const [isTailoring, setIsTailoring] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [ats, setAts] = useState<any>(null);
  const [isCalcAts, setIsCalcAts] = useState(false);

  // Preload cover letter + ATS from the job, and reset when a different job
  // is opened in the modal.
  useEffect(() => {
    setCoverLetter(job?.coverLetter || '');
    setAts(job?.atsAnalysis || null);
  }, [job?._id]);

  if (!job) return null;

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const handleTailorResume = async () => {
    setIsTailoring(true);
    try {
      // Resume tailoring is queued server-side (returns 202) and runs in the
      // background, so report it honestly rather than faking instant success.
      const res = await fetch(api('/resume/tailor'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ jobId: job._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start tailoring');
      Alert.alert('Tailoring started', data.message || 'Your resume is being tailored for this job. Check the Builder shortly.');
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
      // /apply sends the cover letter stored on the job, so persist any edits
      // the user made in the text box before dispatching.
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

      // /apply returns { results: [{ jobId, success, error }] } — surface the
      // per-job outcome instead of assuming success on a 200.
      const result = Array.isArray(data.results) ? data.results[0] : null;
      if (result && !result.success) throw new Error(result.error || 'Send failed');

      Alert.alert('Sent', 'Application sent to the recruiter from your inbox.');
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
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{job.job}</Text>
            <Text style={styles.company}>{job.companyName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ATS Match Score</Text>
            <Text style={styles.scoreText}>{ats?.score != null ? `${ats.score}/100` : 'Not Calculated'}</Text>
            <Text style={styles.analysisText}>{ats?.analysis || 'Compare your active resume against this job description.'}</Text>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#27272a', marginTop: 12 }]} onPress={handleCalcAts} disabled={isCalcAts}>
              {isCalcAts ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>{ats?.score != null ? 'Recalculate ATS' : 'Calculate ATS Score'}</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Tailor Resume</Text>
            <Text style={styles.descText}>Use AI to rewrite your resume bullet points specifically for this job description.</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleTailorResume} disabled={isTailoring}>
              {isTailoring ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Tailor Resume with AI</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Cover Letter / Email Body</Text>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#27272a', marginBottom: 12 }]} onPress={handleGenerateCoverLetter} disabled={isGeneratingCL}>
              {isGeneratingCL ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Generate with AI</Text>}
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              multiline
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Write your email body here..."
              placeholderTextColor="#71717a"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Send to Recruiter</Text>
            <Text style={styles.descText}>HR: {job.hrName} ({job.email || 'No email'})</Text>
            
            <TouchableOpacity 
              style={[styles.sendBtn, (!coverLetter || !job.email) && { opacity: 0.5 }]} 
              onPress={handleSendEmail} 
              disabled={isSending || !coverLetter || !job.email}
            >
              {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>Send Application</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  company: { fontSize: 14, color: '#a1a1aa' },
  closeBtn: { padding: 8 },
  closeText: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
  content: { padding: 16 },
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardTitle: { color: '#f4f4f5', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  scoreText: { color: '#10b981', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  analysisText: { color: '#a1a1aa', fontSize: 14 },
  descText: { color: '#a1a1aa', fontSize: 14, marginBottom: 12 },
  actionBtn: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  textInput: { backgroundColor: '#09090b', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 12, color: '#f4f4f5', minHeight: 150, textAlignVertical: 'top' },
  sendBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
