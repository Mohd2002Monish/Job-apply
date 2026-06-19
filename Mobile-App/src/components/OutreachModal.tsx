import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, SafeAreaView, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function OutreachModal({ visible, job, onClose }) {
  const { token, user } = useAuth();
  const [isTailoring, setIsTailoring] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!job) return null;

  const handleTailorResume = async () => {
    setIsTailoring(true);
    // Simulate AI Tailoring for mobile UI
    setTimeout(() => {
      setIsTailoring(false);
      Alert.alert('Success', 'Resume tailored to this job!');
    }, 2000);
  };

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCL(true);
    // Simulate AI Cover Letter Generation
    setTimeout(() => {
      setCoverLetter(`Dear Hiring Manager,\n\nI am thrilled to apply for the ${job.job} position at ${job.companyName}. With my background in Software Engineering, I believe I would be a great fit.\n\nBest,\n${user?.name || 'Applicant'}`);
      setIsGeneratingCL(false);
    }, 2000);
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`http://localhost:3000/jobs/${job._id}/send-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emailBody: coverLetter })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      Alert.alert('Success', 'Application sent to recruiter!');
      onClose();
    } catch (err) {
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
            <Text style={styles.scoreText}>{job.atsAnalysis?.score ? `${job.atsAnalysis.score}/100` : 'Not Calculated'}</Text>
            <Text style={styles.analysisText}>{job.atsAnalysis?.analysis || 'No analysis available.'}</Text>
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
