import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { TodoTask } from '@/types';

const ANDROID_CHANNEL_ID = 'todo-reminders';

export function todoRemindersSupported(): boolean {
  return Platform.OS !== 'web';
}

export async function ensureTodoReminderPermission(): Promise<boolean> {
  if (!todoRemindersSupported()) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export function computeReminderDateFromDueDate(
  dueDateIso: string,
  { hour = 9, minute = 0 }: { hour?: number; minute?: number } = {}
): Date {
  // Treat dueDate as "date only" (YYYY-MM-DD) to avoid timezone shifts.
  const datePart = dueDateIso.split('T')[0];
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hour, minute, 0, 0);
}

export function parseReminderTimeHHMM(value?: string): { hour: number; minute: number } | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;
  return { hour, minute };
}

async function ensureAndroidChannel(): Promise<void> {
  if (!todoRemindersSupported()) return;
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Todo Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function cancelTodoReminderNotification(notificationId?: string): Promise<void> {
  if (!todoRemindersSupported()) return;
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Swallow errors (e.g. already cancelled / unknown id).
  }
}

export async function scheduleTodoReminderNotification(todo: TodoTask): Promise<{
  notificationId: string;
  reminderAt: string;
} | null> {
  if (!todoRemindersSupported()) return null;
  if (!todo.remind) return null;
  if (!todo.dueDate) return null;
  if (todo.isCompleted) return null;

  const granted = await ensureTodoReminderPermission();
  if (!granted) return null;

  await ensureAndroidChannel();

  const parsedTime = parseReminderTimeHHMM(todo.reminderTime);
  let when = computeReminderDateFromDueDate(todo.dueDate, parsedTime ?? { hour: 9, minute: 0 });
  const now = new Date();
  if (when.getTime() <= now.getTime()) {
    when = new Date(now.getTime() + 60_000);
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reminder',
      body: todo.title,
      sound: true,
      data: { todoId: todo.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  });

  return { notificationId, reminderAt: when.toISOString() };
}

