import { mockAssistant } from './mock';
import { ollamaAssistant } from './ollama';
import type { Assistant } from './types';

/** Chosen by EXPO_PUBLIC_ASSISTANT: "mock" (default) or "ollama". */
export const assistant: Assistant =
  process.env.EXPO_PUBLIC_ASSISTANT === 'ollama' ? ollamaAssistant : mockAssistant;
