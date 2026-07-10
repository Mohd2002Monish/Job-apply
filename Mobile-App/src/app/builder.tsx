import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { fetch as expoFetch } from 'expo/fetch';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';

// resumeData.skills is either a flat array (legacy) or categorized:
// { technical: [], soft: [], languages: [], tools: [] }
const flattenSkills = (skills: any): string[] => {
  if (Array.isArray(skills)) return skills;
  if (skills && typeof skills === 'object') {
    return Object.values(skills).flatMap((v: any) => (Array.isArray(v) ? v : []));
  }
  return [];
};

export default function BuilderScreen() {
  const { user, token, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSkills, setEditSkills] = useState('');

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if ((file.size ?? 0) > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be under 5MB');
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append('resume', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      } as any);

      const response = await fetch(api('/upload-resume'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type to multipart/form-data manually, fetch does it for FormData
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      await refreshUser();
      Alert.alert('Success', 'Resume successfully uploaded and parsed!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Upload Failed', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const templateId = user?.preferences?.defaultResumeTemplate || 'classic';
      const res = await expoFetch(api('/export-resume'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ templateId, format: 'pdf' }),
      });
      if (!res.ok) {
        let msg = 'Export failed';
        try { msg = (await res.json()).error || msg; } catch {}
        throw new Error(msg);
      }
      const bytes = await res.bytes();
      const pdf = new File(Paths.cache, `resume_${Date.now()}.pdf`);
      pdf.write(bytes);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdf.uri, { mimeType: 'application/pdf', dialogTitle: 'Your resume' });
      } else {
        Alert.alert('Saved', `Resume exported to ${pdf.uri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const skillsAreCategorized = user?.resumeData?.skills && !Array.isArray(user.resumeData.skills);

  const openEditModal = () => {
    const info = user?.resumeData?.personalInfo || {};
    setEditName(info.name || '');
    setEditEmail(info.email || '');
    setEditPhone(info.phone || '');
    const editable = skillsAreCategorized ? (user.resumeData.skills.technical || []) : flattenSkills(user?.resumeData?.skills);
    setEditSkills(editable.join(', '));
    setEditVisible(true);
  };

  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const skillList = editSkills.split(',').map(s => s.trim()).filter(Boolean);
      const resumeData = {
        ...user.resumeData,
        personalInfo: {
          ...(user.resumeData?.personalInfo || {}),
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
        },
        // Preserve categorized skill structure; only the technical list is edited here
        skills: skillsAreCategorized ? { ...user.resumeData.skills, technical: skillList } : skillList,
      };
      const res = await fetch(api('/resume/update'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes');
      await refreshUser();
      setEditVisible(false);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resume Builder</Text>
        <Text style={styles.headerSubtitle}>Manage your AI tailored resumes</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Resume</Text>
          {user?.hasResume ? (
            <Text style={styles.activeResume}>{user.resumeName}</Text>
          ) : (
            <Text style={styles.noResume}>No resume uploaded yet.</Text>
          )}

          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadResume} disabled={isUploading}>
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>
                {user?.hasResume ? 'Replace Resume (PDF)' : 'Upload Resume (PDF)'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {user?.hasResumeData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Parsed Data Overview</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.input}><Text style={styles.inputText}>{user.resumeData.personalInfo?.name || 'N/A'}</Text></View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.input}><Text style={styles.inputText}>{user.resumeData.personalInfo?.email || 'N/A'}</Text></View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Top Skills</Text>
              <View style={styles.input}><Text style={styles.inputText}>{flattenSkills(user.resumeData.skills).slice(0, 5).join(', ') || 'N/A'}</Text></View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
                <Text style={styles.editButtonText}>Edit Details</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPdf} disabled={isExporting}>
                {isExporting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.downloadButtonText}>Download PDF</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Details Modal */}
      <Modal visible={isEditVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Details</Text>
            <TouchableOpacity onPress={() => setEditVisible(false)} disabled={isSaving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.textInput} value={editName} onChangeText={setEditName} placeholder="Jane Doe" placeholderTextColor="#71717a" />

            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.textInput} value={editEmail} onChangeText={setEditEmail} placeholder="jane@example.com" placeholderTextColor="#71717a" autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.textInput} value={editPhone} onChangeText={setEditPhone} placeholder="+91 ..." placeholderTextColor="#71717a" keyboardType="phone-pad" />

            <Text style={styles.label}>{skillsAreCategorized ? 'Technical Skills (comma separated)' : 'Skills (comma separated)'}</Text>
            <TextInput style={[styles.textInput, styles.multiline]} value={editSkills} onChangeText={setEditSkills} placeholder="React, Node.js, SQL" placeholderTextColor="#71717a" multiline />

            <TouchableOpacity style={[styles.uploadButton, isSaving && { opacity: 0.7 }]} onPress={handleSaveDetails} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#a1a1aa', marginTop: 4 },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#18181b', padding: 20, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardTitle: { color: '#f4f4f5', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  activeResume: { color: '#10b981', fontSize: 16, marginBottom: 16 },
  noResume: { color: '#a1a1aa', fontSize: 16, marginBottom: 16 },
  uploadButton: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 8, alignItems: 'center' },
  uploadButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoText: { color: '#a1a1aa', fontSize: 14, marginBottom: 8 },
  formGroup: { marginBottom: 12 },
  label: { color: '#a1a1aa', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: '#27272a', padding: 12, borderRadius: 6 },
  inputText: { color: '#f4f4f5', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  editButton: { flex: 1, backgroundColor: '#27272a', padding: 14, borderRadius: 8, alignItems: 'center' },
  editButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  downloadButton: { flex: 1, backgroundColor: '#10b981', padding: 14, borderRadius: 8, alignItems: 'center' },
  downloadButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  modalContainer: { flex: 1, backgroundColor: '#09090b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  cancelText: { color: '#a1a1aa', fontSize: 16 },
  modalContent: { padding: 20 },
  textInput: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 14, color: '#fff', fontSize: 15, marginBottom: 18 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});
