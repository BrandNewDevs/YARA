import type { Task } from '../domain/types';
import { nextFireTime } from '../domain/timing';

export interface ReminderOccurrence {
  id: string;
  taskId: string;
  version: string;
  title: string;
  text: string;
  fireAt: number;
  status: 'pending' | 'done' | 'snoozed';
  snoozeUntil: number | null;
  spoken: number;
}

export const taskVersion = (task: Task) => JSON.stringify([task.schedule, task.title, task.reminderTexts]);

export function occurrence(task: Task, fireAt: number): ReminderOccurrence {
  const minute = Math.floor(fireAt / 60_000) * 60_000;
  const version = taskVersion(task);
  return { id: JSON.stringify([task.id, version, minute]), taskId: task.id, version,
    title: task.title, text: task.reminderTexts[Math.abs(Math.floor(minute / 60_000)) % 3],
    fireAt: minute, status: 'pending', snoozeUntil: null, spoken: 0 };
}

/** Catch up at most 15 minutes; never announce an old backlog on launch. */
export function dueOccurrences(tasks: Task[], since: number, now: number): ReminderOccurrence[] {
  const results: ReminderOccurrence[] = [];
  for (const task of tasks) {
    let cursor = new Date(Math.max(since, now - 15 * 60_000));
    for (let count = 0; count < 32; count++) {
      const next = nextFireTime(task.schedule, cursor);
      if (!next || next.getTime() > now) break;
      if (next.getTime() >= Date.parse(task.createdAt)) results.push(occurrence(task, next.getTime()));
      cursor = next;
    }
  }
  return results.sort((a, b) => a.fireAt - b.fireAt);
}

export function isCurrent(reminder: ReminderOccurrence, tasks: Task[]) {
  return tasks.some(task => task.id === reminder.taskId && taskVersion(task) === reminder.version);
}
