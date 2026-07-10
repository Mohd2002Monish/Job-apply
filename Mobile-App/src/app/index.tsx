import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';
import OutreachModal from '@/components/OutreachModal';
import DiscoverModal from '@/components/DiscoverModal';
import FinderModal from '@/components/FinderModal';
import SettingsModal from '@/components/SettingsModal';
import InterviewPrepModal from '@/components/InterviewPrepModal';
import SalaryModal from '@/components/SalaryModal';

// Mirrors the web app's StatusBadge: Replied > Opened > Sent > Pending
const StatusBadge = ({ job }: { job: any }) => {
  const status = job.hasReply
    ? { label: 'Replied', color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
    : job.isOpened
    ? { label: 'Opened', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' }
    : job.isEmailSent
    ? { label: 'Sent', color: '#818cf8', bg: 'rgba(99,102,241,0.14)' }
    : { label: 'Pending', color: '#a1a1aa', bg: 'rgba(161,161,170,0.12)' };
  return (
    <View style={[styles.badge, { backgroundColor: status.bg, borderColor: status.color }]}>
      <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
    </View>
  );
};

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newJobUrl, setNewJobUrl] = useState('');
  const [newJobEmail, setNewJobEmail] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [isOutreachVisible, setOutreachVisible] = useState(false);
  const [isPrepVisible, setPrepVisible] = useState(false);
  const [isSalaryVisible, setSalaryVisible] = useState(false);
  const [isDiscoverVisible, setDiscoverVisible] = useState(false);
  const [isFinderVisible, setFinderVisible] = useState(false);
  const [isSettingsVisible, setSettingsVisible] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch(api('/jobs'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      // GET /jobs returns a paginated object { jobs, totalJobs, ... }, not a
      // bare array. Accept either shape so the list actually populates.
      const list = Array.isArray(data) ? data : (data?.jobs ?? []);
      setJobs(list);
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
      const payload: any = { url: newJobUrl };
      if (newJobEmail) payload.email = newJobEmail;

      let res;
      if (newJobUrl) {
        res = await fetch(api('/jobs/extract-url'), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Email only, no URL
        res = await fetch(api('/jobs'), {
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
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await fetch(api(`/jobs/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(jobs.filter(j => j._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const renderJob = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle}>{item.job || 'Unknown Title'}</Text>
          <Text style={styles.companyName}>{item.companyName || 'Unknown Company'}</Text>
        </View>
        <StatusBadge job={item} />
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

        <TouchableOpacity
          style={styles.salaryButton}
          onPress={() => {
            setSelectedJob(item);
            setSalaryVisible(true);
          }}
        >
          <Text style={styles.prepButtonText}>Salary</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>RecoCareer.ai</Text>
          <Text style={styles.headerSubtitle}>Jobs Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setDiscoverVisible(true)}>
            <Text style={styles.headerBtnText}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setFinderVisible(true)}>
            <Text style={styles.headerBtnText}>Finder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accountBtn} onPress={() => setSettingsVisible(true)}>
            <Text style={styles.accountText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
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

      <InterviewPrepModal
        visible={isPrepVisible}
        job={selectedJob}
        token={token}
        onClose={() => { setPrepVisible(false); setSelectedJob(null); }}
      />

      <SalaryModal
        visible={isSalaryVisible}
        job={selectedJob}
        token={token}
        onClose={() => { setSalaryVisible(false); setSelectedJob(null); }}
      />

      <DiscoverModal
        visible={isDiscoverVisible}
        token={token}
        onClose={() => setDiscoverVisible(false)}
        onImported={fetchJobs}
      />

      <FinderModal
        visible={isFinderVisible}
        token={token}
        onClose={() => setFinderVisible(false)}
        onImported={fetchJobs}
      />

      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a', backgroundColor: '#09090b' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#a1a1aa', marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a' },
  headerBtnText: { color: '#e4e4e7', fontSize: 12, fontWeight: '600' },
  accountBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  accountText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#18181b', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
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
  salaryButton: { flex: 1, backgroundColor: '#8b5cf6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
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
