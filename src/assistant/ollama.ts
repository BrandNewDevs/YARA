import { fetch } from 'expo/fetch';

import schema from '../../ml/action.schema.json';
import type { MemoryFact } from '@/domain/types';
import { CHAT_PROMPT } from './prompt.generated';
import type {
  Assistant,
  AssistantAction,
  AssistantContext,
  AssistantReply,
  OnboardingResult,
  ProposedTask,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_OLLAMA_URL ?? 'http://localhost:11434';
const MODEL = process.env.EXPO_PUBLIC_OLLAMA_MODEL ?? 'gemma4:e2b';

const FALLBACK: AssistantReply = { reply: 'Sorry, could you say that again?', action: { type: 'none' } };
const TIME = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

const taskSchema = schema.properties.action.properties.task;
const onboardSchema = {
  type: 'object',
  required: ['facts', 'tasks', 'welcome'],
  properties: {
    facts: { type: 'array', items: { type: 'string' }, maxItems: 12 },
    tasks: { type: 'array', items: taskSchema },
    welcome: { type: 'string', maxLength: 300 },
  },
};
const reminderSchema = {
  type: 'object',
  required: ['texts'],
  properties: { texts: { type: 'array', items: { type: 'string', maxLength: 160 }, minItems: 3, maxItems: 3 } },
};

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Streams one schema-constrained completion and returns the full text. */
async function complete(
  messages: OllamaMessage[],
  format: object,
  onContent?: (contentSoFar: string) => void,
): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      format,
      stream: true,
      think: false,
      options: { temperature: 0.3 },
    }),
  });
  if (!response.ok || !response.body) throw new Error(`Ollama ${response.status}: ${await response.text()}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let content = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const chunk = JSON.parse(line);
      if (chunk.error) throw new Error(chunk.error);
      content += chunk.message?.content ?? '';
      onContent?.(content);
    }
  }
  return content;
}

/** Reads the "reply" string out of JSON that is still arriving. */
export function partialReply(json: string): string {
  const start = json.match(/"reply"\s*:\s*"/);
  if (!start) return '';
  let out = '';
  for (let i = start.index! + start[0].length; i < json.length; i++) {
    const c = json[i];
    if (c === '"') break;
    if (c !== '\\') {
      out += c;
      continue;
    }
    const next = json[++i];
    if (next === undefined) break;
    if (next === 'u') {
      const hex = json.slice(i + 1, i + 5);
      if (hex.length < 4) break;
      out += String.fromCharCode(parseInt(hex, 16));
      i += 4;
    } else {
      out += ({ n: '\n', t: '\t' } as Record<string, string>)[next] ?? next;
    }
  }
  return out;
}

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

function isTask(t: any): t is ProposedTask {
  const s = t?.schedule;
  return (
    (t?.kind === 'routine' || t?.kind === 'appointment') &&
    typeof t.title === 'string' &&
    ['once', 'daily', 'weekly'].includes(s?.type) &&
    (s.times === undefined || (isStrings(s.times) && s.times.every((x: string) => TIME.test(x))))
  );
}

/** Checks the model's JSON against the contract; null means invalid. */
export function parseReply(raw: string): AssistantReply | null {
  let out: any;
  try {
    out = JSON.parse(raw);
  } catch {
    return null;
  }
  const a = out?.action;
  if (typeof out?.reply !== 'string' || typeof a?.type !== 'string') return null;
  let action: AssistantAction;
  switch (a.type) {
    case 'none':
    case 'show_help':
      action = { type: a.type };
      break;
    case 'remember':
      if (!isStrings(a.facts)) return null;
      action = { type: 'remember', facts: a.facts };
      break;
    case 'propose_task':
      if (!isTask(a.task)) return null;
      action = { type: 'propose_task', task: a.task };
      break;
    case 'propose_change':
      if (typeof a.taskId !== 'string' || !isTask(a.task)) return null;
      action = { type: 'propose_change', taskId: a.taskId, task: a.task };
      break;
    case 'propose_removal':
      if (typeof a.taskId !== 'string') return null;
      action = { type: 'propose_removal', taskId: a.taskId };
      break;
    default:
      return null;
  }
  return { reply: out.reply, action };
}

function render(template: string, context: AssistantContext) {
  const memory = context.memory.map((f) => `- ${f.text}`).join('\n') || '(nothing yet)';
  const tasks = context.tasks.length ? JSON.stringify(context.tasks) : '(none)';
  return template
    .replace('{{weekday}}', context.weekday)
    .replace('{{now}}', context.now)
    .replace('{{memory}}', memory)
    .replace('{{tasks}}', tasks);
}

const memoryText = (memory: MemoryFact[]) => memory.map((f) => f.text).join('; ') || 'nothing yet';

export const ollamaAssistant: Assistant = {
  async chat(messages, context, onPartial) {
    try {
      const raw = await complete(
        [
          { role: 'system', content: render(CHAT_PROMPT, context) },
          ...messages.map((m) => ({ role: m.role, content: m.text })),
        ],
        schema,
        onPartial && ((content) => onPartial(partialReply(content))),
      );
      return parseReply(raw) ?? FALLBACK;
    } catch (e) {
      console.warn('Ollama chat failed', e);
      return FALLBACK;
    }
  },

  async onboard(form, context): Promise<OnboardingResult> {
    const system =
      'You help set up YARA, a reminder assistant for an elderly person. From the form, write short Memory facts ' +
      '(one plain sentence each), propose a Task for each medicine and appointment, and write a warm welcome of ' +
      'one or two short sentences. Express times as "HH:MM" in 24-hour format and days as weekday names. ' +
      `Use kind "routine" for medicines and "appointment" for visits. Today is ${context.weekday}, ${context.now}. ` +
      'Reply only with JSON matching the schema.';
    const raw = await complete(
      [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(form) },
      ],
      onboardSchema,
    );
    const out = JSON.parse(raw);
    if (!isStrings(out.facts) || !Array.isArray(out.tasks) || !out.tasks.every(isTask)) {
      throw new Error('Onboarding reply did not match the schema');
    }
    return { facts: out.facts, tasks: out.tasks, welcome: String(out.welcome ?? '') };
  },

  async reminderTexts(task, context) {
    const system =
      'Write exactly three differently worded Reminder texts for the Task, each one short sentence under 160 ' +
      `characters, warm and plain. Use the person's preferred name if it is in Memory. Memory: ${memoryText(context.memory)}. ` +
      'Reply only with JSON matching the schema.';
    const raw = await complete(
      [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(task) },
      ],
      reminderSchema,
    );
    const { texts } = JSON.parse(raw);
    if (!isStrings(texts) || texts.length !== 3 || texts.some((t) => !t || t.length >= 160)) {
      throw new Error('Reminder texts did not match the schema');
    }
    return texts;
  },
};
