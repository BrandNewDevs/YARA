// Pure date maths in the phone's local time zone. Relative imports only so Node can run it.
import type { Schedule, Weekday } from './types';
import type { ProposedSchedule } from '../assistant/types';

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const pad = (n: number) => String(n).padStart(2, '0');
const dateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeString = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function at(day: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
}

/** Turns what the model proposed into a stored Schedule, resolving relative days against `now`. */
export function toSchedule(proposed: ProposedSchedule, now: Date): Schedule {
  if (proposed.type === 'daily') return { type: 'daily', times: [...proposed.times] };
  if (proposed.type === 'weekly') {
    return { type: 'weekly', weekdays: [...proposed.weekdays], times: [...proposed.times] };
  }
  if (proposed.inMinutes !== undefined) {
    const fire = new Date(now.getTime() + proposed.inMinutes * 60_000);
    return { type: 'once', date: dateString(fire), time: timeString(fire) };
  }
  if (proposed.date !== undefined) return { type: 'once', date: proposed.date, time: proposed.times[0] };
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (proposed.day === 'tomorrow') {
    day.setDate(day.getDate() + 1);
  } else if (proposed.day !== 'today') {
    // A named weekday means its next occurrence; if today's time has passed, that is next week.
    let ahead = (WEEKDAYS.indexOf(proposed.day) - day.getDay() + 7) % 7;
    if (ahead === 0 && at(day, proposed.times[0]) <= now) ahead = 7;
    day.setDate(day.getDate() + ahead);
  }
  return { type: 'once', date: dateString(day), time: proposed.times[0] };
}

/** The next moment this Schedule fires strictly after `now`, or null if it never will again. */
export function nextFireTime(schedule: Schedule, now: Date): Date | null {
  if (schedule.type === 'once') {
    const [y, mo, d] = schedule.date.split('-').map(Number);
    const fire = at(new Date(y, mo - 1, d), schedule.time);
    return fire > now ? fire : null;
  }
  const days = schedule.type === 'weekly' ? new Set<string>(schedule.weekdays) : null;
  const times = [...schedule.times].sort();
  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (days && !days.has(WEEKDAYS[day.getDay()])) continue;
    for (const time of times) {
      const fire = at(day, time);
      if (fire > now) return fire;
    }
  }
  return null;
}
