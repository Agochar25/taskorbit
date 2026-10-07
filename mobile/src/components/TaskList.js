import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { api, qs } from '../api/client';
import { refreshReminders } from '../notifications';
import { useCachedFetch, useDebounced } from '../hooks/useCachedFetch';
import { ChipRow, EmptyView, ErrorView, Loading, TaskCard } from './ui';
import OfflineBanner from './OfflineBanner';
import { TASK_PRIORITY, TASK_STATUS } from '../shared';
import { colors } from '../theme/theme';

/** Search + status/priority filters + pull-to-refresh task list. Used for one project or for all tasks. */
export default function TaskList({ projectId, navigation, header }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const q = useDebounced(search);
  const filtered = !!(q || status || priority);
  const cacheKey = filtered ? null : `tasks:${projectId || 'all'}`;
  const { data, loading, error, refreshing, refresh, reload, fromCache } = useCachedFetch(
    cacheKey, () => api(`/tasks${qs({ projectId, search: q, status, priority, sortBy: 'dueDate', order: 'asc', limit: 100 })}`).then((r) => r.data),
    [projectId, q, status, priority]);

  async function toggle(task) {
    try {
      await api(`/tasks/${task.id}`, { method: 'PUT', body: { status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } });
      reload(); refreshReminders();
    } catch (e) { Alert.alert('Could not update task', e.message); }
  }

  const list = data
    ? [...data].sort((a, b) => (a.status === 'COMPLETED') - (b.status === 'COMPLETED')) // open tasks first
    : [];

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner stale={fromCache} />
      <View style={{ padding: 16, paddingBottom: 8, gap: 10 }}>
        {header}
        <TextInput style={st.search} placeholder="Search tasks" placeholderTextColor={colors.ink3} value={search} onChangeText={setSearch} autoCapitalize="none" clearButtonMode="while-editing" />
        <ChipRow options={TASK_STATUS} value={status} onChange={setStatus} allLabel="Any status" />
        <ChipRow options={TASK_PRIORITY} value={priority} onChange={setPriority} allLabel="Any priority" />
      </View>
      {loading && !data ? <Loading /> : error && !data ? <ErrorView error={error} onRetry={reload} /> : (
        <FlatList data={list} keyExtractor={(t) => t.id} contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyView title={filtered ? 'No tasks match' : 'No tasks yet'} hint={filtered ? 'Try clearing the search or filters.' : 'Tap Add task to create one.'} />}
          renderItem={({ item }) => <TaskCard task={item} showProject={!projectId} onToggle={toggle} onPress={() => navigation.navigate('TaskForm', { task: item })} />} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  search: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.ink },
});
