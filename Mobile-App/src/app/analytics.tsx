import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Your application metrics</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Analytics coming in Phase 2!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#a1a1aa', marginTop: 4 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholder: { color: '#71717a', fontSize: 16 }
});
