import chat from '../../ml/prompt.md';
import onboard from '../../ml/onboard.md';
import reminders from '../../ml/reminder_texts.md';
import type { AssistantContext } from './types';
import type { OnboardingForm } from '@/domain/types';
import { schemas } from './schemas';
import { formTasks } from './onboarding';
import { AssistantError } from './transport';

export const templates = { chat, onboard, reminders };
export function renderPrompt(suite: keyof typeof templates, context: AssistantContext, input: { form?: OnboardingForm; task?: unknown } = {}): string {
  const values: Record<string, string> = {
    now: context.now, weekday: context.weekday,
    memory: JSON.stringify(context.memory.map(f => f.text)), tasks: JSON.stringify(context.tasks),
    form: JSON.stringify(input.form ?? {}), task: JSON.stringify(input.task ?? {}),
    formTasks: JSON.stringify(input.form ? formTasks(input.form) : []),
    preferredName: context.memory.map(f => /^Prefers to be called (.+)$/i.exec(f.text)?.[1]).find(Boolean) ?? '',
  };
  const prompt = templates[suite].replace(/\{\{(\w+)\}\}/g, (_, name: string) => values[name] ?? '') + '\nOutput schema: ' + JSON.stringify(schemas[suite]);
  if (prompt.length > 20_000) throw new AssistantError('input_too_long', 'There is too much information. Please use shorter details.');
  return prompt;
}
