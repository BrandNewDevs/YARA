import type { ProposedSchedule } from '../assistant/types';

const pad = (n: number) => String(n).padStart(2, '0');

/** "08:00" -> "8:00 AM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

export function describeSchedule(s: ProposedSchedule): string {
  const times = s.times?.map(formatTime).join(' and ') ?? '';
  if (s.type === 'daily') return `every day at ${times}`;
  if (s.type === 'weekly') return `every ${s.weekdays?.join(', ')} at ${times}`;
  return s.inMinutes ? `in ${s.inMinutes} minutes` : `${s.date ?? s.day ?? 'today'} at ${times}`;
}
