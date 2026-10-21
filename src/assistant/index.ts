import { createAssistant } from './assistant';
import { createServerGenerate } from './server';
import { liteRTBackend } from './litert';
import { mockAssistant } from './mock';
import type { Assistant, AssistantPreparation } from './types';

const backend = process.env.EXPO_PUBLIC_ASSISTANT ?? 'mock';
const ready: AssistantPreparation = {
  async prepare() {},
  subscribe(listener) { listener({ state: 'ready' }); return () => {}; },
};
function select(): Assistant {
  switch (backend) {
    case 'mock': return mockAssistant;
    case 'server': return createAssistant(createServerGenerate({
      endpoint: process.env.EXPO_PUBLIC_ASSISTANT_URL,
      model: process.env.EXPO_PUBLIC_ASSISTANT_MODEL,
      think: process.env.EXPO_PUBLIC_ASSISTANT_THINK !== 'false',
    }));
    case 'litert': return createAssistant(liteRTBackend.generate);
    default: throw new Error(`Unknown EXPO_PUBLIC_ASSISTANT: ${backend}`);
  }
}
export const assistant = select();
export const assistantPreparation: AssistantPreparation = backend === 'litert' ? liteRTBackend : ready;
export { AssistantError } from './transport';
