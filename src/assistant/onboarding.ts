import type { OnboardingForm } from '@/domain/types';
import type { ProposedTask } from './types';
import { AssistantError } from './transport';

/** Structured fields need no model date arithmetic. Free text is interpreted separately. */
export function formTasks(form: OnboardingForm): ProposedTask[] {
  const tasks: ProposedTask[] = form.medicines.map(m => {
    const [first, ...rest] = m.times;
    if (!first) throw new AssistantError('invalid_output', 'Please add a time for each medicine.');
    return { kind: 'routine', title: `Take ${m.name}`, schedule: { type: 'daily', times: [first, ...rest] } };
  });
  for (const a of form.appointments) {
    if (!a.time || Boolean(a.weekday) === Boolean(a.date)) {
      throw new AssistantError('invalid_output', 'Please choose a weekday or date for each Appointment.');
    }
    tasks.push({ kind: 'appointment', title: a.what, ...(a.where ? { details: a.where } : {}),
      schedule: a.weekday ? { type: 'weekly', weekdays: [a.weekday], times: [a.time] }
        : { type: 'once', date: a.date!, times: [a.time] } });
  }
  return tasks;
}
