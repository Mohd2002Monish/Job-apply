import React from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { Theme } from '@/constants/theme';
import { BriefcaseIcon, FileTextIcon, TrendingUpIcon, MailIcon } from '@/components/Icons';

export default function AppTabs() {
  return (
    <Tabs style={styles.tabRoot}>
      <TabSlot style={styles.tabContentSlot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={<BriefcaseIcon size={18} />}>Pipeline</TabButton>
          </TabTrigger>
          <TabTrigger name="builder" href="/builder" asChild>
            <TabButton icon={<FileTextIcon size={18} />}>Builder</TabButton>
          </TabTrigger>
          <TabTrigger name="analytics" href="/analytics" asChild>
            <TabButton icon={<TrendingUpIcon size={18} />}>Analytics</TabButton>
          </TabTrigger>
          <TabTrigger name="inbox" href="/inbox" asChild>
            <TabButton icon={<MailIcon size={18} />}>Inbox</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon?: React.ReactNode }) {
  return (
    <Pressable {...props} style={[styles.tabButton, isFocused && styles.tabButtonActive]}>
      <View style={[styles.tabIconWrapper, isFocused && styles.tabIconActive]}>
        {React.cloneElement(icon as React.ReactElement, {
          color: isFocused ? Theme.colors.brandPrimaryLight : Theme.colors.textSubtle,
          size: 18,
        })}
      </View>
      <ThemedText
        style={[
          styles.tabLabel,
          { color: isFocused ? Theme.colors.textMain : Theme.colors.textSubtle },
        ]}
      >
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabBarWrapper}>
      <View style={styles.tabBarInner}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRoot: {
    flex: 1,
    height: '100%',
    backgroundColor: Theme.colors.bgApp,
  },
  tabContentSlot: {
    flex: 1,
    height: '100%',
  },
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: 'rgba(18, 18, 23, 0.88)',
    borderTopColor: Theme.colors.borderCard,
    borderTopWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 600,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: Theme.radii.md,
    gap: 3,
  },
  tabButtonActive: {},
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 28,
    borderRadius: 8,
  },
  tabIconActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
