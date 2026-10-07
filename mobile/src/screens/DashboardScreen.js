import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCachedFetch } from '../hooks/useCachedFetch';
import { Badge, ErrorView, Loading } from '../components/ui';
import { LABELS, dueState, formatDate } from '../shared';
import { colors, priorityTone } from '../theme/theme';
import OfflineBanner from '../components/OfflineBanner';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { data, loading, error, refreshing, refresh, reload, fromCache } = useCachedFetch('dashboard', () => api('/dashboard').then((r) => r.data));
  if (loading && !data) return <Loading label="Loading dashboard" />;
  if (error && !data) return <ErrorView error={error} onRetry={reload} />;
  const tiles = [
    ['Total projects', data.totalProjects, colors.ink], ['Total tasks', data.totalTasks, colors.ink],
    ['Completed tasks', data.completedTasks, colors.teal], ['Pending tasks', data.pendingTasks, colors.amber],
    ['Projects in progress', data.projectsInProgress, colors.blue], ['Overdue tasks', data.overdueTasks, data.overdueTasks ? colors.coral : colors.ink3],
  ];
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner stale={fromCache} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View>
          <Text style={st.h1}>Hi, {user.fullName.split(' ')[0]}</Text>
          <Text style={st.muted}>{data.overdueTasks || data.dueTomorrow ? `${data.overdueTasks} overdue and ${data.dueTomorrow} due tomorrow.` : data.totalTasks ? 'Nothing is overdue. Nice work.' : 'Create a project on the web or in Projects to begin.'}</Text>
        </View>
        <View style={st.ring}>
          <Text style={st.ringNum}>{data.completionRate}%</Text>
          <Text style={{ color: '#b6bfe8' }}>of your tasks are done</Text>
        </View>
        <View style={st.grid}>
          {tiles.map(([label, n, c]) => (
            <View key={label} style={st.tile}><Text style={[st.tileNum, { color: c }]}>{n}</Text><Text style={st.muted}>{label}</Text></View>
          ))}
        </View>
        <Text style={st.h2}>Focus: due in the next 7 days</Text>
        {data.focusList.length === 0 ? <Text style={st.muted}>No open tasks with a due date this week.</Text> : data.focusList.map((t) => {
          const due = dueState(t.dueDate, t.status);
          return (
            <View key={t.id} style={st.focus}>
              <View style={{ flex: 1 }}><Text style={st.focusName} numberOfLines={1}>{t.name}</Text><Text style={st.muted} numberOfLines={1}>{t.project.name}</Text></View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Badge text={LABELS[t.priority]} tone={priorityTone[t.priority]} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: due === 'overdue' ? colors.coral : due === 'later' || due === 'soon' ? colors.ink3 : colors.amber }}>{formatDate(t.dueDate)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', color: colors.ink }, h2: { fontSize: 17, fontWeight: '800', color: colors.ink }, muted: { color: colors.ink3, fontSize: 13 },
  ring: { backgroundColor: colors.ink, borderRadius: 20, padding: 20, alignItems: 'center' }, ringNum: { color: '#fff', fontSize: 44, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: colors.paper, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.line }, tileNum: { fontSize: 28, fontWeight: '800' },
  focus: { flexDirection: 'row', gap: 10, backgroundColor: colors.paper, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.line }, focusName: { fontWeight: '600', color: colors.ink },
});
