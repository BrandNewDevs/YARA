import type { Assistant, ProposedTask } from './types';

const EMERGENCY = /chest (pain|hurts)|can(?:not|'t) breathe|i (?:fell|have fallen)|bleeding.*(?:stop|heav)|unconscious|immediate danger/i;
const MEDICAL = /dos(?:e|age)|diagnos|should i.*(?:pill|medicine)|how many.*(?:pill|milligram)/i;

/** Predictable development adapter. It never pretends to be model inference. */
export const mockAssistant: Assistant = {
  async chat(messages, _context, onPartial) {
    const text = messages.at(-1)?.text ?? '';
    let result: Awaited<ReturnType<Assistant['chat']>> = { reply: "I'm here. How can I help?", action: { type: 'none' } };
    if (EMERGENCY.test(text)) {
      result = { reply: 'Please get urgent help. Here are the numbers you can call now.', action: { type: 'show_help' } };
    } else if (MEDICAL.test(text)) {
      result = { reply: 'Please ask your doctor or pharmacist. I cannot advise on medicines.', action: { type: 'none' } };
    } else if (/call me\s+(.+)/i.test(text)) {
      const name = /call me\s+(.+)/i.exec(text)![1].replace(/[.!]$/, '');
      result = { reply: `Of course, ${name}.`, action: { type: 'remember', facts: [`Prefers to be called ${name}`] } };
    } else if (/remind/i.test(text)) {
      const time = /\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm|in the morning|in the afternoon|in the evening)\b/i.exec(text);
      if (!time || !/every day|every morning|daily/i.test(text)) {
        result.reply = 'What day and time would you like the Reminder?';
      } else {
        const hour = Number(time[1]);
        const minute = time[2] ?? '00';
        if (hour < 1 || hour > 12 || Number(minute) > 59) {
          result.reply = 'What time would you like the Reminder?';
        } else {
          const pm = /pm|afternoon|evening/i.test(time[3]);
          const hh = String(hour % 12 + (pm ? 12 : 0)).padStart(2, '0');
          const title = /remind me to (.+?)(?: every| daily| at)/i.exec(text)?.[1] ?? 'Do your Routine';
          result = { reply: `Shall I remind you to ${title.toLowerCase()} every day at ${hh}:${minute}?`,
            action: { type: 'propose_task', task: { kind: 'routine', title, schedule: { type: 'daily', times: [`${hh}:${minute}`] } } } };
        }
      }
    }
    onPartial?.(result.reply);
    return result;
  },
  async onboard(form) {
    const tasks: ProposedTask[] = form.medicines.map(m => {
      const [first, ...rest] = m.times;
      if (!first) throw new Error('Please add a time for each medicine.');
      return { kind: 'routine', title: `Take ${m.name}`, schedule: { type: 'daily', times: [first, ...rest] } };
    });
    for (const a of form.appointments) {
      if (!a.time || (!a.weekday && !a.date)) throw new Error('Please add a day and time for each Appointment.');
      tasks.push({ kind: 'appointment', title: a.what, ...(a.where ? { details: a.where } : {}),
        schedule: a.weekday ? { type: 'weekly', weekdays: [a.weekday], times: [a.time] }
          : { type: 'once', date: a.date!, times: [a.time] } });
    }
    return { facts: [`Prefers to be called ${form.preferredName}`, `Wakes at ${form.wakeTime}`, `Sleeps at ${form.sleepTime}`],
      tasks, welcome: `Hello ${form.preferredName}. Please review these proposed Tasks.` };
  },
  async reminderTexts(task, context) {
    const name = context.memory.map(f => /^Prefers to be called (.+)$/i.exec(f.text)?.[1]).find(Boolean);
    const prefix = name ? `${name}, ` : '';
    const texts: [string, string, string] = [
      `${prefix}it is time: ${task.title}.`, `${prefix}a gentle Reminder: ${task.title}.`, `${prefix}please remember: ${task.title}.`,
    ];
    if (texts.some(t => Array.from(t).length >= 160)) throw new Error('Please use a shorter Task title.');
    return texts;
  },
};
