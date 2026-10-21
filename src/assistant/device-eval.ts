/** Opt-in development runner. Person B can call this from a temporary debug control. */
import chatCases from '../../ml/evals/cases.jsonl';
import generationCases from '../../ml/evals/generation.jsonl';
import { liteRTBackend, MODEL } from './litert';
import { renderPrompt, templates } from './prompts';
import { schemas } from './schemas';
import type { AssistantContext, ChatMessage } from './types';
import type { OnboardingForm } from '@/domain/types';
import type { Generate } from './transport';

export interface EvalCase {
  id: string;
  suite?: keyof typeof templates;
  now: string;
  weekday: AssistantContext['weekday'];
  memory?: string[];
  tasks?: AssistantContext['tasks'];
  messages?: (string | ChatMessage)[];
  form?: OnboardingForm;
  task?: unknown;
}
export const evaluationCases: EvalCase[] = `${chatCases}\n${generationCases}`.split('\n').filter(Boolean).map(line => JSON.parse(line));

export async function runRawEvaluation(generate: Generate, onProgress?: (completed: number, total: number) => void) {
  const results = [];
  for (const test of evaluationCases) {
    const suite = test.suite ?? 'chat';
    const context: AssistantContext = {
      now: test.now, weekday: test.weekday, tasks: test.tasks ?? [],
      memory: (test.memory ?? []).map((text, i) => ({ id: `eval-${i}`, text, source: 'Synthetic evaluation', createdAt: test.now })),
    };
    const started = Date.now();
    let firstReplyMs: number | undefined;
    let raw: string | undefined;
    let error: string | undefined;
    try {
      raw = await generate({
        system: renderPrompt(suite, context, { form: test.form, task: test.task }),
        messages: (test.messages ?? ['Please prepare the result.']).map(m => typeof m === 'string' ? { role: 'user' as const, text: m } : m),
        schema: schemas[suite],
        onText(text) { if (text && firstReplyMs === undefined) firstReplyMs = Date.now() - started; },
      });
    } catch (failure) {
      error = failure instanceof Error ? failure.message : String(failure);
    }
    results.push({ id: test.id, raw, error, firstReplyMs, completionMs: Date.now() - started });
    onProgress?.(results.length, evaluationCases.length);
  }
  return results;
}

export async function runDeviceEvaluation(onProgress?: (completed: number, total: number) => void) {
  if (!__DEV__) throw new Error('Evaluation is available only in a development build.');
  const backend = liteRTBackend;
  const started = Date.now();
  await backend.prepare();
  const coldLoadMs = Date.now() - started;
  const results = await runRawEvaluation(backend.generate, onProgress);
  return JSON.stringify({ metadata: { backend: 'litert', model: MODEL, coldLoadMs,
    settings: { temperature: 0, context: 8192, maxOutputTokens: 4096 } }, results }, null, 2);
}
