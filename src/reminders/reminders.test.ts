/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dueOccurrences, isCurrent, occurrence } from './occurrences';
import { planNotifications } from './notification-plan';
import type { Task } from '../domain/types';

const now = new Date(2026, 9, 21, 10, 0).getTime();
const task: Task = { id: 't1', title: 'Stretch', kind: 'routine', schedule: { type: 'daily', times: ['10:00', '18:00'] },
  reminderTexts: ['Ada, time to stretch.', 'Ada, please stretch.', 'Ada, a gentle stretch Reminder.'], createdAt: new Date(now - 3600_000).toISOString() };

test('due Reminders use stored text and stable IDs across reloads and notification delivery', () => {
  const [due] = dueOccurrences([task], now - 30_000, now + 1000);
  assert.equal(due.fireAt, now);
  assert.ok(task.reminderTexts.includes(due.text));
  assert.equal(due.id, occurrence(task, now + 12_000).id);
  assert.equal(dueOccurrences([task], now + 1000, now + 2000).length, 0);
  assert.equal(dueOccurrences([task], now - 24 * 3600_000, now + 16 * 60_000).length, 0);
});
test('edited and deleted Tasks invalidate pending Reminders; newly created Tasks do not fire retroactively', () => {
  const r = occurrence(task, now);
  assert.equal(isCurrent(r, []), false);
  assert.equal(isCurrent(r, [{ ...task, schedule: { type: 'daily', times: ['11:00'] } }]), false);
  assert.equal(dueOccurrences([{ ...task, createdAt: new Date(now + 1000).toISOString() }], now - 10_000, now + 2000).length, 0);
});
test('native plan covers every daily and weekly slot using stored texts', () => {
  const daily = planNotifications([task], [], now);
  assert.equal(daily.length, 2);
  assert.deepEqual(daily.map(n => n.trigger), [{ type: 'daily', hour: 10, minute: 0 }, { type: 'daily', hour: 18, minute: 0 }]);
  const weekly = planNotifications([{ ...task, schedule: { type: 'weekly', times: ['10:00'], weekdays: ['sun', 'wed'] } }], [], now);
  assert.deepEqual(weekly.map(n => n.trigger), [{ type: 'weekly', weekday: 1, hour: 10, minute: 0 }, { type: 'weekly', weekday: 4, hour: 10, minute: 0 }]);
  assert.notEqual(daily[0].text, daily[1].text);
});
test('native plan omits expired one-offs and reschedules changed Tasks and snoozes', () => {
  const once: Task = { ...task, schedule: { type: 'once', date: '2026-10-21', time: '10:00' } };
  assert.equal(planNotifications([once], [], now).length, 0);
  assert.equal(planNotifications([once], [], now - 1000).length, 1);
  const oldId = planNotifications([task], [], now)[0].identifier;
  assert.notEqual(planNotifications([{ ...task, reminderTexts: ['New', 'Second', 'Third'] }], [], now)[0].identifier, oldId);
  const snoozed = { ...occurrence(task, now), status: 'snoozed' as const, snoozeUntil: now + 600_000 };
  const [notification] = planNotifications([], [snoozed], now);
  assert.deepEqual(notification.trigger, { type: 'date', date: now + 600_000 });
  assert.equal(notification.data.occurrenceId, snoozed.id);
  assert.equal(planNotifications([], [snoozed], now + 600_000).length, 0);
});
