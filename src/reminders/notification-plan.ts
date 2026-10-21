import type { Task, Weekday } from '../domain/types';
import { taskVersion, type ReminderOccurrence } from './occurrences';

export type ReminderTrigger = { type: 'date'; date: number } | { type: 'daily'; hour: number; minute: number }
  | { type: 'weekly'; weekday: number; hour: number; minute: number };
export interface PlannedNotification {
  identifier: string;
  title: string;
  text: string;
  data: { taskId: string; version: string; occurrenceId?: string };
  trigger: ReminderTrigger;
}
const weekdays: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export function planNotifications(tasks: Task[], snoozed: ReminderOccurrence[], now: number): PlannedNotification[] {
  const planned: PlannedNotification[] = [];
  for (const task of tasks) {
    const version = taskVersion(task);
    const add = (slot: string, trigger: ReminderTrigger, index: number) => planned.push({
      identifier: 'yara:' + JSON.stringify([task.id, version, slot]), title: task.title,
      text: task.reminderTexts[index % 3], data: { taskId: task.id, version }, trigger,
    });
    if (task.schedule.type === 'once') {
      const date = new Date(`${task.schedule.date}T${task.schedule.time}:00`).getTime();
      if (date > now) add('once', { type: 'date', date }, 0);
    } else {
      const schedule = task.schedule;
      schedule.times.forEach((time, index) => {
        const [hour, minute] = time.split(':').map(Number);
        if (schedule.type === 'daily') add(time, { type: 'daily', hour, minute }, index);
        else schedule.weekdays.forEach((day, dayIndex) => add(`${day}:${time}`, {
          type: 'weekly', weekday: weekdays.indexOf(day) + 1, hour, minute,
        }, index + dayIndex));
      });
    }
  }
  for (const r of snoozed) {
    if (r.snoozeUntil && r.snoozeUntil > now) planned.push({
      identifier: `yara:snooze:${r.id}:${r.snoozeUntil}`, title: r.title, text: r.text,
      data: { taskId: r.taskId, version: r.version, occurrenceId: r.id }, trigger: { type: 'date', date: r.snoozeUntil },
    });
  }
  return planned;
}
