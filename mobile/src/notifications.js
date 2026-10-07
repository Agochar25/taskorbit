import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from './api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function cancelReminders() {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch { /* ignore */ }
}

/**
 * Schedules a local notification at 9:00 the day before each open task is due ("due tomorrow").
 * Local scheduling works offline and needs no push server.
 */
export async function scheduleDueTomorrow(tasks) {
  try {
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return 0;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('due-tasks', { name: 'Tasks due tomorrow', importance: Notifications.AndroidImportance.DEFAULT });
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = new Date();
    let count = 0;
    for (const t of tasks) {
      if (t.status === 'COMPLETED' || !t.dueDate) continue;
      const [y, m, d] = t.dueDate.slice(0, 10).split('-').map(Number);
      const fire = new Date(y, m - 1, d - 1, 9, 0, 0);
      if (fire <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Due tomorrow', body: `${t.name} (${t.project?.name ?? 'task'})` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire, channelId: 'due-tasks' },
      });
      count += 1;
      if (count >= 60) break; // Android limits scheduled alarms
    }
    return count;
  } catch {
    return 0;
  }
}

/** Fetches open tasks and re-schedules reminders. Safe to call anytime; failures are ignored. */
export async function refreshReminders() {
  try {
    const r = await api('/tasks?limit=100&sortBy=dueDate&order=asc');
    return await scheduleDueTomorrow(r.data);
  } catch {
    return 0;
  }
}
