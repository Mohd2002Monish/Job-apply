import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Modal, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '@/constants/api';

// Browse AI-discovered job postings matched to the user's profile and import
// them into the tracker. Backend: GET /scraped-jobs, POST /scraped-jobs/import/:id
export default function DiscoverModal({ visible, onClose, token, onImported }: {
  visible: boolean; onClose: () => void; token: string | null; onImported?: () => void;
}) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(api('/scraped-jobs'), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setJobs(Array.isArray(data.scrapedJobs) ? data.scrapedJobs : []);
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
      const res = await fetch(api(`/scraped-jobs/import/${id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setJobs(prev => prev.filter(j => j._id !== id));
      onImported?.();
      Alert.alert('Imported', 'Job added to your tracker.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setImportingId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title || item.job}</Text>
      <Text style={styles.company}>{item.company || item.companyName}{item.location ? ` · ${item.location}` : ''}</Text>
      {item.description ? <Text style={styles.desc} numberOfLines={3}>{item.description}</Text> : null}
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
            <Text style={styles.headerTitle}>Discover Jobs</Text>
            <Text style={styles.headerSub}>AI-matched postings for your profile</Text>
          </View>
          <TouchableOpacity onPress={onClose}><Text style={styles.done}>Done</Text></TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No new matches right now. Check back later.</Text>}
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
  list: { padding: 16 },
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#27272a' },
  title: { color: '#f4f4f5', fontSize: 16, fontWeight: 'bold' },
  company: { color: '#a1a1aa', fontSize: 13, marginTop: 2 },
  desc: { color: '#71717a', fontSize: 13, marginTop: 8, lineHeight: 18 },
  importBtn: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  importText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  empty: { color: '#71717a', fontSize: 14, textAlign: 'center', marginTop: 60 },
});
