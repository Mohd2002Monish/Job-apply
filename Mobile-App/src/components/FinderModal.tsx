import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';
import { Theme, SharedStyles } from '@/constants/theme';
import {
  SearchIcon,
  PlusIcon,
  UserIcon,
  MailIcon,
  XIcon,
  CheckCircleIcon,
  BriefcaseIcon,
} from '@/components/Icons';

export default function FinderModal({
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
  const [query, setQuery] = useState('');
  const [importingId, setImportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(api('/jobs/finder'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
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
      const res = await fetch(api(`/jobs/finder/import/${id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      onImported?.();
      Alert.alert('Imported', 'Job and recruiter contact added to your pipeline.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setImportingId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? jobs.filter(j =>
        [j.job, j.companyName, j.location, j.hrName, j.email, j.hrEmail].some(v =>
          (v || '').toLowerCase().includes(q)
        )
      )
    : jobs;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{item.job || 'Position'}</Text>
          <Text style={styles.company} numberOfLines={1}>
            {item.companyName || 'Company'}
            {item.location ? ` • ${item.location}` : ''}
          </Text>
        </View>
        <View style={styles.verifiedPill}>
          <CheckCircleIcon size={11} color={Theme.colors.brandAccent} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      </View>

      <View style={styles.recruiterBox}>
        <UserIcon size={13} color={Theme.colors.textSubtle} />
        <Text style={styles.recruiterText}>
          {item.hrName || 'Hiring Lead'} • {item.email || item.hrEmail || 'Email on file'}
        </Text>
      </View>

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
            <Text style={styles.importText}>Import & Reach Out</Text>
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
            <Text style={styles.headerTitle}>Recruiter Directory</Text>
            <Text style={styles.headerSubtitle}>Verified hiring managers & talent partners</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <XIcon size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchIcon size={16} color={Theme.colors.textSubtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by company, title, or recruiter name..."
            placeholderTextColor={Theme.colors.textSubtle}
            value={query}
            onChangeText={setQuery}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <XIcon size={16} color={Theme.colors.textSubtle} />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Theme.colors.brandPrimary} />
            <Text style={styles.loadingText}>Loading directory...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <SearchIcon size={36} color={Theme.colors.textSubtle} />
                <Text style={styles.emptyTitle}>No matching contacts</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search terms.</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.bgInput,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.textMain,
    fontSize: 14,
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
  verifiedPill: {
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
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.brandAccent,
  },
  recruiterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.bgElevated,
    borderRadius: Theme.radii.sm,
    padding: 8,
    marginBottom: 12,
  },
  recruiterText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '500',
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
  },
});
