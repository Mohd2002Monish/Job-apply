import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function InboxScreen() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/jobs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter only jobs that have some reply data
          const repliedJobs = data.filter(j => j.hasReply);
          setJobs(repliedJobs);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const renderInboxItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobTitle}>{item.companyName}</Text>
        <Text style={styles.timeText}>{new Date(item.replyDate).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.sender}>From: {item.replyFrom || item.hrName}</Text>
      <Text style={styles.preview} numberOfLines={2}>
        We received your application for {item.job}. The recruiter has responded to your email thread!
      </Text>
      
      <TouchableOpacity style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>Suggest AI Reply</Text>
      </TouchableOpacity>
    </View>
  );

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
  actionBtn: { backgroundColor: '#27272a', padding: 12, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#f4f4f5', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { color: '#71717a', fontSize: 14 }
});
