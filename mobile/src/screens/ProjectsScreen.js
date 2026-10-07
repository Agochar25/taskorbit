import { useLayoutEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, qs } from '../api/client';
import { useCachedFetch, useDebounced } from '../hooks/useCachedFetch';
import { Badge, ChipRow, EmptyView, ErrorView, Loading, ProgressBar } from '../components/ui';
import OfflineBanner from '../components/OfflineBanner';
import { LABELS, PROJECT_STATUS } from '../shared';
import { colors, healthColor, healthTone, statusTone } from '../theme/theme';

export default function ProjectsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const q = useDebounced(search);
  const filtered = !!(q || status);
  const { data, loading, error, refreshing, refresh, reload, fromCache } = useCachedFetch(
    filtered ? null : 'projects', () => api(`/projects${qs({ search: q, status, limit: 100 })}`).then((r) => r.data), [q, status]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <Pressable onPress={() => navigation.navigate('ProjectForm')} hitSlop={10} accessibilityLabel="New project"><Ionicons name="add-circle" size={30} color={colors.blue} /></Pressable> });
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner stale={fromCache} />
      <View style={{ padding: 16, gap: 10 }}>
        <TextInput style={st.search} placeholder="Search projects" placeholderTextColor={colors.ink3} value={search} onChangeText={setSearch} autoCapitalize="none" clearButtonMode="while-editing" />
        <ChipRow options={PROJECT_STATUS} value={status} onChange={setStatus} allLabel="All" />
      </View>
      {loading && !data ? <Loading /> : error && !data ? <ErrorView error={error} onRetry={reload} /> : (
        <FlatList data={data} keyExtractor={(p) => p.id} contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyView title={filtered ? 'No projects match' : 'No projects yet'} hint={filtered ? 'Try a different search or filter.' : 'Tap + to create your first project.'} />}
          renderItem={({ item: p }) => (
            <Pressable style={[st.card, { borderLeftColor: healthColor[p.health] }]} onPress={() => navigation.navigate('ProjectDetail', { id: p.id, name: p.name })}>
              <View style={st.row}><Badge text={LABELS[p.status]} tone={statusTone[p.status]} /><Badge text={LABELS[p.health]} tone={healthTone[p.health]} /></View>
              <Text style={st.name}>{p.name}</Text>
              <ProgressBar value={p.progress} color={healthColor[p.health]} />
              <Text style={st.muted}>{p.completedCount} of {p.taskCount} tasks done</Text>
            </Pressable>
          )} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  search: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.ink },
  card: { backgroundColor: colors.paper, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' }, name: { fontSize: 17, fontWeight: '800', color: colors.ink }, muted: { color: colors.ink3, fontSize: 13 },
});
