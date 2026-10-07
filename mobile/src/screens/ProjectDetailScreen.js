import { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useCachedFetch } from '../hooks/useCachedFetch';
import TaskList from '../components/TaskList';
import { Badge, Button, ProgressBar } from '../components/ui';
import { LABELS, formatDate } from '../shared';
import { colors, healthColor, healthTone, statusTone } from '../theme/theme';

export default function ProjectDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { data: p } = useCachedFetch(`project:${id}`, () => api(`/projects/${id}`).then((r) => r.data));

  useLayoutEffect(() => {
    navigation.setOptions({ title: p?.name || route.params.name || 'Project', headerRight: () => p && (
      <Pressable onPress={() => navigation.navigate('ProjectForm', { project: p })} hitSlop={10} accessibilityLabel="Edit project"><Ionicons name="create-outline" size={26} color={colors.blue} /></Pressable>) });
  }, [navigation, p, route.params.name]);

  const header = p && (
    <View style={st.head}>
      <View style={st.row}><Badge text={LABELS[p.status]} tone={statusTone[p.status]} /><Badge text={LABELS[p.health]} tone={healthTone[p.health]} /></View>
      {!!p.description && <Text style={{ color: colors.ink2 }}>{p.description}</Text>}
      <Text style={st.muted}>{p.startDate ? formatDate(p.startDate) : 'No start'} to {p.endDate ? formatDate(p.endDate) : 'no end date'}</Text>
      <ProgressBar value={p.progress} color={healthColor[p.health]} />
      <Text style={st.muted}>{p.completedCount} of {p.taskCount} tasks done{p.overdueCount ? `, ${p.overdueCount} overdue` : ''}</Text>
      <Button title="Add task" onPress={() => navigation.navigate('TaskForm', { projectId: id })} />
    </View>
  );
  return <TaskList projectId={id} navigation={navigation} header={header} />;
}

const st = StyleSheet.create({
  head: { gap: 10, backgroundColor: colors.paper, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', gap: 8 }, muted: { color: colors.ink3, fontSize: 13 },
});
