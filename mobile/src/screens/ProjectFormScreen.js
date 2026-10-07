import { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { api } from '../api/client';
import { Banner, Button, ChipRow, Field } from '../components/ui';
import { PROJECT_STATUS, toDateInput, validateProject } from '../shared';
import { colors } from '../theme/theme';

export default function ProjectFormScreen({ route, navigation }) {
  const project = route.params?.project;
  const [f, setF] = useState({
    name: project?.name || '', description: project?.description || '', status: project?.status || 'NOT_STARTED',
    startDate: toDateInput(project?.startDate), endDate: toDateInput(project?.endDate),
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  useLayoutEffect(() => { navigation.setOptions({ title: project ? 'Edit project' : 'New project' }); }, [navigation, project]);

  async function save() {
    const payload = { ...f, startDate: f.startDate.trim() || null, endDate: f.endDate.trim() || null };
    const { errors: local } = validateProject(payload);
    if (local) return setErrors(local);
    setBusy(true); setErrors({});
    try {
      if (project) await api(`/projects/${project.id}`, { method: 'PUT', body: payload });
      else await api('/projects', { method: 'POST', body: payload });
      navigation.goBack();
    } catch (e) { setErrors(e.details || { _: e.message }); setBusy(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {!!errors._ && <View style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}><Banner text={errors._} tone="coral" /></View>}
        <Field label="Project name" value={f.name} onChangeText={set('name')} error={errors.name} maxLength={120} />
        <Field label="Description" value={f.description} onChangeText={set('description')} error={errors.description} multiline />
        <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.ink }}>Status</Text>
        <View style={{ marginBottom: 14 }}><ChipRow options={PROJECT_STATUS} value={f.status} onChange={set('status')} /></View>
        <Field label="Start date (YYYY-MM-DD)" value={f.startDate} onChangeText={set('startDate')} error={errors.startDate} maxLength={10} keyboardType="numbers-and-punctuation" />
        <Field label="End date (YYYY-MM-DD)" value={f.endDate} onChangeText={set('endDate')} error={errors.endDate} maxLength={10} keyboardType="numbers-and-punctuation" />
        <Button title={project ? 'Save changes' : 'Create project'} onPress={save} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
