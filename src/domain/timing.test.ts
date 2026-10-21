import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextFireTime, toSchedule } from './timing';

// Wednesday 2026-10-21 14:05 local
const now = new Date(2026, 9, 21, 14, 5);

test('inMinutes becomes a dated once-Schedule', () => {
  assert.deepEqual(toSchedule({ type: 'once', inMinutes: 10 }, now), { type: 'once', date: '2026-10-21', time: '14:15' });
  assert.deepEqual(toSchedule({ type: 'once', inMinutes: 600 }, now), { type: 'once', date: '2026-10-22', time: '00:05' });
});

test('relative days resolve against now', () => {
  assert.deepEqual(toSchedule({ type: 'once', day: 'today', times: ['18:00'] }, now), { type: 'once', date: '2026-10-21', time: '18:00' });
  assert.deepEqual(toSchedule({ type: 'once', day: 'tomorrow', times: ['09:00'] }, now), { type: 'once', date: '2026-10-22', time: '09:00' });
  assert.deepEqual(toSchedule({ type: 'once', day: 'fri', times: ['09:00'] }, now), { type: 'once', date: '2026-10-23', time: '09:00' });
  assert.deepEqual(toSchedule({ type: 'once', day: 'wed', times: ['09:00'] }, now), { type: 'once', date: '2026-10-28', time: '09:00' });
  assert.deepEqual(toSchedule({ type: 'once', day: 'wed', times: ['16:00'] }, now), { type: 'once', date: '2026-10-21', time: '16:00' });
});

test('explicit date and recurring schedules pass through', () => {
  assert.deepEqual(toSchedule({ type: 'once', date: '2026-12-01', times: ['08:30'] }, now), { type: 'once', date: '2026-12-01', time: '08:30' });
  assert.deepEqual(toSchedule({ type: 'daily', times: ['08:00', '20:00'] }, now), { type: 'daily', times: ['08:00', '20:00'] });
});

test('daily picks the next time, rolling to tomorrow', () => {
  assert.deepEqual(nextFireTime({ type: 'daily', times: ['08:00', '20:00'] }, now), new Date(2026, 9, 21, 20, 0));
  assert.deepEqual(nextFireTime({ type: 'daily', times: ['08:00'] }, now), new Date(2026, 9, 22, 8, 0));
});

test('weekly skips other weekdays', () => {
  assert.deepEqual(nextFireTime({ type: 'weekly', weekdays: ['mon'], times: ['09:00'] }, now), new Date(2026, 9, 26, 9, 0));
  assert.deepEqual(nextFireTime({ type: 'weekly', weekdays: ['wed'], times: ['09:00'] }, now), new Date(2026, 9, 28, 9, 0));
});

test('a past once-Schedule never fires', () => {
  assert.equal(nextFireTime({ type: 'once', date: '2026-10-21', time: '14:00' }, now), null);
  assert.deepEqual(nextFireTime({ type: 'once', date: '2026-10-21', time: '14:06' }, now), new Date(2026, 9, 21, 14, 6));
});
