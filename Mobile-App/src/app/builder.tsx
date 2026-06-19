import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/hooks/useAuth';

export default function BuilderScreen() {
  const { user, token } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (file.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be under 5MB');
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append('resume', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      });

      const response = await fetch('http://localhost:3000/resumes/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type to multipart/form-data manually, fetch does it for FormData
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      Alert.alert('Success', 'Resume successfully uploaded and parsed!');
      // Ideally, trigger a refresh of the user context here
    } catch (err) {
      console.error(err);
      Alert.alert('Upload Failed', err.message);
    } finally {
      setIsUploading(false);
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
              <View style={styles.input}><Text style={styles.inputText}>{user.resumeData.skills?.slice(0, 5).join(', ') || 'N/A'}</Text></View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.downloadButton}>
                <Text style={styles.downloadButtonText}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
  downloadButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});
