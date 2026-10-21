import type { AssistantPreparation, AssistantStatus } from './types';
import type { Generate } from './transport';
import { AssistantError } from './transport';

export const MODEL = {
  revision: '41c5569623a7c189d6eec3e5225260c58cedbce7',
  url: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/41c5569623a7c189d6eec3e5225260c58cedbce7/gemma-4-E2B-it.litertlm',
  bytes: 2588147712,
  sha256: '181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c',
};

type Library = typeof import('react-native-litert-lm');
type Engine = Pick<ReturnType<Library['createLLM']>, 'loadModel' | 'isReady' | 'resetConversation' | 'execute'>;
export interface NativeRuntime {
  createLLM: (options?: Parameters<Library['createLLM']>[0]) => Engine;
  ModelRegistry: Pick<Library['ModelRegistry'], 'resolveModel' | 'getFileSizeBytes' | 'deleteFile'>;
}
export function createLiteRTBackend(options: {
  path?: string;
  timeoutMs?: number;
  loadNative?: () => Promise<NativeRuntime>;
} = {}): AssistantPreparation & { generate: Generate } {
  let status: AssistantStatus = { state: 'idle' };
  const listeners = new Set<(status: AssistantStatus) => void>();
  let model: Engine | undefined;
  let preparing: Promise<void> | undefined;
  let queue: Promise<unknown> = Promise.resolve();
  function publish(next: AssistantStatus) {
    status = next;
    for (const listener of listeners) {
      try { listener(next); } catch { /* A screen listener cannot break model preparation. */ }
    }
  }
  const prepare = (): Promise<void> => {
    if (model?.isReady()) return Promise.resolve();
    if (preparing) return preparing;
    preparing = (async () => {
      try {
        const native = await (options.loadNative ?? (() => import('react-native-litert-lm')))();
        const source = options.path || MODEL.url;
        publish({ state: 'downloading', progress: 0 });
        const path = await native.ModelRegistry.resolveModel(source, {
          onProgress: progress => publish({ state: 'downloading', progress: Math.max(0, Math.min(1, progress)) }),
        });
        if (native.ModelRegistry.getFileSizeBytes(path) !== MODEL.bytes) {
          if (!options.path) native.ModelRegistry.deleteFile(source);
          throw new AssistantError('unavailable', 'The model download is incomplete. Please try again.');
        }
        publish({ state: 'loading' });
        model ??= native.createLLM({ enableMemoryTracking: true });
        try {
          await model.loadModel(path, {
            backend: 'cpu', multimodal: false, temperature: 0, maxContextTokens: 8192, maxOutputTokens: 4096,
            enableStructuredOutput: true, thinking: { enabled: true, tokenBudget: 1024 },
          });
        } catch (error) {
          if (!options.path && error instanceof Error && 'code' in error && error.code === 'INVALID_MODEL') {
            native.ModelRegistry.deleteFile(source);
          }
          throw error;
        }
        publish({ state: 'ready' });
      } catch (error) {
        publish({ state: 'error', message: 'The Assistant could not load. Please try again.' });
        throw error;
      }
    })().finally(() => { preparing = undefined; });
    return preparing;
  };
  const generate: Generate = request => {
    const run = async () => {
      await prepare();
      const llm = model!;
      const previous = request.messages.slice(0, -1).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.text }));
      llm.resetConversation(JSON.stringify(previous), request.system);
      let text = '';
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        llm.resetConversation();
      }, options.timeoutMs ?? 120_000);
      try {
        const reply = await llm.execute([{ type: 'text', text: request.messages.at(-1)?.text ?? '' }], token => {
          text += token;
          if (text.length > 32_768) {
            llm.resetConversation();
            return;
          }
          request.onText?.(text);
        }, { responseSchema: JSON.stringify(request.schema), maxOutputTokens: 4096 });
        if (text.length > 32_768 || reply.length > 32_768) throw new AssistantError('invalid_output', 'Please try a shorter request.');
        if (timedOut) throw new AssistantError('unavailable', 'The Assistant took too long. Please try again.');
        return reply;
      } finally {
        clearTimeout(timer);
        llm.resetConversation();
      }
    };
    const pending = queue.then(run);
    queue = pending.catch(() => {});
    return pending;
  };
  return {
    prepare, generate,
    subscribe(listener) { listeners.add(listener); listener(status); return () => { listeners.delete(listener); }; },
  };
}

export const liteRTBackend = createLiteRTBackend({ path: process.env.EXPO_PUBLIC_MODEL_PATH });
