import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import OutreachModal from '@/components/OutreachModal';

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newJobUrl, setNewJobUrl] = useState('');
  const [newJobEmail, setNewJobEmail] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [isOutreachVisible, setOutreachVisible] = useState(false);
  const [isPrepVisible, setPrepVisible] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchJobs();
  }, [token]);

  // Listen to pending mailto links
  const { pendingMailto, clearPendingMailto } = useAuth();
  useEffect(() => {
    if (pendingMailto) {
      setNewJobEmail(pendingMailto);
      setAddModalVisible(true);
      clearPendingMailto();
    }
  }, [pendingMailto]);

  const handleExtractUrl = async () => {
    // We allow submission if either URL or Email is present
    if (!newJobUrl && !newJobEmail) return;
    setIsExtracting(true);
    try {
      const payload = { url: newJobUrl };
      if (newJobEmail) payload.email = newJobEmail;

      let res;
      if (newJobUrl) {
        res = await fetch('http://localhost:3000/jobs/extract-url', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Email only, no URL
        res = await fetch('http://localhost:3000/jobs', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            job: 'Manual Entry', 
            companyName: 'Unknown Company', 
            email: newJobEmail 
          })
        });
      }
      
      if (!res.ok) throw new Error('Failed to save job details');
      
      Alert.alert('Success', 'Job successfully extracted and saved!');
      setAddModalVisible(false);
      setNewJobUrl('');
      fetchJobs();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const deleteJob = async (id) => {
    try {
      await fetch(`http://localhost:3000/jobs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(jobs.filter(j => j._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const renderJob = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle}>{item.job || 'Unknown Title'}</Text>
          <Text style={styles.companyName}>{item.companyName || 'Unknown Company'}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteJob(item._id)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>X</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.atsScore}>
          ATS Match: {item.atsAnalysis?.score ? `${item.atsAnalysis.score}%` : 'N/A'}
        </Text>
        <Text style={styles.status} numberOfLines={1}>
          HR: {item.hrName || 'N/A'} • {item.email || 'No email'}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            setSelectedJob(item);
            setOutreachVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>Outreach</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.prepButton} 
          onPress={() => {
            setSelectedJob(item);
            setPrepVisible(true);
          }}
        >
          <Text style={styles.prepButtonText}>Prep</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RecoCareer.ai</Text>
        <Text style={styles.headerSubtitle}>Jobs Dashboard</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item._id}
          renderItem={renderJob}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No jobs tracked yet.</Text>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Job Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Job</Text>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.label}>Paste Job URL (LinkedIn, Indeed)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://linkedin.com/jobs/..."
              placeholderTextColor="#71717a"
              value={newJobUrl}
              onChangeText={setNewJobUrl}
              autoCapitalize="none"
            />

            <Text style={styles.label}>HR Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="hr@company.com"
              placeholderTextColor="#71717a"
              value={newJobEmail}
              onChangeText={setNewJobEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <TouchableOpacity 
              style={[styles.extractButton, isExtracting && { opacity: 0.7 }]} 
              onPress={handleExtractUrl}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.extractButtonText}>Extract & Save with AI</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <OutreachModal 
        visible={isOutreachVisible} 
        job={selectedJob} 
        onClose={() => {
          setOutreachVisible(false);
          setSelectedJob(null);
        }} 
      />

      {/* Prep Modal Placeholder */}
      <Modal visible={isPrepVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Interview Prep</Text>
            <TouchableOpacity onPress={() => setPrepVisible(false)}>
              <Text style={styles.cancelText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={{ color: '#f4f4f5', fontSize: 16, textAlign: 'center', marginTop: 40 }}>
              AI Interview Carousel and Auto-Grading will load here for {selectedJob?.companyName}.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a', backgroundColor: '#09090b' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#a1a1aa', marginTop: 4 },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#18181b', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  jobTitle: { fontSize: 18, fontWeight: 'bold', color: '#f4f4f5' },
  companyName: { fontSize: 14, color: '#a1a1aa', marginTop: 2 },
  deleteBtn: { padding: 4 },
  deleteText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  cardBody: { marginBottom: 16 },
  atsScore: { fontSize: 14, color: '#10b981', fontWeight: '600', marginBottom: 4 },
  status: { fontSize: 13, color: '#71717a' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 2, backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  prepButton: { flex: 1, backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  prepButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyText: { color: '#71717a', textAlign: 'center', marginTop: 40, fontSize: 16 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabText: { color: '#fff', fontSize: 32, fontWeight: '300', marginTop: -4 },
  
  modalContainer: { flex: 1, backgroundColor: '#09090b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  cancelText: { color: '#a1a1aa', fontSize: 16 },
  modalContent: { padding: 20 },
  label: { color: '#a1a1aa', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 16, color: '#fff', fontSize: 16, marginBottom: 20 },
  extractButton: { backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center' },
  extractButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
