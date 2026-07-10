import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';

// One card per replied job. Kept as its own component so each row owns its
// "suggest reply" loading and result state.
function InboxCard({ item, token }: { item: any; token: string | null }) {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [subject, setSubject] = useState('');

  const handleSuggestReply = async () => {
    setLoading(true);
    try {
      const res = await fetch(api(`/jobs/${item._id}/suggest-reply`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate a reply');
      setReply(data.suggestedReply || '');
      setSubject(data.subject || '');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobTitle}>{item.companyName}</Text>
        <Text style={styles.timeText}>{item.replyDate ? new Date(item.replyDate).toLocaleDateString() : ''}</Text>
      </View>
      <Text style={styles.sender}>From: {item.replyFrom || item.hrName}</Text>
      <Text style={styles.preview} numberOfLines={2}>
        The recruiter replied to your application for {item.job}.
      </Text>

      {reply ? (
        <View style={styles.replyBox}>
          {subject ? <Text style={styles.replySubject}>Subject: {subject}</Text> : null}
          <Text style={styles.replyText} selectable>{reply}</Text>
          <TouchableOpacity style={styles.regenBtn} onPress={handleSuggestReply} disabled={loading}>
            {loading ? <ActivityIndicator color="#a1a1aa" /> : <Text style={styles.regenText}>Regenerate</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.actionBtn} onPress={handleSuggestReply} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Suggest AI Reply</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function InboxScreen() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(api('/jobs'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        // GET /jobs returns { jobs, totalJobs, ... }, not a bare array.
        const list = Array.isArray(data) ? data : (data?.jobs ?? []);
        setJobs(list.filter((j: any) => j.hasReply));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const renderInboxItem = ({ item }: { item: any }) => <InboxCard item={item} token={token} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recruiter Inbox</Text>
        <Text style={styles.headerSubtitle}>Manage email replies and interview invites</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item._id}
          renderItem={renderInboxItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No replies from recruiters yet.</Text>
              <Text style={styles.emptySub}>Keep sending out applications!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#a1a1aa', marginTop: 4 },
  list: { padding: 16 },
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  jobTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  timeText: { color: '#a1a1aa', fontSize: 12 },
  sender: { color: '#10b981', fontSize: 14, marginBottom: 8 },
  preview: { color: '#a1a1aa', fontSize: 14, marginBottom: 16 },
  actionBtn: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  replyBox: { backgroundColor: '#09090b', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 12 },
  replySubject: { color: '#f4f4f5', fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  replyText: { color: '#d4d4d8', fontSize: 14, lineHeight: 20 },
  regenBtn: { marginTop: 12, alignSelf: 'flex-start' },
  regenText: { color: '#4f46e5', fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#f4f4f5', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { color: '#71717a', fontSize: 14 }
});
