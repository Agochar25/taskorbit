import { useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { api } from '../api/client';
import { refreshReminders } from '../notifications';
import { useCachedFetch } from '../hooks/useCachedFetch';
import { Banner, Button, ChipRow, Chip, Field, Loading } from '../components/ui';
import { LABELS, TASK_PRIORITY, TASK_STATUS, toDateInput, validateTask } from '../shared';
import { colors } from '../theme/theme';

const iso = (offsetDays) => { const d = new Date(); d.setDate(d.getDate() + offsetDays); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export default function TaskFormScreen({ route, navigation }) {
  const task = route.params?.task;
  const editing = !!task;
  const fixedProject = route.params?.projectId;
  const [f, setF] = useState({
    projectId: task?.projectId || fixedProject || '', name: task?.name || '', description: task?.description || '',
    priority: task?.priority || 'MEDIUM', status: task?.status || 'PENDING', dueDate: toDateInput(task?.dueDate),
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const needsProject = !editing && !fixedProject;
  const projects = useCachedFetch(needsProject ? 'projects' : null, () => api('/projects?limit=100&sortBy=name&order=asc').then((r) => r.data), [], { enabled: needsProject });
  const projectList = needsProject ? projects.data || [] : [];

  useLayoutEffect(() => { navigation.setOptions({ title: editing ? 'Edit task' : 'New task' }); }, [navigation, editing]);

  async function save() {
    const payload = { ...f, dueDate: f.dueDate.trim() || null };
    if (editing) delete payload.projectId;
    const { errors: local } = validateTask(payload, { partial: editing });
    if (local) return setErrors(local);
    setBusy(true); setErrors({});
    try {
      if (editing) await api(`/tasks/${task.id}`, { method: 'PUT', body: payload });
      else await api('/tasks', { method: 'POST', body: payload });
      refreshReminders();
      navigation.goBack();
    } catch (e) {
      setErrors(e.details || { _: e.message });
      setBusy(false);
    }
  }

  function remove() {
    Alert.alert('Delete task?', `“${task.name}” will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api(`/tasks/${task.id}`, { method: 'DELETE' }); refreshReminders(); navigation.goBack(); }
        catch (e) { Alert.alert('Could not delete', e.message); }
      } },
    ]);
  }

  if (needsProject && projects.loading && !projects.data) return <Loading />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {!!errors._ && <View style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}><Banner text={errors._} tone="coral" /></View>}
        {needsProject && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.ink }}>Project</Text>
            {projectList.length === 0 ? <Text style={{ color: colors.ink3 }}>Create a project first (Projects tab, + button).</Text> : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {projectList.map((p) => <Chip key={p.id} label={p.name} active={f.projectId === p.id} onPress={() => set('projectId')(p.id)} />)}
              </View>
            )}
            {!!errors.projectId && <Text style={{ color: colors.coral, marginTop: 4 }}>Choose a project</Text>}
          </View>
        )}
        <Field label="Task name" value={f.name} onChangeText={set('name')} error={errors.name} maxLength={120} placeholder="e.g. Draft launch email" />
        <Field label="Description" value={f.description} onChangeText={set('description')} error={errors.description} multiline />
        <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.ink }}>Priority</Text>
        <View style={{ marginBottom: 14 }}><ChipRow options={TASK_PRIORITY} value={f.priority} onChange={set('priority')} /></View>
        <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.ink }}>Status</Text>
        <View style={{ marginBottom: 14 }}><ChipRow options={TASK_STATUS} value={f.status} onChange={set('status')} /></View>
        <Field label="Due date (YYYY-MM-DD)" value={f.dueDate} onChangeText={set('dueDate')} error={errors.dueDate} placeholder="2026-12-31" keyboardType="numbers-and-punctuation" maxLength={10} />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <Chip label="Today" onPress={() => set('dueDate')(iso(0))} /><Chip label="Tomorrow" onPress={() => set('dueDate')(iso(1))} />
          <Chip label="Next week" onPress={() => set('dueDate')(iso(7))} /><Chip label="Clear" onPress={() => set('dueDate')('')} />
        </View>
        <Button title={editing ? 'Save changes' : 'Add task'} onPress={save} loading={busy} />
        {editing && <Button title="Delete task" variant="ghost" onPress={remove} style={{ marginTop: 10, borderColor: colors.coral }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
