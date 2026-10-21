import type { ChatMessage } from './types';

export interface GenerationRequest {
  system: string;
  messages: ChatMessage[];
  schema: object;
  onText?: (textSoFar: string) => void;
}

/** Raw JSON text; callers validate before exposing actions. */
export type Generate = (request: GenerationRequest) => Promise<string>;

export class AssistantError extends Error {
  readonly code: 'unavailable' | 'invalid_output' | 'input_too_long';
  constructor(code: AssistantError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'AssistantError';
  }
}

/** Display-only history never replays actions; confirmed state comes from context. */
export function formatChatHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(message => message.role === 'assistant'
    ? { ...message, text: JSON.stringify({ reply: message.text, action: { type: 'none' } }) }
    : message);
}
