import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Modal, SafeAreaView, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '@/constants/api';

// Shared job / recruiter-contact directory. Search, view recruiter details,
// and import into your own tracker. Backend: GET /jobs/finder,
// POST /jobs/finder/import/:id
export default function FinderModal({ visible, onClose, token, onImported }: {
  visible: boolean; onClose: () => void; token: string | null; onImported?: () => void;
}) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [importingId, setImportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(api('/jobs/finder'), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (visible) load(); }, [visible, load]);

  const handleImport = async (id: string) => {
    setImportingId(id);
    try {
      const res = await fetch(api(`/jobs/finder/import/${id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      onImported?.();
      Alert.alert('Imported', 'Job added to your tracker.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setImportingId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? jobs.filter(j =>
        [j.job, j.companyName, j.location, j.hrName].some(v => (v || '').toLowerCase().includes(q)))
    : jobs;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.job}</Text>
      <Text style={styles.company}>{item.companyName}{item.location ? ` · ${item.location}` : ''}</Text>
      {(item.hrName || item.email) ? (
        <Text style={styles.recruiter}>
          {item.hrName || 'Recruiter'}{item.email ? ` — ${item.email}` : ''}
        </Text>
      ) : null}
      <TouchableOpacity
        style={styles.importBtn}
        onPress={() => handleImport(item._id)}
        disabled={importingId === item._id}
      >
        {importingId === item._id ? <ActivityIndicator color="#fff" /> : <Text style={styles.importText}>Import to Tracker</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Recruiter Finder</Text>
            <Text style={styles.headerSub}>Shared roles & recruiter contacts</Text>
          </View>
          <TouchableOpacity onPress={onClose}><Text style={styles.done}>Done</Text></TouchableOpacity>
        </View>

        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search title, company, recruiter…"
          placeholderTextColor="#71717a"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No matching roles found.</Text>}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#a1a1aa', marginTop: 2 },
  done: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
  search: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#f4f4f5', margin: 16, marginBottom: 0 },
  list: { padding: 16 },
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#27272a' },
  title: { color: '#f4f4f5', fontSize: 16, fontWeight: 'bold' },
  company: { color: '#a1a1aa', fontSize: 13, marginTop: 2 },
  recruiter: { color: '#10b981', fontSize: 13, marginTop: 6 },
  importBtn: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  importText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  empty: { color: '#71717a', fontSize: 14, textAlign: 'center', marginTop: 60 },
});
