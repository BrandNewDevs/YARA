import type { Assistant, AssistantAction, ProposedTask } from './types';

const EMERGENCY = /chest pain|can'?t breathe|i fell|fallen|bleeding|unconscious|help me/i;

export const mockAssistant: Assistant = {
  async chat(messages, context, onPartial) {
    const last = messages[messages.length - 1]?.text ?? '';
    let reply = "I'm here. How can I help?";
    let action: AssistantAction = { type: 'none' };

    if (EMERGENCY.test(last)) {
      reply = "That sounds serious. Here are the numbers you can call right now.";
      action = { type: 'show_help' };
    } else if (/remind|pill|medicine/i.test(last)) {
      const task: ProposedTask = {
        kind: 'routine',
        title: 'Take your pills',
        schedule: { type: 'daily', times: ['08:00'] },
      };
      reply = 'Shall I remind you to take your pills every day at 8 in the morning?';
      action = { type: 'propose_task', task };
    }
    onPartial?.(reply);
    return { reply, action };
  },

  async onboard(form) {
    return {
      facts: [`Prefers to be called ${form.preferredName}`, `Wakes at ${form.wakeTime}`],
      tasks: form.medicines.map((m) => ({
        kind: 'routine' as const,
        title: `Take ${m.name}`,
        schedule: { type: 'daily' as const, times: m.times },
      })),
      welcome: `Hello ${form.preferredName}, I'm YARA. I'll help you remember things.`,
    };
  },

  async reminderTexts(task, context) {
    const name = context.memory.find((f) => /called/i.test(f.text))?.text.replace(/.*called /i, '') ?? '';
    return [
      `${name ? `${name}, ` : ''}it's time to ${task.title.toLowerCase()}.`,
      `A gentle reminder: ${task.title.toLowerCase()}.`,
      `Just checking in. Please ${task.title.toLowerCase()} when you can.`,
    ];
  },
};
