import type { Task } from '../domain/types';
import type { ReminderOccurrence } from './occurrences';

// Web has no dependable closed-tab delivery. Native resolution uses notifications.native.ts.
export async function enableNotifications() { return 'Keep this browser tab open for Reminders.'; }
export async function enableExactAlarms() { return 'Keep this browser tab open for Reminders.'; }
export async function syncNotifications(_tasks: Task[], _snoozed: ReminderOccurrence[]) {}
export function listenForReminders(_receive: (data: Record<string, unknown>, deliveredAt: number, tapped: boolean) => void) { return () => {}; }
