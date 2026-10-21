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
