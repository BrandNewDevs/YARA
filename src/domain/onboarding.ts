import { assistant } from '@/assistant';
import type { AssistantContext, OnboardingResult } from '@/assistant/types';

import { createFact, createTask, listFacts, setSetting } from './db';
import { toSchedule } from './timing';
import type { OnboardingForm, Weekday } from './types';

export const emptyForm = (): OnboardingForm => ({
  preferredName: '',
  medicines: [],
  appointments: [],
  wakeTime: '07:00',
  sleepTime: '21:00',
  trustedContacts: [],
  freeText: '',
});

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Writes what the User confirmed: settings, Memory facts, then Tasks with their Reminder texts. */
export async function saveOnboarding(form: OnboardingForm, result: OnboardingResult) {
  await setSetting('preferredName', form.preferredName);
  await setSetting('contacts', form.trustedContacts);
  await setSetting('wakeTime', form.wakeTime);
  await setSetting('sleepTime', form.sleepTime);
  for (const fact of result.facts) await createFact(fact, 'onboarding');

  // Facts go first so the Reminder texts can use the User's name.
  const now = new Date();
  const context: AssistantContext = {
    now: now.toISOString(),
    weekday: WEEKDAYS[now.getDay()],
    memory: await listFacts(),
    tasks: [],
  };
  for (const task of result.tasks) {
    await createTask({
      kind: task.kind,
      title: task.title,
      ...(task.details ? { details: task.details } : {}),
      schedule: toSchedule(task.schedule, now),
      reminderTexts: await assistant.reminderTexts(task, context),
    });
  }
  await setSetting('onboarded', true);
}
