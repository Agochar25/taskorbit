import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LABELS, dueState, formatDate } from '../shared';
import { colors, priorityTone, tones } from '../theme/theme';

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }) {
  const bg = variant === 'primary' ? colors.blue : variant === 'danger' ? colors.coral : 'transparent';
  const fg = variant === 'ghost' ? colors.ink2 : '#fff';
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button"
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled || loading ? 0.55 : pressed ? 0.85 : 1, borderColor: variant === 'ghost' ? colors.line : bg }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Badge({ text, tone = 'neutral' }) {
  const t = tones[tone];
  return <View style={[s.badge, { backgroundColor: t.bg }]}><Text style={[s.badgeText, { color: t.fg }]}>{text}</Text></View>;
}

export function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }} style={[s.chip, active && s.chipOn]}>
      <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/** Horizontal single-select chips. allLabel adds an "all" option that maps to ''. */
export function ChipRow({ options, value, onChange, allLabel }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
      {allLabel && <Chip label={allLabel} active={value === ''} onPress={() => onChange('')} />}
      {options.map((o) => <Chip key={o} label={LABELS[o] || o} active={value === o} onPress={() => onChange(o)} />)}
    </ScrollView>
  );
}

export function Field({ label, error, multiline, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.ink3} multiline={multiline} {...props}
        style={[s.input, multiline && { minHeight: 84, textAlignVertical: 'top' }, !!error && { borderColor: colors.coral }]} />
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

export const ProgressBar = ({ value, color = colors.blue }) => (
  <View style={s.track}><View style={[s.fill, { width: `${value}%`, backgroundColor: color }]} /></View>
);

export function Banner({ text, tone = 'amber' }) {
  const t = tones[tone];
  return <View style={[s.banner, { backgroundColor: t.bg }]}><Text style={{ color: t.fg, fontWeight: '600' }}>{text}</Text></View>;
}

export const Loading = ({ label }) => (
  <View style={s.center}><ActivityIndicator size="large" color={colors.blue} />{!!label && <Text style={s.muted}>{label}</Text>}</View>
);

export function ErrorView({ error, onRetry }) {
  const offline = error?.code === 'NETWORK';
  return (
    <View style={s.center}>
      <Ionicons name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'} size={44} color={colors.ink3} />
      <Text style={s.h3}>{offline ? "You're offline" : 'Something went wrong'}</Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>{error?.message}</Text>
      {onRetry && <Button title="Try again" onPress={onRetry} style={{ marginTop: 8, paddingHorizontal: 28 }} />}
    </View>
  );
}

export const EmptyView = ({ title, hint }) => (
  <View style={s.center}><Ionicons name="planet-outline" size={44} color={colors.ink3} /><Text style={s.h3}>{title}</Text>{!!hint && <Text style={[s.muted, { textAlign: 'center' }]}>{hint}</Text>}</View>
);

const dueLabel = { overdue: 'Overdue', today: 'Due today', tomorrow: 'Due tomorrow' };

export function TaskCard({ task, showProject, onPress, onToggle }) {
  const done = task.status === 'COMPLETED';
  const due = dueState(task.dueDate, task.status);
  const dueColor = due === 'overdue' ? colors.coral : due === 'today' || due === 'tomorrow' ? colors.amber : colors.ink3;
  return (
    <Pressable onPress={onPress} style={s.task} accessibilityRole="button">
      <Pressable onPress={() => onToggle(task)} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Reopen task' : 'Mark task completed'} style={[s.check, done && { backgroundColor: colors.teal, borderColor: colors.teal }]}>
        {done && <Ionicons name="checkmark" size={16} color="#fff" />}
      </Pressable>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={[s.taskName, done && { textDecorationLine: 'line-through', color: colors.ink3 }]} numberOfLines={2}>{task.name}</Text>
        {showProject && !!task.project && <Text style={s.muted} numberOfLines={1}>{task.project.name}</Text>}
        <View style={s.row}>
          <Badge text={LABELS[task.priority]} tone={priorityTone[task.priority]} />
          <Badge text={LABELS[task.status]} tone={task.status === 'COMPLETED' ? 'teal' : task.status === 'IN_PROGRESS' ? 'blue' : 'neutral'} />
          {!!task.dueDate && <Text style={{ color: dueColor, fontWeight: due === 'none' ? '400' : '700', fontSize: 12 }}>{dueLabel[due] ? `${dueLabel[due]} · ` : ''}{formatDate(task.dueDate)}</Text>}
        </View>
      </View>
    </Pressable>
  );
}

export const s = StyleSheet.create({
  btn: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, minHeight: 46 },
  btnText: { fontWeight: '700', fontSize: 15 },
  badge: { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999 }, badgeText: { fontSize: 11.5, fontWeight: '700' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink }, chipText: { fontWeight: '600', color: colors.ink2, fontSize: 13 },
  label: { fontWeight: '600', color: colors.ink, marginBottom: 6 },
  input: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.ink },
  error: { color: colors.coral, marginTop: 4, fontSize: 13 },
  track: { height: 8, backgroundColor: colors.mist, borderRadius: 99, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 99 },
  banner: { paddingVertical: 8, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  muted: { color: colors.ink3, fontSize: 13 }, h3: { fontSize: 17, fontWeight: '700', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  task: { flexDirection: 'row', gap: 12, backgroundColor: colors.paper, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.line },
  taskName: { fontSize: 15.5, fontWeight: '600', color: colors.ink },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
