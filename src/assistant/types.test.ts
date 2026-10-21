/** Compile-time contract checks. Value constraints are checked by the JSON schemas. */
import type { ReminderTexts } from '@/domain/types';
import type { AssistantAction, AssistantPreparation, AssistantStatus, ProposedSchedule } from './types';

export const schedules: ProposedSchedule[] = [
  { type: 'daily', times: ['08:00'] },
  { type: 'weekly', weekdays: ['tue'], times: ['16:00'] },
  { type: 'once', inMinutes: 10 },
  { type: 'once', day: 'tomorrow', times: ['08:00'] },
  { type: 'once', date: '2026-12-01', times: ['08:00'] },
];

// @ts-expect-error Daily schedules need a time.
export const missingTime: ProposedSchedule = { type: 'daily' };
// @ts-expect-error A schedule cannot have an empty time list.
export const emptyTimes: ProposedSchedule = { type: 'daily', times: [] };
// @ts-expect-error Weekly schedules need a weekday.
export const missingWeekday: ProposedSchedule = { type: 'weekly', times: ['08:00'] };
// @ts-expect-error Relative and calendar scheduling are mutually exclusive.
export const conflictingTime: ProposedSchedule = { type: 'once', inMinutes: 10, day: 'today', times: ['08:00'] };
// @ts-expect-error A once schedule has exactly one time.
export const repeatedOnce: ProposedSchedule = { type: 'once', day: 'today', times: ['08:00', '09:00'] };
// @ts-expect-error Creation needs a complete Task.
export const missingTask: AssistantAction = { type: 'propose_task' };
// @ts-expect-error Removal needs a Task ID.
export const missingId: AssistantAction = { type: 'propose_removal' };
// @ts-expect-error Remember must contain a fact.
export const emptyFacts: AssistantAction = { type: 'remember', facts: [] };
// @ts-expect-error Stored Reminder texts must have three entries.
export const missingReminder: ReminderTexts = ['First', 'Second'];
// @ts-expect-error Unknown action fields are rejected on construction.
export const extraField: AssistantAction = { type: 'none', taskId: 't1' };

export const preparation: AssistantPreparation = {
  async prepare() {},
  subscribe(listener) {
    listener({ state: 'ready' });
    return () => {};
  },
};
export const statuses: AssistantStatus[] = [
  { state: 'idle' }, { state: 'downloading', progress: 0.5 },
  { state: 'loading' }, { state: 'ready' }, { state: 'error', message: 'Please try again.' },
];
// @ts-expect-error Download status must carry progress.
export const missingProgress: AssistantStatus = { state: 'downloading' };
