import type { Generate } from './transport';
import { AssistantError } from './transport';

export function createServerGenerate(options: {
  endpoint?: string;
  model?: string;
  /** Ollama only allows think on models that support it (gemma4 does, gemma3 does not). */
  think?: boolean;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
} = {}): Generate {
  const endpoint = options.endpoint ?? 'http://127.0.0.1:11434';
  return async ({ system, messages, schema, onText }) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 120_000);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const fetcher = options.fetch ?? (await import('expo/fetch')).fetch as typeof globalThis.fetch;
      const response = await fetcher(`${endpoint.replace(/\/$/, '')}/api/chat`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model ?? 'gemma4:e2b', stream: true, think: options.think ?? true, format: schema,
          messages: [{ role: 'system', content: system }, ...messages.map(m => ({ role: m.role, content: m.text }))],
          options: { temperature: 0, num_ctx: 8192, num_predict: 4096 },
        }),
      });
      if (!response.ok || !response.body) throw new AssistantError('unavailable', 'The Assistant cannot connect. Please try again.');
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      let output = '';
      let completed = false;
      const consume = (line: string) => {
        if (!line.trim()) return;
        const chunk = JSON.parse(line);
        if (chunk.error) throw new Error('Model generation failed');
        if (typeof chunk.message?.content === 'string') {
          output += chunk.message.content;
          if (output.length > 32_768) throw new Error('Model output exceeded limit');
          onText?.(output);
        }
        if (chunk.done === true) {
          if (chunk.done_reason === 'length') throw new Error('Model output was truncated');
          completed = true;
        }
      };
      while (!completed) {
        const chunk = await reader.read();
        pending += decoder.decode(chunk.value, { stream: !chunk.done });
        if (pending.length > 65_536) throw new Error('Invalid streaming response');
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';
        for (const line of lines) consume(line);
        if (chunk.done) {
          consume(pending);
          break;
        }
      }
      if (!completed) throw new Error('Incomplete model response');
      return output;
    } finally {
      clearTimeout(timer);
      controller.abort();
      await reader?.cancel().catch(() => {});
    }
  };
}
