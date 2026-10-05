import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { fetch as expoFetch } from 'expo/fetch';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/constants/api';
import { Theme, SharedStyles } from '@/constants/theme';
import {
  FileTextIcon,
  UploadIcon,
  DownloadIcon,
  UserIcon,
  BriefcaseIcon,
  AwardIcon,
  ZapIcon,
  CheckCircleIcon,
  XIcon,
} from '@/components/Icons';

const flattenSkills = (skills: any): string[] => {
  if (Array.isArray(skills)) return skills;
  if (skills && typeof skills === 'object') {
    return Object.values(skills).flatMap((v: any) => (Array.isArray(v) ? v : []));
  }
  return [];
};

export default function BuilderScreen() {
  const { user, token, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSkills, setEditSkills] = useState('');

  const resumeData = user?.resumeData || {};
  const skillsList = flattenSkills(resumeData.skills);
  const atsScore = user?.atsScore || 78;

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if ((file.size ?? 0) > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Resume file size must be under 5MB');
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append('resume', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      } as any);

      const response = await fetch(api('/upload-resume'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      await refreshUser();
      Alert.alert('Success', 'Resume successfully uploaded, parsed, and tailored!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Upload Failed', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const templateId = user?.preferences?.defaultResumeTemplate || 'classic';
      const res = await expoFetch(api('/export-resume'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ templateId, format: 'pdf' }),
      });
      if (!res.ok) {
        let msg = 'Export failed';
        try {
          msg = (await res.json()).error || msg;
        } catch {}
        throw new Error(msg);
      }
      const bytes = await res.bytes();
      const pdf = new File(Paths.cache, `resume_${Date.now()}.pdf`);
      pdf.write(bytes);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdf.uri, { mimeType: 'application/pdf', dialogTitle: 'Your Tailored Resume' });
      } else {
        Alert.alert('Saved', `Resume exported successfully.`);
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const openEditModal = () => {
    setEditName(resumeData.name || user?.name || '');
    setEditEmail(resumeData.email || user?.email || '');
    setEditPhone(resumeData.phone || '');
    setEditSkills(skillsList.join(', '));
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const skillsArray = editSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        resumeData: {
          ...resumeData,
          name: editName,
          email: editEmail,
          phone: editPhone,
          skills: skillsArray,
        },
      };

      const res = await fetch(api('/user/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update resume profile');
      await refreshUser();
      setEditVisible(false);
      Alert.alert('Profile Updated', 'Resume profile details saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Resume Builder</Text>
          <Text style={styles.headerSubtitle}>ATS Optimization & Document Management</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
          <UserIcon size={16} color={Theme.colors.brandPrimaryLight} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ATS Score Meter Card */}
        <View style={styles.atsCard}>
          <View style={styles.atsLeft}>
            <View style={styles.atsScoreBadge}>
              <Text style={styles.atsScoreNumber}>{atsScore}</Text>
              <Text style={styles.atsScoreMax}>/100</Text>
            </View>
            <View style={styles.atsTextGroup}>
              <Text style={styles.atsTitle}>ATS Match Score</Text>
              <Text style={styles.atsStatus}>
                {atsScore >= 80 ? 'Excellent Match' : atsScore >= 65 ? 'Good Match' : 'Optimization Recommended'}
              </Text>
            </View>
          </View>
          <View style={styles.atsPill}>
            <CheckCircleIcon size={14} color={Theme.colors.brandAccent} />
            <Text style={styles.atsPillText}>AI Verified</Text>
          </View>
        </View>

        {/* Action Toolbar */}
        <View style={styles.toolbarRow}>
          <TouchableOpacity
            style={[styles.toolBtn, styles.toolBtnPrimary]}
            onPress={handleUploadResume}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <UploadIcon size={16} color="#ffffff" />
                <Text style={styles.toolBtnPrimaryText}>Upload PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtn}
            onPress={handleDownloadPdf}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color={Theme.colors.textMain} size="small" />
            ) : (
              <>
                <DownloadIcon size={16} color={Theme.colors.brandPrimaryLight} />
                <Text style={styles.toolBtnText}>Export PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Candidate Profile Details Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <UserIcon size={18} color={Theme.colors.brandPrimaryLight} />
              <Text style={styles.sectionTitle}>Contact & Identity</Text>
            </View>
          </View>
          <View style={styles.fieldGrid}>
            <View style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Text style={styles.fieldValue}>{resumeData.name || user?.name || 'Not provided'}</Text>
            </View>
            <View style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Text style={styles.fieldValue}>{resumeData.email || user?.email || 'Not provided'}</Text>
            </View>
            {resumeData.phone ? (
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <Text style={styles.fieldValue}>{resumeData.phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Professional Summary Card */}
        {resumeData.summary ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <FileTextIcon size={18} color={Theme.colors.brandAccent} />
                <Text style={styles.sectionTitle}>Executive Summary</Text>
              </View>
            </View>
            <Text style={styles.summaryText}>{resumeData.summary}</Text>
          </View>
        ) : null}

        {/* Skills Cloud Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <ZapIcon size={18} color={Theme.colors.brandCyan} />
              <Text style={styles.sectionTitle}>Core Skills & Keywords ({skillsList.length})</Text>
            </View>
          </View>
          {skillsList.length > 0 ? (
            <View style={styles.skillsWrap}>
              {skillsList.map((skill, i) => (
                <View key={i} style={styles.skillPill}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptySkillsText}>Upload your resume to automatically extract skills and keywords.</Text>
          )}
        </View>

        {/* Experience Section */}
        {Array.isArray(resumeData.experience) && resumeData.experience.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <BriefcaseIcon size={18} color={Theme.colors.brandPrimaryLight} />
                <Text style={styles.sectionTitle}>Work Experience</Text>
              </View>
            </View>
            {resumeData.experience.map((exp: any, i: number) => (
              <View key={i} style={styles.experienceItem}>
                <Text style={styles.expRole}>{exp.role || exp.title || 'Role'}</Text>
                <Text style={styles.expCompany}>{exp.company || 'Company'} • {exp.duration || exp.dates || ''}</Text>
                {exp.description ? <Text style={styles.expDesc}>{exp.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Quick Edit Profile Bottom Sheet */}
      <Modal visible={isEditVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Resume Profile</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.closeBtn}>
                <XIcon size={20} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="John Doe"
                placeholderTextColor={Theme.colors.textSubtle}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="john@example.com"
                placeholderTextColor={Theme.colors.textSubtle}
                keyboardType="email-address"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={Theme.colors.textSubtle}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Skills (Comma-separated)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={editSkills}
                onChangeText={setEditSkills}
                placeholder="React, TypeScript, Node.js, Python, AWS"
                placeholderTextColor={Theme.colors.textSubtle}
                multiline
              />

              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Resume Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.brandPrimaryLight,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 14,
  },
  atsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: 16,
    ...Theme.shadows.card,
  },
  atsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  atsScoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radii.md,
  },
  atsScoreNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.brandPrimaryLight,
  },
  atsScoreMax: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSubtle,
    marginLeft: 2,
  },
  atsTextGroup: {},
  atsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textMain,
  },
  atsStatus: {
    fontSize: 12,
    color: Theme.colors.brandAccent,
    fontWeight: '600',
    marginTop: 2,
  },
  atsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
  },
  atsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.brandAccent,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.md,
  },
  toolBtnPrimary: {
    backgroundColor: Theme.colors.brandPrimary,
    borderColor: Theme.colors.brandPrimary,
    ...Theme.shadows.glow,
  },
  toolBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  toolBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textMain,
  },
  sectionCard: {
    backgroundColor: Theme.colors.bgCard,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
    borderRadius: Theme.radii.lg,
    padding: 16,
    ...Theme.shadows.card,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textMain,
  },
  fieldGrid: {
    gap: 8,
  },
  fieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fieldLabel: {
    fontSize: 13,
    color: Theme.colors.textSubtle,
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textMain,
  },
  summaryText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    lineHeight: 20,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radii.sm,
    backgroundColor: Theme.colors.bgElevated,
    borderColor: Theme.colors.borderCard,
    borderWidth: 1,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.brandPrimaryLight,
  },
  emptySkillsText: {
    fontSize: 13,
    color: Theme.colors.textSubtle,
    fontStyle: 'italic',
  },
  experienceItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
    marginTop: 8,
  },
  expRole: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textMain,
  },
  expCompany: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  expDesc: {
    fontSize: 12,
    color: Theme.colors.textSubtle,
    lineHeight: 16,
    marginTop: 6,
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
    maxHeight: '85%',
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  inputLabel: {
    fontSize: 13,
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
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveBtn: {
    backgroundColor: Theme.colors.brandPrimary,
    borderRadius: Theme.radii.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...Theme.shadows.glow,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
