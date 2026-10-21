import type { Assistant, AssistantContext, AssistantReply, ProposedSchedule } from './types';
import { schemas, validators } from './schemas';
import { renderPrompt } from './prompts';
import { AssistantError, type Generate } from './transport';
import { formTasks } from './onboarding';
import { partialReply } from './stream';

export const FALLBACK: AssistantReply = { reply: 'Sorry, could you say that again?', action: { type: 'none' } };

function assertDateSource(schedule: ProposedSchedule, source: string) {
  if (schedule.type === 'once' && schedule.date && !source.includes(schedule.date)) {
    throw new AssistantError('invalid_output', 'Please say the date again.');
  }
}

function parse(raw: string): unknown {
  try { return JSON.parse(raw); }
  catch { throw new AssistantError('invalid_output', 'Please try again.'); }
}

function knownName(context: AssistantContext): string | undefined {
  return context.memory.map(f => /^Prefers to be called (.+)$/i.exec(f.text)?.[1]).find(Boolean);
}

function scheduleKey(schedule: ProposedSchedule): string {
  return JSON.stringify([schedule.type, schedule.times, schedule.weekdays, schedule.day, schedule.date, schedule.inMinutes]);
}

export function createAssistant(generate: Generate): Assistant {
  const generateChecked: Generate = async request => {
    try { return await generate(request); }
    catch (error) {
      if (error instanceof AssistantError) throw error;
      throw new AssistantError('unavailable', 'The Assistant is unavailable. Please try again.');
    }
  };
  return {
    async chat(messages, context, onPartial) {
      try {
        if (!messages.length || messages.at(-1)?.role !== 'user' || messages.reduce((n, m) => n + m.text.length, 0) > 12_000) {
          throw new AssistantError('input_too_long', 'Please send a shorter message.');
        }
        let lastPartial = '';
        const raw = await generate({
          system: renderPrompt('chat', context), messages, schema: schemas.chat,
          onText(text) {
            const reply = partialReply(text);
            if (reply !== undefined && reply !== lastPartial && reply.length <= 400) {
              lastPartial = reply;
              onPartial?.(reply);
            }
          },
        });
        const out = parse(raw);
        if (!validators.chat(out)) throw new AssistantError('invalid_output', 'Please try again.');
        const action = out.action;
        if ((action.type === 'propose_change' || action.type === 'propose_removal') && !context.tasks.some(t => t.id === action.taskId)) {
          throw new AssistantError('invalid_output', 'Please say which Task you mean.');
        }
        if (action.type === 'propose_task' || action.type === 'propose_change') {
          assertDateSource(action.task.schedule, JSON.stringify([messages.filter(m => m.role === 'user'), context.tasks]));
        }
        if (['propose_task', 'propose_change', 'propose_removal'].includes(action.type) && !out.reply.includes('?')) {
          throw new AssistantError('invalid_output', 'Please confirm the Task.');
        }
        onPartial?.(out.reply);
        return out;
      } catch {
        onPartial?.(FALLBACK.reply);
        return { reply: FALLBACK.reply, action: { type: 'none' } };
      }
    },
    async onboard(form, context) {
      const expected = formTasks(form);
      for (const task of expected) {
        if (!validators.chat({ reply: 'Shall I add this Task?', action: { type: 'propose_task', task } })) {
          throw new AssistantError('invalid_output', 'Please add a complete time and day for each Task.');
        }
      }
      const out = parse(await generateChecked({ system: renderPrompt('onboard', context, { form }),
        messages: [{ role: 'user', text: 'Please prepare the result.' }], schema: schemas.onboard }));
      if (!validators.onboard(out)) throw new AssistantError('invalid_output', 'Please review the details and try again.');
      for (const item of expected) {
        if (!out.tasks.some(t => t.kind === item.kind && t.title === item.title
            && scheduleKey(t.schedule) === scheduleKey(item.schedule)
            && (!('details' in item) || !item.details || t.details === item.details))) {
          throw new AssistantError('invalid_output', 'Please review the proposed Tasks and try again.');
        }
      }
      if ((!form.freeText.trim() && out.tasks.length !== expected.length)
          || (form.preferredName && !out.facts.includes(`Prefers to be called ${form.preferredName}`))) {
        throw new AssistantError('invalid_output', 'Please review the details and try again.');
      }
      for (const task of out.tasks) assertDateSource(task.schedule, JSON.stringify(form));
      return out;
    },
    async reminderTexts(task, context) {
      const out = parse(await generateChecked({ system: renderPrompt('reminders', context, { task }),
        messages: [{ role: 'user', text: 'Please prepare the result.' }], schema: schemas.reminders }));
      const name = knownName(context);
      if (!validators.reminders(out) || new Set(out.map(t => t.trim().toLowerCase())).size !== 3
          || (name && out.some(t => !t.toLowerCase().includes(name.toLowerCase())))) {
        throw new AssistantError('invalid_output', 'Please try the Reminder texts again.');
      }
      return out;
    },
  };
}
