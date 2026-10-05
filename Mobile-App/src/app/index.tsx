import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';
import { Theme, SharedStyles } from '@/constants/theme';
import {
  PlusIcon,
  SearchIcon,
  CompassIcon,
  SettingsIcon,
  BriefcaseIcon,
  SendIcon,
  BotIcon,
  DollarSignIcon,
  CheckCircleIcon,
  ClockIcon,
  TargetIcon,
  XIcon,
  UserIcon,
} from '@/components/Icons';
import OutreachModal from '@/components/OutreachModal';
import DiscoverModal from '@/components/DiscoverModal';
import FinderModal from '@/components/FinderModal';
import SettingsModal from '@/components/SettingsModal';
import InterviewPrepModal from '@/components/InterviewPrepModal';
import SalaryModal from '@/components/SalaryModal';

// Status Badge with Glowing Colored Dot (Zero Emojis)
const StatusBadge = ({ job }: { job: any }) => {
  const status = job.hasReply
    ? { label: 'Replied', color: Theme.colors.brandAccent, bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' }
    : job.isOpened
    ? { label: 'Opened', color: Theme.colors.brandCyan, bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' }
    : job.isEmailSent
    ? { label: 'Sent', color: Theme.colors.brandPrimaryLight, bg: 'rgba(99, 102, 241, 0.14)', border: 'rgba(99, 102, 241, 0.3)' }
    : { label: 'Pending', color: Theme.colors.textMuted, bg: 'rgba(161, 161, 170, 0.1)', border: 'rgba(161, 161, 170, 0.22)' };

  return (
    <View style={[styles.badge, { backgroundColor: status.bg, borderColor: status.border }]}>
      <View style={[styles.badgeDot, { backgroundColor: status.color }]} />
      <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
    </View>
  );
};

export default function HomeScreen() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REPLIED' | 'OPENED' | 'SENT' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newJobUrl, setNewJobUrl] = useState('');
  const [newJobEmail, setNewJobEmail] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isOutreachVisible, setOutreachVisible] = useState(false);
  const [isPrepVisible, setPrepVisible] = useState(false);
  const [isSalaryVisible, setSalaryVisible] = useState(false);
  const [isDiscoverVisible, setDiscoverVisible] = useState(false);
  const [isFinderVisible, setFinderVisible] = useState(false);
  const [isSettingsVisible, setSettingsVisible] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await fetch(api('/jobs'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.jobs ?? [];
      setJobs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchJobs();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const { pendingMailto, clearPendingMailto } = useAuth();
  useEffect(() => {
    if (pendingMailto) {
      setNewJobEmail(pendingMailto);
      setAddModalVisible(true);
      clearPendingMailto();
    }
  }, [pendingMailto]);

  const handleExtractUrl = async () => {
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
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(api('/jobs'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            companyName: 'New Opportunity',
            job: 'Position',
            hrEmail: newJobEmail,
            source: 'Manual / Mailto',
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process job');

      setNewJobUrl('');
      setNewJobEmail('');
      setAddModalVisible(false);
      fetchJobs();
      Alert.alert('Job Added', 'Job application captured into your pipeline!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch =
        searchQuery === '' ||
        (job.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.job || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'REPLIED') return job.hasReply;
      if (statusFilter === 'OPENED') return job.isOpened && !job.hasReply;
      if (statusFilter === 'SENT') return job.isEmailSent && !job.isOpened && !job.hasReply;
      if (statusFilter === 'PENDING') return !job.isEmailSent && !job.hasReply;
      return true;
    });
  }, [jobs, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const replies = jobs.filter(j => j.hasReply).length;
    const sent = jobs.filter(j => j.isEmailSent).length;
    return { total, replies, sent };
  }, [jobs]);

  const renderJobCard = ({ item }: { item: any }) => {
    const initials = (item.companyName || 'CO')
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase();

    const ats = item.atsAnalysis?.score || item.atsScore || null;

    return (
      <View style={styles.jobCard}>
        {/* Top Header: Company Avatar + Titles + Status Badge */}
        <View style={styles.cardTopRow}>
          <View style={styles.companyInfo}>
            <View style={styles.avatarPill}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.jobTitleText} numberOfLines={1}>{item.job || 'Position'}</Text>
              <Text style={styles.companyText} numberOfLines={1}>
                {item.companyName || 'Company'}
                {item.location ? ` • ${item.location}` : ''}
              </Text>
            </View>
          </View>
          <StatusBadge job={item} />
        </View>

        {/* Metadata Badges: ATS Score & Recruiter */}
        <View style={styles.metaRow}>
          {ats ? (
            <View style={styles.atsBadge}>
              <TargetIcon size={12} color={Theme.colors.brandAccent} />
              <Text style={styles.atsBadgeText}>{ats}% Match</Text>
            </View>
          ) : (
            <View style={styles.atsBadgeNeutral}>
              <Text style={styles.atsBadgeNeutralText}>ATS Untested</Text>
            </View>
          )}

          {item.hrEmail ? (
            <View style={styles.recruiterPill}>
              <UserIcon size={12} color={Theme.colors.textSubtle} />
              <Text style={styles.recruiterPillText} numberOfLines={1}>
                {item.hrName || item.hrEmail}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Professional 3-Button Responsive Toolbar */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.cardBtn, styles.cardBtnPrimary]}
            onPress={() => {
              setSelectedJob(item);
              setOutreachVisible(true);
            }}
          >
            <SendIcon size={11} color="#ffffff" />
            <Text style={styles.cardBtnPrimaryText} numberOfLines={1}>Outreach</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardBtn}
            onPress={() => {
              setSelectedJob(item);
              setPrepVisible(true);
            }}
          >
            <BotIcon size={11} color={Theme.colors.brandPrimaryLight} />
            <Text style={styles.cardBtnText} numberOfLines={1}>Interview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardBtn}
            onPress={() => {
              setSelectedJob(item);
              setSalaryVisible(true);
            }}
          >
            <DollarSignIcon size={11} color={Theme.colors.brandAccent} />
            <Text style={styles.cardBtnText} numberOfLines={1}>Salary</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Application Pipeline</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {stats.total} Tracked • {stats.replies} Responses • {stats.sent} Outreach Sent
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setSettingsVisible(true)}
          >
            <SettingsIcon size={18} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Action Shortcuts (Horizontal Scroll for Responsive Fit) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutsRow}
        >
          <TouchableOpacity
            style={[styles.shortcutCard, styles.shortcutCardPrimary]}
            onPress={() => setAddModalVisible(true)}
          >
            <PlusIcon size={13} color="#ffffff" />
            <Text style={styles.shortcutTextPrimary}>Add Job URL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => setDiscoverVisible(true)}
          >
            <CompassIcon size={13} color={Theme.colors.brandPrimaryLight} />
            <Text style={styles.shortcutText}>Discover Leads</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => setFinderVisible(true)}
          >
            <SearchIcon size={13} color={Theme.colors.brandAccent} />
            <Text style={styles.shortcutText}>Email Finder</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Filter Pills (Horizontal Scroll for Smooth Swiping) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {(['ALL', 'REPLIED', 'OPENED', 'SENT', 'PENDING'] as const).map(tab => {
            const isActive = statusFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setStatusFilter(tab)}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.brandPrimary} />
          <Text style={styles.loadingText}>Syncing application pipeline...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={item => item._id}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.colors.brandPrimary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <BriefcaseIcon size={32} color={Theme.colors.textSubtle} />
              </View>
              <Text style={styles.emptyTitle}>No applications found</Text>
              <Text style={styles.emptySubtitle}>
                {statusFilter === 'ALL'
                  ? 'Paste a job link or discover recruiter leads to get started.'
                  : `No jobs currently in ${statusFilter.toLowerCase()} status.`}
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => setAddModalVisible(true)}
              >
                <PlusIcon size={14} color="#ffffff" />
                <Text style={styles.emptyBtnText}>Add Your First Job</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add Job URL Modal */}
      <Modal visible={isAddModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Job to Pipeline</Text>
                <Text style={styles.modalSub}>Paste posting link or recruiter email</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <XIcon size={20} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Job Posting URL (LinkedIn, Indeed, etc.)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://linkedin.com/jobs/view/..."
                placeholderTextColor={Theme.colors.textSubtle}
                value={newJobUrl}
                onChangeText={setNewJobUrl}
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Recruiter Email (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="recruiter@company.com"
                placeholderTextColor={Theme.colors.textSubtle}
                value={newJobEmail}
                onChangeText={setNewJobEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TouchableOpacity
                style={[styles.submitBtn, isExtracting && styles.submitBtnDisabled]}
                onPress={handleExtractUrl}
                disabled={isExtracting || (!newJobUrl && !newJobEmail)}
              >
                {isExtracting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <SendIcon size={14} color="#ffffff" />
                    <Text style={styles.submitBtnText}>Extract & Save to Pipeline</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feature Modals */}
      <OutreachModal
        visible={isOutreachVisible}
        job={selectedJob}
        onClose={() => setOutreachVisible(false)}
      />
      <DiscoverModal
        visible={isDiscoverVisible}
        onClose={() => {
          setDiscoverVisible(false);
          fetchJobs();
        }}
      />
      <FinderModal
        visible={isFinderVisible}
        onClose={() => setFinderVisible(false)}
      />
      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
      <InterviewPrepModal
        visible={isPrepVisible}
        job={selectedJob}
        onClose={() => setPrepVisible(false)}
      />
      <SalaryModal
        visible={isSalaryVisible}
        job={selectedJob}
        onClose={() => setSalaryVisible(false)}
      />
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
    backgroundColor: Theme.colors.bgApp,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 18 : 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderCard,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.textMain,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.sm,
  },
  shortcutCardPrimary: {
    backgroundColor: Theme.colors.brandPrimary,
    borderColor: Theme.colors.brandPrimary,
  },
  shortcutTextPrimary: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textMain,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Theme.radii.full,
    backgroundColor: Theme.colors.bgCard,
    borderWidth: 1,
    borderColor: Theme.colors.borderCard,
  },
  filterPillActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderColor: Theme.colors.brandPrimary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  filterPillTextActive: {
    color: Theme.colors.brandPrimaryLight,
    fontWeight: '700',
  },
  listContainer: {
    padding: 14,
    paddingBottom: 90,
    gap: 10,
    width: '100%',
  },
  jobCard: {
    backgroundColor: 'rgba(18, 18, 23, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: 14,
    width: '100%',
    ...Theme.shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  avatarPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.brandPrimaryLight,
  },
  jobTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textMain,
    letterSpacing: -0.2,
  },
  companyText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  atsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.28)',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  atsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.brandAccent,
  },
  atsBadgeNeutral: {
    backgroundColor: Theme.colors.bgElevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  atsBadgeNeutralText: {
    fontSize: 11,
    color: Theme.colors.textSubtle,
    fontWeight: '500',
  },
  recruiterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.bgElevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 1,
  },
  recruiterPillText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
    width: '100%',
  },
  cardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 4,
    borderRadius: Theme.radii.sm,
    backgroundColor: Theme.colors.bgElevated,
    borderWidth: 1,
    borderColor: Theme.colors.borderCard,
  },
  cardBtnPrimary: {
    backgroundColor: Theme.colors.brandPrimary,
    borderColor: Theme.colors.brandPrimary,
  },
  cardBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMain,
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
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textMain,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 18,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.brandPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.radii.md,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Theme.colors.bgCard,
    borderTopLeftRadius: Theme.radii.xl,
    borderTopRightRadius: Theme.radii.xl,
    borderWidth: 1,
    borderColor: Theme.colors.borderCard,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textMain,
  },
  modalSub: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Theme.colors.bgInput,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    color: Theme.colors.textMain,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.brandPrimary,
    borderRadius: Theme.radii.md,
    height: 44,
    marginTop: 16,
    ...Theme.shadows.glow,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
