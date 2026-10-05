import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';
import { Theme, SharedStyles } from '@/constants/theme';
import {
  MailIcon,
  SendIcon,
  RefreshIcon,
  CopyIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@/components/Icons';

function InboxCard({ item, token }: { item: any; token: string | null }) {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [subject, setSubject] = useState('');
  const [copied, setCopied] = useState(false);

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

  const initials = (item.companyName || 'CO')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.card}>
      {/* Recruiter & Company Top Header */}
      <View style={styles.cardHeader}>
        <View style={styles.senderGroup}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.companyName}>{item.companyName || 'Company'}</Text>
            <View style={styles.senderRow}>
              <UserIcon size={12} color={Theme.colors.textSubtle} />
              <Text style={styles.senderText}>{item.replyFrom || item.hrName || item.hrEmail || 'Recruiter'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.badge}>
          <ClockIcon size={11} color={Theme.colors.brandAccent} />
          <Text style={styles.badgeText}>
            {item.replyDate ? new Date(item.replyDate).toLocaleDateString() : 'Replied'}
          </Text>
        </View>
      </View>

      {/* Message Preview */}
      <View style={styles.previewBox}>
        <Text style={styles.previewText} numberOfLines={3}>
          {item.replySnippet || `Recruiter replied regarding your application for the ${item.job || 'open'} position.`}
        </Text>
      </View>

      {/* AI Suggested Response Box */}
      {reply ? (
        <View style={styles.replyBox}>
          <View style={styles.replyHeader}>
            <View style={styles.aiTag}>
              <MailIcon size={13} color={Theme.colors.brandPrimaryLight} />
              <Text style={styles.aiTagText}>Smart Suggested Response</Text>
            </View>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                Alert.alert('Copied', 'AI reply copied to clipboard!');
              }}
            >
              <CopyIcon size={13} color={Theme.colors.textMuted} />
              <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          {subject ? <Text style={styles.replySubject}>Subject: {subject}</Text> : null}
          <Text style={styles.replyBody} selectable>{reply}</Text>

          <View style={styles.replyActionsRow}>
            <TouchableOpacity
              style={styles.regenBtn}
              onPress={handleSuggestReply}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Theme.colors.textMuted} />
              ) : (
                <>
                  <RefreshIcon size={13} color={Theme.colors.textMuted} />
                  <Text style={styles.regenText}>Regenerate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleSuggestReply}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <SendIcon size={14} color="#ffffff" />
              <Text style={styles.actionBtnText}>Draft Quick Reply</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function InboxScreen() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInbox = () => {
    fetch(api('/jobs'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data?.jobs ?? [];
        setJobs(list.filter((j: any) => j.hasReply));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchInbox();
  }, [token]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recruiter Inbox</Text>
        <Text style={styles.headerSubtitle}>
          {jobs.length} Active {jobs.length === 1 ? 'Conversation' : 'Conversations'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.brandPrimary} />
          <Text style={styles.loadingText}>Syncing recruiter replies...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <InboxCard item={item} token={token} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MailIcon size={32} color={Theme.colors.textSubtle} />
              </View>
              <Text style={styles.emptyTitle}>Inbox Zero</Text>
              <Text style={styles.emptySubtitle}>
                No recruiter responses yet. Keep sending tailored outreach emails to generate replies!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Theme.colors.bgApp,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 24 : 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderCard,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textMain,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
    gap: 12,
  },
  card: {
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: 16,
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  senderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Theme.colors.bgElevated,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.brandAccent,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textMain,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  senderText: {
    fontSize: 12,
    color: Theme.colors.textSubtle,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radii.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.brandAccent,
  },
  previewBox: {
    backgroundColor: Theme.colors.bgElevated,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    padding: 12,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    backgroundColor: Theme.colors.brandPrimary,
    borderRadius: Theme.radii.md,
    ...Theme.shadows.glow,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  replyBox: {
    backgroundColor: Theme.colors.bgInput,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    padding: 14,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  aiTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.brandPrimaryLight,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Theme.colors.bgElevated,
  },
  copyBtnText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  replySubject: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textMain,
    marginBottom: 6,
  },
  replyBody: {
    fontSize: 13,
    color: Theme.colors.textMain,
    lineHeight: 19,
  },
  replyActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Theme.colors.bgElevated,
  },
  regenText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textMain,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
