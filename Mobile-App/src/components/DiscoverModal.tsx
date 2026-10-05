import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
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
  CompassIcon,
  PlusIcon,
  BriefcaseIcon,
  XIcon,
  TargetIcon,
  CheckCircleIcon,
} from '@/components/Icons';

export default function DiscoverModal({
  visible,
  onClose,
  onImported,
}: {
  visible: boolean;
  onClose: () => void;
  onImported?: () => void;
}) {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(api('/scraped-jobs'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setJobs(Array.isArray(data.scrapedJobs) ? data.scrapedJobs : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

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
      Alert.alert('Imported', 'Job successfully captured into your tracker.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setImportingId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{item.title || item.job || 'Position'}</Text>
          <Text style={styles.company} numberOfLines={1}>
            {item.company || item.companyName || 'Company'}
            {item.location ? ` • ${item.location}` : ''}
          </Text>
        </View>
        <View style={styles.matchPill}>
          <TargetIcon size={12} color={Theme.colors.brandPrimaryLight} />
          <Text style={styles.matchText}>Profile Match</Text>
        </View>
      </View>

      {item.description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.importBtn, importingId === item._id && styles.importBtnDisabled]}
        onPress={() => handleImport(item._id)}
        disabled={importingId === item._id}
      >
        {importingId === item._id ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <>
            <PlusIcon size={14} color="#ffffff" />
            <Text style={styles.importText}>Import to Pipeline</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Discover Opportunities</Text>
            <Text style={styles.headerSubtitle}>AI-matched job postings based on your skills</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <XIcon size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Theme.colors.brandPrimary} />
            <Text style={styles.loadingText}>Searching job market...</Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <CompassIcon size={36} color={Theme.colors.textSubtle} />
                <Text style={styles.emptyTitle}>No new leads found</Text>
                <Text style={styles.emptySubtitle}>
                  Check back soon as our AI crawler aggregates new roles daily.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bgApp,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderCard,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textMain,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: 16,
    ...Theme.shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textMain,
  },
  company: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radii.full,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.brandPrimaryLight,
  },
  desc: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    lineHeight: 17,
    marginBottom: 12,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    backgroundColor: Theme.colors.brandPrimary,
    borderRadius: Theme.radii.md,
    ...Theme.shadows.glow,
  },
  importBtnDisabled: {
    opacity: 0.6,
  },
  importText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  center: {
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
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textMain,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
