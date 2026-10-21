import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import type { Task } from '../domain/types';
import { type ReminderOccurrence } from './occurrences';

import { planNotifications } from './notification-plan';

const CHANNEL = 'yara-reminders-v1';
const PREFIX = 'yara:';
let lastPlan = '';
let lastSync = 0;

Notifications.setNotificationHandler({ handleNotification: async () => ({
  shouldShowBanner: true, shouldShowList: true, shouldPlaySound: AppState.currentState !== 'active', shouldSetBadge: false,
}) });

async function channel() {
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Reminders',
    importance: 4, sound: 'reminder.wav', vibrationPattern: [0, 250, 150, 250] });
}
export async function enableNotifications() {
  await channel();
  const permission = await Notifications.requestPermissionsAsync();
  return permission.granted ? 'Notifications are enabled. Tap one to hear your Reminder.'
    : 'Notifications are off. Reminders still appear while YARA is open. You can allow notifications in Android settings.';
}
export async function enableExactAlarms() {
  const permission = await Notifications.requestExactAlarmPermissionsAsync();
  return permission.granted ? 'Precise Reminder timing is enabled.' : 'Reminders may arrive later while the phone is idle.';
}

export async function syncNotifications(tasks: Task[], snoozed: ReminderOccurrence[]) {
  await channel();
  const permission = await Notifications.getPermissionsAsync();
  const desired = new Map<string, Notifications.NotificationRequestInput>();
  if (permission.granted) {
    for (const item of planNotifications(tasks, snoozed, Date.now())) {
      let trigger: Notifications.SchedulableNotificationTriggerInput;
      if (item.trigger.type === 'date') trigger = { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(item.trigger.date), channelId: CHANNEL };
      else if (item.trigger.type === 'daily') trigger = { ...item.trigger, type: Notifications.SchedulableTriggerInputTypes.DAILY, channelId: CHANNEL };
      else trigger = { ...item.trigger, type: Notifications.SchedulableTriggerInputTypes.WEEKLY, channelId: CHANNEL };
      desired.set(item.identifier, { identifier: item.identifier, trigger,
        content: { title: item.title, body: item.text, sound: 'reminder.wav', data: item.data } });
    }
  }
  const signature = JSON.stringify([...desired.keys()]);
  if (signature === lastPlan && Date.now() - lastSync < 30_000) return;
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of existing) {
    if (!item.identifier.startsWith(PREFIX)) continue;
    if (!desired.has(item.identifier)) await Notifications.cancelScheduledNotificationAsync(item.identifier);
    else desired.delete(item.identifier);
  }
  for (const item of desired.values()) await Notifications.scheduleNotificationAsync(item);
  lastPlan = signature;
  lastSync = Date.now();
}

export function listenForReminders(receive: (data: Record<string, unknown>, deliveredAt: number, tapped: boolean) => void) {
  let alive = true;
  const handle = (notification: Notifications.Notification, tapped = false) => {
    if (alive && notification.request.identifier.startsWith(PREFIX)) receive(notification.request.content.data ?? {}, notification.date, tapped);
  };
  const received = Notifications.addNotificationReceivedListener(handle);
  const response = Notifications.addNotificationResponseReceivedListener(event => {
    handle(event.notification, true);
    void Notifications.clearLastNotificationResponseAsync();
  });
  void Notifications.getLastNotificationResponseAsync().then(event => {
    if (alive && event) { handle(event.notification, true); void Notifications.clearLastNotificationResponseAsync(); }
  }).catch(() => {});
  return () => { alive = false; received.remove(); response.remove(); };
}
